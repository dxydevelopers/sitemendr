// components/client-dashboard/utils.ts
//
// Pure helper functions + static constants pulled out of the
// original ClientDashboard.tsx. Nothing here holds state -
// safe to import from the hook, the shell, or any tab file.

import type { SupporterTier } from '@/lib/api';
import type { ApiRecord, ClientProject, BuildMilestone, StudioLink, StudioUpdate } from './ClientDashboard_types';

export const normalizeDashboardTab = (tab?: string | null) => {
  const groupOnlyTabs: Record<string, string> = {
    workspaces: 'dashboard',
    support: 'messages',
    account: 'settings',
  };

  return tab ? groupOnlyTabs[tab] || tab : 'dashboard';
};

export const lockedClientTabs: Record<string, { label: string; area: string }> = {
  audit: { label: 'Repair and performance', area: 'workspace' },
  business: { label: 'Merchant tools', area: 'workspace' },
  ecommerce: { label: 'Commerce', area: 'merchant' },
  booking: { label: 'Bookings', area: 'merchant' },
  editor: { label: 'Editor', area: 'project' },
  domains: { label: 'Domains', area: 'project' },
  addons: { label: 'Add-ons', area: 'billing' },
  resources: { label: 'Resources', area: 'support' },
  supporter: { label: 'Community', area: 'account' },
};

export const formatCurrencyAmount = (currency: string, amount?: number | null, fallback = 'Pending') => {
  if (!amount) return fallback;
  return `${currency} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount)}`;
};

export const getPaystackChannelsForCurrency = (currency?: string) => {
  const normalized = (currency || 'USD').toUpperCase();
  if (normalized === 'NGN') return ['card', 'bank_transfer', 'bank', 'ussd', 'qr'];
  if (normalized === 'GHS' || normalized === 'KES') return ['card', 'mobile_money'];
  if (normalized === 'ZAR') return ['card', 'eft'];
  return ['card'];
};

