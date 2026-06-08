'use client';

import React, { 
  useState, 
  useEffect, 
  useCallback,
  useRef
} from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { 
  BarChart3, 
  Rocket, 
  MessageSquare, 
  CreditCard, 
  BookOpen, 
  LifeBuoy, 
  Terminal, 
  Zap, 
  Globe, 
  Shield, 
  Clock, 
  Bell, 
  Settings,
  ArrowLeft,
  ChevronRight,
  FileText,
  ShoppingBag,
  LogOut,
  User,
  Key,
  Users,
  MousePointer2,
  Download,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Check,
  TriangleAlert,
  Sparkles,
  Gift,
  ExternalLink
} from 'lucide-react';
import { apiClient, SupporterTier } from '@/lib/api';
import dynamic from 'next/dynamic';
import AssessmentModal from './AssessmentModal';

const SupportTickets = dynamic(() => import('./dashboard/SupportTickets'), { ssr: false });
const MilestoneViewer = dynamic(() => import('./dashboard/MilestoneViewer'), { ssr: false });
const BillingViewer = dynamic(() => import('./dashboard/BillingViewer'), { ssr: false });
const MessageViewer = dynamic(() => import('./dashboard/MessageViewer'), { ssr: false });
const ResourceLibrary = dynamic(() => import('./dashboard/ResourceLibrary'), { ssr: false });
const AddonMarketplace = dynamic(() => import('./dashboard/AddonMarketplace'), { ssr: false });

const normalizeDashboardTab = (tab?: string | null) => {
  const groupOnlyTabs: Record<string, string> = {
    workspaces: 'dashboard',
    support: 'messages',
    account: 'settings',
  };

  return tab ? groupOnlyTabs[tab] || tab : 'dashboard';
};
const PageEditor = dynamic(() => import('./dashboard/PageEditor'), { ssr: false });
const PerformanceAudit = dynamic(() => import('./dashboard/PerformanceAudit'), { ssr: false });
const EcommerceManager = dynamic(() => import('./dashboard/EcommerceManager'), { ssr: false });
const BookingManager = dynamic(() => import('./dashboard/BookingManager'), { ssr: false });
const SupporterDashboard = dynamic(() => import('./SupporterDashboard'), { ssr: false });
const AssessmentQuestionnaire = dynamic(() => import('./AssessmentQuestionnaire'), { ssr: false });

const mockTiers: SupporterTier[] = [
  {
    id: 'starter-id',
    name: 'Starter Member',
    slug: 'starter',
    monthlyPrice: 5,
    discountPercent: 5,
    displayOrder: 1,
    isActive: true,
    perks: ['member-badge', 'community-updates', 'community-access'],
  },
  {
    id: 'standard-id',
    name: 'Standard Member',
    slug: 'standard',
    monthlyPrice: 15,
    discountPercent: 10,
    displayOrder: 2,
    isActive: true,
    perks: ['early-access', 'voting-rights', 'starter-perks'],
  },
  {
    id: 'plus-id',
    name: 'Plus Member',
    slug: 'plus',
    monthlyPrice: 30,
    discountPercent: 15,
    displayOrder: 3,
    isActive: true,
    perks: ['roundtable-invites', 'product-council', 'standard-perks'],
  },
  {
    id: 'premium-id',
    name: 'Premium Member',
    slug: 'premium',
    monthlyPrice: 60,
    discountPercent: 20,
    displayOrder: 4,
    isActive: true,
    perks: ['ama-access', 'spotlight-status', 'plus-perks'],
  },
  {
    id: 'founders-id',
    name: 'Founders Circle',
    slug: 'founders-circle',
    monthlyPrice: 100,
    discountPercent: 25,
    displayOrder: 5,
    isActive: true,
    perks: ['private-sessions', 'vip-support', 'premium-perks'],
  },
];

interface ClientStats {
  activeNodes: number;
  uptime: number;
  securityLevel: string;
  latency: number;
}

interface ClientProject {
  id: string;
  recordType?: 'request' | 'project';
  assessmentId?: string;
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

interface ClientActivity {
  type: 'payment' | 'file';
  title: string;
  time: string;
  desc: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface BillingItem {
  id: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  reference: string;
}

interface MessageItem {
  id: string;
  subject: string;
  content: string;
  createdAt: string;
  sender?: string;
  isRead?: boolean;
}

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface ResourceItem {
  id: string;
  title: string;
  type: string;
  url: string;
  description?: string;
}

interface CustomDomain {
  id: string;
  domain: string;
  setup: string;
  status?: string;
  subscription?: {
    siteName: string;
    customName: string;
  };
}

type ApiRecord = Record<string, unknown>;
type ClientAssessment = ApiRecord & {
  id: string;
  createdAt: string;
  source?: string;
  responses: Record<string, unknown>;
};

interface BookingItem {
  id?: string;
  status?: string;
  createdAt?: string;
}

interface AnalysisResult {
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

const isApiRecord = (value: unknown): value is ApiRecord => Boolean(value && typeof value === 'object');
const readApiArray = <T,>(response: unknown, keys: string[]): T[] => {
  if (!isApiRecord(response)) return [];

  for (const key of keys) {
    const value = response[key];
    if (Array.isArray(value)) return value as T[];
  }

  return [];
};

const ClientDashboard: React.FC<{ onLogout?: () => void, initialTab?: string }> = ({ onLogout, initialTab }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(normalizeDashboardTab(initialTab));
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [billing, setBilling] = useState<BillingItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  const [isManagedDomainModalOpen, setIsManagedDomainModalOpen] = useState(false);
  const [newDomain, setNewDomain] = useState({ domain: '', siteId: '', setup: 'self' });
  const [managedDomain, setManagedDomain] = useState({ domainInterest: '' });
  const [isSubmittingDomain, setIsSubmittingDomain] = useState(false);
  const [verifyingDomainId, setVerifyingDomainId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<ClientAssessment | null>(null);
  const [activeBuildChapter, setActiveBuildChapter] = useState<string | null>(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showProjectRequestModal, setShowProjectRequestModal] = useState(false);
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [briefResponseAnswers, setBriefResponseAnswers] = useState<Record<string, string>>({});
  const [briefResponseSubmitting, setBriefResponseSubmitting] = useState(false);
  const [briefResponseFeedback, setBriefResponseFeedback] = useState('');
  const [stagingReviewMessage, setStagingReviewMessage] = useState('');
  const [stagingReviewSubmitting, setStagingReviewSubmitting] = useState(false);
  const [handoffMessage, setHandoffMessage] = useState('');
  const [handoffSubmitting, setHandoffSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [openSidebarGroup, setOpenSidebarGroup] = useState<string | null>(null);
  const [mobileRailGroup, setMobileRailGroup] = useState<string | null>(null);
  const [revealTier, setRevealTier] = useState<SupporterTier | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({ name: '', phone: '' });
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
  const socketRef = useRef<Socket | null>(null);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    // Check for search parameters
    const searchParams = new URLSearchParams(window.location.search);
    
    // Handle reveal parameter
    const revealId = searchParams.get('reveal');
    if (revealId) {
      handleReveal(revealId);
    }

    // Handle tab parameter
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(normalizeDashboardTab(tabParam));
    }
  }, []);

  const handleReveal = async (tierId: string) => {
    try {
      setIsRevealing(true);
      const res = await apiClient.fetchAllSupporterTiers();
      let tier = null;
      if (res.success) {
        tier = res.tiers.find(t => t.id === tierId);
      }
      
      // Fallback to mock tiers if API fails or tier not found (could be a mock ID)
      if (!tier) {
        tier = mockTiers.find(t => t.id === tierId);
      }

      if (tier) {
        setRevealTier(tier);
        // Wait for animation
        setTimeout(() => {
          setIsRevealing(false);
        }, 3000);
      } else {
        setIsRevealing(false);
      }
    } catch (err) {
      console.error('Reveal failed', err);
      setIsRevealing(false);
    }
  };

  const fetchData = useCallback(async (projectId?: string) => {
    try {
      setLoading(true);
      setFetchError(null);
      
      console.log('[ClientDashboard] Starting fetch...');
      
      // Fetch data sequentially to avoid blocking on slow requests
      // Each request has its own timeout and won't block others
      const fetchWithTimeout = async <T,>(promise: Promise<T>, name: string, timeoutMs = 20000): Promise<T | null> => {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        try {
          const result = await Promise.race([
            promise,
            new Promise<null>((resolve) => {
              timeout = setTimeout(() => {
                console.warn(`[ClientDashboard] ${name} timed out after ${timeoutMs}ms`);
                resolve(null);
              }, timeoutMs);
            })
          ]);
          if (timeout) clearTimeout(timeout);
          if (result) console.log(`[ClientDashboard] ${name} completed`);
          return result;
        } catch (err) {
          console.warn(`[ClientDashboard] ${name} unavailable:`, err);
          return null;
        }
      };

      // Fetch all data in parallel but with individual timeouts
      const [statsRes, projectsRes, activitiesRes, billingRes, messagesRes, ticketsRes, resourcesRes, domainsRes, bookingsRes] = await Promise.all([
        fetchWithTimeout(apiClient.getClientStats(projectId), 'stats'),
        fetchWithTimeout(apiClient.getClientProjects(), 'projects'),
        fetchWithTimeout(apiClient.getClientActivities(), 'activities'),
        fetchWithTimeout(apiClient.getClientBilling(), 'billing'),
        fetchWithTimeout(apiClient.getClientMessages(), 'messages'),
        fetchWithTimeout(apiClient.getClientSupportTickets(), 'tickets'),
        fetchWithTimeout(apiClient.getClientResources(), 'resources'),
        fetchWithTimeout(apiClient.getClientDomains(), 'domains', 30000),
        fetchWithTimeout(apiClient.getUserBookings(projectId), 'bookings'),
      ]);

      // Extract results - handle nulls from timed out requests
      const safeStatsRes = (statsRes || { success: false, stats: null }) as { success: boolean; stats: ClientStats | null };
      const safeProjectsRes = (projectsRes || { success: false, data: [] }) as ApiRecord & { success: boolean };
      const safeActivitiesRes = (activitiesRes || { success: false, data: [] }) as ApiRecord & { success: boolean };
      const safeBillingRes = (billingRes || { success: false, data: [] }) as ApiRecord & { success: boolean };
      const safeMessagesRes = (messagesRes || { success: false, messages: [] }) as ApiRecord & { success: boolean };
      const safeTicketsRes = (ticketsRes || { success: false, data: [] }) as ApiRecord & { success: boolean };
      const safeResourcesRes = (resourcesRes || { success: false, data: [] }) as ApiRecord & { success: boolean };
      const safeDomainsRes = (domainsRes || { success: false, domains: [] }) as ApiRecord & { success: boolean };
      const safeBookingsRes = bookingsRes || [];

      if (safeStatsRes.success && safeStatsRes.stats) setStats(safeStatsRes.stats);

      // Projects includes Build requests from ProjectRequest plus legacy active projects.
      const projectList = readApiArray<ApiRecord>(safeProjectsRes, ['data', 'projects', 'subscriptions']);
      
      const mappedProjects = projectList.map((p): ClientProject => ({
        id: String(p.id || ''),
        recordType: p.recordType === 'request' || p.recordType === 'project' ? p.recordType : undefined,
        assessmentId: typeof p.assessmentId === 'string' ? p.assessmentId : undefined,
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
      }));

      if (mappedProjects.length > 0) {
        setProjects(mappedProjects);

        if (selectedProjectId && !mappedProjects.some(project => project.id === selectedProjectId)) {
          setSelectedProjectId(null);
          setActiveBuildChapter(null);
        }
        
        if (projectId && !selectedProjectId) {
          const requestedProject = mappedProjects.find((p: { id: string }) => p.id === projectId);
          if (requestedProject) setSelectedProjectId(requestedProject.id);
        }
      } else {
        setProjects([]);
        if (selectedProjectId) {
          setSelectedProjectId(null);
          setActiveBuildChapter(null);
        }
      }

      const activityList = readApiArray<ClientActivity>(safeActivitiesRes, ['data', 'activities']);
      if (safeActivitiesRes.success && activityList) setActivities(activityList);

      const billingList = readApiArray<BillingItem>(safeBillingRes, ['data', 'billing']);
      if (safeBillingRes.success && billingList) setBilling(billingList);

      const messageList = readApiArray<MessageItem>(safeMessagesRes, ['messages', 'data']);
      if (safeMessagesRes.success && messageList) setMessages(messageList);
      
      const ticketList = readApiArray<SupportTicket>(safeTicketsRes, ['data', 'tickets']);
      if (safeTicketsRes.success && ticketList) setTickets(ticketList);

      const resourceList = readApiArray<ResourceItem>(safeResourcesRes, ['data', 'resources']);
      if (safeResourcesRes.success && resourceList) setResources(resourceList);

      const domainList = readApiArray<CustomDomain>(safeDomainsRes, ['domains', 'data']);
      if (safeDomainsRes.success && domainList) setDomains(domainList);

      if (Array.isArray(safeBookingsRes)) setBookings(safeBookingsRes as BookingItem[]);

      // Get user from localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setProfileData({ name: parsedUser.name || '', phone: parsedUser.phone || '' });
      }
    } catch (err) {
      console.error('[ClientDashboard] Fetch failed:', err);
      console.error('Fetch failed in ClientDashboard:', err);
      setFetchError('The workspace could not load all account data. Please check your connection and try again.');
    } finally {
      console.log('[ClientDashboard] Fetch complete, setting loading to false');
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    let normalizedUrl = socketUrl;
    if (!process.env.NEXT_PUBLIC_SOCKET_URL && normalizedUrl.includes('/api')) {
      normalizedUrl = normalizedUrl.replace(/\/api$/, '');
    }
    
    socketRef.current = io(normalizedUrl);

    socketRef.current.on('connect', () => {
      // Get userId from localStorage if available
      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            socketRef.current?.emit('join_user', user.id);
          } catch {
            // Ignore malformed local user data; the next fetch will recover the session state.
          }
        }
      }
    });

    socketRef.current.on('new_support_message', () => {
      if (activeTabRef.current === 'support' || activeTabRef.current === 'dashboard') {
        fetchData();
      }
    });

