// components/admin-dashboard/AdminDashboard.tsx
//
// Shell only: sidebar navigation, header, and tab switching.
// All data/logic lives in useAdminDashboard(). All heavy screens live
// in their own files or are the existing shared components from
// components/dashboard/.

'use client';

import dynamic from 'next/dynamic';
import {
  Layout, PanelLeftClose, PanelLeftOpen, ChevronRight,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAdminDashboard } from './useAdminDashboard';
import { adminTabs, adminTabGroups } from './utils';
import type { AdminDashboardProps, SiteVitals } from './types';
import AdminOverview from './AdminOverview';
import AdminBuildPipeline from './AdminBuildPipeline';
import AdminClients from './AdminClients';
import AdminBilling from './AdminBilling';
import AdminTransactions from './AdminTransactions';
import AdminContent from './AdminContent';
import AdminSystem from './AdminSystem';

const AssessmentModal = dynamic(() => import('../AssessmentModal'), { ssr: false });
const SupportManager = dynamic(() => import('../dashboard/SupportManager'), { ssr: false });
const LiveSupportManager = dynamic(() => import('../dashboard/LiveSupportManager'), { ssr: false });
const MilestoneManager = dynamic(() => import('../dashboard/MilestoneManager'), { ssr: false });
const CommentManager = dynamic(() => import('../dashboard/CommentManager'), { ssr: false });
const BookingManager = dynamic(() => import('../dashboard/BookingManager'), { ssr: false });

