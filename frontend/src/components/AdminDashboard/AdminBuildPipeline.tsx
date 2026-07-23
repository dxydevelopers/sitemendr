// components/admin-dashboard/AdminBuildPipeline.tsx
//
// The "project-requests" tab: operator lane overview, then per-request
// the full admin-side brief -> scope -> agreement -> build -> review ->
// launch flow. This was the single largest block in the old
// AdminDashboard.tsx. Mirrors ClientBuildJourney.tsx in shape.
//
// Dead/unreachable JSX from the original (a `hidden` sidebar list that
// duplicated the lane list, and other `hidden` wrapper blocks) was not
// ported since it never rendered.

'use client';

import { useEffect } from 'react';

import {
  ArrowLeft, ChevronRight, Search, Package, UserRound, Mail, CalendarDays,
  Activity, Clock, CreditCard, MessageSquare, Check, ExternalLink, Send,
  CircleDollarSign, Layout, Folder, Eye, Sparkles, X,
} from 'lucide-react';
import type { ProjectRequest, StudioTask, StudioBlocker } from './AdminDashboard_types';
import {
  adminBuildChapters, closedBuildStatuses, buildOperatorViews, briefMissingOptions,
  getAdminBuildChapter, getAdminBuildProgress, getAdminNextAction, getAdminBuildState,
  formatCurrencyAmount,
} from './utils';
import type { UseAdminDashboardReturn } from './useAdminDashboard';

interface AdminBuildPipelineProps {
  dashboard: UseAdminDashboardReturn;
}

