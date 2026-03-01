// =============================================================================
// API Response Types
// =============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

// =============================================================================
// User Types
// =============================================================================

/**
 * User role
 */
export type UserRole = 'user' | 'admin' | 'manager';

/**
 * User entity
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Auth login request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Auth login response
 */
export interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Auth register request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

// =============================================================================
// Subscription Types
// =============================================================================

/**
 * Subscription plan
 */
export type SubscriptionPlan = 'ai_foundation' | 'pro_enhancement' | 'enterprise' | 'maintenance' | 'self_hosted';

/**
 * Subscription status
 */
export type SubscriptionStatus = 'active' | 'suspended' | 'cancelled' | 'pending';

/**
 * Subscription entity
 */
export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  amount?: number;
  currency?: string;
  template?: SiteTemplate;
  site?: DeployedSite;
}

/**
 * Site template
 */
export interface SiteTemplate {
  id: string;
  name: string;
  html: string;
  css?: string;
  js?: string;
  thumbnail?: string;
}

/**
 * Deployed site
 */
export interface DeployedSite {
  id: string;
  url: string;
  customDomain?: string;
  sslEnabled: boolean;
  deployedAt: string;
}

// =============================================================================
// Assessment Types
// =============================================================================

/**
 * Assessment status
 */
export type AssessmentStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Assessment entity
 */
export interface Assessment {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  targetAudience?: string;
  keyFeatures?: string[];
  status: AssessmentStatus;
  result?: AssessmentResult;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Assessment result
 */
export interface AssessmentResult {
  suggestedTemplate?: string;
  recommendedFeatures?: string[];
  estimatedPrice?: number;
  deliveryTime?: string;
  html?: string;
  css?: string;
  js?: string;
}

/**
 * Assessment submission request
 */
export interface AssessmentSubmission {
  businessName: string;
  businessType: string;
  targetAudience?: string;
  keyFeatures?: string[];
  colorScheme?: string;
  style?: string;
}

// =============================================================================
// Lead Types
// =============================================================================

/**
 * Lead status
 */
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

/**
 * Lead source
 */
export type LeadSource = 'website' | 'referral' | 'social' | 'advertisement' | 'other';

/**
 * Lead entity
 */
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: LeadSource;
  status: LeadStatus;
  notes?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt?: string;
}

// =============================================================================
// Support Types
// =============================================================================

/**
 * Support ticket status
 */
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

/**
 * Support ticket priority
 */
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Support ticket entity
 */
export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo?: User;
  messages?: TicketMessage[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * Support ticket message
 */
export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
}

// =============================================================================
// Blog Types
// =============================================================================

/**
 * Blog post entity
 */
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  author: User;
  tags?: string[];
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Blog comment
 */
export interface BlogComment {
  id: string;
  postId: string;
  userId: string;
  user?: User;
  content: string;
  approved: boolean;
  createdAt: string;
}

// =============================================================================
// Payment Types
// =============================================================================

/**
 * Payment status
 */
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

/**
 * Payment entity
 */
export interface Payment {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  reference: string;
  paidAt?: string;
  createdAt: string;
}

/**
 * Plan information
 */
export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
}

// =============================================================================
// Analytics Types
// =============================================================================

/**
 * Analytics data
 */
export interface Analytics {
  totalUsers: number;
  totalSubscriptions: number;
  totalRevenue: number;
  activeSubscriptions: number;
  newLeadsThisMonth: number;
  conversionRate: number;
  topPlans: Array<{ plan: string; count: number }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
}

// =============================================================================
// Form Types
// =============================================================================

/**
 * Contact form data
 */
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
}

/**
 * Newsletter subscription
 */
export interface NewsletterSubscription {
  email: string;
}
