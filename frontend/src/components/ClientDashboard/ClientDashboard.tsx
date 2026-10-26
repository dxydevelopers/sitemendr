// components/client-dashboard/ClientDashboard.tsx
//
// Shell only: sidebar navigation, header, and tab switching.
// All data/logic lives in useClientDashboard(). All heavy screens
// live in their own files (ClientOverview, ClientBuildJourney, etc.)
// or are the existing shared components from components/dashboard/.

'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  BarChart3, Rocket, MessageSquare, CreditCard, BookOpen, LifeBuoy, Terminal,
  Zap, Globe, ArrowLeft, FileText, ShoppingBag, LogOut, User,
  Bell, Settings, Plus, Clock, Menu, X, PanelLeftClose, PanelLeftOpen, Wrench,
} from 'lucide-react';
import { useClientDashboard } from './useClientDashboard';
import { apiClient } from '@/lib/api';
import { normalizeBuildStatus, normalizeDashboardTab } from './utils';
import type { AnalysisResult, ClientProject, DashboardNavItem } from './ClientDashboard_types';
import ClientOverview from './ClientOverview';
import MySites from './MySites';
import SiteRoom, { type RoomView } from './SiteRoom';
import ClientBuildJourney from './ClientBuildJourney';
import ClientMerchant from './ClientMerchant';
import ClientBilling from './ClientBilling';
import ClientSettings from './ClientSettings';
import ClientDomains from './ClientDomains';
import RepairWorkspace from './RepairWorkspace';
import { DrillList } from '@/components/ui/DrillShell';

const SupportTickets = dynamic(() => import('../dashboard/SupportTickets'), { ssr: false });
const MessageViewer = dynamic(() => import('../dashboard/MessageViewer'), { ssr: false });
const ResourceLibrary = dynamic(() => import('../dashboard/ResourceLibrary'), { ssr: false });
const AddonMarketplace = dynamic(() => import('../dashboard/AddonMarketplace'), { ssr: false });
const PageEditor = dynamic(() => import('../dashboard/PageEditor'), { ssr: false });
const PerformanceAudit = dynamic(() => import('../dashboard/PerformanceAudit'), { ssr: false });
const EcommerceManager = dynamic(() => import('../dashboard/EcommerceManager'), { ssr: false });
const BookingManager = dynamic(() => import('../dashboard/BookingManager'), { ssr: false });
const AssessmentQuestionnaire = dynamic(() => import('../AssessmentQuestionnaire'), { ssr: false });
const AssessmentModal = dynamic(() => import('../AssessmentModal'), { ssr: false });

interface ClientDashboardProps {
  onLogout?: () => void;
  initialTab?: string;
}

