'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { io, Socket } from 'socket.io-client';
import dynamic from 'next/dynamic';
import { apiClient } from '@/lib/api';
import { Layout, ShoppingBag, Eye, Plus, Trash2, FileText, Clock, Users, BarChart3, CreditCard, Settings, MessageSquare, Activity, Folder, PenLine, Sparkles, ChevronRight, PanelLeftClose, PanelLeftOpen, Check, ArrowLeft, Search, Package, UserRound, Mail, CalendarDays, Send, CircleDollarSign } from 'lucide-react';

const BlogEditor = dynamic(() => import('./BlogEditor'), { ssr: false });
const AssessmentModal = dynamic(() => import('./AssessmentModal'), { ssr: false });
const SupportManager = dynamic(() => import('./dashboard/SupportManager'), { ssr: false });
const LiveSupportManager = dynamic(() => import('./dashboard/LiveSupportManager'), { ssr: false });
const MilestoneManager = dynamic(() => import('./dashboard/MilestoneManager'), { ssr: false });
const TemplateEditor = dynamic(() => import('./dashboard/TemplateEditor'), { ssr: false });
const CommentManager = dynamic(() => import('./dashboard/CommentManager'), { ssr: false });
const AdminSystemHealth = dynamic(() => import('./dashboard/AdminSystemHealth'), { ssr: false });
const PerformanceAudit = dynamic(() => import('./dashboard/PerformanceAudit'), { ssr: false });
const BookingManager = dynamic(() => import('./dashboard/BookingManager'), { ssr: false });

const formatCurrencyAmount = (currency: string, amount?: number | null, fallback = 'Not set') => {
  if (!amount) return fallback;
  return `${currency} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount)}`;
};

interface AdminDashboardProps {
  onLogout: () => void;
  initialTab?: string;
}

interface DashboardStats {
  totalUsers: number;
  totalLeads: number;
  totalAssessments: number;
  conversionRate: string;
  revenue?: {
    total: number;
  };
  subscriptions?: {
    active: number;
    suspended: number;
    total: number;
  };
  recentLeads: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
  }>;
  recentAssessments: Array<{
    id: string;
    createdAt: string;
    responses: Record<string, unknown>;
  }>;
  userGrowth: Array<{
    date: string;
    count: number;
  }>;
  leadGrowth: Array<{
    date: string;
    count: number;
  }>;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  status: string;
  subject?: string;
  message?: string;
  source?: string;
  sourceDetails?: Record<string, unknown>;
  assignedTo?: {
    id: string;
    name: string;
  } | string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
}

interface Addon {
  id: string;
  name: string;
  price: number;
}

interface Subscription {
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
  user?: {
    name: string;
    email: string;
  };
  purchasedAddons?: Addon[];
  paymentStatus?: string;
  domain?: string;
}

interface MediaAsset {
  id: string;
  filename: string;
  url: string;
  mimetype: string;
  size: number;
  userId: string;
  createdAt: string;
}

interface Recommendation {
  type: 'warning' | 'success' | 'info';
  category: string;
  message: string;
}

interface AnalyticsData {
  users: { total: number; new: number; active: number; growth?: { date: string, count: number }[] };
  assessments: { total: number; conversionRate: number; trends?: { date: string, count: number }[] };
  leads: { total: number; conversionRate: number; trends?: { date: string, count: number }[] };
  revenue: { total: number; averageOrderValue: number; trends?: { date: string, amount: number }[] };
  content: Record<string, unknown>;
  traffic: Record<string, unknown>;
  predictions: {
    recommendations: Recommendation[];
    growthRate?: {
      users?: number;
      revenue?: number;
    };
    nextWeekUsers?: number | string;
    nextWeekRevenue?: number | string;
    nextWeekConversionRate?: number | string;
  };
}

interface EnforcementSettings {
  ai_foundation: {
    overlayThreshold: number;
    maxGracePeriod: number;
    reminderFrequency: string;
  };
  pro_enhancement: {
    overlayThreshold: number;
    maxGracePeriod: number;
    reminderFrequency: string;
  };
  enterprise: {
    overlayThreshold: number;
    maxGracePeriod: number;
    reminderFrequency: string;
  };
  self_hosted: {
    overlayThreshold: number;
    maxGracePeriod: number;
    reminderFrequency: string;
  };
  maintenance: {
    overlayThreshold: number;
    maxGracePeriod: number;
    reminderFrequency: string;
  };
  automationEnabled: boolean;
  autoSuspendEnabled: boolean;
  gracePeriodDays?: number;
  overlayThreshold?: number;
  enforceOverlays?: boolean;
}

interface SiteVitals {
  performance?: number;
  coreWebVitals?: {
    fcp?: string;
    tti?: string;
    cls?: string;
    lcp?: string;
  };
}

interface Assessment {
  id: string;
  name?: string;
  email?: string;
  createdAt: string;
  responses: Record<string, unknown>;
}

interface ProjectRequest {
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
  buildMilestones?: BuildMilestone[];
  studioTasks?: StudioTask[];
  studioLinks?: StudioLink[];
  studioBlockers?: StudioBlocker[];
  studioUpdates?: StudioUpdate[];
  adminNotes?: string;
  clientNotes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    country?: string;
    defaultCurrency?: string;
    accountType?: string;
    billingRegion?: string;
  };
  assessment?: {
    id: string;
    responses?: Record<string, unknown>;
    results?: Record<string, unknown>;
    status?: string;
    createdAt?: string;
  };
}

interface StudioTask {
  id: string;
  title: string;
  area: string;
  status: string;
  owner?: string;
  dueDate?: string;
  note?: string;
  order?: number;
  createdAt?: string;
}

interface StudioLink {
  id: string;
  label: string;
  url?: string;
  type: string;
  note?: string;
  createdAt?: string;
}

interface StudioBlocker {
  id: string;
  title: string;
  area: string;
  status: string;
  note?: string;
  createdAt?: string;
  resolvedAt?: string;
}

interface StudioUpdate {
  id: string;
  message: string;
  visibility: string;
  createdBy?: string;
  createdAt: string;
}

interface BuildMilestone {
  id: string;
  title: string;
  description?: string;
  status: string;
  progress: number;
  order: number;
  dueDate?: string;
  clientNote?: string;
}

