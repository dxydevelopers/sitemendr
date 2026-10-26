const PDFDocument = require('pdfkit');
const { prisma } = require('../config/db');
const logger = require('../config/logger');

const money = (minor, currency) => `${String(currency || 'USD').toUpperCase()} ${(Number(minor || 0) / 100).toFixed(2)}`;
const safeName = value => String(value || 'sitemendr-document').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'sitemendr-document';

const streamDocument = (res, { number, kind, draw }) => {
  const filename = `${safeName(number)}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  const pdf = new PDFDocument({ size: 'A4', margin: 54, info: { Title: `${kind} ${number}`, Author: 'Sitemendr' } });
  pdf.on('error', error => {
    logger.error('BILLING_PDF_STREAM_ERROR', { kind, number, error: error.message });
    if (!res.headersSent) res.status(500).end();
    else res.destroy(error);
  });
  pdf.pipe(res);
  draw(pdf);
  pdf.end();
};

const addHeader = (pdf, eyebrow, number, date) => {
  pdf.fillColor('#15263a').font('Helvetica-Bold').fontSize(23).text('Sitemendr');
  pdf.moveDown(0.25).fillColor('#64748b').font('Helvetica').fontSize(9).text('Client workspace billing');
  pdf.moveDown(2).fillColor('#2563eb').font('Helvetica-Bold').fontSize(10).text(eyebrow.toUpperCase(), { characterSpacing: 1 });
  pdf.moveDown(0.35).fillColor('#111827').fontSize(20).text(number);
  pdf.moveDown(0.35).fillColor('#64748b').font('Helvetica').fontSize(9).text(date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '');
  pdf.moveDown(1.1).strokeColor('#dbe2ea').moveTo(54, pdf.y).lineTo(541, pdf.y).stroke();
  pdf.moveDown(1.2);
};

const addField = (pdf, label, value, valueColor = '#111827') => {
  pdf.fillColor('#64748b').font('Helvetica-Bold').fontSize(8).text(label.toUpperCase(), { characterSpacing: 0.5 });
  pdf.moveDown(0.3).fillColor(valueColor).font('Helvetica').fontSize(10).text(String(value || '—'), { width: 475 });
  pdf.moveDown(1.15);
};

const addAmount = (pdf, description, amountMinor, currency, statusLabel) => {
  const y = pdf.y;
  pdf.roundedRect(54, y, 487, 76, 8).lineWidth(1).strokeColor('#dbe2ea').stroke();
  pdf.fillColor('#64748b').font('Helvetica-Bold').fontSize(8).text('DESCRIPTION', 70, y + 15, { characterSpacing: 0.5 });
  pdf.fillColor('#111827').font('Helvetica').fontSize(10).text(description || 'Sitemendr service', 70, y + 32, { width: 285 });
  pdf.fillColor('#64748b').font('Helvetica-Bold').fontSize(8).text('AMOUNT', 380, y + 15, { characterSpacing: 0.5 });
  pdf.fillColor('#111827').font('Helvetica-Bold').fontSize(12).text(money(amountMinor, currency), 380, y + 32, { width: 145 });
  pdf.y = y + 94;
  if (statusLabel) {
    pdf.fillColor('#64748b').font('Helvetica-Bold').fontSize(8).text('STATUS', 54, pdf.y);
    pdf.fillColor('#1d4ed8').font('Helvetica-Bold').fontSize(9).text(statusLabel.replace(/_/g, ' ').toUpperCase(), 110, pdf.y - 1);
    pdf.y += 24;
  }
};

exports.invoicePdf = async (req, res) => {
  try {
    const invoice = await prisma.billingInvoice.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
      include: { user: { select: { name: true, email: true } } }
    });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
    streamDocument(res, {
      number: invoice.invoiceNumber,
      kind: 'Invoice',
      draw: pdf => {
        addHeader(pdf, 'Invoice', invoice.invoiceNumber, invoice.issuedAt);
        addField(pdf, 'Issued to', invoice.user?.name || 'Sitemendr client');
        addField(pdf, 'Account email', invoice.user?.email);
        if (invoice.snapshot?.projectName) addField(pdf, 'Project', invoice.snapshot.projectName);
        addAmount(pdf, invoice.description, invoice.amountMinor, invoice.currency, invoice.status);
        addField(pdf, invoice.status === 'paid' ? 'Paid on' : 'Due date', invoice.status === 'paid' ? invoice.paidAt?.toISOString?.().slice(0, 10) : invoice.dueAt?.toISOString?.().slice(0, 10) || 'Due upon request');
        addField(pdf, 'Payment stage', invoice.stage);
        if (invoice.snapshot?.agreedTotal != null) addField(pdf, 'Agreed project total', money(Number(invoice.snapshot.agreedTotal) * 100, invoice.currency));
        if (invoice.snapshot?.deposit != null) addField(pdf, 'Deposit on agreement', money(Number(invoice.snapshot.deposit) * 100, invoice.currency));
        const invoiceNote = invoice.status === 'paid'
          ? 'This invoice is paid. Your payment confirmation is available in the Receipts section of your Sitemendr billing.'
          : 'Please complete payment through the secure Sitemendr workspace. A receipt is issued after payment verification.';
        pdf.moveDown(2).fillColor('#64748b').font('Helvetica').fontSize(8).text(invoiceNote, { width: 480, lineGap: 3 });
      }
    });
  } catch (error) {
    logger.error('CLIENT_INVOICE_PDF_ERROR', { invoiceId: req.params.id, error: error.message });
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Could not prepare this invoice.' });
  }
};

exports.receiptPdf = async (req, res) => {
  try {
    const receipt = await prisma.billingReceipt.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
      include: { user: { select: { name: true, email: true } }, payment: { select: { reference: true, description: true, paymentMethod: true, serviceType: true, status: true } } }
    });
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found.' });
    streamDocument(res, {
      number: receipt.receiptNumber,
      kind: 'Receipt',
      draw: pdf => {
        addHeader(pdf, 'Payment receipt', receipt.receiptNumber, receipt.issuedAt);
        addField(pdf, 'Issued to', receipt.user?.name || 'Sitemendr client');
        addField(pdf, 'Account email', receipt.user?.email);
        addAmount(pdf, receipt.payment?.description || 'Sitemendr payment', receipt.amountMinor, receipt.currency, 'Verified and completed');
        addField(pdf, 'Payment reference', receipt.payment?.reference || receipt.snapshot?.reference);
        addField(pdf, 'Payment method', receipt.payment?.paymentMethod || 'Online payment');
        addField(pdf, 'Service', receipt.payment?.serviceType || receipt.snapshot?.serviceType);
        pdf.moveDown(2).fillColor('#64748b').font('Helvetica').fontSize(8).text('This document confirms that Sitemendr verified the payment above. Keep the receipt number and payment reference for your records.', { width: 480, lineGap: 3 });
      }
    });
  } catch (error) {
    logger.error('CLIENT_RECEIPT_PDF_ERROR', { receiptId: req.params.id, error: error.message });
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Could not prepare this receipt.' });
  }
};
