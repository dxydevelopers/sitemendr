// components/admin-dashboard/utils.ts
//
// Pure helpers + static constants - no state, safe to import anywhere.

import {
  Layout, FileText, Eye, Activity, Clock, Users, BarChart3, CreditCard,
  Settings, MessageSquare, Folder, PenLine, Briefcase,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { ProjectRequest } from './AdminDashboard_types';

export const formatCurrencyAmount = (currency: string, amount?: number | null, fallback = 'Not set') => {
  if (!amount) return fallback;
  return `${currency} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount)}`;
};

// --- Build pipeline stage definitions (mirrors client-dashboard/utils.ts buildJourneyChapters) ---

export const adminBuildChapters = [
  { id: 'brief', label: 'Brief', eyebrow: 'Intake', detail: 'Read the request and confirm project basics', statuses: ['submitted', 'in_review'] },
  { id: 'scope', label: 'Scope', eyebrow: 'Quote', detail: 'Set the offer, price, and delivery terms.', statuses: ['quote_ready', 'approved'] },
  { id: 'agreement', label: 'Agreement', eyebrow: 'Payment', detail: '', statuses: ['payment_agreement'] },
  { id: 'build', label: 'Studio', eyebrow: 'Production', detail: '', statuses: ['in_development'] },
  { id: 'review', label: 'Review', eyebrow: 'Staging', detail: 'Send preview and handle feedback', statuses: ['staging_review'] },
  { id: 'launch', label: 'Launch', eyebrow: 'Handoff', detail: 'Launch, handoff, and close the build', statuses: ['launched', 'handoff', 'completed'] },
];

export const closedBuildStatuses = ['completed', 'cancelled', 'archived'];

export const buildOperatorViews = [
  { id: 'briefs', label: 'Briefs', detail: 'New requests and intake review', statuses: ['submitted', 'in_review'] },
  { id: 'scope', label: 'Scope', detail: 'Quote preparation and client decision', statuses: ['quote_ready', 'approved'] },
  { id: 'agreement', label: 'Agreement', detail: '', statuses: ['payment_agreement'] },
  { id: 'studio', label: 'Studio', detail: 'Build work currently moving', statuses: ['in_development'] },
  { id: 'review', label: 'Review', detail: 'Staging preview and client feedback', statuses: ['staging_review'] },
  { id: 'launch', label: 'Launch / Handoff', detail: 'Live release, access, and ownership transfer', statuses: ['launched', 'handoff'] },
  { id: 'completed', label: 'Completed', detail: 'Launched, handed off, and closed', statuses: ['completed'] },
  { id: 'archived', label: 'Archived', detail: 'Cancelled or stored work', statuses: ['cancelled', 'archived'] },
];

export const briefMissingOptions = [
  'Content/assets', 'Pages/sections', 'Services/products', 'Lead form fields',
  'Design references', 'Feature scope', 'Audience/details', 'Budget clarity', 'Timeline clarity',
];

export const getAdminBuildChapter = (status?: string) =>
  adminBuildChapters.find(chapter => chapter.statuses.includes(status || 'submitted')) || adminBuildChapters[0];

export const getAdminBuildProgress = (status?: string) => {
  const chapter = getAdminBuildChapter(status);
  const chapterIndex = Math.max(0, adminBuildChapters.findIndex(item => item.id === chapter.id));
  return Math.round(((chapterIndex + 1) / adminBuildChapters.length) * 100);
};

export const getAdminNextAction = (request: ProjectRequest) => {
  if (['submitted', 'in_review'].includes(request.status)) return 'Review brief';
  if (request.status === 'quote_ready') return 'Await client';
  if (request.status === 'approved') return 'Send terms';
  if (request.status === 'payment_agreement') {
    return request.paymentAgreementStatus === 'confirmed' ? 'Start development' : 'Waiting payment';
  }
  if (request.status === 'in_development') return 'Update studio';
  if (request.status === 'staging_review') return 'Handle review';
  if (['launched', 'handoff'].includes(request.status)) return 'Close handoff';
  if (request.status === 'completed') return 'Closed';
  return request.status.replace(/_/g, ' ');
};

export const getAdminBuildState = (request: ProjectRequest) => {
  if (request.status === 'completed') return 'Completed';
  if (request.status === 'cancelled') return 'Cancelled';
  if (request.status === 'archived') return 'Archived';
  if (request.status === 'launched') return 'Launched';
  if (['quote_ready', 'staging_review'].includes(request.status)) return 'Waiting client';
  if (['approved', 'payment_agreement'].includes(request.status)) return 'Gate';
  if (request.status === 'in_development') return 'In studio';
  if (['submitted', 'in_review', 'handoff'].includes(request.status)) return 'Needs action';
  return 'Active';
};

// --- Nav / tab definitions ---

export interface AdminTab { id: string; name: string; shortName?: string; icon: ReactNode }
export interface AdminTabGroup { id: string; label: string; accent: string; icon: ReactNode; tabs: string[] }

export const adminTabs: AdminTab[] = [
  { id: 'dashboard', name: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'project-requests', name: 'Build Pipeline', shortName: 'Build', icon: <FileText className="w-4 h-4" /> },
  { id: 'review', name: 'Reviews & Approvals', shortName: 'Approvals', icon: <Eye className="w-4 h-4" /> },
  { id: 'milestones', name: 'Milestones', icon: <Activity className="w-4 h-4" /> },
  { id: 'health', name: 'Repair & Care', shortName: 'Care', icon: <Activity className="w-4 h-4" /> },
  { id: 'bookings', name: 'Grow / Bookings', shortName: 'Bookings', icon: <Clock className="w-4 h-4" /> },
  { id: 'users', name: 'Client Records', shortName: 'Clients', icon: <Users className="w-4 h-4" /> },
  { id: 'leads', name: 'Leads', icon: <Folder className="w-4 h-4" /> },
  { id: 'assessments', name: 'Assessments', icon: <Activity className="w-4 h-4" /> },
  { id: 'subscriptions', name: 'Billing & Agreements', shortName: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'transactions', name: 'Transactions', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'tickets', name: 'Tickets', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'live-support', name: 'Live Chat', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'comments', name: 'Comments', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'media', name: 'Media Library', shortName: 'Media', icon: <Folder className="w-4 h-4" /> },
  { id: 'blog', name: 'Blog', icon: <PenLine className="w-4 h-4" /> },
  { id: 'portfolio', name: 'Portfolio', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'analytics', name: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'system', name: 'System', shortName: 'System', icon: <Settings className="w-4 h-4" /> },
];

export const adminTabGroups: AdminTabGroup[] = [
  { id: 'overview', label: 'Overview', accent: 'text-ai-blue', icon: <BarChart3 className="w-4 h-4" />, tabs: ['dashboard'] },
  { id: 'work', label: 'Work', accent: 'text-ai-blue', icon: <Layout className="w-4 h-4" />, tabs: ['project-requests', 'review', 'milestones', 'health', 'bookings'] },
  { id: 'clients', label: 'Clients', accent: 'text-expert-green', icon: <Users className="w-4 h-4" />, tabs: ['users', 'leads', 'assessments'] },
  { id: 'communication', label: 'Communication', accent: 'text-tech-purple', icon: <MessageSquare className="w-4 h-4" />, tabs: ['tickets', 'live-support', 'comments'] },
  { id: 'business', label: 'Business', accent: 'text-amber-300', icon: <CreditCard className="w-4 h-4" />, tabs: ['subscriptions', 'transactions', 'analytics'] },
  { id: 'content', label: 'Content', accent: 'text-ai-blue', icon: <PenLine className="w-4 h-4" />, tabs: ['media', 'blog', 'portfolio'] },
  { id: 'system', label: 'System', accent: 'text-white/70', icon: <Settings className="w-4 h-4" />, tabs: ['system'] },
];