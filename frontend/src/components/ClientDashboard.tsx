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
  CheckCircle,
  Menu,
  Plus,
  CheckCircle2,
  AlertCircle,
  Heart,
  Sparkles,
  Gift
} from 'lucide-react';
import { apiClient, SupporterTier } from '@/lib/api';
import dynamic from 'next/dynamic';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [revealTier, setRevealTier] = useState<SupporterTier | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
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

      console.log('DEBUG: statsRes:', statsRes);
      console.log('DEBUG: projectsRes:', projectsRes);
      console.log('DEBUG: assessmentsRes:', assessmentsRes);

      if (statsRes.success && statsRes.stats) setStats(statsRes.stats);

      // Map projects and assessments to the same list
      const projectList = (projectsRes as any).data || (projectsRes as any).projects || (projectsRes as any).subscriptions || [];
      const assessmentList = (assessmentsRes as any).data || (assessmentsRes as any).assessments || [];
      
      console.log('DEBUG: projectList from API:', projectList);
      console.log('DEBUG: assessmentList from API:', assessmentList);

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
        console.log('DEBUG: Combined Projects/Assessments set in state:', mappedProjects.length, mappedProjects);
        
        // Prioritize isCurrent project
        if (!projectId && !selectedProjectId) {
          const currentProject = mappedProjects.find((p: { isCurrent: boolean }) => p.isCurrent);
          setSelectedProjectId(currentProject ? currentProject.id : mappedProjects[0].id);
        }
      } else {
        console.log('DEBUG: No projects or assessments found after mapping');
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
      console.log('New support message:', data);
      if (activeTabRef.current === 'support' || activeTabRef.current === 'dashboard') {
        fetchData();
      }
    });

    socketRef.current.on('new_system_message', (data) => {
      console.log('New system message:', data);
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
        // In a real browser environment, we'd trigger a download of a ZIP
        // For this implementation, we'll simulate the download by creating a text blob of the manifest
        
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${res.data.name.toLowerCase().replace(/\s+/g, '-')}-codebase.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert('Codebase export package generated successfully.');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to bundle codebase. Ensure your plan supports self-hosting.');
    } finally {
      setExportingId(null);
    }
  };

  const handleAnalyzeSite = async (projectId: string, url: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalyzedProjectId(projectId);
    try {
      const res = await apiClient.analyzePerformance(url);
      if (res.success) {
        setAnalysisResult(res.data as unknown as AnalysisResult);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Failed to analyze site performance.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRegenerate = async (projectId: string) => {
    if (!confirm('This will use AI to regenerate your site blueprint based on your assessment. Existing manual edits may be overwritten. Continue?')) return;
    
    setRegeneratingId(projectId);
    try {
      const res = await apiClient.regenerateProjectAI(projectId);
      if (res.success) {
        alert('Content regeneration complete. Your project has been updated.');
        fetchData();
      }
    } catch (error) {
      console.error('Regeneration failed:', error);
      alert('Content regeneration failed. Please contact support.');
    } finally {
      setRegeneratingId(null);
    }
  };

  // Profile management state
  const [profileData, setProfileData] = useState({ name: '', phone: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData(selectedProjectId || undefined);
  }, [fetchData, selectedProjectId]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (activeTab === 'audit' && selectedProjectId) {
      const fetchVitals = async () => {
        setIsAnalyzing(true);
        try {
          const res = await apiClient.getSiteVitals(selectedProjectId) as { success: boolean; vitals: { performance: number; coreWebVitals?: { lcp?: string; cls?: string } } };
          if (res.success) {
            setAnalysisResult({
              insights: 'Content audit complete.',
              metrics: {
                score: res.vitals.performance,
                vitals: {
                  fcp: res.vitals.coreWebVitals?.lcp,
                  tti: '1.2s',
                  cls: res.vitals.coreWebVitals?.cls,
                  lcp: res.vitals.coreWebVitals?.lcp
                }
              }
            });
          }
        } catch (error) {
          console.error('Vitals fetch failed:', error);
        } finally {
          setIsAnalyzing(false);
        }
      };
      fetchVitals();
    }
  }, [activeTab, selectedProjectId]);

  const handleLogoutAction = () => {
    localStorage.removeItem('sitemendr_auth_token');
    localStorage.removeItem('user');
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/login';
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage({ type: '', text: '' });
    try {
      const res = await apiClient.updateProfile(profileData);
      if (res.success) {
        setProfileMessage({ type: 'success', text: 'Profile updated successfully' });
        localStorage.setItem('user', JSON.stringify(res.user));
        setUser(res.user);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setProfileMessage({ type: 'error', text: errorMessage });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setProfileMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    setProfileLoading(true);
    try {
      await apiClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setProfileMessage({ type: 'success', text: 'Password changed successfully' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
      setProfileMessage({ type: 'error', text: errorMessage });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingDomain(true);
    try {
      await apiClient.addCustomDomain(newDomain);
      setIsDomainModalOpen(false);
      setNewDomain({ domain: '', siteId: '', setup: 'self' });
      fetchData();
    } catch {
      console.error('Request failed');
      alert('Failed to connect domain. Please ensure the domain is valid.');
    } finally {
      setIsSubmittingDomain(false);
    }
  };

  const handleRequestManagedDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    setIsSubmittingDomain(true);
    try {
      await apiClient.requestManagedDomain(user.email, managedDomain.domainInterest);
      setIsManagedDomainModalOpen(false);
      setManagedDomain({ domainInterest: '' });
      alert('Request submitted! Our team will contact you shortly.');
    } catch {
      console.error('Request failed');
      alert('Failed to submit request.');
    } finally {
      setIsSubmittingDomain(false);
    }
  };

  const handleVerifyDomain = async (domainId: string) => {
    setVerifyingDomainId(domainId);
    try {
      const res = await apiClient.verifyDomainDNS(domainId);
      alert(res.message);
      if (res.verified) {
        fetchData();
      }
    } catch (error: unknown) {
      console.error('Verification failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Verification failed';
      alert(errorMessage);
    } finally {
      setVerifyingDomainId(null);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
    { 
      id: 'projects', 
      label: 'My Projects', 
      icon: <Rocket className="w-5 h-5" />,
      count: projects.length
    },
    { id: 'editor', label: 'Visual Editor', icon: <MousePointer2 className="w-5 h-5" /> },
    { id: 'audit', label: 'Performance', icon: <Zap className="w-5 h-5" /> },
    { id: 'domains', label: 'Domains', icon: <Globe className="w-5 h-5" />, count: domains.length },
    { 
      id: 'messages', 
      label: 'Messages', 
      icon: <MessageSquare className="w-5 h-5" />,
      count: messages.filter(m => !m.isRead && m.sender !== 'USER').length 
    },
    { id: 'billing', label: 'Billing', icon: <CreditCard className="w-5 h-5" />, count: billing.length },
    { id: 'supporter', label: 'Supporter', icon: <Heart className="w-5 h-5 text-pink-500" /> },
    { id: 'addons', label: 'Add-ons', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'booking', label: 'Booking', icon: <Clock className="w-5 h-5" />, count: bookings.length },
    { id: 'resources', label: 'Resources', icon: <BookOpen className="w-5 h-5" /> },
    { 
      id: 'support', 
      label: 'Support', 
      icon: <LifeBuoy className="w-5 h-5" />,
      count: tickets.filter(t => 
        (t.status === 'open' || t.status === 'pending') || 
        (t as any).messages?.some((m: any) => !m.isRead && m.isAdmin)
      ).length 
    },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="relative min-h-screen bg-darker-bg">
      {/* Unveiling Overlay */}
      {(isRevealing || revealTier) && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-1000 ${revealTier && !isRevealing ? 'bg-black/80 backdrop-blur-sm' : 'bg-black'}`}>
          <div className="text-center relative">
            {isRevealing ? (
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-40 h-40 bg-ai-blue/10 border border-ai-blue/30 rounded-full flex items-center justify-center mb-8 relative">
                  <Gift className="w-20 h-20 text-ai-blue animate-bounce" />
                  <div className="absolute inset-0 bg-ai-blue/20 blur-3xl rounded-full"></div>
                </div>
                <h2 className="text-4xl font-black text-white uppercase tracking-[0.4em] animate-pulse">Unveiling Reward...</h2>
                <div className="mt-4 flex gap-2 justify-center">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-ai-blue animate-[bounce_1.5s_infinite]" style={{ animationDelay: `${i * 0.2}s` }}></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="animate-fade-in flex flex-col items-center p-8 bg-dark-bg border border-ai-blue/30 rounded-3xl shadow-[0_0_100px_rgba(0,102,255,0.2)] max-w-lg w-full">
                <div className="absolute -top-12 -right-12 pointer-events-none">
                  <Sparkles className="w-24 h-24 text-ai-blue/40 animate-pulse" />
                </div>
                
                <div className="w-24 h-24 bg-ai-blue/10 rounded-2xl flex items-center justify-center mb-6 border border-ai-blue/20 shadow-inner">
                  <Heart className="w-12 h-12 text-ai-blue" />
                </div>
                
                <span className="text-[10px] font-mono font-black text-ai-blue uppercase tracking-[0.4em] mb-4">Package_Unveiled</span>
                <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">{revealTier?.name}</h3>
                
                <div className="h-px w-full bg-white/10 mb-6"></div>
                
                <div className="space-y-4 mb-10 text-left w-full">
                  <div className="flex items-center gap-3 text-expert-green">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-black uppercase font-mono">{revealTier?.discountPercent}% Lifetime Discount</span>
                  </div>
                  <ul className="space-y-2">
                    {revealTier?.perks.slice(0, 3).map((perk, i) => (
                      <li key={i} className="flex items-center gap-3 text-[10px] font-mono text-medium-gray uppercase tracking-tighter">
                        <CheckCircle2 className="w-3 h-3 text-ai-blue" />
                        {perk.replace(/-/g, ' ')}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-4 w-full">
                  <button 
                    onClick={() => {
                      // Redirect to payment or supporter dashboard
                      window.location.href = `/support?tier=${revealTier?.id}`;
                    }}
                    className="w-full py-5 bg-ai-blue text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white hover:text-ai-blue transition-all shadow-[0_0_20px_rgba(0,102,255,0.3)]"
                  >
                    Claim Reward - ${revealTier?.monthlyPrice}/mo
                  </button>
                  <button 
                    onClick={() => {
                      setRevealTier(null);
                      // Clear search params
                      window.history.replaceState({}, '', window.location.pathname);
                    }}
                    className="w-full py-5 bg-transparent border border-white/10 text-medium-gray font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/5 transition-all"
                  >
                    Close Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`flex h-screen bg-darker-bg text-white selection:bg-ai-blue/30 overflow-hidden font-sans relative ${revealTier || isRevealing ? 'blur-md pointer-events-none' : ''}`}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Infrastructure Grid Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-80 bg-black/80 lg:bg-white/[0.01] border-r border-white/5 backdrop-blur-3xl flex flex-col z-[110] lg:z-20 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-ai-blue to-tech-purple rounded-lg animate-pulse flex items-center justify-center">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent tracking-tight uppercase">
              Terminal
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black text-ai-blue uppercase tracking-[0.3em]">Node: {user?.id?.slice(0, 6) || 'SMR-X1'}</span>
            <span className="w-1 h-1 rounded-full bg-expert-green animate-ping"></span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                    router.push(`/dashboard/${item.id}`);
                  }}
                  className={`w-full text-left px-6 py-4 rounded-xl transition-all duration-300 flex items-center gap-4 group relative overflow-hidden ${
                    activeTab === item.id
                      ? 'bg-ai-blue/10 text-white border border-ai-blue/20'
                      : 'text-medium-gray hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={`transition-transform duration-300 group-hover:scale-110 ${activeTab === item.id ? 'opacity-100' : 'opacity-40'}`}>
                    {item.icon}
                  </span>
                  <span className="font-semibold text-[13px] tracking-tight flex-1">{item.label}</span>
                  {(item as any).count > 0 && (
                    <span className="bg-ai-blue text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg shadow-ai-blue/20">
                      {(item as any).count}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-6 border-t border-white/5 space-y-4">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group hover:border-ai-blue/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-ai-blue to-tech-purple flex items-center justify-center font-black text-xs shadow-lg uppercase">
                {user?.name?.split(' ').map((n: string) => n[0]).join('') || 'JD'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name || 'John Doe'}</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-expert-green"></div>
                  <p className="text-[10px] text-medium-gray font-medium truncate">Secure Session</p>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleLogoutAction}
            className="w-full flex items-center gap-3 px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 font-semibold text-xs rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300"
          >
            <LogOut className="w-4 h-4" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="px-6 lg:px-10 py-4 lg:py-6 flex justify-between items-center border-b border-white/5 relative bg-white/[0.01] backdrop-blur-sm">
          <div className="flex items-center gap-4 lg:gap-8">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-white/5 rounded-lg border border-white/10"
            >
              <Menu className="w-5 h-5 text-ai-blue" />
            </button>

            {projects.length > 0 && (
              <div className="hidden sm:flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                <span className="text-[8px] font-black text-medium-gray uppercase tracking-widest">Active Site:</span>
                <select 
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest focus:outline-none text-ai-blue min-w-[120px] lg:min-w-[150px]"
                  value={selectedProjectId || ''}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  {projects.map(project => (
                    <option key={project.id} value={project.id} className="bg-darker-bg text-white">
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[7px] text-medium-gray font-black uppercase tracking-widest">Global Status</span>
              <span className="text-[10px] text-expert-green font-black uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-expert-green animate-pulse"></span>
                Operational
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 overflow-y-auto relative custom-scrollbar">
          {fetchError && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{fetchError}</p>
              </div>
              <button onClick={() => fetchData()} className="px-4 py-2 bg-red-500 text-white font-black text-[8px] uppercase tracking-widest rounded-lg hover:bg-red-600 transition-all">
                Retry Sync
              </button>
            </div>
          )}

          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ai-blue"></div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div className="space-y-6 lg:space-y-10 animate-fade-in">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Projects', value: stats?.activeNodes || 0, icon: <Zap className="w-8 h-8 text-ai-blue" />, unit: '' },
                      { label: 'Uptime', value: stats?.uptime ? `${stats.uptime}%` : 'N/A', icon: <Globe className="w-8 h-8 text-expert-green" />, unit: '' },
                      { label: 'Security', value: stats?.securityLevel || 'N/A', icon: <Shield className="w-8 h-8 text-tech-purple" />, unit: '' },
                      { label: 'Response Time', value: stats?.latency ? `${stats.latency}ms` : 'N/A', icon: <Clock className="w-8 h-8 text-orange-500" />, unit: '' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white/[0.02] border border-white/5 p-4 lg:p-6 rounded-2xl group hover:border-ai-blue/30 transition-all">
                        <span className="text-[7px] lg:text-[8px] font-bold text-medium-gray uppercase tracking-widest block mb-1 group-hover:text-ai-blue transition-colors">{stat.label}</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg lg:text-xl font-bold tracking-tight">{stat.value}</span>
                          <span className="text-[8px] lg:text-[10px] font-bold text-ai-blue/50">{stat.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Intelligence Widgets */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Financial Pulse */}
                    <div className="bg-white/[0.01] border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-expert-green/30 transition-all">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-10 h-10 rounded-xl bg-expert-green/10 border border-expert-green/20 flex items-center justify-center text-expert-green">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <span className="text-[7px] font-black text-medium-gray uppercase tracking-widest">Billing</span>
                      </div>
                      {billing.length > 0 ? (
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Latest Payment</p>
                          <p className="text-xl font-black text-white">${(billing[0].amount / 100).toFixed(2)}</p>
                          <div className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${billing[0].status === 'completed' ? 'text-expert-green' : 'text-orange-500'}`}>
                            <div className={`w-1 h-1 rounded-full ${billing[0].status === 'completed' ? 'bg-expert-green' : 'bg-orange-500'}`}></div>
                            Status: {billing[0].status}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">No billing history</p>
                      )}
                      <button onClick={() => setActiveTab('billing')} className="mt-6 text-[8px] font-black text-ai-blue uppercase tracking-[0.2em] hover:text-white transition-colors">View Billing →</button>
                    </div>

                    {/* Support Node */}
                    <div className="bg-white/[0.01] border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-tech-purple/30 transition-all">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-10 h-10 rounded-xl bg-tech-purple/10 border border-tech-purple/20 flex items-center justify-center text-tech-purple relative">
                          <LifeBuoy className="w-5 h-5" />
                          {tickets.filter(t => t.status === 'open' || t.status === 'pending').length > 0 && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-ai-blue border-2 border-darker-bg rounded-full"></div>
                          )}
                        </div>
                        <span className="text-[7px] font-black text-medium-gray uppercase tracking-widest">Support</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Open Tickets</p>
                        <p className="text-xl font-black text-white">{tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length > 0 ? tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length : 'All Resolved'}</p>
                        <p className="text-[8px] text-tech-purple font-black uppercase tracking-widest">{tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length} tickets</p>
                      </div>
                      <button onClick={() => setActiveTab('support')} className="mt-6 text-[8px] font-black text-ai-blue uppercase tracking-[0.2em] hover:text-white transition-colors">Get Support →</button>
                    </div>

                    {/* Inbox */}
                    <div className="bg-white/[0.01] border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-ai-blue/30 transition-all">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-10 h-10 rounded-xl bg-ai-blue/10 border border-ai-blue/20 flex items-center justify-center text-ai-blue relative">
                          <MessageSquare className="w-5 h-5" />
                          {messages.filter(m => !m.isRead && m.sender !== 'USER').length > 0 && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-ai-blue border-2 border-darker-bg rounded-full"></div>
                          )}
                        </div>
                        <span className="text-[7px] font-black text-medium-gray uppercase tracking-widest">Inbox</span>
                      </div>
                      {messages.length > 0 ? (
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Latest Message</p>
                          <p className="text-sm font-black text-white truncate">{messages[0].subject}</p>
                          <p className="text-[8px] text-white/20 font-black uppercase tracking-widest">{new Date(messages[0].createdAt).toLocaleDateString()}</p>
                        </div>
                      ) : (
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">No new messages</p>
                      )}
                      <button onClick={() => setActiveTab('messages')} className="mt-6 text-[8px] font-black text-ai-blue uppercase tracking-[0.2em] hover:text-white transition-colors">View Messages →</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Quick Deployment Panel */}
                    <div className="bg-white/[0.01] border border-white/5 p-8 rounded-[40px] relative overflow-hidden group">
                      <div className="absolute inset-0 bg-ai-blue/[0.02] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-3">
                        <Zap className="w-5 h-5 text-ai-blue" />
                        Quick Actions
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setActiveTab('editor')} className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-ai-blue hover:text-black transition-all flex flex-col gap-4 text-left group/btn">
                          <MousePointer2 className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Open Editor</span>
                        </button>
                        <button onClick={() => setActiveTab('addons')} className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-expert-green hover:text-black transition-all flex flex-col gap-4 text-left group/btn">
                          <ShoppingBag className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Add-ons</span>
                        </button>
                        <button onClick={() => setActiveTab('booking')} className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-tech-purple hover:text-white transition-all flex flex-col gap-4 text-left group/btn">
                          <Clock className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Bookings</span>
                        </button>
                        <button onClick={() => setActiveTab('addons')} className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-orange-500 hover:text-black transition-all flex flex-col gap-4 text-left group/btn">
                          <Plus className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Browse Add-ons</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-ai-blue/10 to-tech-purple/10 border border-ai-blue/20 p-8 rounded-[40px] relative overflow-hidden flex flex-col justify-center">
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <Users className="w-5 h-5 text-ai-blue" />
                          <h3 className="text-xs lg:text-sm font-black uppercase tracking-widest text-white">Refer & Earn</h3>
                        </div>
                        <p className="text-[9px] lg:text-[10px] text-white/60 uppercase mb-8 leading-relaxed max-w-xl font-medium">
                          Share your referral link to earn credits. For every new website created through your link, you receive $50 in credits.
                        </p>
                        <div className="space-y-4">
                          <div className="bg-black/40 border border-white/10 rounded-2xl px-5 py-4 font-mono text-[9px] text-ai-blue flex items-center truncate">
                            {typeof window !== 'undefined' ? window.location.origin : 'https://sitemendr.com'}/assessment?ref={user?.id?.slice(0, 8)}
                          </div>
                          <button 
                            onClick={() => {
                              const link = `${typeof window !== 'undefined' ? window.location.origin : 'https://sitemendr.com'}/assessment?ref=${user?.id?.slice(0, 8)}`;
                              navigator.clipboard.writeText(link);
                              alert('Referral link synchronized to clipboard.');
                            }}
                            className="w-full px-6 py-4 bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                          >
                            Copy Link
                          </button>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-64 h-64 bg-ai-blue/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    <div className="lg:col-span-2 space-y-4 lg:space-y-6">
                      <h2 className="text-base lg:text-lg font-bold tracking-tight uppercase flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-ai-blue rounded-full"></span>
                        My Projects
                      </h2>
                      <div className="grid gap-3 lg:gap-4">
                        {projects.length > 0 ? projects.map((project) => (
                          <div key={project.id} className="bg-white/[0.02] border border-white/5 p-4 lg:p-6 rounded-2xl flex justify-between items-center group hover:bg-white/[0.04] transition-all cursor-pointer" onClick={() => { setSelectedProjectId(project.id); setActiveTab('projects'); }}>
                            <div>
                              <p className="text-[8px] lg:text-[10px] text-ai-blue font-black uppercase mb-1">Project-{project.id.slice(0, 8)}</p>
                              <p className="text-sm lg:text-base font-black uppercase truncate max-w-[120px] sm:max-w-none">{project.name}</p>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <p className="text-[8px] lg:text-[10px] text-medium-gray font-black uppercase mb-1">{project.status}</p>
                              <div className="w-20 sm:w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-ai-blue" style={{ width: `${project.progress}%` }}></div>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="p-10 border border-dashed border-white/10 rounded-2xl text-center text-medium-gray uppercase text-[10px]">No active projects</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-4 lg:space-y-6">
                      <h2 className="text-base lg:text-lg font-bold tracking-tight uppercase flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-tech-purple rounded-full"></span>
                        Recent Activity
                      </h2>
                      <div className="bg-white/[0.02] border border-white/5 p-4 lg:p-6 rounded-2xl space-y-4 lg:space-y-5">
                        {activities.map((act, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
                              {act.type === 'payment' ? <CreditCard className="w-4 h-4 text-expert-green" /> : <FileText className="w-4 h-4 text-ai-blue" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9px] lg:text-[10px] font-black uppercase truncate">{act.title}</p>
                              <p className="text-[8px] text-medium-gray uppercase tracking-tighter line-clamp-1">{act.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'projects' && (
                <div className="space-y-6 lg:space-y-8 animate-fade-in">
                  {!selectedProjectId ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                      {projects.map((project) => (
                        <div key={project.id} className="bg-white/[0.02] border border-white/5 p-6 lg:p-8 rounded-3xl group relative overflow-hidden">
                          <h3 className="text-base lg:text-lg font-black uppercase mb-4 truncate">{project.name}</h3>
                          <div className="space-y-4">
                            <div className="flex justify-between text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-medium-gray">
                              <span>Integrity</span>
                              <span>{project.progress}%</span>
                            </div>
                            <div className="w-full h-1.5 lg:h-2 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-ai-blue" style={{ width: `${project.progress}%` }}></div>
                            </div>
                          </div>
                          
                          <div className="mt-6 lg:mt-8 flex flex-col gap-4">
                            <div className="flex flex-wrap gap-4">
                              <button 
                                onClick={() => setSelectedProjectId(project.id)}
                                className="text-[9px] lg:text-[10px] font-black text-ai-blue uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors"
                              >
                                Manage Project <ChevronRight className="w-3 h-3" />
                              </button>
                              
                              {project.status.toUpperCase() !== 'active' && (
                                <button 
                                  onClick={() => handleRegenerate(project.id)}
                                  disabled={regeneratingId === project.id}
                                  className="text-[8px] lg:text-[9px] font-black text-tech-purple uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors disabled:opacity-50"
                                >
                                  {regeneratingId === project.id ? (
                                    <><Loader2 className="w-3 h-3 animate-spin" /> Processing...</>
                                  ) : (
                                    <><Zap className="w-3 h-3" /> Regenerate Content</>
                                  )}
                                </button>
                              )}

                              {(project.planType === 'self_hosted' || project.planType === 'enterprise') && (
                                <button 
                                  onClick={() => handleExportCodebase(project.id)}
                                  disabled={exportingId === project.id}
                                  className="text-[8px] lg:text-[9px] font-black text-expert-green uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors disabled:opacity-50"
                                >
                                  {exportingId === project.id ? (
                                    <><Loader2 className="w-3 h-3 animate-spin" /> Bundling...</>
                                  ) : (
                                    <><Download className="w-3 h-3" /> Export Codebase</>
                                  )}
                                </button>
                              )}
                            </div>
                            
                            {project.status === 'active' && project.siteUrl && (
                              <button 
                                onClick={() => handleAnalyzeSite(project.id, project.siteUrl!)}
                                disabled={isAnalyzing}
                                className="w-full sm:w-auto px-4 py-2 bg-tech-purple/20 border border-tech-purple/30 text-tech-purple text-[8px] lg:text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-tech-purple hover:text-white transition-all disabled:opacity-50"
                              >
                                {isAnalyzing && analyzedProjectId === project.id ? 'Analyzing...' : 'AI Performance Analysis'}
                              </button>
                            )}
                          </div>

                          {analysisResult && analyzedProjectId === project.id && (
                            <div className="mt-6 p-4 bg-ai-blue/10 border border-ai-blue/20 rounded-2xl animate-fade-in">
                              <h4 className="text-[9px] lg:text-[10px] font-black uppercase mb-2 text-ai-blue">AI Performance Insights</h4>
                              <p className="text-[8px] lg:text-[9px] leading-relaxed text-white/80">{analysisResult.insights}</p>
                              <div className="grid grid-cols-2 gap-2 mt-3">
                                <div className="p-2 bg-white/5 rounded-lg">
                                  <p className="text-[6px] lg:text-[7px] text-medium-gray uppercase">FCP</p>
                                  <p className="text-[9px] lg:text-[10px] font-black">{analysisResult.metrics?.vitals?.fcp || 'N/A'}</p>
                                </div>
                                <div className="p-2 bg-white/5 rounded-lg">
                                  <p className="text-[6px] lg:text-[7px] text-medium-gray uppercase">Score</p>
                                  <p className="text-[9px] lg:text-[10px] font-black">{analysisResult.metrics?.score || 0}/100</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-8 lg:space-y-10">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <button onClick={() => setSelectedProjectId(null)} className="flex items-center gap-2 text-medium-gray hover:text-white uppercase text-[9px] lg:text-[10px] font-black">
                          <ChevronRight className="w-4 h-4 rotate-180" /> Back to Projects
                        </button>
                        
                        {projects.find(p => p.id === selectedProjectId) && (
                          <div className="flex flex-wrap gap-3">
                            {projects.find(p => p.id === selectedProjectId)?.reviewNotes && (
                              <div className="bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl flex items-center gap-3">
                                <span className="text-[8px] lg:text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                                  <Bell className="w-3 h-3 animate-bounce" /> Feedback Available
                                </span>
                              </div>
                            )}
                            
                            {!projects.find(p => p.id === selectedProjectId)?.reviewRequested && (
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
                                className="px-4 py-2 lg:px-6 lg:py-2 bg-ai-blue text-black font-black text-[9px] lg:text-[10px] uppercase tracking-widest rounded-lg hover:bg-white transition-all flex items-center gap-2"
                              >
                                <User className="w-4 h-4" /> Request Review
                              </button>
                            )}
                            
                            {projects.find(p => p.id === selectedProjectId)?.reviewRequested && (
                              <div className="px-4 py-2 lg:px-6 lg:py-2 bg-white/5 border border-white/10 text-medium-gray font-black text-[9px] lg:text-[10px] uppercase tracking-widest rounded-lg flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Reviewing...
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {projects.find(p => p.id === selectedProjectId)?.reviewNotes && (
                        <div className="p-6 lg:p-8 bg-orange-500/5 border border-orange-500/10 rounded-3xl animate-fade-in">
                          <div className="flex items-center gap-3 mb-4">
                            <Shield className="w-5 h-5 text-orange-500" />
                            <h3 className="text-xs lg:text-sm font-black uppercase tracking-widest text-orange-500">Review Notes</h3>
                          </div>
                          <p className="text-[10px] lg:text-[11px] text-white/80 leading-relaxed font-medium bg-black/20 p-4 lg:p-6 rounded-2xl border border-white/5 whitespace-pre-wrap italic">
                            &quot;{projects.find(p => p.id === selectedProjectId)?.reviewNotes}&quot;
                          </p>
                          <p className="mt-4 text-[7px] lg:text-[8px] text-medium-gray uppercase font-black tracking-widest">
                            Revisions: {projects.find(p => p.id === selectedProjectId)?.revisionCount || 0}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                        <div className="space-y-6 lg:space-y-8">
                          <div className="bg-white/[0.02] border border-white/5 p-6 lg:p-8 rounded-[32px] relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-6">
                              <div>
                                <span className="text-[7px] lg:text-[8px] font-black text-ai-blue uppercase tracking-[0.3em] block mb-2">Plan</span>
                                <h3 className="text-lg lg:text-xl font-black uppercase tracking-tight text-white">
                                  {projects.find(p => p.id === selectedProjectId)?.planType?.replaceAll('_', ' ')}
                                </h3>
                              </div>
                              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-ai-blue/10 border border-ai-blue/20 flex items-center justify-center">
                                <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-ai-blue" />
                              </div>
                            </div>
                            
                            <p className="text-[9px] lg:text-[10px] text-medium-gray font-medium uppercase leading-relaxed mb-8">
                              Your project is on the <span className="text-white">{projects.find(p => p.id === selectedProjectId)?.planType}</span> plan. 
                              Upgrade to unlock professional refinement and advanced scaling capabilities.
                            </p>
                            
                            {projects.find(p => p.id === selectedProjectId)?.planType === 'ai_foundation' && (
                              <button 
                                onClick={() => setActiveTab('addons')}
                                className="w-full py-4 bg-ai-blue/10 border border-ai-blue/20 text-ai-blue font-black text-[9px] lg:text-[10px] uppercase tracking-widest rounded-xl hover:bg-ai-blue hover:text-white transition-all"
                              >
                                Upgrade to Pro Development
                              </button>
                            )}
                          </div>

                          <div className="bg-white/[0.02] border border-white/5 p-6 lg:p-8 rounded-[32px] relative overflow-hidden group">
                            <h3 className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-expert-green mb-6 flex items-center gap-2">
                              <span className="w-1 h-1 bg-expert-green rounded-full animate-pulse"></span>
                              Launch Checklist
                            </h3>
                            
                            <div className="space-y-3 lg:space-y-4">
                              {[
                                { label: 'Design Completed', checked: (projects.find(p => p.id === selectedProjectId)?.progress || 0) >= 100 },
                                { label: 'Template Ready', checked: (projects.find(p => p.id === selectedProjectId)?.progress || 0) > 20 },
                                { label: 'Domain Connected', checked: !!projects.find(p => p.id === selectedProjectId)?.domain },
                                { label: 'Payment Enabled', checked: projects.find(p => p.id === selectedProjectId)?.planType !== 'ai_foundation' },
                                { label: 'Site Live', checked: projects.find(p => p.id === selectedProjectId)?.status === 'active' },
                              ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                  <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-medium-gray truncate pr-4">{item.label}</span>
                                  {item.checked ? (
                                    <CheckCircle className="w-4 h-4 text-expert-green flex-shrink-0" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0"></div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <MilestoneViewer subscriptionId={selectedProjectId} />
                        </div>
                        <TemplateViewer subscriptionId={selectedProjectId} />
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
                          <tr key={d.id} className="text-sm group hover:bg-white/[0.01] transition-colors">
                            <td className="p-6 font-black uppercase">{d.domain}</td>
                            <td className="p-6 text-xs uppercase text-medium-gray">{d.subscription?.siteName || d.subscription?.customName || 'NODE'}</td>
                            <td className="p-6 text-xs uppercase text-medium-gray">{d.setup}</td>
                            <td className="p-6">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                d.status?.toLowerCase() === 'verified' ? 'bg-expert-green/10 text-expert-green' : 'bg-orange-500/10 text-orange-500'
                              }`}>
                                {d.status || 'Pending'}
                              </span>
                            </td>
                            <td className="p-6 text-right">
                              {d.status?.toLowerCase() !== 'verified' && (
                                <button 
                                  onClick={() => handleVerifyDomain(d.id)}
                                  disabled={verifyingDomainId === d.id}
                                  className="px-4 py-2 bg-ai-blue/10 border border-ai-blue/20 text-ai-blue text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-ai-blue hover:text-white transition-all disabled:opacity-50"
                                >
                                  {verifyingDomainId === d.id ? 'VERIFYING...' : 'VERIFY_DNS'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                        {profileMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
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
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:border-ai-blue outline-none transition-all placeholder:text-white/10"
                            placeholder="John Doe"
                            value={profileData.name}
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-3 opacity-60">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Network Identifier (Read-only)</label>
                          <input 
                            type="email" 
                            disabled 
                            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white/20 cursor-not-allowed"
                            value={user?.email || ''}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Contact Channel (Phone)</label>
                          <input 
                            type="text" 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:border-ai-blue outline-none transition-all placeholder:text-white/10"
                            placeholder="+1 (555) 000-0000"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          />
                        </div>
                        <button 
                          type="submit" 
                          disabled={profileLoading}
                          className="w-full py-5 bg-ai-blue text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:scale-105 transition-all shadow-lg shadow-ai-blue/20 disabled:opacity-50 active:scale-95"
                        >
                          {profileLoading ? 'Update Profile' : 'Update Identity'}
                        </button>
                      </form>
                    </section>

                    <section className="bg-white/[0.01] border border-white/5 p-8 lg:p-10 rounded-[40px] space-y-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-tech-purple/10 border border-tech-purple/20 rounded-2xl flex items-center justify-center">
                          <Key className="w-6 h-6 text-tech-purple" />
                        </div>
                        <div>
                          <h3 className="text-base font-black uppercase tracking-tight">Password Settings</h3>
                          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Authentication Key Rotation</p>
                        </div>
                      </div>

                      <form onSubmit={handleChangePassword} className="space-y-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Current Password</label>
                          <input 
                            type="password" 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-tech-purple outline-none transition-all"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">New Password</label>
                          <input 
                            type="password" 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-tech-purple outline-none transition-all"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Verify New Key</label>
                          <input 
                            type="password" 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-tech-purple outline-none transition-all"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            required
                          />
                        </div>
                        <button 
                          type="submit" 
                          disabled={profileLoading}
                          className="w-full py-5 border border-tech-purple/30 text-tech-purple font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-tech-purple hover:text-white transition-all disabled:opacity-50 active:scale-95"
                        >
                          {profileLoading ? 'Processing...' : 'Authorize Rotation'}
                        </button>
                      </form>
                    </section>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      </div>

      {/* Domain Modal */}
      {isDomainModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsDomainModalOpen(false)}></div>
          <div className="bg-darker-bg border border-white/10 rounded-3xl p-10 w-full max-w-lg relative z-10 shadow-2xl">
            <h2 className="text-xl font-bold uppercase tracking-tight mb-8">Attach Custom Domain</h2>
            <form onSubmit={handleAddDomain} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-medium-gray uppercase">Domain Address</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-ai-blue"
                  value={newDomain.domain}
                  onChange={(e) => setNewDomain({...newDomain, domain: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-medium-gray uppercase">Target Project</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-ai-blue"
                  value={newDomain.siteId}
                  onChange={(e) => setNewDomain({...newDomain, siteId: e.target.value})}
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-ai-blue text-white font-black uppercase rounded-xl">Authorize Link</button>
            </form>
          </div>
        </div>
      )}

      {/* Managed Domain Modal */}
      {isManagedDomainModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsManagedDomainModalOpen(false)}></div>
          <div className="bg-darker-bg border border-white/10 rounded-3xl p-10 w-full max-w-lg relative z-10 shadow-2xl">
            <h2 className="text-xl font-bold uppercase tracking-tight mb-4">Request Managed Domain</h2>
            <p className="text-[10px] text-white/40 uppercase mb-8">Our team will handle registration, DNS, and SSL for you.</p>
            <form onSubmit={handleRequestManagedDomain} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-medium-gray uppercase">Desired Domain</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-tech-purple"
                  placeholder="mybrand.com"
                  value={managedDomain.domainInterest}
                  onChange={(e) => setManagedDomain({ domainInterest: e.target.value })}
                  required
                />
              </div>
              <button type="submit" disabled={isSubmittingDomain} className="w-full py-4 bg-tech-purple text-white font-black uppercase rounded-xl disabled:opacity-50">
                {isSubmittingDomain ? 'Transmitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
