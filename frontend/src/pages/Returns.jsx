import LegalPage from "../components/LegalPage";

export default function Returns() {
  return (
    <LegalPage
      title="Returns & Refunds"
      updated="September 2026"
      intro="We want you to be happy with what you order. Here's how returns and refunds work across Azard Stores."
      sections={[
        {
          heading: "Return window",
          body: "Most items can be returned within 7 days of delivery, provided they're unused, in their original packaging, and in resellable condition. Some shops may set a different window for specific products — this will be noted on the product page.",
        },
        {
          heading: "Items that can't be returned",
          body: [
            "Perishable goods and items marked as final sale",
            "Products that have been used, worn, or altered",
            "Items missing original tags, packaging, or accessories",
            "Digital products and gift cards",
          ],
        },
        {
          heading: "How to start a return",
          body: [
            "Go to My Orders in your dashboard to find the order and item you want to return",
            "Contact us via the Contact page (or WhatsApp) with your order reference and the reason for the return",
            "We'll confirm eligibility with the shop and send you pickup or drop-off instructions",
          ],
        },
        {
          heading: "Refunds",
          body: "Once a returned item is received and inspected, refunds are processed back to your original payment method. This typically takes 5–10 business days depending on your bank or payment provider.",
        },
        {
          heading: "Damaged or incorrect items",
          body: "If something arrives damaged or isn't what you ordered, contact us within 48 hours of delivery with photos of the item. We'll arrange a replacement or refund at no extra cost to you.",
        },
        {
          heading: "Need help?",
          body: "If a return doesn't fit neatly into the above, reach out via the Contact page and we'll sort it out directly.",
        },
      ]}
    />
  );
}