    socketRef.current.on('new_system_message', () => {
      if (activeTabRef.current === 'messages' || activeTabRef.current === 'dashboard') {
        fetchData();
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [fetchData]);

  const handleExportCodebase = async (projectId: string) => {
    setExportingId(projectId);
    try {
      const res = await apiClient.exportProjectCodebase(projectId);
      if (res.success && res.data) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${res.data.name.toLowerCase().replace(/\s+/g, '-')}-codebase.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch {
      alert('Failed to export codebase.');
    } finally {
      setExportingId(null);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.updateProfile(profileData);
      if (res.success) {
        setProfileMessage({ text: 'Profile synchronization complete.', type: 'success' });
        const updatedUser: UserData = { ...(user || { id: '', email: '' }), ...profileData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch {
      setProfileMessage({ text: 'Profile update failed.', type: 'error' });
    }
    setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
  };

  const handleAnalyzeSite = async (projectId: string, url: string) => {
    setIsAnalyzing(true);
    try {
      const res = await apiClient.analyzePerformance(url);
      setAnalysisResult(res.data as unknown as AnalysisResult);
      setActiveTab('audit');
    } catch {
      alert('Audit failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleViewAssessment = async (project: ClientProject) => {
    const fallbackAssessment = {
      id: project.assessmentId || project.id,
      createdAt: project.createdAt || new Date().toISOString(),
      source: 'Build brief',
      responses: {
        buildType: briefType,
        goals: briefGoals || 'Not recorded',
        requiredFeatures: briefFeatures || 'Not recorded',
        audience: briefAudience || 'Not recorded',
        existingMaterial: briefMaterial || 'Not recorded',
        styleDirection: briefStyle || 'Not recorded',
        budget: project.budget || 'Not specified',
        timeline: project.timeline || 'Flexible',
      },
    };

    if (!project.assessmentId) {
      setSelectedAssessment(fallbackAssessment);
      setShowAssessmentModal(true);
      return;
    }

    try {
      const res = await apiClient.getAssessmentDetails(project.assessmentId);
      if (res.success) {
        setSelectedAssessment(res.data || fallbackAssessment);
        setShowAssessmentModal(true);
      } else {
        setSelectedAssessment(fallbackAssessment);
        setShowAssessmentModal(true);
      }
    } catch {
      setSelectedAssessment(fallbackAssessment);
      setShowAssessmentModal(true);
    }
  };

  const handleQuoteResponse = async (project: ClientProject, action: 'accept' | 'discuss') => {
    if (!project?.id || quoteSubmitting) return;

    setQuoteSubmitting(true);
    try {
      const res = await apiClient.respondToProjectQuote(project.id, action, quoteMessage.trim());
      if (!res.success) {
        throw new Error(res.message || 'Failed to respond to quote');
      }

      setQuoteMessage('');
      await fetchData(project.id);
      setSelectedProjectId(project.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to respond to quote.');
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const handleAgreementPayment = async (project: ClientProject) => {
    if (!project?.id || paymentSubmitting) return;
    const amount = project.depositAmount || project.totalAgreedAmount || project.quotedAmount;
    if (!amount) {
      alert('Payment amount is not ready yet.');
      return;
    }

    setPaymentSubmitting(true);
    try {
      const res = await apiClient.initializePayment({
        amount,
        serviceType: 'build_agreement',
        description: `${project.name} agreement payment`,
        metadata: {
          projectRequestId: project.id,
          paymentStage: project.depositAmount ? 'deposit' : 'agreement',
          buildTitle: project.name,
          currency: project.quoteCurrency || 'USD'
        }
      });

      if (res.success && res.data?.paystack?.authorization_url) {
        window.location.href = res.data.paystack.authorization_url;
        return;
      }

      throw new Error(res.message || 'Payment checkout could not be started.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start payment checkout.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleBriefClarificationResponse = async (project: ClientProject) => {
    if (!project?.id || briefResponseSubmitting) return;
    const responseLines = briefResponseFields
      .map(field => {
        const answer = (briefResponseAnswers[field.label] || '').trim();
        return answer ? `${field.label}: ${answer}` : '';
      })
      .filter(Boolean);

    setBriefResponseSubmitting(true);
    setBriefResponseFeedback('');
    try {
      const res = await apiClient.respondToBriefClarification(project.id, responseLines.join('\n'));
      if (!res.success) {
        throw new Error(res.message || 'Failed to send brief clarification');
      }

      setBriefResponseAnswers({});
      setBriefResponseFeedback(res.message || 'Your clarification has been sent to the team.');
      await fetchData(project.id);
      setSelectedProjectId(project.id);
    } catch (err) {
      setBriefResponseFeedback(err instanceof Error ? err.message : 'Failed to send brief clarification.');
    } finally {
      setBriefResponseSubmitting(false);
    }
  };

  const handleStagingReviewResponse = async (project: ClientProject, action: 'approve' | 'changes') => {
    if (!project?.id || stagingReviewSubmitting) return;

    setStagingReviewSubmitting(true);
    try {
      const res = await apiClient.respondToStagingReview(project.id, action, stagingReviewMessage.trim());
      if (!res.success) {
        throw new Error(res.message || 'Failed to respond to staging review');
      }

      setStagingReviewMessage('');
      await fetchData(project.id);
      setSelectedProjectId(project.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to respond to staging review.');
    } finally {
      setStagingReviewSubmitting(false);
    }
  };

  const handleHandoffResponse = async (project: ClientProject, action: 'complete' | 'issue') => {
    if (!project?.id || handoffSubmitting) return;

    setHandoffSubmitting(true);
    try {
      const res = await apiClient.respondToHandoff(project.id, action, handoffMessage.trim());
      if (!res.success) {
        throw new Error(res.message || 'Failed to respond to handoff');
      }

      setHandoffMessage('');
      await fetchData(project.id);
      setSelectedProjectId(project.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to respond to handoff.');
    } finally {
      setHandoffSubmitting(false);
    }
  };

  const handleLogoutAction = () => {
    apiClient.logout();
    if (onLogout) onLogout();
    router.push('/login');
  };

  const handleVerifyDomain = async (domainId: string) => {
    setVerifyingDomainId(domainId);
    try {
      const res = await apiClient.verifyDomainDNS(domainId);
      if (res.success && res.verified) {
        alert('Domain verified successfully!');
        fetchData();
      } else {
        alert(res.message || 'Verification failed. Please check your DNS records.');
      }
    } catch {
      alert('Verification failed.');
    } finally {
      setVerifyingDomainId(null);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;
    try {
      await apiClient.delete(`/client/domains/${domainId}`);
      alert('Domain deleted.');
      fetchData();
    } catch {
      alert('Failed to delete domain.');
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-[#05070a] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-ai-blue/10 rounded-full animate-spin border-t-ai-blue shadow-[0_0_30px_rgba(0,102,255,0.2)]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Terminal className="w-8 h-8 text-ai-blue animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-black uppercase tracking-[0.4em] text-white">Loading</h2>
            <p className="text-[10px] font-mono text-medium-gray uppercase tracking-widest animate-pulse">Preparing your Sitemendr workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  type DashboardNavItem = {
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

  const openTickets = tickets.filter(ticket => ticket.status !== 'resolved' && ticket.status !== 'closed').length;
  const unreadMessages = messages.filter(m => !m.isRead).length;

  const mainNav: DashboardNavItem[] = [
    { id: 'dashboard', label: 'Overview', icon: <BarChart3 className="w-5 h-5" /> },
    {
      id: 'workspaces',
      label: 'Workspaces',
      icon: <Rocket className="w-5 h-5" />,
      children: [
        { id: 'projects', label: 'Build' },
        { id: 'audit', label: 'Repair' },
        { id: 'business', label: 'Merchant' },
      ],
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: <FileText className="w-5 h-5" />,
      count: projects.length,
      children: [
        { id: 'projects', label: 'Project records', count: projects.length },
        { id: 'editor', label: 'Editor' },
        { id: 'audit', label: 'Performance' },
        { id: 'domains', label: 'Domains', count: domains.length },
      ],
    },
  ];

  const manageNav: DashboardNavItem[] = [
    {
      id: 'business',
      label: 'Merchant',
      icon: <ShoppingBag className="w-5 h-5" />,
      children: [
        { id: 'ecommerce', label: 'Commerce' },
        { id: 'booking', label: 'Bookings', count: bookings.length },
      ],
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: <CreditCard className="w-5 h-5" />,
      count: billing.length,
      children: [
        { id: 'billing', label: 'Invoices', count: billing.length },
        { id: 'addons', label: 'Add-ons' },
      ],
    },
    {
      id: 'support',
      label: 'Support',
      icon: <LifeBuoy className="w-5 h-5" />,
      count: tickets.length + unreadMessages,
      children: [
        { id: 'messages', label: 'Messages', count: unreadMessages },
        { id: 'tickets', label: 'Tickets', count: openTickets },
        { id: 'resources', label: 'Resources', count: resources.length },
      ],
    },
  ];

  const accountNav: DashboardNavItem[] = [
    {
      id: 'account',
      label: 'Account',
      icon: <User className="w-5 h-5" />,
      children: [
        { id: 'supporter', label: 'Community' },
        { id: 'settings', label: 'Settings' },
      ],
    },
  ];

  const allNavItems = [
    ...mainNav,
    ...manageNav,
    ...accountNav,
    { id: 'editor', label: 'Editor', icon: <MousePointer2 className="w-5 h-5" /> },
    { id: 'audit', label: 'Performance', icon: <Zap className="w-5 h-5" /> },
    { id: 'domains', label: 'Domains', icon: <Globe className="w-5 h-5" /> },
    { id: 'ecommerce', label: 'Commerce', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'booking', label: 'Bookings', icon: <Clock className="w-5 h-5" /> },
    { id: 'addons', label: 'Add-ons', icon: <Plus className="w-5 h-5" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'tickets', label: 'Tickets', icon: <LifeBuoy className="w-5 h-5" /> },
    { id: 'resources', label: 'Resources', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'supporter', label: 'Community', icon: <Users className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];
  const currentTab = allNavItems.find(item => item.id === activeTab);

  const navGroups: Record<string, string[]> = {
    workspaces: ['workspaces', 'projects', 'audit', 'business'],
    projects: ['projects', 'domains', 'editor', 'audit'],
    business: ['business', 'ecommerce', 'booking'],
    billing: ['billing', 'addons'],
    support: ['support', 'messages', 'tickets', 'resources'],
    account: ['account', 'supporter', 'settings'],
  };

  const isNavActive = (id: string) => (navGroups[id] || [id]).includes(activeTab);
  const openClientTab = (tabId: string) => {
    setActiveTab(tabId);
    setOpenSidebarGroup(null);
    setMobileRailGroup(null);
    setSelectedProjectId(null);
    setIsSidebarOpen(false);
  };
  const selectedProject = selectedProjectId ? projects.find(project => project.id === selectedProjectId) : projects.find(project => project.isCurrent) || projects[0];
  const selectedProjectRecord = selectedProjectId ? projects.find(project => project.id === selectedProjectId) || null : projects[0] || null;
  const buildLifecycle = [
    { status: 'submitted', label: 'Submitted', detail: 'Request received' },
    { status: 'in_review', label: 'Review', detail: 'Team is scoping' },
    { status: 'quote_ready', label: 'Quote', detail: 'Scope and quote ready' },
    { status: 'approved', label: 'Approved', detail: 'Build confirmed' },
    { status: 'payment_agreement', label: 'Agreement', detail: 'Payment terms' },
    { status: 'in_development', label: 'Development', detail: 'Work in progress' },
    { status: 'staging_review', label: 'Staging', detail: 'Preview review' },
    { status: 'launched', label: 'Launched', detail: 'Live release' },
    { status: 'handoff', label: 'Handoff', detail: 'Ownership transfer' },
    { status: 'completed', label: 'Complete', detail: 'Build closed' },
  ];
  const buildJourneyChapters = [
    { id: 'brief', label: 'Brief', eyebrow: 'Intake', detail: 'Request, goals, scope inputs', statuses: ['submitted', 'in_review'] },
    { id: 'scope', label: 'Scope', eyebrow: 'Quote', detail: 'Quote response and scope decision', statuses: ['quote_ready', 'approved'] },
    { id: 'agreement', label: 'Agreement', eyebrow: 'Payment', detail: 'Payment gate before production', statuses: ['payment_agreement'] },
    { id: 'build', label: 'Build', eyebrow: 'Delivery', detail: 'Milestones and team updates', statuses: ['in_development'] },
    { id: 'review', label: 'Review', eyebrow: 'Staging', detail: 'Preview approval or changes', statuses: ['staging_review'] },
    { id: 'launch', label: 'Launch', eyebrow: 'Handoff', detail: 'Live link, access, completion', statuses: ['launched', 'handoff', 'completed'] },
  ];
  const statusAlias: Record<string, string> = {
    quoted: 'quote_ready',
    awaiting_payment: 'approved',
    payment_pending: 'payment_agreement',
    active: 'in_development',
    operational: 'launched',
  };
  const normalizeBuildStatus = (status?: string) => statusAlias[status || ''] || status || 'submitted';
  const requestStatuses = [...buildLifecycle.map(step => step.status), 'quoted', 'awaiting_payment', 'rejected', 'cancelled', 'archived'];
  const currentBuildRecord = selectedProjectRecord || projects[0] || null;
  const currentBuildStatus = normalizeBuildStatus(currentBuildRecord?.status);
  const currentBuildPlanLabel = currentBuildRecord?.planType?.replace(/_/g, ' ') || 'Custom build';
  const currentBuildSubmittedLabel = currentBuildRecord?.createdAt
    ? new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(currentBuildRecord.createdAt))
    : 'Recently submitted';
  const currentLifecycleIndex = Math.max(0, buildLifecycle.findIndex(step => step.status === currentBuildStatus));
  const defaultBuildChapter = buildJourneyChapters.find(chapter => chapter.statuses.includes(currentBuildStatus)) || buildJourneyChapters[0];
  const defaultBuildChapterIndex = Math.max(0, buildJourneyChapters.findIndex(chapter => chapter.id === defaultBuildChapter.id));
  const requestedBuildChapter = buildJourneyChapters.find(chapter => chapter.id === activeBuildChapter);
  const requestedBuildChapterIndex = requestedBuildChapter ? buildJourneyChapters.findIndex(chapter => chapter.id === requestedBuildChapter.id) : -1;
  const selectedBuildChapter = requestedBuildChapter && (requestedBuildChapterIndex <= defaultBuildChapterIndex || currentBuildStatus === 'completed')
    ? requestedBuildChapter
    : defaultBuildChapter;
  const selectedBuildChapterIndex = Math.max(0, buildJourneyChapters.findIndex(chapter => chapter.id === selectedBuildChapter.id));
  const nextBuildChapter = buildJourneyChapters[Math.min(selectedBuildChapterIndex + 1, buildJourneyChapters.length - 1)];
  const buildPageProgress = Math.round(((defaultBuildChapterIndex + 1) / buildJourneyChapters.length) * 100);
  const hasScopeProposal = Boolean(currentBuildRecord?.quotedAmount) || [
    'quote_ready',
    'approved',
    'payment_agreement',
    'in_development',
    'staging_review',
    'launched',
    'handoff',
    'completed',
  ].includes(currentBuildStatus);
  const scopeClientNotesLower = currentBuildRecord?.clientNotes?.toLowerCase() || '';
  const hasScopeDiscussion = currentBuildStatus === 'quote_ready' && scopeClientNotesLower.includes('client wants to discuss the quote');
  const isScopeApproved = ['approved', 'payment_agreement', 'in_development', 'staging_review', 'launched', 'handoff', 'completed'].includes(currentBuildStatus);
  const scopeDecisionLabel = currentBuildStatus === 'quote_ready'
    ? hasScopeDiscussion ? 'Discussion sent' : 'Awaiting decision'
    : isScopeApproved
      ? 'Scope approved'
      : 'Client review';
  const paymentAgreementStatusLabel = currentBuildRecord?.paymentAgreementStatus === 'confirmed'
    ? 'Payment confirmed'
    : currentBuildRecord?.paymentAgreementStatus === 'sent'
      ? 'Payment terms sent'
      : 'Awaiting payment terms';
  const activeBuildLifecycleLabel = currentBuildStatus === 'payment_agreement'
    ? paymentAgreementStatusLabel
    : buildLifecycle[currentLifecycleIndex]?.label || 'Submitted';
  const selectedBuildChapterDetail = selectedBuildChapter.id === 'agreement'
    ? currentBuildRecord?.paymentAgreementStatus === 'confirmed'
      ? 'Payment is confirmed. Development can start next.'
      : currentBuildStatus === 'approved'
        ? 'Payment terms are being prepared.'
        : 'Complete payment before production begins.'
    : selectedBuildChapter.detail;
  const canPayAgreement = currentBuildStatus === 'payment_agreement'
    && currentBuildRecord?.paymentAgreementStatus !== 'confirmed'
    && Boolean(currentBuildRecord?.depositAmount || currentBuildRecord?.totalAgreedAmount || currentBuildRecord?.quotedAmount);
  const paymentAgreementTypeLabel = currentBuildRecord?.paymentAgreementType === 'deposit'
    ? 'Deposit payment'
    : currentBuildRecord?.paymentAgreementType === 'full_payment'
      ? 'Full payment'
      : currentBuildRecord?.paymentAgreementType === 'milestone_payments'
        ? 'Milestone payments'
        : currentBuildRecord?.paymentAgreementType === 'manual_agreement'
          ? 'Manual agreement'
          : 'To be confirmed';
  const paymentDueDateLabel = currentBuildRecord?.paymentDueDate
    ? new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(currentBuildRecord.paymentDueDate))
    : 'Not set';
  const agreementTotalLabel = currentBuildRecord?.totalAgreedAmount
    ? `${currentBuildRecord.quoteCurrency || 'USD'} ${currentBuildRecord.totalAgreedAmount}`
    : currentBuildRecord?.quotedAmount
      ? `${currentBuildRecord.quoteCurrency || 'USD'} ${currentBuildRecord.quotedAmount}`
      : 'Pending';
  const agreementDepositLabel = currentBuildRecord?.depositAmount
    ? `${currentBuildRecord.quoteCurrency || 'USD'} ${currentBuildRecord.depositAmount}`
    : 'Not set';
  const currentBuildMilestones = currentBuildRecord?.buildMilestones || [];
  const activeBuildMilestone = currentBuildMilestones.find(milestone => milestone.status === 'in_progress')
    || currentBuildMilestones.find(milestone => milestone.status === 'pending')
    || currentBuildMilestones[currentBuildMilestones.length - 1];
  const buildBriefLines = (currentBuildRecord?.summary || '').split('\n').filter(Boolean);
  const getBriefValue = (label: string) => {
    const match = buildBriefLines.find(line => line.toLowerCase().startsWith(`${label.toLowerCase()}:`));
    return match ? match.slice(label.length + 1).trim() : '';
  };
  const briefGoals = getBriefValue('Goals');
  const briefFeatures = getBriefValue('Required features');
  const briefAudience = getBriefValue('Users');
  const briefMaterial = getBriefValue('Existing material');
  const briefStyle = getBriefValue('Style direction');
  const briefInsight = getBriefValue('Assessment insight');
  const briefType = getBriefValue('Build type') || getBriefValue('Business type') || currentBuildRecord?.planType?.replace(/_/g, ' ') || 'Custom build';
  const clientBriefNote = currentBuildRecord?.clientNotes?.trim() || '';
  const clientBriefNoteLower = clientBriefNote.toLowerCase();
  const clientBriefClarificationNote = currentBuildStatus === 'in_review'
    ? clientBriefNote || 'The team is reviewing your brief and may need a few more details before Scope opens.'
    : '';
  const hasSentBriefClarification = currentBuildStatus === 'in_review' && clientBriefNoteLower.includes('client sent brief clarification');
  const isBriefApprovedForScope = [
    'quote_ready',
    'approved',
    'payment_agreement',
    'in_development',
    'staging_review',
    'launched',
    'handoff',
    'completed',
  ].includes(currentBuildStatus);
  const hasBriefClarification = currentBuildStatus === 'in_review' && !hasSentBriefClarification;
  const clientBriefState = isBriefApprovedForScope
    ? { label: 'Brief approved', tone: 'open', detail: 'Scope is open. Review the proposal and next decision there.' }
    : hasSentBriefClarification
      ? { label: 'Brief details sent', tone: 'review', detail: 'Your update has been sent to the team.' }
    : hasBriefClarification
      ? { label: 'Brief update requested', tone: 'action', detail: 'Answer the requested questions so the team can continue Scope.' }
      : { label: 'Brief in review', tone: 'review', detail: 'No action is needed from you right now.' };
  const clientBriefClarificationLines = clientBriefClarificationNote.split('\n').map(line => line.trim()).filter(Boolean);
  const clientBriefClarificationItems = clientBriefClarificationLines[0]?.toLowerCase().startsWith('please clarify:')
    ? clientBriefClarificationLines[0]
      .replace(/^Please clarify:\s*/i, '')
      .replace(/\.$/, '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
    : [];
  const clientBriefTeamMessage = clientBriefClarificationItems.length
    ? clientBriefClarificationLines.slice(1).join('\n')
    : clientBriefClarificationNote;
  const clientBriefTeamMessages = clientBriefTeamMessage.split('\n').map(message => message.trim()).filter(Boolean);
  const briefClarificationAllowedItems = [
    'Content/assets',
    'Pages/sections',
    'Services/products',
    'Lead form fields',
    'Design references',
    'Feature scope',
    'Audience/details',
    'Budget clarity',
    'Timeline clarity',
    'Brief clarification'
  ];
  const briefClarificationAllowedSet = new Set(briefClarificationAllowedItems.map(item => item.toLowerCase()));
  const clientBriefSubmittedResponse = hasSentBriefClarification
    ? clientBriefNote
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.toLowerCase().includes('client sent brief clarification'))
      .map(line => line.replace(/^Client message:\s*/i, ''))
      .filter(line => {
        const [label] = line.split(':');
        return briefClarificationAllowedSet.has(label.trim().toLowerCase());
      })
      .join('\n')
    : '';
  const getBriefResponseField = (item: string) => {
    const key = item.toLowerCase();
    if (key.includes('budget')) {
      return {
        label: item,
        prompt: 'Choose the budget direction that fits this build.',
        type: 'select',
        options: ['Not sure yet', 'Under USD 1,000', 'USD 1,000 - 2,500', 'USD 2,500 - 5,000', 'USD 5,000+']
      };
    }
    if (key.includes('timeline')) {
      return {
        label: item,
        prompt: 'Choose the timing that feels realistic.',
        type: 'select',
        options: ['Flexible', 'As soon as possible', 'This month', '1-2 months', 'Not sure yet']
      };
    }
    if (key.includes('feature')) {
      return {
        label: item,
        prompt: 'List the exact features or actions this build must support.',
        type: 'textarea'
      };
    }
    if (key.includes('audience')) {
      return {
        label: item,
        prompt: 'Describe who this is for and what they need to do.',
        type: 'textarea'
      };
    }
    if (key.includes('content') || key.includes('asset')) {
      return {
        label: item,
        prompt: 'Tell us what content, images, copy, files, or brand material you already have.',
        type: 'textarea'
      };
    }
    return {
      label: item,
      prompt: 'Add the missing detail for this part of the brief.',
      type: 'textarea'
    };
  };
  const filteredBriefClarificationItems = (clientBriefClarificationItems.length ? clientBriefClarificationItems : ['Brief clarification'])
    .filter(item => briefClarificationAllowedSet.has(item.toLowerCase()));
  const briefResponseFields = (filteredBriefClarificationItems.length ? filteredBriefClarificationItems : ['Brief clarification'])
    .map(getBriefResponseField);
  const getBriefResponseGroup = (label: string) => {
    const key = label.toLowerCase();
    if (key.includes('content') || key.includes('pages') || key.includes('services')) return 'Content';
    if (key.includes('feature') || key.includes('audience') || key.includes('lead') || key.includes('design')) return 'Project direction';
    if (key.includes('budget') || key.includes('timeline')) return 'Planning';
    return 'Other details';
  };
  const briefResponseGroups = ['Content', 'Project direction', 'Planning', 'Other details']
    .map((group) => ({
      group,
      fields: briefResponseFields.filter((field) => getBriefResponseGroup(field.label) === group)
    }))
    .filter((group) => group.fields.length > 0);
  const answeredBriefResponseCount = briefResponseFields.filter(field => (briefResponseAnswers[field.label] || '').trim()).length;
  const clientBriefRows = [
    { label: 'Build type', value: briefType || 'Not answered' },
    { label: 'Goal', value: briefGoals || 'Not answered' },
    { label: 'Features', value: briefFeatures || 'Not answered' },
    { label: 'Audience', value: briefAudience || 'Not answered' },
    { label: 'Material', value: briefMaterial || 'Not answered' },
    { label: 'Style', value: briefStyle || 'Not answered' },
    { label: 'Budget', value: currentBuildRecord?.budget || 'Not specified' },
    { label: 'Timeline', value: currentBuildRecord?.timeline || 'Flexible' },
    { label: 'Priority', value: currentBuildRecord?.priority || 'Normal' },
  ];
  const buildMilestoneProgress = currentBuildMilestones.length
    ? Math.round(currentBuildMilestones.reduce((sum, milestone) => sum + (milestone.progress || (milestone.status === 'completed' ? 100 : 0)), 0) / currentBuildMilestones.length)
    : currentBuildRecord?.progress || 0;
  const getLifecycleIndex = (project?: ClientProject | null) => Math.max(0, buildLifecycle.findIndex(step => step.status === normalizeBuildStatus(project?.status)));
  const isProjectRequest = (project?: ClientProject | null) => Boolean(project && (project.recordType === 'request' || requestStatuses.includes(project.status)));
  const averageProgress = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + (project.progress || 0), 0) / projects.length)
    : 0;
  const renderNavSection = (label: string, items: DashboardNavItem[]) => (
    <div className="space-y-1">
      <span className={`block px-3 pb-1 text-[9px] font-black uppercase tracking-[0.24em] text-white/28 transition-all duration-200 ${
        isSidebarExpanded ? 'md:opacity-100' : 'md:h-0 md:overflow-hidden md:opacity-0'
      }`}>
        {label}
      </span>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id} className="space-y-1">
            <button
              type="button"
              onClick={() => {
                if (item.children?.length) {
                  setIsSidebarExpanded(true);
                  setOpenSidebarGroup(openSidebarGroup === item.id ? null : item.id);
                } else {
                  setActiveTab(item.id);
                  setOpenSidebarGroup(null);
                  setSelectedProjectId(null);
                  setIsSidebarOpen(false);
                }
              }}
              className={`group/nav relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                isSidebarExpanded ? 'md:justify-start' : 'md:justify-center'
              } ${
                isNavActive(item.id)
                  ? 'bg-ai-blue/14 text-white'
                  : 'text-white/52 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <span className={`grid h-8 w-8 shrink-0 place-items-center transition-all ${
                isNavActive(item.id)
                  ? 'text-ai-blue'
                  : 'text-white/42 group-hover/nav:text-white/80'
              }`}>
                {item.icon}
              </span>
              <span className={`min-w-0 flex-1 truncate text-[13px] font-semibold tracking-tight transition-all duration-200 ${
                isSidebarExpanded ? 'md:w-auto md:opacity-100' : 'md:w-0 md:flex-none md:opacity-0'
              }`}>
                {item.label}
              </span>
              {Boolean(item.count) && (
                <span className={`min-w-5 rounded-full bg-ai-blue px-1.5 py-0.5 text-center text-[9px] font-black text-white transition-all duration-200 ${
                  isSidebarExpanded ? 'md:static md:bg-white/10 md:text-white/78' : 'md:absolute md:right-1.5 md:top-1.5'
                }`}>
                  {item.count}
                </span>
              )}
              {item.children?.length && (
                <ChevronRight className={`hidden h-4 w-4 shrink-0 text-white/28 transition md:block ${
                  isSidebarExpanded && openSidebarGroup === item.id ? 'rotate-90 text-white/60' : ''
                } ${isSidebarExpanded ? 'opacity-100' : 'opacity-0'}`} />
              )}
            </button>

            {item.children?.length && isSidebarExpanded && openSidebarGroup === item.id && (
              <div className="ml-11 space-y-1 border-l border-white/[0.07] pl-3">
                {item.children.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(child.id);
                      setSelectedProjectId(null);
                      setIsSidebarOpen(false);
                    }}
                    className={`flex min-h-9 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[12px] font-semibold transition ${
                      activeTab === child.id
                        ? 'bg-white/[0.07] text-white'
                        : 'text-white/44 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <span className="truncate">{child.label}</span>
                    {Boolean(child.count) && (
                      <span className="min-w-5 rounded-full bg-white/10 px-1.5 py-0.5 text-center text-[9px] font-black text-white/70">
                        {child.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#05070a] text-white font-sans selection:bg-ai-blue/30 overflow-x-hidden">
      {/* Workspace background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff07_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:80px_80px] opacity-30"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_64%_4%,rgba(0,102,255,0.16),transparent_34%),radial-gradient(circle_at_88%_78%,rgba(245,158,11,0.10),transparent_30%),radial-gradient(circle_at_18%_84%,rgba(16,185,129,0.08),transparent_30%)]"></div>
      </div>

      <div className="flex relative z-10 min-h-screen">
        {mobileRailGroup && (
          <button
            type="button"
            className="fixed inset-0 z-[45] bg-transparent md:hidden"
            aria-label="Close mobile navigation"
            onClick={() => setMobileRailGroup(null)}
          />
        )}

        <nav className={`fixed left-0 top-1/2 z-[55] flex -translate-y-1/2 flex-col gap-4 py-3 transition-[width,padding] duration-200 md:hidden ${
          mobileRailGroup ? 'w-64 px-2' : 'w-9 px-0'
        }`}>
          {[...mainNav, ...manageNav, ...accountNav].map((item) => {
            const isActive = isNavActive(item.id);
            const isRailOpen = mobileRailGroup === item.id;

            return (
              <div key={item.id} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (item.children?.length) {
                      setMobileRailGroup(isRailOpen ? null : item.id);
                    } else {
                      openClientTab(item.id);
                    }
                  }}
                  className={`relative grid h-11 w-9 shrink-0 place-items-center transition ${
                    isActive || isRailOpen
                      ? 'text-ai-blue'
                      : 'text-white/66 hover:text-white'
                  }`}
                  aria-label={item.label}
                >
                  {item.icon}
                  {Boolean(item.count) && (
                    <span className="absolute right-1 top-1 min-w-4 rounded-full bg-ai-blue px-1 text-center text-[8px] font-black text-white">
                      {item.count}
                    </span>
                  )}
                </button>

                {isRailOpen && item.children?.length && (
                  <div className="mt-2 w-full pl-10 py-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-ai-blue">
                      {item.label}
                    </p>
                    <div className="mt-5 grid gap-1">
                      {item.children.map((child) => (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => {
                            setMobileRailGroup(null);
                            openClientTab(child.id);
                          }}
                          className={`group flex min-h-12 w-fit max-w-full items-center justify-between gap-4 py-3 text-left transition ${
                            activeTab === child.id
                              ? 'text-white'
                              : 'text-white/52 hover:text-white'
                          }`}
                        >
                          <span className="min-w-0 border-b border-white/16 pb-1 text-sm font-black tracking-tight transition group-hover:border-white/34">
                            {child.label}
                          </span>
                          {Boolean(child.count) && (
                            <span className="shrink-0 text-[10px] font-black text-ai-blue">{child.count}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={handleLogoutAction}
            className="relative grid h-11 w-9 shrink-0 place-items-center text-red-300/70 transition hover:text-red-300"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </nav>

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#05070a]/94 backdrop-blur-2xl border-r border-white/[0.10] transition-[width,transform] duration-300 transform overflow-x-hidden overflow-y-auto md:translate-x-0 ${
          isSidebarExpanded ? 'md:w-64' : 'md:w-20'
        } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-full flex flex-col px-3 py-4 pb-8">
            <div className={`mb-6 flex items-center gap-3 px-1 transition-all duration-200 ${
              isSidebarExpanded ? 'justify-between' : 'justify-center'
            }`}>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`group hidden min-w-0 items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-white/[0.05] md:flex ${
                  isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 overflow-hidden opacity-0'
                }`}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-[#05070a]">
                  <Terminal className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black tracking-tight text-white">Sitemendr</span>
                  <span className="block truncate text-[10px] font-semibold text-white/42">Client workspace</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsSidebarExpanded(value => !value)}
                className="hidden md:grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white/52 transition hover:bg-white/[0.06] hover:text-white"
                aria-label={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {isSidebarExpanded ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
              </button>
            </div>

            <nav className="flex-1 space-y-7">
              {renderNavSection('Main', mainNav)}
              {renderNavSection('Manage', manageNav)}
              {renderNavSection('Account', accountNav)}
            </nav>

            <div className="pt-5 mt-auto space-y-2 border-t border-white/[0.07]">
              <button 
                onClick={handleLogoutAction}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-white/44 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-semibold ${
                  isSidebarExpanded ? 'md:justify-start' : 'md:justify-center'
                }`}
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className={`transition-all duration-200 ${
                  isSidebarExpanded ? 'md:w-auto md:opacity-100' : 'md:w-0 md:overflow-hidden md:opacity-0'
                }`}>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 min-h-screen transition-[margin,padding] duration-300 md:pl-0 ${
          mobileRailGroup ? 'pl-64' : 'pl-0'
        } ${isSidebarExpanded ? 'md:ml-64' : 'md:ml-20'}`}>
          {/* Header */}
          <header className="min-h-20 flex items-center justify-between gap-5 px-5 sm:px-8 lg:px-10 sticky top-0 z-40">
            <div className="flex min-w-0 items-center gap-3">
              {activeTab !== 'dashboard' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'projects' && selectedProjectId) {
                      setSelectedProjectId(null);
                      setActiveBuildChapter(null);
                    } else {
                      setActiveTab('dashboard');
                      setSelectedProjectId(null);
                    }
                  }}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white/74 transition hover:bg-white/[0.06] hover:text-white"
                  aria-label={activeTab === 'projects' && selectedProjectId ? 'Back to projects' : 'Back to categories'}
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              ) : null}
              <div className="min-w-0">
                <h1 className="truncate text-base font-black tracking-tight md:text-lg">
                  {activeTab === 'dashboard'
                    ? 'Overview'
                    : activeTab === 'projects' && selectedProjectId
                      ? currentBuildRecord?.name || selectedProject?.name || 'Build project'
                      : currentTab?.label || 'Workspace'}
                </h1>
                {activeTab === 'projects' && selectedProjectId && currentBuildRecord && (
                  <p className="mt-1 truncate text-[11px] font-semibold text-yellow-300">
                    Submitted {currentBuildSubmittedLabel}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="hidden sm:flex items-center gap-3 px-2 py-2 group cursor-pointer transition-all"
              >
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-tight leading-none text-white/72">{user?.name || 'Account'}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/[0.055] flex items-center justify-center text-white/72 group-hover:bg-white/10 group-hover:text-white transition">
                  <User className="w-5 h-5" />
                </div>
              </button>

              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button onClick={() => setActiveTab('messages')} className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/[0.06] transition-all text-white/58 hover:text-white relative">
                    <Bell className="w-5 h-5 lg:w-6 h-6" />
                    {unreadMessages > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-ai-blue rounded-full border-2 border-[#05070a]"></span>}
                  </button>
                </div>
                <button onClick={() => setActiveTab('settings')} className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.06] text-white/72 transition hover:bg-white/10 hover:text-white lg:hidden">
                  <User className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          <div className="p-5 sm:p-7 lg:p-9 xl:p-10">
            {fetchError && (
              <div className="mb-10 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
                <TriangleAlert className="w-6 h-6 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-black uppercase text-red-500">Workspace Sync Error</h4>
                  <p className="text-xs text-red-400/70 font-medium">{fetchError}</p>
                </div>
                <button onClick={() => fetchData()} className="px-4 py-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-600 transition-all">Retry</button>
              </div>
            )}

            {/* TAB CONTENT */}
            {activeTab === 'business' && (
              <div className="space-y-8 animate-fade-in">
                <div className="max-w-3xl space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-ai-blue/70">Business tools</p>
                  <h1 className="text-3xl font-black tracking-tight text-white lg:text-5xl">Commerce and service operations.</h1>
                  <p className="text-sm leading-7 text-white/56">Products, orders, bookings, and add-ons stay grouped here so the sidebar stays calm.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    { title: 'Commerce', count: 'Products and orders', icon: <ShoppingBag className="w-5 h-5" />, tab: 'ecommerce' },
                    { title: 'Bookings', count: `${bookings.length} booking${bookings.length === 1 ? '' : 's'}`, icon: <Clock className="w-5 h-5" />, tab: 'booking' },
                    { title: 'Add-ons', count: 'Workspace upgrades', icon: <Plus className="w-5 h-5" />, tab: 'addons' },
                    { title: 'Billing', count: `${billing.length} billing item${billing.length === 1 ? '' : 's'}`, icon: <CreditCard className="w-5 h-5" />, tab: 'billing' },
                  ].map((item) => (
                    <button key={item.title} type="button" onClick={() => setActiveTab(item.tab)} className="group border border-white/8 bg-white/[0.025] p-6 text-left transition hover:border-white/18 hover:bg-white/[0.045]">
                      <div className="mb-10 flex items-center justify-between text-ai-blue">
                        {item.icon}
                        <ChevronRight className="w-4 h-4 text-white/22 transition group-hover:translate-x-1 group-hover:text-white" />
                      </div>
                      <h2 className="text-lg font-black tracking-tight text-white">{item.title}</h2>
                      <p className="mt-2 text-xs text-white/44">{item.count}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <div className="animate-fade-in">
                <section className="border-y border-white/10">
                  <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)] xl:grid-cols-[minmax(300px,0.72fr)_minmax(420px,1fr)_minmax(280px,0.48fr)]">
                    <div className="border-b border-white/10 lg:border-b-0 lg:border-r lg:border-white/10">
                      <button type="button" onClick={() => setActiveTab('projects')} className="group flex min-h-[160px] w-full items-end justify-between gap-6 px-5 py-6 text-left transition hover:bg-white/[0.025] sm:px-7 xl:min-h-[210px]">
                        <span className="min-w-0">
                          <span className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-ai-blue">
                            <Rocket className="h-4 w-4" />
                            Build
                          </span>
                          <span className="mt-4 block truncate text-2xl font-black tracking-tight text-white sm:text-3xl">
                            {selectedProject?.name || 'No active project'}
                          </span>
                          <span className="mt-3 block truncate text-sm font-semibold text-white/42">
                            {selectedProject?.planType?.replace(/_/g, ' ') || 'Start from a private workspace'}
                          </span>
                        </span>
                        <ChevronRight className="mb-1 h-5 w-5 shrink-0 text-white/22 transition group-hover:translate-x-1 group-hover:text-white/70" />
                      </button>

                      <div className="border-t border-white/10 px-5 py-5 sm:px-7">
                        <div className="mb-3 flex items-center justify-between text-xs font-semibold text-white/48">
                          <span>Progress</span>
                          <span>{averageProgress}%</span>
                        </div>
                        <div className="h-1 bg-white/10">
                          <div className="h-1 bg-expert-green" style={{ width: `${averageProgress}%` }} />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 border-t border-white/10 divide-x divide-white/10">
                        {[
                          { label: 'Build', icon: <Rocket className="h-5 w-5 text-ai-blue" />, tab: 'projects' },
                          { label: 'Repair', icon: <Shield className="h-5 w-5 text-expert-green" />, tab: 'audit' },
                          { label: 'Grow', icon: <ShoppingBag className="h-5 w-5 text-amber-300" />, tab: 'business' },
                        ].map((path) => (
                          <button key={path.label} type="button" onClick={() => setActiveTab(path.tab)} className="group grid min-h-24 place-items-center gap-3 py-5 text-center transition hover:bg-white/[0.025]">
                            {path.icon}
                            <span className="text-xs font-black text-white/54 group-hover:text-white">{path.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-b border-white/10 lg:border-b-0 xl:border-r xl:border-white/10">
                      <div className="grid grid-cols-[1fr_4.5rem_5.5rem_1.5rem] items-center gap-3 border-b border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-white/28 sm:grid-cols-[1fr_5rem_6.5rem_2rem] sm:px-6">
                        <span>Queue</span>
                        <span className="text-right">Count</span>
                        <span className="text-right">State</span>
                        <span></span>
                      </div>
                      {[
                        { label: 'Projects', value: projects.length, status: projects.length ? 'Active' : 'Ready', tab: 'projects', icon: <Rocket className="h-4 w-4 text-ai-blue" /> },
                        { label: 'Performance', value: stats ? 1 : 0, status: stats?.securityLevel || 'Ready', tab: 'audit', icon: <Zap className="h-4 w-4 text-expert-green" /> },
                        { label: 'Domains', value: domains.length, status: domains.length ? 'Connected' : 'Setup', tab: 'domains', icon: <Globe className="h-4 w-4 text-ai-blue" /> },
                        { label: 'Messages', value: unreadMessages, status: unreadMessages ? 'Unread' : 'Clear', tab: 'messages', icon: <MessageSquare className="h-4 w-4 text-tech-purple" /> },
                        { label: 'Tickets', value: openTickets, status: openTickets ? 'Open' : 'Clear', tab: 'tickets', icon: <LifeBuoy className="h-4 w-4 text-expert-green" /> },
                        { label: 'Billing', value: billing.length, status: billing.length ? 'Available' : 'Clear', tab: 'billing', icon: <CreditCard className="h-4 w-4 text-amber-300" /> },
                      ].map((row) => (
                        <button key={row.label} type="button" onClick={() => setActiveTab(row.tab)} className="group grid min-h-14 grid-cols-[1fr_4.5rem_5.5rem_1.5rem] items-center gap-3 border-b border-white/8 px-4 py-3 text-left transition last:border-b-0 hover:bg-white/[0.025] sm:grid-cols-[1fr_5rem_6.5rem_2rem] sm:px-6">
                          <span className="flex min-w-0 items-center gap-3">
                            {row.icon}
                            <span className="truncate text-sm font-semibold text-white/72 group-hover:text-white">{row.label}</span>
                          </span>
                          <span className="text-right text-sm font-black text-white/58">{row.value}</span>
                          <span className="truncate text-right text-xs font-semibold text-white/42">{row.status}</span>
                          <ChevronRight className="h-4 w-4 text-white/18 transition group-hover:translate-x-1 group-hover:text-white/62" />
                        </button>
                      ))}
                    </div>

                    <div className="grid lg:grid-cols-2 xl:block">
                      <div className="border-b border-white/10 lg:border-b-0 lg:border-r lg:border-white/10 xl:border-r-0 xl:border-b">
                        <div className="grid grid-cols-3 divide-x divide-white/10">
                          {[
                            { label: 'Projects', value: projects.length },
                            { label: 'Domains', value: domains.length },
                            { label: 'Tickets', value: openTickets },
                          ].map((metric) => (
                            <div key={metric.label} className="px-4 py-5">
                              <div className="text-2xl font-black tracking-tight text-white">{metric.value}</div>
                              <div className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/28">{metric.label}</div>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-3 border-t border-white/10 divide-x divide-white/10">
                          {[
                            { label: 'Edit', icon: <MousePointer2 className="h-4 w-4" />, tab: 'editor' },
                            { label: 'Store', icon: <ShoppingBag className="h-4 w-4" />, tab: 'ecommerce' },
                            { label: 'Files', icon: <BookOpen className="h-4 w-4" />, tab: 'resources' },
                          ].map((tool) => (
                            <button key={tool.label} type="button" onClick={() => setActiveTab(tool.tab)} className="group flex min-h-20 flex-col items-start justify-between px-4 py-4 text-left text-white/48 transition hover:bg-white/[0.025] hover:text-white">
                              {tool.icon}
                              <span className="text-xs font-black">{tool.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="px-5 py-5 sm:px-6">
                        <div className="mb-3 text-sm font-black text-white">Recent</div>
                        <div className="divide-y divide-white/8">
                          {activities.length > 0 ? activities.slice(0, 4).map((act, i) => (
                            <div key={`${act.title}-${i}`} className="py-3">
                              <div className="truncate text-sm font-semibold text-white/70">{act.title}</div>
                              <div className="mt-1 flex items-center justify-between gap-3 text-xs text-white/34">
                                <span className="truncate">{act.desc}</span>
                                <span className="shrink-0">{act.time}</span>
                              </div>
                            </div>
                          )) : (
                            <div className="py-3 text-sm text-white/34">No recent activity yet.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="animate-fade-in">
                {!selectedProjectId && (
                <div className="border-y border-white/10">
                  <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_24rem] lg:divide-x lg:divide-white/10">
                    <div className="px-5 py-7 sm:px-8 lg:px-10">
                      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-ai-blue/70">Build workspace</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowProjectRequestModal(true)}
                          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-3 rounded-md bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#05070a] transition hover:bg-ai-blue hover:text-white"
                        >
                          <Plus className="h-4 w-4" />
                          New build request
                        </button>
                      </div>

                      <div className="mt-7 grid gap-px bg-white/10 sm:grid-cols-3">
                        {[
                          { label: 'Records', value: projects.length, detail: `${averageProgress}% avg progress` },
                          { label: 'Active', value: projects.filter(project => ['active', 'in_development', 'staging_review'].includes(normalizeBuildStatus(project.status))).length, detail: 'In production' },
                          { label: 'Waiting', value: projects.filter(project => ['quote_ready', 'payment_agreement', 'handoff'].includes(normalizeBuildStatus(project.status))).length, detail: 'Needs action' },
                        ].map((metric) => (
                          <div key={metric.label} className="bg-[#05070a] px-4 py-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">{metric.label}</p>
                            <div className="mt-2 flex items-end justify-between gap-4">
                              <p className="text-2xl font-black tracking-tight text-white">{metric.value}</p>
                              <p className="truncate text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-white/34">{metric.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-white/10 px-5 py-6 sm:px-8 lg:border-t-0 lg:px-6">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/28">Next build</p>
                      {projects.length > 0 ? (() => {
                        const nextProject = projects.find(project => !['completed', 'launched'].includes(normalizeBuildStatus(project.status))) || projects[0];
                        const nextStatus = normalizeBuildStatus(nextProject.status);
                        const nextChapter = buildJourneyChapters.find(chapter => chapter.statuses.includes(nextStatus)) || buildJourneyChapters[0];
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProjectId(nextProject.id);
                              setActiveBuildChapter(null);
                            }}
                            className="group mt-4 w-full text-left"
                          >
                            <p className="truncate text-lg font-black tracking-tight text-white">{nextProject.name}</p>
                            <div className="mt-4 h-1.5 bg-white/10">
                              <div className="h-full bg-ai-blue" style={{ width: `${Math.round(((buildJourneyChapters.findIndex(chapter => chapter.id === nextChapter.id) + 1) / buildJourneyChapters.length) * 100)}%` }} />
                            </div>
                            <div className="mt-4 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.14em]">
                              <span className="text-ai-blue">Continue {nextChapter.label}</span>
                              <ChevronRight className="h-4 w-4 text-white/28 transition group-hover:translate-x-1 group-hover:text-white" />
                            </div>
                          </button>
                        );
                      })() : (
                        <p className="mt-4 text-sm leading-6 text-white/42">Start the first request to open a build workspace.</p>
                      )}
                    </div>
                  </div>
                </div>
                )}

                {projects.length === 0 ? (
                  <section className="mt-6 border-y border-white/10 bg-white/[0.012] px-5 py-16 sm:px-8 lg:px-10">
                    <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
                      <Terminal className="mb-6 h-12 w-12 text-ai-blue" />
                      <h3 className="text-2xl font-black tracking-tight text-white">No build project yet</h3>
                      <p className="mt-4 max-w-xl text-sm leading-7 text-white/52">
                        Projects are only for custom development work: websites, platforms, dashboards, portals, and other build requests.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowProjectRequestModal(true)}
                        className="mt-8 inline-flex min-h-11 items-center justify-center gap-3 rounded-md bg-ai-blue px-6 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-[#05070a]"
                      >
                        <Zap className="h-4 w-4" />
                        Start build request
                      </button>
                    </div>
                  </section>
                ) : !selectedProjectId ? (
                  <section className="mt-6 border-y border-white/10">
                    <div className="grid grid-cols-[1fr_6rem_2rem] gap-3 border-b border-white/10 px-4 py-4 text-[9px] font-black uppercase tracking-[0.18em] text-white/28 sm:grid-cols-[1fr_8rem_7rem_2rem] sm:px-6">
                      <span>Project</span>
                      <span className="hidden text-right sm:block">Progress</span>
                      <span className="text-right">Resume</span>
                      <span></span>
                    </div>
                    <div className="divide-y divide-white/10">
                      {projects.map((project) => {
                        const rowStatus = normalizeBuildStatus(project.status);
                        const rowChapter = buildJourneyChapters.find(chapter => chapter.statuses.includes(rowStatus)) || buildJourneyChapters[0];
                        const rowChapterIndex = Math.max(0, buildJourneyChapters.findIndex(chapter => chapter.id === rowChapter.id));
                        const rowProgress = Math.round(((rowChapterIndex + 1) / buildJourneyChapters.length) * 100);

                        return (
                          <button
                            key={project.id}
                            type="button"
                            onClick={() => {
                              setSelectedProjectId(project.id);
                              setActiveBuildChapter(null);
                            }}
                            className="grid min-h-24 w-full grid-cols-[1fr_6rem_2rem] items-center gap-3 px-4 py-4 text-left transition hover:bg-white/[0.025] sm:grid-cols-[1fr_8rem_7rem_2rem] sm:px-6"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-black text-white">{project.name}</span>
                              <span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/34">
                                {project.businessName || project.planType?.replace(/_/g, ' ') || 'Custom build'}
                              </span>
                              <span className="mt-3 block h-1 bg-white/10 sm:hidden">
                                <span className="block h-full bg-ai-blue" style={{ width: `${rowProgress}%` }} />
                              </span>
                            </span>
                            <span className="hidden sm:block">
                              <span className="block h-1 bg-white/10">
                                <span className="block h-full bg-ai-blue" style={{ width: `${rowProgress}%` }} />
                              </span>
                              <span className="mt-2 block text-right text-[10px] font-black uppercase tracking-[0.12em] text-white/34">{rowProgress}%</span>
                            </span>
                            <span className="text-right text-[10px] font-black uppercase tracking-[0.12em] text-ai-blue">
                              {rowChapter.label}
                            </span>
                            <ChevronRight className="h-4 w-4 justify-self-end text-white/24" />
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ) : (
                  <section className="mt-2">
                    <div className="min-h-[620px]">
                      <aside className="hidden">
                        <div className="grid grid-cols-[1fr_5.5rem_2rem] gap-3 border-b border-white/10 px-4 py-4 text-[9px] font-black uppercase tracking-[0.18em] text-white/28 sm:px-6">
                          <span>Build queue</span>
                          <span className="text-right">Page</span>
                          <span></span>
                        </div>
                        <div className="divide-y divide-white/10">
                          {projects.map((project) => {
                            const rowIndex = getLifecycleIndex(project);
                            const rowStage = buildLifecycle[rowIndex] || buildLifecycle[0];
                            const rowStatus = normalizeBuildStatus(project.status);
                            const rowChapter = buildJourneyChapters.find(chapter => chapter.statuses.includes(rowStatus)) || buildJourneyChapters[0];
                            const rowChapterIndex = Math.max(0, buildJourneyChapters.findIndex(chapter => chapter.id === rowChapter.id));
                            const rowProgress = Math.round(((rowChapterIndex + 1) / buildJourneyChapters.length) * 100);
                            const isSelected = currentBuildRecord?.id === project.id;

                            return (
                              <button
                                key={project.id}
                                type="button"
                                onClick={() => {
                                  setSelectedProjectId(project.id);
                                  setActiveBuildChapter(null);
                                }}
                                className={`grid min-h-24 w-full grid-cols-[1fr_5.5rem_2rem] items-center gap-3 px-4 py-4 text-left transition sm:px-6 ${
                                  isSelected ? 'bg-ai-blue/[0.07]' : 'hover:bg-white/[0.025]'
                                }`}
                              >
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-black text-white">{project.name}</span>
                                  <span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/34">
                                    {project.planType?.replace(/_/g, ' ') || 'Custom build'}
                                  </span>
                                  <span className="mt-3 block h-1 bg-white/10">
                                    <span className="block h-full bg-ai-blue" style={{ width: `${rowProgress}%` }} />
                                  </span>
                                  <span className="mt-2 block truncate text-[10px] font-semibold text-white/34">
                                    Continue: {rowChapter.label}
                                  </span>
                                </span>
                                <span className={`text-right text-[10px] font-black uppercase tracking-[0.12em] ${isSelected ? 'text-ai-blue' : 'text-white/42'}`}>
                                  {rowStage.label}
                                </span>
                                <ChevronRight className={`h-4 w-4 justify-self-end transition ${isSelected ? 'text-ai-blue' : 'text-white/18'}`} />
                              </button>
                            );
                          })}
                        </div>
                      </aside>

                      <main className="min-w-0">
                        {currentBuildRecord && (
                          <div className="flex h-full flex-col">
                            <div className="px-5 pb-3 pt-1 sm:px-8 lg:px-10">
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex min-w-0 items-center gap-4">
                                  <div className="grid h-12 w-12 shrink-0 place-items-center text-ai-blue">
                                    <Sparkles className="h-6 w-6" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">Plan / Package</p>
                                    <p className="mt-1 truncate text-sm font-black capitalize tracking-tight text-white">
                                      {currentBuildPlanLabel}
                                    </p>
                                  </div>
                                </div>
                                {selectedBuildChapter.id === 'brief' ? (
                                  <div className="flex min-w-0 items-center gap-4 pt-1 lg:min-w-72 lg:justify-end lg:pl-5">
                                    <div className="grid h-11 w-11 shrink-0 place-items-center text-yellow-300">
                                      {hasBriefClarification ? <TriangleAlert className="h-6 w-6" /> : isBriefApprovedForScope ? <Check className="h-6 w-6 text-expert-green" /> : <Clock className="h-6 w-6 text-ai-blue" />}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">Current</p>
                                      <p className="mt-1 truncate text-sm font-black tracking-tight text-white">
                                        {hasSentBriefClarification ? 'Brief submitted' : hasBriefClarification ? 'Brief update' : isBriefApprovedForScope ? 'Brief approved' : 'Brief review'}
                                      </p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-white/24" />
                                    <div className="min-w-0">
                                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">Next</p>
                                      <p className="mt-1 truncate text-sm font-black tracking-tight text-white/68">
                                        {nextBuildChapter?.label || 'Scope'}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="min-w-40 border-l border-white/10 pl-5">
                                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Progress</p>
                                    <p className="mt-1 text-2xl font-black text-white">{buildMilestoneProgress}%</p>
                                    <div className="mt-3 h-1.5 w-full bg-white/10">
                                      <div className="h-full bg-ai-blue transition-all" style={{ width: `${buildMilestoneProgress}%` }} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {selectedBuildChapter.id !== 'brief' && (
                            <div className="border-b border-white/10 px-5 py-5 sm:px-8 lg:px-10">
                              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                                <div className="min-w-0">
                                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-ai-blue/70">
                                    Step {selectedBuildChapterIndex + 1} of {buildJourneyChapters.length}
                                  </p>
                                  <h4 className="mt-2 text-3xl font-black tracking-tight text-white">{selectedBuildChapter.label}</h4>
                                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">{selectedBuildChapterDetail}</p>
                                </div>
                                <div className="w-full md:max-w-sm">
                                  <div className="flex items-center justify-between gap-4 text-[10px] font-black uppercase tracking-[0.14em] text-white/34">
                                    <span>{activeBuildLifecycleLabel}</span>
                                    <span>{buildPageProgress}%</span>
                                  </div>
                                  <div className="mt-2 h-1.5 bg-white/10">
                                    <div className="h-full bg-ai-blue" style={{ width: `${buildPageProgress}%` }} />
                                  </div>
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    {selectedBuildChapterIndex > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setActiveBuildChapter(buildJourneyChapters[selectedBuildChapterIndex - 1].id)}
                                        className="inline-flex min-h-10 items-center justify-center gap-2 border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/50 transition hover:bg-white/[0.04] hover:text-white"
                                      >
                                        <ArrowLeft className="h-3.5 w-3.5" />
                                        Previous
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setActiveBuildChapter(buildJourneyChapters[selectedBuildChapterIndex + 1].id)}
                                      disabled={
                                        selectedBuildChapterIndex >= buildJourneyChapters.length - 1
                                        || (currentBuildStatus !== 'completed' && selectedBuildChapterIndex >= defaultBuildChapterIndex)
                                      }
                                      className="inline-flex min-h-10 items-center justify-center gap-2 border border-ai-blue/25 bg-ai-blue/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:bg-ai-blue/10 hover:text-white disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-white/24"
                                    >
                                      Next
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            )}

                            <div className={`grid flex-1 ${
                              selectedBuildChapter.id === 'brief' ? '' : 'xl:grid-cols-[minmax(0,1fr)_20rem] xl:divide-x xl:divide-white/10'
                            }`}>
                              <section className="px-5 py-6 sm:px-8 lg:px-10">
                                {selectedBuildChapter.id === 'brief' && (
                                  <>
                                  <div className="space-y-6">
                                    <div className="border-y border-white/10 py-6">
                                      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                        <div className="min-w-0">
                                          <p className={`text-[9px] font-black uppercase tracking-[0.18em] ${
                                            clientBriefState.tone === 'open' ? 'text-expert-green' : clientBriefState.tone === 'action' ? 'text-yellow-300' : 'text-ai-blue'
                                          }`}>
                                            {clientBriefState.label}
                                          </p>
                                          {!hasBriefClarification && (
                                            <h5 className="mt-2 max-w-3xl text-2xl font-black tracking-tight text-white">
                                              {clientBriefState.detail}
                                            </h5>
                                          )}
                                          {hasBriefClarification && clientBriefTeamMessages.length > 0 && (
                                            <div className="mt-3 max-w-3xl divide-y divide-white/10 border-y border-white/10">
                                              {clientBriefTeamMessages.map((message, index) => (
                                                <div key={`${message}-${index}`} className="py-3">
                                                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-yellow-300">
                                                    Client note {clientBriefTeamMessages.length > 1 ? index + 1 : ''}
                                                  </p>
                                                  <p className="mt-1 text-sm font-semibold leading-6 text-white/66">
                                                    {message}
                                                  </p>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        {(hasBriefClarification || hasSentBriefClarification) && (
                                          <div className="shrink-0 text-left lg:text-right">
                                            {hasSentBriefClarification ? (
                                              <>
                                                <p className="text-sm font-black tracking-tight text-white">Waiting for review</p>
                                                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/36">
                                                  Team review
                                                </p>
                                              </>
                                            ) : (
                                              <>
                                                <p className="text-2xl font-black tracking-tight text-white">
                                                  {answeredBriefResponseCount}/{briefResponseFields.length}
                                                </p>
                                                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/36">
                                                  Questions answered
                                                </p>
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {hasSentBriefClarification ? (
                                        <div className="mt-6 border-y border-white/10 py-5">
                                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-expert-green">Your response</p>
                                          <p className="mt-2 text-sm font-semibold leading-7 text-white/62">
                                            Your update has been sent. The team will review it and open Scope if everything is clear.
                                          </p>
                                          {clientBriefSubmittedResponse && (
                                            <div className="mt-4 border-t border-white/10 pt-4">
                                              <p className="whitespace-pre-line text-sm leading-7 text-white/72">{clientBriefSubmittedResponse}</p>
                                            </div>
                                          )}
                                        </div>
                                      ) : hasBriefClarification ? (
                                        <>
                                          <div className="mt-6 space-y-6 border-t border-white/10 pt-6">
                                            {briefResponseGroups.map((group) => (
                                              <div key={group.group} className="border-y border-white/10">
                                                <div className="border-b border-white/10 py-3">
                                                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/32">{group.group}</p>
                                                </div>
                                                <div className="grid gap-x-8 xl:grid-cols-2">
                                                  {group.fields.map((field, fieldIndex) => {
                                                    const questionNumber = briefResponseFields.findIndex(item => item.label === field.label) + 1;
                                                    const isAnswered = Boolean((briefResponseAnswers[field.label] || '').trim());

                                                    return (
                                                    <div
                                                      key={field.label}
                                                      className={`border-b py-5 transition-colors xl:[&:nth-last-child(-n+2)]:border-b-0 ${
                                                        isAnswered
                                                          ? 'border-expert-green/35'
                                                          : 'border-white/10'
                                                      }`}
                                                    >
                                                      <div className="flex items-start gap-3">
                                                        <span className={`mt-0.5 w-6 shrink-0 text-[10px] font-black tabular-nums ${
                                                          isAnswered ? 'text-expert-green' : 'text-white/30'
                                                        }`}>
                                                          {String(questionNumber || fieldIndex + 1).padStart(2, '0')}
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                          <div className="flex items-center justify-between gap-4">
                                                            <label className={`block min-w-0 truncate text-[10px] font-black uppercase tracking-[0.14em] transition-colors ${
                                                              isAnswered ? 'text-expert-green' : 'text-white/74'
                                                            }`}>
                                                              {field.label}
                                                            </label>
                                                            {isAnswered && (
                                                              <Check className="h-3.5 w-3.5 shrink-0 text-expert-green" />
                                                            )}
                                                          </div>
                                                          <p className="mt-1 min-h-5 text-xs leading-5 text-white/36">{field.prompt}</p>
                                                          {field.type === 'select' ? (
                                                            <select
                                                              value={briefResponseAnswers[field.label] || ''}
                                                              onChange={(event) => setBriefResponseAnswers(prev => ({ ...prev, [field.label]: event.target.value }))}
                                                              className={`mt-3 w-full border-0 border-b bg-[#05070a] px-0 py-3 text-sm font-semibold text-white outline-none transition ${
                                                                isAnswered
                                                                  ? 'border-expert-green/50 focus:border-expert-green'
                                                                  : 'border-white/16 focus:border-yellow-300/60'
                                                              }`}
                                                            >
                                                              <option className="bg-[#05070a] text-white" value="">Choose an answer</option>
                                                              {field.options?.map((option) => (
                                                                <option className="bg-[#05070a] text-white" key={option} value={option}>{option}</option>
                                                              ))}
                                                            </select>
                                                          ) : (
                                                            <textarea
                                                              value={briefResponseAnswers[field.label] || ''}
                                                              onChange={(event) => setBriefResponseAnswers(prev => ({ ...prev, [field.label]: event.target.value }))}
                                                              rows={3}
                                                              className={`mt-3 w-full resize-none border-0 border-b bg-transparent px-0 py-2 text-sm leading-6 text-white outline-none transition placeholder:text-white/22 ${
                                                                isAnswered
                                                                  ? 'border-expert-green/50 focus:border-expert-green'
                                                                  : 'border-white/16 focus:border-yellow-300/60'
                                                              }`}
                                                              placeholder="Write your answer here..."
                                                            />
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                          <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                            <button
                                              type="button"
                                              onClick={() => handleBriefClarificationResponse(currentBuildRecord)}
                                              disabled={briefResponseSubmitting || !briefResponseFields.some(field => (briefResponseAnswers[field.label] || '').trim())}
                                              className="inline-flex min-h-11 items-center justify-center gap-3 border border-yellow-300/25 px-5 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-yellow-300 transition hover:bg-yellow-300/10 hover:text-white disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/24"
                                            >
                                              Send brief details
                                              {briefResponseSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                                            </button>
                                            {briefResponseFeedback && (
                                              <p className="text-xs font-semibold leading-5 text-white/54">
                                                {briefResponseFeedback}
                                              </p>
                                            )}
                                          </div>
                                        </>
                                      ) : (
                                        <div className="mt-6 border-t border-white/10 pt-5">
                                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">Current state</p>
                                          <p className="mt-2 text-sm font-semibold leading-6 text-white/54">
                                            The team will ask for specific details here if anything is missing.
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    {!hasBriefClarification && (
                                    <div className="border-y border-white/10">
                                      <div className="border-b border-white/10 py-3">
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Current brief</p>
                                      </div>
                                      <div className="grid grid-cols-2 border-b border-white/10 md:grid-cols-3 xl:grid-cols-4">
                                        {clientBriefRows.map((item) => (
                                          <div key={item.label} className="min-w-0 border-b border-r border-white/10 px-4 py-4 last:border-r-0 md:[&:nth-child(3n)]:border-r-0 xl:[&:nth-child(3n)]:border-r xl:[&:nth-child(4n)]:border-r-0">
                                            <p className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-white/28" title={item.label}>
                                              {item.label}
                                            </p>
                                            <p className={`mt-2 truncate text-sm font-semibold ${
                                              ['Not answered', 'Not specified'].includes(item.value) ? 'text-white/30' : 'text-white/68'
                                            }`} title={item.value}>
                                              {item.value}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    )}
                                  </div>
                                  <div className="hidden">
                                    <div className="grid gap-5 py-6 md:grid-cols-[minmax(0,1fr)_18rem] md:items-stretch">
                                      <div className="min-w-0">
                                        <p className={`text-[9px] font-black uppercase tracking-[0.18em] ${
                                          clientBriefState.tone === 'open' ? 'text-expert-green' : clientBriefState.tone === 'action' ? 'text-yellow-300' : 'text-ai-blue'
                                        }`}>
                                          {clientBriefState.label}
                                        </p>
                                        <h5 className="mt-2 max-w-3xl text-2xl font-black tracking-tight text-white">
                                          {clientBriefState.detail}
                                        </h5>
                                        {hasBriefClarification && (
                                          <div className="mt-5 border-y border-yellow-300/20 py-4">
                                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                              <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-yellow-300">Requested details</p>
                                                {clientBriefTeamMessage && (
                                                  <p className="mt-2 max-w-2xl whitespace-pre-line text-sm font-semibold leading-7 text-white/68">
                                                    {clientBriefTeamMessage}
                                                  </p>
                                                )}
                                              </div>
                                              {clientBriefClarificationItems.length > 0 && (
                                                <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.14em] text-white/36">
                                                  {clientBriefClarificationItems.length} items
                                                </span>
                                              )}
                                            </div>
                                            {clientBriefClarificationItems.length > 0 && (
                                              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                                {clientBriefClarificationItems.map((item) => (
                                                  <div key={item} className="min-w-0 border border-white/10 px-3 py-2">
                                                    <p className="truncate text-[10px] font-black uppercase tracking-[0.12em] text-white/70" title={item}>
                                                      {item}
                                                    </p>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!hasBriefClarification) handleViewAssessment(currentBuildRecord);
                                        }}
                                        className={`group flex min-h-full w-full items-center justify-between gap-4 border-y px-0 py-4 text-left transition md:border-y-0 md:border-l md:pl-5 ${
                                          hasBriefClarification
                                            ? 'cursor-default border-yellow-300/20'
                                            : 'border-white/10 hover:border-white/20'
                                        }`}
                                      >
                                        <span className="flex min-w-0 items-center gap-3">
                                          <Sparkles className={`h-4 w-4 shrink-0 ${hasBriefClarification ? 'text-yellow-300' : 'text-white/42'}`} />
                                          <span className="min-w-0">
                                            <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-white/72 group-hover:text-white">
                                              {hasBriefClarification ? 'Answer request' : 'Intake answers'}
                                            </span>
                                            <span className="mt-1 block truncate text-xs text-white/34">
                                              {hasBriefClarification ? 'Use the response panel on this page' : 'Open original questionnaire'}
                                            </span>
                                          </span>
                                        </span>
                                        {!hasBriefClarification && (
                                          <ChevronRight className="h-4 w-4 shrink-0 text-white/24 transition group-hover:translate-x-1 group-hover:text-white" />
                                        )}
                                      </button>
                                    </div>

                                    <div className="hidden grid-cols-3 border-t border-white/10 xl:grid">
                                      {clientBriefRows.map((item) => (
                                        <div key={item.label} className="min-w-0 border-b border-r border-white/10 px-4 py-4 [&:nth-child(3n)]:border-r-0 [&:nth-last-child(-n+3)]:border-b-0">
                                          <p className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-white/30" title={item.label}>
                                            {item.label}
                                          </p>
                                          <p className={`mt-2 truncate text-sm font-semibold ${
                                            ['Not answered', 'Not specified'].includes(item.value) ? 'text-white/30' : 'text-white/72'
                                          }`} title={item.value}>
                                            {item.value}
                                          </p>
                                        </div>
                                      ))}
                                    </div>

                                    <div className="divide-y divide-white/10 border-t border-white/10 xl:hidden">
                                      {clientBriefRows.map((item) => (
                                        <div key={item.label} className="grid gap-2 py-4 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-5">
                                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/34 md:truncate" title={item.label}>
                                            {item.label}
                                          </p>
                                          <p className={`min-w-0 text-sm font-semibold leading-6 ${
                                            ['Not answered', 'Not specified'].includes(item.value) ? 'text-white/30' : 'text-white/72'
                                          } md:truncate`} title={item.value}>
                                            {item.value}
                                          </p>
                                        </div>
                                      ))}
                                    </div>

                                    <div className="hidden">
                                      <div className="py-6 lg:pr-8">
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-ai-blue">Client brief</p>
                                        <h5 className="mt-2 text-2xl font-black tracking-tight text-white">{briefType}</h5>
                                        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
                                          {briefInsight || 'The team is reviewing the request details before preparing the scope.'}
                                        </p>
                                      </div>
                                      <div className="grid grid-cols-3 border-t border-white/10 lg:block lg:border-t-0">
                                        {[
                                          { label: 'Budget', value: currentBuildRecord.budget || 'Not specified' },
                                          { label: 'Timeline', value: currentBuildRecord.timeline || 'Flexible' },
                                          { label: 'Priority', value: currentBuildRecord.priority || 'Normal' },
                                        ].map((item) => (
                                          <div key={item.label} className="border-r border-white/10 px-4 py-4 last:border-r-0 lg:border-r-0 lg:border-b lg:last:border-b-0">
                                            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">{item.label}</p>
                                            <p className="mt-2 truncate text-sm font-semibold text-white/72">{item.value}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="hidden border-t border-white/10 lg:grid-cols-2 lg:divide-x lg:divide-white/10">
                                      {[
                                        { label: 'Goal', value: briefGoals || 'No goals recorded yet.' },
                                        { label: 'Required features', value: briefFeatures || 'No feature list recorded yet.' },
                                        { label: 'Audience', value: briefAudience || 'Not specified' },
                                        { label: 'Material and style', value: `${briefMaterial || 'Not specified'} · ${briefStyle || 'Not specified'}` },
                                      ].map((item) => (
                                        <div key={item.label} className="border-b border-white/10 px-0 py-5 lg:px-5 lg:[&:nth-last-child(-n+2)]:border-b-0">
                                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/28">{item.label}</p>
                                          <p className="mt-2 text-sm leading-7 text-white/64">{item.value}</p>
                                        </div>
                                      ))}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleViewAssessment(currentBuildRecord)}
                                      className="group hidden min-h-14 w-full items-center justify-between gap-4 border-t border-white/10 px-0 py-4 text-left transition hover:bg-white/[0.018] lg:px-5"
                                    >
                                      <span className="flex min-w-0 items-center gap-3">
                                        <Sparkles className="h-4 w-4 shrink-0 text-white/42" />
                                        <span className="min-w-0">
                                          <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-white/62 group-hover:text-white">Review intake answers</span>
                                          <span className="mt-1 block truncate text-xs text-white/34">Original questionnaire details</span>
                                        </span>
                                      </span>
                                      <ChevronRight className="h-4 w-4 shrink-0 text-white/24 transition group-hover:translate-x-1 group-hover:text-white" />
                                    </button>
                                  </div>
                                  </>
                                )}

                                {selectedBuildChapter.id === 'scope' && (
                                  <div className="space-y-6">
                                    {isProjectRequest(currentBuildRecord) && hasScopeProposal ? (
                                      <div className="border-y border-white/10">
                                        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_17rem] xl:divide-x xl:divide-white/10">
                                          <div className="py-6 xl:pr-8">
                                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/34">Scope review</p>
                                            <h5 className="mt-2 text-2xl font-black tracking-tight text-white">{briefType}</h5>
                                            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/62">
                                              Review the offer, price, and delivery boundaries before Agreement opens.
                                            </p>
                                            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-white/54">
                                              <span>{briefGoals || 'Approved project goal'}</span>
                                              <span>{briefStyle || 'Approved visual direction'}</span>
                                            </div>
                                          </div>
                                          <div className="border-t border-white/10 py-5 xl:border-t-0 xl:pl-6">
                                            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">Price</p>
                                            <p className="mt-2 text-3xl font-black tracking-tight text-white">
                                              {currentBuildRecord.quotedAmount ? `${currentBuildRecord.quoteCurrency || 'USD'} ${currentBuildRecord.quotedAmount}` : 'Pending'}
                                            </p>
                                            <div className="mt-5 flex items-center gap-3">
                                              <span className={`h-2.5 w-2.5 rounded-full ${scopeDecisionLabel === 'Scope approved' ? 'bg-expert-green' : 'bg-amber-300'}`} />
                                              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/54">{scopeDecisionLabel}</p>
                                            </div>
                                            {hasScopeDiscussion && (
                                              <p className="mt-4 text-xs leading-6 text-amber-100/72">
                                                Your change request is with the team. You can update the note if anything else needs to be added.
                                              </p>
                                            )}
                                          </div>
                                        </div>

                                        <div className="grid border-t border-white/10 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:divide-x xl:divide-white/10">
                                          <div className="grid grid-cols-2 border-b border-white/10 md:grid-cols-4 xl:block xl:border-b-0">
                                            {[
                                              { label: 'Budget', value: currentBuildRecord.budget || 'Not specified' },
                                              { label: 'Timeline', value: currentBuildRecord.timeline || 'After agreement' },
                                              { label: 'Revisions', value: '2 rounds' },
                                              { label: 'Next', value: 'Agreement' },
                                            ].map((item) => (
                                              <div key={item.label} className="border-b border-white/10 px-0 py-4 pr-4 md:border-b-0 xl:border-b xl:last:border-b-0">
                                                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">{item.label}</p>
                                                <p className="mt-2 text-sm font-semibold text-white/72">{item.value}</p>
                                              </div>
                                            ))}
                                          </div>

                                          <div className="divide-y divide-white/10 xl:pl-6">
                                            {[
                                              { label: 'Deliverable', value: `${briefType} prepared for enquiries, responsive use, and launch handoff.` },
                                              { label: 'Included', value: `${briefFeatures || 'Core requested features'}, responsive layout, contact capture, basic SEO setup, launch preparation, and handoff support.` },
                                              { label: 'Boundaries', value: 'Advanced automation, custom CRM integrations, ongoing maintenance, copywriting, or extra revision rounds are handled as add-ons.' },
                                            ].map((item) => (
                                              <div key={item.label} className="py-4">
                                                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">{item.label}</p>
                                                <p className="mt-2 text-sm leading-6 text-white/64">{item.value}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        {isScopeApproved ? (
                                          <div className="border-t border-expert-green/25 py-5">
                                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-expert-green">Accepted</p>
                                            <p className="mt-2 max-w-2xl text-sm font-semibold leading-7 text-white/68">
                                              Scope is approved. The team will prepare Agreement, payment terms, and the production start details next.
                                            </p>
                                          </div>
                                        ) : (
                                          <>
                                            <div className="border-t border-white/10 py-4">
                                              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">
                                                {hasScopeDiscussion ? 'Update message' : 'Message to team'}
                                              </p>
                                              <textarea
                                                value={quoteMessage}
                                                onChange={(event) => setQuoteMessage(event.target.value)}
                                                rows={3}
                                                className="mt-3 w-full resize-none border-0 bg-transparent text-sm leading-6 text-white outline-none transition placeholder:text-white/24"
                                                placeholder={hasScopeDiscussion ? 'Add what should change or what the team should explain...' : 'Tell the team what you want adjusted or clarified...'}
                                              />
                                            </div>

                                            <div className="grid border-t border-white/10 sm:grid-cols-2 sm:divide-x sm:divide-white/10">
                                              <button
                                                type="button"
                                                onClick={() => handleQuoteResponse(currentBuildRecord, 'accept')}
                                                disabled={quoteSubmitting}
                                                className="flex min-h-14 items-center justify-between gap-3 px-0 py-4 pr-4 text-left text-[10px] font-black uppercase tracking-[0.16em] text-expert-green transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
                                              >
                                                <span className="flex items-center gap-3"><Check className="h-4 w-4" /> Approve scope</span>
                                                {quoteSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleQuoteResponse(currentBuildRecord, 'discuss')}
                                                disabled={quoteSubmitting}
                                                className="flex min-h-14 items-center justify-between gap-3 border-t border-white/10 px-0 py-4 pr-4 text-left text-[10px] font-black uppercase tracking-[0.16em] text-amber-200 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:border-t-0 sm:px-4"
                                              >
                                                <span className="flex items-center gap-3"><MessageSquare className="h-4 w-4" /> {hasScopeDiscussion ? 'Update discussion' : 'Discuss changes'}</span>
                                                <ChevronRight className="h-4 w-4" />
                                              </button>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="border-y border-white/10 py-6">
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Scope in preparation</p>
                                        <h5 className="mt-2 text-xl font-black tracking-tight text-white">Quote not ready yet</h5>
                                        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/54">
                                          The team is using the brief to prepare the scope, timeline, and final quote.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {selectedBuildChapter.id === 'agreement' && (
                                  <div className="space-y-6">
                                    {isProjectRequest(currentBuildRecord) && ['approved', 'payment_agreement'].includes(currentBuildStatus) ? (
                                  <div className="border-y border-white/10">
                                    <div className="py-6">
                                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0">
                                          <div className="flex flex-wrap items-center gap-3">
                                            <span className={`h-2.5 w-2.5 rounded-full ${
                                              currentBuildRecord.paymentAgreementStatus === 'confirmed' ? 'bg-expert-green' : 'bg-amber-300'
                                            }`} />
                                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-expert-green">
                                              {paymentAgreementStatusLabel}
                                            </p>
                                          </div>
                                          <h5 className="mt-3 text-2xl font-black tracking-tight text-white">
                                            {currentBuildRecord.paymentAgreementStatus === 'confirmed'
                                              ? 'Production is ready to begin.'
                                              : 'Complete the deposit step.'}
                                          </h5>
                                          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/58">
                                            {currentBuildStatus === 'approved'
                                              ? 'The team is preparing the payment terms after scope approval.'
                                              : currentBuildRecord.paymentAgreementStatus === 'confirmed'
                                                ? 'The payment gate is cleared. The team can move this build into Development.'
                                                : 'Pay the required amount through the secure checkout so Development can begin.'}
                                          </p>
                                        </div>
                                        <div className="min-w-0 lg:min-w-56 lg:text-right">
                                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">Agreement total</p>
                                          <p className="mt-2 text-3xl font-black tracking-tight text-white">{agreementTotalLabel}</p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid border-t border-white/10 md:grid-cols-3 md:divide-x md:divide-white/10">
                                      {[
                                        { label: 'Payment terms', value: paymentAgreementTypeLabel },
                                        { label: 'Deposit due', value: agreementDepositLabel },
                                        { label: 'Due date', value: paymentDueDateLabel },
                                      ].map((item) => (
                                        <div key={item.label} className="border-b border-white/10 py-4 pr-4 md:border-b-0 md:px-4 first:md:pl-0 last:md:pr-0">
                                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">{item.label}</p>
                                          <p className="mt-2 text-sm font-semibold text-white/72">{item.value}</p>
                                        </div>
                                      ))}
                                    </div>

                                    {currentBuildRecord.paymentInstructions && (
                                      <div className="border-t border-white/10 py-5">
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/28">How to pay</p>
                                        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-white/64">{currentBuildRecord.paymentInstructions}</p>
                                      </div>
                                    )}
                                    {canPayAgreement && (
                                      <div className="border-t border-white/10 py-5">
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-300">Secure checkout</p>
                                        <p className="mt-2 max-w-2xl text-sm leading-7 text-white/54">
                                          Pay {currentBuildRecord.depositAmount ? 'the deposit' : 'the agreement amount'} securely. Payment confirmation returns to this workspace.
                                        </p>
                                        <button
                                          type="button"
                                          onClick={() => handleAgreementPayment(currentBuildRecord)}
                                          disabled={paymentSubmitting}
                                          className="mt-4 flex min-h-11 w-full items-center justify-between gap-3 border border-amber-300/25 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-amber-300 transition hover:bg-amber-300/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-xs"
                                        >
                                          <span>{currentBuildRecord.depositAmount ? `Pay deposit (${agreementDepositLabel})` : `Pay now (${agreementTotalLabel})`}</span>
                                          {paymentSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                    ) : (
                                      <div className="border-y border-white/10 py-5">
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Agreement status</p>
                                        <p className="mt-2 text-sm leading-7 text-white/54">Payment terms will appear here after the quote is approved.</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {selectedBuildChapter.id === 'build' && (
                                  <div className="border-y border-white/10 py-5">
                                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                      <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-ai-blue">Build execution</p>
                                        <h4 className="mt-2 text-lg font-black tracking-tight text-white">
                                          {activeBuildMilestone?.title || 'Milestones ready'}
                                        </h4>
                                      </div>
                                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/42">
                                        {buildMilestoneProgress}% overall
                                      </span>
                                    </div>
                                    {isProjectRequest(currentBuildRecord) && currentBuildMilestones.length > 0 ? (
                                      <div className="divide-y divide-white/10 border-y border-white/10">
                                      {currentBuildMilestones.map((milestone) => (
                                        <div key={milestone.id} className="grid gap-4 px-1 py-4 sm:grid-cols-[1fr_7rem] sm:items-center">
                                          <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-3">
                                              <span className={`h-2.5 w-2.5 ${
                                                milestone.status === 'completed' ? 'bg-expert-green' : milestone.status === 'in_progress' ? 'bg-ai-blue' : milestone.status === 'blocked' ? 'bg-red-400' : 'bg-white/18'
                                              }`} />
                                              <p className="text-sm font-black text-white">{milestone.title}</p>
                                              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/30">{milestone.status.replace(/_/g, ' ')}</span>
                                            </div>
                                            {milestone.clientNote ? (
                                              <p className="mt-2 text-xs leading-6 text-white/52">{milestone.clientNote}</p>
                                            ) : (
                                              <p className="mt-2 text-xs leading-6 text-white/34">{milestone.description || 'The team will update this milestone as work progresses.'}</p>
                                            )}
                                          </div>
                                          <div>
                                            <p className="text-right text-[10px] font-black uppercase tracking-[0.14em] text-white/48">{milestone.progress || 0}%</p>
                                            <div className="mt-2 h-1.5 bg-white/10">
                                              <div className="h-full bg-ai-blue" style={{ width: `${milestone.progress || 0}%` }} />
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                      </div>
                                    ) : (
                                      <p className="border-y border-white/10 py-5 text-sm leading-7 text-white/54">Milestones will appear here when development starts.</p>
                                    )}
                                  </div>
                                )}

                                {selectedBuildChapter.id === 'review' && (
                                  <div className="border-y border-ai-blue/35 bg-ai-blue/[0.04] py-5">
                                    {isProjectRequest(currentBuildRecord) && currentBuildStatus === 'staging_review' ? (
                                      <>
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                      <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-ai-blue">Staging review</p>
                                        <p className="mt-2 text-sm leading-7 text-white/68">
                                          Review the staging build and tell the team whether it is ready for launch or needs changes.
                                        </p>
                                      </div>
                                      <div className="border-t border-white/10 pt-4 sm:min-w-40 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Status</p>
                                        <p className="mt-2 text-lg font-black capitalize text-white">
                                          {(currentBuildRecord.stagingReviewStatus || 'sent').replace(/_/g, ' ')}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="mt-5 grid border-y border-white/10 sm:grid-cols-2 sm:divide-x sm:divide-white/10">
                                      <div className="border-b border-white/10 p-4 sm:border-b-0">
                                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">Preview</p>
                                        {currentBuildRecord.stagingUrl ? (
                                          <a
                                            href={currentBuildRecord.stagingUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-2 inline-flex items-center gap-2 break-all text-sm font-black text-ai-blue transition hover:text-white"
                                          >
                                            Open staging <ExternalLink className="h-3.5 w-3.5" />
                                          </a>
                                        ) : (
                                          <p className="mt-2 text-sm font-semibold text-white/52">Preview link pending</p>
                                        )}
                                      </div>
                                      <div className="p-4">
                                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">Team note</p>
                                        <p className="mt-2 text-sm leading-6 text-white/64">
                                          {currentBuildRecord.stagingNotes || 'The team will add review notes before launch approval.'}
                                        </p>
                                      </div>
                                    </div>
                                    <textarea
                                      value={stagingReviewMessage}
                                      onChange={(event) => setStagingReviewMessage(event.target.value)}
                                      rows={3}
                                      className="mt-5 w-full resize-none border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60"
                                      placeholder="Add review notes for the team"
                                    />
                                    <div className="mt-4 grid border-y border-white/10 sm:grid-cols-2 sm:divide-x sm:divide-white/10">
                                      <button
                                        type="button"
                                        onClick={() => handleStagingReviewResponse(currentBuildRecord, 'approve')}
                                        disabled={stagingReviewSubmitting}
                                        className="flex items-center justify-between gap-3 px-4 py-4 text-left text-[10px] font-black uppercase tracking-[0.16em] text-expert-green transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        <span className="flex items-center gap-3"><Check className="h-4 w-4" /> Approve launch</span>
                                        {stagingReviewSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleStagingReviewResponse(currentBuildRecord, 'changes')}
                                        disabled={stagingReviewSubmitting}
                                        className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-4 text-left text-[10px] font-black uppercase tracking-[0.16em] text-ai-blue transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:border-t-0"
                                      >
                                        <span className="flex items-center gap-3"><MessageSquare className="h-4 w-4" /> Request changes</span>
                                        <ChevronRight className="h-4 w-4" />
                                      </button>
                                    </div>
                                      </>
                                    ) : (
                                      <>
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-ai-blue">Staging review</p>
                                        <p className="mt-2 text-sm leading-7 text-white/60">The preview link and review controls will appear here when staging is ready.</p>
                                      </>
                                    )}
                                  </div>
                                )}

                                {selectedBuildChapter.id === 'launch' && (
                                  <div className="border-y border-expert-green/30 bg-expert-green/[0.035] py-5">
                                    {isProjectRequest(currentBuildRecord) && ['launched', 'handoff', 'completed'].includes(currentBuildStatus) ? (
                                      <>
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                      <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-expert-green">Launch and handoff</p>
                                        <p className="mt-2 text-sm leading-7 text-white/68">
                                          {currentBuildStatus === 'completed'
                                            ? 'This build is completed. Launch and handoff details stay here for reference.'
                                            : 'The staging review is approved. Review launch and handoff details before closing the build.'}
                                        </p>
                                      </div>
                                      {currentBuildRecord.launchApprovedAt && (
                                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/42">
                                          Approved {new Date(currentBuildRecord.launchApprovedAt).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-5 grid border-y border-white/10 sm:grid-cols-2 sm:divide-x sm:divide-white/10">
                                      <div className="border-b border-white/10 p-4 sm:border-b-0">
                                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">Live URL</p>
                                        {currentBuildRecord.launchUrl ? (
                                          <a href={currentBuildRecord.launchUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 break-all text-sm font-black text-expert-green transition hover:text-white">
                                            Open live build <ExternalLink className="h-3.5 w-3.5" />
                                          </a>
                                        ) : (
                                          <p className="mt-2 text-sm font-semibold text-white/52">Live link pending</p>
                                        )}
                                      </div>
                                      <div className="p-4">
                                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">Handoff</p>
                                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-white/64">
                                          {currentBuildRecord.handoffNotes || currentBuildRecord.launchNotes || 'Handoff notes will appear when launch is finalized.'}
                                        </p>
                                      </div>
                                    </div>
                                    {currentBuildStatus === 'handoff' && (
                                      <>
                                        <textarea
                                          value={handoffMessage}
                                          onChange={(event) => setHandoffMessage(event.target.value)}
                                          rows={3}
                                          className="mt-5 w-full resize-none border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/24 focus:border-expert-green/60"
                                          placeholder="Add a final handoff note for the team"
                                        />
                                        <div className="mt-4 grid border-y border-white/10 sm:grid-cols-2 sm:divide-x sm:divide-white/10">
                                          <button
                                            type="button"
                                            onClick={() => handleHandoffResponse(currentBuildRecord, 'complete')}
                                            disabled={handoffSubmitting}
                                            className="flex items-center justify-between gap-3 px-4 py-4 text-left text-[10px] font-black uppercase tracking-[0.16em] text-expert-green transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                          >
                                            <span className="flex items-center gap-3"><Check className="h-4 w-4" /> Mark complete</span>
                                            {handoffSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleHandoffResponse(currentBuildRecord, 'issue')}
                                            disabled={handoffSubmitting}
                                            className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-4 text-left text-[10px] font-black uppercase tracking-[0.16em] text-ai-blue transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:border-t-0"
                                          >
                                            <span className="flex items-center gap-3"><MessageSquare className="h-4 w-4" /> Handoff issue</span>
                                            <ChevronRight className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </>
                                    )}
                                    {currentBuildStatus === 'completed' && (
                                      <div className="mt-5 border-y border-white/10 py-4">
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Completed</p>
                                        <p className="mt-2 text-sm leading-7 text-white/64">
                                          {currentBuildRecord.completionAcknowledgedAt
                                            ? `Acknowledged ${new Date(currentBuildRecord.completionAcknowledgedAt).toLocaleDateString()}`
                                            : 'Completion recorded.'}
                                        </p>
                                        {currentBuildRecord.completionNotes && (
                                          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-white/58">{currentBuildRecord.completionNotes}</p>
                                        )}
                                      </div>
                                    )}
                                      </>
                                    ) : (
                                      <>
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-expert-green">Launch</p>
                                        <p className="mt-2 text-sm leading-7 text-white/60">Launch details will appear here after review is approved.</p>
                                      </>
                                    )}
                                  </div>
                                )}
                                {!isProjectRequest(currentBuildRecord) && (
                                  <div className="mt-6 border-y border-white/10 py-6">
                                    <h4 className="mb-5 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.22em] text-white/34">
                                      <Clock className="h-4 w-4" />
                                      Development timeline
                                    </h4>
                                    <MilestoneViewer subscriptionId={currentBuildRecord.id} />
                                  </div>
                                )}
                              </section>

                              <aside className={`border-t border-white/10 px-5 py-6 sm:px-8 xl:border-t-0 xl:px-6 ${
                                selectedBuildChapter.id === 'brief' ? 'hidden' : ''
                              }`}>
                                <div className="divide-y divide-white/10 border-y border-white/10">
                                  {selectedBuildChapter.id === 'brief' && (
                                    <div className="px-1 py-4">
                                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Brief state</p>
                                      <p className="mt-2 text-xs leading-6 text-white/50">
                                        {hasBriefClarification
                                          ? 'Scope waits while these brief questions are completed.'
                                          : isBriefApprovedForScope
                                            ? 'Brief approved. Continue to Scope when ready.'
                                            : 'The team is reviewing your brief. If anything is missing, it appears in the workspace.'}
                                      </p>
                                      {hasBriefClarification && (
                                        <div className="mt-4 border-t border-white/10 pt-4">
                                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-yellow-300">Requested</p>
                                          <p className="mt-2 text-2xl font-black tracking-tight text-white">{briefResponseFields.length}</p>
                                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/34">Brief questions</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {selectedBuildChapter.id === 'build' && (
                                    <div className="px-1 py-4">
                                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Active milestone</p>
                                      <p className="mt-2 text-xs leading-6 text-white/50">{activeBuildMilestone?.title || 'Milestones pending.'}</p>
                                    </div>
                                  )}
                                  {selectedBuildChapter.id === 'review' && (
                                    <div className="px-1 py-4">
                                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Review state</p>
                                      <p className="mt-2 text-xs leading-6 text-white/50">{(currentBuildRecord.stagingReviewStatus || 'not ready').replace(/_/g, ' ')}</p>
                                    </div>
                                  )}
                                  {selectedBuildChapter.id === 'launch' && (
                                    <div className="px-1 py-4">
                                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Launch state</p>
                                      <p className="mt-2 text-xs leading-6 text-white/50">{currentBuildStatus.replace(/_/g, ' ')}</p>
                                    </div>
                                  )}
                                  {!isProjectRequest(currentBuildRecord) && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleAnalyzeSite(currentBuildRecord.id, currentBuildRecord.siteUrl || '')}
                                        disabled={isAnalyzing}
                                        className="flex w-full items-center justify-between gap-4 px-1 py-4 text-left text-[10px] font-black uppercase tracking-[0.16em] text-ai-blue transition hover:text-white disabled:opacity-50"
                                      >
                                        <span className="flex items-center gap-3"><Zap className="h-4 w-4" /> Pulse audit</span>
                                        <ChevronRight className="h-4 w-4" />
                                      </button>
                                      {(currentBuildRecord.planType === 'self_hosted' || currentBuildRecord.planType === 'enterprise') && (
                                        <button
                                          type="button"
                                          onClick={() => handleExportCodebase(currentBuildRecord.id)}
                                          disabled={exportingId === currentBuildRecord.id}
                                          className="flex w-full items-center justify-between gap-4 px-1 py-4 text-left text-[10px] font-black uppercase tracking-[0.16em] text-expert-green transition hover:text-white disabled:opacity-50"
                                        >
                                          <span className="flex items-center gap-3"><Download className="h-4 w-4" /> Export files</span>
                                          <ChevronRight className="h-4 w-4" />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </aside>
                            </div>
                          </div>
                        )}
                      </main>
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === 'domains' && (
              <div className="space-y-6 lg:space-y-8 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-lg font-bold uppercase tracking-tight">Custom Domains</h2>
                  <div className="flex flex-wrap gap-2 lg:gap-4 w-full sm:w-auto">
                    <button 
                      onClick={() => setIsManagedDomainModalOpen(true)}
                      className="flex-1 sm:flex-none px-4 lg:px-6 py-2 bg-ai-blue/10 border border-ai-blue/20 text-ai-blue font-black text-[9px] lg:text-[10px] uppercase tracking-widest rounded-lg hover:bg-ai-blue hover:text-white transition-all"
                    >
                      Request Managed
                    </button>
                    <button 
                      onClick={() => setIsDomainModalOpen(true)}
                      className="flex-1 sm:flex-none px-4 lg:px-6 py-2 bg-expert-green text-dark-bg font-black text-[9px] lg:text-[10px] uppercase tracking-widest rounded-lg"
                    >
                      Attach New
                    </button>
                  </div>
                </div>

                {/* DNS Instructions Alert */}
                <div className="bg-ai-blue/10 border border-ai-blue/20 p-4 lg:p-6 rounded-2xl">
                  <h3 className="text-[10px] font-black uppercase text-ai-blue mb-2 flex items-center gap-2">
                    <Terminal className="w-4 h-4" /> DNS Configuration
                  </h3>
                  <p className="text-[10px] text-white/70 uppercase leading-relaxed">
                    To activate your custom domain, point your A records to the Sitemendr hosting address: <span className="text-white font-black">{process.env.NEXT_PUBLIC_INFRA_IP || '102.0.21.24'}</span> 
                    or use a CNAME record pointing to: <span className="text-white font-black">{process.env.NEXT_PUBLIC_INFRA_CNAME || 'nodes.sitemendr.com'}</span>.
                    Once updated, run verification to prepare your certificate.
                  </p>
                </div>

                {/* Mobile Cards / Desktop Table */}
                <div className="block lg:hidden space-y-4">
                  {domains.map((d) => (
                    <div key={d.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black uppercase text-white">{d.domain}</p>
                          <p className="text-[8px] text-medium-gray uppercase mt-1">Project: {d.subscription?.siteName || d.subscription?.customName || 'Untitled'}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          d.status?.toLowerCase() === 'verified' ? 'bg-expert-green/10 text-expert-green' : 'bg-orange-500/10 text-orange-500'
                        }`}>
                          {d.status || 'Pending'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-white/5">
                        <span className="text-[8px] text-medium-gray uppercase tracking-widest">Setup: {d.setup}</span>
                        {d.status?.toLowerCase() !== 'verified' && (
                          <button 
                            onClick={() => handleVerifyDomain(d.id)}
                            disabled={verifyingDomainId === d.id}
                            className="px-4 py-2 bg-ai-blue text-black text-[9px] font-black uppercase tracking-widest rounded-lg disabled:opacity-50"
                          >
                            {verifyingDomainId === d.id ? '...' : 'VERIFY'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {domains.length === 0 && (
                    <div className="p-10 text-center border border-dashed border-white/10 rounded-2xl opacity-30">
                      <p className="text-[10px] font-black uppercase">No domains attached</p>
                    </div>
                  )}
                </div>

                <div className="hidden lg:block bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.03] text-[9px] font-black uppercase text-medium-gray">
                        <th className="p-6">Domain</th>
                        <th className="p-6">Project</th>
                        <th className="p-6">Type</th>
                        <th className="p-6">Status</th>
                        <th className="p-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {domains.map((d) => (
                        <tr key={d.id} className="text-[10px] font-bold uppercase hover:bg-white/[0.01] transition-colors group">
                          <td className="p-6 text-white group-hover:text-ai-blue transition-colors">{d.domain}</td>
                          <td className="p-6 text-white/60">{d.subscription?.siteName || d.subscription?.customName || 'Untitled'}</td>
                          <td className="p-6">
                            <span className="px-2 py-0.5 bg-white/5 rounded text-[8px] text-white/40">{d.setup}</span>
                          </td>
                          <td className="p-6">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              d.status?.toLowerCase() === 'verified' ? 'bg-expert-green/10 text-expert-green' : 'bg-orange-500/10 text-orange-500'
                            }`}>
                              {d.status || 'Pending'}
                            </span>
                          </td>
                          <td className="p-6 text-right">
                            <div className="flex justify-end gap-3">
                              {d.status?.toLowerCase() !== 'verified' && (
                                <button 
                                  onClick={() => handleVerifyDomain(d.id)}
                                  disabled={verifyingDomainId === d.id}
                                  className="px-3 py-1 bg-ai-blue text-black text-[8px] font-black uppercase tracking-widest rounded hover:bg-white transition-all disabled:opacity-50"
                                >
                                  {verifyingDomainId === d.id ? '...' : 'Verify'}
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteDomain(d.id)}
                                className="px-3 py-1 bg-white/5 border border-white/10 text-red-400 text-[8px] font-black uppercase tracking-widest rounded hover:bg-red-500/10 transition-all"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {domains.length === 0 && (
                    <div className="p-20 text-center opacity-20 uppercase tracking-widest font-mono text-xs italic">
                      Primary DNS records return null
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'ecommerce' && (
              <div className="animate-fade-in">
                <EcommerceManager 
                  subscriptionId={selectedProjectId || (projects.length > 0 ? projects[0].id : undefined)} 
                />
              </div>
            )}

            {activeTab === 'booking' && (
              <div className="animate-fade-in">
                <BookingManager 
                  isAdmin={false} 
                  subscriptionId={selectedProjectId || (projects.length > 0 ? projects[0].id : undefined)} 
                />
              </div>
            )}

            {activeTab === 'tickets' && (
              <div className="animate-fade-in">
                <SupportTickets subscriptionId={selectedProjectId || undefined} />
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="animate-fade-in">
                <BillingViewer 
                  billing={billing} 
                  subscriptions={projects}
                  onManageSubscription={() => {
                    router.push('/payment');
                  }}
                  onDownloadReceipt={() => {
                    alert('Receipt download coming soon. Contact billing@sitemendr.com for invoices.');
                  }}
                  onUpdatePaymentMethod={() => {
                    router.push('/payment');
                  }}
                  onChangeBillingEmail={() => {
                    alert('Please contact support@sitemendr.com to change your billing email.');
                  }}
                  onRequestAudit={() => {
                    alert('Billing audit request submitted. Our team will contact you within 24 hours.');
                  }}
                />
              </div>
            )}

            {activeTab === 'supporter' && (
              <div className="animate-fade-in h-full -m-6 lg:-m-10 overflow-x-hidden">
                <SupporterDashboard onLogout={handleLogoutAction} isNested={true} />
              </div>
            )}

            {activeTab === 'addons' && (
              <div className="animate-fade-in">
                <AddonMarketplace 
                  subscription={projects.length > 0 ? projects[0] : null} 
                  onRequestCustom={() => setActiveTab('tickets')}
                />
              </div>
            )}

            {activeTab === 'editor' && (
              <div className="animate-fade-in">
                {(selectedProjectId || (projects.length > 0 ? projects[0].id : '')) ? (
                  <PageEditor 
                    subscriptionId={selectedProjectId || (projects.length > 0 ? projects[0].id : '')} 
                    purchasedAddons={(projects.find((p: { id: string }) => p.id === (selectedProjectId || (projects.length > 0 ? projects[0].id : '')))?.purchasedAddons as unknown[])}
                  />
                ) : (
                  <div className="h-96 flex items-center justify-center border border-white/5 rounded-3xl bg-white/[0.01]">
                    <p className="text-medium-gray font-medium">No active project found to edit.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="animate-fade-in">
                <PerformanceAudit 
                  data={analysisResult} 
                  isRefreshing={isAnalyzing}
                  onRefresh={() => {
                    const project = projects.find(p => p.id === selectedProjectId) || (projects.length > 0 ? projects[0] : null);
                    if (project?.siteUrl) {
                      handleAnalyzeSite(project.id, project.siteUrl);
                    } else {
                      alert('No active deployment found to audit.');
                    }
                  }}
                />
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="animate-fade-in">
                <MessageViewer messages={messages} />
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="animate-fade-in">
                <ResourceLibrary 
                  resources={resources} 
                  onSupportRequest={() => setActiveTab('tickets')}
                />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-5xl space-y-12 animate-fade-in pb-20">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 px-2">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                      <Settings className="w-5 h-5 text-ai-blue" />
                      Settings
                    </h2>
                    <p className="text-[10px] text-medium-gray font-bold uppercase tracking-widest mt-1 opacity-60">Manage your account profile and security details</p>
                  </div>
                </div>

                {profileMessage.text && (
                  <div className={`p-6 rounded-[24px] text-[10px] font-black uppercase tracking-widest border animate-in slide-in-from-top-4 duration-300 ${
                    profileMessage.type === 'success' ? 'bg-expert-green/10 border-expert-green/20 text-expert-green' : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    <div className="flex items-center gap-3">
                      {profileMessage.type === 'success' ? <Check className="w-4 h-4" /> : <TriangleAlert className="w-4 h-4" />}
                      {profileMessage.text}
                    </div>
                  </div>
                )}

                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                  <section className="bg-white/[0.01] border border-white/5 p-8 lg:p-10 rounded-[40px] space-y-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-ai-blue/10 border border-ai-blue/20 rounded-2xl flex items-center justify-center">
                        <User className="w-6 h-6 text-ai-blue" />
                      </div>
                      <div>
                        <h3 className="text-base font-black uppercase tracking-tight">Identity Profile</h3>
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">General Operational Data</p>
                      </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Assigned Name</label>
                        <input 
                          type="text" 
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-ai-blue outline-none transition-all font-mono"
                          placeholder="Your name"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Communication Channel</label>
                        <input 
                          type="tel" 
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-ai-blue outline-none transition-all font-mono"
                          placeholder="+X XXX XXX XXXX"
                        />
                      </div>
                      <div className="pt-4">
                        <button 
                          type="submit"
                          className="w-full py-4 bg-ai-blue text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-white hover:text-black transition-all shadow-lg shadow-ai-blue/20"
                        >
                          Synchronize Data
                        </button>
                      </div>
                    </form>
                  </section>

                  <section className="bg-white/[0.01] border border-white/5 p-8 lg:p-10 rounded-[40px] space-y-10 flex flex-col justify-between">
                    <div className="space-y-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-tech-purple/10 border border-tech-purple/20 rounded-2xl flex items-center justify-center">
                          <Key className="w-6 h-6 text-tech-purple" />
                        </div>
                        <div>
                          <h3 className="text-base font-black uppercase tracking-tight">Access Control</h3>
                          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Security Credentials</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                          <p className="text-[10px] text-medium-gray font-bold uppercase tracking-widest opacity-60">Current account email</p>
                          <p className="text-sm font-mono text-white/80">{user?.email}</p>
                        </div>
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                          <p className="text-[10px] text-medium-gray font-bold uppercase tracking-widest opacity-60">Security status</p>
                          <p className="text-sm font-mono text-expert-green">TWO_FACTOR_ENABLED</p>
                        </div>
                      </div>
                    </div>

                    <button className="w-full py-4 bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-white/10 transition-all">
                      Reset Security Key
                    </button>
                  </section>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Domain Modals */}
      {isDomainModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-darker-bg border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-tight text-white">Attach System Domain</h3>
              <button onClick={() => setIsDomainModalOpen(false)} className="p-2 text-white/40 hover:text-white transition-colors">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em]">Target Project</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-ai-blue"
                  value={newDomain.siteId}
                  onChange={(e) => setNewDomain({ ...newDomain, siteId: e.target.value })}
                >
                  <option value="">Select Operational Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em]">Domain Endpoint</label>
                <input 
                  type="text"
                  placeholder="domain.tld"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-ai-blue font-mono"
                  value={newDomain.domain}
                  onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })}
                />
              </div>
              <button 
                onClick={async () => {
                  if (!newDomain.domain || !newDomain.siteId) return;
                  setIsSubmittingDomain(true);
                  try {
                    await apiClient.addCustomDomain({ 
                      siteId: newDomain.siteId, 
                      domain: newDomain.domain, 
                      setup: newDomain.setup 
                    });
                    alert('Domain added. Please update DNS records.');
                    fetchData();
                    setIsDomainModalOpen(false);
                  } catch {
                    alert('Link failed.');
                  } finally {
                    setIsSubmittingDomain(false);
                  }
                }}
                disabled={isSubmittingDomain}
                className="w-full py-4 bg-ai-blue text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-white hover:text-black transition-all shadow-lg shadow-ai-blue/20 disabled:opacity-50"
              >
                {isSubmittingDomain ? 'Adding domain...' : 'Add domain'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isManagedDomainModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-darker-bg border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-tight text-white">Request Managed DNS</h3>
              <button onClick={() => setIsManagedDomainModalOpen(false)} className="p-2 text-white/40 hover:text-white transition-colors">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-xs text-white/60 leading-relaxed uppercase font-mono tracking-tighter">
                Our team will handle DNS guidance, SSL certificates, and hosting setup for your project.
              </p>
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em]">Desired Domain</label>
                <input 
                  type="text"
                  placeholder="yourbrand.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-ai-blue font-mono"
                  value={managedDomain.domainInterest}
                  onChange={(e) => setManagedDomain({ ...managedDomain, domainInterest: e.target.value })}
                />
              </div>
              <button 
                onClick={async () => {
                  if (!managedDomain.domainInterest) return;
                  setIsSubmittingDomain(true);
                  try {
                    await apiClient.requestManagedDomain(user?.email || '', managedDomain.domainInterest);
                    alert('Deployment request received. A technician will contact you.');
                    setIsManagedDomainModalOpen(false);
                  } catch {
                    alert('Request failed.');
                  } finally {
                    setIsSubmittingDomain(false);
                  }
                }}
                disabled={isSubmittingDomain}
                className="w-full py-4 bg-tech-purple text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-white hover:text-black transition-all shadow-lg shadow-tech-purple/20 disabled:opacity-50"
              >
                {isSubmittingDomain ? 'Sending request...' : 'Request managed setup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assessment Details Modal */}
      {showProjectRequestModal && (
        <AssessmentQuestionnaire
          isOpen={showProjectRequestModal}
          onClose={() => setShowProjectRequestModal(false)}
          onComplete={() => {
            setShowProjectRequestModal(false);
            setActiveTab('projects');
            setSelectedProjectId(null);
            fetchData();
          }}
        />
      )}

      {showAssessmentModal && selectedAssessment && (
        <AssessmentModal 
          isOpen={showAssessmentModal}
          onClose={() => setShowAssessmentModal(false)}
          assessment={selectedAssessment}
        />
      )}

      {/* Reveal Overlay */}
      {isRevealing && revealTier && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black animate-reveal-bg">
          <div className="text-center space-y-12 max-w-2xl px-8 py-16 rounded-[40px] border border-white/5 bg-white/[0.01] backdrop-blur-3xl animate-reveal-card">
            <div className="relative">
              <div className="absolute inset-0 bg-ai-blue/40 blur-[100px] animate-pulse rounded-full"></div>
              <div className="relative w-24 h-24 lg:w-32 h-32 bg-ai-blue rounded-[32px] flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(0,102,255,0.6)] animate-bounce-slow">
                <Gift className="w-12 h-12 lg:w-16 h-16 text-white" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-[10px] font-black text-ai-blue uppercase tracking-[0.5em] animate-fade-in">Community access updated</h2>
              <h1 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter leading-none animate-reveal-text">
                {revealTier.name}
              </h1>
              <p className="text-medium-gray text-xs font-mono uppercase tracking-widest opacity-60 max-w-sm mx-auto animate-fade-in delay-300">
                Your Sitemendr account now carries this community level and its connected benefits.
              </p>
            </div>

            <div className="pt-8 space-y-6 animate-fade-in delay-500">
              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">Member benefits</span>
                  <Sparkles className="w-4 h-4 text-ai-blue animate-spin-slow" />
                </div>
                <ul className="space-y-2">
                  {revealTier.perks.slice(0, 3).map((perk, i) => (
                    <li key={i} className="flex items-center gap-3 text-[10px] font-mono text-medium-gray uppercase tracking-tighter">
                      <Check className="w-3 h-3 text-ai-blue" />
                      {perk.replace(/-/g, ' ')}
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => {
                  setIsRevealing(false);
                  const newUrl = window.location.pathname + window.location.search.replace(/[?&]reveal=[^&]+/, '');
                  window.history.replaceState({}, '', newUrl);
                }}
                className="w-full py-5 bg-ai-blue text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl hover:bg-white hover:text-black transition-all shadow-2xl shadow-ai-blue/40 active:scale-95 duration-300"
              >
                Open community access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