export const loadPaystackInline = () => new Promise<void>((resolve, reject) => {
  if (typeof window === 'undefined') {
    reject(new Error('Payment checkout is only available in the browser.'));
    return;
  }

  if (window.PaystackPop) {
    resolve();
    return;
  }

  const existingScript = document.querySelector<HTMLScriptElement>('script[data-paystack-inline="true"]');
  if (existingScript) {
    existingScript.addEventListener('load', () => resolve(), { once: true });
    existingScript.addEventListener('error', () => reject(new Error('Paystack checkout could not be loaded.')), { once: true });
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://js.paystack.co/v2/inline.js';
  script.async = true;
  script.dataset.paystackInline = 'true';
  script.onload = () => resolve();
  script.onerror = () => reject(new Error('Paystack checkout could not be loaded.'));
  document.body.appendChild(script);
});

export const mapApiProjectToClientProject = (p: ApiRecord): ClientProject => ({
  id: String(p.id || ''),
  recordType: p.recordType === 'request' || p.recordType === 'project' ? p.recordType : undefined,
  assessmentId: typeof p.assessmentId === 'string' ? p.assessmentId : undefined,
  subscriptionId: typeof p.subscriptionId === 'string' ? p.subscriptionId : undefined,
  name: String(p.name || p.title || p.siteName || p.customName || 'Untitled Project'),
  status: String(p.status || (p.suspended === false ? 'active' : 'suspended')).toLowerCase(),
  progress: typeof p.progress === 'number' ? p.progress : 0,
  planType: typeof p.planType === 'string' ? p.planType : typeof p.packageIntent === 'string' ? p.packageIntent : undefined,
  budget: typeof p.budget === 'string' ? p.budget : undefined,
  timeline: typeof p.timeline === 'string' ? p.timeline : undefined,
  summary: typeof p.summary === 'string' ? p.summary : undefined,
  priority: typeof p.priority === 'string' ? p.priority : undefined,
  quotedAmount: typeof p.quotedAmount === 'number' ? p.quotedAmount : undefined,
  quoteCurrency: typeof p.quoteCurrency === 'string' ? p.quoteCurrency : undefined,
  paymentAgreementType: typeof p.paymentAgreementType === 'string' ? p.paymentAgreementType : undefined,
  paymentAgreementStatus: typeof p.paymentAgreementStatus === 'string' ? p.paymentAgreementStatus : undefined,
  depositAmount: typeof p.depositAmount === 'number' ? p.depositAmount : undefined,
  totalAgreedAmount: typeof p.totalAgreedAmount === 'number' ? p.totalAgreedAmount : undefined,
  paymentDueDate: typeof p.paymentDueDate === 'string' ? p.paymentDueDate : undefined,
  paymentInstructions: typeof p.paymentInstructions === 'string' ? p.paymentInstructions : undefined,
  paymentConfirmedAt: typeof p.paymentConfirmedAt === 'string' ? p.paymentConfirmedAt : undefined,
  productionMode: typeof p.productionMode === 'string' ? p.productionMode : undefined,
  productionSourceNote: typeof p.productionSourceNote === 'string' ? p.productionSourceNote : undefined,
  stagingUrl: typeof p.stagingUrl === 'string' ? p.stagingUrl : undefined,
  stagingNotes: typeof p.stagingNotes === 'string' ? p.stagingNotes : undefined,
  stagingReviewStatus: typeof p.stagingReviewStatus === 'string' ? p.stagingReviewStatus : undefined,
  stagingReviewedAt: typeof p.stagingReviewedAt === 'string' ? p.stagingReviewedAt : undefined,
  launchUrl: typeof p.launchUrl === 'string' ? p.launchUrl : undefined,
  launchNotes: typeof p.launchNotes === 'string' ? p.launchNotes : undefined,
  launchApprovedAt: typeof p.launchApprovedAt === 'string' ? p.launchApprovedAt : undefined,
  handoffNotes: typeof p.handoffNotes === 'string' ? p.handoffNotes : undefined,
  completionNotes: typeof p.completionNotes === 'string' ? p.completionNotes : undefined,
  completionAcknowledgedAt: typeof p.completionAcknowledgedAt === 'string' ? p.completionAcknowledgedAt : undefined,
  completedAt: typeof p.completedAt === 'string' ? p.completedAt : undefined,
  buildMilestones: Array.isArray(p.buildMilestones) ? p.buildMilestones as BuildMilestone[] : [],
  studioLinks: Array.isArray(p.studioLinks) ? p.studioLinks as StudioLink[] : [],
  studioUpdates: Array.isArray(p.studioUpdates) ? p.studioUpdates as StudioUpdate[] : [],
  clientNotes: typeof p.clientNotes === 'string' ? p.clientNotes : undefined,
  siteUrl: typeof p.siteUrl === 'string' ? p.siteUrl : undefined,
  domain: typeof p.domain === 'string' ? p.domain : undefined,
  reviewRequested: typeof p.reviewRequested === 'boolean' ? p.reviewRequested : undefined,
  reviewNotes: typeof p.reviewNotes === 'string' ? p.reviewNotes : undefined,
  revisionCount: typeof p.revisionCount === 'number' ? p.revisionCount : undefined,
  purchasedAddons: Array.isArray(p.purchasedAddons) || typeof p.purchasedAddons === 'string' ? p.purchasedAddons : undefined,
  isCurrent: typeof p.isCurrent === 'boolean' ? p.isCurrent : undefined,
  createdAt: typeof p.createdAt === 'string' ? p.createdAt : undefined,
  updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : undefined,
});

export const isApiRecord = (value: unknown): value is ApiRecord => Boolean(value && typeof value === 'object');

export const readApiArray = <T,>(response: unknown, keys: string[]): T[] => {
  if (!isApiRecord(response)) return [];
  for (const key of keys) {
    const value = response[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
};

// --- Build lifecycle constants (used only by ClientBuildJourney.tsx) ---

export const buildLifecycle = [
  { status: 'submitted', label: 'Submitted', detail: 'Request received' },
  { status: 'in_review', label: 'Review', detail: 'Team is scoping' },
  { status: 'quote_ready', label: 'Quote', detail: 'Scope and quote ready' },
  { status: 'approved', label: 'Approved', detail: 'Build confirmed' },
  { status: 'payment_agreement', label: 'Agreement', detail: 'Payment terms' },
  { status: 'in_development', label: 'Development', detail: 'Work in progress' },
  { status: 'staging_review', label: 'Review', detail: 'Preview approval' },
  { status: 'launched', label: 'Launched', detail: 'Live release' },
  { status: 'handoff', label: 'Handoff', detail: 'Ownership transfer' },
  { status: 'completed', label: 'Complete', detail: 'Build closed' },
];

export const buildJourneyChapters = [
  { id: 'brief', label: 'Brief', eyebrow: 'Intake', detail: 'Request, goals, scope inputs', statuses: ['submitted', 'in_review'] },
  { id: 'scope', label: 'Scope', eyebrow: 'Quote', detail: 'Quote response and scope decision', statuses: ['quote_ready', 'approved'] },
  { id: 'agreement', label: 'Agreement', eyebrow: 'Payment', detail: 'Payment gate before production', statuses: ['payment_agreement'] },
  { id: 'build', label: 'Build', eyebrow: 'Delivery', detail: 'Your project is in production', statuses: ['in_development'] },
  { id: 'review', label: 'Review', eyebrow: 'Preview', detail: 'Approve the preview or request changes', statuses: ['staging_review'] },
  { id: 'launch', label: 'Launch', eyebrow: 'Handoff', detail: 'Live link, access, completion', statuses: ['launched', 'handoff', 'completed'] },
];

export const statusAlias: Record<string, string> = {
  quoted: 'quote_ready',
  awaiting_payment: 'approved',
  payment_pending: 'payment_agreement',
  active: 'in_development',
  operational: 'launched',
};

export const normalizeBuildStatus = (status?: string) => statusAlias[status || ''] || status || 'submitted';

export const requestStatuses = [
  ...buildLifecycle.map(step => step.status),
  'quoted',
  'awaiting_payment',
  'rejected',
  'cancelled',
  'archived',
];

export const agreementPaymentMethods = [
  { id: 'card', label: 'Visa / Mastercard', detail: 'Cards', icon: '/payment-icons/visa-mastercard.svg', gateway: 'paystack', channels: ['card'] },
  { id: 'apple_pay', label: 'Apple Pay', detail: 'Wallet', icon: '/payment-icons/apple-pay.svg', gateway: 'paystack', channels: [] as string[] },
  { id: 'google_pay', label: 'Google Pay', detail: 'Wallet', icon: '/payment-icons/google-pay.svg', gateway: 'external', channels: [] as string[] },
  { id: 'mobile_money', label: 'Mobile money', detail: 'Network', icon: '/payment-icons/mobile-money.svg', gateway: 'paystack', channels: ['mobile_money'] },
  { id: 'paypal', label: 'PayPal', detail: 'Wallet', icon: '/payment-icons/paypal.svg', gateway: 'external', channels: [] as string[] },
  { id: 'bank_transfer', label: 'Bank transfer', detail: 'Bank', icon: '/payment-icons/bank-transfer.svg', gateway: 'paystack', channels: ['bank_transfer', 'bank'] },
  { id: 'ussd_qr', label: 'USSD / QR', detail: 'Code', icon: '/payment-icons/ussd-qr.svg', gateway: 'paystack', channels: ['ussd', 'qr'] },
];

export const mockTiers: SupporterTier[] = [
  { id: 'starter-id', name: 'Starter Member', slug: 'starter', monthlyPrice: 5, discountPercent: 5, displayOrder: 1, isActive: true, perks: ['member-badge', 'community-updates', 'community-access'] },
  { id: 'standard-id', name: 'Standard Member', slug: 'standard', monthlyPrice: 15, discountPercent: 10, displayOrder: 2, isActive: true, perks: ['early-access', 'voting-rights', 'starter-perks'] },
  { id: 'plus-id', name: 'Plus Member', slug: 'plus', monthlyPrice: 30, discountPercent: 15, displayOrder: 3, isActive: true, perks: ['roundtable-invites', 'product-council', 'standard-perks'] },
  { id: 'premium-id', name: 'Premium Member', slug: 'premium', monthlyPrice: 60, discountPercent: 20, displayOrder: 4, isActive: true, perks: ['ama-access', 'spotlight-status', 'plus-perks'] },
  { id: 'founders-id', name: 'Founders Circle', slug: 'founders-circle', monthlyPrice: 100, discountPercent: 25, displayOrder: 5, isActive: true, perks: ['private-sessions', 'vip-support', 'premium-perks'] },
];