interface ReviewChatMessage {
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

export default function AdminDashboard({ onLogout, initialTab }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState(initialTab || 'dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [openSidebarGroup, setOpenSidebarGroup] = useState<string | null>('work');
  const [mobileRailGroup, setMobileRailGroup] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [buildOperatorView, setBuildOperatorView] = useState('overview');
  const [briefMissingItems, setBriefMissingItems] = useState<string[]>([]);
  const [briefClarificationMessage, setBriefClarificationMessage] = useState('');
  const [briefDecisionMessage, setBriefDecisionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [scopeClientNote, setScopeClientNote] = useState('');
  const [studioTaskDraft, setStudioTaskDraft] = useState({ title: '', area: 'design' });
  const [studioBlockerDraft, setStudioBlockerDraft] = useState('');
  const [studioUpdateDraft, setStudioUpdateDraft] = useState('');
  const [studioLinkDraft, setStudioLinkDraft] = useState({ type: 'design', label: '', url: '' });
  const [reviewChatOpen, setReviewChatOpen] = useState(false);
  const [reviewChatMessages, setReviewChatMessages] = useState<ReviewChatMessage[]>([]);
  const [reviewChatDraft, setReviewChatDraft] = useState('');
  const [reviewChatChoiceDraft, setReviewChatChoiceDraft] = useState('');
  const [reviewChatLoading, setReviewChatLoading] = useState(false);
  const [reviewChatSending, setReviewChatSending] = useState(false);
  const [agreementDraft, setAgreementDraft] = useState({
    paymentAgreementType: '',
    paymentDueDate: '',
    totalAgreedAmount: '',
    depositAmount: '',
    paymentInstructions: ''
  });
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [projectRequests, setProjectRequests] = useState<ProjectRequest[]>([]);
  const [selectedProjectRequestId, setSelectedProjectRequestId] = useState<string | null>(null);
  const [activeAdminBuildChapter, setActiveAdminBuildChapter] = useState<string | null>(null);
  const [reviewProjects, setReviewProjects] = useState<Subscription[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    users: { total: 0, new: 0, active: 0 },
    assessments: { total: 0, conversionRate: 0 },
    leads: { total: 0, conversionRate: 0 },
    revenue: { total: 0, averageOrderValue: 0 },
    content: {},
    traffic: {},
    predictions: { recommendations: [] }
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [selectedSubscriptionForEditor, setSelectedSubscriptionForEditor] = useState<string | null>(null);
  const [selectedSiteForVitals, setSelectedSiteForVitals] = useState<string | null>(null);
  const [siteVitals, setSiteVitals] = useState<SiteVitals | null>(null);
  const [loadingVitals, setLoadingVitals] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [enforcementSettings, setEnforcementSettings] = useState<EnforcementSettings | null>(null);
  const [isSystemWorking, setIsSystemWorking] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const activeTabRef = useRef(activeTab);
  const selectedProjectRequestIdRef = useRef(selectedProjectRequestId);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      if (activeTab === 'dashboard') {
        const res = await apiClient.getAdminStats() as unknown as { success: boolean; data: DashboardStats };
        if (res.success) setStats(res.data);
      } else if (activeTab === 'leads') {
        const res = await apiClient.getAdminLeads() as { success: boolean; data: Lead[] };
        if (res.success) setLeads(res.data);
      } else if (activeTab === 'users') {
        const res = await apiClient.getAdminUsers() as { success: boolean; data: User[] };
        if (res.success) setUsers(res.data);
      } else if (activeTab === 'subscriptions') {
        const res = await apiClient.getAdminSubscriptions() as { success: boolean; data: Subscription[] };
        if (res.success) setSubscriptions(res.data);
      } else if (activeTab === 'project-requests') {
        const res = await apiClient.getAdminProjectRequests() as { success: boolean; data: ProjectRequest[] };
        if (res.success) {
          setProjectRequests(res.data);
        }
      } else if (activeTab === 'assessments') {
        const res = await apiClient.getAdminAssessments() as { success: boolean; data: Assessment[] };
        if (res.success) setAssessments(res.data);
      } else if (activeTab === 'review') {
        const res = await apiClient.getAdminSubscriptions() as { success: boolean; data: Subscription[] };
        if (res.success) {
          // Filter for projects where the user explicitly requested a human review
          setReviewProjects(res.data.filter((s) => s.reviewRequested === true));
        }
      } else if (activeTab === 'media') {
        const res = await apiClient.getMedia() as { success: boolean; data: MediaAsset[] };
        if (res.success) setMedia(res.data);
      } else if (activeTab === 'analytics') {
        const res = await apiClient.getAdminAnalytics() as unknown as { success: boolean; analytics: AnalyticsData };
        if (res.success) setAnalytics(res.analytics);
      } else if (activeTab === 'system') {
        const res = await apiClient.getEnforcementSettings() as { success: boolean; data: EnforcementSettings };
        if (res.success) setEnforcementSettings(res.data);
      }
    } catch (error) {
      console.error(`Failed to fetch ${activeTab} data:`, error);
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    selectedProjectRequestIdRef.current = selectedProjectRequestId;
  }, [selectedProjectRequestId]);

  useEffect(() => {
    setBriefMissingItems([]);
    setBriefClarificationMessage('');
    setBriefDecisionMessage(null);
  }, [selectedProjectRequestId]);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    let normalizedUrl = socketUrl;
    if (!process.env.NEXT_PUBLIC_SOCKET_URL && normalizedUrl.includes('/api')) {
      normalizedUrl = normalizedUrl.replace(/\/api$/, '');
    }
    
    socketRef.current = io(normalizedUrl);

    socketRef.current.on('connect', () => {
      socketRef.current?.emit('admin_join');
    });

    socketRef.current.on('new_client_message', (data) => {
      console.log('New client message:', data);
      if (activeTabRef.current === 'dashboard') {
        fetchData();
      }
    });

    socketRef.current.on('new_support_ticket', (data) => {
      console.log('New support ticket:', data);
      if (activeTabRef.current === 'tickets' || activeTabRef.current === 'dashboard') {
        fetchData();
      }
    });

    socketRef.current.on('new_support_message_from_user', (data) => {
      console.log('New support message from user:', data);
      if (activeTabRef.current === 'tickets') {
        fetchData();
      }
    });

    socketRef.current.on('project_request_updated', (data: { request?: ProjectRequest }) => {
      if (!data?.request) return;
      setProjectRequests(prev => {
        const exists = prev.some(request => request.id === data.request?.id);
        return exists
          ? prev.map(request => request.id === data.request?.id ? data.request as ProjectRequest : request)
          : [data.request as ProjectRequest, ...prev];
      });
    });

    socketRef.current.on('review_chat_message', (data: { requestId?: string; message?: ReviewChatMessage }) => {
      if (!data?.message || data.requestId !== selectedProjectRequestIdRef.current) return;
      setReviewChatMessages(prev => prev.some(message => message.id === data.message?.id) ? prev : [...prev, data.message as ReviewChatMessage]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [fetchData]);

  const userGrowthTrend = analytics?.predictions?.growthRate?.users;
  const revenueGrowthTrend = analytics?.predictions?.growthRate?.revenue;

  useEffect(() => {
    fetchData();
  }, [fetchData, activeTab]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleRunSuspensionCheck = async () => {
    setIsSystemWorking(true);
    try {
      const res = await apiClient.runSuspensionCheck() as { success: boolean; message: string };
      alert(res.message);
    } catch (error) {
      console.error('Suspension check failed:', error);
    } finally {
      setIsSystemWorking(false);
    }
  };

  const handleRunDNSVerification = async () => {
    setIsSystemWorking(true);
    try {
      const res = await apiClient.runDNSVerification() as { success: boolean; message: string };
      alert(res.message);
    } catch (error) {
      console.error('DNS verification failed:', error);
    } finally {
      setIsSystemWorking(false);
    }
  };

  const handleUpdateEnforcementSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enforcementSettings) return;
    setSubmitting(true);
    try {
      await apiClient.updateEnforcementSettings(enforcementSettings);
      alert('Settings updated successfully');
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateLeadStatus = async (id: string, status: string) => {
    try {
      await apiClient.updateLeadStatus(id, status);
      fetchData();
    } catch (error) {
      console.error('Failed to update lead status:', error);
    }
  };

  const handleToggleUserBan = async (id: string, currentBanned: boolean) => {
    try {
      await apiClient.toggleUserBan(id, !currentBanned);
      fetchData();
    } catch (error) {
      console.error('Failed to toggle user ban:', error);
    }
  };

  const handleUpdateUserRole = async (id: string, role: string) => {
    try {
      await apiClient.updateUserRole(id, role);
      fetchData();
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const handleUploadMedia = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      await apiClient.uploadMedia(formData);
      fetchData();
    } catch (error) {
      console.error('Failed to upload media:', error);
      alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      await apiClient.deleteMedia(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete media:', error);
    }
  };

  const handleDeploySite = async (id: string) => {
    if (!confirm('Are you sure you want to deploy this site live?')) return;
    try {
      await apiClient.deployTemplate(id);
      alert('Site deployed successfully!');
      fetchData();
    } catch (error) {
      console.error('Failed to deploy site:', error);
      alert('Deployment failed');
    }
  };

  const handleUpdateReview = async (id: string, notes: string, increment: boolean = false) => {
    try {
      await apiClient.updateSubscriptionReview(id, {
        reviewNotes: notes,
        incrementRevision: increment
      });
      alert('Review updated successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to update review:', error);
      alert('Review update failed');
    }
  };

  const handleTriggerAIGeneration = async (subscriptionId: string) => {
    if (!confirm('This will consume AI tokens and overwrite existing content. Continue?')) return;
    setIsSystemWorking(true);
    try {
      const res = await apiClient.triggerAIGeneration(subscriptionId);
      alert(res.message || 'AI Generation initialized successfully');
    } catch (error) {
      console.error('AI Generation failed:', error);
      alert('Failed to initialize AI Generation');
    } finally {
      setIsSystemWorking(false);
    }
  };

  const handleViewAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setIsAssessmentModalOpen(true);
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;
    try {
      await apiClient.deleteAssessment(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete assessment:', error);
    }
  };

  const handleSuspendSubscription = async (id: string, currentStatus: string) => {
    const isSuspended = currentStatus === 'SUSPENDED';
    if (!confirm(`Are you sure you want to ${isSuspended ? 'unsuspend' : 'suspend'} this node?`)) return;
    try {
      await apiClient.suspendSubscription(id, !isSuspended);
      fetchData();
    } catch (error) {
      console.error('Failed to update suspension status:', error);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm('CRITICAL: Delete this node? All associated data will be PERMANENTLY lost.')) return;
    try {
      await apiClient.deleteSubscription(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete subscription:', error);
    }
  };

  const adminBuildChapters = [
    { id: 'brief', label: 'Brief', eyebrow: 'Intake', detail: 'Read the request and confirm project basics', statuses: ['submitted', 'in_review'] },
    { id: 'scope', label: 'Scope', eyebrow: 'Quote', detail: 'Set the offer, price, and delivery terms.', statuses: ['quote_ready', 'approved'] },
    { id: 'agreement', label: 'Agreement', eyebrow: 'Payment', detail: '', statuses: ['payment_agreement'] },
    { id: 'build', label: 'Studio', eyebrow: 'Production', detail: '', statuses: ['in_development'] },
    { id: 'review', label: 'Review', eyebrow: 'Staging', detail: 'Send preview and handle feedback', statuses: ['staging_review'] },
    { id: 'launch', label: 'Launch', eyebrow: 'Handoff', detail: 'Launch, handoff, and close the build', statuses: ['launched', 'handoff', 'completed'] },
  ];

  const selectedProjectRequest = selectedProjectRequestId ? projectRequests.find(request => request.id === selectedProjectRequestId) || null : null;
  useEffect(() => {
    setAgreementDraft({
      paymentAgreementType: selectedProjectRequest?.paymentAgreementType || '',
      paymentDueDate: selectedProjectRequest?.paymentDueDate ? selectedProjectRequest.paymentDueDate.slice(0, 10) : '',
      totalAgreedAmount: selectedProjectRequest?.totalAgreedAmount?.toString() || selectedProjectRequest?.quotedAmount?.toString() || '',
      depositAmount: selectedProjectRequest?.depositAmount?.toString() || '',
      paymentInstructions: selectedProjectRequest?.paymentInstructions || ''
    });
  }, [
    selectedProjectRequest?.id,
    selectedProjectRequest?.paymentAgreementType,
    selectedProjectRequest?.paymentDueDate,
    selectedProjectRequest?.totalAgreedAmount,
    selectedProjectRequest?.quotedAmount,
    selectedProjectRequest?.depositAmount,
    selectedProjectRequest?.paymentInstructions
  ]);

  useEffect(() => {
    if (
      activeTab !== 'dashboard'
      || selectedProjectRequest?.status !== 'payment_agreement'
      || selectedProjectRequest.paymentAgreementStatus === 'confirmed'
    ) {
      return;
    }

    const refreshPaymentState = window.setInterval(() => {
      fetchData();
    }, 6000);

    return () => window.clearInterval(refreshPaymentState);
  }, [
    activeTab,
    fetchData,
    selectedProjectRequest?.id,
    selectedProjectRequest?.status,
    selectedProjectRequest?.paymentAgreementStatus
  ]);

  useEffect(() => {
    const note = selectedProjectRequest?.clientNotes?.trim() || '';
    setScopeClientNote(note.toLowerCase().includes('scope sent') ? note : '');
  }, [selectedProjectRequest?.id, selectedProjectRequest?.clientNotes]);

  const getAdminBuildChapter = (status?: string) => adminBuildChapters.find(chapter => chapter.statuses.includes(status || 'submitted')) || adminBuildChapters[0];
  const getAdminBuildProgress = (status?: string) => {
    const chapter = getAdminBuildChapter(status);
    const chapterIndex = Math.max(0, adminBuildChapters.findIndex(item => item.id === chapter.id));
    return Math.round(((chapterIndex + 1) / adminBuildChapters.length) * 100);
  };
  const getAdminNextAction = (request: ProjectRequest) => {
    if (['submitted', 'in_review'].includes(request.status)) return 'Review brief';
    if (request.status === 'quote_ready') return 'Await client';
    if (request.status === 'approved') return 'Send terms';
    if (request.status === 'payment_agreement') {
      if (request.paymentAgreementStatus === 'confirmed') return 'Start development';
      return 'Waiting payment';
    }
    if (request.status === 'in_development') return 'Update studio';
    if (request.status === 'staging_review') return 'Handle review';
    if (['launched', 'handoff'].includes(request.status)) return 'Close handoff';
    if (request.status === 'completed') return 'Closed';
    return request.status.replace(/_/g, ' ');
  };
  const getAdminBuildState = (request: ProjectRequest) => {
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
  const closedBuildStatuses = ['completed', 'cancelled', 'archived'];
  const buildOperatorViews = [
    { id: 'briefs', label: 'Briefs', detail: 'New requests and intake review', statuses: ['submitted', 'in_review'] },
    { id: 'scope', label: 'Scope', detail: 'Quote preparation and client decision', statuses: ['quote_ready', 'approved'] },
    { id: 'agreement', label: 'Agreement', detail: '', statuses: ['payment_agreement'] },
    { id: 'studio', label: 'Studio', detail: 'Build work currently moving', statuses: ['in_development'] },
    { id: 'review', label: 'Review', detail: 'Staging preview and client feedback', statuses: ['staging_review'] },
    { id: 'launch', label: 'Launch / Handoff', detail: 'Live release, access, and ownership transfer', statuses: ['launched', 'handoff'] },
    { id: 'completed', label: 'Completed', detail: 'Launched, handed off, and closed', statuses: ['completed'] },
    { id: 'archived', label: 'Archived', detail: 'Cancelled or stored work', statuses: ['cancelled', 'archived'] },
  ];
  const selectedBuildOperatorView = buildOperatorViews.find(view => view.id === buildOperatorView) || null;
  const selectedBuildOperatorViewIndex = selectedBuildOperatorView
    ? buildOperatorViews.findIndex(view => view.id === selectedBuildOperatorView.id)
    : -1;
  const previousBuildOperatorView = selectedBuildOperatorViewIndex > 0 ? buildOperatorViews[selectedBuildOperatorViewIndex - 1] : null;
  const nextBuildOperatorView = selectedBuildOperatorViewIndex >= 0 && selectedBuildOperatorViewIndex < buildOperatorViews.length - 1
    ? buildOperatorViews[selectedBuildOperatorViewIndex + 1]
    : null;
  const buildSearchTerm = searchTerm.trim().toLowerCase();
  const filteredProjectRequestsBySearch = projectRequests.filter(request => {
    if (!buildSearchTerm) return true;
    const rowChapter = getAdminBuildChapter(request.status);
    const haystack = [
      request.id,
      request.title,
      request.businessName,
      request.packageIntent,
      request.serviceType,
      request.status,
      request.summary,
      request.quoteCurrency,
      request.quotedAmount,
      rowChapter.label,
      request.user?.name,
      request.user?.email,
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(buildSearchTerm);
  });
  const filteredProjectRequests = selectedBuildOperatorView
    ? filteredProjectRequestsBySearch.filter(request => selectedBuildOperatorView.statuses.includes(request.status))
    : [];
  const buildOperatorCards = buildOperatorViews.map(view => ({
    ...view,
    requests: projectRequests.filter(request => view.statuses.includes(request.status)),
  }));
  const defaultAdminBuildChapter = adminBuildChapters.find(chapter => chapter.statuses.includes(selectedProjectRequest?.status || 'submitted')) || adminBuildChapters[0];
  const defaultAdminBuildChapterIndex = Math.max(0, adminBuildChapters.findIndex(chapter => chapter.id === defaultAdminBuildChapter.id));
  const requestedAdminBuildChapter = adminBuildChapters.find(chapter => chapter.id === activeAdminBuildChapter);
  const requestedAdminBuildChapterIndex = requestedAdminBuildChapter ? adminBuildChapters.findIndex(chapter => chapter.id === requestedAdminBuildChapter.id) : -1;
  const canOpenRequestedAdminBuildChapter = Boolean(
    requestedAdminBuildChapter
    && (
      requestedAdminBuildChapterIndex <= defaultAdminBuildChapterIndex
      || selectedProjectRequest?.status === 'completed'
      || (selectedProjectRequest?.status === 'approved' && requestedAdminBuildChapter.id === 'agreement')
    )
  );
  const selectedAdminBuildChapter = requestedAdminBuildChapter && canOpenRequestedAdminBuildChapter
    ? requestedAdminBuildChapter
    : defaultAdminBuildChapter;
  const selectedAdminBuildChapterIndex = Math.max(0, adminBuildChapters.findIndex(chapter => chapter.id === selectedAdminBuildChapter.id));
  const nextAdminBuildChapter = adminBuildChapters[Math.min(selectedAdminBuildChapterIndex + 1, adminBuildChapters.length - 1)];
  const adminBuildPageProgress = Math.round(((defaultAdminBuildChapterIndex + 1) / adminBuildChapters.length) * 100);
  const selectedBuildMilestones = selectedProjectRequest?.buildMilestones || [];
  const selectedActiveBuildMilestone = selectedBuildMilestones.find(milestone => milestone.status === 'in_progress')
    || selectedBuildMilestones.find(milestone => milestone.status === 'pending')
    || selectedBuildMilestones[selectedBuildMilestones.length - 1];
  const selectedBlockedBuildMilestones = selectedBuildMilestones.filter(milestone => milestone.status === 'blocked');
  const selectedStudioInternalNote = selectedProjectRequest?.adminNotes?.toLowerCase().includes('client brief clarification')
    ? ''
    : selectedProjectRequest?.adminNotes?.trim() || '';
  const briefReviewStatus = selectedProjectRequest?.status === 'submitted'
    ? 'New brief'
    : selectedProjectRequest?.status === 'in_review'
      ? 'Under review'
      : selectedProjectRequest && ['quote_ready', 'approved', 'payment_agreement', 'in_development', 'staging_review', 'launched', 'handoff', 'completed'].includes(selectedProjectRequest.status)
        ? 'Ready for scope'
        : 'Review needed';
  const briefMissingOptions = [
    'Content/assets',
    'Pages/sections',
    'Services/products',
    'Lead form fields',
    'Design references',
    'Feature scope',
    'Audience/details',
    'Budget clarity',
    'Timeline clarity',
  ];
  const selectedBriefLines = (selectedProjectRequest?.summary || '').split('\n').filter(Boolean);
  const getSelectedBriefValue = (label: string) => {
    const match = selectedBriefLines.find(line => line.toLowerCase().startsWith(`${label.toLowerCase()}:`));
    return match ? match.slice(label.length + 1).trim() : '';
  };
  const readResponseValue = (value: unknown) => Array.isArray(value) ? value.join(', ') : typeof value === 'string' ? value : '';
  const selectedBriefType = readResponseValue(selectedProjectRequest?.assessment?.responses?.projectType)
    || getSelectedBriefValue('Build type')
    || selectedProjectRequest?.serviceType
    || 'Custom build';
  const selectedBriefGoals = readResponseValue(selectedProjectRequest?.assessment?.responses?.goals) || getSelectedBriefValue('Goals');
  const selectedBriefFeatures = readResponseValue(selectedProjectRequest?.assessment?.responses?.requiredFeatures) || getSelectedBriefValue('Required features');
  const selectedBriefAudience = readResponseValue(selectedProjectRequest?.assessment?.responses?.targetAudience) || getSelectedBriefValue('Users');
  const selectedBriefMaterial = readResponseValue(selectedProjectRequest?.assessment?.responses?.hasWebsite) || getSelectedBriefValue('Existing material');
  const selectedBriefStyle = readResponseValue(selectedProjectRequest?.assessment?.responses?.preferredStyle) || getSelectedBriefValue('Style direction');
  const selectedBriefLink = readResponseValue(selectedProjectRequest?.assessment?.responses?.website) || getSelectedBriefValue('Link');
  const selectedStudioNoteSource = `${selectedProjectRequest?.adminNotes || ''}\n${selectedProjectRequest?.clientNotes || ''}`;
  const selectedStudioHasContentAssets = Boolean(
    (selectedBriefMaterial && selectedBriefMaterial.toLowerCase() !== 'nothing yet')
    || /Content\/assets:\s*(?!\s*(not answered|none|nothing yet)\b).+/i.test(selectedStudioNoteSource)
  );
  const selectedStudioTasks = selectedProjectRequest?.studioTasks || [];
  const selectedStudioLinks = selectedProjectRequest?.studioLinks || [];
  const selectedStudioBlockers = selectedProjectRequest?.studioBlockers || [];
  const selectedOpenStudioBlockers = selectedStudioBlockers.filter(blocker => blocker.status !== 'resolved');
  const selectedStudioUpdates = selectedProjectRequest?.studioUpdates || [];
  const selectedPreviewLink = selectedStudioLinks.find(link => link.type === 'preview' && link.url) || null;
  const selectedPreviewUrl = selectedProjectRequest?.stagingUrl || selectedPreviewLink?.url || '';
  const selectedPreviewIsReal = Boolean(selectedPreviewUrl && /^https?:\/\//i.test(selectedPreviewUrl) && !/sitemendr\.test|localhost|127\.0\.0\.1/i.test(selectedPreviewUrl));
  const selectedPreviewIsTest = Boolean(selectedPreviewUrl && !selectedPreviewIsReal);
  const selectedInternalPreviewUrl = selectedProjectRequest?.subscriptionId
    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/preview/${selectedProjectRequest.subscriptionId}`
    : '';
  const selectedStudioNeeds = [
    selectedStudioHasContentAssets ? null : 'Content/assets',
    selectedPreviewIsReal ? null : 'Real preview link',
    selectedBlockedBuildMilestones.length ? 'Blocker resolution' : null,
    selectedActiveBuildMilestone?.clientNote?.trim() ? null : 'Client update',
  ].filter(Boolean) as string[];
  const selectedClientStudioUpdates = selectedStudioUpdates.filter(update => update.visibility === 'client');
  const selectedDoneStudioTasks = selectedStudioTasks.filter(task => task.status === 'done');
  const selectedActiveStudioTasks = selectedStudioTasks.filter(task => task.status === 'active');
  const selectedBlockedStudioTasks = selectedStudioTasks.filter(task => task.status === 'blocked');
  const selectedStudioCompletion = selectedStudioTasks.length
    ? Math.round((selectedDoneStudioTasks.length / selectedStudioTasks.length) * 100)
    : 0;
  const selectedStudioAreas = [
    { id: 'design', name: 'Design', icon: <Layout className="h-5 w-5" />, accent: 'text-ai-blue' },
    { id: 'build', name: 'Build', icon: <Settings className="h-5 w-5" />, accent: 'text-white/70' },
    { id: 'content', name: 'Content', icon: <Package className="h-5 w-5" />, accent: selectedStudioHasContentAssets ? 'text-expert-green' : 'text-amber-300' },
    { id: 'qa', name: 'QA', icon: <Eye className="h-5 w-5" />, accent: 'text-white/50' },
    { id: 'preview', name: 'Preview', icon: <Sparkles className="h-5 w-5" />, accent: selectedPreviewIsReal ? 'text-expert-green' : 'text-amber-300' },
  ].map(area => ({
    ...area,
    tasks: selectedStudioTasks.filter(task => task.area === area.id)
  }));
  const getStudioAreaState = (tasks: StudioTask[]) => {
    if (!tasks.length) return { label: 'Not started', tone: 'text-white/34' };
    if (tasks.some(task => task.status === 'blocked')) return { label: 'Blocked', tone: 'text-amber-300' };
    if (tasks.every(task => task.status === 'done')) return { label: 'Ready', tone: 'text-expert-green' };
    if (tasks.some(task => task.status === 'active')) return { label: 'In progress', tone: 'text-ai-blue' };
    return { label: 'Queued', tone: 'text-white/48' };
  };
  const selectedStudioDeliverables = [
    { label: 'Build type', value: selectedBriefType || 'Custom build' },
    { label: 'Goal', value: selectedBriefGoals || 'Not set' },
    { label: 'Must include', value: selectedBriefFeatures || 'Not set' },
    { label: 'Audience', value: selectedBriefAudience || 'Not set' },
    { label: 'Style', value: selectedBriefStyle || 'Not set' },
    { label: 'Content', value: selectedBriefMaterial || 'Not set' },
  ];
  const selectedStudioSignals = [
    { label: 'Tasks', value: String(selectedStudioTasks.length), tone: selectedStudioTasks.length ? 'text-white' : 'text-white/34' },
    { label: 'Active', value: String(selectedActiveStudioTasks.length), tone: selectedActiveStudioTasks.length ? 'text-ai-blue' : 'text-white/34' },
    { label: 'Blocked', value: String(selectedOpenStudioBlockers.length + selectedBlockedStudioTasks.length), tone: selectedOpenStudioBlockers.length || selectedBlockedStudioTasks.length ? 'text-amber-300' : 'text-expert-green' },
    { label: 'Updates', value: String(selectedClientStudioUpdates.length), tone: selectedClientStudioUpdates.length ? 'text-expert-green' : 'text-white/34' },
  ];
  const selectedProductionMode = selectedProjectRequest?.productionMode || 'hybrid';
  const selectedProductionModeLabel = selectedProductionMode === 'inside_app'
    ? 'Inside app'
    : selectedProductionMode === 'outside_tools'
      ? 'Outside tools'
      : 'Hybrid';
  const selectedStudioArtifacts = selectedStudioLinks.filter(link => link.type !== 'preview' || link.url);
  const selectedStudioIsEmpty = selectedStudioTasks.length === 0;
  const selectedStudioTaskGroups = selectedStudioAreas
    .map(area => ({ ...area, state: getStudioAreaState(area.tasks) }))
    .filter(area => area.tasks.length > 0);
  const selectedLatestClientUpdate = selectedClientStudioUpdates[0];
  const selectedReviewChecks = [
    {
      label: 'Client update',
      detail: selectedLatestClientUpdate?.message || 'Publish one clear production update before Review.',
      ready: selectedClientStudioUpdates.length > 0
    },
    {
      label: 'Preview',
      detail: selectedPreviewIsReal ? 'Public preview is connected.' : 'Connect a real public preview URL.',
      ready: selectedPreviewIsReal
    },
    {
      label: 'Production evidence',
      detail: selectedStudioArtifacts.some(link => ['design', 'repo', 'file', 'link'].includes(link.type))
        ? 'At least one artifact is attached.'
        : 'Attach design, repo, file, or production reference.',
      ready: selectedStudioArtifacts.some(link => ['design', 'repo', 'file', 'link'].includes(link.type))
    },
    {
      label: 'Work completed',
      detail: selectedDoneStudioTasks.length ? `${selectedDoneStudioTasks.length} work item${selectedDoneStudioTasks.length === 1 ? '' : 's'} done.` : 'Mark at least one production work item as done.',
      ready: selectedDoneStudioTasks.length > 0
    },
    {
      label: 'Risks cleared',
      detail: selectedOpenStudioBlockers.length ? `${selectedOpenStudioBlockers.length} open blocker${selectedOpenStudioBlockers.length === 1 ? '' : 's'} still active.` : 'No open blockers.',
      ready: selectedOpenStudioBlockers.length === 0
    },
  ];
  const selectedStudioCanOpenReview = selectedReviewChecks.every(item => item.ready);
  const selectedReviewStatus = selectedProjectRequest?.stagingReviewStatus || 'sent';
  const selectedReviewStatusLabel = selectedReviewStatus === 'changes_requested'
    ? 'Changes requested'
    : selectedReviewStatus === 'approved'
      ? 'Approved'
      : selectedReviewStatus === 'sent'
        ? 'Waiting client'
        : 'Not sent';
  const selectedReviewStatusTone = selectedReviewStatus === 'approved'
    ? 'text-expert-green'
    : selectedReviewStatus === 'changes_requested'
      ? 'text-amber-300'
      : selectedReviewStatus === 'sent'
        ? 'text-ai-blue'
        : 'text-white/46';
  const selectedReviewCanMoveForward = selectedReviewStatus === 'approved';
  const selectedBriefAnswerRows = [
    { question: 'What are we building?', answer: selectedBriefType || 'Not answered' },
    { question: 'What should this build help achieve?', answer: selectedBriefGoals || 'Not answered' },
    { question: 'Which features must be included?', answer: selectedBriefFeatures || 'Not answered' },
    { question: 'Who will use it?', answer: selectedBriefAudience || 'Not answered' },
    { question: 'What does the client already have?', answer: selectedBriefMaterial || 'Not answered' },
    { question: 'What style direction did the client choose?', answer: selectedBriefStyle || 'Not answered' },
    { question: 'What budget should we plan around?', answer: selectedProjectRequest?.budget || 'Not specified' },
    { question: 'What timeline did the client give?', answer: selectedProjectRequest?.timeline || 'Not specified' },
    { question: 'Any existing link?', answer: selectedBriefLink || 'Not specified' },
    { question: 'Priority level', answer: selectedProjectRequest?.priority || 'normal' },
  ];
  const selectedClientNotes = selectedProjectRequest?.clientNotes?.trim() || '';
  const selectedAdminNotes = selectedProjectRequest?.adminNotes?.trim() || '';
  const selectedReviewFeedbackBlocks = selectedClientNotes
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(block => /Client requested staging changes|Client approved staging/i.test(block));
  const selectedLatestReviewFeedback = selectedReviewFeedbackBlocks[selectedReviewFeedbackBlocks.length - 1] || '';
  const selectedLatestReviewMessage = selectedLatestReviewFeedback
    .split('\n')
    .map(line => line.trim())
    .find(line => /^Client message:/i.test(line))
    ?.replace(/^Client message:\s*/i, '')
    .trim() || '';
  const selectedScopeDiscussionLines = selectedClientNotes
    .split('\n')
    .map(line => line.trim())
    .filter(line => {
      const value = line.toLowerCase();
      return value.startsWith('client message:') && !value.includes('brief clarification');
    })
    .map(line => line.replace(/^Client message:\s*/i, ''))
    .filter((line, index, lines) => line && lines.indexOf(line) === index);
  const hasScopeDiscussionRequest = selectedClientNotes.toLowerCase().includes('client wants to discuss the quote');
  const selectedClientResponseSource = [selectedClientNotes, selectedAdminNotes].find(note => {
    const value = note.toLowerCase();
    return value.includes('client sent brief clarification') || value.includes('client brief clarification') || value.includes('client message:');
  }) || '';
  const selectedClientResponseReceived = Boolean(selectedClientResponseSource);
  const isBriefApprovedForScope = Boolean(selectedProjectRequest && ['quote_ready', 'approved', 'payment_agreement', 'in_development', 'staging_review', 'launched', 'handoff', 'completed'].includes(selectedProjectRequest.status));
  const isScopeSentToClient = Boolean(selectedProjectRequest?.clientNotes?.toLowerCase().includes('scope sent'));
  const isScopeAccepted = selectedProjectRequest?.status === 'approved';
  const isAgreementSent = selectedProjectRequest?.status === 'payment_agreement';
  const isAgreementConfirmed = selectedProjectRequest?.paymentAgreementStatus === 'confirmed';
  const selectedAgreementCurrency = selectedProjectRequest?.quoteCurrency || selectedProjectRequest?.user?.defaultCurrency || 'USD';
  const selectedAgreementTotal = Number(agreementDraft.totalAgreedAmount || selectedProjectRequest?.totalAgreedAmount || selectedProjectRequest?.quotedAmount || 0);
  const selectedAgreementDueNow = Number(agreementDraft.depositAmount || selectedProjectRequest?.depositAmount || selectedAgreementTotal || 0);
  const selectedAgreementBalance = Math.max((selectedAgreementTotal || 0) - (selectedAgreementDueNow || 0), 0);
  const selectedAgreementDueNowLabel = formatCurrencyAmount(selectedAgreementCurrency, selectedAgreementDueNow);
  const selectedAgreementTotalLabel = formatCurrencyAmount(selectedAgreementCurrency, selectedAgreementTotal);
  const selectedAgreementBalanceLabel = selectedAgreementBalance ? formatCurrencyAmount(selectedAgreementCurrency, selectedAgreementBalance) : 'No balance';
  const selectedAgreementTypeLabel = agreementDraft.paymentAgreementType === 'deposit'
    ? 'Deposit payment'
    : agreementDraft.paymentAgreementType === 'full_payment'
      ? 'Full payment'
      : agreementDraft.paymentAgreementType === 'milestone_payments'
        ? 'Milestone payments'
        : 'Deposit payment';
  const selectedAgreementNote = agreementDraft.paymentInstructions
    ? agreementDraft.paymentInstructions.replace(/Deposit of [A-Z]{3}\s*[\d,]+(\.\d+)?/i, `Deposit of ${selectedAgreementDueNowLabel}`)
    : selectedAgreementDueNow
      ? `Deposit of ${selectedAgreementDueNowLabel} before development starts. Balance follows the agreed project terms.`
      : '';
  const isAgreementDraftDirty = Boolean(selectedProjectRequest) && (
    agreementDraft.paymentAgreementType !== (selectedProjectRequest.paymentAgreementType || '')
    || agreementDraft.paymentDueDate !== (selectedProjectRequest.paymentDueDate ? selectedProjectRequest.paymentDueDate.slice(0, 10) : '')
    || agreementDraft.totalAgreedAmount !== (selectedProjectRequest.totalAgreedAmount?.toString() || selectedProjectRequest.quotedAmount?.toString() || '')
    || agreementDraft.depositAmount !== (selectedProjectRequest.depositAmount?.toString() || '')
    || agreementDraft.paymentInstructions !== (selectedProjectRequest.paymentInstructions || '')
  );
  const selectedPaymentReference = selectedClientNotes.match(/Reference:\s*([^\n]+)/i)?.[1]?.trim() || '';
  const selectedPaymentConfirmedAt = selectedProjectRequest?.paymentConfirmedAt
    ? new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(selectedProjectRequest.paymentConfirmedAt))
    : '';
  const selectedClientResponseReceivedAt = selectedProjectRequest?.updatedAt
    ? new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(selectedProjectRequest.updatedAt))
    : 'Recently';
  const selectedClientResponseLines = selectedClientResponseReceived
    ? selectedClientResponseSource
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        const value = line.toLowerCase();
        return line && !value.includes('client sent brief clarification') && !value.includes('client brief clarification');
      })
      .map(line => line.replace(/^Client message:\s*/i, ''))
    : [];
  const selectedClientResponseRows = selectedClientResponseLines.flatMap((line) => {
    const [label, ...rest] = line.split(':');
    const answer = rest.join(':').trim();
    return label && answer ? [{ label: label.trim(), answer }] : [{ label: 'Client response', answer: line }];
  }).filter((row) => briefMissingOptions.some(option => option.toLowerCase() === row.label.toLowerCase()));
  const selectedClientResponseSections = [
    {
      title: 'Content',
      tone: 'text-ai-blue',
      icon: <Folder className="h-4 w-4" />,
      labels: ['Content/assets', 'Pages/sections', 'Services/products']
    },
    {
      title: 'Project direction',
      tone: 'text-expert-green',
      icon: <Activity className="h-4 w-4" />,
      labels: ['Feature scope', 'Audience/details', 'Lead form fields', 'Design references']
    },
    {
      title: 'Planning',
      tone: 'text-amber-300',
      icon: <Clock className="h-4 w-4" />,
      labels: ['Budget clarity', 'Timeline clarity']
    },
  ].map(section => ({
    ...section,
    rows: selectedClientResponseRows.filter(row => section.labels.some(label => label.toLowerCase() === row.label.toLowerCase()))
  })).filter(section => section.rows.length);
  const buildBriefClarificationMessage = () => {
    const missingText = briefMissingItems.length ? `Please clarify: ${briefMissingItems.join(', ')}.` : '';
    const noteText = briefClarificationMessage.trim();

    return [missingText, noteText].filter(Boolean).join('\n');
  };
  const handleRequestBriefMoreDetails = (id: string) => {
    const message = buildBriefClarificationMessage();
    if (!message) {
      setBriefDecisionMessage({
        type: 'error',
        text: 'Add a note or select missing items before requesting more detail.'
      });
      return;
    }

    handleUpdateProjectRequest(id, {
      status: 'in_review',
      clientNotes: message
    });
  };
  const handleSendScopeToClient = (request: ProjectRequest) => {
    if (!request.quotedAmount) {
      setBriefDecisionMessage({
        type: 'error',
        text: 'Add a quote amount before sending Scope to the client.'
      });
      return;
    }
    const note = scopeClientNote.trim() || 'Scope sent. Please review the offer, price, and delivery terms.';

    handleUpdateProjectRequest(request.id, {
      status: 'quote_ready',
      quoteCurrency: request.quoteCurrency || request.user?.defaultCurrency || 'USD',
      clientNotes: note
    });
  };

  const handleSendAgreementPaymentRequest = (request: ProjectRequest) => {
    handleUpdateProjectRequest(request.id, {
      status: 'payment_agreement',
      quoteCurrency: request.quoteCurrency || request.user?.defaultCurrency || 'USD',
      paymentAgreementStatus: 'sent',
      paymentAgreementType: agreementDraft.paymentAgreementType || 'deposit',
      paymentDueDate: agreementDraft.paymentDueDate || null,
      totalAgreedAmount: agreementDraft.totalAgreedAmount,
      depositAmount: agreementDraft.depositAmount,
      paymentInstructions: selectedAgreementNote
    });
  };

  const patchProjectRequestLocal = (requestId: string, updater: (request: ProjectRequest) => ProjectRequest) => {
    setProjectRequests(prev => prev.map(request => request.id === requestId ? updater(request) : request));
    setSelectedProjectRequestId(requestId);
  };

  const replaceProjectRequestLocal = (requestId: string, request: ProjectRequest) => {
    setProjectRequests(prev => {
      const exists = prev.some(item => item.id === requestId);
      return exists ? prev.map(item => item.id === requestId ? request : item) : [request, ...prev];
    });
    setSelectedProjectRequestId(requestId);
  };

  const handleUpdateProjectRequest = async (id: string, data: Record<string, unknown>) => {
    setSubmitting(true);
    setBriefDecisionMessage(null);
    patchProjectRequestLocal(id, request => ({ ...request, ...data, updatedAt: new Date().toISOString() } as ProjectRequest));
    try {
      const res = await apiClient.updateAdminProjectRequest(id, data) as { success: boolean; data?: ProjectRequest; message?: string };
      if (res.success) {
        if (!res.data) {
          throw new Error('Build request updated, but the server did not return the updated request.');
        }
        replaceProjectRequestLocal(id, res.data);
        const successText = data.status === 'quote_ready'
          ? 'Brief approved. Scope is now open for the client.'
          : data.status === 'payment_agreement'
            ? 'Payment agreement updated.'
            : data.status === 'in_development'
              ? 'Development started.'
              : 'Build request updated.';
        setBriefDecisionMessage({
          type: 'success',
          text: successText
        });
      } else {
        setBriefDecisionMessage({ type: 'error', text: res.message || 'The build request could not be updated.' });
      }
    } catch (error) {
      console.error('Failed to update build request:', error);
      setBriefDecisionMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update build request.' });
    } finally {
      setSubmitting(false);
    }
  };

  const fetchAdminReviewChat = useCallback(async (requestId: string) => {
    setReviewChatLoading(true);
    try {
      const res = await apiClient.getAdminReviewChat(requestId) as { success: boolean; data?: ReviewChatMessage[] };
      if (res.success) {
        setReviewChatMessages(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load review chat:', error);
    } finally {
      setReviewChatLoading(false);
    }
  }, []);

  useEffect(() => {
    setReviewChatMessages([]);
    setReviewChatDraft('');
    setReviewChatChoiceDraft('');
    if (selectedProjectRequestId && reviewChatOpen) {
      fetchAdminReviewChat(selectedProjectRequestId);
    }
  }, [fetchAdminReviewChat, reviewChatOpen, selectedProjectRequestId]);

  const handleSendAdminReviewChat = async () => {
    if (!selectedProjectRequestId || reviewChatSending) return;
    const message = reviewChatDraft.trim();
    const choices = reviewChatChoiceDraft
      .split(',')
      .map(choice => choice.trim())
      .filter(Boolean);
    if (!message && !choices.length) return;

    setReviewChatSending(true);
    try {
      const res = await apiClient.sendAdminReviewChat(selectedProjectRequestId, {
        message,
        kind: choices.length ? 'question' : 'message',
        choices
      }) as { success: boolean; data?: ReviewChatMessage; message?: string };
      if (res.success && res.data) {
        setReviewChatMessages(prev => prev.some(item => item.id === res.data?.id) ? prev : [...prev, res.data as ReviewChatMessage]);
        setReviewChatDraft('');
        setReviewChatChoiceDraft('');
        setReviewChatOpen(true);
      }
    } catch (error) {
      console.error('Failed to send review chat message:', error);
    } finally {
      setReviewChatSending(false);
    }
  };

  const applyStudioProjectResponse = (requestId: string, response: { success?: boolean; data?: ProjectRequest; message?: string }) => {
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Studio update failed.');
    }
    replaceProjectRequestLocal(requestId, response.data);
  };

  const handleCreateStudioTask = async (requestId: string) => {
    if (!studioTaskDraft.title.trim()) return;
    const optimisticTask: StudioTask = {
      id: `pending-task-${Date.now()}`,
      title: studioTaskDraft.title.trim(),
      area: studioTaskDraft.area,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    patchProjectRequestLocal(requestId, request => ({
      ...request,
      studioTasks: [optimisticTask, ...(request.studioTasks || [])],
      updatedAt: new Date().toISOString()
    }));
    setSubmitting(true);
    try {
      const res = await apiClient.createStudioTask(requestId, studioTaskDraft) as { success: boolean; data?: ProjectRequest; message?: string };
      applyStudioProjectResponse(requestId, res);
      setStudioTaskDraft({ title: '', area: studioTaskDraft.area });
    } catch (error) {
      console.error('Failed to create Studio task:', error);
      alert(error instanceof Error ? error.message : 'Failed to create Studio task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStudioTask = async (requestId: string, taskId: string, data: Record<string, unknown>) => {
    patchProjectRequestLocal(requestId, request => ({
      ...request,
      studioTasks: (request.studioTasks || []).map(task => task.id === taskId ? { ...task, ...data } as StudioTask : task),
      updatedAt: new Date().toISOString()
    }));
    setSubmitting(true);
    try {
      const res = await apiClient.updateStudioTask(requestId, taskId, data) as { success: boolean; data?: ProjectRequest; message?: string };
      applyStudioProjectResponse(requestId, res);
    } catch (error) {
      console.error('Failed to update Studio task:', error);
      alert(error instanceof Error ? error.message : 'Failed to update Studio task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStudioBlocker = async (requestId: string) => {
    if (!studioBlockerDraft.trim()) return;
    const optimisticBlocker: StudioBlocker = {
      id: `pending-blocker-${Date.now()}`,
      title: studioBlockerDraft.trim(),
      area: 'general',
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    patchProjectRequestLocal(requestId, request => ({
      ...request,
      studioBlockers: [optimisticBlocker, ...(request.studioBlockers || [])],
      updatedAt: new Date().toISOString()
    }));
    setSubmitting(true);
    try {
      const res = await apiClient.createStudioBlocker(requestId, { title: studioBlockerDraft, area: 'general' }) as { success: boolean; data?: ProjectRequest; message?: string };
      applyStudioProjectResponse(requestId, res);
      setStudioBlockerDraft('');
    } catch (error) {
      console.error('Failed to create Studio blocker:', error);
      alert(error instanceof Error ? error.message : 'Failed to create Studio blocker');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStudioBlocker = async (requestId: string, blockerId: string, data: Record<string, unknown>) => {
    patchProjectRequestLocal(requestId, request => ({
      ...request,
      studioBlockers: (request.studioBlockers || []).map(blocker => blocker.id === blockerId ? { ...blocker, ...data } as StudioBlocker : blocker),
      updatedAt: new Date().toISOString()
    }));
    setSubmitting(true);
    try {
      const res = await apiClient.updateStudioBlocker(requestId, blockerId, data) as { success: boolean; data?: ProjectRequest; message?: string };
      applyStudioProjectResponse(requestId, res);
    } catch (error) {
      console.error('Failed to update Studio blocker:', error);
      alert(error instanceof Error ? error.message : 'Failed to update Studio blocker');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStudioUpdate = async (requestId: string) => {
    if (!studioUpdateDraft.trim()) return;
    const optimisticUpdate: StudioUpdate = {
      id: `pending-update-${Date.now()}`,
      message: studioUpdateDraft.trim(),
      visibility: 'client',
      createdAt: new Date().toISOString(),
    };
    patchProjectRequestLocal(requestId, request => ({
      ...request,
      studioUpdates: [optimisticUpdate, ...(request.studioUpdates || [])],
      updatedAt: new Date().toISOString()
    }));
    setSubmitting(true);
    try {
      const res = await apiClient.createStudioUpdate(requestId, { message: studioUpdateDraft, visibility: 'client' }) as { success: boolean; data?: ProjectRequest; message?: string };
      applyStudioProjectResponse(requestId, res);
      setStudioUpdateDraft('');
    } catch (error) {
      console.error('Failed to publish Studio update:', error);
      alert(error instanceof Error ? error.message : 'Failed to publish Studio update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePreviewLink = async (requestId: string, url: string) => {
    if (!url.trim()) return;
    const cleanUrl = url.trim();
    const optimisticLink: StudioLink = {
      id: `pending-preview-${Date.now()}`,
      label: 'Staging preview',
      url: cleanUrl,
      type: 'preview',
      createdAt: new Date().toISOString(),
    };
    patchProjectRequestLocal(requestId, request => ({
      ...request,
      stagingUrl: cleanUrl,
      studioLinks: [optimisticLink, ...(request.studioLinks || []).filter(link => link.type !== 'preview')],
      updatedAt: new Date().toISOString()
    }));
    setSubmitting(true);
    try {
      const res = await apiClient.createStudioLink(requestId, { label: 'Staging preview', url: cleanUrl, type: 'preview' }) as { success: boolean; data?: ProjectRequest; message?: string };
      applyStudioProjectResponse(requestId, res);
    } catch (error) {
      console.error('Failed to save preview link:', error);
      alert(error instanceof Error ? error.message : 'Failed to save preview link');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearPreviewLink = async (requestId: string) => {
    patchProjectRequestLocal(requestId, request => ({
      ...request,
      stagingUrl: '',
      studioLinks: (request.studioLinks || []).map(link => link.type === 'preview' ? { ...link, url: '' } as StudioLink : link),
      updatedAt: new Date().toISOString()
    }));
    setSubmitting(true);
    try {
      let latestRequest: ProjectRequest | undefined;
      if (selectedPreviewLink?.id) {
        const linkRes = await apiClient.updateStudioLink(requestId, selectedPreviewLink.id, { url: '', label: selectedPreviewLink.label || 'Staging preview' }) as { success: boolean; data?: ProjectRequest; message?: string };
        if (!linkRes.success) throw new Error(linkRes.message || 'Failed to clear preview artifact');
        latestRequest = linkRes.data;
      }
      const requestRes = await apiClient.updateAdminProjectRequest(requestId, { stagingUrl: '' }) as { success: boolean; data?: ProjectRequest; message?: string };
      if (!requestRes.success || !requestRes.data) throw new Error(requestRes.message || 'Failed to clear preview link');
      latestRequest = requestRes.data || latestRequest;
      if (latestRequest) {
        setProjectRequests(prev => prev.map(request => request.id === requestId ? latestRequest as ProjectRequest : request));
        setSelectedProjectRequestId(requestId);
      }
    } catch (error) {
      console.error('Failed to clear preview link:', error);
      alert(error instanceof Error ? error.message : 'Failed to clear preview link');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStudioLink = async (requestId: string) => {
    if (!studioLinkDraft.label.trim() && !studioLinkDraft.url.trim()) return;
    const optimisticLink: StudioLink = {
      id: `pending-link-${Date.now()}`,
      type: studioLinkDraft.type,
      label: studioLinkDraft.label.trim() || studioLinkDraft.type.replace(/_/g, ' '),
      url: studioLinkDraft.url.trim(),
      createdAt: new Date().toISOString(),
    };
    patchProjectRequestLocal(requestId, request => ({
      ...request,
      studioLinks: [optimisticLink, ...(request.studioLinks || [])],
      updatedAt: new Date().toISOString()
    }));
    setSubmitting(true);
    try {
      const res = await apiClient.createStudioLink(requestId, {
        type: studioLinkDraft.type,
        label: studioLinkDraft.label.trim() || studioLinkDraft.type.replace(/_/g, ' '),
        url: studioLinkDraft.url.trim()
      }) as { success: boolean; data?: ProjectRequest; message?: string };
      applyStudioProjectResponse(requestId, res);
      setStudioLinkDraft({ type: studioLinkDraft.type, label: '', url: '' });
    } catch (error) {
      console.error('Failed to add Studio artifact:', error);
      alert(error instanceof Error ? error.message : 'Failed to add Studio artifact');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    router.push('/');
  };

  const tabs = [
    { id: 'dashboard', name: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'project-requests', name: 'Build Pipeline', shortName: 'Build', icon: <FileText className="w-4 h-4" /> },
    { id: 'review', name: 'Reviews & Approvals', shortName: 'Approvals', icon: <Eye className="w-4 h-4" /> },
    { id: 'milestones', name: 'Milestones', icon: <Activity className="w-4 h-4" /> },
    { id: 'health', name: 'Repair & Care', shortName: 'Care', icon: <Activity className="w-4 h-4" /> },
    { id: 'bookings', name: 'Grow / Bookings', shortName: 'Bookings', icon: <Clock className="w-4 h-4" /> },
    { id: 'users', name: 'Client Records', shortName: 'Clients', icon: <Users className="w-4 h-4" /> },
    { id: 'leads', name: 'Leads', icon: <Folder className="w-4 h-4" /> },
    { id: 'assessments', name: 'Assessments', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'subscriptions', name: 'Billing & Agreements', shortName: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'tickets', name: 'Tickets', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'live-support', name: 'Live Chat', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'comments', name: 'Comments', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'media', name: 'Media Library', shortName: 'Media', icon: <Folder className="w-4 h-4" /> },
    { id: 'blog', name: 'Blog', icon: <PenLine className="w-4 h-4" /> },
    { id: 'analytics', name: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'system', name: 'System Controls', shortName: 'System', icon: <Settings className="w-4 h-4" /> },
  ];
  const tabGroups = [
    {
      id: 'overview',
      label: 'Overview',
      accent: 'text-ai-blue',
      icon: <BarChart3 className="w-4 h-4" />,
      tabs: ['dashboard'],
    },
    {
      id: 'work',
      label: 'Work',
      accent: 'text-ai-blue',
      icon: <Layout className="w-4 h-4" />,
      tabs: ['project-requests', 'review', 'milestones', 'health', 'bookings'],
    },
    {
      id: 'clients',
      label: 'Clients',
      accent: 'text-expert-green',
      icon: <Users className="w-4 h-4" />,
      tabs: ['users', 'leads', 'assessments'],
    },
    {
      id: 'communication',
      label: 'Communication',
      accent: 'text-tech-purple',
      icon: <MessageSquare className="w-4 h-4" />,
      tabs: ['tickets', 'live-support', 'comments'],
    },
    {
      id: 'business',
      label: 'Business',
      accent: 'text-amber-300',
      icon: <CreditCard className="w-4 h-4" />,
      tabs: ['subscriptions', 'analytics'],
    },
    {
      id: 'content',
      label: 'Content',
      accent: 'text-ai-blue',
      icon: <PenLine className="w-4 h-4" />,
      tabs: ['media', 'blog'],
    },
    {
      id: 'system',
      label: 'System',
      accent: 'text-white/70',
      icon: <Settings className="w-4 h-4" />,
      tabs: ['system'],
    },
  ];
  const currentTab = tabs.find(t => t.id === activeTab);
  const currentGroup = tabGroups.find(group => group.tabs.includes(activeTab)) || tabGroups[0];
  const openAdminTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false);
    setMobileRailGroup(null);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/admin/${tabId}`);
    }
  };

  return (
    <div className="flex h-screen bg-[#05070a] text-white selection:bg-ai-blue/30 overflow-hidden font-sans relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {mobileRailGroup && (
        <button
          type="button"
          className="fixed inset-0 z-[70] bg-transparent lg:hidden"
          aria-label="Close mobile navigation"
          onClick={() => setMobileRailGroup(null)}
        />
      )}

      <nav className={`fixed left-0 top-1/2 z-[80] flex -translate-y-1/2 flex-col gap-4 py-3 transition-[width,padding] duration-200 lg:hidden ${
        mobileRailGroup ? 'w-64 px-2' : 'w-9 px-0'
      }`}>
        {tabGroups.map((group) => {
          const isGroupActive = group.tabs.includes(activeTab);
          const isRailOpen = mobileRailGroup === group.id;

          return (
            <div key={group.id} className="relative">
              <button
                type="button"
                onClick={() => {
                  if (group.tabs.length === 1) {
                    openAdminTab(group.tabs[0]);
                    return;
                  }
                  setMobileRailGroup(isRailOpen ? null : group.id);
                }}
                className={`grid h-11 w-9 shrink-0 place-items-center transition ${
                  isGroupActive || isRailOpen
                    ? group.accent
                    : 'text-white/66 hover:text-white'
                }`}
                aria-label={group.label}
              >
                {group.icon}
              </button>

              {isRailOpen && (
                <div className="mt-2 w-full pl-10 py-1">
                  <p className={`text-[9px] font-black uppercase tracking-[0.22em] ${group.accent}`}>
                    {group.label}
                  </p>
                  <div className="mt-5 grid gap-1">
                    {group.tabs.map((tabId) => {
                      const tab = tabs.find(item => item.id === tabId);
                      if (!tab) return null;

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => openAdminTab(tab.id)}
                          className={`group flex min-h-12 w-fit max-w-full items-center gap-3 py-3 text-left transition ${
                            activeTab === tab.id
                              ? 'text-white'
                              : 'text-white/52 hover:text-white'
                          }`}
                        >
                          <span className={activeTab === tab.id ? 'text-ai-blue' : 'text-white/34'}>{tab.icon}</span>
                          <span className="min-w-0 border-b border-white/16 pb-1 text-sm font-black tracking-tight transition group-hover:border-white/34">
                            {tab.shortName || tab.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-80 bg-[#05070a]/96 backdrop-blur-2xl lg:bg-[#05070a] border-r border-white/10 flex flex-col z-[110] lg:z-20 transform transition-[width,transform] duration-300 lg:relative lg:translate-x-0 ${isSidebarExpanded ? 'lg:w-80' : 'lg:w-20'} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`border-b border-white/10 px-3 py-4 ${isSidebarExpanded ? '' : 'lg:px-3'}`}>
          <div className={`flex items-center gap-3 ${isSidebarExpanded ? 'justify-between' : 'lg:justify-center'}`}>
          <button
            type="button"
            onClick={() => openAdminTab('dashboard')}
            className={`group flex min-w-0 items-center gap-3 px-2 py-2 text-left transition hover:bg-white/[0.04] ${isSidebarExpanded ? 'flex-1' : 'lg:w-0 lg:overflow-hidden lg:opacity-0'}`}
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center bg-white text-[#05070a]">
              <Layout className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-black tracking-tight text-white">Sitemendr</h2>
              <p className="mt-1 truncate text-[10px] font-semibold text-white/42">Admin operations</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setIsSidebarExpanded(value => !value)}
            className="hidden h-10 w-10 shrink-0 place-items-center text-white/52 transition hover:bg-white/[0.06] hover:text-white lg:grid"
            aria-label={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isSidebarExpanded ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
          <div className="space-y-2">
            {tabGroups.map((group) => {
              const isGroupActive = group.tabs.includes(activeTab);
              const isOpen = openSidebarGroup === group.id || isGroupActive;

              return (
                <div key={group.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (group.tabs.length === 1) {
                        openAdminTab(group.tabs[0]);
                        setOpenSidebarGroup(group.id);
                      } else {
                        setOpenSidebarGroup(isOpen && !isGroupActive ? null : group.id);
                      }
                    }}
                    className={`group/nav flex min-h-12 w-full items-center gap-3 px-3 py-2.5 text-left transition ${isSidebarExpanded ? '' : 'lg:justify-center'} ${
                      isGroupActive
                        ? 'bg-white/[0.065] text-white'
                        : 'text-white/52 hover:bg-white/[0.045] hover:text-white'
                    }`}
                  >
                    <span className={`grid h-8 w-8 shrink-0 place-items-center ${isGroupActive ? group.accent : 'text-white/38 group-hover/nav:text-white/72'}`}>
                      {group.icon}
                    </span>
                    <span className={`min-w-0 flex-1 ${isSidebarExpanded ? '' : 'lg:hidden'}`}>
                      <span className="block truncate text-[13px] font-black tracking-tight">{group.label}</span>
                    </span>
                    {group.tabs.length > 1 && isSidebarExpanded && (
                      <ChevronRight className={`h-4 w-4 shrink-0 text-white/30 transition ${isOpen ? 'rotate-90 text-white/58' : ''}`} />
                    )}
                  </button>

                  {group.tabs.length > 1 && isOpen && isSidebarExpanded && (
                    <div className="ml-7 space-y-1 border-l border-white/[0.08] pl-3">
                      {group.tabs.map((tabId) => {
                        const tab = tabs.find(item => item.id === tabId);
                        if (!tab) return null;

                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => openAdminTab(tab.id)}
                            className={`flex min-h-9 w-full items-center gap-3 px-3 py-2 text-left transition ${
                              activeTab === tab.id
                                ? 'bg-ai-blue/12 text-white'
                                : 'text-white/44 hover:bg-white/[0.04] hover:text-white'
                            }`}
                          >
                            <span className={activeTab === tab.id ? 'text-ai-blue' : 'text-white/30'}>
                              {tab.icon}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[12px] font-semibold tracking-tight">{tab.shortName || tab.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-[12px] font-semibold text-white/46 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <span>Sign out</span>
            <span className="text-red-300">Exit</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`relative z-10 flex flex-1 flex-col overflow-hidden transition-[padding] duration-200 lg:pl-0 ${
        mobileRailGroup ? 'pl-64' : 'pl-10'
      }`}>
        {activeTab !== 'project-requests' && (
          <header className="flex min-h-16 items-center justify-between gap-4 border-b border-white/10 bg-[#05070a]/95 px-4 py-3 lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              {activeTab !== 'dashboard' && (
                <div className="min-w-0">
                  <p className={`text-[9px] font-black uppercase tracking-[0.18em] ${currentGroup.accent}`}>{currentGroup.label}</p>
                  <h1 className="truncate text-base font-black tracking-tight text-white lg:text-lg">
                    {currentTab?.name || 'Admin'}
                  </h1>
                </div>
              )}
            </div>
          </header>
        )}

        <main className={`relative flex-1 overflow-y-auto custom-scrollbar ${
          activeTab === 'project-requests' ? 'p-0' : 'p-4 sm:p-6 lg:p-7'
        }`}>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            {loading ? (
              <div className="flex h-80 items-center justify-center border-y border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/34">
                Loading admin overview...
              </div>
            ) : stats ? (
              <div className="space-y-5">
                <section className="grid gap-px overflow-hidden bg-white/10 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: 'Build', value: stats.totalAssessments, detail: 'intake records', tab: 'project-requests', icon: <FileText className="h-5 w-5" />, accent: 'text-ai-blue' },
                    { label: 'Clients', value: stats.totalUsers, detail: `${stats.totalLeads} leads`, tab: 'users', icon: <Users className="h-5 w-5" />, accent: 'text-expert-green' },
                    { label: 'Billing', value: stats.revenue?.total ? `$${stats.revenue.total.toLocaleString()}` : '$0', detail: `${stats.subscriptions?.active || 0} active sites`, tab: 'subscriptions', icon: <CreditCard className="h-5 w-5" />, accent: 'text-amber-300' },
                    { label: 'Support', value: stats.subscriptions?.suspended || 0, detail: 'suspended sites', tab: 'tickets', icon: <MessageSquare className="h-5 w-5" />, accent: 'text-tech-purple' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => openAdminTab(item.tab)}
                      className="group min-h-[168px] bg-[#05070a] p-5 text-left transition hover:bg-white/[0.035]"
                    >
                      <div className="flex items-start justify-between gap-5">
                        <span className={item.accent}>{item.icon}</span>
                        <ChevronRight className="h-4 w-4 text-white/24 transition group-hover:translate-x-0.5 group-hover:text-white/70" />
                      </div>
                      <p className="mt-8 text-[11px] font-black uppercase tracking-[0.16em] text-white/34">{item.label}</p>
                      <p className="mt-2 text-3xl font-black tracking-tight text-white">{item.value}</p>
                      <p className="mt-2 text-sm font-semibold text-white/42">{item.detail}</p>
                    </button>
                  ))}
                </section>

                <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <div className="grid gap-px overflow-hidden bg-white/10 sm:grid-cols-2">
                    {[
                      { label: 'Conversion', value: stats.conversionRate },
                      { label: 'Assessments', value: stats.totalAssessments },
                      { label: 'Leads', value: stats.totalLeads },
                      { label: 'Clients', value: stats.totalUsers },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-[#05070a] px-5 py-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/28">{stat.label}</p>
                        <p className="mt-3 text-2xl font-black tracking-tight text-white">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-y border-white/10 py-5">
                    <div className="mb-5 flex items-center justify-between gap-4 px-1">
                      <h3 className="text-sm font-black text-white">30 day activity</h3>
                      <div className="flex gap-4 text-[10px] font-semibold text-white/42">
                        <span className="flex items-center gap-2"><span className="h-2 w-2 bg-ai-blue"></span>Clients</span>
                        <span className="flex items-center gap-2"><span className="h-2 w-2 bg-expert-green"></span>Leads</span>
                      </div>
                    </div>
                    {(stats.userGrowth?.length > 0 || stats.leadGrowth?.length > 0) ? (
                      <div className="flex h-40 items-end gap-1">
                        {(stats.userGrowth || []).slice(-30).map((day, i) => {
                          const leadDay = stats.leadGrowth?.[i] || { count: 0 };
                          const maxCount = Math.max(
                            ...stats.userGrowth.map(d => d.count),
                            ...stats.leadGrowth.map(d => d.count),
                            1
                          );

                          return (
                            <div key={`${day.date}-${i}`} className="flex h-full flex-1 flex-col justify-end gap-[2px]">
                              <div className="w-full bg-expert-green/55" style={{ height: `${(leadDay.count / maxCount) * 100}%` }} />
                              <div className="w-full bg-ai-blue/60" style={{ height: `${(day.count / maxCount) * 100}%` }} />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex h-40 items-center justify-center text-sm text-white/34">No growth data yet.</div>
                    )}
                  </div>
                </section>

                <section className="grid gap-5 lg:grid-cols-2">
                  {[
                    {
                      title: 'Leads',
                      tab: 'leads',
                      empty: 'No recent leads.',
                      rows: stats.recentLeads?.slice(0, 5).map((lead, index) => ({
                        key: lead.id || String(index),
                        title: lead.name,
                        meta: lead.email,
                        side: lead.status,
                      })) || [],
                    },
                    {
                      title: 'Assessments',
                      tab: 'assessments',
                      empty: 'No recent assessments.',
                      rows: stats.recentAssessments?.slice(0, 5).map((assessment, index) => ({
                        key: assessment.id || String(index),
                        title: 'Assessment',
                        meta: (assessment.id || '').slice(-8).toUpperCase(),
                        side: new Date(assessment.createdAt).toLocaleDateString(),
                      })) || [],
                    },
                  ].map((table) => (
                    <div key={table.title} className="border-y border-white/10">
                      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                        <h3 className="text-sm font-black text-white">{table.title}</h3>
                        <button type="button" onClick={() => openAdminTab(table.tab)} className="text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue">Open</button>
                      </div>
                      <div className="divide-y divide-white/10">
                        {table.rows.length ? table.rows.map((row) => (
                          <div key={row.key} className="grid min-h-14 grid-cols-[1fr_7rem] items-center gap-4 px-4 py-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">{row.title}</p>
                              <p className="mt-1 truncate text-xs text-white/36">{row.meta}</p>
                            </div>
                            <span className="text-right text-[10px] font-black uppercase tracking-[0.12em] text-white/42">{row.side}</span>
                          </div>
                        )) : (
                          <div className="px-4 py-8 text-sm text-white/34">{table.empty}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </section>
              </div>
            ) : (
              <div className="flex h-80 items-center justify-center border-y border-white/10 text-sm text-white/34">
                No overview data available.
              </div>
            )}
          </div>
        )}

        {/* Blog Management Tab */}
        {activeTab === 'blog' && (
          <div className="animate-fade-in">
            <BlogEditor />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-10 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-tech-purple uppercase tracking-[0.3em] mb-1">Intelligence_Core</span>
                <h2 className="text-sm font-black tracking-widest flex items-center gap-3 uppercase">
                  <span className="w-1.5 h-6 bg-tech-purple rounded-full"></span>
                  Advanced Intelligence
                </h2>
              </div>
              <div className="flex gap-3">
                <select className="bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-[9px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors text-medium-gray">
                  <option className="bg-darker-bg">WINDOW: 7D</option>
                  <option className="bg-darker-bg">WINDOW: 30D</option>
                  <option className="bg-darker-bg">WINDOW: 90D</option>
                </select>
                <button className="px-6 py-2.5 bg-expert-green/10 border border-expert-green/20 text-expert-green font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-expert-green hover:text-white transition-all flex items-center gap-2">
                  <span>???</span> EXPORT DATASET
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Traffic_Flow', metrics: [
                  { label: 'Ingress Views', value: analytics?.assessments?.total || '0', trend: `${analytics?.assessments?.conversionRate || 0}% CONV` },
                  { label: 'Nodes', value: analytics?.users?.total || '0', trend: `+${analytics?.users?.new || 0} NEW` },
                  { label: 'Active Users', value: analytics?.users?.active || '0', trend: (userGrowthTrend != null ? `${userGrowthTrend}%` : 'N/A') }
                ], icon: '🌐', data: analytics?.assessments?.trends || [] },
                { title: 'Resource_Revenue', metrics: [
                  { label: 'Gross Credits', value: `${analytics?.revenue?.total || 0}`, trend: (revenueGrowthTrend != null ? `${revenueGrowthTrend}%` : 'N/A') },
                  { label: 'Avg Unit Val', value: `${analytics?.revenue?.averageOrderValue || 0}`, trend: 'N/A' },
                  { label: 'Conv Index', value: `${analytics?.leads?.conversionRate || 0}%`, trend: 'N/A' }
                ], icon: '💰', data: analytics?.revenue?.trends || [] },
                { title: 'Predictions', metrics: [
                  { label: 'Forecast Users', value: analytics?.predictions?.nextWeekUsers ?? 'N/A', trend: 'N/A' },
                  { label: 'Forecast Revenue', value: analytics?.predictions?.nextWeekRevenue != null ? `${analytics.predictions.nextWeekRevenue}` : 'N/A', trend: 'N/A' },
                  { label: 'Conv Rate', value: analytics?.predictions?.nextWeekConversionRate != null ? `${analytics.predictions.nextWeekConversionRate}%` : 'N/A', trend: 'N/A' }
                ], icon: '🔮', data: analytics?.users?.growth || [] }
              ].map((card, i) => (
                <div key={i} className="bg-white/[0.01] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.02] transition-all duration-300 relative overflow-hidden group flex flex-col">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-black">{card.icon}</span>
                  </div>
                  <div className="flex items-center gap-4 mb-8">
                    <h3 className="font-black text-xs tracking-widest uppercase text-ai-blue">{card.title}</h3>
                  </div>
                  
                  <div className="space-y-6 flex-1">
                    {card.metrics.map((m, mi) => (
                      <div key={mi} className="flex justify-between items-end border-b border-white/[0.03] pb-4 last:border-0 last:pb-0">
                        <div>
                          <p className="text-[8px] font-black text-medium-gray uppercase tracking-widest mb-1">{m.label}</p>
                          <p className="text-sm font-black tracking-widest">{m.value}</p>
                        </div>
                        <span className={`text-[8px] font-black px-2 py-1 rounded border ${
                          m.trend.startsWith('+') || m.trend === 'HIGH' || m.trend === 'OPT' || m.trend === 'STABLE' 
                          ? 'text-expert-green border-expert-green/20 bg-expert-green/5' 
                          : 'text-medium-gray border-white/10 bg-white/5'
                        }`}>
                          {m.trend}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Sparkline visualization */}
                  {card.data && card.data.length > 0 && (
                    <div className="mt-8 h-12 w-full flex items-end gap-[2px]">
                      {card.data.slice(-20).map((d, di) => {
                        const val = (d as { count?: number; revenue?: number; total?: number; amount?: number }).count || 
                                    (d as { count?: number; revenue?: number; total?: number; amount?: number }).revenue || 
                                    (d as { count?: number; revenue?: number; total?: number; amount?: number }).total || 
                                    (d as { count?: number; revenue?: number; total?: number; amount?: number }).amount || 0;
                        const max = Math.max(...card.data.map((x) => 
                          (x as { count?: number; revenue?: number; total?: number; amount?: number }).count || 
                          (x as { count?: number; revenue?: number; total?: number; amount?: number }).revenue || 
                          (x as { count?: number; revenue?: number; total?: number; amount?: number }).total || 
                          (x as { count?: number; revenue?: number; total?: number; amount?: number }).amount || 1
                        ));
                        return (
                          <div 
                            key={di} 
                            className={`flex-1 rounded-t-[1px] transition-all duration-500 ${i === 0 ? 'bg-ai-blue/30' : i === 1 ? 'bg-expert-green/30' : 'bg-tech-purple/30'}`}
                            style={{ height: `${Math.max((val / max) * 100, 10)}%` }}
                          ></div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-white/[0.01] border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-ai-blue/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="absolute top-0 left-0 p-4">
                <span className="text-[7px] font-black text-ai-blue uppercase tracking-[0.4em]">AI Recommendations</span>
              </div>
              <h3 className="text-sm font-black mb-8 flex items-center gap-3 uppercase tracking-widest mt-4">
                <span className="text-ai-blue">???</span> AI Strategic Recommendations
              </h3>
              <div className="grid md:grid-cols-2 gap-4 relative z-10">
                {analytics?.predictions?.recommendations?.length > 0 ? (
                  analytics.predictions.recommendations.map((rec: Recommendation, i: number) => (
                    <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl group-hover:border-white/10 transition-all">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 w-2 h-2 rounded-full shadow-[0_0_10px_rgba(0,102,255,0.4)] ${
                          rec.type === 'warning' ? 'bg-red-500' : 
                          rec.type === 'success' ? 'bg-expert-green' : 'bg-ai-blue'
                        } animate-pulse`}></div>
                        <div>
                          <p className="font-black text-[11px] uppercase tracking-tight mb-2">{rec.category.replace('_', ' ')}</p>
                          <p className="text-[9px] text-medium-gray font-bold uppercase tracking-tight leading-relaxed opacity-70">{rec.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <p className="text-[9px] text-medium-gray font-black uppercase tracking-widest text-center">Analyzing...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="animate-fade-in">
            <BookingManager isAdmin={true} />
          </div>
        )}

        {/* Leads Management Tab */}
        {activeTab === 'leads' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
              <div className="flex flex-col">
                <h2 className="text-lg font-black tracking-tighter uppercase flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-expert-green rounded-full"></span>
                  Lead Management Matrix
                </h2>
                <span className="text-[8px] font-black text-medium-gray uppercase tracking-[0.2em] mt-1">TOTAL_RECORDS: {leads.length}</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <input 
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors flex-1 md:w-64"
                />
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors"
                >
                  <option value="ALL">ALL_STATUS</option>
                  <option value="new">NEW</option>
                  <option value="contacted">CONTACTED</option>
                  <option value="qualified">QUALIFIED</option>
                  <option value="converted">CONVERTED</option>
                  <option value="lost">LOST</option>
                </select>
              </div>
            </div>
            
            <div className="bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Name/Email</th>
                      <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Source</th>
                      <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Status</th>
                      <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Assigned</th>
                      <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {leads
                      .filter(l => 
                        (filterStatus === 'ALL' || l.status === filterStatus) &&
                        (l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.email.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .map((lead, index) => (
                      <tr key={lead.id || index} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-5">
                          <p className="text-[11px] font-black tracking-tight uppercase">{lead.name}</p>
                          <p className="text-[9px] text-medium-gray font-medium tracking-tighter uppercase">{lead.email}</p>
                        </td>
                        <td className="p-5">
                          <span className="text-[8px] font-black text-ai-blue uppercase tracking-widest block">{lead.source?.replace('_', ' ') || 'DIRECT'}</span>
                          {!!lead.sourceDetails?.subject && (
                            <span className="text-[7px] text-medium-gray uppercase tracking-tighter opacity-50 block mt-0.5">{lead.sourceDetails.subject as string}</span>
                          )}
                        </td>
                        <td className="p-5">
                          <span className={`px-2 py-0.5 text-[7px] font-black uppercase tracking-widest rounded border ${
                            lead.status.toLowerCase() === 'new' ? 'bg-expert-green/10 border-expert-green/20 text-expert-green' :
                            lead.status.toLowerCase() === 'contacted' ? 'bg-ai-blue/10 border-ai-blue/20 text-ai-blue' :
                            'bg-white/5 border-white/10 text-medium-gray'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="p-5">
                          <p className="text-[9px] font-black uppercase tracking-widest text-medium-gray">
                            {typeof lead.assignedTo === 'object' && lead.assignedTo !== null ? (lead.assignedTo as { name: string }).name : (lead.assignedTo || 'UNASSIGNED')}
                          </p>
                        </td>
                        <td className="p-5">
                          <select 
                            value={lead.status}
                            onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors text-ai-blue"
                          >
                            <option value="new">NEW</option>
                            <option value="contacted">CONTACTED</option>
                            <option value="qualified">QUALIFIED</option>
                            <option value="converted">CONVERTED</option>
                            <option value="lost">LOST</option>
                          </select>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => window.location.href = `mailto:${lead.email}`}
                              className="text-[9px] font-black uppercase tracking-[0.2em] text-ai-blue hover:text-white transition-colors"
                            >
                              ENGAGE
                            </button>
                            <button 
                              onClick={async () => {
                                if (confirm('Permanently delete this lead?')) {
                                  try {
                                    await apiClient.deleteLead(lead.id);
                                    fetchData();
                                  } catch (error) {
                                    console.error('Failed to delete lead:', error);
                                  }
                                }
                              }}
                              className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500 hover:text-white transition-colors"
                            >
                              DELETE
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
              <div className="flex flex-col">
                <h2 className="text-lg font-black tracking-tighter uppercase flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-ai-blue rounded-full"></span>
                  User Directory
                </h2>
                <span className="text-[8px] font-black text-medium-gray uppercase tracking-[0.2em] mt-1">ACTIVE_NODES: {users.length}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <input 
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors flex-1 md:w-64"
                />
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors"
                >
                  <option value="ALL">ALL_ROLES</option>
                  <option value="user">USER</option>
                  <option value="manager">MANAGER</option>
                  <option value="admin">ADMIN</option>
                </select>
              </div>
            </div>
            
            <div className="bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">User Identification</th>
                      <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Role</th>
                      <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Access Level</th>
                      <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users
                      .filter(u => 
                        (filterStatus === 'ALL' || u.role === filterStatus) &&
                        (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .map((user, index) => (
                      <tr key={user.id || index} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-5">
                          <p className="text-[11px] font-black tracking-tight uppercase">{user.name}</p>
                          <p className="text-[9px] text-medium-gray font-medium tracking-tighter uppercase">{user.email}</p>
                        </td>
                        <td className="p-5">
                          <select 
                            value={user.role}
                            onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors text-ai-blue"
                          >
                            <option value="user">USER</option>
                            <option value="manager">MANAGER</option>
                            <option value="admin">ADMIN</option>
                          </select>
                        </td>
                        <td className="p-5">
                          <p className="text-[9px] font-black uppercase tracking-widest text-ai-blue">SEC_LVL_0{user.role === 'admin' ? '1' : '2'}</p>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleToggleUserBan(user.id, user.banned)}
                              className={`px-2 py-0.5 text-[7px] font-black uppercase tracking-widest rounded border transition-colors ${
                                user.banned ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-expert-green/10 border-expert-green/20 text-expert-green hover:bg-expert-green hover:text-white'
                              }`}
                            >
                              {user.banned ? 'BANNED' : 'ACTIVE'}
                            </button>
                            <button 
                              onClick={async () => {
                                if (confirm('Permanently delete this user? This action cannot be undone.')) {
                                  try {
                                    await apiClient.deleteUser(user.id);
                                    fetchData();
                                  } catch (error) {
                                    console.error('Failed to delete user:', error);
                                  }
                                }
                              }}
                              className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500 hover:text-white transition-colors"
                            >
                              DELETE
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="space-y-6 animate-fade-in">
            {selectedSubscriptionForEditor ? (
              <div className="space-y-4">
                <button 
                  onClick={() => setSelectedSubscriptionForEditor(null)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-ai-blue hover:text-white transition-all mb-4"
                >
                  <span>???</span> BACK_TO_LIST
                </button>
                <TemplateEditor 
                  subscriptionId={selectedSubscriptionForEditor} 
                  onClose={() => setSelectedSubscriptionForEditor(null)}
                />
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
                  <div className="flex flex-col">
                    <h2 className="text-lg font-bold tracking-tight uppercase flex items-center gap-3">
                      <span className="w-1.5 h-6 bg-tech-purple rounded-full"></span>
                      Site Management
                    </h2>
                    <span className="text-[8px] font-bold text-medium-gray uppercase tracking-[0.2em] mt-1">ACTIVE_DEPLOYMENTS: {subscriptions.length}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <input 
                      type="text"
                      placeholder="Search nodes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors flex-1 md:w-64"
                    />
                    <select 
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors"
                    >
                      <option value="ALL">ALL_PLANS</option>
                      <option value="ai_foundation">AI_FOUNDATION</option>
                      <option value="pro_enhancement">PRO_ENHANCEMENT</option>
                      <option value="enterprise">ENTERPRISE</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {subscriptions
                    .filter(sub => 
                      (filterStatus === 'ALL' || sub.planType === filterStatus) &&
                      ((sub.customName || sub.siteName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                       (sub.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (sub.id || '').toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map((sub, index) => (
                    <div key={sub.id || index} className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl flex flex-wrap justify-between items-center gap-10 group hover:border-white/10 transition-all">
                      <div className="flex-1 min-w-[280px]">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[8px] font-black text-ai-blue uppercase tracking-[0.3em]">ID {(sub.id || '').slice(0, 8)}</span>
                          <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${
                            sub.status === 'ACTIVE' ? 'bg-expert-green/20 text-expert-green' : 'bg-red-500/20 text-red-500'
                          }`}>{sub.status}</span>
                        </div>
                          <h3 className="text-xl font-black uppercase tracking-tight mb-2">
                            {sub.customName || sub.siteName}
                            {!sub.isCurrent && (
                              <span className="ml-3 px-2 py-0.5 bg-white/5 border border-white/10 text-white/30 text-[7px] font-black rounded uppercase tracking-widest">
                                Previous
                              </span>
                            )}
                          </h3>
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] text-medium-gray font-black uppercase tracking-widest">Client:</span>
                            <span className="text-[9px] font-black uppercase">{sub.user?.name || 'GUEST'}</span>
                          </div>
                          <div className="w-[1px] h-3 bg-white/5"></div>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] text-medium-gray font-black uppercase tracking-widest">Plan:</span>
                            <span className="text-[9px] font-black text-ai-blue uppercase">{sub.planType}</span>
                          </div>
                        </div>
                        {sub.purchasedAddons && sub.purchasedAddons.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {sub.purchasedAddons.map((addon: Addon, idx: number) => (
                              <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-expert-green/5 border border-expert-green/10 rounded-lg">
                                <ShoppingBag className="w-2.5 h-2.5 text-expert-green" />
                                <span className="text-[7px] font-black uppercase text-expert-green">{addon.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-12">
                        <div className="text-right">
                          <p className="text-[7px] font-black text-medium-gray uppercase tracking-widest mb-1">Billing_State</p>
                          <p className={`text-[10px] font-black uppercase ${sub.paymentStatus === 'PAID' ? 'text-expert-green' : 'text-orange-500'}`}>
                            {sub.paymentStatus}
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleTriggerAIGeneration(sub.id)}
                            disabled={isSystemWorking}
                            className="px-6 py-3 bg-ai-blue text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-ai-blue/20 disabled:opacity-50"
                          >
                            {isSystemWorking ? 'PROCESSING...' : 'INITIALIZE_AI'}
                          </button>
                          <button 
                            onClick={() => handleSuspendSubscription(sub.id, sub.status)}
                            className={`px-6 py-3 border text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all ${
                              sub.status === 'SUSPENDED' 
                                ? 'bg-expert-green/20 border-expert-green text-expert-green' 
                                : 'bg-red-500/10 border-red-500/30 text-red-500'
                            }`}
                          >
                            {sub.status === 'SUSPENDED' ? 'UNSUSPEND' : 'SUSPEND'}
                          </button>
                          <button 
                            onClick={() => handleDeleteSubscription(sub.id)}
                            className="p-3 bg-white/5 border border-white/10 text-white hover:bg-red-500/20 hover:border-red-500/50 rounded-xl transition-all"
                            title="DELETE NODE"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setSelectedSubscriptionForEditor(sub.id)}
                            className="px-6 py-3 border border-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all flex items-center gap-2"
                          >
                            <Layout className="w-3 h-3" />
                            REFINE
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Build Requests Tab */}
        {activeTab === 'project-requests' && (
          <div className="animate-fade-in">
            {!selectedProjectRequestId && selectedBuildOperatorView && (
            <div className="mb-6">
              <div className="px-5 pb-5 pt-1 lg:px-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <button
                      type="button"
                      onClick={() => setBuildOperatorView('overview')}
                      className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center text-white/42 transition hover:text-white"
                      aria-label="Back to operator queue"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="min-w-0">
                      <h2 className="text-xl font-black tracking-tight text-white lg:text-2xl">
                        {selectedBuildOperatorView.label}
                      </h2>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 pl-12 lg:pl-0">
                    {previousBuildOperatorView && (
                      <button
                        type="button"
                        onClick={() => setBuildOperatorView(previousBuildOperatorView.id)}
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-expert-green transition hover:text-expert-green/80"
                        aria-label="Previous build room"
                      >
                        <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                        {previousBuildOperatorView.label}
                      </button>
                    )}
                    <label className="group inline-flex h-8 min-w-[11rem] items-center gap-2 text-white/70 transition focus-within:text-white">
                      <Search className="h-3.5 w-3.5 shrink-0" />
                      <input
                        type="text"
                        placeholder={`Search ${selectedBuildOperatorView.label.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label={`Search ${selectedBuildOperatorView.label}`}
                        className="w-full bg-transparent text-[10px] font-black uppercase tracking-[0.14em] text-white/90 outline-none placeholder:text-white/45 focus:text-white"
                      />
                    </label>
                    {nextBuildOperatorView && (
                      <button
                        type="button"
                        onClick={() => setBuildOperatorView(nextBuildOperatorView.id)}
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-amber-300 transition hover:text-amber-200"
                        aria-label="Next build room"
                      >
                        {nextBuildOperatorView.label}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}

            {loading ? (
              <div className="flex h-80 items-center justify-center border-y border-white/10 text-[10px] font-black uppercase tracking-[0.24em] text-white/32">
                Loading build requests...
              </div>
            ) : projectRequests.length === 0 ? (
              <div className="flex h-80 flex-col items-center justify-center border-y border-white/10 text-center">
                <FileText className="mb-5 h-10 w-10 text-white/18" />
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/38">No build requests yet</p>
              </div>
            ) : !selectedProjectRequestId && !selectedBuildOperatorView ? (
              <div className="space-y-5">
                <div className="grid gap-px overflow-hidden bg-white/10 md:grid-cols-2 xl:grid-cols-4">
                  {buildOperatorCards.map((lane) => (
                    <button
                      key={lane.label}
                      type="button"
                      onClick={() => setBuildOperatorView(lane.id)}
                      className="min-h-40 bg-[#05070a] px-5 py-5 text-left transition hover:bg-white/[0.035]"
                    >
                      <div className="flex items-start justify-between gap-5">
                        <span className="text-3xl font-black tracking-tight text-white">{lane.requests.length}</span>
                        <ChevronRight className="h-4 w-4 text-white/24" />
                      </div>
                      <p className="mt-8 text-[10px] font-black uppercase tracking-[0.16em] text-white/52">{lane.label}</p>
                      <p className="mt-2 text-xs leading-6 text-white/38">{lane.detail}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : !selectedProjectRequestId && selectedBuildOperatorView ? (
              <div>
                <div className="flex items-center justify-between gap-4 px-5 py-4 lg:px-8">
                  <div>
                    <h3 className="text-sm font-black text-white">{selectedBuildOperatorView.label}</h3>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/34">
                    {filteredProjectRequests.length} record{filteredProjectRequests.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div>
                  {filteredProjectRequests
                    .map((request) => {
                      const rowChapter = getAdminBuildChapter(request.status);
                      const rowProgress = getAdminBuildProgress(request.status);
                      const rowClientResponseSource = `${request.clientNotes || ''}\n${request.adminNotes || ''}`.toLowerCase();
                      const rowClientResponded = rowChapter.id === 'brief' && (rowClientResponseSource.includes('client sent brief clarification')
                        || rowClientResponseSource.includes('client brief clarification')
                        || rowClientResponseSource.includes('client message:'));
                      const nextAction = rowClientResponded ? 'Review client response' : getAdminNextAction(request);
                      const rowState = getAdminBuildState(request);
                      const summaryPreview = request.summary
                        ? request.summary.split('\n').find(line => line.trim().length > 0) || request.summary
                        : 'No project summary has been prepared yet.';
                      const rowAttentionReason = rowClientResponded
                        ? 'Client response received. Review the new brief details and decide whether Scope can open.'
                        : request.status === 'in_review'
                          ? 'Brief is under review. Confirm missing items or approve the request for Scope.'
                          : request.status === 'submitted'
                            ? 'New brief submitted. Start intake review and check what Scope needs.'
                            : rowChapter.id === 'scope'
                              ? request.status === 'approved'
                                ? 'Scope accepted. Prepare Agreement and payment terms.'
                                : 'Scope is ready for client review. Confirm the quote and client note before Agreement opens.'
                              : summaryPreview;
                      const rowOpenLabel = rowChapter.id === 'brief' ? 'Open brief' : `Open ${rowChapter.label.toLowerCase()}`;
                      const quoteLabel = request.quotedAmount
                        ? `${request.quoteCurrency || request.user?.defaultCurrency || 'USD'} ${request.quotedAmount}`
                        : 'Quote pending';
                      const projectLabel = request.packageIntent || request.serviceType || 'Custom build';
                      const createdAtLabel = request.createdAt
                        ? new Date(request.createdAt).toLocaleString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : 'No date';

                      return (
                        <button
                          key={request.id}
                          type="button"
                          onClick={() => {
                            setSelectedProjectRequestId(request.id);
                            setActiveAdminBuildChapter(null);
                          }}
                          className={`group grid w-full gap-5 border-b border-ai-blue/18 px-5 py-5 text-left transition hover:border-ai-blue/36 hover:bg-white/[0.025] xl:grid-cols-[minmax(0,1fr)_25rem] xl:items-center ${
                            closedBuildStatuses.includes(request.status) ? 'opacity-70 hover:opacity-100' : ''
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-base font-black text-white">{request.title || request.businessName || 'Untitled build'}</span>
                            <span className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-black uppercase tracking-[0.12em]">
                              <span className="inline-flex items-center gap-2 text-amber-300">
                                <Package className="h-3.5 w-3.5" />
                                <span>{projectLabel.replace(/_/g, ' ')}</span>
                              </span>
                              <span className="inline-flex items-center gap-2 text-expert-green">
                                <UserRound className="h-3.5 w-3.5" />
                                <span>{request.user?.name || 'Unknown client'}</span>
                              </span>
                              <span className="inline-flex min-w-0 items-start gap-2 text-ai-blue">
                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                <span className="break-all normal-case tracking-normal">{request.user?.email || 'No client email'}</span>
                              </span>
                              <span className="inline-flex items-center gap-2 text-tech-purple">
                                <CalendarDays className="h-3.5 w-3.5" />
                                <span>{createdAtLabel}</span>
                              </span>
                            </span>
                          </span>
                          <span className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                            {[
                              { label: 'Next', value: nextAction, color: 'text-amber-300', icon: <ChevronRight className="h-3.5 w-3.5" /> },
                              { label: 'Stage', value: rowChapter.label, color: 'text-ai-blue', icon: <Activity className="h-3.5 w-3.5" /> },
                              { label: 'State', value: rowClientResponded ? 'Client responded' : rowState, color: rowClientResponded ? 'text-expert-green' : 'text-white/58', icon: rowClientResponded ? <MessageSquare className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" /> },
                              { label: 'Quote', value: quoteLabel, color: 'text-white/72', icon: <CreditCard className="h-3.5 w-3.5" /> },
                            ].map((item) => (
                              <span key={item.label} className="min-w-0">
                                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/30">
                                  {item.icon}
                                  <span>{item.label}</span>
                                </span>
                                <span className={`mt-1 block truncate text-[11px] font-black uppercase tracking-[0.1em] ${item.color}`}>{item.value}</span>
                              </span>
                            ))}
                            <span className="sm:col-span-4 xl:col-span-2">
                              <span className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.14em]">
                                <span className="text-white/46">Progress</span>
                                <span className="text-expert-green">{rowProgress}%</span>
                              </span>
                              <span className="mt-2 block h-1 bg-white/10">
                                <span className="block h-full bg-expert-green" style={{ width: `${rowProgress}%` }} />
                              </span>
                            </span>
                          </span>
                          <span className={`flex min-w-0 flex-col gap-3 pt-1 text-sm font-semibold leading-6 sm:flex-row sm:items-center sm:justify-between xl:col-span-2 ${rowClientResponded ? 'text-expert-green' : rowChapter.id === 'scope' ? 'text-amber-300' : 'text-white/56'}`}>
                            <span className="min-w-0">{rowAttentionReason}</span>
                            <span className="inline-flex shrink-0 items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/48 transition group-hover:text-white">
                              {rowOpenLabel}
                              <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  {filteredProjectRequests.length === 0 && (
                    <div className="px-5 py-10 text-sm text-white/34">
                      {buildSearchTerm ? `No results for "${searchTerm.trim()}"` : `No ${selectedBuildOperatorView.label.toLowerCase()} waiting right now.`}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="min-h-[680px]">
                <aside className="hidden">
                  <div className="grid grid-cols-[1fr_7rem_2rem] gap-3 border-b border-white/10 px-5 py-4 text-[9px] font-black uppercase tracking-[0.18em] text-white/28">
                    <span>Build queue</span>
                    <span className="text-right">Page</span>
                    <span></span>
                  </div>
                  <div className="divide-y divide-white/10">
                    {projectRequests
                      .filter(request => {
                        const haystack = `${request.title} ${request.businessName || ''} ${request.user?.email || ''} ${request.status}`.toLowerCase();
                        const matchesSearch = haystack.includes(searchTerm.toLowerCase());
                        const matchesStatus = filterStatus === 'ALL' || request.status === filterStatus;
                        return matchesSearch && matchesStatus;
                      })
                      .map((request) => {
                        const isSelected = selectedProjectRequest?.id === request.id;
                        const rowChapter = adminBuildChapters.find(chapter => chapter.statuses.includes(request.status)) || adminBuildChapters[0];
                        const rowChapterIndex = Math.max(0, adminBuildChapters.findIndex(chapter => chapter.id === rowChapter.id));
                        const rowProgress = Math.round(((rowChapterIndex + 1) / adminBuildChapters.length) * 100);

                        return (
                          <button
                            key={request.id}
                            type="button"
                            onClick={() => {
                              setSelectedProjectRequestId(request.id);
                              setActiveAdminBuildChapter(null);
                            }}
                            className={`grid min-h-24 w-full grid-cols-[1fr_7rem_2rem] items-center gap-3 px-5 py-4 text-left transition ${
                              isSelected ? 'bg-ai-blue/[0.07]' : 'hover:bg-white/[0.025]'
                            }`}
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-black text-white">{request.title || request.businessName || 'Untitled build'}</span>
                              <span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/34">
                                {request.user?.email || 'No client email'}
                              </span>
                              <span className="mt-3 block h-1 bg-white/10">
                                <span className="block h-full bg-ai-blue" style={{ width: `${rowProgress}%` }} />
                              </span>
                              <span className="mt-2 block truncate text-[10px] font-semibold text-white/34">
                                Resume: {rowChapter.label}
                              </span>
                            </span>
                            <span className={`text-right text-[10px] font-black uppercase tracking-[0.12em] ${isSelected ? 'text-ai-blue' : 'text-white/42'}`}>
                              {rowChapter.label}
                            </span>
                            <ChevronRight className={`h-4 w-4 justify-self-end transition ${isSelected ? 'text-ai-blue' : 'text-white/18'}`} />
                          </button>
                        );
                      })}
                  </div>
                </aside>

                <main className="min-w-0">
                  {selectedProjectRequest && (
                    <div className="flex h-full flex-col">
                      <div className="px-5 pb-3 pt-1 lg:px-8">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProjectRequestId(null);
                                setActiveAdminBuildChapter(null);
                              }}
                              className="mb-3 grid h-9 w-9 place-items-center text-white/42 transition hover:text-white"
                              aria-label="Back to build queue"
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </button>
                            <h3 className="truncate text-2xl font-black tracking-tight text-white">
                              {selectedProjectRequest.title || selectedProjectRequest.businessName || 'Untitled build'}
                            </h3>
                            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-black uppercase tracking-[0.12em]">
                              <span className="text-white/38">{selectedProjectRequest.id.slice(-8).toUpperCase()}</span>
                              <span className="inline-flex items-center gap-2 text-expert-green">
                                <UserRound className="h-3.5 w-3.5" />
                                {selectedProjectRequest.user?.name || 'Unknown client'}
                              </span>
                              <span className="inline-flex items-start gap-2 text-ai-blue">
                                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span className="break-all normal-case tracking-normal">{selectedProjectRequest.user?.email || 'No email'}</span>
                              </span>
                              <span className="inline-flex items-center gap-2 text-amber-300">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {new Date(selectedProjectRequest.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="grid min-w-0 gap-4 xl:min-w-[30rem] xl:grid-cols-[minmax(0,1fr)_minmax(10rem,0.8fr)] xl:items-start xl:justify-end">
                            <div className="flex min-w-0 items-start gap-4">
                              <div className="grid h-11 w-11 shrink-0 place-items-center text-ai-blue">
                                {selectedAdminBuildChapter.id === 'review' ? <Eye className="h-6 w-6" /> : selectedClientResponseReceived ? <MessageSquare className="h-6 w-6 text-expert-green" /> : selectedProjectRequest.status === 'in_review' ? <Clock className="h-6 w-6" /> : <Check className="h-6 w-6 text-expert-green" />}
                              </div>
                              <div className="flex min-w-0 items-start gap-4">
                                <div className="min-w-0">
                                  {selectedAdminBuildChapter.id !== 'agreement' && (
                                  <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-ai-blue/70">
                                    Step {selectedAdminBuildChapterIndex + 1} of {adminBuildChapters.length}
                                  </p>
                                  )}
                                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">Current</p>
                                  <p className="mt-1 truncate text-sm font-black tracking-tight text-white">
                                    {selectedAdminBuildChapter.id === 'brief'
                                      ? selectedClientResponseReceived ? 'Client responded' : 'Brief review'
                                      : selectedAdminBuildChapter.label}
                                  </p>
                                </div>
                                <ChevronRight className="mt-7 h-4 w-4 shrink-0 text-white/24" />
                                <div className="min-w-0">
                                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">Next</p>
                                  <p className="mt-1 truncate text-sm font-black tracking-tight text-white/68">
                                    {nextAdminBuildChapter?.label || 'Scope'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            {selectedAdminBuildChapter.id !== 'brief' && selectedAdminBuildChapter.id !== 'agreement' && (
                              <div className="w-full xl:pt-1">
                                <div className="flex items-center justify-between gap-4 text-[10px] font-black uppercase tracking-[0.14em] text-white/34">
                                  <span>{selectedAdminBuildChapter.id === 'build' ? 'In studio' : selectedAdminBuildChapter.id === 'review' ? selectedReviewStatusLabel : selectedProjectRequest.status.replace(/_/g, ' ')}</span>
                                  <span>{adminBuildPageProgress}%</span>
                                </div>
                                <div className="mt-2 h-1.5 bg-white/10">
                                  <div className="h-full bg-ai-blue" style={{ width: `${adminBuildPageProgress}%` }} />
                                </div>
                                {selectedAdminBuildChapterIndex > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveAdminBuildChapter(adminBuildChapters[selectedAdminBuildChapterIndex - 1].id)}
                                    className="mt-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/40 transition hover:text-white"
                                  >
                                    <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                                    Previous step
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={`flex-1 ${
                        selectedAdminBuildChapter.id === 'brief' || selectedAdminBuildChapter.id === 'agreement'
                          ? 'divide-y divide-white/10'
                          : 'grid xl:grid-cols-[minmax(0,1fr)_22rem] xl:divide-x xl:divide-white/10'
                      }`}>
                        <section className={`px-5 py-6 lg:px-8 ${selectedAdminBuildChapter.id === 'agreement' ? 'hidden' : ''}`}>
                          {selectedAdminBuildChapter.id !== 'brief' && selectedAdminBuildChapter.id !== 'agreement' && selectedAdminBuildChapter.id !== 'build' && selectedAdminBuildChapter.id !== 'review' && (
                            <div className="mb-5 flex items-center justify-between gap-4">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/38">{selectedAdminBuildChapter.label}</h4>
                              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue">
                                {selectedAdminBuildChapter.id === 'build' ? 'In studio' : selectedProjectRequest.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                          )}
                          {selectedAdminBuildChapter.id === 'brief' && (
                          <>
                          {selectedClientResponseReceived && (
                            <div className="mb-6 py-5">
                              <div className="flex flex-col gap-3 border-b border-expert-green/25 pb-5 md:flex-row md:items-start md:justify-between">
                                <div className="min-w-0">
                                  <p className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-expert-green">
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    Client response received
                                  </p>
                                  <h4 className="mt-2 text-xl font-black tracking-tight text-white">Submitted brief details</h4>
                                  <p className="mt-2 text-sm font-semibold leading-6 text-white/52">
                                    Received {selectedClientResponseReceivedAt}
                                  </p>
                                </div>
                                <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.14em] text-expert-green">
                                  {selectedClientResponseRows.length} answers
                                </span>
                              </div>
                              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                                {selectedClientResponseSections.map((section) => (
                                  <div key={section.title} className="min-w-0 border-b border-white/10 pb-5">
                                    <div className={`flex items-center gap-2 ${section.tone}`}>
                                      {section.icon}
                                      <p className="text-[10px] font-black uppercase tracking-[0.16em]">{section.title}</p>
                                    </div>
                                    <div className="mt-4 divide-y divide-white/10">
                                      {section.rows.map((row, index) => (
                                        <div key={`${section.title}-${row.label}-${index}`} className="grid gap-2 py-3 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-5">
                                          <p className="text-[10px] font-black uppercase tracking-[0.13em] text-white/34">{row.label}</p>
                                          <p className="whitespace-pre-line break-words text-sm font-semibold leading-6 text-white/78">{row.answer}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className={`${selectedClientResponseReceived ? 'mt-2' : 'border-y border-white/10'}`}>
                            {selectedClientResponseReceived && (
                              <details className="border-y border-white/10 py-4">
                                <summary className="cursor-pointer list-none text-[10px] font-black uppercase tracking-[0.18em] text-white/42 transition hover:text-white">
                                  Original brief
                                </summary>
                                <div className="mt-4">
                                  <div className="hidden xl:grid xl:grid-cols-5">
                                    {selectedBriefAnswerRows.map((row) => (
                                      <div key={row.question} className="min-w-0 border-b border-r border-white/10 px-4 py-4 [&:nth-child(5n)]:border-r-0">
                                        <p className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-white/34" title={row.question}>
                                          {row.question}
                                        </p>
                                        <p
                                          className={`mt-2 truncate text-sm font-semibold ${
                                            ['Not answered', 'Not specified'].includes(row.answer) ? 'text-white/30' : 'text-white/74'
                                          }`}
                                          title={row.answer}
                                        >
                                          {row.answer}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="divide-y divide-white/10 xl:hidden">
                                    {selectedBriefAnswerRows.map((row) => (
                                      <div key={row.question} className="grid gap-2 py-4 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-6 md:items-start">
                                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/38 md:truncate" title={row.question}>
                                          {row.question}
                                        </p>
                                        <p className={`min-w-0 text-sm font-semibold leading-6 ${
                                          ['Not answered', 'Not specified'].includes(row.answer) ? 'text-white/30' : 'text-white/72'
                                        } md:truncate`} title={row.answer}>
                                          {row.answer}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </details>
                            )}
                            {!selectedClientResponseReceived && (
                            <>
                            <div className="hidden xl:grid xl:grid-cols-5">
                              {selectedBriefAnswerRows.map((row) => (
                                <div key={row.question} className="min-w-0 border-b border-r border-white/10 px-4 py-4 [&:nth-child(5n)]:border-r-0">
                                  <p className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-white/34" title={row.question}>
                                    {row.question}
                                  </p>
                                  <p
                                    className={`mt-2 truncate text-sm font-semibold ${
                                      ['Not answered', 'Not specified'].includes(row.answer) ? 'text-white/30' : 'text-white/74'
                                    }`}
                                    title={row.answer}
                                  >
                                    {row.answer}
                                  </p>
                                </div>
                              ))}
                            </div>
                            <div className="divide-y divide-white/10 xl:hidden">
                              {selectedBriefAnswerRows.map((row) => (
                                <div key={row.question} className="grid gap-2 py-4 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-6 md:items-start">
                                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/38 md:truncate" title={row.question}>
                                    {row.question}
                                  </p>
                                  <p className={`min-w-0 text-sm font-semibold leading-6 ${
                                    ['Not answered', 'Not specified'].includes(row.answer) ? 'text-white/30' : 'text-white/72'
                                  } md:truncate`} title={row.answer}>
                                    {row.answer}
                                  </p>
                                </div>
                              ))}
                            </div>
                            </>
                            )}
                          </div>
                          </>
                          )}

                          {selectedAdminBuildChapter.id === 'scope' && (
                            <div className="border-y border-white/10 py-5">
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="min-w-0">
                                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-300">Scope offer</p>
                                  <h4 className="mt-2 text-2xl font-black tracking-tight text-white">Set the offer, price, and delivery terms.</h4>
                                  <p className="mt-3 max-w-3xl text-sm leading-7 text-white/50">
                                    Turn the approved brief into a client-ready offer.
                                  </p>
                                </div>
                                <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue">
                                  {selectedProjectRequest.status.replace(/_/g, ' ')}
                                </span>
                              </div>

                              <div className="mt-7 divide-y divide-white/10">
                                <div className="grid gap-4 py-4 md:grid-cols-[12rem_minmax(0,1fr)] md:items-start">
                                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/34">Offer</p>
                                  <div className="min-w-0">
                                    <p className="text-lg font-black tracking-tight text-white">{selectedBriefType || 'Custom build'}</p>
                                    <p className="mt-2 text-sm leading-7 text-white/54">{selectedBriefGoals || 'Goal not set'}</p>
                                  </div>
                                </div>
                                <div className="grid gap-4 py-4 md:grid-cols-[12rem_minmax(0,1fr)] md:items-start">
                                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/34">Included</p>
                                  <div className="grid gap-3 md:grid-cols-2">
                                    {[
                                      { label: 'Core features', value: selectedBriefFeatures || 'Not set' },
                                      { label: 'Audience', value: selectedBriefAudience || 'Not set' },
                                      { label: 'Content/assets', value: selectedBriefMaterial || 'Not set' },
                                      { label: 'Style direction', value: selectedBriefStyle || 'Not set' },
                                    ].map((item) => (
                                      <div key={item.label} className="min-w-0 border-b border-white/10 pb-3">
                                        <p className="text-[9px] font-black uppercase tracking-[0.13em] text-white/28">{item.label}</p>
                                        <p className="mt-2 break-words text-sm font-semibold leading-6 text-white/72">{item.value}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="grid gap-4 py-4 md:grid-cols-[12rem_minmax(0,1fr)] md:items-start">
                                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/34">Terms</p>
                                  <div className="grid gap-3 md:grid-cols-3">
                                    {[
                                      { label: 'Price', value: selectedProjectRequest.quotedAmount ? `${selectedProjectRequest.quoteCurrency || selectedProjectRequest.user?.defaultCurrency || 'USD'} ${selectedProjectRequest.quotedAmount}` : 'Not set', tone: 'text-amber-300' },
                                      { label: 'Budget direction', value: selectedProjectRequest.budget || 'Not specified', tone: 'text-white/72' },
                                      { label: 'Timeline', value: selectedProjectRequest.timeline || 'Flexible', tone: 'text-white/72' },
                                    ].map((item) => (
                                      <div key={item.label} className="min-w-0 border-b border-white/10 pb-3">
                                        <p className="text-[9px] font-black uppercase tracking-[0.13em] text-white/28">{item.label}</p>
                                        <p className={`mt-2 break-words text-sm font-black leading-6 ${item.tone}`}>{item.value}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {selectedAdminBuildChapter.id === 'build' && (
                          <div className="mt-4 space-y-6">
                            <section className="border-y border-white/10 py-5">
                              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.34fr)] xl:items-start">
                                <div>
                                  <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-ai-blue">Production room</span>
                                    <span className={`text-[9px] font-black uppercase tracking-[0.14em] ${selectedOpenStudioBlockers.length || selectedBlockedStudioTasks.length ? 'text-amber-300' : 'text-expert-green'}`}>
                                      {selectedOpenStudioBlockers.length || selectedBlockedStudioTasks.length ? 'Needs attention' : 'Moving'}
                                    </span>
                                  </div>
                                  <h3 className="mt-3 text-2xl font-black tracking-tight text-white">{selectedProjectRequest.title}</h3>
                                  <div className="mt-4 grid gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {selectedStudioDeliverables.map(item => (
                                      <div key={item.label} className="min-w-0 border-b border-white/10 pb-3">
                                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/46">{item.label}</p>
                                        <p className="mt-1 truncate text-sm font-semibold text-white/82">{item.value}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="border-y border-white/10 py-3">
                                  {selectedStudioSignals.map(signal => (
                                    <div key={signal.label} className="flex items-center justify-between gap-4 border-b border-white/10 py-2 last:border-b-0">
                                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/42">{signal.label}</p>
                                      <p className={`text-sm font-black tracking-tight ${signal.tone}`}>{signal.value}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="mt-5 h-1 bg-white/10">
                                <div className="h-full bg-ai-blue transition-all" style={{ width: `${selectedStudioCompletion}%` }} />
                              </div>
                            </section>

                            <section className="border-b border-white/10 pb-5">
                              <div className="grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(18rem,0.38fr)] xl:items-start">
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/56">Production source</p>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {[
                                      { id: 'inside_app', label: 'Inside app' },
                                      { id: 'outside_tools', label: 'Outside tools' },
                                      { id: 'hybrid', label: 'Hybrid' },
                                    ].map(mode => (
                                      <button
                                        key={mode.id}
                                        type="button"
                                        onClick={() => handleUpdateProjectRequest(selectedProjectRequest.id, { productionMode: mode.id })}
                                        disabled={submitting}
                                        className={`min-h-9 border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition disabled:opacity-45 ${
                                          selectedProductionMode === mode.id ? 'border-ai-blue/50 text-ai-blue' : 'border-white/10 text-white/52 hover:border-white/25 hover:text-white'
                                        }`}
                                      >
                                        {mode.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="border-t border-white/10 pt-4 xl:border-t-0 xl:border-l xl:pl-5 xl:pt-0">
                                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/56">Current mode</p>
                                  <p className="mt-2 text-xl font-black tracking-tight text-white">{selectedProductionModeLabel}</p>
                                  <textarea
                                    defaultValue={selectedProjectRequest.productionSourceNote || ''}
                                    onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { productionSourceNote: e.target.value })}
                                    className="mt-3 h-20 w-full resize-none border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60"
                                    placeholder="Where is the team building this project?"
                                  />
                                </div>
                              </div>
                            </section>

                            <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.42fr)]">
                              <div className="min-w-0 space-y-6">
                                <section className="space-y-4">
                                  <div className="border-y border-white/10">
                                    {selectedStudioIsEmpty ? (
                                      <div className="py-5">
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-ai-blue">No production work added</p>
                                        <p className="mt-2 max-w-2xl text-sm leading-7 text-white/62">
                                          Add the first real work item above. The category only organizes the work; empty categories stay hidden.
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="divide-y divide-white/10">
                                        {selectedStudioTaskGroups.map(group => (
                                          <div key={group.id} className="grid gap-4 py-4 lg:grid-cols-[10rem_minmax(0,1fr)]">
                                            <div className="flex items-start gap-3">
                                              <span className={group.accent}>{group.icon}</span>
                                              <div>
                                                <p className="text-sm font-black text-white">{group.name}</p>
                                                <p className={`mt-1 text-[9px] font-black uppercase tracking-[0.14em] ${group.state.tone}`}>{group.state.label}</p>
                                              </div>
                                            </div>
                                            <div className="divide-y divide-white/10">
                                              {group.tasks.map(task => (
                                                <div key={task.id} className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_8rem] sm:items-center">
                                                  <div className="min-w-0">
                                                    <p className="text-sm font-semibold leading-5 text-white/76">{task.title}</p>
                                                    {task.note && <p className="mt-2 text-xs leading-5 text-white/56">{task.note}</p>}
                                                  </div>
                                                  <select
                                                    value={task.status}
                                                    onChange={(e) => handleUpdateStudioTask(selectedProjectRequest.id, task.id, { status: e.target.value })}
                                                    disabled={submitting}
                                                    className="border-0 border-b border-white/10 bg-transparent px-0 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-white/70 outline-none [color-scheme:dark]"
                                                  >
                                                    <option className="bg-black text-white" value="open">Open</option>
                                                    <option className="bg-black text-white" value="active">Active</option>
                                                    <option className="bg-black text-white" value="blocked">Blocked</option>
                                                    <option className="bg-black text-white" value="done">Done</option>
                                                  </select>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="grid gap-3 border-b border-white/10 pb-4 lg:grid-cols-[11rem_minmax(0,1fr)_8rem]">
                                    <select
                                      value={studioTaskDraft.area}
                                      onChange={(e) => setStudioTaskDraft(prev => ({ ...prev, area: e.target.value }))}
                                      className="border-0 border-b border-white/10 bg-transparent px-0 py-3 text-[10px] font-black uppercase tracking-widest text-white outline-none [color-scheme:dark] focus:border-ai-blue/60"
                                    >
                                      {selectedStudioAreas.map(area => (
                                        <option key={area.id} value={area.id} className="bg-black text-white">{area.name}</option>
                                      ))}
                                    </select>
                                    <input
                                      value={studioTaskDraft.title}
                                      onChange={(e) => setStudioTaskDraft(prev => ({ ...prev, title: e.target.value }))}
                                      className="border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60"
                                      placeholder="Add production work item..."
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleCreateStudioTask(selectedProjectRequest.id)}
                                      disabled={submitting || !studioTaskDraft.title.trim()}
                                      className="border-b border-ai-blue/35 py-3 text-left text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:text-white disabled:opacity-40"
                                    >
                                      Add work
                                    </button>
                                  </div>
                                </section>

                                <section className="grid gap-px bg-white/10 lg:grid-cols-3">
                                  <div className="bg-[#05070a] p-4">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex items-center gap-3 text-expert-green">
                                        <Eye className="h-4 w-4" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em]">Preview</p>
                                      </div>
                                      <span className={`text-[9px] font-black uppercase tracking-[0.14em] ${selectedPreviewIsReal ? 'text-expert-green' : selectedPreviewIsTest ? 'text-amber-300' : 'text-white/30'}`}>
                                        {selectedPreviewIsReal ? 'Public' : selectedPreviewIsTest ? 'Test' : 'Not connected'}
                                      </span>
                                    </div>
                                    <div className="mt-4 border-y border-white/10 py-3">
                                      {selectedPreviewIsReal ? (
                                        <a href={selectedPreviewUrl} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-2 break-all text-sm font-black leading-6 text-ai-blue hover:text-white">
                                          Open public preview <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                                        </a>
                                      ) : selectedPreviewIsTest ? (
                                        <div className="space-y-3">
                                          <p className="text-sm font-semibold leading-6 text-amber-300">A test/local preview is saved, but it cannot be sent to the client for Review.</p>
                                          <button
                                            type="button"
                                            onClick={() => handleClearPreviewLink(selectedProjectRequest.id)}
                                            disabled={submitting}
                                            className="text-[10px] font-black uppercase tracking-[0.14em] text-white/68 transition hover:text-white disabled:opacity-40"
                                          >
                                            Remove test link
                                          </button>
                                        </div>
                                      ) : (
                                        <p className="text-sm font-semibold leading-6 text-white/62">No public preview connected yet.</p>
                                      )}
                                    </div>
                                    {selectedInternalPreviewUrl && (
                                      <div className="mt-4 border-b border-white/10 pb-3">
                                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/50">Inside app preview</p>
                                        <button
                                          type="button"
                                          onClick={() => window.open(selectedInternalPreviewUrl, '_blank')}
                                          className="mt-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:text-white"
                                        >
                                          Open internal preview <ChevronRight className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    )}
                                    <input
                                      defaultValue={selectedPreviewIsReal ? selectedPreviewUrl : ''}
                                      onBlur={(e) => handleCreatePreviewLink(selectedProjectRequest.id, e.target.value)}
                                      className="mt-3 w-full border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60"
                                      placeholder="Paste public staging URL"
                                    />
                                  </div>
                                  <div className="bg-[#05070a] p-4">
                                    <div className="flex items-center gap-3 text-ai-blue">
                                      <Layout className="h-4 w-4" />
                                      <p className="text-[9px] font-black uppercase tracking-[0.18em]">Artifacts</p>
                                    </div>
                                    <div className="mt-3 space-y-2">
                                      {selectedStudioArtifacts.filter(link => link.type !== 'preview').slice(0, 3).map(link => (
                                        link.url ? (
                                          <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="block break-all border-b border-white/10 pb-2 text-sm font-black leading-6 text-ai-blue hover:text-white">
                                            {link.label}
                                          </a>
                                        ) : (
                                          <p key={link.id} className="border-b border-white/10 pb-2 text-sm font-semibold text-white/70">{link.label}</p>
                                        )
                                      ))}
                                      {selectedStudioArtifacts.filter(link => link.type !== 'preview').length === 0 && (
                                        <p className="text-sm font-semibold leading-6 text-white/62">No files or external tools attached yet.</p>
                                      )}
                                    </div>
                                    <div className="mt-4 grid gap-2">
                                      <select
                                        value={studioLinkDraft.type}
                                        onChange={(e) => setStudioLinkDraft(prev => ({ ...prev, type: e.target.value }))}
                                        className="border-0 border-b border-white/10 bg-transparent px-0 py-2 text-[10px] font-black uppercase tracking-widest text-white outline-none [color-scheme:dark] focus:border-ai-blue/60"
                                      >
                                        {['design', 'repo', 'file', 'access', 'link', 'note'].map(type => (
                                          <option key={type} value={type} className="bg-black text-white">{type}</option>
                                        ))}
                                      </select>
                                      <input
                                        value={studioLinkDraft.label}
                                        onChange={(e) => setStudioLinkDraft(prev => ({ ...prev, label: e.target.value }))}
                                        className="border-0 border-b border-white/10 bg-transparent px-0 py-2 text-sm text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60"
                                        placeholder="Label"
                                      />
                                      <input
                                        value={studioLinkDraft.url}
                                        onChange={(e) => setStudioLinkDraft(prev => ({ ...prev, url: e.target.value }))}
                                        className="border-0 border-b border-white/10 bg-transparent px-0 py-2 text-sm text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60"
                                        placeholder="URL or reference"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleCreateStudioLink(selectedProjectRequest.id)}
                                        disabled={submitting || (!studioLinkDraft.label.trim() && !studioLinkDraft.url.trim())}
                                        className="pt-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:text-white disabled:opacity-40"
                                      >
                                        Add artifact
                                      </button>
                                    </div>
                                  </div>
                                  <div className="bg-[#05070a] p-4">
                                    <div className="flex items-center gap-3 text-amber-300">
                                      <Package className="h-4 w-4" />
                                      <p className="text-[9px] font-black uppercase tracking-[0.18em]">Needs</p>
                                    </div>
                                    <div className="mt-3 space-y-2">
                                      {[...selectedStudioNeeds, ...selectedOpenStudioBlockers.map(blocker => blocker.title)].slice(0, 4).map(need => (
                                        <p key={need} className="break-words border-b border-white/10 pb-2 text-sm font-semibold leading-6 text-white/76">{need}</p>
                                      ))}
                                      {selectedStudioNeeds.length === 0 && selectedOpenStudioBlockers.length === 0 && (
                                        <p className="text-sm font-semibold text-expert-green">Nothing blocking production.</p>
                                      )}
                                    </div>
                                  </div>
                                </section>
                              </div>

                              <div className="space-y-6">
                                <section className="border-y border-white/10 py-4">
                                  <div className="flex items-center justify-between gap-4">
                                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-ai-blue">Control desk</p>
                                    <span className={`text-[9px] font-black uppercase tracking-[0.14em] ${selectedStudioCanOpenReview ? 'text-expert-green' : 'text-amber-300'}`}>
                                      {selectedStudioCanOpenReview ? 'Review ready' : 'Preparing'}
                                    </span>
                                  </div>

                                  <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
                                  <div className="py-4">
                                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/52">Client communication</p>
                                    {selectedLatestClientUpdate ? (
                                      <div className="mt-3 border-b border-white/10 pb-3">
                                        <p className="text-sm font-semibold leading-6 text-white/82">{selectedLatestClientUpdate.message}</p>
                                        {selectedLatestClientUpdate.createdAt && (
                                          <p className="mt-2 text-[9px] font-black uppercase tracking-[0.14em] text-white/46">
                                            {new Date(selectedLatestClientUpdate.createdAt).toLocaleString()}
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="mt-3 border-b border-white/10 pb-3 text-sm font-semibold leading-6 text-white/62">
                                        No client-facing production update has been published yet.
                                      </p>
                                    )}
                                    <textarea
                                      value={studioUpdateDraft}
                                      onChange={(e) => setStudioUpdateDraft(e.target.value)}
                                      className="mt-4 h-24 w-full resize-none border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60"
                                      placeholder="Write a short client-facing production update..."
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleCreateStudioUpdate(selectedProjectRequest.id)}
                                      disabled={submitting || !studioUpdateDraft.trim()}
                                      className="mt-4 text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:text-white disabled:opacity-40"
                                    >
                                      Publish client update
                                    </button>
                                  </div>

                                  <div className="py-4">
                                    <div className="flex items-center justify-between gap-4">
                                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/52">Production risks</p>
                                      <span className={`text-[9px] font-black uppercase tracking-[0.14em] ${selectedOpenStudioBlockers.length ? 'text-amber-300' : 'text-expert-green'}`}>
                                        {selectedOpenStudioBlockers.length ? `${selectedOpenStudioBlockers.length} open` : 'Clear'}
                                      </span>
                                    </div>
                                    <div className="mt-3 divide-y divide-white/10">
                                      {selectedOpenStudioBlockers.map((blocker) => (
                                        <div key={blocker.id} className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_5rem] sm:items-center">
                                          <p className="text-sm font-semibold leading-6 text-white/82">{blocker.title}</p>
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateStudioBlocker(selectedProjectRequest.id, blocker.id, { status: 'resolved' })}
                                            className="text-left text-[9px] font-black uppercase tracking-[0.14em] text-expert-green sm:text-right"
                                          >
                                            Resolve
                                          </button>
                                        </div>
                                      ))}
                                      {selectedOpenStudioBlockers.length === 0 && (
                                        <p className="py-3 text-sm font-semibold text-white/62">No active production risks.</p>
                                      )}
                                    </div>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_5rem] xl:grid-cols-1">
                                      <input
                                        value={studioBlockerDraft}
                                        onChange={(e) => setStudioBlockerDraft(e.target.value)}
                                        className="border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm text-white outline-none transition placeholder:text-white/24 focus:border-amber-300/60"
                                        placeholder="Add production risk or blocker..."
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleCreateStudioBlocker(selectedProjectRequest.id)}
                                        disabled={submitting || !studioBlockerDraft.trim()}
                                        className="py-3 text-left text-[10px] font-black uppercase tracking-[0.14em] text-amber-300 disabled:opacity-40"
                                      >
                                        Add risk
                                      </button>
                                    </div>
                                  </div>

                                  <div className="py-4">
                                    <div className="flex items-center gap-3">
                                      <Folder className="h-4 w-4 text-white/62" />
                                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/52">Internal context</p>
                                    </div>
                                    <textarea
                                      defaultValue={selectedStudioInternalNote}
                                      onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { adminNotes: e.target.value })}
                                      className="mt-3 h-20 w-full resize-none border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60"
                                      placeholder="Private production context for the team..."
                                    />
                                  </div>
                                  </div>

                                  <div className="pt-4">
                                    <div className="flex items-center justify-between gap-4">
                                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/52">Review gate</p>
                                      <span className={`text-[9px] font-black uppercase tracking-[0.14em] ${selectedStudioCanOpenReview ? 'text-expert-green' : 'text-amber-300'}`}>
                                        {selectedStudioCanOpenReview ? 'Ready' : 'Not ready'}
                                      </span>
                                    </div>
                                    <div className="mt-4 grid gap-2">
                                      {selectedReviewChecks.map((item) => (
                                        <div key={item.label} className="grid gap-3 border-b border-white/10 py-2 sm:grid-cols-[1rem_minmax(0,1fr)_4rem] sm:items-center">
                                          <span className={`mt-1 h-2 w-2 rounded-full sm:mt-0 ${item.ready ? 'bg-expert-green' : 'bg-white/24'}`} />
                                          <p className="text-sm font-semibold leading-6 text-white/76">{item.label}</p>
                                          <span className={`text-left text-[9px] font-black uppercase tracking-[0.14em] sm:text-right ${item.ready ? 'text-expert-green' : 'text-white/42'}`}>
                                            {item.ready ? 'Done' : 'Open'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateProjectRequest(selectedProjectRequest.id, { status: 'staging_review' })}
                                      disabled={submitting || !selectedStudioCanOpenReview}
                                      className="mt-5 flex min-h-10 w-full items-center justify-between gap-3 border border-ai-blue/25 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:bg-ai-blue/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      Open Review
                                      <ChevronRight className="h-4 w-4" />
                                    </button>
                                  </div>
                                </section>
                              </div>
                            </div>
                          </div>
                          )}
                        </section>

                        <aside className={`border-t border-white/10 px-5 py-6 ${
                          selectedAdminBuildChapter.id === 'brief' ? 'lg:px-8' : 'xl:border-t-0 xl:px-6'
                        }`}>
                          {selectedAdminBuildChapter.id !== 'brief' && selectedAdminBuildChapter.id !== 'agreement' && selectedAdminBuildChapter.id !== 'build' && selectedAdminBuildChapter.id !== 'review' && (
                            <h4 className="mb-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/38">
                              {selectedAdminBuildChapter.id === 'scope' ? 'Scope actions' : 'Decision panel'}
                            </h4>
                          )}
                          {selectedAdminBuildChapter.id === 'brief' && (
                          selectedClientResponseReceived ? (
                          <div className="border-t border-white/10 pt-5">
                            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.75fr)] xl:items-start">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-3">
                                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-expert-green">Brief decision</p>
                                  <span className="border border-expert-green/25 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-expert-green">
                                    {isBriefApprovedForScope ? 'Scope open' : 'Client responded'}
                                  </span>
                                </div>
                                <h4 className="mt-3 text-2xl font-black tracking-tight text-white">
                                  {isBriefApprovedForScope ? 'Brief approved' : 'Ready for Scope?'}
                                </h4>
                                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/50">
                                  {isBriefApprovedForScope
                                    ? 'Scope is open. The next step is preparing the scope and quote for the client.'
                                    : 'Approve only when the brief has enough content, pages, features, audience, budget, and timeline direction for Scope.'}
                                </p>
                                <div className="mt-5 grid gap-px overflow-hidden bg-white/10 sm:grid-cols-3">
                                  {[
                                    { label: 'Answers reviewed', value: `${selectedClientResponseRows.length} received`, color: 'text-expert-green' },
                                    { label: 'Current gate', value: isBriefApprovedForScope ? 'Scope' : 'Brief', color: 'text-ai-blue' },
                                    { label: 'Next move', value: isBriefApprovedForScope ? 'Prepare quote' : 'Scope', color: 'text-amber-300' },
                                  ].map((item) => (
                                    <div key={item.label} className="bg-[#05070a] px-4 py-3">
                                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/30">{item.label}</p>
                                      <p className={`mt-2 text-sm font-black tracking-tight ${item.color}`}>{item.value}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="grid gap-4">
                                <div>
                                  <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/30">More detail note</label>
                                  <textarea
                                    value={briefClarificationMessage}
                                    onChange={(e) => setBriefClarificationMessage(e.target.value)}
                                    className="h-24 w-full resize-none border border-white/10 bg-black px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-amber-300/50"
                                    placeholder="Only needed if you are requesting more detail..."
                                  />
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <button
                                    type="button"
                                    onClick={() => handleRequestBriefMoreDetails(selectedProjectRequest.id)}
                                    disabled={submitting || isBriefApprovedForScope}
                                    className="min-h-11 border border-amber-300/25 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-amber-300 transition hover:bg-amber-300/10 hover:text-white disabled:opacity-50"
                                  >
                                    Request more details
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateProjectRequest(selectedProjectRequest.id, {
                                      status: 'quote_ready',
                                      clientNotes: 'Your brief has been approved for scoping. The scope and quote will be prepared next.'
                                    })}
                                    disabled={submitting || isBriefApprovedForScope}
                                    className="min-h-11 border border-expert-green/25 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-expert-green transition hover:bg-expert-green/10 hover:text-white disabled:opacity-50"
                                  >
                                    {isBriefApprovedForScope ? 'Scope is open' : 'Approve and open Scope'}
                                  </button>
                                </div>
                              </div>
                            </div>
                            {briefDecisionMessage && (
                              <p className={`mt-4 text-xs font-semibold leading-5 ${
                                briefDecisionMessage.type === 'success' ? 'text-expert-green' : 'text-red-300'
                              }`}>
                                {briefDecisionMessage.text}
                              </p>
                            )}
                          </div>
                          ) : (
                          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
                            <div className="border-y border-white/10 py-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/32">Missing items</p>
                                </div>
                                <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.14em] text-white/34">
                                  {briefMissingItems.length}
                                </span>
                              </div>
                              {briefMissingItems.length ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {briefMissingItems.map((item) => (
                                    <button
                                      key={item}
                                      type="button"
                                      onClick={() => setBriefMissingItems(prev => prev.filter(value => value !== item))}
                                      className="min-h-9 border border-white/28 bg-white/[0.04] px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-white/[0.07]"
                                    >
                                      {item} needed
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-3 text-sm font-semibold text-white/40">No missing items marked.</p>
                              )}
                              <div className="mt-4 grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-4">
                                {briefMissingOptions.filter(item => !briefMissingItems.includes(item)).map((item) => (
                                  <button
                                    key={item}
                                    type="button"
                                    onClick={() => setBriefMissingItems(prev => [...prev, item])}
                                    className="min-h-8 min-w-0 truncate border border-white/10 px-3 py-2 text-left text-[9px] font-black uppercase tracking-[0.12em] text-white/40 transition hover:bg-white/[0.04] hover:text-white/80"
                                    title={`Add ${item}`}
                                  >
                                    Add {item}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
                              <div>
                                <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Client note</label>
                                <textarea
                                  value={briefClarificationMessage}
                                  onChange={(e) => setBriefClarificationMessage(e.target.value)}
                                  className="h-32 w-full resize-none border border-white/10 bg-black px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-white/30"
                                  placeholder="What should the client clarify?"
                                />
                              </div>
                              <div className="border-y border-white/10 py-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/32">Brief decision</p>
                                    <p className="mt-2 text-lg font-black tracking-tight text-white">{briefReviewStatus}</p>
                                  </div>
                                  <span className={`border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] ${
                                    ['quote_ready', 'approved', 'payment_agreement', 'in_development', 'staging_review', 'launched', 'handoff', 'completed'].includes(selectedProjectRequest.status)
                                      ? 'border-white/20 text-white'
                                      : 'border-white/10 text-white/36'
                                  }`}>
                                    {['quote_ready', 'approved', 'payment_agreement', 'in_development', 'staging_review', 'launched', 'handoff', 'completed'].includes(selectedProjectRequest.status) ? 'Scope unlocked' : 'Waiting approval'}
                                  </span>
                                </div>
                                <p className="mt-3 text-xs leading-6 text-white/44">
                                  Send the client back for missing details, or approve the brief and open Scope.
                                </p>
                                <div className="mt-5 grid gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleRequestBriefMoreDetails(selectedProjectRequest.id)}
                                    disabled={submitting}
                                    className="min-h-10 border border-white/10 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-white/62 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
                                  >
                                    Send clarification request
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateProjectRequest(selectedProjectRequest.id, {
                                      status: 'quote_ready',
                                      clientNotes: selectedProjectRequest.clientNotes || 'Your brief has been approved for scoping. The scope and quote will be prepared next.'
                                    })}
                                    disabled={submitting}
                                    className="min-h-10 border border-white/20 bg-white/[0.035] px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.08] disabled:opacity-50"
                                  >
                                    Approve and open Scope
                                  </button>
                                </div>
                                {briefDecisionMessage && (
                                  <p className={`mt-3 text-xs font-semibold leading-5 ${
                                    briefDecisionMessage.type === 'success' ? 'text-expert-green' : 'text-red-300'
                                  }`}>
                                    {briefDecisionMessage.text}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          )
                          )}
                          <div className="space-y-5">
                          {selectedAdminBuildChapter.id === 'scope' && (
                              <div className={`border-y py-4 ${isScopeAccepted ? 'border-expert-green/25' : 'border-white/10'}`}>
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className={`text-[9px] font-black uppercase tracking-[0.18em] ${isScopeAccepted ? 'text-expert-green' : 'text-amber-300'}`}>
                                      {isScopeAccepted ? 'Scope complete' : 'Scope offer'}
                                    </p>
                                    <p className="mt-2 text-xs leading-6 text-white/46">
                                      {isScopeAccepted
                                        ? 'The client accepted the offer. Prepare the payment request next.'
                                        : 'Prepare the price, boundaries, and next client decision.'}
                                    </p>
                                  </div>
                                  <span className={`shrink-0 text-right text-[10px] font-black uppercase tracking-[0.14em] ${isScopeAccepted ? 'text-expert-green' : 'text-amber-300'}`}>
                                    {selectedProjectRequest.status === 'approved' ? 'Accepted' : hasScopeDiscussionRequest ? 'Client replied' : 'Draft'}
                                  </span>
                                </div>
                              </div>
                            )}
                            <div className={`grid gap-4 sm:grid-cols-2 ${selectedAdminBuildChapter.id === 'scope' && !isScopeAccepted ? '' : 'hidden'}`}>
                            <div>
                              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Quote amount</label>
                              <input
                                type="number"
                                defaultValue={selectedProjectRequest.quotedAmount || ''}
                                onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { quotedAmount: e.target.value, status: selectedProjectRequest.status === 'submitted' || selectedProjectRequest.status === 'in_review' ? 'quote_ready' : selectedProjectRequest.status })}
                                className="w-full border border-white/10 bg-black px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-amber-300/50"
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Currency</label>
                              <input
                                type="text"
                                defaultValue={selectedProjectRequest.quoteCurrency || selectedProjectRequest.user?.defaultCurrency || 'USD'}
                                onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { quoteCurrency: e.target.value || selectedProjectRequest.user?.defaultCurrency || 'USD' })}
                                className="w-full border border-white/10 bg-black px-4 py-3 text-sm font-semibold uppercase text-white outline-none transition focus:border-amber-300/50"
                              />
                            </div>
                            </div>
                            {selectedAdminBuildChapter.id === 'agreement' && (
                            <div className="border-y border-white/10">
                              <div className="py-7">
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                                  <div className="flex min-w-0 gap-4">
                                    <div className={`grid h-12 w-12 shrink-0 place-items-center ${
                                      isAgreementConfirmed ? 'text-expert-green' : isAgreementSent ? 'text-amber-300' : 'text-white/42'
                                    }`}>
                                      {isAgreementConfirmed ? <Check className="h-8 w-8" /> : <CircleDollarSign className="h-8 w-8" />}
                                    </div>
                                    <div className="min-w-0">
                                      <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${
                                        isAgreementConfirmed ? 'text-expert-green' : isAgreementSent ? 'text-amber-300' : 'text-white/42'
                                      }`}>
                                        {isAgreementConfirmed ? 'Deposit paid' : isAgreementSent ? 'Deposit pending' : 'Deposit not sent'}
                                      </p>
                                      <h4 className="mt-2 text-3xl font-black tracking-tight text-white">{selectedAgreementDueNowLabel}</h4>
                                      {isAgreementConfirmed ? (
                                        <p className="mt-2 text-sm font-semibold leading-6 text-white/54">
                                          Build is ready to open.
                                        </p>
                                      ) : !isAgreementSent && (
                                        <p className="mt-2 text-sm font-semibold leading-6 text-white/48">
                                          Prepare and send the payment request to the client.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="grid gap-2 text-left lg:min-w-64 lg:text-right">
                                    {isAgreementConfirmed && (
                                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/34">
                                        Verified {selectedPaymentConfirmedAt || 'Confirmed'} - Paystack
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-7 grid gap-4 border-y border-white/10 py-5 md:grid-cols-4">
                                  {[
                                    { label: 'Total', value: selectedAgreementTotalLabel },
                                    { label: 'Deposit', value: selectedAgreementDueNowLabel },
                                    { label: 'Balance', value: selectedAgreementBalanceLabel },
                                    { label: 'Due', value: agreementDraft.paymentDueDate ? new Date(agreementDraft.paymentDueDate).toLocaleDateString() : 'Not set' }
                                  ].map((item) => (
                                    <div key={item.label} className="min-w-0">
                                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">{item.label}</p>
                                      <p className="mt-1 truncate text-sm font-black capitalize text-white/76">{item.value}</p>
                                    </div>
                                  ))}
                                </div>

                                {isAgreementConfirmed && (
                                  <div className="mt-6 grid gap-4 border-b border-white/10 pb-5 md:grid-cols-3">
                                    {[
                                      { label: 'Reference', value: selectedPaymentReference || 'Captured', tone: 'text-white/72' },
                                      { label: 'Terms', value: selectedAgreementTypeLabel, tone: 'text-white/72' },
                                      { label: 'Build gate', value: 'Ready to open', tone: 'text-amber-200' },
                                    ].map((item) => (
                                      <div key={item.label} className="min-w-0">
                                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">{item.label}</p>
                                        <p className={`mt-1 truncate text-sm font-black ${item.tone}`}>{item.value}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
                                  {!isAgreementConfirmed ? (
                                  <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                      <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Payment model</label>
                                      <select
                                        value={agreementDraft.paymentAgreementType}
                                        onChange={(e) => setAgreementDraft(prev => ({ ...prev, paymentAgreementType: e.target.value }))}
                                        className="w-full border-0 border-b border-white/10 bg-transparent px-0 py-3 text-[10px] font-black uppercase tracking-widest text-white outline-none transition [color-scheme:dark] focus:border-expert-green/60"
                                      >
                                        <option className="bg-black text-white" value="">Select terms</option>
                                        <option className="bg-black text-white" value="deposit">Deposit payment</option>
                                        <option className="bg-black text-white" value="full_payment">Full payment</option>
                                        <option className="bg-black text-white" value="milestone_payments">Milestone payments</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Due date</label>
                                      <input
                                        type="date"
                                        value={agreementDraft.paymentDueDate}
                                        onChange={(e) => setAgreementDraft(prev => ({ ...prev, paymentDueDate: e.target.value }))}
                                        className="w-full border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm font-semibold text-white outline-none transition [color-scheme:dark] focus:border-expert-green/60"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Total agreed</label>
                                      <input
                                        type="number"
                                        value={agreementDraft.totalAgreedAmount}
                                        onChange={(e) => setAgreementDraft(prev => ({ ...prev, totalAgreedAmount: e.target.value }))}
                                        className="w-full border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm font-semibold text-white outline-none transition focus:border-expert-green/60"
                                        placeholder="0"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Deposit required</label>
                                      <input
                                        type="number"
                                        value={agreementDraft.depositAmount}
                                        onChange={(e) => setAgreementDraft(prev => ({ ...prev, depositAmount: e.target.value }))}
                                        className="w-full border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm font-semibold text-white outline-none transition focus:border-expert-green/60"
                                        placeholder="0"
                                      />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Client payment note</label>
                                      <textarea
                                        value={selectedAgreementNote}
                                        onChange={(e) => setAgreementDraft(prev => ({ ...prev, paymentInstructions: e.target.value }))}
                                        className="h-24 w-full resize-none border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/24 focus:border-expert-green/60"
                                        placeholder="Explain what the payment covers and what happens after checkout..."
                                      />
                                    </div>
                                  </div>
                                  ) : <div className="hidden xl:block" />}

                                  <div className="space-y-3">
                                    {!isAgreementConfirmed && isAgreementSent && !isAgreementDraftDirty ? (
                                      <div className="flex min-h-12 items-center justify-between gap-3 border border-amber-300/20 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-amber-300">
                                        <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Payment request sent</span>
                                      </div>
                                    ) : !isAgreementConfirmed ? (
                                      <button
                                        type="button"
                                        onClick={() => handleSendAgreementPaymentRequest(selectedProjectRequest)}
                                        disabled={submitting || isAgreementConfirmed}
                                        className="flex min-h-12 w-full items-center justify-between gap-3 border border-expert-green/25 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-expert-green transition hover:bg-expert-green/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                                      >
                                        <span className="flex items-center gap-2">
                                          <Send className="h-4 w-4" />
                                          {isAgreementSent ? 'Send updated payment request' : 'Send payment request'}
                                        </span>
                                        <ChevronRight className="h-4 w-4" />
                                      </button>
                                    ) : null}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleUpdateProjectRequest(selectedProjectRequest.id, {
                                          status: 'in_development'
                                        });
                                      }}
                                      disabled={submitting || !isAgreementConfirmed}
                                      className="flex min-h-12 w-full items-center justify-between gap-3 border border-ai-blue/30 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:bg-ai-blue/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      <span>{isAgreementConfirmed ? 'Proceed to Build' : 'Build opens after deposit'}</span>
                                      <ChevronRight className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            )}
                            {selectedAdminBuildChapter.id === 'review' && (
                              <div className="border-y border-white/10 py-5">
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-3">
                                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-ai-blue">Preview review</p>
                                      <span className={`text-[9px] font-black uppercase tracking-[0.14em] ${selectedReviewStatusTone}`}>{selectedReviewStatusLabel}</span>
                                    </div>
                                    <h4 className="mt-3 text-2xl font-black tracking-tight text-white">Client approval</h4>
                                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/52">
                                      Share the preview, guide what to inspect, then wait for approval or change notes.
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateProjectRequest(selectedProjectRequest.id, { status: 'handoff' })}
                                    disabled={submitting || !selectedReviewCanMoveForward}
                                    className={`flex min-h-11 items-center justify-between gap-3 border px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] transition disabled:cursor-not-allowed lg:min-w-48 ${
                                      selectedReviewCanMoveForward
                                        ? 'border-expert-green/25 text-expert-green hover:bg-expert-green/10 hover:text-white'
                                        : 'border-white/10 text-white/34'
                                    }`}
                                  >
                                    {selectedReviewCanMoveForward ? 'Move to handoff' : 'Waiting approval'}
                                    <ChevronRight className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_15rem]">
                                  <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                      <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Preview URL</label>
                                      <input
                                        type="url"
                                        defaultValue={selectedProjectRequest.stagingUrl || ''}
                                        onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { stagingUrl: e.target.value })}
                                        className="w-full border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60"
                                        placeholder="https://preview..."
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Response state</label>
                                      <select
                                        value={selectedProjectRequest.stagingReviewStatus || 'sent'}
                                        onChange={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { stagingReviewStatus: e.target.value })}
                                        className="w-full border-0 border-b border-white/10 bg-transparent px-0 py-3 text-[10px] font-black uppercase tracking-widest text-white outline-none transition [color-scheme:dark] focus:border-ai-blue/60"
                                      >
                                        <option className="bg-black text-white" value="not_sent">Not sent</option>
                                        <option className="bg-black text-white" value="sent">Waiting client</option>
                                        <option className="bg-black text-white" value="changes_requested">Changes requested</option>
                                        <option className="bg-black text-white" value="approved">Approved</option>
                                      </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Review note to client</label>
                                      <textarea
                                        defaultValue={selectedProjectRequest.stagingNotes || ''}
                                        onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { stagingNotes: e.target.value })}
                                        className="h-24 w-full resize-none border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60"
                                        placeholder="Tell the client what to inspect in the preview..."
                                      />
                                    </div>
                                  </div>
                                  <div className="border-t border-white/10 pt-5 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
                                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/34">Client response</p>
                                    <p className={`mt-2 text-lg font-black tracking-tight ${selectedReviewStatusTone}`}>{selectedReviewStatusLabel}</p>
                                    <p className="mt-2 text-sm leading-6 text-white/52">
                                      {selectedReviewStatus === 'changes_requested'
                                        ? 'Send the project back to Studio, make the changes, then reopen Review.'
                                        : selectedReviewStatus === 'approved'
                                          ? 'The client approved the preview. Handoff can begin.'
                                          : 'Waiting for the client to approve the preview or request changes.'}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => setReviewChatOpen(prev => !prev)}
                                      className="mt-5 inline-flex min-h-10 items-center gap-3 border-b border-ai-blue/35 pb-2 text-[10px] font-black uppercase tracking-[0.16em] text-ai-blue transition hover:border-white hover:text-white"
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                      Review chat
                                      {reviewChatMessages.length > 0 && <span className="text-white/46">{reviewChatMessages.length}</span>}
                                    </button>
                                  </div>
                                </div>
                                {reviewChatOpen && (
                                  <div className="mt-6 border-y border-white/10 py-5">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                      <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-ai-blue">Project review chat</p>
                                        <p className="mt-2 text-sm leading-6 text-white/54">Ask clear questions, confirm fixes, and keep Review decisions inside this project.</p>
                                      </div>
                                      <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/34">
                                        {reviewChatLoading ? 'Loading' : `${reviewChatMessages.length} message${reviewChatMessages.length === 1 ? '' : 's'}`}
                                      </span>
                                    </div>
                                    <div className="mt-5 max-h-80 space-y-3 overflow-y-auto pr-1">
                                      {reviewChatMessages.length ? reviewChatMessages.map((message) => {
                                        const isAdminMessage = message.senderRole === 'admin';
                                        return (
                                          <div key={message.id} className={`flex ${isAdminMessage ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[86%] border-b px-0 py-3 ${isAdminMessage ? 'border-ai-blue/35 text-right' : 'border-white/10 text-left'}`}>
                                              <div className={`text-[9px] font-black uppercase tracking-[0.16em] ${isAdminMessage ? 'text-ai-blue' : 'text-amber-300'}`}>
                                                {isAdminMessage ? 'Admin' : 'Client'} · {new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                              </div>
                                              <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-white/78">{message.message}</p>
                                              {Array.isArray(message.choices) && message.choices.length > 0 && (
                                                <div className={`mt-3 flex flex-wrap gap-2 ${isAdminMessage ? 'justify-end' : 'justify-start'}`}>
                                                  {message.choices.map(choice => (
                                                    <span key={choice} className="border border-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/48">
                                                      {choice}
                                                    </span>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      }) : (
                                        <div className="border-y border-white/10 py-6">
                                          <p className="text-sm font-semibold text-white/58">No review chat yet. Start with a direct question or a short client-facing note.</p>
                                        </div>
                                      )}
                                    </div>
                                    <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,0.35fr)]">
                                      <textarea
                                        value={reviewChatDraft}
                                        onChange={(event) => setReviewChatDraft(event.target.value)}
                                        className="h-24 w-full resize-none border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60"
                                        placeholder="Write to the client about this review..."
                                      />
                                      <div className="space-y-3">
                                        <input
                                          value={reviewChatChoiceDraft}
                                          onChange={(event) => setReviewChatChoiceDraft(event.target.value)}
                                          className="w-full border-0 border-b border-white/10 bg-transparent px-0 py-3 text-xs font-semibold text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60"
                                          placeholder="Optional choices, comma separated"
                                        />
                                        <button
                                          type="button"
                                          onClick={handleSendAdminReviewChat}
                                          disabled={reviewChatSending || (!reviewChatDraft.trim() && !reviewChatChoiceDraft.trim())}
                                          className="flex min-h-11 w-full items-center justify-between gap-3 border border-ai-blue/30 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:bg-ai-blue/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                          {reviewChatSending ? 'Sending' : reviewChatChoiceDraft.trim() ? 'Send question' : 'Send message'}
                                          <Send className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {selectedReviewStatus === 'changes_requested' && (
                                  <div className="mt-6 border-y border-amber-300/20 py-4">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                      <div className="min-w-0">
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-300">Client feedback</p>
                                        <p className="mt-2 text-sm leading-7 text-white/68">
                                          {selectedLatestReviewMessage || 'The client requested changes, but no extra note was added.'}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateProjectRequest(selectedProjectRequest.id, { status: 'in_development', stagingReviewStatus: 'changes_requested' })}
                                        disabled={submitting}
                                        className="min-h-10 border border-amber-300/25 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-amber-300 transition hover:bg-amber-300/10 hover:text-white disabled:opacity-45"
                                      >
                                        Return to Studio
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className={selectedAdminBuildChapter.id === 'launch' ? '' : 'hidden'}>
                              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Launch URL</label>
                              <input
                                type="url"
                                defaultValue={selectedProjectRequest.launchUrl || ''}
                                onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { launchUrl: e.target.value })}
                                className="w-full border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-ai-blue/50"
                                placeholder="https://live..."
                              />
                            </div>
                            <div className={selectedAdminBuildChapter.id === 'launch' ? '' : 'hidden'}>
                              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Launch notes</label>
                              <textarea
                                defaultValue={selectedProjectRequest.launchNotes || ''}
                                onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { launchNotes: e.target.value })}
                                className="h-24 w-full resize-none border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-ai-blue/50"
                                placeholder="Launch details visible to client..."
                              />
                            </div>
                            <div className={selectedAdminBuildChapter.id === 'launch' ? '' : 'hidden'}>
                              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Handoff notes</label>
                              <textarea
                                defaultValue={selectedProjectRequest.handoffNotes || ''}
                                onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { handoffNotes: e.target.value })}
                                className="h-24 w-full resize-none border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-ai-blue/50"
                                placeholder="Access, next steps, and final handoff notes..."
                              />
                            </div>
                            <div className={selectedAdminBuildChapter.id === 'launch' ? '' : 'hidden'}>
                              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Completion notes</label>
                              <textarea
                                defaultValue={selectedProjectRequest.completionNotes || ''}
                                onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { completionNotes: e.target.value })}
                                className="h-24 w-full resize-none border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-ai-blue/50"
                                placeholder="Final completion summary..."
                              />
                              {selectedProjectRequest.completionAcknowledgedAt && (
                                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-expert-green">
                                  Client acknowledged {new Date(selectedProjectRequest.completionAcknowledgedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            {selectedAdminBuildChapter.id === 'scope' && hasScopeDiscussionRequest && !isScopeAccepted && (
                            <div className="border-y border-amber-300/20 py-4">
                              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-300">Client discussion</p>
                              <p className="mt-2 text-xs leading-6 text-white/42">Client asked to discuss the scope before Agreement.</p>
                              <div className="mt-3 space-y-3">
                                {selectedScopeDiscussionLines.map((line, index) => (
                                  <p key={`${line}-${index}`} className="text-sm leading-6 text-white/64">
                                    {line}
                                  </p>
                                ))}
                                {selectedScopeDiscussionLines.length === 0 && (
                                  <p className="text-sm leading-6 text-white/48">No extra message was added.</p>
                                )}
                              </div>
                            </div>
                            )}
                          {selectedAdminBuildChapter.id !== 'brief' && selectedAdminBuildChapter.id !== 'scope' && selectedAdminBuildChapter.id !== 'agreement' && selectedAdminBuildChapter.id !== 'build' && selectedAdminBuildChapter.id !== 'review' && (
                            <div>
                              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">
                                Client note
                              </label>
                              <textarea
                                defaultValue={selectedProjectRequest.clientNotes || ''}
                                onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { clientNotes: e.target.value })}
                                className="h-28 w-full resize-none border border-white/10 bg-black px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-ai-blue/50"
                                placeholder="Visible to client..."
                              />
                            </div>
                            )}
                            {selectedAdminBuildChapter.id === 'scope' && !isScopeAccepted && (
                            <div>
                              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">
                                Scope message to client
                              </label>
                              <textarea
                                value={scopeClientNote}
                                onChange={(e) => setScopeClientNote(e.target.value)}
                                className="h-28 w-full resize-none border border-white/10 bg-black px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-amber-300/50"
                                placeholder="Write what changed, what the client should review, and the next decision..."
                              />
                            </div>
                            )}
                            {selectedAdminBuildChapter.id === 'scope' && (
                              <div className="border-t border-white/10 pt-4">
                                <div className="mb-4">
                                  <p className={`text-[9px] font-black uppercase tracking-[0.18em] ${
                                    isScopeAccepted ? 'text-expert-green' : isScopeSentToClient ? 'text-ai-blue' : 'text-amber-300'
                                  }`}>
                                    {isScopeAccepted ? 'Agreement ready' : isScopeSentToClient ? 'Scope sent' : hasScopeDiscussionRequest ? 'Revise scope' : 'Scope ready'}
                                  </p>
                                  <p className="mt-2 text-xs leading-6 text-white/46">
                                    {isScopeAccepted
                                      ? 'Scope is approved. Set payment terms, deposit, and instructions in the next step.'
                                      : isScopeSentToClient
                                        ? 'Waiting for the client to review the offer and price.'
                                        : hasScopeDiscussionRequest
                                          ? 'Send the revised offer back to the client.'
                                          : 'Send the offer, price, and delivery terms to the client.'}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isScopeAccepted) {
                                      setActiveAdminBuildChapter('agreement');
                                      return;
                                    }
                                    handleSendScopeToClient(selectedProjectRequest);
                                  }}
                                  disabled={submitting}
                                  className={`min-h-11 w-full border px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] transition disabled:opacity-45 ${
                                    isScopeAccepted
                                      ? 'border-expert-green/25 text-expert-green hover:bg-expert-green/10 hover:text-white'
                                      : isScopeSentToClient
                                        ? 'border-ai-blue/25 text-ai-blue hover:bg-ai-blue/10 hover:text-white'
                                        : 'border-amber-300/25 text-amber-300 hover:bg-amber-300/10 hover:text-white'
                                  }`}
                                >
                                  {isScopeAccepted ? 'Open agreement setup' : isScopeSentToClient || hasScopeDiscussionRequest ? 'Send updated scope' : 'Send scope'}
                                </button>
                              </div>
                            )}
                            {selectedAdminBuildChapter.id !== 'brief' && selectedAdminBuildChapter.id !== 'scope' && selectedAdminBuildChapter.id !== 'agreement' && selectedAdminBuildChapter.id !== 'build' && selectedAdminBuildChapter.id !== 'review' && (
                            <div>
                              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Internal note</label>
                              <textarea
                                defaultValue={selectedProjectRequest.adminNotes || ''}
                                onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { adminNotes: e.target.value })}
                                className="h-28 w-full resize-none border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-ai-blue/50"
                                placeholder="Private admin note..."
                              />
                            </div>
                            )}
                          </div>
                        </aside>
                      </div>
                    </div>
                  )}
                </main>
              </div>
            )}
          </div>
        )}

        {/* Assessments Tab */}
        {activeTab === 'assessments' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
              <div className="flex flex-col">
                <h2 className="text-lg font-bold tracking-tight uppercase flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-tech-purple rounded-full"></span>
                  Audit Repository
                </h2>
                <span className="text-[8px] font-bold text-medium-gray uppercase tracking-[0.2em] mt-1">LOG_ENTRIES: {assessments.length}</span>
              </div>

              <div className="w-full md:w-64">
                <input 
                  type="text"
                  placeholder="Search audits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors"
                />
              </div>
            </div>
            
            <div className="bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Assessment ID</th>
                      <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Client</th>
                      <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Timestamp</th>
                      <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {assessments
                      .filter(a => 
                        (a.name || 'Anonymous').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (a.id || '').toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((assessment, index) => (
                      <tr key={assessment.id || index} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-5">
                          <p className="text-[9px] font-black font-mono text-ai-blue uppercase tracking-widest">
                            {(assessment.id || '').slice(-8).toUpperCase()}
                          </p>
                        </td>
                        <td className="p-5">
                          <p className="text-[11px] font-black tracking-tight uppercase">{assessment.name || 'Anonymous'}</p>
                        </td>
                        <td className="p-5">
                          <p className="text-[9px] font-black uppercase tracking-widest text-medium-gray">
                            {new Date(assessment.createdAt).toLocaleString()}
                          </p>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => handleViewAssessment(assessment)}
                              className="text-[9px] font-black uppercase tracking-[0.2em] text-ai-blue hover:text-white transition-colors"
                            >
                              VIEW_REPORT
                            </button>
                            <button 
                              onClick={() => handleDeleteAssessment(assessment.id)}
                              className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500 hover:text-white transition-colors"
                            >
                              DELETE
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Review Tab */}
        {activeTab === 'review' && (
          <div className="space-y-6 animate-fade-in">
            {selectedSubscriptionForEditor ? (
              <div className="space-y-4">
                <button 
                  onClick={() => setSelectedSubscriptionForEditor(null)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-ai-blue hover:text-white transition-all mb-4"
                >
                  <span>???</span> BACK_TO_LIST
                </button>
                <TemplateEditor 
                  subscriptionId={selectedSubscriptionForEditor} 
                  onClose={() => setSelectedSubscriptionForEditor(null)}
                />
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
                  <div className="flex flex-col">
                    <h2 className="text-lg font-black tracking-tighter uppercase flex items-center gap-3">
                      <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                      Human Enhancement Queue
                    </h2>
                    <span className="text-[8px] font-black text-medium-gray uppercase tracking-[0.2em] mt-1">PENDING_REVIEWS: {reviewProjects.length}</span>
                  </div>

                  <div className="w-full md:w-64">
                    <input 
                      type="text"
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reviewProjects
                    .filter(p => 
                      (p.customName || p.siteName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (p.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (p.domain || '').toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((project: Subscription, index: number) => (
                    <div key={project.id || index} className="bg-white/[0.01] border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-tight mb-1">{project.domain || 'no-domain.sitemendr.com'}</h3>
                          <p className="text-[10px] text-medium-gray uppercase font-bold">{project.tier}</p>
                        </div>
                        <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${
                          project.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-[9px] uppercase font-black tracking-widest text-medium-gray">
                          <span>Owner</span>
                          <span className="text-white">{project.user?.email || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between text-[9px] uppercase font-black tracking-widest text-medium-gray">
                          <span>Requested</span>
                          <span className="text-white">{new Date(project.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                        {(project.revisionCount ?? 0) > 0 && (
                          <div className="flex justify-between text-[9px] uppercase font-black tracking-widest text-ai-blue">
                            <span>Revision_Count</span>
                            <span>{project.revisionCount}</span>
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <label className="block text-[7px] font-black uppercase text-medium-gray tracking-widest mb-1.5">Review_Notes</label>
                        <textarea
                          defaultValue={project.reviewNotes || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (project.reviewNotes || '')) {
                              handleUpdateReview(project.id, e.target.value);
                            }
                          }}
                          className="w-full h-20 bg-white/[0.02] border border-white/5 rounded-xl p-3 text-[10px] focus:outline-none focus:border-ai-blue/30 transition-colors custom-scrollbar resize-none"
                          placeholder="Enter design feedback..."
                        ></textarea>
                      </div>
                      
                      <div className="flex gap-3 mb-3">
                        <button 
                          onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/preview/${project.id}`, '_blank')}
                          className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                        >
                          <Eye size={12} />
                          PREVIEW
                        </button>
                        <button 
                          onClick={async () => {
                            if (confirm('Mark this review as complete? This will notify the user.')) {
                              try {
                                await apiClient.updateSubscriptionReview(project.id, { reviewRequested: false });
                                fetchData();
                              } catch (err) {
                                console.error('Failed to complete review:', err);
                                alert('Failed to complete review');
                              }
                            }
                          }}
                          className="flex-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-green-500 transition-all"
                        >
                          COMPLETE_REVIEW
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setSelectedSubscriptionForEditor(project.id)}
                          className="flex-1 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all"
                        >
                          EDIT_TEMPLATE
                        </button>
                        <button 
                          onClick={() => handleDeploySite(project.id)}
                          className="flex-1 bg-ai-blue/10 hover:bg-ai-blue/20 border border-ai-blue/20 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-ai-blue transition-all"
                        >
                          DEPLOY_LIVE
                        </button>
                      </div>
                    </div>
                  ))}
                  {reviewProjects.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-medium-gray border border-dashed border-white/5 rounded-3xl">
                      <Eye size={48} className="mb-4 opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">No projects currently awaiting review</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Media Library Tab */}
        {activeTab === 'media' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
              <div className="flex flex-col">
                <h2 className="text-xl font-black tracking-tighter uppercase flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
                  Asset Repository
                </h2>
                <span className="text-[8px] font-black text-medium-gray uppercase tracking-[0.2em] mt-1">TOTAL_ASSETS: {media.length}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <input 
                  type="text"
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors flex-1 md:w-64"
                />
                <button 
                  onClick={() => document.getElementById('media-upload-input')?.click()}
                  className="bg-green-500 hover:bg-green-600 text-black px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2"
                >
                  <Plus size={14} />
                  UPLOAD_ASSET
                </button>
              </div>
              <input 
                id="media-upload-input"
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadMedia(file);
                }}
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {media
                .filter(item => item.filename.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((item: MediaAsset, index: number) => (
                <div key={item.id || index} className="bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden group relative aspect-square">
                  {item.mimetype.startsWith('image/') ? (
                    <Image
                      src={item.url}
                      alt={item.filename}
                      fill
                      sizes="(min-width: 1024px) 16vw, (min-width: 768px) 25vw, 50vw"
                      className="object-cover opacity-60 transition-opacity group-hover:opacity-100"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-40">
                      <FileText size={48} />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-[8px] font-black uppercase truncate mb-2">{item.filename}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const fullUrl = window.location.origin.includes('localhost') 
                            ? `http://localhost:5000${item.url}`
                            : `${process.env.NEXT_PUBLIC_API_URL || ''}${item.url}`;
                          navigator.clipboard.writeText(fullUrl);
                          alert('URL copied to clipboard');
                        }}
                        className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-[7px] font-black uppercase"
                      >
                        COPY_URL
                      </button>
                      <button 
                        onClick={() => handleDeleteMedia(item.id)}
                        className="bg-red-500/20 hover:bg-red-500/40 text-red-500 p-2 rounded-lg"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {media.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-medium-gray border border-dashed border-white/5 rounded-3xl">
                  <Plus size={48} className="mb-4 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">No assets uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Support Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="animate-fade-in">
            <SupportManager />
          </div>
        )}

        {/* Live Support Tab */}
        {activeTab === 'live-support' && (
          <div className="animate-fade-in">
            <LiveSupportManager />
          </div>
        )}

        {/* Milestone Management Tab */}
        {activeTab === 'milestones' && (
          <div className="animate-fade-in">
            <MilestoneManager />
          </div>
        )}

        {/* Comment Moderation Tab */}
        {activeTab === 'comments' && (
          <div className="animate-fade-in">
            <CommentManager />
          </div>
        )}

        {/* System Health Tab */}
        {activeTab === 'health' && (
          <div className="space-y-12 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-ai-blue uppercase tracking-[0.3em] mb-1">System Audit</span>
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-3 uppercase">
                  <span className="w-1.5 h-8 bg-ai-blue rounded-full"></span>
                  System & Site Vitals
                </h2>
              </div>

              <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-2 rounded-2xl">
                <span className="text-[8px] font-black text-medium-gray uppercase tracking-widest ml-4">Monitor Site:</span>
                <select 
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue min-w-[200px]"
                  value={selectedSiteForVitals || ''}
                  onChange={async (e) => {
                    const id = e.target.value;
                    setSelectedSiteForVitals(id);
                    if (id) {
                      setLoadingVitals(true);
                      try {
                        const res = await apiClient.getSiteVitals(id);
                        if (res.success) setSiteVitals(res.vitals);
                      } catch (err) {
                        console.error('Failed to fetch vitals:', err);
                      } finally {
                        setLoadingVitals(false);
                      }
                    } else {
                      setSiteVitals(null);
                    }
                  }}
                >
                  <option value="">-- SYSTEM GLOBAL --</option>
                  {subscriptions.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.siteName || sub.customName || sub.id.slice(0, 8)} ({sub.tier})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedSiteForVitals && siteVitals ? (
              <PerformanceAudit 
                data={{
                  metrics: {
                    score: siteVitals.performance,
                    vitals: {
                      fcp: siteVitals.coreWebVitals?.fcp || siteVitals.coreWebVitals?.lcp,
                      tti: siteVitals.coreWebVitals?.tti || '1.2s',
                      cls: siteVitals.coreWebVitals?.cls,
                      lcp: siteVitals.coreWebVitals?.lcp
                    }
                  }
                }} 
                isRefreshing={loadingVitals}
                onRefresh={async () => {
                  if (selectedSiteForVitals) {
                    setLoadingVitals(true);
                    const res = await apiClient.getSiteVitals(selectedSiteForVitals);
                    if (res.success) setSiteVitals(res.vitals);
                    setLoadingVitals(false);
                  }
                }}
              />
            ) : (
              <AdminSystemHealth />
            )}
          </div>
        )}

        {/* System Management Tab */}
        {activeTab === 'system' && (
          <div className="space-y-10 animate-fade-in">
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-ai-blue uppercase tracking-[0.3em] mb-1">System_Orchestrator</span>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-3 uppercase">
                <span className="w-1.5 h-8 bg-ai-blue rounded-full"></span>
                System Settings
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Enforcement Settings */}
              <div className="bg-white/[0.01] border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                  <span className="text-3xl font-black">??????</span>
                </div>
                <h3 className="font-black text-xs tracking-widest uppercase text-ai-blue mb-8">Payment Enforcement</h3>
                
                {enforcementSettings ? (
                  <form onSubmit={handleUpdateEnforcementSettings} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-medium-gray uppercase tracking-widest">Grace Period (Days)</label>
                      <input 
                        type="number" 
                        value={enforcementSettings.gracePeriodDays || 0}
                        onChange={(e) => setEnforcementSettings({...enforcementSettings, gracePeriodDays: parseInt(e.target.value)})}
                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-medium-gray uppercase tracking-widest">Overlay Threshold (%)</label>
                      <input 
                        type="number" 
                        value={enforcementSettings.overlayThreshold || 0}
                        onChange={(e) => setEnforcementSettings({...enforcementSettings, overlayThreshold: parseInt(e.target.value)})}
                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-4 py-2">
                      <input 
                        type="checkbox" 
                        id="enforceOverlays"
                        checked={enforcementSettings.enforceOverlays || false}
                        onChange={(e) => setEnforcementSettings({...enforcementSettings, enforceOverlays: e.target.checked})}
                        className="w-4 h-4 rounded border-white/10 bg-white/[0.02] text-ai-blue focus:ring-ai-blue"
                      />
                      <label htmlFor="enforceOverlays" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Enable Global Enforcement</label>
                    </div>
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 bg-ai-blue text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : 'Save configuration'}
                    </button>
                  </form>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-[9px] font-black text-medium-gray uppercase tracking-[0.3em]">Loading settings...</p>
                  </div>
                )}
              </div>

              {/* Maintenance Tasks */}
              <div className="bg-white/[0.01] border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                  <span className="text-3xl font-black">???????</span>
                </div>
                <h3 className="font-black text-xs tracking-widest uppercase text-ai-blue mb-8">System Maintenance</h3>
                
                <div className="space-y-4">
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-all">
                    <div>
                      <p className="font-black text-[11px] uppercase tracking-tight mb-1">Suspension Watchdog</p>
                      <p className="text-[8px] text-medium-gray font-bold uppercase tracking-tight opacity-70">Check for overdue subscriptions and apply suspensions.</p>
                    </div>
                    <button 
                      onClick={handleRunSuspensionCheck}
                      disabled={isSystemWorking}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-500 transition-all disabled:opacity-50"
                    >
                      EXECUTE
                    </button>
                  </div>

                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-all">
                    <div>
                      <p className="font-black text-[11px] uppercase tracking-tight mb-1">DNS Verify Worker</p>
                      <p className="text-[8px] text-medium-gray font-bold uppercase tracking-tight opacity-70">Validate custom domain records across global DNS.</p>
                    </div>
                    <button 
                      onClick={handleRunDNSVerification}
                      disabled={isSystemWorking}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-expert-green/20 hover:border-expert-green/30 hover:text-expert-green transition-all disabled:opacity-50"
                    >
                      EXECUTE
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blog Management Tab */}
        {activeTab === 'blog' && (
          <div className="animate-fade-in h-full">
            <div className="mb-6 flex flex-col">
              <span className="text-[8px] font-black text-ai-blue uppercase tracking-[0.3em] mb-1">Content_Nexus</span>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-3 uppercase">
                <span className="w-1.5 h-8 bg-ai-blue rounded-full"></span>
                Blog & News Editor
              </h2>
            </div>
            <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
              <BlogEditor />
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-ai-blue uppercase tracking-[0.3em] mb-1">Intelligence_Feed</span>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-3 uppercase">
                <span className="w-1.5 h-8 bg-ai-blue rounded-full"></span>
                System Analytics
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                <p className="text-[8px] font-black text-medium-gray uppercase tracking-widest mb-2">Conversion_Rate</p>
                <p className="text-2xl font-black text-ai-blue">{stats?.conversionRate || '0.0%'}</p>
                <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-ai-blue" style={{ width: stats?.conversionRate || '0%' }}></div>
                </div>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                <p className="text-[8px] font-black text-medium-gray uppercase tracking-widest mb-2">User_Growth</p>
                <p className="text-2xl font-black text-expert-green">+{stats?.userGrowth?.length || 0}</p>
                <p className="text-[7px] text-medium-gray font-bold uppercase mt-1">LAST_30_DAYS</p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                <p className="text-[8px] font-black text-medium-gray uppercase tracking-widest mb-2">Lead_Velocity</p>
                <p className="text-2xl font-black text-tech-purple">{stats?.totalLeads || 0}</p>
                <p className="text-[7px] text-medium-gray font-bold uppercase mt-1">ACTIVE_PIPELINE</p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                <p className="text-[8px] font-black text-medium-gray uppercase tracking-widest mb-2">Load</p>
                <p className="text-2xl font-black text-white">OPTIMAL</p>
                <div className="mt-4 flex gap-1">
                  {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i < 6 ? 'bg-expert-green' : 'bg-white/10'}`}></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white/[0.01] border border-white/5 p-8 rounded-3xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-ai-blue mb-8">System Vitals Overview</h3>
              <AdminSystemHealth />
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="animate-fade-in">
            <div className="mb-6 flex flex-col">
              <span className="text-[8px] font-black text-ai-blue uppercase tracking-[0.3em] mb-1">Appointment_Grid</span>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-3 uppercase">
                <span className="w-1.5 h-8 bg-ai-blue rounded-full"></span>
                Service Bookings
              </h2>
            </div>
            <BookingManager />
          </div>
        )}
        </main>
      </div>

      <AssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        assessment={selectedAssessment}
      />
    </div>
  );
}