export default function AdminDashboard({ onLogout, initialTab }: AdminDashboardProps) {
  const dashboard = useAdminDashboard(initialTab);
  const {
    activeTab, openAdminTab, isSidebarOpen, setIsSidebarOpen, isSidebarExpanded, setIsSidebarExpanded,
    openSidebarGroup, setOpenSidebarGroup, mobileRailGroup, setMobileRailGroup,
    stats, leads, users, subscriptions, assessments, reviewProjects, media, analytics, loading, submitting,
    searchTerm, setSearchTerm, filterStatus, setFilterStatus,
    selectedSubscriptionForEditor, setSelectedSubscriptionForEditor,
    selectedSiteForVitals, setSelectedSiteForVitals, siteVitals, setSiteVitals, loadingVitals, setLoadingVitals,
    enforcementSettings, setEnforcementSettings, isSystemWorking,
    handleRunSuspensionCheck, handleRunDNSVerification, handleUpdateEnforcementSettings,
    handleUpdateLeadStatus, handleDeleteLead, handleToggleUserBan, handleUpdateUserRole, handleDeleteUser,
    handleUploadMedia, handleDeleteMedia, handleDeploySite, handleUpdateReview, handleCompleteReview,
    handleTriggerAIGeneration, handleViewAssessment, handleDeleteAssessment,
    handleSuspendSubscription, handleDeleteSubscription,
    selectedAssessment, isAssessmentModalOpen, setIsAssessmentModalOpen,
    handleLogout,
  } = dashboard;

  const currentTab = adminTabs.find(t => t.id === activeTab);
  const currentGroup = adminTabGroups.find(group => group.tabs.includes(activeTab)) || adminTabGroups[0];

  const fetchSiteVitals = async (id: string): Promise<SiteVitals | null> => {
    try {
      const res = await apiClient.getSiteVitals(id);
      return res.success ? res.vitals : null;
    } catch (err) {
      console.error('Failed to fetch vitals:', err);
      return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#05070a] text-white selection:bg-ai-blue/30 overflow-hidden font-sans relative">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      {mobileRailGroup && <button type="button" className="fixed inset-0 z-[70] bg-transparent lg:hidden" aria-label="Close mobile navigation" onClick={() => setMobileRailGroup(null)} />}

      <nav className={`fixed left-0 top-1/2 z-[80] flex -translate-y-1/2 flex-col gap-4 py-3 transition-[width,padding] duration-200 lg:hidden ${mobileRailGroup ? 'w-64 px-2' : 'w-9 px-0'}`}>
        {adminTabGroups.map(group => {
          const isGroupActive = group.tabs.includes(activeTab);
          const isRailOpen = mobileRailGroup === group.id;
          return (
            <div key={group.id} className="relative">
              <button type="button" onClick={() => { if (group.tabs.length === 1) { openAdminTab(group.tabs[0]); return; } setMobileRailGroup(isRailOpen ? null : group.id); }} className={`grid h-11 w-9 shrink-0 place-items-center transition ${isGroupActive || isRailOpen ? group.accent : 'text-white/66 hover:text-white'}`} aria-label={group.label}>{group.icon}</button>
              {isRailOpen && (
                <div className="mt-2 w-full pl-10 py-1">
                  <p className={`text-[9px] font-black uppercase tracking-[0.22em] ${group.accent}`}>{group.label}</p>
                  <div className="mt-5 grid gap-1">
                    {group.tabs.map(tabId => {
                      const tab = adminTabs.find(item => item.id === tabId);
                      if (!tab) return null;
                      return (
                        <button key={tab.id} type="button" onClick={() => openAdminTab(tab.id)} className={`group flex min-h-12 w-fit max-w-full items-center gap-3 py-3 text-left transition ${activeTab === tab.id ? 'text-white' : 'text-white/52 hover:text-white'}`}>
                          <span className={activeTab === tab.id ? 'text-ai-blue' : 'text-white/34'}>{tab.icon}</span>
                          <span className="min-w-0 border-b border-white/16 pb-1 text-sm font-black tracking-tight transition group-hover:border-white/34">{tab.shortName || tab.name}</span>
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

      <aside className={`fixed inset-y-0 left-0 w-80 bg-[#05070a]/96 backdrop-blur-2xl lg:bg-[#05070a] border-r border-white/10 flex flex-col z-[110] lg:z-20 transform transition-[width,transform] duration-300 lg:relative lg:translate-x-0 ${isSidebarExpanded ? 'lg:w-80' : 'lg:w-20'} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`border-b border-white/10 px-3 py-4 ${isSidebarExpanded ? '' : 'lg:px-3'}`}>
          <div className={`flex items-center gap-3 ${isSidebarExpanded ? 'justify-between' : 'lg:justify-center'}`}>
            <button type="button" onClick={() => openAdminTab('dashboard')} className={`group flex min-w-0 items-center gap-3 px-2 py-2 text-left transition hover:bg-white/[0.04] ${isSidebarExpanded ? 'flex-1' : 'lg:w-0 lg:overflow-hidden lg:opacity-0'}`}>
              <div className="grid h-10 w-10 shrink-0 place-items-center bg-white text-[#05070a]"><Layout className="h-4 w-4" /></div>
              <div className="min-w-0"><h2 className="truncate text-sm font-black tracking-tight text-white">Sitemendr</h2><p className="mt-1 truncate text-[10px] font-semibold text-white/42">Admin operations</p></div>
            </button>
            <button type="button" onClick={() => setIsSidebarExpanded(v => !v)} className="hidden h-10 w-10 shrink-0 place-items-center text-white/52 transition hover:bg-white/[0.06] hover:text-white lg:grid" aria-label={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}>
              {isSidebarExpanded ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-2">
            {adminTabGroups.map(group => {
              const isGroupActive = group.tabs.includes(activeTab);
              const isOpen = openSidebarGroup === group.id || isGroupActive;
              return (
                <div key={group.id} className="space-y-1">
                  <button type="button" onClick={() => { if (group.tabs.length === 1) { openAdminTab(group.tabs[0]); setOpenSidebarGroup(group.id); } else { setOpenSidebarGroup(isOpen && !isGroupActive ? null : group.id); } }} className={`group/nav flex min-h-12 w-full items-center gap-3 px-3 py-2.5 text-left transition ${isSidebarExpanded ? '' : 'lg:justify-center'} ${isGroupActive ? 'bg-white/[0.065] text-white' : 'text-white/52 hover:bg-white/[0.045] hover:text-white'}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center ${isGroupActive ? group.accent : 'text-white/38 group-hover/nav:text-white/72'}`}>{group.icon}</span>
                    <span className={`min-w-0 flex-1 ${isSidebarExpanded ? '' : 'lg:hidden'}`}><span className="block truncate text-[13px] font-black tracking-tight">{group.label}</span></span>
                    {group.tabs.length > 1 && isSidebarExpanded && <ChevronRight className={`h-4 w-4 shrink-0 text-white/30 transition ${isOpen ? 'rotate-90 text-white/58' : ''}`} />}
                  </button>
                  {group.tabs.length > 1 && isOpen && isSidebarExpanded && (
                    <div className="ml-7 space-y-1 border-l border-white/[0.08] pl-3">
                      {group.tabs.map(tabId => {
                        const tab = adminTabs.find(item => item.id === tabId);
                        if (!tab) return null;
                        return (
                          <button key={tab.id} type="button" onClick={() => openAdminTab(tab.id)} className={`flex min-h-9 w-full items-center gap-3 px-3 py-2 text-left transition ${activeTab === tab.id ? 'bg-ai-blue/12 text-white' : 'text-white/44 hover:bg-white/[0.04] hover:text-white'}`}>
                            <span className={activeTab === tab.id ? 'text-ai-blue' : 'text-white/30'}>{tab.icon}</span>
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
          <button onClick={() => handleLogout(onLogout)} className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-[12px] font-semibold text-white/46 transition hover:bg-red-500/10 hover:text-red-300">
            <span>Sign out</span><span className="text-red-300">Exit</span>
          </button>
        </div>
      </aside>

      <div className={`relative z-10 flex flex-1 flex-col overflow-hidden transition-[padding] duration-200 lg:pl-0 ${mobileRailGroup ? 'pl-64' : 'pl-10'}`}>
        {activeTab !== 'project-requests' && (
          <header className="flex min-h-16 items-center justify-between gap-4 border-b border-white/10 bg-[#05070a]/95 px-4 py-3 lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              {activeTab !== 'dashboard' && (
                <div className="min-w-0">
                  <p className={`text-[9px] font-black uppercase tracking-[0.18em] ${currentGroup.accent}`}>{currentGroup.label}</p>
                  <h1 className="truncate text-base font-black tracking-tight text-white lg:text-lg">{currentTab?.name || 'Admin'}</h1>
                </div>
              )}
            </div>
          </header>
        )}

        <main className={`relative flex-1 overflow-y-auto ${activeTab === 'project-requests' ? 'p-0' : 'p-4 sm:p-6 lg:p-7'}`}>
          {activeTab === 'dashboard' && <AdminOverview stats={stats} loading={loading} onOpenTab={openAdminTab} />}

          {activeTab === 'project-requests' && <AdminBuildPipeline dashboard={dashboard} />}

          {(activeTab === 'leads' || activeTab === 'users' || activeTab === 'assessments') && (
            <AdminClients
              view={activeTab} leads={leads} users={users} assessments={assessments}
              searchTerm={searchTerm} setSearchTerm={setSearchTerm} filterStatus={filterStatus} setFilterStatus={setFilterStatus}
              onUpdateLeadStatus={handleUpdateLeadStatus} onDeleteLead={handleDeleteLead}
              onToggleUserBan={handleToggleUserBan} onUpdateUserRole={handleUpdateUserRole} onDeleteUser={handleDeleteUser}
              onViewAssessment={handleViewAssessment} onDeleteAssessment={handleDeleteAssessment}
            />
          )}

          {(activeTab === 'subscriptions' || activeTab === 'review') && (
            <AdminBilling
              view={activeTab} subscriptions={subscriptions} reviewProjects={reviewProjects}
              searchTerm={searchTerm} setSearchTerm={setSearchTerm} filterStatus={filterStatus} setFilterStatus={setFilterStatus}
              selectedSubscriptionForEditor={selectedSubscriptionForEditor} setSelectedSubscriptionForEditor={setSelectedSubscriptionForEditor}
              isSystemWorking={isSystemWorking} onTriggerAIGeneration={handleTriggerAIGeneration}
              onSuspendSubscription={handleSuspendSubscription} onDeleteSubscription={handleDeleteSubscription}
              onUpdateReview={handleUpdateReview} onCompleteReview={handleCompleteReview} onDeploySite={handleDeploySite}
            />
          )}

          {activeTab === 'transactions' && <AdminTransactions />}

          {(activeTab === 'media' || activeTab === 'blog') && (
            <AdminContent view={activeTab} media={media} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onUploadMedia={handleUploadMedia} onDeleteMedia={handleDeleteMedia} />
          )}

          {(activeTab === 'analytics' || activeTab === 'system' || activeTab === 'health') && (
            <AdminSystem
              view={activeTab} analytics={analytics} enforcementSettings={enforcementSettings} setEnforcementSettings={setEnforcementSettings}
              submitting={submitting} onUpdateEnforcementSettings={handleUpdateEnforcementSettings}
              isSystemWorking={isSystemWorking} onRunSuspensionCheck={handleRunSuspensionCheck} onRunDNSVerification={handleRunDNSVerification}
              subscriptions={subscriptions} selectedSiteForVitals={selectedSiteForVitals} setSelectedSiteForVitals={setSelectedSiteForVitals}
              siteVitals={siteVitals} setSiteVitals={setSiteVitals} loadingVitals={loadingVitals} setLoadingVitals={setLoadingVitals}
              fetchSiteVitals={fetchSiteVitals}
            />
          )}

          {activeTab === 'milestones' && <div className="animate-fade-in"><MilestoneManager /></div>}
          {activeTab === 'bookings' && <div className="animate-fade-in"><BookingManager isAdmin={true} /></div>}
          {activeTab === 'tickets' && <div className="animate-fade-in"><SupportManager /></div>}
          {activeTab === 'live-support' && <div className="animate-fade-in"><LiveSupportManager /></div>}
          {activeTab === 'comments' && <div className="animate-fade-in"><CommentManager /></div>}
        </main>
      </div>

      <AssessmentModal isOpen={isAssessmentModalOpen} onClose={() => setIsAssessmentModalOpen(false)} assessment={selectedAssessment} />
    </div>
  );
}