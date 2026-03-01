'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BlogEditor from './BlogEditor';
import AssessmentModal from './AssessmentModal';
import { apiClient } from '@/lib/api';
import { Layout, ShoppingBag, Eye, Plus, Trash2, FileText, Clock, Menu } from 'lucide-react';
import SupportManager from './dashboard/SupportManager';
import LiveSupportManager from './dashboard/LiveSupportManager';
import MilestoneManager from './dashboard/MilestoneManager';
import TemplateEditor from './dashboard/TemplateEditor';
import CommentManager from './dashboard/CommentManager';
import AdminSystemHealth from './dashboard/AdminSystemHealth';
import PerformanceAudit from './dashboard/PerformanceAudit';
import BookingManager from './dashboard/BookingManager';

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

interface Assessment {
  id: string;
  name?: string;
  email?: string;
  createdAt: string;
  responses: Record<string, unknown>;
}

export default function AdminDashboard({ onLogout, initialTab }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState(initialTab || 'dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [selectedSubscriptionForEditor, setSelectedSubscriptionForEditor] = useState<string | null>(null);
  const [selectedSiteForVitals, setSelectedSiteForVitals] = useState<string | null>(null);
  const [siteVitals, setSiteVitals] = useState<Record<string, unknown> | null>(null);
  const [loadingVitals, setLoadingVitals] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [enforcementSettings, setEnforcementSettings] = useState<EnforcementSettings | null>(null);
  const [isSystemWorking, setIsSystemWorking] = useState(false);
  const router = useRouter();
  const userGrowthTrend = analytics?.predictions?.growthRate?.users;
  const revenueGrowthTrend = analytics?.predictions?.growthRate?.revenue;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const res = await apiClient.getAdminStats() as { success: boolean; data: DashboardStats };
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
        const res = await apiClient.getAdminAnalytics() as { success: boolean; analytics: AnalyticsData };
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
      await apiClient.updateEnforcementSettings(enforcementSettings as any);
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

  const handleLogout = () => {
    onLogout();
    router.push('/');
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: <Layout className="w-4 h-4" /> },
    { id: 'leads', name: 'Leads', icon: <FileText className="w-4 h-4" /> },
    { id: 'users', name: 'Users', icon: <Layout className="w-4 h-4" /> },
    { id: 'subscriptions', name: 'Subscriptions', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'assessments', name: 'Assessments', icon: <FileText className="w-4 h-4" /> },
    { id: 'review', name: 'Human Review', icon: <Eye className="w-4 h-4" /> },
    { id: 'media', name: 'Media Library', icon: <Layout className="w-4 h-4" /> },
    { id: 'blog', name: 'Blog', icon: <FileText className="w-4 h-4" /> },
    { id: 'analytics', name: 'Analytics', icon: <Layout className="w-4 h-4" /> },
    { id: 'bookings', name: 'Bookings', icon: <Clock className="w-4 h-4" /> },
    { id: 'tickets', name: 'Tickets', icon: <FileText className="w-4 h-4" /> },
    { id: 'live-support', name: 'Live Chat', icon: <Layout className="w-4 h-4" /> },
    { id: 'milestones', name: 'Milestones', icon: <Layout className="w-4 h-4" /> },
    { id: 'comments', name: 'Comments', icon: <FileText className="w-4 h-4" /> },
    { id: 'health', name: 'Vitals', icon: <Layout className="w-4 h-4" /> },
    { id: 'system', name: 'System', icon: <Layout className="w-4 h-4" /> },
  ];

  return (
    <div className="flex h-screen bg-darker-bg text-white selection:bg-ai-blue/30 overflow-hidden font-sans relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Infrastructure Grid Background */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-black/80 lg:bg-white/[0.01] border-r border-white/5 backdrop-blur-3xl flex flex-col z-[110] lg:z-20 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-ai-blue to-tech-purple rounded-lg flex items-center justify-center font-black text-xs shadow-lg animate-pulse">
              SYS
            </div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent tracking-tight uppercase">
              Admin <span className="italic text-ai-blue">Terminal</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-ai-blue font-black uppercase tracking-[0.3em]">ADMIN_AUTH: VERIFIED</span>
            <span className="w-1 h-1 rounded-full bg-expert-green animate-ping"></span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar">
          <ul className="space-y-1">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsSidebarOpen(false);
                    router.push(`/admin/${tab.id}`);
                  }}
                  className={`w-full text-left px-6 py-3.5 rounded-xl transition-all duration-300 flex items-center gap-4 group relative overflow-hidden ${
                    activeTab === tab.id
                      ? 'bg-ai-blue/10 text-white border border-ai-blue/20'
                      : 'text-medium-gray hover:text-white hover:bg-white/5'
                  }`}
                >
                  {activeTab === tab.id && (
                    <div className="absolute left-0 top-0 w-[2px] h-full bg-ai-blue"></div>
                  )}
                  <span className={`transition-transform duration-300 group-hover:scale-110 ${activeTab === tab.id ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                    {tab.icon}
                  </span>
                  <span className="font-semibold text-[13px] tracking-tight uppercase">{tab.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 font-semibold text-xs rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300"
          >
            <span>???</span>
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="px-6 lg:px-10 py-4 lg:py-6 flex justify-between items-center border-b border-white/5 bg-white/[0.01] backdrop-blur-sm">
          <div className="flex items-center gap-4 lg:gap-8">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-white/5 rounded-lg border border-white/10"
            >
              <Menu className="w-5 h-5 text-ai-blue" />
            </button>

            <h1 className="text-lg lg:text-xl font-bold text-white tracking-tight uppercase">
              {tabs.find(t => t.id === activeTab)?.name}
            </h1>
          </div>
          
          <div className="hidden sm:flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[7px] text-medium-gray font-black uppercase tracking-widest">Global Node Status</span>
              <span className="text-[10px] text-expert-green font-black uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-expert-green animate-pulse"></span>
                CORE OPERATIONAL
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar relative">
          {/* System Path Indicator */}
          <div className="mb-8 flex items-center gap-2 opacity-30 text-[8px] font-black uppercase tracking-[0.4em]">
            <span className="text-ai-blue">SYSTEM_ROOT</span>
            <span>/</span>
            <span>ADMIN_TERMINAL</span>
            <span>/</span>
            <span className="text-white">{activeTab}</span>
          </div>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-96 gap-6">
                <div className="w-16 h-16 border-2 border-white/5 border-t-ai-blue rounded-lg animate-spin"></div>
                <div className="flex flex-col items-center">
                  <p className="text-[10px] font-black text-ai-blue uppercase tracking-[0.4em] animate-pulse">SYNCHRONIZING DATA STRUCTURES</p>
                  <span className="text-[8px] text-medium-gray mt-2 font-mono">LOADING_BUFFERS...</span>
                </div>
              </div>
            ) : stats ? (
              <div className="space-y-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Total Users', value: stats.totalUsers, color: 'from-ai-blue/20 to-ai-blue/5', icon: '????', unit: 'USR' },
                    { label: 'Total Leads', value: stats.totalLeads, color: 'from-expert-green/20 to-expert-green/5', icon: '????', unit: 'LEAD' },
                    { label: 'Assessments', value: stats.totalAssessments, color: 'from-tech-purple/20 to-tech-purple/5', icon: '????', unit: 'LOG' },
                    { label: 'Conversion', value: stats.conversionRate, color: 'from-orange-500/20 to-orange-500/5', icon: '????', unit: '%' },
                    { label: 'Total Revenue', value: stats.revenue?.total ? `$${stats.revenue.total.toLocaleString()}` : '$0', color: 'from-green-500/20 to-green-500/5', icon: '????', unit: 'USD' },
                    { label: 'Sites', value: stats.subscriptions?.active || 0, color: 'from-ai-blue/20 to-ai-blue/5', icon: '????', unit: 'NODE' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/5 p-4 lg:p-8 rounded-3xl hover:bg-white/[0.04] transition-all duration-300 group relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-500">
                        <span className="text-xl lg:text-2xl font-bold">{stat.icon}</span>
                      </div>
                      <div className="flex flex-col relative z-10">
                        <span className="text-[7px] lg:text-[8px] font-bold text-medium-gray uppercase tracking-[0.3em] mb-1">{stat.label}</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg lg:text-xl font-bold tracking-tight">{stat.value}</span>
                          <span className="text-[8px] lg:text-[10px] font-black text-ai-blue/50">{stat.unit}</span>
                        </div>
                      </div>
                      <div className="mt-4 lg:mt-6 h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    </div>
                  ))}
                </div>

                {/* Growth Visualization (Miniature) */}
                {(stats.userGrowth?.length > 0 || stats.leadGrowth?.length > 0) && (
                  <div className="bg-white/[0.01] border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex flex-col">
                        <h3 className="font-black text-xs tracking-widest uppercase text-ai-blue">Growth Analysis</h3>
                        <span className="text-[7px] text-medium-gray uppercase tracking-widest mt-1">30-Day Growth</span>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-ai-blue"></div>
                          <span className="text-[7px] font-black uppercase text-medium-gray tracking-widest">Users</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-expert-green"></div>
                          <span className="text-[7px] font-black uppercase text-medium-gray tracking-widest">Leads</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-32 w-full flex items-end gap-1 px-2">
                      {/* Simple CSS-based bar chart for growth */}
                      {(stats.userGrowth || []).slice(-30).map((day, i) => {
                        const leadDay = stats.leadGrowth?.[i] || { count: 0 };
                        const maxCount = Math.max(
                          ...stats.userGrowth.map(d => d.count),
                          ...stats.leadGrowth.map(d => d.count),
                          1
                        );
                        return (
                          <div key={i} className="flex-1 flex flex-col justify-end items-center gap-[2px] h-full group/bar">
                            <div 
                              className="w-full bg-expert-green/40 group-hover/bar:bg-expert-green transition-colors rounded-t-[1px]" 
                              style={{ height: `${(leadDay.count / maxCount) * 100}%` }}
                            ></div>
                            <div 
                              className="w-full bg-ai-blue/40 group-hover/bar:bg-ai-blue transition-colors rounded-t-[1px]" 
                              style={{ height: `${(day.count / maxCount) * 100}%` }}
                            ></div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-4 text-[6px] font-black text-medium-gray uppercase tracking-widest">
                      <span>T-30D</span>
                      <span>CURRENT_STATE</span>
                    </div>
                  </div>
                )}

                {/* Recent Activity Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recent Leads */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <h2 className="text-xl font-bold tracking-tighter uppercase flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-ai-blue rounded-full"></span>
                        Lead Ingestion
                      </h2>
                      <span className="text-[8px] font-black text-medium-gray uppercase tracking-[0.2em]">LIVE_STREAM_01</span>
                    </div>
                    
                    <div className="bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden relative">
                      <div className="absolute inset-0 opacity-[0.02] pointer-events-none text-[6px] p-4 break-all leading-none">
                        {Array(5).fill('DATA-INGRESS-AUTH-SUCCESS-BUFFER-SYNC-').join('')}
                      </div>
                      {stats?.recentLeads?.length ? (
                        <div className="divide-y divide-white/5 relative z-10">
                          {stats.recentLeads.slice(0, 5).map((lead, index) => (
                            <div key={lead.id || index} className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors group">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center font-black text-[9px] uppercase group-hover:bg-ai-blue/20 group-hover:text-ai-blue transition-colors border border-white/5">
                                  {lead.name.split(' ').map((n) => n[0]).join('')}
                                </div>
                                <div>
                                  <p className="text-[11px] font-black tracking-tight uppercase">{lead.name}</p>
                                  <p className="text-[9px] text-medium-gray font-medium tracking-tighter uppercase">{lead.email}</p>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 text-[7px] font-black uppercase tracking-widest rounded border ${
                                lead.status === 'new' ? 'bg-expert-green/10 border-expert-green/20 text-expert-green' :
                                lead.status === 'contacted' ? 'bg-ai-blue/10 border-ai-blue/20 text-ai-blue' :
                                'bg-white/5 border-white/10 text-medium-gray'
                              }`}>
                                {lead.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-12 text-center relative z-10">
                          <p className="text-[9px] font-black text-medium-gray uppercase tracking-[0.3em]">ZERO_DATA_INGRESS</p>
                        </div>
                      )}
      <button 
        onClick={() => setActiveTab('leads')}
        className="w-full py-4 bg-white/[0.02] text-[9px] font-black uppercase tracking-[0.3em] text-medium-gray hover:text-ai-blue hover:bg-white/[0.04] transition-all border-t border-white/5 relative z-10 flex items-center justify-center gap-2"
      >
        <span className="w-1 h-1 bg-medium-gray rounded-full"></span>
        Access Lead Matrix
      </button>
                    </div>
                  </div>

                  {/* Recent Assessments */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <h2 className="text-xl font-bold tracking-tighter uppercase flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-tech-purple rounded-full"></span>
                        Assessment Stream
                      </h2>
                      <span className="text-[8px] font-black text-medium-gray uppercase tracking-[0.2em]">AUDIT_LOGS</span>
                    </div>
                    
                    <div className="bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden relative">
                      <div className="absolute inset-0 opacity-[0.02] pointer-events-none text-[6px] p-4 break-all leading-none">
                        {Array(5).fill('AUDIT-COMPLETE-SYNC-VERIFIED-NODE-ACCESS-').join('')}
                      </div>
                      {stats?.recentAssessments?.length ? (
                        <div className="divide-y divide-white/5 relative z-10">
                          {stats.recentAssessments.slice(0, 5).map((assessment, index) => (
                            <div key={assessment.id || index} className="p-5 hover:bg-white/[0.02] transition-colors flex items-center justify-between group">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all border border-white/5">
                                  ????
                                </div>
                                <div>
                                  <p className="text-[11px] font-black tracking-tight uppercase">Technical Audit</p>
                                  <p className="text-[8px] text-ai-blue font-black font-mono">
                                    NODE_{(assessment.id || '').slice(-6).toUpperCase()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] font-black text-white font-mono">{new Date(assessment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</p>
                                <p className="text-[7px] font-black text-expert-green uppercase tracking-widest">VALIDATED</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-12 text-center relative z-10">
                          <p className="text-[9px] font-black text-medium-gray uppercase tracking-[0.3em]">IDLE_STREAM</p>
                        </div>
                      )}
                      <button 
                        onClick={() => setActiveTab('assessments')}
                        className="w-full py-4 bg-white/[0.02] text-[9px] font-black uppercase tracking-[0.3em] text-medium-gray hover:text-ai-blue hover:bg-white/[0.04] transition-all border-t border-white/5 relative z-10 flex items-center justify-center gap-2"
                      >
                        <span className="w-1 h-1 bg-medium-gray rounded-full"></span>
                        Audit System Logs
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center h-96 gap-4">
                <div className="text-2xl">??????</div>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em]">No Data Available</p>
                <span className="text-[8px] text-medium-gray font-mono">CODE: ERR_SYNC_0x11</span>
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
                          {lead.sourceDetails?.subject && (
                            <span className="text-[7px] text-medium-gray uppercase tracking-tighter opacity-50 block mt-0.5">{lead.sourceDetails.subject}</span>
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
                          <span className="text-[8px] font-black text-ai-blue uppercase tracking-[0.3em]">NODE_{(sub.id || '').slice(0, 8)}</span>
                          <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${
                            sub.status === 'ACTIVE' ? 'bg-expert-green/20 text-expert-green' : 'bg-red-500/20 text-red-500'
                          }`}>{sub.status}</span>
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight mb-2">{sub.customName || sub.siteName}</h3>
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
                            NODE_{(assessment.id || '').slice(-8).toUpperCase()}
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
                      fcp: siteVitals.coreWebVitals?.lcp, // Using LCP for FCP in simple view
                      tti: '1.2s',
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
                      {submitting ? 'SYNCHRONIZING...' : 'UPDATE CONFIGURATION'}
                    </button>
                  </form>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-[9px] font-black text-medium-gray uppercase tracking-[0.3em]">LOADING_SETTINGS...</p>
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