export default function AdminBuildPipeline({ dashboard }: AdminBuildPipelineProps) {
  const {
    loading, projectRequests, selectedProjectRequestId, setSelectedProjectRequestId,
    activeAdminBuildChapter, setActiveAdminBuildChapter, buildOperatorView, setBuildOperatorView,
    searchTerm, setSearchTerm, submitting, briefMissingItems, setBriefMissingItems,
    briefClarificationMessage, setBriefClarificationMessage, briefDecisionMessage,
    scopeClientNote, setScopeClientNote, studioTaskDraft, setStudioTaskDraft,
    studioBlockerDraft, setStudioBlockerDraft, studioUpdateDraft, setStudioUpdateDraft,
    studioLinkDraft, setStudioLinkDraft, reviewChatOpen, setReviewChatOpen, reviewChatMessages,
    reviewChatDraft, setReviewChatDraft, reviewChatChoiceDraft, setReviewChatChoiceDraft,
    reviewChatLoading, reviewChatSending, handleSendAdminReviewChat, agreementDraft, setAgreementDraft,
    handleUpdateProjectRequest, handleCreateStudioTask, handleUpdateStudioTask,
    handleCreateStudioBlocker, handleUpdateStudioBlocker, handleCreateStudioUpdate,
    handleCreatePreviewLink, handleClearPreviewLink, handleCreateStudioLink,
    handoffChatMessages, handoffChatDraft, setHandoffChatDraft, handoffChatLoading, handoffChatSending,
    handoffChatLoadedRequestId, fetchAdminHandoffChat, handleSendAdminHandoffChat, handleMarkFinalPaymentReceived,
  } = dashboard;

  const selectedProjectRequest = selectedProjectRequestId
    ? projectRequests.find(r => r.id === selectedProjectRequestId) || null
    : null;

  useEffect(() => {
    if (
      selectedProjectRequest
      && selectedProjectRequest.status === 'handoff'
      && handoffChatLoadedRequestId !== selectedProjectRequest.id
    ) {
      fetchAdminHandoffChat(selectedProjectRequest.id);
    }
  }, [selectedProjectRequest?.id, selectedProjectRequest?.status, handoffChatLoadedRequestId]);

  const buildSearchTerm = searchTerm.trim().toLowerCase();
  const filteredBySearch = projectRequests.filter(request => {
    if (!buildSearchTerm) return true;
    const rowChapter = getAdminBuildChapter(request.status);
    const haystack = [request.id, request.title, request.businessName, request.packageIntent, request.serviceType, request.status, request.summary, request.quoteCurrency, request.quotedAmount, rowChapter.label, request.user?.name, request.user?.email].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(buildSearchTerm);
  });
  const selectedBuildOperatorView = buildOperatorViews.find(v => v.id === buildOperatorView) || null;
  const selectedBuildOperatorViewIndex = selectedBuildOperatorView ? buildOperatorViews.findIndex(v => v.id === selectedBuildOperatorView.id) : -1;
  const previousBuildOperatorView = selectedBuildOperatorViewIndex > 0 ? buildOperatorViews[selectedBuildOperatorViewIndex - 1] : null;
  const nextBuildOperatorView = selectedBuildOperatorViewIndex >= 0 && selectedBuildOperatorViewIndex < buildOperatorViews.length - 1 ? buildOperatorViews[selectedBuildOperatorViewIndex + 1] : null;
  const filteredProjectRequests = selectedBuildOperatorView ? filteredBySearch.filter(r => selectedBuildOperatorView.statuses.includes(r.status)) : [];
  const buildOperatorCards = buildOperatorViews.map(view => ({ ...view, requests: projectRequests.filter(r => view.statuses.includes(r.status)) }));

  // ---------- LANE OVERVIEW ----------
  if (loading) {
    return <div className="flex h-80 items-center justify-center border-y border-white/10 text-[10px] font-black uppercase tracking-[0.24em] text-white/32">Loading build requests...</div>;
  }
  if (projectRequests.length === 0) {
    return (
      <div className="flex h-80 flex-col items-center justify-center border-y border-white/10 text-center">
        <Sparkles className="mb-5 h-10 w-10 text-white/18" />
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/38">No build requests yet</p>
      </div>
    );
  }

  if (!selectedProjectRequestId && !selectedBuildOperatorView) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="grid gap-px overflow-hidden bg-white/10 md:grid-cols-2 xl:grid-cols-4">
          {buildOperatorCards.map(lane => (
            <button key={lane.label} type="button" onClick={() => setBuildOperatorView(lane.id)} className="min-h-40 bg-[#05070a] px-5 py-5 text-left transition hover:bg-white/[0.035]">
              <div className="flex items-start justify-between gap-5"><span className="text-3xl font-black tracking-tight text-white">{lane.requests.length}</span><ChevronRight className="h-4 w-4 text-white/24" /></div>
              <p className="mt-8 text-[10px] font-black uppercase tracking-[0.16em] text-white/52">{lane.label}</p>
              <p className="mt-2 text-xs leading-6 text-white/38">{lane.detail}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedProjectRequestId && selectedBuildOperatorView) {
    return (
      <div className="animate-fade-in">
        <div className="px-5 pb-5 pt-1 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <button type="button" onClick={() => setBuildOperatorView('overview')} className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center text-white/42 transition hover:text-white"><ArrowLeft className="h-4 w-4" /></button>
              <h2 className="text-xl font-black tracking-tight text-white lg:text-2xl">{selectedBuildOperatorView.label}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-4 pl-12 lg:pl-0">
              {previousBuildOperatorView && <button type="button" onClick={() => setBuildOperatorView(previousBuildOperatorView.id)} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-expert-green transition hover:text-expert-green/80"><ChevronRight className="h-3.5 w-3.5 rotate-180" />{previousBuildOperatorView.label}</button>}
              <label className="group inline-flex h-8 min-w-[11rem] items-center gap-2 text-white/70 transition focus-within:text-white">
                <Search className="h-3.5 w-3.5 shrink-0" />
                <input type="text" placeholder={`Search ${selectedBuildOperatorView.label.toLowerCase()}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent text-[10px] font-black uppercase tracking-[0.14em] text-white/90 outline-none placeholder:text-white/45 focus:text-white" />
              </label>
              {nextBuildOperatorView && <button type="button" onClick={() => setBuildOperatorView(nextBuildOperatorView.id)} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-amber-300 transition hover:text-amber-200">{nextBuildOperatorView.label}<ChevronRight className="h-3.5 w-3.5" /></button>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <h3 className="text-sm font-black text-white">{selectedBuildOperatorView.label}</h3>
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/34">{filteredProjectRequests.length} record{filteredProjectRequests.length === 1 ? '' : 's'}</span>
        </div>
        <div>
          {filteredProjectRequests.map(request => {
            const rowChapter = getAdminBuildChapter(request.status);
            const rowProgress = getAdminBuildProgress(request.status);
            const rowClientResponseSource = `${request.clientNotes || ''}\n${request.adminNotes || ''}`.toLowerCase();
            const rowClientResponded = rowChapter.id === 'brief' && (rowClientResponseSource.includes('client sent brief clarification') || rowClientResponseSource.includes('client brief clarification') || rowClientResponseSource.includes('client message:'));
            const nextAction = rowClientResponded ? 'Review client response' : getAdminNextAction(request);
            const rowState = getAdminBuildState(request);
            const summaryPreview = request.summary ? request.summary.split('\n').find(l => l.trim().length > 0) || request.summary : 'No project summary has been prepared yet.';
            const rowAttentionReason = rowClientResponded ? 'Client response received. Review the new brief details and decide whether Scope can open.'
              : request.status === 'in_review' ? 'Brief is under review. Confirm missing items or approve the request for Scope.'
              : request.status === 'submitted' ? 'New brief submitted. Start intake review and check what Scope needs.'
              : rowChapter.id === 'scope' ? (request.status === 'approved' ? 'Scope accepted. Prepare Agreement and payment terms.' : 'Scope is ready for client review. Confirm the quote and client note before Agreement opens.')
              : summaryPreview;
            const quoteLabel = request.quotedAmount ? `${request.quoteCurrency || request.user?.defaultCurrency || 'USD'} ${request.quotedAmount}` : 'Quote pending';
            const projectLabel = request.packageIntent || request.serviceType || 'Custom build';
            const createdAtLabel = request.createdAt ? new Date(request.createdAt).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'No date';

            return (
              <button key={request.id} type="button" onClick={() => { setSelectedProjectRequestId(request.id); setActiveAdminBuildChapter(null); }}
                className={`group grid w-full gap-5 border-b border-ai-blue/18 px-5 py-5 text-left transition hover:border-ai-blue/36 hover:bg-white/[0.025] xl:grid-cols-[minmax(0,1fr)_25rem] xl:items-center ${closedBuildStatuses.includes(request.status) ? 'opacity-70 hover:opacity-100' : ''}`}>
                <span className="min-w-0">
                  <span className="block truncate text-base font-black text-white">{request.title || request.businessName || 'Untitled build'}</span>
                  <span className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-black uppercase tracking-[0.12em]">
                    <span className="inline-flex items-center gap-2 text-amber-300"><Package className="h-3.5 w-3.5" /><span>{projectLabel.replace(/_/g, ' ')}</span></span>
                    <span className="inline-flex items-center gap-2 text-expert-green"><UserRound className="h-3.5 w-3.5" /><span>{request.user?.name || 'Unknown client'}</span></span>
                    <span className="inline-flex min-w-0 items-start gap-2 text-ai-blue"><Mail className="h-3.5 w-3.5 shrink-0" /><span className="break-all normal-case tracking-normal">{request.user?.email || 'No client email'}</span></span>
                    <span className="inline-flex items-center gap-2 text-tech-purple"><CalendarDays className="h-3.5 w-3.5" /><span>{createdAtLabel}</span></span>
                  </span>
                </span>
                <span className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                  {[
                    { label: 'Next', value: nextAction, color: 'text-amber-300', icon: <ChevronRight className="h-3.5 w-3.5" /> },
                    { label: 'Stage', value: rowChapter.label, color: 'text-ai-blue', icon: <Activity className="h-3.5 w-3.5" /> },
                    { label: 'State', value: rowClientResponded ? 'Client responded' : rowState, color: rowClientResponded ? 'text-expert-green' : 'text-white/58', icon: rowClientResponded ? <MessageSquare className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" /> },
                    { label: 'Quote', value: quoteLabel, color: 'text-white/72', icon: <CreditCard className="h-3.5 w-3.5" /> },
                  ].map(item => (
                    <span key={item.label} className="min-w-0">
                      <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/30">{item.icon}<span>{item.label}</span></span>
                      <span className={`mt-1 block truncate text-[11px] font-black uppercase tracking-[0.1em] ${item.color}`}>{item.value}</span>
                    </span>
                  ))}
                  <span className="sm:col-span-4 xl:col-span-2">
                    <span className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.14em]"><span className="text-white/46">Progress</span><span className="text-expert-green">{rowProgress}%</span></span>
                    <span className="mt-2 block h-1 bg-white/10"><span className="block h-full bg-expert-green" style={{ width: `${rowProgress}%` }} /></span>
                  </span>
                </span>
                <span className={`flex min-w-0 flex-col gap-3 pt-1 text-sm font-semibold leading-6 sm:flex-row sm:items-center sm:justify-between xl:col-span-2 ${rowClientResponded ? 'text-expert-green' : rowChapter.id === 'scope' ? 'text-amber-300' : 'text-white/56'}`}>
                  <span className="min-w-0">{rowAttentionReason}</span>
                  <span className="inline-flex shrink-0 items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/48 transition group-hover:text-white">Open {rowChapter.id === 'brief' ? 'brief' : rowChapter.label.toLowerCase()}<ChevronRight className="h-3.5 w-3.5" /></span>
                </span>
              </button>
            );
          })}
          {filteredProjectRequests.length === 0 && (
            <div className="px-5 py-10 text-sm text-white/34">{buildSearchTerm ? `No results for "${searchTerm.trim()}"` : `No ${selectedBuildOperatorView.label.toLowerCase()} waiting right now.`}</div>
          )}
        </div>
      </div>
    );
  }

  // ---------- SELECTED REQUEST VIEW ----------
  if (!selectedProjectRequest) return null;

  const defaultAdminBuildChapter = adminBuildChapters.find(c => c.statuses.includes(selectedProjectRequest.status)) || adminBuildChapters[0];
  const defaultAdminBuildChapterIndex = Math.max(0, adminBuildChapters.findIndex(c => c.id === defaultAdminBuildChapter.id));
  const requestedAdminBuildChapter = adminBuildChapters.find(c => c.id === activeAdminBuildChapter);
  const requestedAdminBuildChapterIndex = requestedAdminBuildChapter ? adminBuildChapters.findIndex(c => c.id === requestedAdminBuildChapter.id) : -1;
  const canOpenRequestedAdminBuildChapter = Boolean(requestedAdminBuildChapter && (requestedAdminBuildChapterIndex <= defaultAdminBuildChapterIndex || selectedProjectRequest.status === 'completed' || (selectedProjectRequest.status === 'approved' && requestedAdminBuildChapter.id === 'agreement')));
  const selectedAdminBuildChapter = requestedAdminBuildChapter && canOpenRequestedAdminBuildChapter ? requestedAdminBuildChapter : defaultAdminBuildChapter;
  const selectedAdminBuildChapterIndex = Math.max(0, adminBuildChapters.findIndex(c => c.id === selectedAdminBuildChapter.id));
  const nextAdminBuildChapter = adminBuildChapters[Math.min(selectedAdminBuildChapterIndex + 1, adminBuildChapters.length - 1)];
  const adminBuildPageProgress = Math.round(((defaultAdminBuildChapterIndex + 1) / adminBuildChapters.length) * 100);

  const selectedBuildMilestones = selectedProjectRequest.buildMilestones || [];
  const selectedBlockedBuildMilestones = selectedBuildMilestones.filter(m => m.status === 'blocked');
  const selectedStudioInternalNote = selectedProjectRequest.adminNotes?.toLowerCase().includes('client brief clarification') ? '' : selectedProjectRequest.adminNotes?.trim() || '';
  const briefReviewStatus = selectedProjectRequest.status === 'submitted' ? 'New brief'
    : selectedProjectRequest.status === 'in_review' ? 'Under review'
    : ['quote_ready', 'approved', 'payment_agreement', 'in_development', 'staging_review', 'launched', 'handoff', 'completed'].includes(selectedProjectRequest.status) ? 'Ready for scope' : 'Review needed';
  const selectedBriefLines = (selectedProjectRequest.summary || '').split('\n').filter(Boolean);
  const getSelectedBriefValue = (label: string) => { const match = selectedBriefLines.find(l => l.toLowerCase().startsWith(`${label.toLowerCase()}:`)); return match ? match.slice(label.length + 1).trim() : ''; };
  const readResponseValue = (value: unknown) => Array.isArray(value) ? value.join(', ') : typeof value === 'string' ? value : '';
  const selectedBriefType = readResponseValue(selectedProjectRequest.assessment?.responses?.projectType) || getSelectedBriefValue('Build type') || selectedProjectRequest.serviceType || 'Custom build';
  const selectedBriefGoals = readResponseValue(selectedProjectRequest.assessment?.responses?.goals) || getSelectedBriefValue('Goals');
  const selectedBriefFeatures = readResponseValue(selectedProjectRequest.assessment?.responses?.requiredFeatures) || getSelectedBriefValue('Required features');
  const selectedBriefAudience = readResponseValue(selectedProjectRequest.assessment?.responses?.targetAudience) || getSelectedBriefValue('Users');
  const selectedBriefMaterial = readResponseValue(selectedProjectRequest.assessment?.responses?.hasWebsite) || getSelectedBriefValue('Existing material');
  const selectedBriefStyle = readResponseValue(selectedProjectRequest.assessment?.responses?.preferredStyle) || getSelectedBriefValue('Style direction');
  const selectedBriefLink = readResponseValue(selectedProjectRequest.assessment?.responses?.website) || getSelectedBriefValue('Link');
  const selectedStudioNoteSource = `${selectedProjectRequest.adminNotes || ''}\n${selectedProjectRequest.clientNotes || ''}`;
  const selectedStudioHasContentAssets = Boolean((selectedBriefMaterial && selectedBriefMaterial.toLowerCase() !== 'nothing yet') || /Content\/assets:\s*(?!\s*(not answered|none|nothing yet)\b).+/i.test(selectedStudioNoteSource));
  const selectedStudioTasks = selectedProjectRequest.studioTasks || [];
  const selectedStudioLinks = selectedProjectRequest.studioLinks || [];
  const selectedStudioBlockers = selectedProjectRequest.studioBlockers || [];
  const selectedOpenStudioBlockers = selectedStudioBlockers.filter(b => b.status !== 'resolved');
  const selectedStudioUpdates = selectedProjectRequest.studioUpdates || [];
  const selectedPreviewLink = selectedStudioLinks.find(l => l.type === 'preview' && l.url) || null;
  const selectedPreviewUrl = selectedProjectRequest.stagingUrl || selectedPreviewLink?.url || '';
  const selectedPreviewIsReal = Boolean(selectedPreviewUrl && /^https?:\/\//i.test(selectedPreviewUrl) && !/sitemendr\.test|localhost|127\.0\.0\.1/i.test(selectedPreviewUrl));
  const selectedPreviewIsTest = Boolean(selectedPreviewUrl && !selectedPreviewIsReal);
  const selectedInternalPreviewUrl = selectedProjectRequest.subscriptionId ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/preview/${selectedProjectRequest.subscriptionId}` : '';
  const selectedStudioNeeds = [
    selectedStudioHasContentAssets ? null : 'Content/assets',
    selectedPreviewIsReal ? null : 'Real preview link',
    selectedBlockedBuildMilestones.length ? 'Blocker resolution' : null,
  ].filter(Boolean) as string[];
  const selectedClientStudioUpdates = selectedStudioUpdates.filter(u => u.visibility === 'client');
  const selectedDoneStudioTasks = selectedStudioTasks.filter(t => t.status === 'done');
  const selectedActiveStudioTasks = selectedStudioTasks.filter(t => t.status === 'active');
  const selectedBlockedStudioTasks = selectedStudioTasks.filter(t => t.status === 'blocked');
  const selectedStudioCompletion = selectedStudioTasks.length ? Math.round((selectedDoneStudioTasks.length / selectedStudioTasks.length) * 100) : 0;
  const selectedStudioAreas = [
    { id: 'design', name: 'Design', icon: <Layout className="h-5 w-5" />, accent: 'text-ai-blue' },
    { id: 'build', name: 'Build', icon: <Layout className="h-5 w-5" />, accent: 'text-white/70' },
    { id: 'content', name: 'Content', icon: <Package className="h-5 w-5" />, accent: selectedStudioHasContentAssets ? 'text-expert-green' : 'text-amber-300' },
    { id: 'qa', name: 'QA', icon: <Eye className="h-5 w-5" />, accent: 'text-white/50' },
    { id: 'preview', name: 'Preview', icon: <Sparkles className="h-5 w-5" />, accent: selectedPreviewIsReal ? 'text-expert-green' : 'text-amber-300' },
  ].map(area => ({ ...area, tasks: selectedStudioTasks.filter(t => t.area === area.id) }));
  const getStudioAreaState = (tasks: StudioTask[]) => {
    if (!tasks.length) return { label: 'Not started', tone: 'text-white/34' };
    if (tasks.some(t => t.status === 'blocked')) return { label: 'Blocked', tone: 'text-amber-300' };
    if (tasks.every(t => t.status === 'done')) return { label: 'Ready', tone: 'text-expert-green' };
    if (tasks.some(t => t.status === 'active')) return { label: 'In progress', tone: 'text-ai-blue' };
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
    { label: 'Blocked', value: String(selectedOpenStudioBlockers.length + selectedBlockedStudioTasks.length), tone: (selectedOpenStudioBlockers.length || selectedBlockedStudioTasks.length) ? 'text-amber-300' : 'text-expert-green' },
    { label: 'Updates', value: String(selectedClientStudioUpdates.length), tone: selectedClientStudioUpdates.length ? 'text-expert-green' : 'text-white/34' },
  ];
  const selectedProductionMode = selectedProjectRequest.productionMode || 'hybrid';
  const selectedProductionModeLabel = selectedProductionMode === 'inside_app' ? 'Inside app' : selectedProductionMode === 'outside_tools' ? 'Outside tools' : 'Hybrid';
  const selectedStudioArtifacts = selectedStudioLinks.filter(l => l.type !== 'preview' || l.url);
  const selectedStudioIsEmpty = selectedStudioTasks.length === 0;
  const selectedStudioTaskGroups = selectedStudioAreas.map(area => ({ ...area, state: getStudioAreaState(area.tasks) })).filter(area => area.tasks.length > 0);
  const selectedLatestClientUpdate = selectedClientStudioUpdates[0];
  const selectedReviewChecks = [
    { label: 'Client update', detail: selectedLatestClientUpdate?.message || 'Publish one clear production update before Review.', ready: selectedClientStudioUpdates.length > 0 },
    { label: 'Preview', detail: selectedPreviewIsReal ? 'Public preview is connected.' : 'Connect a real public preview URL.', ready: selectedPreviewIsReal },
    { label: 'Production evidence', detail: selectedStudioArtifacts.some(l => ['design', 'repo', 'file', 'link'].includes(l.type)) ? 'At least one artifact is attached.' : 'Attach design, repo, file, or production reference.', ready: selectedStudioArtifacts.some(l => ['design', 'repo', 'file', 'link'].includes(l.type)) },
    { label: 'Work completed', detail: selectedDoneStudioTasks.length ? `${selectedDoneStudioTasks.length} work item${selectedDoneStudioTasks.length === 1 ? '' : 's'} done.` : 'Mark at least one production work item as done.', ready: selectedDoneStudioTasks.length > 0 },
    { label: 'Risks cleared', detail: selectedOpenStudioBlockers.length ? `${selectedOpenStudioBlockers.length} open blocker${selectedOpenStudioBlockers.length === 1 ? '' : 's'} still active.` : 'No open blockers.', ready: selectedOpenStudioBlockers.length === 0 },
  ];
  const selectedStudioCanOpenReview = selectedReviewChecks.every(item => item.ready);
  const selectedReviewStatus = selectedProjectRequest.stagingReviewStatus || 'sent';
  const selectedReviewStatusLabel = selectedReviewStatus === 'changes_requested' ? 'Changes requested' : selectedReviewStatus === 'approved' ? 'Approved' : selectedReviewStatus === 'sent' ? 'Waiting client' : 'Not sent';
  const selectedReviewStatusTone = selectedReviewStatus === 'approved' ? 'text-expert-green' : selectedReviewStatus === 'changes_requested' ? 'text-amber-300' : selectedReviewStatus === 'sent' ? 'text-ai-blue' : 'text-white/46';
  const selectedReviewCanMoveForward = selectedReviewStatus === 'approved';
  const selectedReviewHeadline = selectedReviewStatus === 'changes_requested' ? 'Client requested changes' : selectedReviewStatus === 'approved' ? 'Preview approved' : 'Preview is with client';
  const selectedReviewIntro = selectedReviewStatus === 'changes_requested' ? 'Review the note, return to Studio, then send the updated preview back.' : selectedReviewStatus === 'approved' ? 'Client approval is recorded. Handoff can begin when the team is ready.' : 'Awaiting approval or change notes.';
  const selectedBriefAnswerRows = [
    { question: 'What are we building?', answer: selectedBriefType || 'Not answered' },
    { question: 'What should this build help achieve?', answer: selectedBriefGoals || 'Not answered' },
    { question: 'Which features must be included?', answer: selectedBriefFeatures || 'Not answered' },
    { question: 'Who will use it?', answer: selectedBriefAudience || 'Not answered' },
    { question: 'What does the client already have?', answer: selectedBriefMaterial || 'Not answered' },
    { question: 'What style direction did the client choose?', answer: selectedBriefStyle || 'Not answered' },
    { question: 'What budget should we plan around?', answer: selectedProjectRequest.budget || 'Not specified' },
    { question: 'What timeline did the client give?', answer: selectedProjectRequest.timeline || 'Not specified' },
    { question: 'Any existing link?', answer: selectedBriefLink || 'Not specified' },
    { question: 'Priority level', answer: selectedProjectRequest.priority || 'normal' },
  ];
  const selectedClientNotes = selectedProjectRequest.clientNotes?.trim() || '';
  const selectedClientResponseSource = [selectedClientNotes, selectedProjectRequest.adminNotes?.trim() || ''].find(note => {
    const v = note.toLowerCase();
    return v.includes('client sent brief clarification') || v.includes('client brief clarification') || v.includes('client message:');
  }) || '';
  const selectedClientResponseReceived = Boolean(selectedClientResponseSource);
  const isBriefApprovedForScope = ['quote_ready', 'approved', 'payment_agreement', 'in_development', 'staging_review', 'launched', 'handoff', 'completed'].includes(selectedProjectRequest.status);
  const isScopeSentToClient = Boolean(selectedProjectRequest.clientNotes?.toLowerCase().includes('scope sent'));
  const isScopeAccepted = selectedProjectRequest.status === 'approved';
  const isAgreementSent = selectedProjectRequest.status === 'payment_agreement';
  const isAgreementConfirmed = selectedProjectRequest.paymentAgreementStatus === 'confirmed';
  const selectedAgreementCurrency = selectedProjectRequest.quoteCurrency || selectedProjectRequest.user?.defaultCurrency || 'USD';
  const selectedAgreementTotal = Number(agreementDraft.totalAgreedAmount || selectedProjectRequest.totalAgreedAmount || selectedProjectRequest.quotedAmount || 0);
  const selectedAgreementDueNow = Number(agreementDraft.depositAmount || selectedProjectRequest.depositAmount || selectedAgreementTotal || 0);
  const selectedAgreementBalance = (selectedProjectRequest.finalPaymentConfirmedAt || selectedProjectRequest.status === 'completed')
    ? 0
    : Math.max((selectedAgreementTotal || 0) - (selectedAgreementDueNow || 0), 0);
  const selectedAgreementDueNowLabel = formatCurrencyAmount(selectedAgreementCurrency, selectedAgreementDueNow);
  const selectedAgreementTotalLabel = formatCurrencyAmount(selectedAgreementCurrency, selectedAgreementTotal);
  const selectedAgreementBalanceLabel = selectedAgreementBalance ? formatCurrencyAmount(selectedAgreementCurrency, selectedAgreementBalance) : 'No balance';
  const selectedHandoffNote = selectedProjectRequest.handoffNotes?.trim() || '';
  const hasScopeDiscussionRequest = selectedClientNotes.toLowerCase().includes('client wants to discuss the quote');
  const selectedScopeDiscussionLines = selectedClientNotes.split('\n').map(l => l.trim()).filter(l => l.toLowerCase().startsWith('client message:') && !l.toLowerCase().includes('brief clarification')).map(l => l.replace(/^Client message:\s*/i, '')).filter((l, i, arr) => l && arr.indexOf(l) === i);
  const selectedAgreementNote = agreementDraft.paymentInstructions
    ? agreementDraft.paymentInstructions.replace(/Deposit of [A-Z]{3}\s*[\d,]+(\.\d+)?/i, `Deposit of ${selectedAgreementDueNowLabel}`)
    : selectedAgreementDueNow ? `Deposit of ${selectedAgreementDueNowLabel} before development starts. Balance follows the agreed project terms.` : '';
  const isAgreementDraftDirty = (
    agreementDraft.paymentAgreementType !== (selectedProjectRequest.paymentAgreementType || '')
    || agreementDraft.paymentDueDate !== (selectedProjectRequest.paymentDueDate ? selectedProjectRequest.paymentDueDate.slice(0, 10) : '')
    || agreementDraft.totalAgreedAmount !== (selectedProjectRequest.totalAgreedAmount?.toString() || selectedProjectRequest.quotedAmount?.toString() || '')
    || agreementDraft.depositAmount !== (selectedProjectRequest.depositAmount?.toString() || '')
    || agreementDraft.paymentInstructions !== (selectedProjectRequest.paymentInstructions || '')
  );
  const selectedAgreementTypeLabel = agreementDraft.paymentAgreementType === 'deposit' ? 'Deposit payment' : agreementDraft.paymentAgreementType === 'full_payment' ? 'Full payment' : agreementDraft.paymentAgreementType === 'milestone_payments' ? 'Milestone payments' : 'Deposit payment';
  const selectedPaymentReference = selectedClientNotes.match(/Reference:\s*([^\n]+)/i)?.[1]?.trim() || '';
  const selectedPaymentConfirmedAt = selectedProjectRequest.paymentConfirmedAt ? new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(selectedProjectRequest.paymentConfirmedAt)) : '';
  const selectedClientResponseReceivedAt = selectedProjectRequest.updatedAt ? new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(selectedProjectRequest.updatedAt)) : 'Recently';
  const selectedClientResponseLines = selectedClientResponseReceived ? selectedClientResponseSource.split('\n').map(l => l.trim()).filter(l => { const v = l.toLowerCase(); return l && !v.includes('client sent brief clarification') && !v.includes('client brief clarification'); }).map(l => l.replace(/^Client message:\s*/i, '')) : [];
  const selectedClientResponseRows = selectedClientResponseLines.flatMap(line => { const [label, ...rest] = line.split(':'); const answer = rest.join(':').trim(); return label && answer ? [{ label: label.trim(), answer }] : [{ label: 'Client response', answer: line }]; }).filter(row => briefMissingOptions.some(o => o.toLowerCase() === row.label.toLowerCase()));
  const selectedClientResponseSections = [
    { title: 'Content', tone: 'text-ai-blue', icon: <Folder className="h-4 w-4" />, labels: ['Content/assets', 'Pages/sections', 'Services/products'] },
    { title: 'Project direction', tone: 'text-expert-green', icon: <Activity className="h-4 w-4" />, labels: ['Feature scope', 'Audience/details', 'Lead form fields', 'Design references'] },
    { title: 'Planning', tone: 'text-amber-300', icon: <Clock className="h-4 w-4" />, labels: ['Budget clarity', 'Timeline clarity'] },
  ].map(section => ({ ...section, rows: selectedClientResponseRows.filter(row => section.labels.some(l => l.toLowerCase() === row.label.toLowerCase())) })).filter(s => s.rows.length);

  const handleRequestBriefMoreDetails = () => {
    const missingText = briefMissingItems.length ? `Please clarify: ${briefMissingItems.join(', ')}.` : '';
    const noteText = briefClarificationMessage.trim();
    const message = [missingText, noteText].filter(Boolean).join('\n');
    if (!message) return; // decision message set upstream via dashboard.setBriefDecisionMessage if needed
    handleUpdateProjectRequest(selectedProjectRequest.id, { status: 'in_review', clientNotes: message });
  };
  const handleSendScopeToClient = () => {
    if (!selectedProjectRequest.quotedAmount) return;
    const note = scopeClientNote.trim() || 'Scope sent. Please review the offer, price, and delivery terms.';
    handleUpdateProjectRequest(selectedProjectRequest.id, { status: 'quote_ready', quoteCurrency: selectedProjectRequest.quoteCurrency || selectedProjectRequest.user?.defaultCurrency || 'USD', clientNotes: note });
  };
  const handleSendAgreementPaymentRequest = () => {
    handleUpdateProjectRequest(selectedProjectRequest.id, {
      status: 'payment_agreement', quoteCurrency: selectedProjectRequest.quoteCurrency || selectedProjectRequest.user?.defaultCurrency || 'USD',
      paymentAgreementStatus: 'sent', paymentAgreementType: agreementDraft.paymentAgreementType || 'deposit',
      paymentDueDate: agreementDraft.paymentDueDate || null, totalAgreedAmount: agreementDraft.totalAgreedAmount,
      depositAmount: agreementDraft.depositAmount, paymentInstructions: selectedAgreementNote,
    });
  };

  return (
    <div className="min-h-[680px] animate-fade-in">
      <div className="px-5 pb-3 pt-1 lg:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <button type="button" onClick={() => { setSelectedProjectRequestId(null); setActiveAdminBuildChapter(null); }} className="mb-3 grid h-9 w-9 place-items-center text-white/42 transition hover:text-white"><ArrowLeft className="h-4 w-4" /></button>
            <h3 className="truncate text-2xl font-black tracking-tight text-white">{selectedProjectRequest.title || selectedProjectRequest.businessName || 'Untitled build'}</h3>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-black uppercase tracking-[0.12em]">
              <span className="text-white/38">{selectedProjectRequest.id.slice(-8).toUpperCase()}</span>
              <span className="inline-flex items-center gap-2 text-expert-green"><UserRound className="h-3.5 w-3.5" />{selectedProjectRequest.user?.name || 'Unknown client'}</span>
              <span className="inline-flex items-start gap-2 text-ai-blue"><Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="break-all normal-case tracking-normal">{selectedProjectRequest.user?.email || 'No email'}</span></span>
              <span className="inline-flex items-center gap-2 text-amber-300"><CalendarDays className="h-3.5 w-3.5" />{new Date(selectedProjectRequest.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          {selectedAdminBuildChapter.id !== 'brief' && selectedAdminBuildChapter.id !== 'agreement' && (
            <div className="w-full xl:min-w-[24rem] xl:pt-1">
              <div className="flex items-center justify-between gap-4 text-[10px] font-black uppercase tracking-[0.14em] text-white/34">
                <span>{selectedAdminBuildChapter.id === 'build' ? 'In studio' : selectedAdminBuildChapter.id === 'review' ? selectedReviewStatusLabel : selectedProjectRequest.status.replace(/_/g, ' ')}</span>
                <span>{adminBuildPageProgress}%</span>
              </div>
              <div className="mt-2 h-1.5 bg-white/10"><div className="h-full bg-ai-blue" style={{ width: `${adminBuildPageProgress}%` }} /></div>
              {selectedAdminBuildChapterIndex > 0 && (
                <button type="button" onClick={() => setActiveAdminBuildChapter(adminBuildChapters[selectedAdminBuildChapterIndex - 1].id)} className="mt-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/40 transition hover:text-white">
                  <ChevronRight className="h-3.5 w-3.5 rotate-180" />Previous step
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={`flex-1 ${selectedAdminBuildChapter.id === 'brief' || selectedAdminBuildChapter.id === 'agreement' ? 'divide-y divide-white/10' : 'grid xl:grid-cols-[minmax(0,1fr)_22rem] xl:divide-x xl:divide-white/10'}`}>
        <section className={`px-5 py-6 lg:px-8 ${selectedAdminBuildChapter.id === 'agreement' ? 'hidden' : ''}`}>
          {/* BRIEF */}
          {selectedAdminBuildChapter.id === 'brief' && (
            <>
              {selectedClientResponseReceived && (
                <div className="mb-6 py-5">
                  <div className="flex flex-col gap-3 border-b border-expert-green/25 pb-5 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-expert-green"><MessageSquare className="h-3.5 w-3.5" />Client response received</p>
                      <h4 className="mt-2 text-xl font-black tracking-tight text-white">Submitted brief details</h4>
                      <p className="mt-2 text-sm font-semibold leading-6 text-white/52">Received {selectedClientResponseReceivedAt}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.14em] text-expert-green">{selectedClientResponseRows.length} answers</span>
                  </div>
                  <div className="mt-6 grid gap-6 xl:grid-cols-2">
                    {selectedClientResponseSections.map(section => (
                      <div key={section.title} className="min-w-0 border-b border-white/10 pb-5">
                        <div className={`flex items-center gap-2 ${section.tone}`}>{section.icon}<p className="text-[10px] font-black uppercase tracking-[0.16em]">{section.title}</p></div>
                        <div className="mt-4 divide-y divide-white/10">
                          {section.rows.map((row, i) => (
                            <div key={`${section.title}-${row.label}-${i}`} className="grid gap-2 py-3 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-5">
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
              <div className={selectedClientResponseReceived ? 'mt-2' : 'border-y border-white/10'}>
                <div className="hidden xl:grid xl:grid-cols-5">
                  {selectedBriefAnswerRows.map(row => (
                    <div key={row.question} className="min-w-0 border-b border-r border-white/10 px-4 py-4 [&:nth-child(5n)]:border-r-0">
                      <p className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-white/34" title={row.question}>{row.question}</p>
                      <p className={`mt-2 truncate text-sm font-semibold ${['Not answered', 'Not specified'].includes(row.answer) ? 'text-white/30' : 'text-white/74'}`} title={row.answer}>{row.answer}</p>
                    </div>
                  ))}
                </div>
                <div className="divide-y divide-white/10 xl:hidden">
                  {selectedBriefAnswerRows.map(row => (
                    <div key={row.question} className="grid gap-2 py-4 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-6 md:items-start">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/38 md:truncate" title={row.question}>{row.question}</p>
                      <p className={`min-w-0 text-sm font-semibold leading-6 ${['Not answered', 'Not specified'].includes(row.answer) ? 'text-white/30' : 'text-white/72'} md:truncate`} title={row.answer}>{row.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* SCOPE */}
          {selectedAdminBuildChapter.id === 'scope' && (
            <div className="border-y border-white/10 py-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-300">Scope offer</p>
                  <h4 className="mt-2 text-2xl font-black tracking-tight text-white">Set the offer, price, and delivery terms.</h4>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-white/50">Turn the approved brief into a client-ready offer.</p>
                </div>
                <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue">{selectedProjectRequest.status.replace(/_/g, ' ')}</span>
              </div>
              <div className="mt-7 divide-y divide-white/10">
                <div className="grid gap-4 py-4 md:grid-cols-[12rem_minmax(0,1fr)] md:items-start">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/34">Offer</p>
                  <div className="min-w-0"><p className="text-lg font-black tracking-tight text-white">{selectedBriefType || 'Custom build'}</p><p className="mt-2 text-sm leading-7 text-white/54">{selectedBriefGoals || 'Goal not set'}</p></div>
                </div>
                <div className="grid gap-4 py-4 md:grid-cols-[12rem_minmax(0,1fr)] md:items-start">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/34">Included</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[{ label: 'Core features', value: selectedBriefFeatures || 'Not set' }, { label: 'Audience', value: selectedBriefAudience || 'Not set' }, { label: 'Content/assets', value: selectedBriefMaterial || 'Not set' }, { label: 'Style direction', value: selectedBriefStyle || 'Not set' }].map(item => (
                      <div key={item.label} className="min-w-0 border-b border-white/10 pb-3"><p className="text-[9px] font-black uppercase tracking-[0.13em] text-white/28">{item.label}</p><p className="mt-2 break-words text-sm font-semibold leading-6 text-white/72">{item.value}</p></div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 py-4 md:grid-cols-[12rem_minmax(0,1fr)] md:items-start">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/34">Terms</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    {[{ label: 'Price', value: selectedProjectRequest.quotedAmount ? `${selectedProjectRequest.quoteCurrency || selectedProjectRequest.user?.defaultCurrency || 'USD'} ${selectedProjectRequest.quotedAmount}` : 'Not set', tone: 'text-amber-300' }, { label: 'Budget direction', value: selectedProjectRequest.budget || 'Not specified', tone: 'text-white/72' }, { label: 'Timeline', value: selectedProjectRequest.timeline || 'Flexible', tone: 'text-white/72' }].map(item => (
                      <div key={item.label} className="min-w-0 border-b border-white/10 pb-3"><p className="text-[9px] font-black uppercase tracking-[0.13em] text-white/28">{item.label}</p><p className={`mt-2 break-words text-sm font-black leading-6 ${item.tone}`}>{item.value}</p></div>
                    ))}
                  </div>
                </div>
              </div>
              {hasScopeDiscussionRequest && !isScopeAccepted && (
                <div className="mt-5 border-y border-amber-300/20 py-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-300">Client discussion</p>
                  <p className="mt-2 text-xs leading-6 text-white/42">Client asked to discuss the scope before Agreement.</p>
                  <div className="mt-3 space-y-3">
                    {selectedScopeDiscussionLines.map((line, i) => <p key={`${line}-${i}`} className="text-sm leading-6 text-white/64">{line}</p>)}
                    {selectedScopeDiscussionLines.length === 0 && <p className="text-sm leading-6 text-white/48">No extra message was added.</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BUILD / STUDIO */}
          {selectedAdminBuildChapter.id === 'build' && (
            <div className="mt-4 space-y-6">
              <section className="border-y border-white/10 py-5">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.34fr)] xl:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[9px] font-black uppercase tracking-[0.18em] text-ai-blue">Production room</span>
                      <span className={`text-[9px] font-black uppercase tracking-[0.14em] ${(selectedOpenStudioBlockers.length || selectedBlockedStudioTasks.length) ? 'text-amber-300' : 'text-expert-green'}`}>{(selectedOpenStudioBlockers.length || selectedBlockedStudioTasks.length) ? 'Needs attention' : 'Moving'}</span>
                    </div>
                    <h3 className="mt-3 text-2xl font-black tracking-tight text-white">{selectedProjectRequest.title}</h3>
                    <div className="mt-4 grid gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
                      {selectedStudioDeliverables.map(item => (<div key={item.label} className="min-w-0 border-b border-white/10 pb-3"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/46">{item.label}</p><p className="mt-1 truncate text-sm font-semibold text-white/82">{item.value}</p></div>))}
                    </div>
                  </div>
                  <div className="border-y border-white/10 py-3">
                    {selectedStudioSignals.map(signal => (<div key={signal.label} className="flex items-center justify-between gap-4 border-b border-white/10 py-2 last:border-b-0"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/42">{signal.label}</p><p className={`text-sm font-black tracking-tight ${signal.tone}`}>{signal.value}</p></div>))}
                  </div>
                </div>
                <div className="mt-5 h-1 bg-white/10"><div className="h-full bg-ai-blue transition-all" style={{ width: `${selectedStudioCompletion}%` }} /></div>
              </section>

              <section className="border-b border-white/10 pb-5">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(18rem,0.38fr)] xl:items-start">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/56">Production source</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[{ id: 'inside_app', label: 'Inside app' }, { id: 'outside_tools', label: 'Outside tools' }, { id: 'hybrid', label: 'Hybrid' }].map(mode => (
                        <button key={mode.id} type="button" onClick={() => handleUpdateProjectRequest(selectedProjectRequest.id, { productionMode: mode.id })} disabled={submitting} className={`min-h-9 border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition disabled:opacity-45 ${selectedProductionMode === mode.id ? 'border-ai-blue/50 text-ai-blue' : 'border-white/10 text-white/52 hover:border-white/25 hover:text-white'}`}>{mode.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-white/10 pt-4 xl:border-t-0 xl:border-l xl:pl-5 xl:pt-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/56">Current mode</p>
                    <p className="mt-2 text-xl font-black tracking-tight text-white">{selectedProductionModeLabel}</p>
                    <textarea defaultValue={selectedProjectRequest.productionSourceNote || ''} onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { productionSourceNote: e.target.value })} className="mt-3 h-20 w-full resize-none border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60" placeholder="Where is the team building this project?" />
                  </div>
                </div>
              </section>

              <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.42fr)]">
                <div className="min-w-0 space-y-6">
                  <section className="space-y-4">
                    <div className="border-y border-white/10">
                      {selectedStudioIsEmpty ? (
                        <div className="py-5"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-ai-blue">No production work added</p><p className="mt-2 max-w-2xl text-sm leading-7 text-white/62">Add the first real work item above. The category only organizes the work; empty categories stay hidden.</p></div>
                      ) : (
                        <div className="divide-y divide-white/10">
                          {selectedStudioTaskGroups.map(group => (
                            <div key={group.id} className="grid gap-4 py-4 lg:grid-cols-[10rem_minmax(0,1fr)]">
                              <div className="flex items-start gap-3"><span className={group.accent}>{group.icon}</span><div><p className="text-sm font-black text-white">{group.name}</p><p className={`mt-1 text-[9px] font-black uppercase tracking-[0.14em] ${group.state.tone}`}>{group.state.label}</p></div></div>
                              <div className="divide-y divide-white/10">
                                {group.tasks.map(task => (
                                  <div key={task.id} className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_8rem] sm:items-center">
                                    <div className="min-w-0"><p className="text-sm font-semibold leading-5 text-white/76">{task.title}</p>{task.note && <p className="mt-2 text-xs leading-5 text-white/56">{task.note}</p>}</div>
                                    <select value={task.status} onChange={(e) => handleUpdateStudioTask(selectedProjectRequest.id, task.id, { status: e.target.value })} disabled={submitting} className="border-0 border-b border-white/10 bg-transparent px-0 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-white/70 outline-none">
                                      <option value="open">Open</option><option value="active">Active</option><option value="blocked">Blocked</option><option value="done">Done</option>
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
                      <select value={studioTaskDraft.area} onChange={(e) => setStudioTaskDraft(prev => ({ ...prev, area: e.target.value }))} className="border-0 border-b border-white/10 bg-transparent px-0 py-3 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-ai-blue/60">
                        {selectedStudioAreas.map(area => <option key={area.id} value={area.id}>{area.name}</option>)}
                      </select>
                      <input value={studioTaskDraft.title} onChange={(e) => setStudioTaskDraft(prev => ({ ...prev, title: e.target.value }))} className="border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60" placeholder="Add production work item..." />
                      <button type="button" onClick={() => handleCreateStudioTask(selectedProjectRequest.id)} disabled={submitting || !studioTaskDraft.title.trim()} className="border-b border-ai-blue/35 py-3 text-left text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:text-white disabled:opacity-40">Add work</button>
                    </div>
                  </section>

                  <section className="grid gap-px bg-white/10 lg:grid-cols-3">
                    <div className="bg-[#05070a] p-4">
                      <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3 text-expert-green"><Eye className="h-4 w-4" /><p className="text-[9px] font-black uppercase tracking-[0.18em]">Preview</p></div><span className={`text-[9px] font-black uppercase tracking-[0.14em] ${selectedPreviewIsReal ? 'text-expert-green' : selectedPreviewIsTest ? 'text-amber-300' : 'text-white/30'}`}>{selectedPreviewIsReal ? 'Public' : selectedPreviewIsTest ? 'Test' : 'Not connected'}</span></div>
                      <div className="mt-4 border-y border-white/10 py-3">
                        {selectedPreviewIsReal ? (
                          <a href={selectedPreviewUrl} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-2 break-all text-sm font-black leading-6 text-ai-blue hover:text-white">Open public preview <ChevronRight className="h-3.5 w-3.5 shrink-0" /></a>
                        ) : selectedPreviewIsTest ? (
                          <div className="space-y-3"><p className="text-sm font-semibold leading-6 text-amber-300">A test/local preview is saved, but it cannot be sent to the client for Review.</p><button type="button" onClick={() => handleClearPreviewLink(selectedProjectRequest.id, selectedPreviewLink?.id, selectedPreviewLink?.label)} disabled={submitting} className="text-[10px] font-black uppercase tracking-[0.14em] text-white/68 transition hover:text-white disabled:opacity-40">Remove test link</button></div>
                        ) : <p className="text-sm font-semibold leading-6 text-white/62">No public preview connected yet.</p>}
                      </div>
                      {selectedInternalPreviewUrl && (
                        <div className="mt-4 border-b border-white/10 pb-3"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/50">Inside app preview</p><button type="button" onClick={() => window.open(selectedInternalPreviewUrl, '_blank')} className="mt-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:text-white">Open internal preview <ChevronRight className="h-3.5 w-3.5" /></button></div>
                      )}
                      <input defaultValue={selectedPreviewIsReal ? selectedPreviewUrl : ''} onBlur={(e) => handleCreatePreviewLink(selectedProjectRequest.id, e.target.value)} className="mt-3 w-full border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60" placeholder="Paste public staging URL" />
                    </div>
                    <div className="bg-[#05070a] p-4">
                      <div className="flex items-center gap-3 text-ai-blue"><Layout className="h-4 w-4" /><p className="text-[9px] font-black uppercase tracking-[0.18em]">Artifacts</p></div>
                      <div className="mt-3 space-y-2">
                        {selectedStudioArtifacts.filter(l => l.type !== 'preview').slice(0, 3).map(link => (
                          link.url ? <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="block break-all border-b border-white/10 pb-2 text-sm font-black leading-6 text-ai-blue hover:text-white">{link.label}</a> : <p key={link.id} className="border-b border-white/10 pb-2 text-sm font-semibold text-white/70">{link.label}</p>
                        ))}
                        {selectedStudioArtifacts.filter(l => l.type !== 'preview').length === 0 && <p className="text-sm font-semibold leading-6 text-white/62">No files or external tools attached yet.</p>}
                      </div>
                      <div className="mt-4 grid gap-2">
                        <select value={studioLinkDraft.type} onChange={(e) => setStudioLinkDraft(prev => ({ ...prev, type: e.target.value }))} className="border-0 border-b border-white/10 bg-transparent px-0 py-2 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-ai-blue/60">
                          {['design', 'repo', 'file', 'access', 'link', 'note'].map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                        <input value={studioLinkDraft.label} onChange={(e) => setStudioLinkDraft(prev => ({ ...prev, label: e.target.value }))} className="border-0 border-b border-white/10 bg-transparent px-0 py-2 text-sm text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60" placeholder="Label" />
                        <input value={studioLinkDraft.url} onChange={(e) => setStudioLinkDraft(prev => ({ ...prev, url: e.target.value }))} className="border-0 border-b border-white/10 bg-transparent px-0 py-2 text-sm text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60" placeholder="URL or reference" />
                        <button type="button" onClick={() => handleCreateStudioLink(selectedProjectRequest.id)} disabled={submitting || (!studioLinkDraft.label.trim() && !studioLinkDraft.url.trim())} className="pt-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:text-white disabled:opacity-40">Add artifact</button>
                      </div>
                    </div>
                    <div className="bg-[#05070a] p-4">
                      <div className="flex items-center gap-3 text-amber-300"><Package className="h-4 w-4" /><p className="text-[9px] font-black uppercase tracking-[0.18em]">Needs</p></div>
                      <div className="mt-3 space-y-2">
                        {[...selectedStudioNeeds, ...selectedOpenStudioBlockers.map(b => b.title)].slice(0, 4).map(need => <p key={need} className="break-words border-b border-white/10 pb-2 text-sm font-semibold leading-6 text-white/76">{need}</p>)}
                        {selectedStudioNeeds.length === 0 && selectedOpenStudioBlockers.length === 0 && <p className="text-sm font-semibold text-expert-green">Nothing blocking production.</p>}
                      </div>
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  <section className="border-y border-white/10 py-4">
                    <div className="flex items-center justify-between gap-4"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-ai-blue">Control desk</p><span className={`text-[9px] font-black uppercase tracking-[0.14em] ${selectedStudioCanOpenReview ? 'text-expert-green' : 'text-amber-300'}`}>{selectedStudioCanOpenReview ? 'Review ready' : 'Preparing'}</span></div>
                    <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
                      <div className="py-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/52">Client communication</p>
                        {selectedLatestClientUpdate ? (
                          <div className="mt-3 border-b border-white/10 pb-3"><p className="text-sm font-semibold leading-6 text-white/82">{selectedLatestClientUpdate.message}</p>{selectedLatestClientUpdate.createdAt && <p className="mt-2 text-[9px] font-black uppercase tracking-[0.14em] text-white/46">{new Date(selectedLatestClientUpdate.createdAt).toLocaleString()}</p>}</div>
                        ) : <p className="mt-3 border-b border-white/10 pb-3 text-sm font-semibold leading-6 text-white/62">No client-facing production update has been published yet.</p>}
                        <textarea value={studioUpdateDraft} onChange={(e) => setStudioUpdateDraft(e.target.value)} className="mt-4 h-24 w-full resize-none border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60" placeholder="Write a short client-facing production update..." />
                        <button type="button" onClick={() => handleCreateStudioUpdate(selectedProjectRequest.id)} disabled={submitting || !studioUpdateDraft.trim()} className="mt-4 text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:text-white disabled:opacity-40">Publish client update</button>
                      </div>
                      <div className="py-4">
                        <div className="flex items-center justify-between gap-4"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/52">Production risks</p><span className={`text-[9px] font-black uppercase tracking-[0.14em] ${selectedOpenStudioBlockers.length ? 'text-amber-300' : 'text-expert-green'}`}>{selectedOpenStudioBlockers.length ? `${selectedOpenStudioBlockers.length} open` : 'Clear'}</span></div>
                        <div className="mt-3 divide-y divide-white/10">
                          {selectedOpenStudioBlockers.map((blocker: StudioBlocker) => (
                            <div key={blocker.id} className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_5rem] sm:items-center"><p className="text-sm font-semibold leading-6 text-white/82">{blocker.title}</p><button type="button" onClick={() => handleUpdateStudioBlocker(selectedProjectRequest.id, blocker.id, { status: 'resolved' })} className="text-left text-[9px] font-black uppercase tracking-[0.14em] text-expert-green sm:text-right">Resolve</button></div>
                          ))}
                          {selectedOpenStudioBlockers.length === 0 && <p className="py-3 text-sm font-semibold text-white/62">No active production risks.</p>}
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_5rem] xl:grid-cols-1">
                          <input value={studioBlockerDraft} onChange={(e) => setStudioBlockerDraft(e.target.value)} className="border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm text-white outline-none transition placeholder:text-white/24 focus:border-amber-300/60" placeholder="Add production risk or blocker..." />
                          <button type="button" onClick={() => handleCreateStudioBlocker(selectedProjectRequest.id)} disabled={submitting || !studioBlockerDraft.trim()} className="py-3 text-left text-[10px] font-black uppercase tracking-[0.14em] text-amber-300 disabled:opacity-40">Add risk</button>
                        </div>
                      </div>
                      <div className="py-4">
                        <div className="flex items-center gap-3"><Folder className="h-4 w-4 text-white/62" /><p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/52">Internal context</p></div>
                        <textarea defaultValue={selectedStudioInternalNote} onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { adminNotes: e.target.value })} className="mt-3 h-20 w-full resize-none border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60" placeholder="Private production context for the team..." />
                      </div>
                    </div>
                    <div className="pt-4">
                      <div className="flex items-center justify-between gap-4"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/52">Review gate</p><span className={`text-[9px] font-black uppercase tracking-[0.14em] ${selectedStudioCanOpenReview ? 'text-expert-green' : 'text-amber-300'}`}>{selectedStudioCanOpenReview ? 'Ready' : 'Not ready'}</span></div>
                      <div className="mt-4 grid gap-2">
                        {selectedReviewChecks.map(item => (
                          <div key={item.label} className="grid gap-3 border-b border-white/10 py-2 sm:grid-cols-[1rem_minmax(0,1fr)_4rem] sm:items-center">
                            <span className={`mt-1 h-2 w-2 rounded-full sm:mt-0 ${item.ready ? 'bg-expert-green' : 'bg-white/24'}`} />
                            <p className="text-sm font-semibold leading-6 text-white/76">{item.label}</p>
                            <span className={`text-left text-[9px] font-black uppercase tracking-[0.14em] sm:text-right ${item.ready ? 'text-expert-green' : 'text-white/42'}`}>{item.ready ? 'Done' : 'Open'}</span>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => handleUpdateProjectRequest(selectedProjectRequest.id, { status: 'staging_review' })} disabled={submitting || !selectedStudioCanOpenReview} className="mt-5 flex min-h-10 w-full items-center justify-between gap-3 border border-ai-blue/25 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:bg-ai-blue/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">Open Review<ChevronRight className="h-4 w-4" /></button>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}

          {/* REVIEW */}
          {selectedAdminBuildChapter.id === 'review' && (
            <div className="border-y border-white/10 py-5">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,0.86fr)_minmax(16rem,0.34fr)]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3"><span className={`inline-flex h-2.5 w-2.5 rounded-full ${selectedReviewStatus === 'approved' ? 'bg-expert-green' : selectedReviewStatus === 'changes_requested' ? 'bg-amber-300' : 'bg-ai-blue'}`} /><p className="text-[9px] font-black uppercase tracking-[0.18em] text-ai-blue">Preview review</p></div>
                  <h4 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">{selectedReviewHeadline}</h4>
                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/58">{selectedReviewIntro}</p>
                </div>
                <div className="border-t border-white/10 pt-5 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/34">Conversation</p>
                  <p className={`mt-2 text-lg font-black tracking-tight ${selectedReviewStatusTone}`}>{selectedReviewStatus === 'changes_requested' ? 'Client note received' : selectedReviewStatus === 'approved' ? 'Approval recorded' : 'Thread open'}</p>
                  <button type="button" onClick={() => setReviewChatOpen(true)} className="mt-5 flex min-h-11 w-full items-center justify-between gap-3 border-y border-ai-blue/30 py-2 text-left text-[10px] font-black uppercase tracking-[0.16em] text-ai-blue transition hover:border-white hover:text-white">
                    <span className="flex items-center gap-3"><MessageSquare className="h-4 w-4" />Review chat</span><span className="text-white/46">{reviewChatMessages.length}</span>
                  </button>
                </div>
              </div>
              {selectedReviewStatus === 'changes_requested' && (
                <section className="mt-6 border-y border-amber-300/20 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3"><MessageSquare className="h-4 w-4 text-amber-300" /><p className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-300">Client changes</p></div>
                      <p className="mt-3 max-w-3xl whitespace-pre-line text-sm font-semibold leading-7 text-white/76">Check the review chat for details of the requested changes.</p>
                    </div>
                    <button type="button" onClick={() => setReviewChatOpen(true)} className="flex min-h-11 shrink-0 items-center justify-between gap-3 border border-amber-300/25 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-amber-300 transition hover:bg-amber-300/10 hover:text-white">Open chat<ChevronRight className="h-4 w-4" /></button>
                  </div>
                </section>
              )}
              <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_15rem]">
                <div className="grid gap-5">
                  <div><label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Preview link</label><input type="url" defaultValue={selectedProjectRequest.stagingUrl || ''} onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { stagingUrl: e.target.value })} className="w-full border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60" placeholder="https://preview..." /></div>
                  <div><label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Review note to client</label><textarea defaultValue={selectedProjectRequest.stagingNotes || ''} onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { stagingNotes: e.target.value })} className="h-24 w-full resize-none border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60" placeholder="Tell the client what to inspect in the preview..." /></div>
                </div>
                <div className="border-t border-white/10 pt-5 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/34">Next move</p>
                  <p className={`mt-2 text-lg font-black tracking-tight ${selectedReviewStatusTone}`}>{selectedReviewCanMoveForward ? 'Open handoff' : selectedReviewStatus === 'changes_requested' ? 'Update preview' : 'Await client'}</p>
                  {selectedReviewStatus === 'changes_requested' ? (
                    <button type="button" onClick={() => handleUpdateProjectRequest(selectedProjectRequest.id, { status: 'in_development', stagingReviewStatus: 'changes_requested' })} disabled={submitting} className="mt-5 flex min-h-11 w-full items-center justify-between gap-3 border border-amber-300/25 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-amber-300 transition hover:bg-amber-300/10 hover:text-white disabled:opacity-45">Return to Studio<ChevronRight className="h-4 w-4" /></button>
                  ) : (
                    <button type="button" onClick={() => handleUpdateProjectRequest(selectedProjectRequest.id, { status: 'handoff' })} disabled={submitting || !selectedReviewCanMoveForward} className={`mt-5 flex min-h-11 w-full items-center justify-between gap-3 border px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] transition disabled:cursor-not-allowed ${selectedReviewCanMoveForward ? 'border-expert-green/25 text-expert-green hover:bg-expert-green/10 hover:text-white' : 'border-white/10 text-white/34'}`}>{selectedReviewCanMoveForward ? 'Move to handoff' : 'Waiting approval'}<ChevronRight className="h-4 w-4" /></button>
                  )}
                </div>
              </div>

              {reviewChatOpen && (
                <div className="fixed inset-x-0 bottom-0 z-[90] flex h-[100dvh] flex-col border-t border-white/10 bg-[#05070a] shadow-2xl sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[540px] sm:w-[410px] sm:border sm:shadow-black/50">
                  <div className="flex min-h-16 items-center justify-between gap-3 border-b border-white/10 bg-ai-blue px-4 text-white">
                    <div><p className="text-sm font-black tracking-tight">Review chat</p><p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/72">{reviewChatLoading ? 'Loading thread' : `${reviewChatMessages.length} message${reviewChatMessages.length === 1 ? '' : 's'}`}</p></div>
                    <button type="button" onClick={() => setReviewChatOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-black text-white/80 transition hover:bg-white/10 hover:text-white" aria-label="Close review chat"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="flex-1 space-y-4 overflow-y-auto bg-black/35 p-4">
                    {reviewChatMessages.length ? reviewChatMessages.map(message => {
                      const isAdminMessage = message.senderRole === 'admin';
                      return (
                        <div key={message.id} className={`flex ${isAdminMessage ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[84%] ${isAdminMessage ? 'text-right' : 'text-left'}`}>
                            <div className={`inline-block rounded-2xl px-4 py-3 text-sm font-semibold leading-6 ${isAdminMessage ? 'rounded-tr-sm bg-ai-blue text-white' : 'rounded-tl-sm border border-white/10 bg-white/[0.06] text-white/78'}`}>
                              <p className="whitespace-pre-line">{message.message}</p>
                              <p className={`mt-1 text-[9px] font-black uppercase tracking-[0.12em] ${isAdminMessage ? 'text-white/65' : 'text-white/35'}`}>{isAdminMessage ? 'Admin' : 'Client'} - {new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                            </div>
                            {Array.isArray(message.choices) && message.choices.length > 0 && (
                              <div className={`mt-3 flex flex-wrap gap-2 ${isAdminMessage ? 'justify-end' : 'justify-start'}`}>{message.choices.map(choice => <span key={choice} className="rounded-full border border-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/48">{choice}</span>)}</div>
                            )}
                          </div>
                        </div>
                      );
                    }) : <div className="flex h-full items-center justify-center text-center"><p className="max-w-xs text-sm font-semibold leading-6 text-white/50">Start a direct review conversation with the client.</p></div>}
                  </div>
                  <div className="border-t border-white/10 bg-[#05070a] p-4">
                    <textarea value={reviewChatDraft} onChange={(e) => setReviewChatDraft(e.target.value)} rows={2} className="max-h-28 min-h-12 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60" placeholder="Write to the client about this review..." />
                    <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <input value={reviewChatChoiceDraft} onChange={(e) => setReviewChatChoiceDraft(e.target.value)} className="w-full border-0 border-b border-white/10 bg-transparent px-0 py-2 text-xs font-semibold text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue/60" placeholder="Optional choices, comma separated" />
                      <button type="button" onClick={handleSendAdminReviewChat} disabled={reviewChatSending || (!reviewChatDraft.trim() && !reviewChatChoiceDraft.trim())} className="flex min-h-11 items-center justify-between gap-3 border border-ai-blue/30 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:bg-ai-blue/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-36">{reviewChatSending ? 'Sending' : reviewChatChoiceDraft.trim() ? 'Send question' : 'Send message'}<Send className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LAUNCH */}
          {selectedAdminBuildChapter.id === 'launch' && (
            <div className="border-y border-expert-green/25 py-6 md:py-8">
              {/* Hero row */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3"><span className="inline-flex h-2.5 w-2.5 rounded-full bg-expert-green" /><p className="text-[9px] font-black uppercase tracking-[0.18em] text-expert-green">Launch room</p></div>
                  <h4 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">{selectedProjectRequest.status === 'completed' ? 'Build completed' : selectedProjectRequest.status === 'handoff' ? 'Handoff in progress' : 'Live build is ready'}</h4>
                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/58">{selectedProjectRequest.status === 'completed' ? 'This build is closed and fully paid. Reopen to handoff if anything still needs attention.' : selectedProjectRequest.status === 'handoff' ? 'Share the live delivery and wait for client acceptance. Final balance is handled in the closeout step.' : 'The build is live. Share the link and handoff notes when the client is ready to review.'}</p>
                </div>
                <div className="border border-white/10 bg-white/[0.02] p-5">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/34">Launch state</p>
                  <p className="mt-2 text-lg font-black tracking-tight text-expert-green">{selectedProjectRequest.status === 'completed' ? 'Closed' : selectedProjectRequest.status === 'handoff' ? 'Client handoff' : 'Live'}</p>
                  {selectedProjectRequest.launchUrl && <a href={selectedProjectRequest.launchUrl} target="_blank" rel="noreferrer" className="mt-4 flex min-h-11 w-full items-center justify-between gap-3 border border-expert-green/25 px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.16em] text-expert-green transition hover:border-expert-green hover:bg-expert-green/10 hover:text-white">Open live build<ExternalLink className="h-4 w-4 shrink-0" /></a>}
                </div>
              </div>

              {/* Content row */}
              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
                {/* Delivery details card */}
                <div className="divide-y divide-white/10 border border-white/10 bg-white/[0.02]">
                  <div className="p-5">
                    <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Live URL</label>
                    <input type="url" defaultValue={selectedProjectRequest.launchUrl || ''} onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { launchUrl: e.target.value })} className="w-full bg-transparent text-sm font-semibold text-white outline-none transition placeholder:text-white/24" placeholder="https://live..." />
                  </div>
                  <div className="p-5">
                    <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Launch note</label>
                    <textarea defaultValue={selectedProjectRequest.launchNotes || ''} onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { launchNotes: e.target.value })} className="h-20 w-full resize-none bg-transparent text-sm leading-6 text-white outline-none transition placeholder:text-white/24" placeholder="What should the client know about the live build?" />
                  </div>
                  <div className="p-5">
                    <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Handoff</label>
                    <textarea defaultValue={selectedProjectRequest.handoffNotes || ''} onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { handoffNotes: e.target.value })} className="h-20 w-full resize-none bg-transparent text-sm leading-6 text-white outline-none transition placeholder:text-white/24" placeholder="Add your response or resolution notes here..." />
                  </div>
                </div>

                {/* Dynamic status column */}
                <div className="flex flex-col gap-6">
                  {selectedProjectRequest.status === 'handoff' && (selectedProjectRequest.handoffIssuesReportedAt || selectedProjectRequest.completionAcknowledgedAt) && (
                    <div className="border border-ai-blue/20 bg-white/[0.02]">
                      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-ai-blue">Handoff discussion</p>
                        <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.12em] text-white/30">{handoffChatLoading ? 'Loading' : `${handoffChatMessages.length} msg${handoffChatMessages.length === 1 ? '' : 's'}`}</span>
                      </div>
                      <div className="max-h-64 space-y-3 overflow-y-auto px-5 py-4">
                        {handoffChatMessages.length ? handoffChatMessages.map(message => {
                          const isAdminMessage = message.senderRole === 'admin';
                          return (
                            <div key={message.id} className={`flex ${isAdminMessage ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[88%] rounded-xl px-3 py-2 text-xs font-semibold leading-5 ${isAdminMessage ? 'rounded-tr-sm bg-ai-blue text-white' : 'rounded-tl-sm border border-white/10 bg-white/[0.06] text-white/78'}`}>
                                <p className="whitespace-pre-line">{message.message}</p>
                                <p className={`mt-1 text-[8px] font-black uppercase tracking-[0.1em] ${isAdminMessage ? 'text-white/65' : 'text-white/35'}`}>{isAdminMessage ? 'You' : 'Client'} - {new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                              </div>
                            </div>
                          );
                        }) : <p className="py-4 text-center text-xs font-semibold leading-5 text-white/46">No handoff messages yet.</p>}
                      </div>
                      <div className="border-t border-white/10 p-4">
                        <textarea value={handoffChatDraft} onChange={(e) => setHandoffChatDraft(e.target.value)} rows={2} className="w-full resize-none bg-transparent text-sm text-white outline-none transition placeholder:text-white/24" placeholder="e.g. Are you happy with the handoff?" />
                        <button type="button" onClick={() => handleSendAdminHandoffChat(selectedProjectRequest.id)} disabled={handoffChatSending || !handoffChatDraft.trim()} className="mt-2 inline-flex min-h-9 w-full items-center justify-between gap-2 border border-ai-blue/25 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:bg-ai-blue/10 hover:text-white disabled:opacity-40">
                          {handoffChatSending ? 'Sending' : 'Send'}<Send className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedProjectRequest.status === 'handoff' && selectedProjectRequest.completionAcknowledgedAt && !selectedProjectRequest.handoffIssuesReportedAt && (
                    <div className="border border-expert-green/20 bg-white/[0.02]">
                      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4 text-expert-green"><Check className="h-4 w-4 shrink-0" /><p className="text-[9px] font-black uppercase tracking-[0.16em]">Client accepted handoff</p></div>

                      <div className="grid grid-cols-4 gap-1.5 px-5 pt-4">
                        {[
                          { label: 'Delivered', done: true },
                          { label: 'Accepted', done: true },
                          { label: 'Paid', done: selectedAgreementBalance <= 0 || Boolean(selectedProjectRequest.finalPaymentConfirmedAt) },
                          { label: 'Closed', done: false },
                        ].map(step => (
                          <div key={step.label} className="min-w-0">
                            <div className={`h-1 w-full ${step.done ? 'bg-expert-green' : 'bg-white/10'}`} />
                            <p className={`mt-2 truncate text-[8px] font-black uppercase tracking-[0.1em] ${step.done ? 'text-expert-green' : 'text-white/30'}`}>{step.label}</p>
                          </div>
                        ))}
                      </div>

                      <div className="px-5 pb-5 pt-5">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/34">Closeout</p>
                        <div className="mt-3 space-y-2 border-y border-white/10 py-4">
                          <div className="flex items-center justify-between gap-4"><span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/28">Total agreed</span><span className="text-[10px] font-black uppercase tracking-[0.12em] text-white/70">{selectedAgreementTotalLabel}</span></div>
                          <div className="h-1.5 w-full bg-white/10"><div className="h-full bg-expert-green" style={{ width: `${selectedAgreementTotal > 0 ? Math.min(100, Math.round((selectedAgreementDueNow / selectedAgreementTotal) * 100)) : 0}%` }} /></div>
                          <div className="flex items-center justify-between gap-4 text-[9px] font-black uppercase tracking-[0.12em] text-white/40">
                            <span>{selectedAgreementDueNowLabel} deposit</span>
                            <span className={selectedAgreementBalance <= 0 ? 'text-expert-green' : 'text-amber-300'}>{selectedAgreementBalanceLabel} left</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 pt-1">
                            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/28">Final payment</span>
                            <span className={`text-[10px] font-black uppercase tracking-[0.12em] ${selectedAgreementBalance <= 0 || selectedProjectRequest.finalPaymentConfirmedAt ? 'text-expert-green' : 'text-amber-300'}`}>{selectedAgreementBalance <= 0 ? 'Not owed' : selectedProjectRequest.finalPaymentConfirmedAt ? 'Received' : 'Pending'}</span>
                          </div>
                        </div>
                        <button type="button" onClick={() => handleUpdateProjectRequest(selectedProjectRequest.id, { status: 'completed' })} disabled={submitting || (selectedAgreementBalance > 0 && !selectedProjectRequest.finalPaymentConfirmedAt)} className="mt-4 flex min-h-11 w-full items-center justify-between gap-3 border border-expert-green/25 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-expert-green transition hover:bg-expert-green/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">Close build<ChevronRight className="h-4 w-4 shrink-0" /></button>
                      </div>
                    </div>
                  )}

                  {selectedProjectRequest.status === 'handoff' && !selectedProjectRequest.completionAcknowledgedAt && !selectedProjectRequest.handoffIssuesReportedAt && (
                    <div className="border border-amber-300/20 bg-white/[0.02] p-5">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/34">Closeout</p>
                      <div className="mt-3 space-y-3 border-y border-white/10 py-4">
                        {[{ label: 'Total agreed', value: selectedAgreementTotalLabel, tone: 'text-white/70' }, { label: 'Deposit paid', value: selectedAgreementDueNowLabel, tone: 'text-expert-green' }, { label: 'Remaining balance', value: selectedAgreementBalanceLabel, tone: selectedAgreementBalance <= 0 ? 'text-expert-green' : 'text-amber-300' }].map(item => (
                          <div key={item.label} className="flex items-center justify-between gap-4"><span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/28">{item.label}</span><span className={`text-[10px] font-black uppercase tracking-[0.12em] ${item.tone}`}>{item.value}</span></div>
                        ))}
                      </div>
                      <textarea defaultValue={selectedProjectRequest.completionNotes || ''} onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { completionNotes: e.target.value })} className="mt-4 h-16 w-full resize-none border border-white/10 bg-transparent px-3 py-2 text-sm leading-6 text-white outline-none transition placeholder:text-white/24 focus:border-amber-300/40" placeholder="Notes for closeout (optional, can add now or later)..." />
                      <div className="mt-4 flex items-center gap-2 text-amber-300">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <p className="text-[10px] font-black uppercase tracking-[0.14em]">Waiting on client to accept handoff</p>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-white/46">Closeout and final payment open once the client accepts. If they flag an issue instead, it'll show here as a discussion thread.</p>
                    </div>
                  )}

                  {selectedProjectRequest.status === 'completed' && (
                    <div className="border border-expert-green/20 bg-white/[0.02] p-5">
                      <div className="flex items-center gap-2 text-expert-green"><Check className="h-4 w-4 shrink-0" /><p className="text-[9px] font-black uppercase tracking-[0.16em]">Build closed</p></div>
                      <div className="mt-4 space-y-3 border-y border-white/10 py-4">
                        {[{ label: 'Total agreed', value: selectedAgreementTotalLabel }, { label: 'Deposit paid', value: selectedAgreementDueNowLabel }, { label: 'Final balance', value: selectedAgreementBalance <= 0 ? 'Settled' : selectedAgreementBalanceLabel }].map(item => (
                          <div key={item.label} className="flex items-center justify-between gap-4"><span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/28">{item.label}</span><span className="text-[10px] font-black uppercase tracking-[0.12em] text-expert-green">{item.value}</span></div>
                        ))}
                      </div>
                      <button type="button" onClick={() => handleUpdateProjectRequest(selectedProjectRequest.id, { status: 'handoff' })} disabled={submitting} className="mt-4 flex min-h-10 w-full items-center justify-between gap-3 border border-white/10 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-white/50 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-45">Reopen to handoff<ChevronRight className="h-4 w-4 shrink-0" /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SIDE PANEL (decision panel) */}
        <aside className={`border-t border-white/10 px-5 py-6 ${selectedAdminBuildChapter.id === 'brief' ? 'lg:px-8' : 'xl:border-t-0 xl:px-6'}`}>
          {selectedAdminBuildChapter.id === 'brief' && (
            selectedClientResponseReceived ? (
              <div className="border-t border-white/10 pt-5">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.75fr)] xl:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-expert-green">Brief decision</p>
                      <span className="border border-expert-green/25 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-expert-green">{isBriefApprovedForScope ? 'Scope open' : 'Client responded'}</span>
                    </div>
                    <h4 className="mt-3 text-2xl font-black tracking-tight text-white">{isBriefApprovedForScope ? 'Brief approved' : 'Ready for Scope?'}</h4>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-white/50">{isBriefApprovedForScope ? 'Scope is open. The next step is preparing the scope and quote for the client.' : 'Approve only when the brief has enough content, pages, features, audience, budget, and timeline direction for Scope.'}</p>
                  </div>
                  <div className="grid gap-4">
                    <div><label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/30">More detail note</label><textarea value={briefClarificationMessage} onChange={(e) => setBriefClarificationMessage(e.target.value)} className="h-24 w-full resize-none border border-white/10 bg-black px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-amber-300/50" placeholder="Only needed if you are requesting more detail..." /></div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button type="button" onClick={handleRequestBriefMoreDetails} disabled={submitting || isBriefApprovedForScope} className="min-h-11 border border-amber-300/25 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-amber-300 transition hover:bg-amber-300/10 hover:text-white disabled:opacity-50">Request more details</button>
                      <button type="button" onClick={() => handleUpdateProjectRequest(selectedProjectRequest.id, { status: 'quote_ready', clientNotes: 'Your brief has been approved for scoping. The scope and quote will be prepared next.' })} disabled={submitting || isBriefApprovedForScope} className="min-h-11 border border-expert-green/25 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-expert-green transition hover:bg-expert-green/10 hover:text-white disabled:opacity-50">{isBriefApprovedForScope ? 'Scope is open' : 'Approve and open Scope'}</button>
                    </div>
                  </div>
                </div>
                {briefDecisionMessage && <p className={`mt-4 text-xs font-semibold leading-5 ${briefDecisionMessage.type === 'success' ? 'text-expert-green' : 'text-red-300'}`}>{briefDecisionMessage.text}</p>}
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
                <div className="border-y border-white/10 py-4">
                  <div className="flex items-start justify-between gap-4"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/32">Missing items</p><span className="shrink-0 text-[10px] font-black uppercase tracking-[0.14em] text-white/34">{briefMissingItems.length}</span></div>
                  {briefMissingItems.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">{briefMissingItems.map(item => <button key={item} type="button" onClick={() => setBriefMissingItems(prev => prev.filter(v => v !== item))} className="min-h-9 border border-white/28 bg-white/[0.04] px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-white/[0.07]">{item} needed</button>)}</div>
                  ) : <p className="mt-3 text-sm font-semibold text-white/40">No missing items marked.</p>}
                  <div className="mt-4 grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-4">
                    {briefMissingOptions.filter(item => !briefMissingItems.includes(item)).map(item => <button key={item} type="button" onClick={() => setBriefMissingItems(prev => [...prev, item])} className="min-h-8 min-w-0 truncate border border-white/10 px-3 py-2 text-left text-[9px] font-black uppercase tracking-[0.12em] text-white/40 transition hover:bg-white/[0.04] hover:text-white/80">Add {item}</button>)}
                  </div>
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
                  <div><label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Client note</label><textarea value={briefClarificationMessage} onChange={(e) => setBriefClarificationMessage(e.target.value)} className="h-32 w-full resize-none border border-white/10 bg-black px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-white/30" placeholder="What should the client clarify?" /></div>
                  <div className="border-y border-white/10 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/32">Brief decision</p><p className="mt-2 text-lg font-black tracking-tight text-white">{briefReviewStatus}</p></div>
                      <span className={`border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] ${isBriefApprovedForScope ? 'border-white/20 text-white' : 'border-white/10 text-white/36'}`}>{isBriefApprovedForScope ? 'Scope unlocked' : 'Waiting approval'}</span>
                    </div>
                    <p className="mt-3 text-xs leading-6 text-white/44">Send the client back for missing details, or approve the brief and open Scope.</p>
                    <div className="mt-5 grid gap-2">
                      <button type="button" onClick={handleRequestBriefMoreDetails} disabled={submitting} className="min-h-10 border border-white/10 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-white/62 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-50">Send clarification request</button>
                      <button type="button" onClick={() => handleUpdateProjectRequest(selectedProjectRequest.id, { status: 'quote_ready', clientNotes: selectedProjectRequest.clientNotes || 'Your brief has been approved for scoping. The scope and quote will be prepared next.' })} disabled={submitting} className="min-h-10 border border-white/20 bg-white/[0.035] px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.08] disabled:opacity-50">Approve and open Scope</button>
                    </div>
                    {briefDecisionMessage && <p className={`mt-3 text-xs font-semibold leading-5 ${briefDecisionMessage.type === 'success' ? 'text-expert-green' : 'text-red-300'}`}>{briefDecisionMessage.text}</p>}
                  </div>
                </div>
              </div>
            )
          )}

          {selectedAdminBuildChapter.id === 'scope' && (
            <div className="space-y-5">
              <div className={`border-y py-4 ${isScopeAccepted ? 'border-expert-green/25' : 'border-white/10'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-[9px] font-black uppercase tracking-[0.18em] ${isScopeAccepted ? 'text-expert-green' : 'text-amber-300'}`}>{isScopeAccepted ? 'Scope complete' : 'Scope offer'}</p>
                    <p className="mt-2 text-xs leading-6 text-white/46">{isScopeAccepted ? 'The client accepted the offer. Prepare the payment request next.' : 'Prepare the price, boundaries, and next client decision.'}</p>
                  </div>
                  <span className={`shrink-0 text-right text-[10px] font-black uppercase tracking-[0.14em] ${isScopeAccepted ? 'text-expert-green' : 'text-amber-300'}`}>{selectedProjectRequest.status === 'approved' ? 'Accepted' : hasScopeDiscussionRequest ? 'Client replied' : 'Draft'}</span>
                </div>
              </div>
              {!isScopeAccepted && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Quote amount</label><input type="number" defaultValue={selectedProjectRequest.quotedAmount || ''} onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { quotedAmount: e.target.value, status: selectedProjectRequest.status === 'submitted' || selectedProjectRequest.status === 'in_review' ? 'quote_ready' : selectedProjectRequest.status })} className="w-full border border-white/10 bg-black px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-amber-300/50" placeholder="0" /></div>
                  <div><label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Currency</label><input type="text" defaultValue={selectedProjectRequest.quoteCurrency || selectedProjectRequest.user?.defaultCurrency || 'USD'} onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { quoteCurrency: e.target.value || selectedProjectRequest.user?.defaultCurrency || 'USD' })} className="w-full border border-white/10 bg-black px-4 py-3 text-sm font-semibold uppercase text-white outline-none transition focus:border-amber-300/50" /></div>
                  <div className="sm:col-span-2"><label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Scope message to client</label><textarea value={scopeClientNote} onChange={(e) => setScopeClientNote(e.target.value)} className="h-28 w-full resize-none border border-white/10 bg-black px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-amber-300/50" placeholder="Write what changed, what the client should review, and the next decision..." /></div>
                </div>
              )}
              <div className="border-t border-white/10 pt-4">
                <div className="mb-4">
                  <p className={`text-[9px] font-black uppercase tracking-[0.18em] ${isScopeAccepted ? 'text-expert-green' : isScopeSentToClient ? 'text-ai-blue' : 'text-amber-300'}`}>{isScopeAccepted ? 'Agreement ready' : isScopeSentToClient ? 'Scope sent' : hasScopeDiscussionRequest ? 'Revise scope' : 'Scope ready'}</p>
                  <p className="mt-2 text-xs leading-6 text-white/46">{isScopeAccepted ? 'Scope is approved. Set payment terms, deposit, and instructions in the next step.' : isScopeSentToClient ? 'Waiting for the client to review the offer and price.' : hasScopeDiscussionRequest ? 'Send the revised offer back to the client.' : 'Send the offer, price, and delivery terms to the client.'}</p>
                </div>
                <button type="button" onClick={() => { if (isScopeAccepted) { setActiveAdminBuildChapter('agreement'); return; } handleSendScopeToClient(); }} disabled={submitting} className={`min-h-11 w-full border px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] transition disabled:opacity-45 ${isScopeAccepted ? 'border-expert-green/25 text-expert-green hover:bg-expert-green/10 hover:text-white' : isScopeSentToClient ? 'border-ai-blue/25 text-ai-blue hover:bg-ai-blue/10 hover:text-white' : 'border-amber-300/25 text-amber-300 hover:bg-amber-300/10 hover:text-white'}`}>{isScopeAccepted ? 'Open agreement setup' : isScopeSentToClient || hasScopeDiscussionRequest ? 'Send updated scope' : 'Send scope'}</button>
              </div>
            </div>
          )}

          {selectedAdminBuildChapter.id === 'agreement' && (
            <div className="border-y border-white/10">
              <div className="py-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className={`grid h-12 w-12 shrink-0 place-items-center ${isAgreementConfirmed ? 'text-expert-green' : isAgreementSent ? 'text-amber-300' : 'text-white/42'}`}>{isAgreementConfirmed ? <Check className="h-8 w-8" /> : <CircleDollarSign className="h-8 w-8" />}</div>
                    <div className="min-w-0">
                      <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${isAgreementConfirmed ? 'text-expert-green' : isAgreementSent ? 'text-amber-300' : 'text-white/42'}`}>{isAgreementConfirmed ? 'Deposit paid' : isAgreementSent ? 'Deposit pending' : 'Deposit not sent'}</p>
                      <h4 className="mt-2 text-3xl font-black tracking-tight text-white">{selectedAgreementDueNowLabel}</h4>
                      {isAgreementConfirmed ? <p className="mt-2 text-sm font-semibold leading-6 text-white/54">Build is ready to open.</p> : !isAgreementSent && <p className="mt-2 text-sm font-semibold leading-6 text-white/48">Prepare and send the payment request to the client.</p>}
                    </div>
                  </div>
                  {isAgreementConfirmed && <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/34 lg:text-right lg:min-w-64">Verified {selectedPaymentConfirmedAt || 'Confirmed'} - Paystack</p>}
                </div>
                <div className="mt-7 grid gap-4 border-y border-white/10 py-5 md:grid-cols-4">
                  {[{ label: 'Total', value: selectedAgreementTotalLabel }, { label: 'Deposit', value: selectedAgreementDueNowLabel }, { label: 'Balance', value: selectedAgreementBalanceLabel }, { label: 'Due', value: agreementDraft.paymentDueDate ? new Date(agreementDraft.paymentDueDate).toLocaleDateString() : 'Not set' }].map(item => (
                    <div key={item.label} className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">{item.label}</p><p className="mt-1 truncate text-sm font-black capitalize text-white/76">{item.value}</p></div>
                  ))}
                </div>
                {isAgreementConfirmed && (
                  <div className="mt-6 grid gap-4 border-b border-white/10 pb-5 md:grid-cols-3">
                    {[{ label: 'Reference', value: selectedPaymentReference || 'Captured', tone: 'text-white/72' }, { label: 'Terms', value: selectedAgreementTypeLabel, tone: 'text-white/72' }, { label: 'Build gate', value: 'Ready to open', tone: 'text-amber-200' }].map(item => (
                      <div key={item.label} className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">{item.label}</p><p className={`mt-1 truncate text-sm font-black ${item.tone}`}>{item.value}</p></div>
                    ))}
                  </div>
                )}
                <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
                  {!isAgreementConfirmed ? (
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div><label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Payment model</label>
                        <select value={agreementDraft.paymentAgreementType} onChange={(e) => setAgreementDraft(prev => ({ ...prev, paymentAgreementType: e.target.value }))} className="w-full border-0 border-b border-white/10 bg-transparent px-0 py-3 text-[10px] font-black uppercase tracking-widest text-white outline-none transition focus:border-expert-green/60">
                          <option value="">Select terms</option><option value="deposit">Deposit payment</option><option value="full_payment">Full payment</option><option value="milestone_payments">Milestone payments</option>
                        </select>
                      </div>
                      <div><label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Due date</label><input type="date" value={agreementDraft.paymentDueDate} onChange={(e) => setAgreementDraft(prev => ({ ...prev, paymentDueDate: e.target.value }))} className="w-full border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm font-semibold text-white outline-none transition focus:border-expert-green/60" /></div>
                      <div><label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Total agreed</label><input type="number" value={agreementDraft.totalAgreedAmount} onChange={(e) => setAgreementDraft(prev => ({ ...prev, totalAgreedAmount: e.target.value }))} className="w-full border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm font-semibold text-white outline-none transition focus:border-expert-green/60" placeholder="0" /></div>
                      <div><label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Deposit required</label><input type="number" value={agreementDraft.depositAmount} onChange={(e) => setAgreementDraft(prev => ({ ...prev, depositAmount: e.target.value }))} className="w-full border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm font-semibold text-white outline-none transition focus:border-expert-green/60" placeholder="0" /></div>
                      <div className="sm:col-span-2"><label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Client payment note</label><textarea value={selectedAgreementNote} onChange={(e) => setAgreementDraft(prev => ({ ...prev, paymentInstructions: e.target.value }))} className="h-24 w-full resize-none border-0 border-b border-white/10 bg-transparent px-0 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/24 focus:border-expert-green/60" placeholder="Explain what the payment covers and what happens after checkout..." /></div>
                    </div>
                  ) : <div className="hidden xl:block" />}
                  <div className="space-y-3">
                    {!isAgreementConfirmed && isAgreementSent && !isAgreementDraftDirty ? (
                      <div className="flex min-h-12 items-center justify-between gap-3 border border-amber-300/20 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-amber-300"><span className="flex items-center gap-2"><Check className="h-4 w-4" /> Payment request sent</span></div>
                    ) : !isAgreementConfirmed ? (
                      <button type="button" onClick={handleSendAgreementPaymentRequest} disabled={submitting || isAgreementConfirmed} className="flex min-h-12 w-full items-center justify-between gap-3 border border-expert-green/25 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-expert-green transition hover:bg-expert-green/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-45">
                        <span className="flex items-center gap-2"><Send className="h-4 w-4" />{isAgreementSent ? 'Send updated payment request' : 'Send payment request'}</span><ChevronRight className="h-4 w-4" />
                      </button>
                    ) : null}
                    <button type="button" onClick={() => handleUpdateProjectRequest(selectedProjectRequest.id, { status: 'in_development' })} disabled={submitting || !isAgreementConfirmed} className="flex min-h-12 w-full items-center justify-between gap-3 border border-ai-blue/30 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:bg-ai-blue/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
                      <span>{isAgreementConfirmed ? 'Proceed to Build' : 'Build opens after deposit'}</span><ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(selectedAdminBuildChapter.id === 'build' || selectedAdminBuildChapter.id === 'review' || selectedAdminBuildChapter.id === 'launch') && (
            <div className="border border-white/10 bg-white/[0.02] p-5">
              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Internal note</label>
              <textarea defaultValue={selectedProjectRequest.adminNotes || ''} onBlur={(e) => handleUpdateProjectRequest(selectedProjectRequest.id, { adminNotes: e.target.value })} className="h-28 w-full resize-none border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-ai-blue/50" placeholder="Private admin note..." />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}