// components/client-dashboard/types.ts
//
// All shared interfaces used across the client dashboard.
// Pulled out of the original ClientDashboard.tsx so every split
// file can import the same shapes instead of redefining them.

export interface ClientStats {
  activeNodes: number;
  uptime: number;
  securityLevel: string;
  latency: number;
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
  createdAt: string;
}

export interface ClientProject {
  id: string;
  recordType?: 'request' | 'project';
  assessmentId?: string;
  subscriptionId?: string;
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
  buildMilestones?: BuildMilestone[];
  studioLinks?: StudioLink[];
  studioUpdates?: StudioUpdate[];
  clientNotes?: string;
  siteUrl?: string;
  domain?: string;
  reviewRequested?: boolean;
  reviewNotes?: string;
  revisionCount?: number;
  purchasedAddons?: string[] | string;
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
}

export interface BillingItem {
  id: string;
  amount: number;
  currency?: string;
  status: string;
  description: string;
  createdAt: string;
  reference: string;
  serviceType?: string;
  preferredCurrency?: string;
  convertedAmount?: number | null;
  channel?: string;
  cardType?: string | null;
  last4?: string | null;
  bank?: string | null;
  metadata?: { projectRequestId?: string } | Record<string, unknown> | null;
}

export interface MessageItem {
  id: string;
  subject: string;
  content: string;
  createdAt: string;
  sender?: string;
  isRead?: boolean;
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  type: string;
  url: string;
  description?: string;
}

export interface CustomDomain {
  id: string;
  domain: string;
  setup: string;
  status?: string;
  subscription?: {
    siteName: string;
    customName: string;
  };
}

export type ApiRecord = Record<string, unknown>;

export type ClientAssessment = ApiRecord & {
  id: string;
  createdAt: string;
  source?: string;
  responses: Record<string, unknown>;
};

export interface BookingItem {
  id?: string;
  status?: string;
  createdAt?: string;
}

export interface AnalysisResult {
  insights: string;
  metrics?: {
    latency?: number;
    performanceScore?: number;
    score?: number;
    vitals?: {
      fcp?: string;
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