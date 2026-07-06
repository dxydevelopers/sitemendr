// components/client-dashboard/ClientDashboard.tsx
//
// Shell only: sidebar navigation, header, and tab switching.
// All data/logic lives in useClientDashboard(). All heavy screens
// live in their own files (ClientOverview, ClientBuildJourney, etc.)
// or are the existing shared components from components/dashboard/.

'use client';

import dynamic from 'next/dynamic';
import {
  BarChart3, Rocket, MessageSquare, CreditCard, BookOpen, LifeBuoy, Terminal,
  Zap, Globe, ArrowLeft, ChevronRight, FileText, ShoppingBag, LogOut, User,
  Key, Users, Bell, Settings, Plus, Clock, PanelLeftClose, PanelLeftOpen, Gift,
  Sparkles, Check,
} from 'lucide-react';
import { useClientDashboard } from './useClientDashboard';
import { lockedClientTabs } from './utils';
import type { DashboardNavItem } from './types';
import ClientOverview from './ClientOverview';
import ClientBuildJourney from './ClientBuildJourney';
import ClientMerchant from './ClientMerchant';
import ClientBilling from './ClientBilling';
import ClientSettings from './ClientSettings';
import ClientDomains from './ClientDomains';

const SupportTickets = dynamic(() => import('../dashboard/SupportTickets'), { ssr: false });
const MessageViewer = dynamic(() => import('../dashboard/MessageViewer'), { ssr: false });
const ResourceLibrary = dynamic(() => import('../dashboard/ResourceLibrary'), { ssr: false });
const AddonMarketplace = dynamic(() => import('../dashboard/AddonMarketplace'), { ssr: false });
const PageEditor = dynamic(() => import('../dashboard/PageEditor'), { ssr: false });
const PerformanceAudit = dynamic(() => import('../dashboard/PerformanceAudit'), { ssr: false });
const EcommerceManager = dynamic(() => import('../dashboard/EcommerceManager'), { ssr: false });
const BookingManager = dynamic(() => import('../dashboard/BookingManager'), { ssr: false });
const SupporterDashboard = dynamic(() => import('../SupporterDashboard'), { ssr: false });
const AssessmentQuestionnaire = dynamic(() => import('../AssessmentQuestionnaire'), { ssr: false });
const AssessmentModal = dynamic(() => import('../AssessmentModal'), { ssr: false });

interface ClientDashboardProps {
  onLogout?: () => void;
  initialTab?: string;
}

