// components/admin-dashboard/types.ts
//
// All shared interfaces used across the admin dashboard, pulled out
// of the original AdminDashboard.tsx.

export interface AdminDashboardProps {
  onLogout: () => void;
  initialTab?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalLeads: number;
  totalAssessments: number;
  conversionRate: string;
  revenue?: { total: number };
  subscriptions?: { active: number; suspended: number; total: number };
  recentLeads: Array<{ id: string; name: string; email: string; status: string }>;
  recentAssessments: Array<{ id: string; createdAt: string; responses: Record<string, unknown> }>;
  userGrowth: Array<{ date: string; count: number }>;
  leadGrowth: Array<{ date: string; count: number }>;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  status: string;
  subject?: string;
  message?: string;
  source?: string;
  sourceDetails?: Record<string, unknown>;
  assignedTo?: { id: string; name: string } | string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
}

export interface Subscription {
  id: string;
  planType: string;
  status: string;
  tier: string;
  reviewRequested?: boolean;
  reviewNotes?: string;
  revisionCount?: number;
  customName?: string;
  siteName?: string;
  createdAt?: string;
  isCurrent?: boolean;
  user?: { name: string; email: string };
  purchasedAddons?: Addon[];
  paymentStatus?: string;
  domain?: string;
}

export interface MediaAsset {
  id: string;
  filename: string;
  url: string;
  mimetype: string;
  size: number;
  userId: string;
  createdAt: string;
}

export interface Recommendation {
  type: 'warning' | 'success' | 'info';
  category: string;
  message: string;
}

export interface AnalyticsData {
  users: { total: number; new: number; active: number; growth?: { date: string; count: number }[] };
  assessments: { total: number; conversionRate: number; trends?: { date: string; count: number }[] };
  leads: { total: number; conversionRate: number; trends?: { date: string; count: number }[] };
  revenue: { total: number; averageOrderValue: number; trends?: { date: string; amount: number }[] };
  content: Record<string, unknown>;
  traffic: Record<string, unknown>;
  predictions: {
    recommendations: Recommendation[];
    growthRate?: { users?: number; revenue?: number };
    nextWeekUsers?: number | string;
    nextWeekRevenue?: number | string;
    nextWeekConversionRate?: number | string;
  };
}

interface EnforcementTier {
  overlayThreshold: number;
  maxGracePeriod: number;
  reminderFrequency: string;
}

export interface EnforcementSettings {
  ai_foundation: EnforcementTier;
  pro_enhancement: EnforcementTier;
  enterprise: EnforcementTier;
  self_hosted: EnforcementTier;
  maintenance: EnforcementTier;
  automationEnabled: boolean;
  autoSuspendEnabled: boolean;
  gracePeriodDays?: number;
  overlayThreshold?: number;
  enforceOverlays?: boolean;
}

export interface SiteVitals {
  performance?: number;
  coreWebVitals?: { fcp?: string; tti?: string; cls?: string; lcp?: string };
}

export interface Assessment {
  id: string;
  name?: string;
  email?: string;
  createdAt: string;
  responses: Record<string, unknown>;
}

export interface StudioTask {
  id: string; title: string; area: string; status: string; owner?: string;
  dueDate?: string; note?: string; order?: number; createdAt?: string;
}

export interface StudioLink {
  id: string; label: string; url?: string; type: string; note?: string; createdAt?: string;
}

export interface StudioBlocker {
  id: string; title: string; area: string; status: string; note?: string; createdAt?: string; resolvedAt?: string;
}

export interface StudioUpdate {
  id: string; message: string; visibility: string; createdBy?: string; createdAt: string;
}

export interface BuildMilestone {
  id: string; title: string; description?: string; status: string; progress: number; order: number; dueDate?: string; clientNote?: string;
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

export interface ProjectRequest {
  id: string;
  assessmentId?: string;
  subscriptionId?: string;
  title: string;
  businessName?: string;
  serviceType: string;
  packageIntent?: string;
  budget?: string;
  timeline?: string;
  summary?: string;
  status: string;
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
  completedAt?: string;
  finalPaymentConfirmedAt?: string;
  buildMilestones?: BuildMilestone[];
  studioTasks?: StudioTask[];
  studioLinks?: StudioLink[];
  studioBlockers?: StudioBlocker[];
  studioUpdates?: StudioUpdate[];
  adminNotes?: string;
  clientNotes?: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string; country?: string; defaultCurrency?: string; accountType?: string; billingRegion?: string };
  assessment?: { id: string; responses?: Record<string, unknown>; results?: Record<string, unknown>; status?: string; createdAt?: string };
}
