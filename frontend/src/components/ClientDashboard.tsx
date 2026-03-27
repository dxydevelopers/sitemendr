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
  Menu,
  Plus,
  Check,
  TriangleAlert,
  Heart,
  Sparkles,
  Gift
} from 'lucide-react';
import { apiClient, SupporterTier } from '@/lib/api';
import dynamic from 'next/dynamic';
import AssessmentModal from './AssessmentModal';

const SupportTickets = dynamic(() => import('./dashboard/SupportTickets'), { ssr: false });
const TemplateViewer = dynamic(() => import('./dashboard/TemplateViewer'), { ssr: false });
const MilestoneViewer = dynamic(() => import('./dashboard/MilestoneViewer'), { ssr: false });
const BillingViewer = dynamic(() => import('./dashboard/BillingViewer'), { ssr: false });
const MessageViewer = dynamic(() => import('./dashboard/MessageViewer'), { ssr: false });
const ResourceLibrary = dynamic(() => import('./dashboard/ResourceLibrary'), { ssr: false });
const AddonMarketplace = dynamic(() => import('./dashboard/AddonMarketplace'), { ssr: false });
const VisualContentEditor = dynamic(() => import('./dashboard/VisualContentEditor'), { ssr: false });
const PageEditor = dynamic(() => import('./dashboard/PageEditor'), { ssr: false });
const PerformanceAudit = dynamic(() => import('./dashboard/PerformanceAudit'), { ssr: false });
const EcommerceManager = dynamic(() => import('./dashboard/EcommerceManager'), { ssr: false });
const BookingManager = dynamic(() => import('./dashboard/BookingManager'), { ssr: false });
const SupporterDashboard = dynamic(() => import('./SupporterDashboard'), { ssr: false });
const AssessmentResults = dynamic(() => import('./AssessmentResults'), { ssr: false });

