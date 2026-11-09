// components/client-dashboard/types.ts
//
// All shared interfaces used across the client dashboard.
// Pulled out of the original ClientDashboard.tsx so every split
// file can import the same shapes instead of redefining them.

export interface ClientStats {
  activeNodes: number;
  uptime: number | null;
  securityLevel: string | null;
  latency: number | null;
  availabilityStatus?: 'UP' | 'DOWN' | null;
  lastChecked?: string | null;
  metricsAvailable?: boolean;
}

export interface BuildMilestone {
  id: string;
  title: string;
  description?: string;
  status: string;
  progress: number;
  order: number;
  dueDate?: string;
  clientNote?: string;
}

export interface StudioLink {
  id: string;
  label: string;
  url?: string;
  type: string;
  note?: string;
  createdAt?: string;
}

export interface StudioUpdate {
  id: string;
  message: string;
  visibility: string;
  createdAt?: string;
}

export interface ReviewChatMessage {
  id: string;
  projectRequestId: string;
  senderRole: 'admin' | 'client' | 'system' | string;
  message: string;
  kind?: 'message' | 'question' | 'choice_response' | 'file' | string;
  choices?: string[] | null;
  selectedChoice?: string | null;
  attachments?: Array<{ label?: string; url?: string }> | null;
  eventData?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ProjectQuoteVersion {
  id: string;
  version: number;
  status: string;
  snapshot: {
    projectTitle?: string;
    scope?: string;
    amount?: number;
    currency?: string;
    timeline?: string | null;
    totalAgreedAmount?: number;
    depositAmount?: number | null;
    paymentSchedule?: string | null;
    cancellationTerms?: string;
    milestoneAmounts?: Array<{ name: string; amount: number }>;
    nonRecoverableCosts?: Array<{ name: string; amount: number; reason: string }>;
  };
  acceptedAt?: string | null;
  createdAt: string;
}

export interface ClientProject {
  id: string;
  recordType?: 'request' | 'project';
  canManageSite?: boolean;
  assessmentId?: string;
  subscriptionId?: string;
  serviceType?: string;
  name: string;
  businessName?: string;
  status: string;
  progress: number;
  planType?: string;
  budget?: string;
  timeline?: string;
  summary?: string;
  priority?: string;
  quotedAmount?: number;
  quoteCurrency?: string;
  paymentAgreementType?: string;
  paymentAgreementStatus?: string;
  depositAmount?: number;
  totalAgreedAmount?: number;
  paymentDueDate?: string;
  paymentInstructions?: string;
  paymentConfirmedAt?: string;
  productionMode?: string;
  productionSourceNote?: string;
  stagingUrl?: string;
  stagingNotes?: string;
  stagingReviewStatus?: string;
  stagingReviewedAt?: string;
  launchUrl?: string;
  launchNotes?: string;
  launchApprovedAt?: string;
  handoffNotes?: string;
  completionNotes?: string;
  completionAcknowledgedAt?: string;
  handoffIssuesReportedAt?: string;
  completedAt?: string;
  finalPaymentConfirmedAt?: string;
  quoteVersions?: ProjectQuoteVersion[];
  buildMilestones?: BuildMilestone[];
  studioLinks?: StudioLink[];
  studioUpdates?: StudioUpdate[];
  clientNotes?: string;
  siteUrl?: string;
  domain?: string;
  reviewRequested?: boolean;
  reviewNotes?: string;
  revisionCount?: number;
  purchasedAddons?: unknown[] | string;
  isCurrent?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientActivity {
  type: 'payment' | 'file';
  title: string;
  time: string;
  desc: string;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  isEmailVerified?: boolean;
  phoneVerified?: boolean;
  country?: string;
  defaultCurrency?: string;
  accountType?: string;
  billingRegion?: string;
  entityName?: string;
  entityContactEmail?: string;
  entityPhone?: string;
  pendingEmail?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingPostalCode?: string;
  billingCountry?: string;
}

export interface BillingItem {
  id: string;
  amount: number;
  currency?: string;
  status: string;
  description: string;
  createdAt: string;
  reference: string;
  paymentMethod?: string;
  serviceType?: string;
  preferredCurrency?: string;
  convertedAmount?: number | null;
  channel?: string;
  cardType?: string | null;
  last4?: string | null;
  bank?: string | null;
  metadata?: { projectRequestId?: string; projectName?: string; subscriptionId?: string; addonId?: string } | Record<string, unknown> | null;
}

export interface BillingInvoiceItem {
  id: string;
  invoiceNumber: string;
  stage: string;
  serviceType: string;
  description: string;
  amountMinor: number;
  currency: string;
  status: string;
  issuedAt: string;
  dueAt?: string | null;
  paidAt?: string | null;
  projectRequestId?: string | null;
  snapshot?: Record<string, unknown> & { billingIdentity?: BillingIdentitySnapshot | null; siteId?: string | null } | null;
  user?: { name?: string; email?: string };
}

export interface BillingIdentitySnapshot {
  name?: string | null;
  email?: string | null;
  accountType?: string | null;
  billedTo?: string | null;
  entityName?: string | null;
  contactEmail?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

export interface BillingReceiptItem {
  id: string;
  receiptNumber: string;
  paymentId: string;
  invoiceId?: string | null;
  amountMinor: number;
  currency: string;
  issuedAt: string;
  snapshot?: { reference?: string; description?: string; serviceType?: string; paidAt?: string; billingIdentity?: BillingIdentitySnapshot | null } | null;
  user?: { name?: string; email?: string };
}

export interface BillingRefundItem {
  id: string;
  refundNumber: string;
  projectRequestId?: string | null;
  siteId?: string | null;
  amountMinor: number;
  processedAmountMinor?: number;
  currency: string;
  status: string;
  externalReference?: string | null;
  externalReferences?: string[] | null;
  processedAt?: string | null;
  sourcePaymentReferences?: string[] | null;
}

export interface MessageItem {
  id: string;
  subject: string;
  content: string;
  createdAt: string;
  sender?: string;
  isRead?: boolean;
  threadId?: string | null;
  replies?: MessageItem[];
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
  messages?: Array<{ id: string; content: string; isAdmin: boolean; isRead: boolean; createdAt: string }>;
}

export interface ResourceItem {
  id: string;
  title: string;
  type: string;
  url?: string | null;
  description?: string;
  content?: string | null;
}

export interface CustomDomain {
  id: string;
  siteId?: string;
  domain: string;
  setup: string;
  status?: string;
  sslEnabled?: boolean;
  sslExpiresAt?: string | null;
  subscription?: {
    siteName: string;
    customName: string;
  };
}

export interface DomainDnsTargets {
  a: string;
}

export type ApiRecord = Record<string, unknown>;

export type ClientAssessment = ApiRecord & {
  id: string;
  createdAt: string;
  source?: string;
  responses: Record<string, unknown>;
};

export interface AnalysisResult {
  insights: string;
  strategy?: 'mobile' | 'desktop';
  timestamp?: string;
  availability?: {
    status: 'UP' | 'DOWN' | null;
    latency: number | null;
    statusCode: number | null;
    lastChecked: string | null;
    error: string | null;
  };
  metrics?: {
    latency?: number;
    performanceScore?: number;
    score?: number;
    vitals?: {
      fcp?: string;
      inp?: string | null;
      tbt?: string | null;
      tti?: string;
      cls?: string;
      lcp?: string;
    };
  };
  aiInsights?: Record<string, unknown>;
}

export type DashboardNavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  children?: Array<{
    id: string;
    label: string;
    count?: number;
  }>;
};

declare global {
  interface Window {
    PaystackPop?: (new () => {
      resumeTransaction: (accessCode: string, callbacks?: {
        onSuccess?: (transaction: { reference?: string; trxref?: string }) => void;
        onCancel?: () => void;
        onError?: (error: { message?: string }) => void;
      }) => void;
      newTransaction: (options: {
        key: string;
        email?: string;
        amount?: number;
        currency?: string;
        ref?: string;
        channels?: string[];
        metadata?: Record<string, unknown>;
        onSuccess: (transaction: { reference?: string; trxref?: string }) => void;
        onCancel: () => void;
        onError: (error: { message?: string }) => void;
      }) => void;
    });
  }
}