export default function ClientDashboard({ onLogout, initialTab }: ClientDashboardProps) {
  const dashboard = useClientDashboard(initialTab);
  const {
    activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, isSidebarExpanded, setIsSidebarExpanded,
    openSidebarGroup, setOpenSidebarGroup, mobileRailGroup, setMobileRailGroup,
    stats, projects, activities, billing, messages, tickets, resources, bookings, domains,
    loading, user, fetchError, fetchData, selectedProjectId, setSelectedProjectId,
    setActiveBuildChapter, isAnalyzing, analysisResult, handleAnalyzeSite, exportingId,
    handleExportCodebase, showAssessmentModal, setShowAssessmentModal, selectedAssessment,
    showProjectRequestModal, setShowProjectRequestModal, revealTier, isRevealing, setIsRevealing,
    profileData, setProfileData, profileMessage, handleUpdateProfile,
    passwordData, setPasswordData, passwordMessage, handleChangePassword,
    handleLogoutAction,
  } = dashboard;

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-[#05070a] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-ai-blue/10 rounded-full animate-spin border-t-ai-blue shadow-[0_0_30px_rgba(0,102,255,0.2)]"></div>
            <div className="absolute inset-0 flex items-center justify-center"><Terminal className="w-8 h-8 text-ai-blue animate-pulse" /></div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-black uppercase tracking-[0.4em] text-white">Loading</h2>
            <p className="text-[10px] font-mono text-medium-gray uppercase tracking-widest animate-pulse">Preparing your Sitemendr workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  const openTickets = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length;
  const unreadMessages = messages.filter(m => !m.isRead).length;
  const averageProgress = projects.length ? Math.round(projects.reduce((s, p) => s + (p.progress || 0), 0) / projects.length) : 0;
  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : projects.find(p => p.isCurrent) || projects[0];

  const mainNav: DashboardNavItem[] = [
    { id: 'dashboard', label: 'Overview', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'workspaces', label: 'Workspaces', icon: <Rocket className="w-5 h-5" />, children: [{ id: 'projects', label: 'Build' }, { id: 'audit', label: 'Repair' }, { id: 'business', label: 'Merchant' }] },
    { id: 'projects', label: 'Projects', icon: <FileText className="w-5 h-5" />, count: projects.length, children: [{ id: 'projects', label: 'Project records', count: projects.length }, { id: 'editor', label: 'Editor' }, { id: 'audit', label: 'Performance' }, { id: 'domains', label: 'Domains', count: domains.length }] },
  ];
  const manageNav: DashboardNavItem[] = [
    { id: 'business', label: 'Merchant', icon: <ShoppingBag className="w-5 h-5" />, children: [{ id: 'ecommerce', label: 'Commerce' }, { id: 'booking', label: 'Bookings', count: bookings.length }] },
    { id: 'billing', label: 'Billing', icon: <CreditCard className="w-5 h-5" />, count: billing.length, children: [{ id: 'billing', label: 'Invoices', count: billing.length }, { id: 'addons', label: 'Add-ons' }] },
    { id: 'support', label: 'Support', icon: <LifeBuoy className="w-5 h-5" />, count: tickets.length + unreadMessages, children: [{ id: 'messages', label: 'Messages', count: unreadMessages }, { id: 'tickets', label: 'Tickets', count: openTickets }, { id: 'resources', label: 'Resources', count: resources.length }] },
  ];
  const accountNav: DashboardNavItem[] = [
    { id: 'account', label: 'Account', icon: <User className="w-5 h-5" />, children: [{ id: 'supporter', label: 'Community' }, { id: 'settings', label: 'Settings' }] },
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
    { id: 'supporter', label: 'Community', icon: <Users className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];
  const currentTab = allNavItems.find(item => item.id === activeTab);
  const activeTabLock = lockedClientTabs[activeTab];

  const navGroups: Record<string, string[]> = {
    workspaces: ['workspaces', 'projects', 'audit', 'business'],
    projects: ['projects', 'domains', 'editor', 'audit'],
    business: ['business', 'ecommerce', 'booking'],
    billing: ['billing', 'addons'],
    support: ['support', 'messages', 'tickets', 'resources'],
    account: ['account', 'supporter', 'settings'],
  };
  const isNavActive = (id: string) => (navGroups[id] || [id]).includes(activeTab);
  const openTab = (tabId: string) => {
    setActiveTab(tabId);
    setOpenSidebarGroup(null);
    setMobileRailGroup(null);
    setSelectedProjectId(null);
    setIsSidebarOpen(false);
  };

  const renderNavSection = (label: string, items: DashboardNavItem[]) => (
    <div className="space-y-1">
      <span className={`block px-3 pb-1 text-[9px] font-black uppercase tracking-[0.24em] text-white/28 transition-all duration-200 ${isSidebarExpanded ? 'md:opacity-100' : 'md:h-0 md:overflow-hidden md:opacity-0'}`}>{label}</span>
      <div className="space-y-1">
        {items.map(item => (
          <div key={item.id} className="space-y-1">
            <button type="button" onClick={() => {
              if (item.children?.length) { setIsSidebarExpanded(true); setOpenSidebarGroup(openSidebarGroup === item.id ? null : item.id); }
              else { setActiveTab(item.id); setOpenSidebarGroup(null); setSelectedProjectId(null); setIsSidebarOpen(false); }
            }} className={`group/nav relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${isSidebarExpanded ? 'md:justify-start' : 'md:justify-center'} ${isNavActive(item.id) ? 'bg-ai-blue/14 text-white' : 'text-white/52 hover:text-white hover:bg-white/[0.05]'}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center transition-all ${isNavActive(item.id) ? 'text-ai-blue' : 'text-white/42 group-hover/nav:text-white/80'}`}>{item.icon}</span>
              <span className={`min-w-0 flex-1 truncate text-[13px] font-semibold tracking-tight transition-all duration-200 ${isSidebarExpanded ? 'md:w-auto md:opacity-100' : 'md:w-0 md:flex-none md:opacity-0'}`}>{item.label}</span>
              {Boolean(item.count) && <span className={`min-w-5 rounded-full bg-ai-blue px-1.5 py-0.5 text-center text-[9px] font-black text-white transition-all duration-200 ${isSidebarExpanded ? 'md:static md:bg-white/10 md:text-white/78' : 'md:absolute md:right-1.5 md:top-1.5'}`}>{item.count}</span>}
              {item.children?.length && <ChevronRight className={`hidden h-4 w-4 shrink-0 text-white/28 transition md:block ${isSidebarExpanded && openSidebarGroup === item.id ? 'rotate-90 text-white/60' : ''} ${isSidebarExpanded ? 'opacity-100' : 'opacity-0'}`} />}
            </button>
            {item.children?.length && isSidebarExpanded && openSidebarGroup === item.id && (
              <div className="ml-11 space-y-1 border-l border-white/[0.07] pl-3">
                {item.children.map(child => (
                  <button key={child.id} type="button" onClick={() => { setActiveTab(child.id); setSelectedProjectId(null); setIsSidebarOpen(false); }}
                    className={`flex min-h-9 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[12px] font-semibold transition ${activeTab === child.id ? 'bg-white/[0.07] text-white' : 'text-white/44 hover:bg-white/[0.04] hover:text-white'}`}>
                    <span className="truncate">{child.label}</span>
                    {Boolean(child.count) && <span className="min-w-5 rounded-full bg-white/10 px-1.5 py-0.5 text-center text-[9px] font-black text-white/70">{child.count}</span>}
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
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff07_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:80px_80px] opacity-30"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_64%_4%,rgba(0,102,255,0.16),transparent_34%),radial-gradient(circle_at_88%_78%,rgba(245,158,11,0.10),transparent_30%),radial-gradient(circle_at_18%_84%,rgba(16,185,129,0.08),transparent_30%)]"></div>
      </div>

      <div className="flex relative z-10 min-h-screen">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#05070a]/94 backdrop-blur-2xl border-r border-white/[0.10] transition-[width,transform] duration-300 transform overflow-x-hidden overflow-y-auto md:translate-x-0 ${isSidebarExpanded ? 'md:w-64' : 'md:w-20'} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-full flex flex-col px-3 py-4 pb-8">
            <div className={`mb-6 flex items-center gap-3 px-1 transition-all duration-200 ${isSidebarExpanded ? 'justify-between' : 'justify-center'}`}>
              <button type="button" onClick={() => setActiveTab('dashboard')} className={`group hidden min-w-0 items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-white/[0.05] md:flex ${isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 overflow-hidden opacity-0'}`}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-[#05070a]"><Terminal className="h-4 w-4" /></span>
                <span className="min-w-0"><span className="block truncate text-sm font-black tracking-tight text-white">Sitemendr</span><span className="block truncate text-[10px] font-semibold text-white/42">Client workspace</span></span>
              </button>
              <button type="button" onClick={() => setIsSidebarExpanded(v => !v)} className="hidden md:grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white/52 transition hover:bg-white/[0.06] hover:text-white" aria-label={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}>
                {isSidebarExpanded ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
              </button>
            </div>
            <nav className="flex-1 space-y-7">
              {renderNavSection('Main', mainNav)}
              {renderNavSection('Manage', manageNav)}
              {renderNavSection('Account', accountNav)}
            </nav>
            <div className="pt-5 mt-auto space-y-2 border-t border-white/[0.07]">
              <button onClick={() => handleLogoutAction(onLogout)} className={`w-full flex items-center gap-3 px-3 py-2.5 text-white/44 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-semibold ${isSidebarExpanded ? 'md:justify-start' : 'md:justify-center'}`}>
                <LogOut className="w-4 h-4 shrink-0" />
                <span className={`transition-all duration-200 ${isSidebarExpanded ? 'md:w-auto md:opacity-100' : 'md:w-0 md:overflow-hidden md:opacity-0'}`}>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className={`flex-1 min-h-screen transition-[margin,padding] duration-300 md:pl-0 ${isSidebarExpanded ? 'md:ml-64' : 'md:ml-20'}`}>
          <header className="min-h-20 flex items-center justify-between gap-5 px-5 sm:px-8 lg:px-10 sticky top-0 z-40">
            <div className="flex min-w-0 items-center gap-3">
              {activeTab !== 'dashboard' && (
                <button type="button" onClick={() => {
                  if (activeTab === 'projects' && selectedProjectId) { setSelectedProjectId(null); setActiveBuildChapter(null); }
                  else { setActiveTab('dashboard'); setSelectedProjectId(null); }
                }} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white/74 transition hover:bg-white/[0.06] hover:text-white">
                  <ArrowLeft className="h-6 w-6" />
                </button>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-base font-black tracking-tight md:text-lg">
                  {activeTab === 'dashboard' ? 'Overview' : activeTab === 'projects' && selectedProjectId ? (selectedProject?.name || 'Build project') : currentTab?.label || 'Workspace'}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setActiveTab('settings')} className="hidden sm:flex items-center gap-3 px-2 py-2 group cursor-pointer transition-all">
                <div className="text-right"><p className="text-[10px] font-black uppercase tracking-tight leading-none text-white/72">{user?.name || 'Account'}</p></div>
                <div className="w-10 h-10 rounded-full bg-white/[0.055] flex items-center justify-center text-white/72 group-hover:bg-white/10 group-hover:text-white transition"><User className="w-5 h-5" /></div>
              </button>
              <button onClick={() => setActiveTab('messages')} className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/[0.06] transition-all text-white/58 hover:text-white relative">
                <Bell className="w-5 h-5" />
                {unreadMessages > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-ai-blue rounded-full border-2 border-[#05070a]"></span>}
              </button>
              <button onClick={() => setActiveTab('settings')} className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.06] text-white/72 transition hover:bg-white/10 hover:text-white sm:hidden"><User className="w-5 h-5" /></button>
            </div>
          </header>

          <div className="p-5 sm:p-7 lg:p-9 xl:p-10">
            {fetchError && (
              <div className="mb-10 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4">
                <div className="flex-1"><h4 className="text-sm font-black uppercase text-red-500">Workspace Sync Error</h4><p className="text-xs text-red-400/70 font-medium">{fetchError}</p></div>
                <button onClick={() => fetchData()} className="px-4 py-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-600 transition-all">Retry</button>
              </div>
            )}

            {activeTabLock ? (
              <section className="animate-fade-in grid min-h-[58vh] place-items-center border-y border-white/10 px-5 py-14 text-center">
                <div className="max-w-sm space-y-6">
                  <div className="mx-auto grid h-14 w-14 place-items-center border border-white/10 bg-white/[0.03] text-ai-blue"><Key className="h-5 w-5" /></div>
                  <div className="space-y-2"><p className="text-[10px] font-black uppercase tracking-[0.28em] text-ai-blue/70">No access</p><h1 className="text-2xl font-black tracking-tight text-white">{activeTabLock.label}</h1></div>
                  <button type="button" onClick={() => openTab('projects')} className="inline-flex min-h-11 items-center gap-3 bg-ai-blue px-5 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black">
                    <ArrowLeft className="h-4 w-4" /> Back to Build
                  </button>
                </div>
              </section>
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <ClientOverview
                    selectedProject={selectedProject}
                    averageProgress={averageProgress}
                    projectsCount={projects.length}
                    domains={domains}
                    billing={billing}
                    tickets={tickets}
                    unreadMessages={unreadMessages}
                    activities={activities}
                    onOpenTab={setActiveTab}
                  />
                )}

                {activeTab === 'business' && <ClientMerchant bookings={bookings} billing={billing} onOpenTab={setActiveTab} />}

                {activeTab === 'projects' && <ClientBuildJourney dashboard={dashboard} onStartRequest={() => setShowProjectRequestModal(true)} />}

                {activeTab === 'domains' && <ClientDomains dashboard={dashboard} projects={projects} />}

                {activeTab === 'ecommerce' && <div className="animate-fade-in"><EcommerceManager subscriptionId={selectedProjectId || (projects[0]?.id)} /></div>}

                {activeTab === 'booking' && <div className="animate-fade-in"><BookingManager isAdmin={false} subscriptionId={selectedProjectId || (projects[0]?.id)} /></div>}

                {activeTab === 'tickets' && <div className="animate-fade-in"><SupportTickets subscriptionId={selectedProjectId || undefined} /></div>}

                {activeTab === 'billing' && <ClientBilling billing={billing} projects={projects} />}

                {activeTab === 'supporter' && <div className="animate-fade-in h-full -m-6 lg:-m-10 overflow-x-hidden"><SupporterDashboard onLogout={() => handleLogoutAction(onLogout)} isNested={true} /></div>}

                {activeTab === 'addons' && <div className="animate-fade-in"><AddonMarketplace subscription={projects[0] || null} onRequestCustom={() => setActiveTab('tickets')} /></div>}

                {activeTab === 'editor' && (
                  <div className="animate-fade-in">
                    {(selectedProjectId || projects[0]?.id) ? (
                      <PageEditor subscriptionId={selectedProjectId || projects[0]?.id || ''} purchasedAddons={projects.find(p => p.id === (selectedProjectId || projects[0]?.id))?.purchasedAddons as unknown[]} />
                    ) : (
                      <div className="h-96 flex items-center justify-center border border-white/5 rounded-3xl bg-white/[0.01]"><p className="text-medium-gray font-medium">No active project found to edit.</p></div>
                    )}
                  </div>
                )}

                {activeTab === 'audit' && (
                  <div className="animate-fade-in">
                    <PerformanceAudit data={analysisResult} isRefreshing={isAnalyzing} onRefresh={() => {
                      const project = projects.find(p => p.id === selectedProjectId) || projects[0];
                      if (project?.siteUrl) handleAnalyzeSite(project.id, project.siteUrl);
                      else alert('No active deployment found to audit.');
                    }} />
                  </div>
                )}

                {activeTab === 'messages' && <div className="animate-fade-in"><MessageViewer messages={messages} /></div>}

                {activeTab === 'resources' && <div className="animate-fade-in"><ResourceLibrary resources={resources} onSupportRequest={() => setActiveTab('tickets')} /></div>}

                {activeTab === 'settings' && <ClientSettings dashboard={dashboard} />}
              </>
            )}
          </div>
        </main>
      </div>

      {showProjectRequestModal && (
        <AssessmentQuestionnaire
          isOpen={showProjectRequestModal}
          onClose={() => setShowProjectRequestModal(false)}
          onComplete={() => { setShowProjectRequestModal(false); setActiveTab('projects'); setSelectedProjectId(null); fetchData(); }}
        />
      )}

      {showAssessmentModal && selectedAssessment && (
        <AssessmentModal isOpen={showAssessmentModal} onClose={() => setShowAssessmentModal(false)} assessment={selectedAssessment} />
      )}

      {isRevealing && revealTier && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black">
          <div className="text-center space-y-12 max-w-2xl px-8 py-16 rounded-[40px] border border-white/5 bg-white/[0.01] backdrop-blur-3xl">
            <div className="relative">
              <div className="absolute inset-0 bg-ai-blue/40 blur-[100px] animate-pulse rounded-full"></div>
              <div className="relative w-24 h-24 lg:w-32 lg:h-32 bg-ai-blue rounded-[32px] flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(0,102,255,0.6)]"><Gift className="w-12 h-12 lg:w-16 lg:h-16 text-white" /></div>
            </div>
            <div className="space-y-4">
              <h2 className="text-[10px] font-black text-ai-blue uppercase tracking-[0.5em]">Community access updated</h2>
              <h1 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter leading-none">{revealTier.name}</h1>
              <p className="text-medium-gray text-xs font-mono uppercase tracking-widest opacity-60 max-w-sm mx-auto">Your Sitemendr account now carries this community level and its connected benefits.</p>
            </div>
            <div className="pt-8 space-y-6">
              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
                <div className="flex justify-between items-center mb-6"><span className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">Member benefits</span><Sparkles className="w-4 h-4 text-ai-blue" /></div>
                <ul className="space-y-2">
                  {revealTier.perks.slice(0, 3).map((perk, i) => (
                    <li key={i} className="flex items-center gap-3 text-[10px] font-mono text-medium-gray uppercase tracking-tighter"><Check className="w-3 h-3 text-ai-blue" />{perk.replace(/-/g, ' ')}</li>
                  ))}
                </ul>
              </div>
              <button onClick={() => {
                setIsRevealing(false);
                const newUrl = window.location.pathname + window.location.search.replace(/[?&]reveal=[^&]+/, '');
                window.history.replaceState({}, '', newUrl);
              }} className="w-full py-5 bg-ai-blue text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl hover:bg-white hover:text-black transition-all shadow-2xl shadow-ai-blue/40 active:scale-95 duration-300">
                Open community access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