const mockTiers: SupporterTier[] = [
  {
    id: 'starter-id',
    name: 'Starter Supporter',
    slug: 'starter',
    monthlyPrice: 5,
    discountPercent: 5,
    displayOrder: 1,
    isActive: true,
    perks: ['exclusive-badge', 'supporter-wall', 'community-access'],
  },
  {
    id: 'standard-id',
    name: 'Standard Supporter',
    slug: 'standard',
    monthlyPrice: 15,
    discountPercent: 10,
    displayOrder: 2,
    isActive: true,
    perks: ['early-access', 'voting-rights', 'starter-perks'],
  },
  {
    id: 'plus-id',
    name: 'Plus Supporter',
    slug: 'plus',
    monthlyPrice: 30,
    discountPercent: 15,
    displayOrder: 3,
    isActive: true,
    perks: ['roundtable-invites', 'product-council', 'standard-perks'],
  },
  {
    id: 'premium-id',
    name: 'Premium Supporter',
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
  name: string;
  status: string;
  progress: number;
  planType?: string;
  siteUrl?: string;
  domain?: string;
  reviewRequested?: boolean;
  reviewNotes?: string;
  revisionCount?: number;
  purchasedAddons?: string[] | string;
  isCurrent?: boolean;
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

const ClientDashboard: React.FC<{ onLogout?: () => void, initialTab?: string }> = ({ onLogout, initialTab }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab || 'dashboard');
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [billing, setBilling] = useState<BillingItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
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
  const [analyzedProjectId, setAnalyzedProjectId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<any | null>(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [revealTier, setRevealTier] = useState<SupporterTier | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({ name: '', phone: '' });
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
  const socketRef = useRef<Socket | null>(null);
  const activeTabRef = useRef(activeTab);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

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
      setActiveTab(tabParam);
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
      const [
        statsRes, 
        projectsRes, 
        activitiesRes,
        billingRes,
        messagesRes,
        ticketsRes,
        resourcesRes,
        domainsRes,
        bookingsRes,
        assessmentsRes
      ] = await Promise.all([
        apiClient.getClientStats(projectId).catch(err => ({ success: false, stats: null })) as unknown as Promise<{ success: boolean; stats: ClientStats }>,
        apiClient.getClientProjects().catch(err => ({ success: false, data: [] })) as unknown as Promise<{ success: boolean; data: ClientProject[] }>,
        apiClient.getClientActivities().catch(err => ({ success: false, data: [] })) as unknown as Promise<{ success: boolean; data: ClientActivity[] }>,
        apiClient.getClientBilling().catch(err => ({ success: false, data: [] })) as unknown as Promise<{ success: boolean; data: BillingItem[] }>,
        apiClient.getClientMessages().catch(err => ({ success: false, messages: [] })) as unknown as Promise<{ success: boolean; messages: MessageItem[] }>,
        apiClient.getClientSupportTickets().catch(err => ({ success: false, data: [] })) as unknown as Promise<{ success: boolean; data: SupportTicket[] }>,
        apiClient.getClientResources().catch(err => ({ success: false, data: [] })) as unknown as Promise<{ success: boolean; data: ResourceItem[] }>,
        apiClient.getClientDomains().catch(err => ({ success: false, domains: [] })) as unknown as Promise<{ success: boolean; domains: CustomDomain[] }>,
        apiClient.getUserBookings(projectId).catch(err => []) as unknown as Promise<any[]>,
        apiClient.getClientAssessments().catch(err => ({ success: false, data: [] })) as unknown as Promise<{ success: boolean; data: any[] }>
      ]);

      if (statsRes.success && statsRes.stats) setStats(statsRes.stats);

      // Map projects and assessments to the same list
      const projectList = (projectsRes as any).data || (projectsRes as any).projects || (projectsRes as any).subscriptions || [];
      const assessmentList = (assessmentsRes as any).data || (assessmentsRes as any).assessments || [];
      
      const mappedProjects = projectList.map((p: any) => ({
        id: p.id,
        name: p.siteName || p.customName || 'Untitled Project',
        status: p.suspended === false ? 'active' : 'suspended',
        progress: p.progress || 100,
        planType: p.planType,
        siteUrl: p.siteUrl,
        domain: p.domain,
        reviewRequested: p.reviewRequested,
        reviewNotes: p.reviewNotes,
        revisionCount: p.revisionCount,
        isCurrent: p.isCurrent
      }));

      // Add assessments that aren't yet subscriptions
      assessmentList.forEach((a: any) => {
        // If this assessment is already linked to a project we've mapped, skip it
        if (mappedProjects.some((p: any) => p.id === a.id || p.id === a.subscriptionId)) return;
        
        mappedProjects.push({
          id: a.id,
          name: a.responses?.businessName || a.responses?.company || `Analysis ${a.id.slice(0, 8)}`,
          status: 'pending',
          progress: 10,
          planType: a.responses?.selectedPackage || 'Analysis_Phase',
          isCurrent: mappedProjects.length === 0
        });
      });

      if (mappedProjects.length > 0) {
        setProjects(mappedProjects);
        
        // Prioritize isCurrent project
        if (!projectId && !selectedProjectId) {
          const currentProject = mappedProjects.find((p: { isCurrent: boolean }) => p.isCurrent);
          setSelectedProjectId(currentProject ? currentProject.id : mappedProjects[0].id);
        }
      } else {
        setProjects([]);
      }

      const activityList = (activitiesRes as any).data || (activitiesRes as any).activities;
      if (activitiesRes.success && activityList) setActivities(activityList);

      const billingList = (billingRes as any).data || (billingRes as any).billing;
      if (billingRes.success && billingList) setBilling(billingList);

      const messageList = (messagesRes as any).messages || (messagesRes as any).data;
      if (messagesRes.success && messageList) setMessages(messageList);
      
      const ticketList = (ticketsRes as any).data || (ticketsRes as any).tickets;
      if (ticketsRes.success && ticketList) setTickets(ticketList);

      const resourceList = (resourcesRes as any).data || (resourcesRes as any).resources;
      if (resourcesRes.success && resourceList) setResources(resourceList);

      const domainList = (domainsRes as any).domains || (domainsRes as any).data;
      if (domainsRes.success && domainList) setDomains(domainList);

      if (bookingsRes) setBookings(bookingsRes);

      // Get user from localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setProfileData({ name: parsedUser.name || '', phone: parsedUser.phone || '' });
      }
    } catch (err) {
      console.error('Fetch failed in ClientDashboard:', err);
      setFetchError('Neural link interrupted. Failed to synchronize dashboard data. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

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
          } catch (e) {}
        }
      }
    });

    socketRef.current.on('new_support_message', (data) => {
      if (activeTabRef.current === 'support' || activeTabRef.current === 'dashboard') {
        fetchData();
      }
    });

    socketRef.current.on('new_system_message', (data) => {
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
    } catch (err) {
      alert('Failed to export codebase.');
    } finally {
      setExportingId(null);
    }
  };

  const handleRegenerate = async (projectId: string) => {
    setRegeneratingId(projectId);
    try {
      const res = await apiClient.regenerateProjectAI(projectId);
      if (res.success) {
        alert('Regeneration protocol initiated. Your node will be updated shortly.');
        fetchData();
      }
    } catch (err) {
      alert('Failed to initiate regeneration.');
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.updateUserProfile(profileData);
      if (res.success) {
        setProfileMessage({ text: 'Profile synchronization complete.', type: 'success' });
        const updatedUser = { ...user, ...profileData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser as any);
      }
    } catch (err) {
      setProfileMessage({ text: 'Neural update failed.', type: 'error' });
    }
    setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
  };

  const handleAnalyzeSite = async (projectId: string, url: string) => {
    setIsAnalyzing(true);
    setAnalyzedProjectId(projectId);
    try {
      const res = await apiClient.analyzeSite(url);
      setAnalysisResult(res);
      setActiveTab('audit');
    } catch (err) {
      alert('Audit failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleViewAssessment = async (projectId: string) => {
    try {
      setLoading(true);
      const res = await apiClient.getAssessmentDetails(projectId);
      if (res.success) {
        setSelectedAssessment(res.data);
        setShowAssessmentModal(true);
      }
    } catch (err) {
      alert('Failed to retrieve analysis data.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAction = () => {
    apiClient.logout();
    if (onLogout) onLogout();
    router.push('/login');
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-ai-blue/10 rounded-full animate-spin border-t-ai-blue shadow-[0_0_30px_rgba(0,102,255,0.2)]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Terminal className="w-8 h-8 text-ai-blue animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-black uppercase tracking-[0.4em] text-white">Synchronizing</h2>
            <p className="text-[10px] font-mono text-medium-gray uppercase tracking-widest animate-pulse">Establishing Secure Neural Link...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white font-sans selection:bg-ai-blue/30 overflow-x-hidden">
      {/* HUD Background Decorations */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-ai-blue rounded-full blur-[160px] opacity-20"></div>
      </div>

      <div className="flex relative z-10 min-h-screen">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-72 lg:w-80 bg-black/40 backdrop-blur-2xl border-r border-white/5 transition-transform duration-500 transform
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="h-full flex flex-col p-8">
            <div className="flex items-center gap-4 mb-14 px-2 group">
              <div className="w-12 h-12 bg-ai-blue rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(0,102,255,0.4)] group-hover:scale-110 transition-transform">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black uppercase tracking-tight">Sitemendr</h1>
                <p className="text-[9px] font-black text-ai-blue uppercase tracking-widest opacity-60">Control_Center.v2</p>
              </div>
            </div>

            <nav className="flex-1 space-y-10">
              <div className="space-y-2">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] px-6 mb-4 block">System_Nodes</span>
                <div className="space-y-2">
                  {[
                    { id: 'dashboard', label: 'Overview', icon: <BarChart3 className="w-5 h-5" /> },
                    { id: 'projects', label: 'Control Center', icon: <Rocket className="w-5 h-5" />, count: projects.length },
                    { id: 'messages', label: 'Inbound Comms', icon: <MessageSquare className="w-5 h-5" />, count: messages.filter(m => !m.isRead).length },
                    { id: 'billing', label: 'Finance Node', icon: <CreditCard className="w-5 h-5" /> },
                    { id: 'resources', label: 'Neural Library', icon: <BookOpen className="w-5 h-5" /> },
                    { id: 'support', label: 'Tactical Support', icon: <LifeBuoy className="w-5 h-5" /> },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSelectedProjectId(null);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full text-left px-6 py-4 rounded-xl transition-all duration-300 flex items-center gap-4 group relative overflow-hidden ${
                        activeTab === item.id
                          ? 'bg-ai-blue/10 text-white border border-ai-blue/20 shadow-[0_0_20px_rgba(0,102,255,0.1)]'
                          : 'text-medium-gray hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {activeTab === item.id && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-ai-blue shadow-[0_0_10px_rgba(0,102,255,0.8)]"></div>
                      )}
                      <span className={`transition-all duration-300 group-hover:scale-110 ${activeTab === item.id ? 'opacity-100 text-ai-blue scale-110' : 'opacity-40'}`}>
                        {item.icon}
                      </span>
                      <span className="font-semibold text-[13px] tracking-tight flex-1">{item.label}</span>
                      {(item as any).count > 0 && (
                        <span className="px-2 py-0.5 bg-ai-blue text-white text-[10px] font-black rounded-full animate-pulse">
                          {item.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] px-6 mb-4 block">Personalization</span>
                <div className="space-y-2">
                  {[
                    { id: 'settings', label: 'System Settings', icon: <Settings className="w-5 h-5" /> },
                    { id: 'supporter', label: 'Support Wall', icon: <Heart className="w-5 h-5" /> },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSelectedProjectId(null);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full text-left px-6 py-4 rounded-xl transition-all duration-300 flex items-center gap-4 group relative overflow-hidden ${
                        activeTab === item.id
                          ? 'bg-ai-blue/10 text-white border border-ai-blue/20'
                          : 'text-medium-gray hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className={`transition-transform duration-300 group-hover:scale-110 ${activeTab === item.id ? 'opacity-100 text-ai-blue' : 'opacity-40'}`}>
                        {item.icon}
                      </span>
                      <span className="font-semibold text-[13px] tracking-tight">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </nav>

            <div className="pt-10 mt-auto">
              <button 
                onClick={handleLogoutAction}
                className="w-full flex items-center gap-4 px-6 py-4 text-red-400 hover:bg-red-500/10 rounded-xl transition-all group font-black text-xs uppercase tracking-widest"
              >
                <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Terminate Session
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-80 min-h-screen">
          {/* Header */}
          <header className="h-24 lg:h-32 flex items-center justify-between px-8 lg:px-14 bg-black/20 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
            <div className="flex items-center gap-4 lg:hidden">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-medium-gray hover:text-white">
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-black uppercase">Sitemendr</h1>
            </div>

            <div className="hidden lg:flex flex-col">
              <h2 className="text-xl font-black uppercase tracking-tight">
                {activeTab === 'dashboard' && 'Neural_Overview'}
                {activeTab === 'projects' && 'Project_Matrix'}
                {activeTab === 'messages' && 'Communications_Array'}
                {activeTab === 'billing' && 'Financial_Ledger'}
                {activeTab === 'resources' && 'Knowledge_Base'}
                {activeTab === 'support' && 'Tactical_Support'}
                {activeTab === 'settings' && 'System_Configuration'}
                {activeTab === 'supporter' && 'Supporter_Grid'}
                {activeTab === 'audit' && 'Performance_Pulse'}
              </h2>
              <p className="text-[10px] font-black text-medium-gray uppercase tracking-widest mt-1 opacity-60 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-expert-green rounded-full animate-pulse"></span>
                Status: Operational. Link established.
              </p>
            </div>

            <div className="flex items-center gap-4 lg:gap-8">
              <div className="hidden sm:flex items-center gap-4 px-5 py-2.5 bg-white/5 border border-white/5 rounded-2xl group cursor-pointer hover:border-ai-blue/30 transition-all">
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-tight leading-none">{user?.name || 'Authorized_User'}</p>
                  <p className="text-[8px] font-mono text-ai-blue uppercase tracking-widest mt-1 opacity-60">Client Node</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-ai-blue/20 border border-ai-blue/30 flex items-center justify-center text-ai-blue group-hover:scale-110 transition-transform">
                  <User className="w-5 h-5" />
                </div>
              </div>

              <div className="flex items-center gap-2 lg:gap-4">
                <div className="relative group">
                  <button className="p-3 lg:p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all text-medium-gray hover:text-white relative">
                    <Bell className="w-5 h-5 lg:w-6 h-6" />
                    <span className="absolute top-3 right-3 w-2 h-2 bg-ai-blue rounded-full border-2 border-dark-bg"></span>
                  </button>
                </div>
                <button className="lg:hidden p-3 bg-white/5 border border-white/5 rounded-2xl text-medium-gray">
                  <User className="w-6 h-6" />
                </button>
              </div>
            </div>
          </header>

          <div className="p-8 lg:p-14">
            {fetchError && (
              <div className="mb-10 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
                <TriangleAlert className="w-6 h-6 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-black uppercase text-red-500">Neural Sync Error</h4>
                  <p className="text-xs text-red-400/70 font-medium">{fetchError}</p>
                </div>
                <button onClick={() => fetchData()} className="px-4 py-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-600 transition-all">Retry Link</button>
              </div>
            )}

            {/* TAB CONTENT */}
            {activeTab === 'dashboard' && (
              <div className="space-y-12 animate-fade-in">
                {/* Hero / Welcome */}
                <div className="relative p-10 lg:p-14 bg-gradient-to-br from-ai-blue/10 to-tech-purple/10 border border-white/5 rounded-[3rem] overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                    <Rocket className="w-40 h-40 text-ai-blue rotate-12" />
                  </div>
                  <div className="relative z-10 max-w-2xl space-y-6">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-ai-blue">
                      <Sparkles className="w-4 h-4" /> Welcome back, Commander
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter leading-none">
                      Your Digital <span className="text-ai-blue">Empire</span> Is Expanding
                    </h1>
                    <p className="text-medium-gray text-sm lg:text-base leading-relaxed opacity-70">
                      Synchronized across global edge nodes. 12 active assessments completed. All systems reporting optimal performance and security metrics.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-4">
                      <button 
                        onClick={() => setActiveTab('projects')}
                        className="px-8 py-4 bg-ai-blue text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-white hover:text-black transition-all shadow-xl shadow-ai-blue/20"
                      >
                        Enter Project Matrix
                      </button>
                      <button className="px-8 py-4 bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-white/10 transition-all">
                        View Network Status
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { label: 'Active Projects', value: stats?.activeNodes || 0, icon: <Rocket className="w-6 h-6" />, color: 'text-ai-blue', trend: '+1 new' },
                    { label: 'System Uptime', value: `${stats?.uptime || 99.9}%`, icon: <Zap className="w-6 h-6" />, color: 'text-expert-green', trend: 'Global' },
                    { label: 'Security Level', value: stats?.securityLevel || 'AAA+', icon: <Shield className="w-6 h-6" />, color: 'text-tech-purple', trend: 'Encrypted' },
                    { label: 'Network Latency', value: `${stats?.latency || 12}ms`, icon: <Globe className="w-6 h-6" />, color: 'text-orange-500', trend: 'Optimized' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] flex flex-col justify-between hover:border-white/10 transition-all group">
                      <div className="flex justify-between items-start mb-6">
                        <div className={`p-4 rounded-2xl bg-white/5 ${stat.color} group-hover:scale-110 transition-transform shadow-lg shadow-black/20`}>
                          {stat.icon}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-medium-gray group-hover:text-white transition-colors">
                          {stat.trend}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-medium-gray uppercase tracking-widest mb-2 opacity-60">{stat.label}</p>
                        <h4 className="text-3xl font-black uppercase tracking-tighter">{stat.value}</h4>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8">
                  {/* Recent Activity */}
                  <div className="lg:col-span-2 bg-white/[0.01] border border-white/5 p-10 rounded-[3rem] space-y-10">
                    <div className="flex justify-between items-center px-2">
                      <h3 className="text-sm font-black uppercase tracking-[0.4em] text-white/30 flex items-center gap-4">
                        <Terminal className="w-5 h-5" /> Activity Logs
                      </h3>
                      <button className="text-[10px] font-black uppercase tracking-widest text-ai-blue hover:underline">View Full Logs</button>
                    </div>
                    <div className="space-y-6">
                      {activities.length > 0 ? activities.map((act, i) => (
                        <div key={i} className="flex items-center gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/5 transition-all group">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            {act.type === 'payment' ? <CreditCard className="w-5 h-5 text-expert-green" /> : <FileText className="w-5 h-5 text-ai-blue" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold uppercase truncate">{act.title}</h4>
                            <p className="text-[10px] text-medium-gray uppercase mt-1 opacity-60 truncate">{act.desc}</p>
                          </div>
                          <span className="text-[9px] font-mono text-medium-gray uppercase tracking-widest flex-shrink-0">{act.time}</span>
                        </div>
                      )) : (
                        <div className="py-20 text-center text-medium-gray opacity-20 uppercase tracking-widest font-mono text-xs italic">
                          No recent telemetry data available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resource Center */}
                  <div className="bg-ai-blue/5 border border-ai-blue/10 p-10 rounded-[3rem] flex flex-col justify-between">
                    <div className="space-y-6">
                      <h3 className="text-sm font-black uppercase tracking-[0.4em] text-ai-blue/40 flex items-center gap-4">
                        <BookOpen className="w-5 h-5" /> Quick Resources
                      </h3>
                      <div className="space-y-3">
                        {[
                          'Deployment Guide v2.4',
                          'Neural API Integration',
                          'Security Protocols',
                          'Custom Styling Engine',
                        ].map((doc, i) => (
                          <button key={i} className="w-full text-left p-4 hover:bg-ai-blue/10 rounded-2xl transition-all group flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-tight text-white/80 group-hover:text-white transition-colors">{doc}</span>
                            <ChevronRight className="w-4 h-4 text-white/20 group-hover:translate-x-1 group-hover:text-ai-blue transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="pt-8">
                      <button 
                        onClick={() => setActiveTab('resources')}
                        className="w-full py-4 bg-ai-blue/20 border border-ai-blue/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-ai-blue hover:bg-ai-blue hover:text-white transition-all"
                      >
                        Enter Neural Library
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-6 lg:space-y-10 animate-fade-in">
                {/* Modern Project Switcher Tab Bar */}
                {projects.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar border-b border-white/5">
                    <button 
                      onClick={() => setSelectedProjectId(null)}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                        !selectedProjectId 
                          ? 'bg-ai-blue text-black border-ai-blue shadow-[0_0_20px_rgba(0,102,255,0.2)]' 
                          : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
                      }`}
                    >
                      All Systems
                    </button>
                    {projects.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => setSelectedProjectId(p.id)}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border flex items-center gap-3 ${
                          selectedProjectId === p.id 
                            ? 'bg-ai-blue/10 text-white border-ai-blue shadow-[0_0_20px_rgba(0,102,255,0.1)]' 
                            : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'active' ? 'bg-expert-green' : 'bg-ai-blue'}`}></span>
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}

                {!selectedProjectId ? (
                  projects.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-40 px-10 rounded-[4rem] border border-dashed border-ai-blue/20 bg-ai-blue/[0.02] backdrop-blur-xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-ai-blue/5 to-transparent opacity-50"></div>
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-24 h-24 rounded-[32px] bg-ai-blue/10 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 border border-ai-blue/20 shadow-[0_0_50px_rgba(0,102,255,0.1)]">
                          <Terminal className="w-12 h-12 text-ai-blue" />
                        </div>
                        <h3 className="text-3xl lg:text-4xl font-black mb-6 tracking-tighter uppercase text-white">INITIALIZE_NODE_FAILURE</h3>
                        <p className="text-medium-gray text-center max-w-lg font-mono text-[11px] uppercase tracking-[0.2em] leading-relaxed opacity-60 mb-12">
                          Primary data index returned null. Your workspace is currently empty. Launch the Neural Assessment Terminal to define your first node architecture.
                        </p>
                        <button 
                          onClick={() => {
                            // Find assessment trigger or redirect
                            window.location.href = '/assessment';
                          }}
                          className="group relative px-12 py-6 bg-ai-blue text-white font-black text-xs uppercase tracking-[0.4em] rounded-[24px] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-ai-blue/30"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-ai-blue to-tech-purple opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="relative z-10 flex items-center gap-4">
                            Launch Assessment Terminal <Zap className="w-5 h-5 animate-pulse" />
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
                      {projects.map((project) => (
                        <div key={project.id} className="bg-white/[0.02] border border-white/5 p-8 lg:p-10 rounded-[2.5rem] group relative overflow-hidden flex flex-col hover:border-ai-blue/30 transition-all duration-500 shadow-2xl">
                          {/* HUD Corner Decor */}
                          <div className="absolute top-6 right-6 w-8 h-8 border-t border-r border-white/10 group-hover:border-ai-blue/40 transition-colors"></div>
                          
                          <div className="flex justify-between items-start mb-8">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`w-2 h-2 rounded-full ${project.status === 'active' ? 'bg-expert-green animate-pulse' : 'bg-ai-blue'}`}></span>
                                <span className="text-[9px] font-black text-ai-blue uppercase tracking-[0.4em]">
                                  {project.status === 'active' ? 'OPERATIONAL_NODE' : 'NEURAL_ANALYSIS_ACTIVE'}
                                </span>
                              </div>
                              <h3 className="text-xl lg:text-2xl font-black uppercase tracking-tighter mb-1 truncate text-white group-hover:text-ai-blue transition-colors">{project.name}</h3>
                              <div className="flex items-center gap-4 text-[8px] font-mono text-medium-gray uppercase tracking-widest opacity-60">
                                <span>{project.planType?.replace(/_/g, ' ') || 'Assessment Only'}</span>
                                <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                <span className="flex items-center gap-1"><Globe className="w-2.5 h-2.5" /> Edge Node: Global</span>
                              </div>
                            </div>
                            
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                              {project.status === 'active' ? <Rocket className="w-6 h-6 text-expert-green" /> : <Sparkles className="w-6 h-6 text-ai-blue" />}
                            </div>
                          </div>

                          <div className="space-y-6 mb-10">
                            <div>
                              <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-medium-gray mb-3">
                                <span>Deployment Progress</span>
                                <span className="text-white">{project.progress}%</span>
                              </div>
                              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/5">
                                <div 
                                  className={`h-full rounded-full transition-all duration-1000 ${project.status === 'active' ? 'bg-gradient-to-r from-expert-green to-ai-blue' : 'bg-ai-blue'}`} 
                                  style={{ width: `${project.progress}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Process Roadmap */}
                            <div className="pt-6 border-t border-white/5">
                              <div className="flex justify-between items-center mb-6 px-1">
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Workflow Status</span>
                                <span className="text-[7px] font-mono text-ai-blue uppercase tracking-widest bg-ai-blue/5 px-2 py-0.5 rounded border border-ai-blue/10">
                                  {project.status === 'active' ? 'Operational' : 'Syncing'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between px-1">
                                {[
                                  { label: 'Analysis', step: 1, active: true },
                                  { label: 'Architect', step: 2, active: project.progress > 20 || project.status === 'active' },
                                  { label: 'Deploy', step: 3, active: project.progress > 60 || project.status === 'active' },
                                  { label: 'Go-Live', step: 4, active: project.status === 'active' }
                                ].map((s, idx, arr) => (
                                  <React.Fragment key={s.label}>
                                    <div className="flex flex-col items-center gap-2 group/step relative">
                                      <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-[10px] flex items-center justify-center border transition-all duration-500 ${
                                        s.active 
                                          ? 'bg-ai-blue text-black border-ai-blue shadow-[0_0_15px_rgba(0,102,255,0.4)]' 
                                          : 'bg-transparent border-white/10 text-white/20'
                                      }`}>
                                        <span className="text-[8px] lg:text-[9px] font-black">{s.step}</span>
                                      </div>
                                      <span className={`text-[6px] lg:text-[7px] font-black uppercase tracking-widest ${s.active ? 'text-white' : 'text-white/20'}`}>{s.label}</span>
                                    </div>
                                    {idx < arr.length - 1 && (
                                      <div className="flex-1 px-1 lg:px-2">
                                        <div className={`h-[1px] ${arr[idx+1].active ? 'bg-ai-blue' : 'bg-white/10'}`}></div>
                                      </div>
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-auto flex flex-col gap-3">
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button 
                                onClick={() => setSelectedProjectId(project.id)}
                                className="flex-1 px-6 py-4 bg-white/5 border border-white/10 text-white font-black text-[9px] lg:text-[10px] uppercase tracking-widest rounded-2xl hover:bg-ai-blue hover:text-black transition-all flex items-center justify-center gap-3 group/btn shadow-xl shadow-black/20"
                              >
                                Manage Console <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                              </button>
                              
                              {project.status === 'pending' ? (
                                <button 
                                  onClick={() => handleViewAssessment(project.id)}
                                  className="flex-1 px-6 py-4 bg-ai-blue/10 border border-ai-blue/20 text-ai-blue font-black text-[9px] lg:text-[10px] uppercase tracking-widest rounded-2xl hover:bg-ai-blue hover:text-white transition-all flex items-center justify-center gap-3"
                                >
                                  <Sparkles className="w-4 h-4" /> View Analysis
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleAnalyzeSite(project.id, project.siteUrl || '')}
                                  disabled={isAnalyzing}
                                  className="flex-1 px-6 py-4 bg-tech-purple/10 border border-tech-purple/20 text-tech-purple font-black text-[9px] lg:text-[10px] uppercase tracking-widest rounded-2xl hover:bg-tech-purple hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                  <Zap className="w-4 h-4" /> Pulse Audit
                                </button>
                              )}
                            </div>

                            {(project.status !== 'active' || project.planType === 'self_hosted' || project.planType === 'enterprise') && (
                              <div className="flex flex-col sm:flex-row gap-3">
                                {project.status !== 'active' && (
                                  <button 
                                    onClick={() => handleRegenerate(project.id)}
                                    disabled={regeneratingId === project.id}
                                    className="flex-1 px-6 py-3 bg-white/5 border border-white/5 text-medium-gray font-black text-[8px] lg:text-[9px] uppercase tracking-widest rounded-xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                  >
                                    {regeneratingId === project.id ? (
                                      <><Loader2 className="w-3 h-3 animate-spin" /> Syncing</>
                                    ) : (
                                      <><Zap className="w-3 h-3 text-ai-blue" /> Re-Neuralize</>
                                    )}
                                  </button>
                                )}

                                {(project.planType === 'self_hosted' || project.planType === 'enterprise') && (
                                  <button 
                                    onClick={() => handleExportCodebase(project.id)}
                                    disabled={exportingId === project.id}
                                    className="flex-1 px-6 py-3 bg-white/5 border border-white/5 text-medium-gray font-black text-[8px] lg:text-[9px] uppercase tracking-widest rounded-xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                  >
                                    {exportingId === project.id ? (
                                      <><Loader2 className="w-3 h-3 animate-spin" /> Packaging</>
                                    ) : (
                                      <><Download className="w-3 h-3 text-expert-green" /> Export Node</>
                                    )}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="space-y-10 lg:space-y-12 animate-fade-in">
                    {/* Detailed View Header */}
                    <div className="flex flex-col gap-8">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <button 
                          onClick={() => setSelectedProjectId(null)} 
                          className="group flex items-center gap-3 text-medium-gray hover:text-ai-blue transition-colors uppercase text-[10px] font-black tracking-widest"
                        >
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-ai-blue/10 transition-colors">
                            <ChevronRight className="w-4 h-4 rotate-180" /> 
                          </div>
                          Back to Control Center
                        </button>
                        
                        {projects.find(p => p.id === selectedProjectId) && (
                          <div className="flex flex-wrap gap-4">
                            {projects.find(p => p.id === selectedProjectId)?.status === 'pending' && (
                              <button 
                                onClick={() => handleViewAssessment(selectedProjectId!)}
                                className="px-6 py-2.5 bg-ai-blue text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-white transition-all shadow-lg shadow-ai-blue/20 flex items-center gap-2"
                              >
                                <Sparkles className="w-4 h-4" /> View Full Analysis
                              </button>
                            )}

                            {projects.find(p => p.id === selectedProjectId)?.reviewNotes && (
                              <div className="bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
                                <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                                  <Bell className="w-3 h-3 animate-bounce" /> Feedback Protocol Active
                                </span>
                              </div>
                            )}
                            
                            {projects.find(p => p.id === selectedProjectId)?.status === 'active' && !projects.find(p => p.id === selectedProjectId)?.reviewRequested && (
                              <button 
                                onClick={async () => {
                                  if (confirm('Request a professional design review? Our experts will manually refine your site for peak performance.')) {
                                    try {
                                      await apiClient.requestProjectReview(selectedProjectId!);
                                      alert('Review request sent. We\'ll review your site soon.');
                                      fetchData();
                                    } catch {
                                      alert('Failed to request review.');
                                    }
                                  }
                                }}
                                className="px-6 py-2.5 bg-expert-green/10 border border-expert-green/20 text-expert-green font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-expert-green hover:text-black transition-all flex items-center gap-2"
                              >
                                <User className="w-4 h-4" /> Request Human Review
                              </button>
                            )}
                            
                            {projects.find(p => p.id === selectedProjectId)?.reviewRequested && (
                              <div className="px-6 py-2.5 bg-white/5 border border-white/10 text-medium-gray font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Processing Review...
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Project Identity Section */}
                      <div className="relative p-10 lg:p-12 bg-white/[0.01] border border-white/5 rounded-[3rem] overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-ai-blue/5 to-tech-purple/5 opacity-50"></div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                          <div>
                            <div className="flex items-center gap-4 mb-3">
                              <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                projects.find(p => p.id === selectedProjectId)?.status === 'active' 
                                  ? 'bg-expert-green/10 text-expert-green border-expert-green/20' 
                                  : 'bg-ai-blue/10 text-ai-blue border-ai-blue/20'
                              }`}>
                                {projects.find(p => p.id === selectedProjectId)?.status === 'active' ? 'Operational' : 'Assessment_Phase'}
                              </span>
                              <span className="text-[10px] font-mono text-medium-gray uppercase tracking-widest opacity-60 flex items-center gap-2">
                                <Shield className="w-3 h-3" /> Secure Node {selectedProjectId?.slice(-8)}
                              </span>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-4">{projects.find(p => p.id === selectedProjectId)?.name}</h1>
                            <div className="flex flex-wrap gap-8 items-center">
                              <div>
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Architecture</p>
                                <p className="text-xs font-black uppercase tracking-tight text-white/80">{projects.find(p => p.id === selectedProjectId)?.planType?.replace(/_/g, ' ') || 'AI Neural Assessment'}</p>
                              </div>
                              <div className="w-px h-8 bg-white/5 hidden sm:block"></div>
                              <div>
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Edge Status</p>
                                <p className="text-xs font-black uppercase tracking-tight text-expert-green flex items-center gap-2">
                                  <Globe className="w-3.5 h-3.5" /> 102_NODES_ACTIVE
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                            <div className="w-full md:w-64 space-y-3">
                              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-medium-gray px-1">
                                <span>Sync Progress</span>
                                <span className="text-ai-blue">{projects.find(p => p.id === selectedProjectId)?.progress || 0}%</span>
                              </div>
                              <div className="w-full h-3 bg-white/5 rounded-full p-1 border border-white/5">
                                <div 
                                  className="h-full bg-gradient-to-r from-ai-blue to-tech-purple rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(0,102,255,0.3)]" 
                                  style={{ width: `${projects.find(p => p.id === selectedProjectId)?.progress || 0}%` }}
                                ></div>
                              </div>
                            </div>
                            <p className="text-[8px] font-mono text-medium-gray uppercase tracking-widest opacity-40">LAST_SYNC: {new Date().toLocaleTimeString()}</p>
                          </div>
                        </div>

                        {/* Detail Roadmap Integration */}
                        <div className="mt-12 pt-10 border-t border-white/5 relative z-10">
                          <div className="flex justify-between items-center mb-8 px-2">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Project Roadmap Protocols</span>
                            <span className="text-[9px] font-mono text-ai-blue uppercase tracking-widest bg-ai-blue/5 px-3 py-1 rounded border border-ai-blue/10">
                              Current Phase: {
                                projects.find(p => p.id === selectedProjectId)?.status === 'active' 
                                  ? 'GO_LIVE_NOMINAL' 
                                  : (projects.find(p => p.id === selectedProjectId)?.progress || 0) > 60 
                                  ? 'DEPLOYMENT_PHASE'
                                  : (projects.find(p => p.id === selectedProjectId)?.progress || 0) > 20
                                  ? 'ARCHITECT_PHASE'
                                  : 'ANALYSIS_PHASE'
                              }
                            </span>
                          </div>
                          <div className="flex items-center justify-between px-4 max-w-4xl mx-auto">
                            {[
                              { label: 'Analysis', step: 1, active: true, desc: 'AI Neural Mapping' },
                              { label: 'Architect', step: 2, active: (projects.find(p => p.id === selectedProjectId)?.progress || 0) > 20 || projects.find(p => p.id === selectedProjectId)?.status === 'active', desc: 'Node Structuring' },
                              { label: 'Deploy', step: 3, active: (projects.find(p => p.id === selectedProjectId)?.progress || 0) > 60 || projects.find(p => p.id === selectedProjectId)?.status === 'active', desc: 'Edge Propagation' },
                              { label: 'Go-Live', step: 4, active: projects.find(p => p.id === selectedProjectId)?.status === 'active', desc: 'System Nominal' }
                            ].map((s, idx, arr) => (
                              <React.Fragment key={s.label}>
                                <div className="flex flex-col items-center gap-3 group/step relative">
                                  <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-[18px] flex items-center justify-center border transition-all duration-700 ${
                                    s.active 
                                      ? 'bg-ai-blue text-black border-ai-blue shadow-[0_0_25px_rgba(0,102,255,0.4)] rotate-0' 
                                      : 'bg-transparent border-white/5 text-white/10 rotate-12'
                                  }`}>
                                    {s.active && s.step === 4 ? <Rocket className="w-5 h-5 lg:w-6 lg:h-6" /> : <span className="text-xs lg:text-sm font-black">{s.step}</span>}
                                  </div>
                                  <div className="text-center">
                                    <p className={`text-[8px] lg:text-[10px] font-black uppercase tracking-widest ${s.active ? 'text-white' : 'text-white/20'}`}>{s.label}</p>
                                    <p className={`text-[6px] lg:text-[7px] font-mono uppercase tracking-tighter mt-0.5 ${s.active ? 'text-ai-blue' : 'text-white/10'}`}>{s.desc}</p>
                                  </div>
                                  
                                  {/* Tooltip hint for next step */}
                                  {!s.active && arr[idx-1]?.active && (
                                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-ai-blue text-black text-[8px] font-black uppercase tracking-widest rounded-xl whitespace-nowrap opacity-0 group-hover/step:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-2xl z-50">
                                      Next Protocol: {s.label}
                                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-ai-blue rotate-45"></div>
                                    </div>
                                  )}
                                </div>
                                {idx < arr.length - 1 && (
                                  <div className="flex-1 px-4 lg:px-8">
                                    <div className={`h-[1px] relative ${arr[idx+1].active ? 'bg-ai-blue shadow-[0_0_10px_rgba(0,102,255,0.5)]' : 'bg-white/5'}`}>
                                      {s.active && !arr[idx+1].active && (
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-ai-blue rounded-full animate-ping"></div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Detail View Tabs/Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-10">
                          <div className="bg-white/[0.01] border border-white/5 p-10 rounded-[3rem]">
                            <h3 className="text-sm font-black uppercase tracking-[0.4em] text-white/30 mb-10 flex items-center gap-4">
                              <Zap className="w-5 h-5" /> {projects.find(p => p.id === selectedProjectId)?.status === 'active' ? 'Operational Controls' : 'Deployment Protocols'}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              {(projects.find(p => p.id === selectedProjectId)?.status === 'active' ? [
                                { label: 'Sync Repository', icon: <Rocket className="w-5 h-5" />, status: 'Auto' },
                                { label: 'Security Firewall', icon: <Shield className="w-5 h-5" />, status: 'Active' },
                                { label: 'Edge Propagation', icon: <Globe className="w-5 h-5" />, status: 'Stable' },
                                { label: 'Live Monitoring', icon: <Terminal className="w-5 h-5" />, status: 'Operational' },
                              ] : [
                                { label: 'Code Generation', icon: <Terminal className="w-5 h-5" />, status: (projects.find(p => p.id === selectedProjectId)?.progress || 0) > 20 ? 'Success' : 'Ready' },
                                { label: 'Database Sharding', icon: <Zap className="w-5 h-5" />, status: (projects.find(p => p.id === selectedProjectId)?.progress || 0) > 40 ? 'Synced' : 'Waiting' },
                                { label: 'Edge Configuration', icon: <Globe className="w-5 h-5" />, status: (projects.find(p => p.id === selectedProjectId)?.progress || 0) > 60 ? 'Active' : 'Pending' },
                                { label: 'SSL Certification', icon: <Shield className="w-5 h-5" />, status: (projects.find(p => p.id === selectedProjectId)?.progress || 0) > 80 ? 'Verified' : 'Pending' },
                              ]).map((ctrl, i) => (
                                <button key={i} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/5 transition-all group">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-medium-gray group-hover:text-ai-blue transition-colors">
                                      {ctrl.icon}
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-tight">{ctrl.label}</span>
                                  </div>
                                  <span className={`text-[8px] font-mono uppercase tracking-widest ${
                                    ctrl.status === 'Success' || ctrl.status === 'Synced' || ctrl.status === 'Active' || ctrl.status === 'Verified' || ctrl.status === 'Operational' || ctrl.status === 'Stable'
                                      ? 'text-expert-green' 
                                      : 'text-ai-blue animate-pulse'
                                  }`}>{ctrl.status}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="bg-white/[0.01] border border-white/5 p-10 rounded-[3rem]">
                            <h3 className="text-sm font-black uppercase tracking-[0.4em] text-white/30 mb-10 flex items-center gap-4">
                              <Clock className="w-5 h-5" /> Development Timeline
                            </h3>
                            <MilestoneViewer subscriptionId={selectedProjectId!} />
                          </div>
                        </div>

                        <div className="lg:col-span-1">
                          <TemplateViewer subscriptionId={selectedProjectId!} />
                        </div>
                      </div>
                    </div>
                  </div>
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
                    To activate your custom domain, point your A records to our global edge node: <span className="text-white font-black">{process.env.NEXT_PUBLIC_INFRA_IP || '102.0.21.24'}</span> 
                    or use a CNAME record pointing to: <span className="text-white font-black">{process.env.NEXT_PUBLIC_INFRA_CNAME || 'nodes.sitemendr.com'}</span>.
                    Once updated, trigger verification to synchronize your certificate.
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

            {activeTab === 'support' && (
              <div className="animate-fade-in">
                <SupportTickets subscriptionId={selectedProjectId || undefined} />
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="animate-fade-in">
                <BillingViewer 
                  billing={billing} 
                  subscriptions={projects as any}
                  onManageSubscription={(id) => {
                    router.push('/payment');
                  }}
                  onDownloadReceipt={(id) => {
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
              <div className="animate-fade-in h-full -m-6 lg:-m-10">
                <SupporterDashboard onLogout={handleLogoutAction} isNested={true} />
              </div>
            )}

            {activeTab === 'addons' && (
              <div className="animate-fade-in">
                <AddonMarketplace 
                  subscription={projects.length > 0 ? projects[0] : null} 
                  onRequestCustom={() => setActiveTab('support')}
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
                  onSupportRequest={() => setActiveTab('support')}
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
                    <p className="text-[10px] text-medium-gray font-bold uppercase tracking-widest mt-1 opacity-60">Manage your node credentials and profile data</p>
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
                          placeholder="Node_Identifier"
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
                          <p className="text-[10px] text-medium-gray font-bold uppercase tracking-widest opacity-60">Current Access Node</p>
                          <p className="text-sm font-mono text-white/80">{user?.email}</p>
                        </div>
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                          <p className="text-[10px] text-medium-gray font-bold uppercase tracking-widest opacity-60">Security Protocol</p>
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
                    await apiClient.attachDomain(newDomain.siteId, newDomain.domain, newDomain.setup);
                    alert('Domain linked to neural network. Please update DNS records.');
                    fetchData();
                    setIsDomainModalOpen(false);
                  } catch (err) {
                    alert('Link failed.');
                  } finally {
                    setIsSubmittingDomain(false);
                  }
                }}
                disabled={isSubmittingDomain}
                className="w-full py-4 bg-ai-blue text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-white hover:text-black transition-all shadow-lg shadow-ai-blue/20 disabled:opacity-50"
              >
                {isSubmittingDomain ? 'TRANSMITTING...' : 'LINK_DOMAIN_PROTOCOL'}
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
                Our team will handle all DNS propagation, SSL certificates, and edge caching for your node.
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
                    await apiClient.requestManagedDomain(managedDomain.domainInterest);
                    alert('Deployment request received. A technician will contact you.');
                    setIsManagedDomainModalOpen(false);
                  } catch (err) {
                    alert('Request failed.');
                  } finally {
                    setIsSubmittingDomain(false);
                  }
                }}
                disabled={isSubmittingDomain}
                className="w-full py-4 bg-tech-purple text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-white hover:text-black transition-all shadow-lg shadow-tech-purple/20 disabled:opacity-50"
              >
                {isSubmittingDomain ? 'QUEUING...' : 'AUTHORIZE_MANAGED_LINK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assessment Details Modal */}
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
              <h2 className="text-[10px] font-black text-ai-blue uppercase tracking-[0.5em] animate-fade-in">Operational Upgrade Detected</h2>
              <h1 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter leading-none animate-reveal-text">
                {revealTier.name}
              </h1>
              <p className="text-medium-gray text-xs font-mono uppercase tracking-widest opacity-60 max-w-sm mx-auto animate-fade-in delay-300">
                Authorized access to Founders Circle level assets and synchronization Discount of {revealTier.discountPercent}%
              </p>
            </div>

            <div className="pt-8 space-y-6 animate-fade-in delay-500">
              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">Node Perks</span>
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
                Access Decrypted Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
