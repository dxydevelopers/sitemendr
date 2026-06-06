'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import dynamic from 'next/dynamic';
import { apiClient } from '@/lib/api';
import { Layout, ShoppingBag, Eye, Plus, Trash2, FileText, Clock, Menu, Users, BarChart3, CreditCard, Settings, MessageSquare, Activity, Folder, PenLine, Sparkles, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

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
  adminNotes?: string;
  clientNotes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  assessment?: {
    id: string;
    responses?: Record<string, unknown>;
    results?: Record<string, unknown>;
    status?: string;
    createdAt?: string;
  };
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

export default function AdminDashboard({ onLogout, initialTab }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState(initialTab || 'dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [openSidebarGroup, setOpenSidebarGroup] = useState<string | null>('work');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [buildOperatorView, setBuildOperatorView] = useState('overview');
  const [briefMissingItems, setBriefMissingItems] = useState<string[]>([]);
  const [briefClarificationMessage, setBriefClarificationMessage] = useState('');
  const [briefDecisionMessage, setBriefDecisionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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
    { id: 'scope', label: 'Scope', eyebrow: 'Quote', detail: 'Prepare pricing and scope decisions', statuses: ['quote_ready', 'approved'] },
    { id: 'agreement', label: 'Agreement', eyebrow: 'Payment', detail: 'Send terms and confirm payment agreement', statuses: ['payment_agreement'] },
    { id: 'build', label: 'Build', eyebrow: 'Execution', detail: 'Manage milestones and delivery notes', statuses: ['in_development'] },
    { id: 'review', label: 'Review', eyebrow: 'Staging', detail: 'Send preview and handle feedback', statuses: ['staging_review'] },
    { id: 'launch', label: 'Launch', eyebrow: 'Handoff', detail: 'Launch, handoff, and close the build', statuses: ['launched', 'handoff', 'completed'] },
  ];

  const selectedProjectRequest = selectedProjectRequestId ? projectRequests.find(request => request.id === selectedProjectRequestId) || null : null;
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
    if (request.status === 'payment_agreement') return 'Confirm payment';
    if (request.status === 'in_development') return 'Update build';
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
    { id: 'agreement', label: 'Agreement', detail: 'Payment terms before production', statuses: ['payment_agreement'] },
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
  const filteredProjectRequestsBySearch = projectRequests.filter(request => {
    const haystack = `${request.title} ${request.businessName || ''} ${request.user?.email || ''} ${request.status}`.toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
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
  const selectedAdminBuildChapter = requestedAdminBuildChapter && (requestedAdminBuildChapterIndex <= defaultAdminBuildChapterIndex || selectedProjectRequest?.status === 'completed')
    ? requestedAdminBuildChapter
    : defaultAdminBuildChapter;
  const selectedAdminBuildChapterIndex = Math.max(0, adminBuildChapters.findIndex(chapter => chapter.id === selectedAdminBuildChapter.id));
  const adminBuildPageProgress = Math.round(((defaultAdminBuildChapterIndex + 1) / adminBuildChapters.length) * 100);
  const selectedBuildMilestones = selectedProjectRequest?.buildMilestones || [];
  const selectedBuildMilestoneProgress = selectedBuildMilestones.length
    ? Math.round(selectedBuildMilestones.reduce((sum, milestone) => sum + (milestone.progress || (milestone.status === 'completed' ? 100 : 0)), 0) / selectedBuildMilestones.length)
    : 0;
  const selectedActiveBuildMilestone = selectedBuildMilestones.find(milestone => milestone.status === 'in_progress')
    || selectedBuildMilestones.find(milestone => milestone.status === 'pending')
    || selectedBuildMilestones[selectedBuildMilestones.length - 1];
  const briefReviewStatus = selectedProjectRequest?.status === 'submitted'
    ? 'New brief'
    : selectedProjectRequest?.status === 'in_review'
      ? 'Under review'
      : selectedProjectRequest && ['quote_ready', 'approved', 'payment_agreement', 'in_development', 'staging_review', 'launched', 'handoff', 'completed'].includes(selectedProjectRequest.status)
        ? 'Ready for scope'
        : 'Review needed';
  const briefMissingOptions = [
    'Content/assets',
    'Budget clarity',
    'Timeline clarity',
    'Feature scope',
    'Audience/details',
    'Pages/sections',
    'Services/products',
    'Lead form fields',
    'Lead destination',
    'Brand assets',
    'Design references',
    'Domain/hosting',
    'Admin access',
    'Integrations',
    'Legal/policies',
    'Launch success',
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
  const buildBriefClarificationMessage = () => {
    const missingText = briefMissingItems.length
      ? `Please clarify: ${briefMissingItems.join(', ')}.`
      : 'Please clarify the brief details before scope is prepared.';
    const noteText = briefClarificationMessage.trim();

    return noteText ? `${missingText}\n${noteText}` : missingText;
  };

  const handleUpdateProjectRequest = async (id: string, data: Record<string, unknown>) => {
    setSubmitting(true);
    setBriefDecisionMessage(null);
    try {
      const res = await apiClient.updateAdminProjectRequest(id, data) as { success: boolean; data?: ProjectRequest; message?: string };
      if (res.success) {
        if (!res.data) {
          throw new Error('Build request updated, but the server did not return the updated request.');
        }
        setProjectRequests(prev => prev.map(request => request.id === id ? res.data as ProjectRequest : request));
        setSelectedProjectRequestId(id);
        setBriefDecisionMessage({
          type: 'success',
          text: data.status === 'quote_ready' ? 'Brief approved. Scope is now open for the client.' : 'Clarification request sent to the client.'
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

  const handleCreateDefaultBuildMilestones = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await apiClient.createDefaultBuildMilestones(id) as { success: boolean; data: ProjectRequest };
      if (res.success) {
        setProjectRequests(prev => prev.map(request => request.id === id ? res.data : request));
        setSelectedProjectRequestId(id);
      }
    } catch (error) {
      console.error('Failed to prepare build milestones:', error);
      alert('Failed to prepare build milestones');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBuildMilestone = async (requestId: string, milestoneId: string, data: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const res = await apiClient.updateBuildMilestone(requestId, milestoneId, data) as { success: boolean; data: ProjectRequest };
      if (res.success) {
        setProjectRequests(prev => prev.map(request => request.id === requestId ? res.data : request));
        setSelectedProjectRequestId(requestId);
      }
    } catch (error) {
      console.error('Failed to update build milestone:', error);
      alert('Failed to update build milestone');
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
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-white/10 bg-[#05070a]/95 px-4 py-3 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="grid h-10 w-10 place-items-center border border-white/10 text-white/64 transition hover:bg-white/[0.05] hover:text-white lg:hidden"
              aria-label="Open admin navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

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

        <main className="relative flex-1 overflow-y-auto p-4 custom-scrollbar sm:p-6 lg:p-7">

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
            <div className="mb-6 border-y border-white/10">
              <div className="px-5 py-6 lg:px-8">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setBuildOperatorView('overview')}
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/36 transition hover:text-white"
                  >
                    <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                    Operator queue
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => previousBuildOperatorView && setBuildOperatorView(previousBuildOperatorView.id)}
                      disabled={!previousBuildOperatorView}
                      className="flex min-h-10 items-center gap-2 border border-white/10 px-3 py-2 text-white/46 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                      aria-label="Previous build room"
                    >
                      <ChevronRight className="h-4 w-4 rotate-180" />
                      <span className="hidden text-[10px] font-black uppercase tracking-[0.14em] sm:block">
                        {previousBuildOperatorView?.label || 'Previous'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => nextBuildOperatorView && setBuildOperatorView(nextBuildOperatorView.id)}
                      disabled={!nextBuildOperatorView}
                      className="flex min-h-10 items-center gap-2 border border-white/10 px-3 py-2 text-white/46 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                      aria-label="Next build room"
                    >
                      <span className="hidden text-[10px] font-black uppercase tracking-[0.14em] sm:block">
                        {nextBuildOperatorView?.label || 'Next'}
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-white lg:text-5xl">
                  {selectedBuildOperatorView.label}
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-white/54">
                  {selectedBuildOperatorView.detail}
                </p>
              </div>
              <div className="border-t border-white/10 px-5 py-4 lg:px-8">
                <input
                  type="text"
                  placeholder="Search this room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-white/10 bg-white/[0.03] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white outline-none transition focus:border-ai-blue/50"
                />
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
              <div className="border-y border-white/10">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Build room</p>
                    <h3 className="mt-1 text-sm font-black text-white">{selectedBuildOperatorView.label}</h3>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/34">
                    {filteredProjectRequests.length} record{filteredProjectRequests.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="divide-y divide-white/10">
                  {filteredProjectRequests
                    .map((request) => {
                      const rowChapter = getAdminBuildChapter(request.status);
                      const rowProgress = getAdminBuildProgress(request.status);
                      const nextAction = getAdminNextAction(request);
                      const rowState = getAdminBuildState(request);
                      const summaryPreview = request.summary
                        ? request.summary.split('\n').find(line => line.trim().length > 0) || request.summary
                        : 'No project summary has been prepared yet.';
                      const quoteLabel = request.quotedAmount
                        ? `${request.quoteCurrency || 'USD'} ${request.quotedAmount}`
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
                          className={`grid w-full gap-5 px-5 py-5 text-left transition hover:bg-white/[0.025] xl:grid-cols-[minmax(0,1fr)_24rem_2rem] xl:items-center ${
                            closedBuildStatuses.includes(request.status) ? 'opacity-70 hover:opacity-100' : ''
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                              <span className="block truncate text-base font-black text-white">{request.title || request.businessName || 'Untitled build'}</span>
                              <span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/30">{projectLabel.replace(/_/g, ' ')}</span>
                            </span>
                            <span className="mt-2 block text-sm leading-6 text-white/52 line-clamp-2">
                              {summaryPreview}
                            </span>
                            <span className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/34">
                              <span>{request.user?.name || 'Unknown client'}</span>
                              <span>{request.user?.email || 'No client email'}</span>
                            </span>
                          </span>
                          <span className="grid gap-3 sm:grid-cols-4 xl:grid-cols-2">
                            {[
                              { label: 'Next', value: nextAction },
                              { label: 'Stage', value: rowChapter.label },
                              { label: 'State', value: rowState },
                              { label: 'Quote', value: quoteLabel },
                              { label: 'Submitted', value: createdAtLabel },
                            ].map((item) => (
                              <span key={item.label} className="min-w-0">
                                <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-white/26">{item.label}</span>
                                <span className="mt-1 block truncate text-[11px] font-black uppercase tracking-[0.1em] text-white/58">{item.value}</span>
                              </span>
                            ))}
                            <span className="sm:col-span-4 xl:col-span-2">
                              <span className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.14em] text-white/30">
                                <span>Progress</span>
                                <span>{rowProgress}%</span>
                              </span>
                              <span className="mt-2 block h-1 bg-white/10">
                                <span className="block h-full bg-white/72" style={{ width: `${rowProgress}%` }} />
                              </span>
                            </span>
                          </span>
                          <ChevronRight className="h-4 w-4 justify-self-end text-white/24" />
                        </button>
                      );
                    })}
                  {filteredProjectRequests.length === 0 && (
                    <div className="px-5 py-10 text-sm text-white/34">No requests match this operator view.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="min-h-[680px] border-y border-white/10">
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
                      <div className="border-b border-white/10 px-5 py-5 lg:px-8">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProjectRequestId(null);
                                setActiveAdminBuildChapter(null);
                              }}
                              className="mb-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/36 transition hover:text-white"
                            >
                              <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                              Build queue
                            </button>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ai-blue/70">
                              {selectedProjectRequest.id.slice(-8).toUpperCase()}
                            </p>
                            <h3 className="mt-2 truncate text-2xl font-black tracking-tight text-white">
                              {selectedProjectRequest.title || selectedProjectRequest.businessName || 'Untitled build'}
                            </h3>
                            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/42">
                              <span>{selectedProjectRequest.user?.name || 'Unknown client'}</span>
                              <span>{selectedProjectRequest.user?.email || 'No email'}</span>
                              <span>{new Date(selectedProjectRequest.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-b border-white/10 px-5 py-5 lg:px-8">
                        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-ai-blue/70">
                              Step {selectedAdminBuildChapterIndex + 1} of {adminBuildChapters.length}
                            </p>
                            <h4 className="mt-2 text-3xl font-black tracking-tight text-white">{selectedAdminBuildChapter.label}</h4>
                            {selectedAdminBuildChapter.id !== 'brief' && (
                              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">{selectedAdminBuildChapter.detail}</p>
                            )}
                          </div>
                          <div className="w-full md:max-w-sm">
                            <div className="flex items-center justify-between gap-4 text-[10px] font-black uppercase tracking-[0.14em] text-white/34">
                              <span>{selectedProjectRequest.status.replace(/_/g, ' ')}</span>
                              <span>{adminBuildPageProgress}%</span>
                            </div>
                            <div className="mt-2 h-1.5 bg-white/10">
                              <div className="h-full bg-ai-blue" style={{ width: `${adminBuildPageProgress}%` }} />
                            </div>
                            {selectedAdminBuildChapterIndex > 0 && (
                              <button
                                type="button"
                                onClick={() => setActiveAdminBuildChapter(adminBuildChapters[selectedAdminBuildChapterIndex - 1].id)}
                                className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/40 transition hover:text-white"
                              >
                                <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                                Previous step
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={`flex-1 ${
                        selectedAdminBuildChapter.id === 'brief'
                          ? 'divide-y divide-white/10'
                          : 'grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:divide-x lg:divide-white/10'
                      }`}>
                        <section className="px-5 py-6 lg:px-8">
                          <div className="mb-5 flex items-center justify-between gap-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/38">{selectedAdminBuildChapter.label}</h4>
                            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue">{selectedProjectRequest.status.replace(/_/g, ' ')}</span>
                          </div>
                          {selectedAdminBuildChapter.id === 'brief' && (
                          <>
                          <div className="border-y border-white/10">
                            <div className="hidden grid-cols-2 gap-px bg-white/10 xl:grid xl:grid-cols-5">
                              {selectedBriefAnswerRows.map((row) => (
                                <div key={row.question} className="min-w-0 bg-black px-4 py-4">
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
                          </>
                          )}

                          {selectedAdminBuildChapter.id === 'build' && (
                          <div className="mt-6 border-y border-white/10 py-5">
                            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-ai-blue">Build execution</p>
                                <h4 className="mt-2 text-lg font-black tracking-tight text-white">
                                  {selectedActiveBuildMilestone?.title || 'Milestones'}
                                </h4>
                                <p className="mt-2 max-w-2xl text-xs leading-6 text-white/42">
                                  These milestones appear in the client Build view after development starts. Keep notes short and client-facing.
                                </p>
                              </div>
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/42">
                                  {selectedBuildMilestoneProgress}% overall
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCreateDefaultBuildMilestones(selectedProjectRequest.id)}
                                  disabled={submitting}
                                  className="min-h-10 border border-ai-blue/30 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:bg-ai-blue/10 disabled:opacity-50"
                                >
                                  Prepare milestones
                                </button>
                              </div>
                            </div>

                            {selectedBuildMilestones.length === 0 ? (
                              <div className="border-y border-white/10 py-8 text-sm leading-7 text-white/42">
                                No execution milestones yet. They are created automatically when payment is confirmed and the build moves to Development.
                              </div>
                            ) : (
                              <div className="divide-y divide-white/10 border-y border-white/10">
                                {selectedBuildMilestones.map((milestone) => (
                                  <div key={milestone.id} className="grid gap-4 py-5 xl:grid-cols-[minmax(0,1fr)_12rem_7rem] xl:items-start">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-3">
                                        <span className={`h-2.5 w-2.5 ${
                                          milestone.status === 'completed' ? 'bg-expert-green' : milestone.status === 'in_progress' ? 'bg-ai-blue' : milestone.status === 'blocked' ? 'bg-red-400' : 'bg-white/18'
                                        }`} />
                                        <p className="text-sm font-black text-white">{milestone.title}</p>
                                        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/30">{milestone.status.replace(/_/g, ' ')}</span>
                                      </div>
                                      <p className="mt-2 text-xs leading-6 text-white/42">{milestone.description || 'No internal description.'}</p>
                                      <textarea
                                        defaultValue={milestone.clientNote || ''}
                                        onBlur={(e) => handleUpdateBuildMilestone(selectedProjectRequest.id, milestone.id, { clientNote: e.target.value })}
                                        className="mt-4 h-20 w-full resize-none border border-white/10 bg-white/[0.03] px-3 py-3 text-sm leading-6 text-white outline-none transition focus:border-ai-blue/50"
                                        placeholder="Client-facing update..."
                                      />
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                                      <select
                                        value={milestone.status}
                                        onChange={(e) => handleUpdateBuildMilestone(selectedProjectRequest.id, milestone.id, { status: e.target.value })}
                                        disabled={submitting}
                                        className="border border-white/10 bg-[#080b10] px-3 py-3 text-[10px] font-black uppercase tracking-widest text-white outline-none transition focus:border-ai-blue/50 disabled:opacity-50"
                                      >
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="blocked">Blocked</option>
                                      </select>
                                      <input
                                        type="date"
                                        defaultValue={milestone.dueDate ? milestone.dueDate.slice(0, 10) : ''}
                                        onBlur={(e) => handleUpdateBuildMilestone(selectedProjectRequest.id, milestone.id, { dueDate: e.target.value })}
                                        className="border border-white/10 bg-white/[0.03] px-3 py-3 text-sm font-semibold text-white outline-none transition focus:border-ai-blue/50"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.16em] text-white/28">Progress</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        defaultValue={milestone.progress || 0}
                                        onBlur={(e) => handleUpdateBuildMilestone(selectedProjectRequest.id, milestone.id, { progress: e.target.value })}
                                        className="w-full border border-white/10 bg-white/[0.03] px-3 py-3 text-sm font-black text-white outline-none transition focus:border-ai-blue/50"
                                      />
                                      <div className="mt-3 h-1.5 bg-white/10">
                                        <div className="h-full bg-ai-blue" style={{ width: `${milestone.progress || 0}%` }} />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          )}
                        </section>

                        <aside className={`border-t border-white/10 px-5 py-6 ${
                          selectedAdminBuildChapter.id === 'brief' ? 'lg:px-8' : 'lg:border-t-0 lg:px-6'
                        }`}>
                          {selectedAdminBuildChapter.id !== 'brief' && (
                            <h4 className="mb-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/38">
                              Decision panel
                            </h4>
                          )}
                          {selectedAdminBuildChapter.id === 'brief' && (
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
                                    onClick={() => handleUpdateProjectRequest(selectedProjectRequest.id, {
                                      status: 'in_review',
                                      clientNotes: buildBriefClarificationMessage()
                                    })}
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
                          )}
                          {selectedAdminBuildChapter.id === 'agreement' && (
                          <div className="mb-5 border-y border-expert-green/25 bg-expert-green/[0.035] py-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-expert-green">Payment gate</p>
                            <p className="mt-2 text-xs leading-6 text-white/52">
                              After quote acceptance, set the request to Payment agreement and add the deposit, milestone, or payment terms in the client note. Move to Development only after those terms are confirmed.
                            </p>
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateProjectRequest(selectedProjectRequest.id, {
                                  status: 'payment_agreement',
                                  paymentAgreementStatus: selectedProjectRequest.paymentAgreementStatus === 'confirmed' ? 'confirmed' : 'sent'
                                })}
                                disabled={submitting}
                                className="min-h-10 border border-expert-green/25 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-expert-green transition hover:bg-expert-green/10 disabled:opacity-50"
                              >
                                Send terms
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateProjectRequest(selectedProjectRequest.id, {
                                  paymentAgreementStatus: 'confirmed',
                                  status: 'in_development'
                                })}
                                disabled={submitting}
                                className="min-h-10 border border-ai-blue/30 bg-ai-blue/[0.05] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:bg-ai-blue/10 disabled:opacity-50"
                              >
                                Confirm and start
                              </button>
                            </div>
                          </div>
                          )}
                          {['review', 'launch'].includes(selectedAdminBuildChapter.id) && (
                          <div className="mb-5 border-y border-ai-blue/25 bg-ai-blue/[0.035] py-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-ai-blue">Staging review</p>
                            <p className="mt-2 text-xs leading-6 text-white/52">
                              Send the staging preview to the client, then wait for approval or changes before launch.
                            </p>
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateProjectRequest(selectedProjectRequest.id, {
                                  status: 'staging_review',
                                  stagingReviewStatus: 'sent'
                                })}
                                disabled={submitting}
                                className="min-h-10 border border-ai-blue/30 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:bg-ai-blue/10 disabled:opacity-50"
                              >
                                Send staging
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateProjectRequest(selectedProjectRequest.id, {
                                  status: 'handoff'
                                })}
                                disabled={submitting || selectedProjectRequest.stagingReviewStatus !== 'approved'}
                                className="min-h-10 border border-expert-green/25 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-expert-green transition hover:bg-expert-green/10 disabled:opacity-40"
                              >
                                Move to handoff
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateProjectRequest(selectedProjectRequest.id, {
                                  status: 'completed',
                                  completionNotes: selectedProjectRequest.completionNotes || 'Build handoff completed.'
                                })}
                                disabled={submitting || !['handoff', 'launched'].includes(selectedProjectRequest.status)}
                                className="min-h-10 border border-white/15 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/68 transition hover:bg-white/10 hover:text-white disabled:opacity-40 sm:col-span-2"
                              >
                                Mark complete
                              </button>
                            </div>
                          </div>
                          )}
                          <div className="space-y-5">
                            <div className={selectedAdminBuildChapter.id === 'scope' ? '' : 'hidden'}>
                              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Quote amount</label>
                              <input
                                type="number"
                                defaultValue={selectedProjectRequest.quotedAmount || ''}
                                onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { quotedAmount: e.target.value, status: selectedProjectRequest.status === 'submitted' || selectedProjectRequest.status === 'in_review' ? 'quote_ready' : selectedProjectRequest.status })}
                                className="w-full border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-ai-blue/50"
                                placeholder="0"
                              />
                            </div>
                            <div className={selectedAdminBuildChapter.id === 'scope' ? '' : 'hidden'}>
                              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Currency</label>
                              <input
                                type="text"
                                defaultValue={selectedProjectRequest.quoteCurrency || 'USD'}
                                onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { quoteCurrency: e.target.value || 'USD' })}
                                className="w-full border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold uppercase text-white outline-none transition focus:border-ai-blue/50"
                              />
                            </div>
                            <div className={selectedAdminBuildChapter.id === 'agreement' ? '' : 'hidden'}>
                              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Agreement type</label>
                              <select
                                defaultValue={selectedProjectRequest.paymentAgreementType || ''}
                                onChange={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { paymentAgreementType: e.target.value || null, status: selectedProjectRequest.status === 'approved' ? 'payment_agreement' : selectedProjectRequest.status })}
                                className="w-full border border-white/10 bg-[#080b10] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white outline-none transition focus:border-ai-blue/50"
                              >
                                <option value="">Select terms</option>
                                <option value="deposit">Deposit</option>
                                <option value="full_payment">Full payment</option>
                                <option value="milestone_payments">Milestone payments</option>
                                <option value="manual_agreement">Manual agreement</option>
                              </select>
                            </div>
                            <div className={selectedAdminBuildChapter.id === 'agreement' ? '' : 'hidden'}>
                              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Agreement status</label>
                              <select
                                value={selectedProjectRequest.paymentAgreementStatus || 'pending'}
                                onChange={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { paymentAgreementStatus: e.target.value, status: selectedProjectRequest.status === 'approved' ? 'payment_agreement' : selectedProjectRequest.status })}
                                className="w-full border border-white/10 bg-[#080b10] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white outline-none transition focus:border-ai-blue/50"
                              >
                                <option value="pending">Pending</option>
                                <option value="sent">Sent</option>
                                <option value="confirmed">Confirmed</option>
                              </select>
                            </div>
                            <div className={`grid gap-4 sm:grid-cols-2 ${selectedAdminBuildChapter.id === 'agreement' ? '' : 'hidden'}`}>
                              <div>
                                <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Total agreed</label>
                                <input
                                  type="number"
                                  defaultValue={selectedProjectRequest.totalAgreedAmount || ''}
                                  onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { totalAgreedAmount: e.target.value })}
                                  className="w-full border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-ai-blue/50"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Deposit</label>
                                <input
                                  type="number"
                                  defaultValue={selectedProjectRequest.depositAmount || ''}
                                  onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { depositAmount: e.target.value })}
                                  className="w-full border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-ai-blue/50"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            <div className={selectedAdminBuildChapter.id === 'agreement' ? '' : 'hidden'}>
                              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Due date</label>
                              <input
                                type="date"
                                defaultValue={selectedProjectRequest.paymentDueDate ? selectedProjectRequest.paymentDueDate.slice(0, 10) : ''}
                                onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { paymentDueDate: e.target.value })}
                                className="w-full border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-ai-blue/50"
                              />
                            </div>
                            <div className={selectedAdminBuildChapter.id === 'agreement' ? '' : 'hidden'}>
                              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Payment instructions</label>
                              <textarea
                                defaultValue={selectedProjectRequest.paymentInstructions || ''}
                                onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { paymentInstructions: e.target.value, status: selectedProjectRequest.status === 'approved' ? 'payment_agreement' : selectedProjectRequest.status })}
                                className="h-28 w-full resize-none border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-ai-blue/50"
                                placeholder="Deposit, milestone, or transfer instructions..."
                              />
                            </div>
                            <div className={selectedAdminBuildChapter.id === 'review' ? '' : 'hidden'}>
                              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Staging URL</label>
                              <input
                                type="url"
                                defaultValue={selectedProjectRequest.stagingUrl || ''}
                                onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { stagingUrl: e.target.value })}
                                className="w-full border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-ai-blue/50"
                                placeholder="https://preview..."
                              />
                            </div>
                            <div className={selectedAdminBuildChapter.id === 'review' ? '' : 'hidden'}>
                              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Staging notes</label>
                              <textarea
                                defaultValue={selectedProjectRequest.stagingNotes || ''}
                                onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { stagingNotes: e.target.value })}
                                className="h-24 w-full resize-none border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-ai-blue/50"
                                placeholder="What should the client review?"
                              />
                            </div>
                            <div className={selectedAdminBuildChapter.id === 'review' ? '' : 'hidden'}>
                              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Staging response</label>
                              <select
                                value={selectedProjectRequest.stagingReviewStatus || 'not_sent'}
                                onChange={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { stagingReviewStatus: e.target.value })}
                                className="w-full border border-white/10 bg-[#080b10] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white outline-none transition focus:border-ai-blue/50"
                              >
                                <option value="not_sent">Not sent</option>
                                <option value="sent">Sent</option>
                                <option value="changes_requested">Changes requested</option>
                                <option value="approved">Approved</option>
                              </select>
                            </div>
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
                            {selectedAdminBuildChapter.id !== 'brief' && (
                            <div>
                              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Client note</label>
                              <textarea
                                defaultValue={selectedProjectRequest.clientNotes || ''}
                                onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { clientNotes: e.target.value })}
                                className="h-28 w-full resize-none border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-ai-blue/50"
                                placeholder="Visible to client..."
                              />
                            </div>
                            )}
                            {selectedAdminBuildChapter.id !== 'brief' && (
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
                    <img 
                      src={item.url} 
                      alt={item.filename}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
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