function ProjectContextPrompt({ projects, onSelect }: {
  projects: ClientProject[];
  onSelect: (projectId: string) => void;
}) {
  if (!projects.length) {
    return (
      <section className="grid min-h-64 place-items-center border border-white/[0.08] bg-white/[0.02] p-6 text-center">
        <div className="max-w-md space-y-2">
          <h2 className="text-base font-semibold text-white">A project is needed for this tool</h2>
          <p className="text-sm leading-6 text-white/48">Start a project from the Projects area, then select it here to continue.</p>
        </div>
      </section>
    );
  }
  return (
    <section className="grid min-h-64 place-items-center border border-white/[0.08] bg-white/[0.02] p-6 text-center">
      <div className="w-full max-w-md space-y-4">
        <h2 className="text-base font-semibold text-white">Choose a project to continue</h2>
        <p className="text-sm leading-6 text-white/48">This tool works with one project at a time. Select the site you want to manage.</p>
        <div className="grid gap-2">
          {projects.map(project => (
            <button key={project.id} type="button" onClick={() => onSelect(project.id)} className="flex min-h-12 items-center justify-between gap-3 border border-white/[0.08] px-4 text-left text-sm font-medium text-white/78 transition hover:border-ai-blue/40 hover:bg-ai-blue/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-blue">
              <span className="min-w-0 truncate">{project.name}</span><span className="shrink-0 text-xs text-white/36">{project.progress}%</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ClientDashboard({ onLogout, initialTab }: ClientDashboardProps) {
  const [savedPerformance, setSavedPerformance] = useState<{ projectId: string; result: AnalysisResult } | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dashboard = useClientDashboard(initialTab);
  const {
  activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, isSidebarExpanded, setIsSidebarExpanded,
  openSidebarGroup, setOpenSidebarGroup, mobileRailGroup, setMobileRailGroup,
  stats, projects, activities, billing, billingInvoices, billingReceipts, billingRefunds, billingUnavailable, messages, tickets, resources, bookings, domains,
  loading, user, fetchError, fetchData, selectedProjectId, setSelectedProjectId,
  setActiveBuildChapter, isAnalyzing, analysisResult, analysisProjectId, analysisError, handleAnalyzeSite, exportingId,
  handleExportCodebase, showAssessmentModal, setShowAssessmentModal, selectedAssessment,
  showProjectRequestModal, setShowProjectRequestModal,
  profileData, setProfileData, profileMessage, handleUpdateProfile,
  passwordData, setPasswordData, passwordMessage, handleChangePassword,
  handleLogoutAction,
  } = dashboard;

  useEffect(() => {
  if (!isSidebarOpen) return;
  const previousOverflow = document.body.style.overflow;
  const closeOnEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') setIsSidebarOpen(false);
  };
  document.body.style.overflow = 'hidden';
  window.addEventListener('keydown', closeOnEscape);
  return () => {
  document.body.style.overflow = previousOverflow;
  window.removeEventListener('keydown', closeOnEscape);
  };
  }, [isSidebarOpen, setIsSidebarOpen]);

  // Keep the selected destination in the URL so refresh, deep links, and
  // browser history all open the same workspace screen. This hook must run
  // during loading renders too, before the loading-state return below.
  useEffect(() => {
  const routeTab = pathname.split('/').filter(Boolean)[1];
  const queryTab = searchParams.get('tab');
  const urlTab = normalizeDashboardTab(routeTab || queryTab);
  if (urlTab !== activeTab) setActiveTab(urlTab);
  }, [pathname, searchParams, activeTab, setActiveTab]);

  const openTickets = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length;
  const unreadMessages = messages.filter(m => !m.isRead).length;
  const overviewProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : projects.find(p => p.isCurrent) || projects[0];
  const liveSites = projects.filter(p => p.recordType === 'project' && ['launched', 'handoff', 'completed'].includes(normalizeBuildStatus(p.status)));

  const mainNav: DashboardNavItem[] = [
  { id: 'dashboard', label: 'Home', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'projects-hub', label: 'Projects', icon: <FileText className="w-5 h-5" />, count: projects.length },
  { id: 'mysites', label: 'My Sites', icon: <Globe className="w-5 h-5" />, count: liveSites.length },
  ];
  const manageNav: DashboardNavItem[] = [
  { id: 'business', label: 'Merchant', icon: <ShoppingBag className="w-5 h-5" /> },
  { id: 'support', label: 'Support', icon: <LifeBuoy className="w-5 h-5" />, count: openTickets + unreadMessages },
  { id: 'repair', label: 'Repair', icon: <Wrench className="w-5 h-5" /> },
  ];
  const accountNav: DashboardNavItem[] = [
  { id: 'settings-hub', label: 'Settings', icon: <Settings className="w-5 h-5" />, count: billing.length },
  ];
  const allNavItems = [...mainNav, ...manageNav, ...accountNav,
  { id: 'editor', label: 'Editor', icon: <Zap className="w-5 h-5" /> },
  { id: 'audit', label: 'Performance', icon: <Zap className="w-5 h-5" /> },
  { id: 'domains', label: 'Domains', icon: <Globe className="w-5 h-5" /> },
  { id: 'ecommerce', label: 'Commerce', icon: <ShoppingBag className="w-5 h-5" /> },
  { id: 'booking', label: 'Bookings', icon: <Clock className="w-5 h-5" /> },
  { id: 'addons', label: 'Add-ons', icon: <Plus className="w-5 h-5" /> },
  { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-5 h-5" /> },
  { id: 'tickets', label: 'Tickets', icon: <LifeBuoy className="w-5 h-5" /> },
  { id: 'resources', label: 'Resources', icon: <BookOpen className="w-5 h-5" /> },
  { id: 'billing', label: 'Billing', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'settings', label: 'My account', icon: <User className="w-5 h-5" /> },
  ];
  const currentTab = allNavItems.find(item => item.id === activeTab);
  const billingView = activeTab === 'billing' ? searchParams.get('view') : null;
  const billingRecordId = activeTab === 'billing' ? searchParams.get('id') : null;
  const goBackFromBillingDetail = () => {
  const params = new URLSearchParams(searchParams.toString());
  params.delete('view');
  params.delete('id');
  router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const mySiteId = activeTab === 'mysites' ? searchParams.get('site') : null;
  const currentSite = mySiteId ? projects.find(project => project.id === mySiteId) : undefined;
  const mySiteView = ((activeTab === 'mysites' ? searchParams.get('view') : null) as RoomView | null) || 'overview';
  const openSite = (siteId: string) => {
  const params = new URLSearchParams(searchParams.toString());
  params.set('site', siteId);
  params.set('view', 'overview');
  router.push(`${pathname}?${params.toString()}`);
  };
  const changeSiteView = (view: RoomView) => {
  const params = new URLSearchParams(searchParams.toString());
  params.set('view', view);
  router.push(`${pathname}?${params.toString()}`);
  };
  const closeSite = () => {
  const params = new URLSearchParams(searchParams.toString());
  params.delete('site');
  params.delete('view');
  router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const navGroups: Record<string, string[]> = {
  'projects-hub': ['projects-hub', 'projects', 'domains', 'editor', 'audit'],
  business: ['business', 'ecommerce', 'booking', 'addons'],
  support: ['support', 'messages', 'tickets', 'resources'],
  'settings-hub': ['settings-hub', 'billing', 'settings'],
  };
  const isNavActive = (id: string) => (navGroups[id] || [id]).includes(activeTab);
  // Every list-landing tab a child can be reached from. A tab that is NOT a
  // key here is a top-level destination (a sidebar icon's own screen) and
  // gets no back button at all — only tabs one level below a list do.
  const drillParent: Record<string, string> = {
  projects: 'projects-hub', audit: 'projects-hub', editor: 'projects-hub', domains: 'projects-hub',
  ecommerce: 'business', booking: 'business', addons: 'business',
  messages: 'support', tickets: 'support', resources: 'support',
  billing: 'settings-hub', settings: 'settings-hub',
  };
  const openTab = (tabId: string) => {
  setActiveTab(tabId);
  setOpenSidebarGroup(null);
  setMobileRailGroup(null);
  setIsSidebarOpen(false);
  const params = new URLSearchParams(searchParams.toString());
  params.delete('view');
  params.delete('id');
  params.delete('site');
  if (tabId === 'dashboard') params.delete('tab');
  else params.set('tab', tabId);
  router.push(`/dashboard${params.toString() ? `?${params.toString()}` : ''}`);
  };
  const openBuildJourneyFromBilling = (projectRequestId: string) => {
  setSelectedProjectId(projectRequestId);
  setActiveBuildChapter(null);
  openTab('projects');
  };

  const projectScopedTabs = ['editor', 'audit', 'ecommerce', 'booking', 'addons'];
  const projectContexts = projects.filter(project => project.recordType === 'project');
  const selectedProject = selectedProjectId ? projects.find(project => project.id === selectedProjectId) : undefined;
  const scopedSubscriptionId = selectedProject?.recordType === 'project'
  ? selectedProject.id
  : selectedProject?.subscriptionId;
  const scopedProject = scopedSubscriptionId
  ? projectContexts.find(project => project.id === scopedSubscriptionId)
  : undefined;
  const needsProjectContext = projectScopedTabs.includes(activeTab);

  useEffect(() => {
    if (activeTab !== 'audit' || !scopedProject || analysisProjectId === scopedProject.id && analysisResult) return;
    let active = true;
    apiClient.getSiteVitals(scopedProject.id).then(response => {
      if (!active || !response.success) return;
      const metrics = response.vitals && typeof response.vitals === 'object'
        ? response.vitals as AnalysisResult['metrics']
        : undefined;
      if (typeof metrics?.score !== 'number' && !response.availability?.status) return;
      setSavedPerformance({
        projectId: scopedProject.id,
        result: {
          metrics,
          strategy: response.strategy || 'mobile',
          aiInsights: response.aiInsights,
          availability: response.availability,
          timestamp: typeof response.timestamp === 'string' ? response.timestamp : undefined,
          insights: ''
        }
      });
    }).catch(() => {
      if (active) setSavedPerformance(current => current?.projectId === scopedProject.id ? null : current);
    });
    return () => { active = false; };
  }, [activeTab, scopedProject?.id, analysisProjectId, analysisResult]);

  if (loading && !stats) {
  return (
  <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-4">
  <div className="flex flex-col items-center gap-8">
  <div className="relative">
  <div className="w-24 h-24 border-4 border-ai-blue/10 rounded-full animate-spin border-t-ai-blue shadow-[0_0_30px_rgba(0,102,255,0.2)]"></div>
  <div className="absolute inset-0 flex items-center justify-center"><Terminal className="w-8 h-8 text-ai-blue animate-pulse" /></div>
  </div>
  <div className="flex flex-col items-center gap-2">
  <h2 className="text-xl font-semibold text-white">Loading</h2>
  <p className="text-[10px] font-mono text-medium-gray animate-pulse">Preparing your Sitemendr workspace...</p>
  </div>
  </div>
  </div>
  );
  }

  const renderNavSection = (label: string, items: DashboardNavItem[]) => (
  <div className="space-y-1">
  {label && <span className={`block px-3 pb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/30 transition-all duration-200 ${isSidebarExpanded ? 'md:opacity-100' : 'md:h-0 md:overflow-hidden md:opacity-0'}`}>{label}</span>}
  <div className="space-y-1">
  {items.map(item => (
  <button key={item.id} type="button" onClick={() => openTab(item.id)} title={!isSidebarExpanded ? item.label : undefined} aria-current={isNavActive(item.id) ? 'page' : undefined}
  className={`group/nav relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${isSidebarExpanded ? 'md:flex-row md:justify-start' : 'md:flex-col md:justify-center md:gap-1 md:py-2'} ${isNavActive(item.id) ? 'bg-ai-blue/12 text-white before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-ai-blue' : 'text-white/52 hover:text-white hover:bg-white/[0.05]'}`}>
  <span className={`grid h-8 w-8 shrink-0 place-items-center transition-all ${isNavActive(item.id) ? 'text-ai-blue' : 'text-white/42 group-hover/nav:text-white/80'}`}>{item.icon}</span>
  <span className={`min-w-0 flex-1 truncate text-[13px] font-semibold transition-all duration-200 md:flex-none md:text-center ${isSidebarExpanded ? 'md:w-auto md:flex-1 md:text-left md:opacity-100' : 'md:text-[10px] md:opacity-100'}`}>{item.label}</span>
  {Boolean(item.count) && <span className={`min-w-5 rounded-full bg-ai-blue px-1.5 py-0.5 text-center text-[9px] font-semibold text-white transition-all duration-200 ${isSidebarExpanded ? 'md:static md:bg-white/10 md:text-white/78' : 'md:absolute md:right-1.5 md:top-1.5'}`}>{item.count}</span>}
  </button>
  ))}
  </div>
  </div>
  );

  return (
  <div className="min-h-screen bg-[#0A0C10] text-white font-sans selection:bg-ai-blue/30 overflow-x-hidden">
  <div className="fixed inset-0 pointer-events-none z-0">
  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff07_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:80px_80px] opacity-30"></div>
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_64%_4%,rgba(0,102,255,0.16),transparent_34%),radial-gradient(circle_at_88%_78%,rgba(245,158,11,0.10),transparent_30%),radial-gradient(circle_at_18%_84%,rgba(16,185,129,0.08),transparent_30%)]"></div>
  </div>

  <div className="flex relative z-10 min-h-screen">
  {/* Sidebar */}
  {isSidebarOpen && <button type="button" aria-label="Close navigation" onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" />}
  <aside aria-label="Dashboard navigation" className={`fixed inset-y-0 left-0 z-50 w-[min(18rem,88vw)] bg-[#0A0C10]/95 backdrop-blur-2xl border-r border-white/[0.10] transition-[width,transform] duration-300 transform overflow-x-hidden overflow-y-auto md:translate-x-0 ${isSidebarExpanded ? 'md:w-64' : 'md:w-20'} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
  <div className="h-full flex flex-col px-3 py-4 pb-8">
  <div className="mb-6 flex items-center justify-between px-2 md:hidden">
  <button type="button" onClick={() => openTab('dashboard')} className="flex items-center gap-3 text-left">
  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-[#0A0C10]"><Terminal className="h-4 w-4" /></span>
  <span><span className="block text-sm font-semibold text-white">Sitemendr</span><span className="block text-[10px] font-semibold text-white/42">Client workspace</span></span>
  </button>
  <button type="button" onClick={() => setIsSidebarOpen(false)} aria-label="Close navigation" className="grid h-10 w-10 place-items-center rounded-lg text-white/60 transition hover:bg-white/[0.06] hover:text-white"><X className="h-5 w-5" /></button>
  </div>
  <div className={`mb-6 flex items-center gap-3 px-1 transition-all duration-200 ${isSidebarExpanded ? 'justify-between' : 'justify-center'}`}>
  <button type="button" onClick={() => openTab('dashboard')} className={`group hidden min-w-0 items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-white/[0.05] md:flex ${isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 overflow-hidden opacity-0'}`}>
  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-[#0A0C10]"><Terminal className="h-4 w-4" /></span>
  <span className="min-w-0"><span className="block truncate text-sm font-semibold text-white">Sitemendr</span><span className="block truncate text-[10px] font-semibold text-white/42">Client workspace</span></span>
  </button>
  <button type="button" onClick={() => setIsSidebarExpanded(v => !v)} className="hidden md:grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white/52 transition hover:bg-white/[0.06] hover:text-white" aria-label={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'} aria-expanded={isSidebarExpanded}>
  {isSidebarExpanded ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
  </button>
  </div>
  <nav aria-label="Workspace" className="flex-1 space-y-7">
  {renderNavSection('', mainNav)}
  {renderNavSection('', manageNav)}
  {renderNavSection('', accountNav)}
  </nav>
  <div className="pt-5 mt-auto space-y-2 border-t border-white/[0.07]">
  <button onClick={() => handleLogoutAction(onLogout)} title={!isSidebarExpanded ? 'Sign out' : undefined} className={`w-full flex min-h-11 items-center gap-3 px-3 py-2.5 text-white/44 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-semibold ${isSidebarExpanded ? 'md:justify-start' : 'md:justify-center'}`}>
  <LogOut className="w-4 h-4 shrink-0" />
  <span className={`transition-all duration-200 ${isSidebarExpanded ? 'md:w-auto md:opacity-100' : 'md:w-0 md:overflow-hidden md:opacity-0'}`}>Sign Out</span>
  </button>
  </div>
  </div>
  </aside>

  {/* Main */}
  <main className={`flex-1 min-h-screen transition-[margin,padding] duration-300 md:pl-0 ${isSidebarExpanded ? 'md:ml-64' : 'md:ml-20'}`}>
  <header className="sticky top-0 z-40 flex min-h-20 flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] bg-[#0A0C10]/85 px-4 py-2 backdrop-blur-xl sm:flex-nowrap sm:gap-5 sm:px-8 sm:py-0 lg:px-10">
  <div className="flex min-w-0 items-center gap-3">
  <button type="button" onClick={() => setIsSidebarOpen(true)} aria-label="Open navigation" aria-expanded={isSidebarOpen} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white/65 transition hover:bg-white/[0.06] hover:text-white md:hidden"><Menu className="h-5 w-5" /></button>
  {activeTab === 'billing' && billingView ? (
  <button type="button" onClick={goBackFromBillingDetail} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white/74 transition hover:bg-white/[0.06] hover:text-white">
  <ArrowLeft className="h-6 w-6" />
  </button>
  ) : activeTab === 'mysites' && mySiteId ? (
  <button type="button" onClick={closeSite} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white/74 transition hover:bg-white/[0.06] hover:text-white">
  <ArrowLeft className="h-6 w-6" />
  </button>
  ) : activeTab === 'projects' && selectedProjectId ? (
  <button type="button" onClick={() => { setSelectedProjectId(null); setActiveBuildChapter(null); }} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white/74 transition hover:bg-white/[0.06] hover:text-white">
  <ArrowLeft className="h-6 w-6" />
  </button>
  ) : drillParent[activeTab] && (
  <button type="button" onClick={() => openTab(drillParent[activeTab])} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white/74 transition hover:bg-white/[0.06] hover:text-white">
  <ArrowLeft className="h-6 w-6" />
  </button>
  )}
  <div className="min-w-0">
  <h1 className="truncate text-sm font-semibold text-white sm:text-base md:text-lg">
  {activeTab === 'billing' && billingView
  ? billingView === 'contract'
  ? `Contract${billingRecordId ? '' : ''}`
  : billingView === 'transaction'
  ? 'Transaction'
  : billingView === 'invoice'
  ? 'Invoice'
  : billingView === 'receipt'
  ? 'Receipt'
  : 'Care subscription'
  : activeTab === 'mysites' && mySiteId
  ? (currentSite?.name || 'Site')
  : activeTab === 'dashboard'
  ? 'Overview'
  : activeTab === 'projects' && selectedProjectId
  ? (overviewProject?.name || 'Build project')
  : currentTab?.label || 'Workspace'}
  </h1>
  </div>
  </div>
  <div className="ml-auto flex min-w-0 items-center gap-2">
  {needsProjectContext && projectContexts.length > 0 && (
  <label className="min-w-0 items-center gap-2">
  <span className="sr-only">Choose project</span>
  <select value={scopedProject?.id || ''} onChange={event => setSelectedProjectId(event.target.value || null)} className="h-10 w-28 max-w-[30vw] truncate rounded-lg border border-white/10 bg-white/[0.04] px-2 text-[11px] font-medium text-white outline-none focus:border-ai-blue sm:w-auto sm:max-w-56 sm:px-3 sm:text-xs" aria-label="Project context">
  <option value="" className="bg-[#0A0C10]">Choose project</option>
  {projectContexts.map(project => <option key={project.id} value={project.id} className="bg-[#0A0C10]">{project.name}</option>)}
  </select>
  </label>
  )}
  <button type="button" onClick={() => openTab('settings')} aria-label={`Account settings for ${user?.name || 'your account'}`} className="hidden sm:flex items-center gap-3 rounded-xl px-2 py-2 group cursor-pointer transition-all hover:bg-white/[0.04]">
  <div className="text-right"><p className="text-[10px] font-semibold leading-none text-white/72">{user?.name || 'Account'}</p></div>
  <div className="w-10 h-10 rounded-full bg-white/[0.055] flex items-center justify-center text-white/72 group-hover:bg-white/10 group-hover:text-white transition"><User className="w-5 h-5" /></div>
  </button>
  <button onClick={() => openTab('messages')} aria-label={unreadMessages ? `Messages, ${unreadMessages} unread` : 'Messages'} className="grid h-11 w-11 place-items-center rounded-xl hover:bg-white/[0.06] transition-all text-white/58 hover:text-white relative">
  <Bell className="w-5 h-5" />
  {unreadMessages > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-ai-blue rounded-full border-2 border-[#0A0C10]"></span>}
  </button>
  <button onClick={() => openTab('settings')} aria-label="Account settings" className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.06] text-white/72 transition hover:bg-white/10 hover:text-white sm:hidden"><User className="w-5 h-5" /></button>
  </div>
  </header>

  <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-7 lg:p-9 xl:p-10">
  {fetchError && (
  <div className="mb-10 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4">
  <div className="flex-1"><h4 className="text-sm font-semibold text-red-500">Workspace Sync Error</h4><p className="text-xs text-red-400/70 font-medium">{fetchError}</p></div>
  <button onClick={() => fetchData()} className="px-4 py-2 bg-red-500 text-white text-[10px] font-semibold rounded-lg hover:bg-red-600 transition-all">Retry</button>
  </div>
  )}

  {activeTab === 'dashboard' && (
  <ClientOverview
  selectedProject={overviewProject}
  projectsCount={projects.length}
  domains={domains}
  billing={billing}
  tickets={tickets}
  unreadMessages={unreadMessages}
  activities={activities}
  liveSites={liveSites}
  onOpenTab={openTab}
  />
  )}

  {activeTab === 'projects-hub' && (
  <div className="animate-fade-in w-full min-w-0">
  <DrillList
  items={[
  { id: 'projects', label: 'Build journey', meta: `${projects.length} project${projects.length === 1 ? '' : 's'}` },
  { id: 'audit', label: 'Repair / Performance', meta: 'Audits & fixes' },
  { id: 'editor', label: 'Editor', meta: 'Edit page content' },
  { id: 'domains', label: 'Domains', meta: `${domains.length} connected` },
  ]}
  onSelect={openTab}
  />
  </div>
  )}

  {activeTab === 'business' && <ClientMerchant bookings={bookings} onOpenTab={openTab} />}

  {activeTab === 'projects' && <ClientBuildJourney dashboard={dashboard} onStartRequest={() => setShowProjectRequestModal(true)} />}

  {activeTab === 'mysites' && (
  mySiteId ? (
  currentSite ? (
  <SiteRoom
  site={currentSite}
  dashboard={dashboard}
  invoices={billingInvoices}
  receipts={billingReceipts}
  refunds={billingRefunds}
  onOpenBuildJourney={openBuildJourneyFromBilling}
  view={mySiteView}
  onChangeView={changeSiteView}
  />
  ) : (
  <div className="animate-fade-in text-sm font-semibold text-white/50">Site not found.</div>
  )
  ) : (
  <MySites projects={projects} onOpenSite={openSite} />
  )
  )}

  {activeTab === 'domains' && <ClientDomains dashboard={dashboard} projects={projects} />}

  {activeTab === 'ecommerce' && (scopedProject ? <div className="animate-fade-in"><EcommerceManager subscriptionId={scopedProject.id} purchasedAddons={scopedProject.purchasedAddons} onBrowseAddons={() => openTab('addons')} /></div> : <ProjectContextPrompt projects={projectContexts} onSelect={setSelectedProjectId} />)}

  {activeTab === 'booking' && (scopedProject ? <div className="animate-fade-in"><BookingManager isAdmin={false} subscriptionId={scopedProject.id} /></div> : <ProjectContextPrompt projects={projectContexts} onSelect={setSelectedProjectId} />)}

  {activeTab === 'tickets' && <div className="animate-fade-in"><SupportTickets /></div>}
  {activeTab === 'repair' && <div className="animate-fade-in"><RepairWorkspace projects={projects} /></div>}

  {activeTab === 'support' && (
  <div className="animate-fade-in w-full min-w-0">
  <DrillList
  items={[
  { id: 'messages', label: 'Messages', meta: unreadMessages ? `${unreadMessages} unread` : 'No unread messages' },
  { id: 'tickets', label: 'Tickets', meta: openTickets ? `${openTickets} open` : 'No open tickets' },
  { id: 'resources', label: 'Resources', meta: `${resources.length} available` },
  ]}
  onSelect={openTab}
  />
  </div>
  )}

  {activeTab === 'billing' && <ClientBilling billing={billing} invoices={billingInvoices} receipts={billingReceipts} refunds={billingRefunds} projects={projects} unavailable={billingUnavailable} onRetry={fetchData} onOpenBuildJourney={openBuildJourneyFromBilling} onOpenAddons={() => openTab('addons')} />}

  {activeTab === 'addons' && (scopedProject ? <div className="animate-fade-in"><AddonMarketplace subscription={scopedProject} onRequestCustom={() => openTab('tickets')} /></div> : <ProjectContextPrompt projects={projectContexts} onSelect={setSelectedProjectId} />)}

  {activeTab === 'editor' && (
  <div className="animate-fade-in">
  {scopedProject ? (
  <PageEditor subscriptionId={scopedProject.id} purchasedAddons={scopedProject.purchasedAddons as unknown[]} />
  ) : (
  <ProjectContextPrompt projects={projectContexts} onSelect={setSelectedProjectId} />
  )}
  </div>
  )}

  {activeTab === 'audit' && (
  <div className="animate-fade-in">
  {scopedProject ? <PerformanceAudit key={scopedProject.id} subscriptionId={scopedProject.id} data={analysisProjectId === scopedProject.id ? analysisResult : savedPerformance?.projectId === scopedProject.id ? savedPerformance.result : null} isRefreshing={isAnalyzing} errorMessage={analysisError?.projectId === scopedProject.id ? analysisError.message : null} actionsLocked={scopedProject.canManageSite === false} disabledReason={scopedProject.canManageSite === false ? 'Performance tools unlock after handoff acceptance and payment closeout.' : !scopedProject.siteUrl ? 'A live deployment is required before this site can be scanned.' : null} onRefresh={scopedProject.canManageSite !== false && scopedProject.siteUrl ? (strategy) => handleAnalyzeSite(scopedProject.id, scopedProject.siteUrl!, strategy) : undefined} onRequestOptimization={() => openTab('tickets')} /> : <ProjectContextPrompt projects={projectContexts} onSelect={setSelectedProjectId} />}
  </div>
  )}

  {activeTab === 'messages' && <div className="animate-fade-in"><MessageViewer messages={messages} /></div>}

  {activeTab === 'resources' && <div className="animate-fade-in"><ResourceLibrary resources={resources} onSupportRequest={() => openTab('tickets')} /></div>}

  {activeTab === 'settings-hub' && (
  <div className="animate-fade-in w-full min-w-0">
  <DrillList
  items={[
  { id: 'billing', label: 'Billing', meta: `${billing.length} payment${billing.length === 1 ? '' : 's'}` },
  { id: 'settings', label: 'My account', meta: 'Profile & preferences' },
  ]}
  onSelect={openTab}
  />
  </div>
  )}

  {activeTab === 'settings' && <ClientSettings dashboard={dashboard} />}
  
  </div>
  </main>
  </div>

  {showProjectRequestModal && (
  <AssessmentQuestionnaire
  isOpen={showProjectRequestModal}
  onClose={() => setShowProjectRequestModal(false)}
  onComplete={() => { setShowProjectRequestModal(false); setSelectedProjectId(null); openTab('projects'); fetchData(); }}
  />
  )}

  {showAssessmentModal && selectedAssessment && (
  <AssessmentModal isOpen={showAssessmentModal} onClose={() => setShowAssessmentModal(false)} assessment={selectedAssessment} />
  )}
  </div>
  );
}
