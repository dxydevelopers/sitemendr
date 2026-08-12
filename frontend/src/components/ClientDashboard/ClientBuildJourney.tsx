// components/client-dashboard/ClientBuildJourney.tsx
//
// The "projects" tab: project list, then per-project the full
// brief -> scope -> agreement -> build -> review -> launch journey.
// This was the single largest block inside the old ClientDashboard.tsx.
//
// NOTE while porting: the original file contained several JSX blocks
// that were never reachable (wrapped in `className="hidden"` or
// `{false && ...}` conditions - e.g. a whole duplicate brief-answers
// table and a duplicate review-chat panel). Those are dropped here
// since they never rendered in the first place. Everything that could
// actually render has been preserved.

'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ArrowLeft, ChevronRight, Sparkles, Clock, Check, TriangleAlert, MessageSquare,
  CircleDollarSign, ExternalLink, Send, Loader2, CreditCard, X, Globe,
} from 'lucide-react';
import type { ClientProject, ReviewChatMessage } from './ClientDashboard_types';
import {
  buildLifecycle, buildJourneyChapters, normalizeBuildStatus, requestStatuses,
  formatCurrencyAmount, getPaystackChannelsForCurrency, agreementPaymentMethods,
} from './utils';
import type { UseClientDashboardReturn } from './useClientDashboard';

interface ClientBuildJourneyProps {
  dashboard: UseClientDashboardReturn;
  onStartRequest: () => void;
}

export default function ClientBuildJourney({ dashboard, onStartRequest }: ClientBuildJourneyProps) {
  const {
    projects, selectedProjectId, setSelectedProjectId, activeBuildChapter, setActiveBuildChapter,
    user, quoteMessage, setQuoteMessage, quoteSubmitting, handleQuoteResponse,
    paymentSubmitting, showAgreementPaymentMethods, setShowAgreementPaymentMethods,
    selectedAgreementPaymentMethod, setSelectedAgreementPaymentMethod, handleAgreementPayment,
    briefResponseAnswers, setBriefResponseAnswers, briefResponseSubmitting, briefResponseFeedback,
    handleBriefClarificationResponse, stagingReviewMessage, setStagingReviewMessage,
    stagingReviewSubmitting, handleStagingReviewResponse, reviewChatOpen, setReviewChatOpen,
    reviewChatMessages, reviewChatUnreadCount, reviewChatDraft, setReviewChatDraft,
    reviewChatLoading, reviewChatSending, handleSendClientReviewChat, handoffMessage,
    setHandoffMessage, handoffMessageError, setHandoffMessageError, handoffSubmitting,
    handoffSubmittingAction, handleHandoffResponse, handleViewAssessment,
    handoffChatStarted, handoffChatMessages, handoffChatDraft, setHandoffChatDraft,
    handoffChatLoading, handoffChatSending, handleOpenHandoffChat, handleSendClientHandoffChat,
    finalPaymentSubmitting, handleFinalBalancePayment,
  } = dashboard;

  const averageProgress = projects.length
    ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
    : 0;

  const getLifecycleIndex = (project?: ClientProject | null) =>
    Math.max(0, buildLifecycle.findIndex(step => step.status === normalizeBuildStatus(project?.status)));
  const isProjectRequest = (project?: ClientProject | null) =>
    Boolean(project && (project.recordType === 'request' || requestStatuses.includes(project.status)));

  const selectedProjectRecord = selectedProjectId
    ? projects.find(p => p.id === selectedProjectId) || null
    : projects[0] || null;
  const currentBuildRecord = selectedProjectRecord || projects[0] || null;
  const currentBuildStatus = normalizeBuildStatus(currentBuildRecord?.status);
  const currentBuildPlanLabel = currentBuildRecord?.planType?.replace(/_/g, ' ') || 'Custom build';
  const currentBuildSubmittedLabel = currentBuildRecord?.createdAt
    ? new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(currentBuildRecord.createdAt))
    : 'Recently submitted';
  const currentLifecycleIndex = Math.max(0, buildLifecycle.findIndex(step => step.status === currentBuildStatus));
  const defaultBuildChapter = buildJourneyChapters.find(c => c.statuses.includes(currentBuildStatus)) || buildJourneyChapters[0];
  const defaultBuildChapterIndex = Math.max(0, buildJourneyChapters.findIndex(c => c.id === defaultBuildChapter.id));
  const requestedBuildChapter = buildJourneyChapters.find(c => c.id === activeBuildChapter);
  const requestedBuildChapterIndex = requestedBuildChapter ? buildJourneyChapters.findIndex(c => c.id === requestedBuildChapter.id) : -1;
  const selectedBuildChapter = requestedBuildChapter && (requestedBuildChapterIndex <= defaultBuildChapterIndex || currentBuildStatus === 'completed')
    ? requestedBuildChapter : defaultBuildChapter;
  const selectedBuildChapterIndex = Math.max(0, buildJourneyChapters.findIndex(c => c.id === selectedBuildChapter.id));
  const nextBuildChapter = buildJourneyChapters[Math.min(selectedBuildChapterIndex + 1, buildJourneyChapters.length - 1)];
  const buildPageProgress = Math.round(((defaultBuildChapterIndex + 1) / buildJourneyChapters.length) * 100);

  const hasScopeProposal = Boolean(currentBuildRecord?.quotedAmount) || [
    'quote_ready', 'approved', 'payment_agreement', 'in_development', 'staging_review', 'launched', 'handoff', 'completed',
  ].includes(currentBuildStatus);
  const scopeClientNotesLower = currentBuildRecord?.clientNotes?.toLowerCase() || '';
  const hasScopeDiscussion = currentBuildStatus === 'quote_ready' && scopeClientNotesLower.includes('client wants to discuss the quote');
  const isScopeApproved = ['approved', 'payment_agreement', 'in_development', 'staging_review', 'launched', 'handoff', 'completed'].includes(currentBuildStatus);
  const scopeDecisionLabel = currentBuildStatus === 'quote_ready'
    ? hasScopeDiscussion ? 'Discussion sent' : 'Awaiting decision'
    : isScopeApproved ? 'Scope approved' : 'Client review';

  const paymentAgreementStatusLabel = currentBuildRecord?.paymentAgreementStatus === 'confirmed'
    ? 'Deposit paid' : currentBuildRecord?.paymentAgreementStatus === 'sent' ? 'Deposit pending' : 'Awaiting payment request';
  const activeBuildLifecycleLabel = currentBuildStatus === 'payment_agreement'
    ? paymentAgreementStatusLabel : buildLifecycle[currentLifecycleIndex]?.label || 'Submitted';
  const selectedBuildChapterDetail = selectedBuildChapter.id === 'agreement'
    ? currentBuildRecord?.paymentAgreementStatus === 'confirmed'
      ? 'Payment is confirmed. Development can start next.'
      : currentBuildStatus === 'approved' ? 'Payment terms are being prepared.' : 'Deposit required before production.'
    : selectedBuildChapter.detail;

  const canPayAgreement = currentBuildStatus === 'payment_agreement'
    && currentBuildRecord?.paymentAgreementStatus !== 'confirmed'
    && Boolean(currentBuildRecord?.depositAmount || currentBuildRecord?.totalAgreedAmount || currentBuildRecord?.quotedAmount);
  const paymentDueDateLabel = currentBuildRecord?.paymentDueDate
    ? new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(currentBuildRecord.paymentDueDate))
    : 'Not set';
  const agreementCurrency = currentBuildRecord?.quoteCurrency || user?.defaultCurrency || 'USD';
  const agreementTotalLabel = currentBuildRecord?.totalAgreedAmount
    ? formatCurrencyAmount(agreementCurrency, currentBuildRecord.totalAgreedAmount)
    : currentBuildRecord?.quotedAmount ? formatCurrencyAmount(agreementCurrency, currentBuildRecord.quotedAmount) : 'Pending';
  const agreementTotalAmount = currentBuildRecord?.totalAgreedAmount || currentBuildRecord?.quotedAmount || 0;
  const agreementDueNowAmount = currentBuildRecord?.depositAmount || agreementTotalAmount || 0;
  const agreementBalanceAmount = (currentBuildRecord?.finalPaymentConfirmedAt || currentBuildStatus === 'completed')
    ? 0
    : Math.max((agreementTotalAmount || 0) - (agreementDueNowAmount || 0), 0);
  const agreementDueNowLabel = formatCurrencyAmount(agreementCurrency, agreementDueNowAmount);
  const agreementBalanceLabel = agreementBalanceAmount ? formatCurrencyAmount(agreementCurrency, agreementBalanceAmount) : 'No balance';
  const agreementPaymentReference = currentBuildRecord?.clientNotes?.match(/Reference:\s*([^\n]+)/i)?.[1]?.trim() || '';
  const agreementPaymentVerifiedLabel = currentBuildRecord?.paymentConfirmedAt
    ? new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(currentBuildRecord.paymentConfirmedAt))
    : '';
  const activePaystackChannels = getPaystackChannelsForCurrency(agreementCurrency);
  const availableAgreementPaymentMethods = agreementPaymentMethods.filter(m => {
    if (m.gateway !== 'paystack') return false;
    if (!m.channels.length) return m.id === 'apple_pay' && activePaystackChannels.includes('card');
    return m.channels.some(c => activePaystackChannels.includes(c));
  });
  const activeAgreementPaymentMethod = availableAgreementPaymentMethods.find(m => m.id === selectedAgreementPaymentMethod)
    || availableAgreementPaymentMethods[0] || agreementPaymentMethods[0];

  const currentBuildMilestones = currentBuildRecord?.buildMilestones || [];
  const activeBuildMilestone = currentBuildMilestones.find(m => m.status === 'in_progress')
    || currentBuildMilestones.find(m => m.status === 'pending')
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
  const briefType = getBriefValue('Build type') || getBriefValue('Business type') || currentBuildRecord?.planType?.replace(/_/g, ' ') || 'Custom build';
  const clientBriefNote = currentBuildRecord?.clientNotes?.trim() || '';
  const clientBriefNoteLower = clientBriefNote.toLowerCase();
  const clientBriefClarificationNote = currentBuildStatus === 'in_review'
    ? clientBriefNote || 'The team is reviewing your brief and may need a few more details before Scope opens.' : '';
  const hasSentBriefClarification = currentBuildStatus === 'in_review' && clientBriefNoteLower.includes('client sent brief clarification');
  const isBriefApprovedForScope = [
    'quote_ready', 'approved', 'payment_agreement', 'in_development', 'staging_review', 'launched', 'handoff', 'completed',
  ].includes(currentBuildStatus);
  const hasBriefClarification = currentBuildStatus === 'in_review' && !hasSentBriefClarification;
  const clientBriefState = isBriefApprovedForScope
    ? { label: 'Brief approved', tone: 'open', detail: 'Scope is open. Review the proposal and next decision there.' }
    : hasSentBriefClarification
      ? { label: 'Brief details sent', tone: 'review', detail: 'Your update has been sent to the team.' }
      : hasBriefClarification
        ? { label: 'Brief update requested', tone: 'action', detail: 'Answer the requested questions so the team can continue Scope.' }
        : { label: 'Brief in review', tone: 'review', detail: 'No action is needed from you right now.' };
  const clientBriefClarificationLines = clientBriefClarificationNote.split('\n').map(l => l.trim()).filter(Boolean);
  const clientBriefClarificationItems = clientBriefClarificationLines[0]?.toLowerCase().startsWith('please clarify:')
    ? clientBriefClarificationLines[0].replace(/^Please clarify:\s*/i, '').replace(/\.$/, '').split(',').map(i => i.trim()).filter(Boolean)
    : [];
  const briefClarificationAllowedItems = [
    'Content/assets', 'Pages/sections', 'Services/products', 'Lead form fields', 'Design references',
    'Feature scope', 'Audience/details', 'Budget clarity', 'Timeline clarity', 'Brief clarification',
  ];
  const briefClarificationAllowedSet = new Set(briefClarificationAllowedItems.map(i => i.toLowerCase()));
  const getBriefResponseField = (item: string) => {
    const key = item.toLowerCase();
    if (key.includes('budget')) return { label: item, prompt: 'Choose the budget direction that fits this build.', type: 'select', options: ['Not sure yet', 'Under USD 1,000', 'USD 1,000 - 2,500', 'USD 2,500 - 5,000', 'USD 5,000+'] };
    if (key.includes('timeline')) return { label: item, prompt: 'Choose the timing that feels realistic.', type: 'select', options: ['Flexible', 'As soon as possible', 'This month', '1-2 months', 'Not sure yet'] };
    if (key.includes('feature')) return { label: item, prompt: 'List the exact features or actions this build must support.', type: 'textarea' };
    if (key.includes('audience')) return { label: item, prompt: 'Describe who this is for and what they need to do.', type: 'textarea' };
    if (key.includes('content') || key.includes('asset')) return { label: item, prompt: 'Tell us what content, images, copy, files, or brand material you already have.', type: 'textarea' };
    return { label: item, prompt: 'Add the missing detail for this part of the brief.', type: 'textarea' };
  };
  const filteredBriefClarificationItems = (clientBriefClarificationItems.length ? clientBriefClarificationItems : ['Brief clarification'])
    .filter(item => briefClarificationAllowedSet.has(item.toLowerCase()));
  const briefResponseFields = (filteredBriefClarificationItems.length ? filteredBriefClarificationItems : ['Brief clarification']).map(getBriefResponseField);
  const answeredBriefResponseCount = briefResponseFields.filter(f => (briefResponseAnswers[f.label] || '').trim()).length;
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

  const blockedBuildMilestones = currentBuildMilestones.filter(m => m.status === 'blocked');
  const buildMilestoneProgress = currentBuildMilestones.length
    ? Math.round(currentBuildMilestones.reduce((sum, m) => sum + (m.progress || (m.status === 'completed' ? 100 : 0)), 0) / currentBuildMilestones.length)
    : currentBuildRecord?.progress || 0;
  const clientBuildUpdate = activeBuildMilestone?.clientNote?.trim() || currentBuildRecord?.stagingNotes?.trim()
    || 'The team has started production and will publish the next update here when there is something useful to review.';
  const clientBuildStateLabel = blockedBuildMilestones.length ? 'Needs attention'
    : activeBuildMilestone?.status === 'completed' ? 'Production moving'
      : activeBuildMilestone?.status === 'in_progress' ? 'In production' : 'Starting production';
  const clientStudioLinks = currentBuildRecord?.studioLinks || [];
  const clientStudioUpdates = currentBuildRecord?.studioUpdates || [];
  const clientPreviewLink = clientStudioLinks.find(l => l.type === 'preview' && l.url);
  const clientDesignLink = clientStudioLinks.find(l => l.type === 'design' && l.url);
  const clientPreviewUrl = currentBuildRecord?.stagingUrl || clientPreviewLink?.url || '';
  const clientPreviewIsReal = Boolean(clientPreviewUrl && /^https?:\/\//i.test(clientPreviewUrl) && !/sitemendr\.test|localhost|127\.0\.0\.1/i.test(clientPreviewUrl));
  const latestStudioUpdate = clientStudioUpdates[0];
  const clientProductionFocus = activeBuildMilestone?.title || 'Production setup';
  const clientProductionUpdate = latestStudioUpdate?.message || clientBuildUpdate;
  const clientProductionHeadline = blockedBuildMilestones.length ? 'The team needs one thing to keep moving'
    : clientPreviewIsReal ? 'Preview is ready for you' : 'Production has started';
  const clientPreviewStatus = clientPreviewIsReal ? 'Ready' : 'Preparing';
  const clientActionMessage = blockedBuildMilestones.length ? 'The team may ask for one detail before continuing.' : 'Nothing is needed from you right now.';
  const clientPreparedItems = [
    briefGoals ? `Goal: ${briefGoals}` : null,
    briefFeatures ? `Included: ${briefFeatures}` : null,
    briefStyle ? `Style: ${briefStyle}` : null,
    briefAudience ? `Audience: ${briefAudience}` : null,
  ].filter(Boolean) as string[];

  const clientReviewStatus = currentBuildRecord?.stagingReviewStatus || 'sent';
  const clientReviewStatusLabel = clientReviewStatus === 'changes_requested' ? 'Changes sent' : clientReviewStatus === 'approved' ? 'Approved' : 'Waiting for your review';
  const clientReviewStatusTone = clientReviewStatus === 'changes_requested' ? 'text-amber-300' : clientReviewStatus === 'approved' ? 'text-expert-green' : 'text-ai-blue';
  const clientReviewChecklist = [
    { label: 'Homepage', detail: 'Direction, first impression, primary action' },
    { label: 'Lead form', detail: 'Fields, flow, destination' },
    { label: 'Mobile', detail: 'Spacing, readable sections, button access' },
    { label: 'Copy / polish', detail: 'Words, visuals, final client confidence' },
  ];
  const latestPreviewDiscussionMessage = [...reviewChatMessages].reverse().find(m => m.senderRole === 'client' || m.senderRole === 'admin');
  const clientReviewHeadline = clientReviewStatus === 'changes_requested' ? 'Changes are with the team'
    : clientReviewStatus === 'approved' ? 'Preview approved' : `${currentBuildRecord?.name || 'Project'} preview`;
  const clientReviewIntro = clientReviewStatus === 'changes_requested'
    ? 'Your notes have been sent. The team will update the preview and return it for approval.'
    : clientReviewStatus === 'approved' ? 'The preview is approved. The team can prepare launch and handoff next.'
      : currentBuildRecord?.stagingNotes || 'Review the preview, ask questions in the preview discussion, then approve when it is ready for launch.';
  const clientReviewFlow = [
    { label: 'Preview shared', value: currentBuildRecord?.stagingUrl ? 'Ready' : 'Pending', tone: currentBuildRecord?.stagingUrl ? 'text-expert-green' : 'text-white/40' },
    { label: 'Discussion', value: reviewChatUnreadCount ? `${reviewChatUnreadCount} unread` : reviewChatMessages.length ? 'Active' : 'Open', tone: reviewChatUnreadCount ? 'text-amber-300' : reviewChatMessages.length ? 'text-ai-blue' : 'text-white/40' },
    { label: 'Decision', value: clientReviewStatusLabel, tone: clientReviewStatusTone },
  ];
  const clientReviewDecisionText = clientReviewStatus === 'changes_requested'
    ? 'Changes are already sent. Keep the thread open while the team updates the preview.'
    : clientReviewStatus === 'approved' ? 'Approval is recorded. Launch preparation can continue.'
      : 'Approve when the preview is ready, or send changes from the discussion.';

  const briefResponseFallback: Record<string, string> = {
    buildType: briefType, goals: briefGoals || 'Not recorded', requiredFeatures: briefFeatures || 'Not recorded',
    audience: briefAudience || 'Not recorded', existingMaterial: briefMaterial || 'Not recorded', styleDirection: briefStyle || 'Not recorded',
  };

  const submitBriefResponse = () => {
    if (!currentBuildRecord) return;
    const lines = briefResponseFields
      .map(f => { const a = (briefResponseAnswers[f.label] || '').trim(); return a ? `${f.label}: ${a}` : ''; })
      .filter(Boolean);
    handleBriefClarificationResponse(currentBuildRecord, lines);
  };

  // ---------- LIST VIEW ----------
  if (!selectedProjectId && projects.length === 0) {
    return (
      <div className="animate-fade-in">
        <BuildSummaryHeader averageProgress={averageProgress} projects={projects} onStartRequest={onStartRequest} />
        <section className="mt-6 border-y border-white/10 bg-white/[0.012] px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <Sparkles className="mb-6 h-12 w-12 text-ai-blue" />
            <h3 className="text-2xl font-black tracking-tight text-white">No build project yet</h3>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/52">
              Projects are only for custom development work: websites, platforms, dashboards, portals, and other build requests.
            </p>
            <button type="button" onClick={onStartRequest} className="mt-8 inline-flex min-h-11 items-center justify-center gap-3 rounded-md bg-ai-blue px-6 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-[#05070a]">
              Start build request
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (!selectedProjectId) {
    return (
      <div className="animate-fade-in">
        <BuildSummaryHeader averageProgress={averageProgress} projects={projects} onStartRequest={onStartRequest} />
        <section className="mt-6 border-y border-white/10">
          <div className="grid grid-cols-[1fr_6rem_2rem] gap-3 border-b border-white/10 px-4 py-4 text-[9px] font-black uppercase tracking-[0.18em] text-white/28 sm:grid-cols-[1fr_8rem_7rem_2rem] sm:px-6">
            <span>Project</span><span className="hidden text-right sm:block">Progress</span><span className="text-right">Resume</span><span></span>
          </div>
          <div className="divide-y divide-white/10">
            {projects.map((project) => {
              const rowStatus = normalizeBuildStatus(project.status);
              const rowChapter = buildJourneyChapters.find(c => c.statuses.includes(rowStatus)) || buildJourneyChapters[0];
              const rowChapterIndex = Math.max(0, buildJourneyChapters.findIndex(c => c.id === rowChapter.id));
              const rowProgress = Math.round(((rowChapterIndex + 1) / buildJourneyChapters.length) * 100);
              return (
                <button key={project.id} type="button" onClick={() => { setSelectedProjectId(project.id); setActiveBuildChapter(null); }}
                  className="grid min-h-24 w-full grid-cols-[1fr_6rem_2rem] items-center gap-3 px-4 py-4 text-left transition hover:bg-white/[0.025] sm:grid-cols-[1fr_8rem_7rem_2rem] sm:px-6">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-white">{project.name}</span>
                    <span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/34">
                      {project.businessName || project.planType?.replace(/_/g, ' ') || 'Custom build'}
                    </span>
                    <span className="mt-3 block h-1 bg-white/10 sm:hidden"><span className="block h-full bg-ai-blue" style={{ width: `${rowProgress}%` }} /></span>
                  </span>
                  <span className="hidden sm:block">
                    <span className="block h-1 bg-white/10"><span className="block h-full bg-ai-blue" style={{ width: `${rowProgress}%` }} /></span>
                    <span className="mt-2 block text-right text-[10px] font-black uppercase tracking-[0.12em] text-white/34">{rowProgress}%</span>
                  </span>
                  <span className={`text-right text-[10px] font-black uppercase tracking-[0.12em] ${rowStatus === 'completed' ? 'text-expert-green' : 'text-ai-blue'}`}>{rowStatus === 'completed' ? 'Completed' : rowChapter.label}</span>
                  <ChevronRight className="h-4 w-4 justify-self-end text-white/24" />
                </button>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  // ---------- SELECTED PROJECT VIEW ----------
  if (!currentBuildRecord) return null;

  if (currentBuildStatus === 'completed') {
    return (
      <div className="animate-fade-in">
        <div className="px-5 pb-6 pt-0 sm:px-8 lg:px-10">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => { setSelectedProjectId(null); setActiveBuildChapter(null); }} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/70 transition hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="grid h-12 w-12 shrink-0 place-items-center text-expert-green"><Check className="h-6 w-6" /></div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">{currentBuildPlanLabel}</p>
              <p className="mt-1 truncate text-sm font-black tracking-tight text-white">{currentBuildRecord.businessName || currentBuildRecord.title || 'Your build'}</p>
            </div>
          </div>
        </div>

        <div className="border-y border-expert-green/25 px-5 py-10 text-center sm:px-8 sm:py-14 lg:px-10">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-expert-green/10 text-expert-green"><Check className="h-7 w-7" /></div>
          <p className="mt-5 text-[9px] font-black uppercase tracking-[0.2em] text-expert-green">Project complete</p>
          <h4 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">{currentBuildRecord.businessName || currentBuildRecord.title || 'Your project'} is live and fully paid</h4>
          <p className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-7 text-white/60">{currentBuildRecord.completionNotes || 'This build is fully paid, handed off, and complete.'}</p>

          <div className="mx-auto mt-8 grid max-w-md grid-cols-1 gap-3 border-y border-white/10 py-5 sm:grid-cols-3">
            <div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">Total paid</p><p className="mt-2 text-lg font-black tracking-tight text-expert-green">{agreementTotalLabel}</p></div>
            <div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">Completed</p><p className="mt-2 text-lg font-black tracking-tight text-white">{currentBuildRecord.completedAt ? new Date(currentBuildRecord.completedAt).toLocaleDateString() : new Date().toLocaleDateString()}</p></div>
            <div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">Plan</p><p className="mt-2 truncate text-lg font-black capitalize tracking-tight text-white">{currentBuildPlanLabel}</p></div>
          </div>

          {currentBuildRecord.launchUrl && (
            <a href={currentBuildRecord.launchUrl} target="_blank" rel="noreferrer" className="mt-8 inline-flex min-h-12 items-center gap-3 border border-expert-green/35 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-expert-green transition hover:border-expert-green hover:bg-expert-green/10 hover:text-white">Open live site <ExternalLink className="h-4 w-4 shrink-0" /></a>
          )}
        </div>

        <div className="px-5 py-8 sm:px-8 lg:px-10">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Need something else?</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">This project is closed, so work continues in a new place depending on what you need.</p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button type="button" onClick={onStartRequest} className="flex items-start justify-between gap-3 border border-ai-blue/25 bg-ai-blue/[0.04] p-5 text-left transition hover:bg-ai-blue/10">
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-ai-blue">Start a new build</span>
                <span className="mt-1 block text-xs leading-5 text-white/50">A new feature, a second site, or a bigger project — begin a fresh request.</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-ai-blue" />
            </button>
            <button type="button" className="flex items-start justify-between gap-3 border border-white/10 bg-white/[0.02] p-5 text-left opacity-60 transition">
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-white/60">Need a quick fix?</span>
                <span className="mt-1 block text-xs leading-5 text-white/40">Small tweaks to the live site go through support, not a new build.</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="px-5 pb-2 pt-0 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <button type="button" onClick={() => { setSelectedProjectId(null); setActiveBuildChapter(null); }} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/70 transition hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="grid h-12 w-12 shrink-0 place-items-center text-ai-blue"><Sparkles className="h-6 w-6" /></div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">Plan / Package</p>
              <p className="mt-1 truncate text-sm font-black capitalize tracking-tight text-white">{currentBuildPlanLabel}</p>
              <p className="mt-1 truncate text-[11px] font-semibold text-yellow-300">Submitted {currentBuildSubmittedLabel}</p>
            </div>
          </div>
          {selectedBuildChapter.id !== 'brief' && (
            <div className="min-w-40 border-l border-white/10 pl-5">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Journey</p>
              <p className="mt-1 text-2xl font-black text-white">{buildPageProgress}%</p>
              <div className="mt-3 h-1.5 w-full bg-white/10"><div className="h-full bg-ai-blue transition-all" style={{ width: `${buildPageProgress}%` }} /></div>
            </div>
          )}
        </div>
      </div>

      {selectedBuildChapter.id !== 'brief' && (
        <div className="border-b border-white/10 px-5 pb-4 pt-3 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-ai-blue/70">Step {selectedBuildChapterIndex + 1} of {buildJourneyChapters.length}</p>
              <h4 className="mt-1 text-3xl font-black tracking-tight text-white">{selectedBuildChapter.label}</h4>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">{selectedBuildChapterDetail}</p>
            </div>
            <div className="w-full md:max-w-sm">
              <div className="flex items-center justify-between gap-4 text-[10px] font-black uppercase tracking-[0.14em] text-white/34">
                <span>{activeBuildLifecycleLabel}</span><span>{buildPageProgress}%</span>
              </div>
              <div className="mt-2 h-1.5 bg-white/10"><div className="h-full bg-ai-blue" style={{ width: `${buildPageProgress}%` }} /></div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedBuildChapterIndex > 0 && (
                  <button type="button" onClick={() => setActiveBuildChapter(buildJourneyChapters[selectedBuildChapterIndex - 1].id)} className="inline-flex min-h-10 items-center justify-center gap-2 border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/50 transition hover:bg-white/[0.04] hover:text-white">
                    <ArrowLeft className="h-3.5 w-3.5" /> Previous
                  </button>
                )}
                <button type="button" onClick={() => setActiveBuildChapter(buildJourneyChapters[selectedBuildChapterIndex + 1].id)}
                  disabled={selectedBuildChapterIndex >= buildJourneyChapters.length - 1 || (currentBuildStatus !== 'completed' && selectedBuildChapterIndex >= defaultBuildChapterIndex)}
                  className="inline-flex min-h-10 items-center justify-center gap-2 border border-ai-blue/25 bg-ai-blue/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:bg-ai-blue/10 hover:text-white disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-white/24">
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`grid flex-1 ${selectedBuildChapter.id === 'brief' ? '' : 'xl:grid-cols-[minmax(0,1fr)_20rem] xl:divide-x xl:divide-white/10'}`}>
        <section className="px-5 py-6 sm:px-8 lg:px-10">
          {selectedBuildChapter.id === 'brief' && (
            <div className="space-y-6">
              <div className="border-y border-white/10 py-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0">
                    <p className={`text-[9px] font-black uppercase tracking-[0.18em] ${clientBriefState.tone === 'open' ? 'text-expert-green' : clientBriefState.tone === 'action' ? 'text-yellow-300' : 'text-ai-blue'}`}>{clientBriefState.label}</p>
                    {!hasBriefClarification && <h5 className="mt-2 max-w-3xl text-2xl font-black tracking-tight text-white">{clientBriefState.detail}</h5>}
                  </div>
                  {(hasBriefClarification || hasSentBriefClarification) && (
                    <div className="shrink-0 text-left lg:text-right">
                      {hasSentBriefClarification ? (
                        <><p className="text-sm font-black tracking-tight text-white">Waiting for review</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/36">Team review</p></>
                      ) : (
                        <><p className="text-2xl font-black tracking-tight text-white">{answeredBriefResponseCount}/{briefResponseFields.length}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/36">Questions answered</p></>
                      )}
                    </div>
                  )}
                </div>

                {hasBriefClarification && (
                  <div className="mt-6 space-y-6 border-t border-white/10 pt-6">
                    {briefResponseFields.map((field, i) => {
                      const isAnswered = Boolean((briefResponseAnswers[field.label] || '').trim());
                      return (
                        <div key={field.label} className={`border-b py-5 ${isAnswered ? 'border-expert-green/35' : 'border-white/10'}`}>
                          <div className="flex items-start gap-3">
                            <span className={`mt-0.5 w-6 shrink-0 text-[10px] font-black tabular-nums ${isAnswered ? 'text-expert-green' : 'text-white/30'}`}>{String(i + 1).padStart(2, '0')}</span>
                            <div className="min-w-0 flex-1">
                              <label className={`block text-[10px] font-black uppercase tracking-[0.14em] ${isAnswered ? 'text-expert-green' : 'text-white/74'}`}>{field.label}</label>
                              <p className="mt-1 text-xs leading-5 text-white/36">{field.prompt}</p>
                              {field.type === 'select' ? (
                                <select value={briefResponseAnswers[field.label] || ''} onChange={(e) => setBriefResponseAnswers(prev => ({ ...prev, [field.label]: e.target.value }))} className="mt-3 w-full border-0 border-b border-white/16 bg-[#05070a] px-0 py-3 text-sm font-semibold text-white outline-none">
                                  <option value="">Choose an answer</option>
                                  {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              ) : (
                                <textarea value={briefResponseAnswers[field.label] || ''} onChange={(e) => setBriefResponseAnswers(prev => ({ ...prev, [field.label]: e.target.value }))} rows={3} className="mt-3 w-full resize-none border-0 border-b border-white/16 bg-transparent px-0 py-2 text-sm leading-6 text-white outline-none placeholder:text-white/22" placeholder="Write your answer here..." />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <button type="button" onClick={submitBriefResponse} disabled={briefResponseSubmitting || !briefResponseFields.some(f => (briefResponseAnswers[f.label] || '').trim())} className="inline-flex min-h-11 items-center justify-center gap-3 border border-yellow-300/25 px-5 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-yellow-300 transition hover:bg-yellow-300/10 hover:text-white disabled:opacity-40">
                        Send brief details {briefResponseSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      {briefResponseFeedback && <p className="text-xs font-semibold text-white/54">{briefResponseFeedback}</p>}
                    </div>
                  </div>
                )}
              </div>

              {!hasBriefClarification && (
                <div className="border-y border-white/10">
                  <div className="border-b border-white/10 py-3"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Current brief</p></div>
                  <div className="grid grid-cols-2 border-b border-white/10 md:grid-cols-3 xl:grid-cols-4">
                    {clientBriefRows.map(item => (
                      <div key={item.label} className="min-w-0 border-b border-r border-white/10 px-4 py-4">
                        <p className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-white/28">{item.label}</p>
                        <p className={`mt-2 truncate text-sm font-semibold ${['Not answered', 'Not specified'].includes(item.value) ? 'text-white/30' : 'text-white/68'}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => handleViewAssessment(currentBuildRecord, briefResponseFallback)} className="group flex min-h-14 w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-white/[0.018]">
                    <span className="flex items-center gap-3"><Sparkles className="h-4 w-4 text-white/42" /><span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/62 group-hover:text-white">Review intake answers</span></span>
                    <ChevronRight className="h-4 w-4 text-white/24 transition group-hover:translate-x-1 group-hover:text-white" />
                  </button>
                </div>
              )}
            </div>
          )}

          {selectedBuildChapter.id === 'scope' && (
            <div className="space-y-6">
              {isProjectRequest(currentBuildRecord) && hasScopeProposal ? (
                <div className="border-y border-white/10">
                  <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_17rem] xl:divide-x xl:divide-white/10">
                    <div className="py-6 xl:pr-8">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/34">Scope review</p>
                      <h5 className="mt-2 text-2xl font-black tracking-tight text-white">{briefType}</h5>
                      <p className="mt-4 max-w-3xl text-sm leading-7 text-white/62">Review the offer, price, and delivery boundaries before Agreement opens.</p>
                    </div>
                    <div className="border-t border-white/10 py-5 xl:border-t-0 xl:pl-6">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">Price</p>
                      <p className="mt-2 text-3xl font-black tracking-tight text-white">{currentBuildRecord.quotedAmount ? `${agreementCurrency} ${currentBuildRecord.quotedAmount}` : 'Pending'}</p>
                      <div className="mt-5 flex items-center gap-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${scopeDecisionLabel === 'Scope approved' ? 'bg-expert-green' : 'bg-amber-300'}`} />
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/54">{scopeDecisionLabel}</p>
                      </div>
                    </div>
                  </div>

                  {isScopeApproved ? (
                    <div className="border-t border-expert-green/25 py-5">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-expert-green">Accepted</p>
                      <p className="mt-2 max-w-2xl text-sm font-semibold leading-7 text-white/68">Scope is approved. The team will prepare Agreement, payment terms, and production start details next.</p>
                    </div>
                  ) : (
                    <>
                      <div className="border-t border-white/10 py-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">{hasScopeDiscussion ? 'Update message' : 'Message to team'}</p>
                        <textarea value={quoteMessage} onChange={(e) => setQuoteMessage(e.target.value)} rows={3} className="mt-3 w-full resize-none border-0 bg-transparent text-sm leading-6 text-white outline-none placeholder:text-white/24" placeholder={hasScopeDiscussion ? 'Add what should change...' : 'Tell the team what you want adjusted or clarified...'} />
                      </div>
                      <div className="grid border-t border-white/10 sm:grid-cols-2 sm:divide-x sm:divide-white/10">
                        <button type="button" onClick={() => handleQuoteResponse(currentBuildRecord, 'accept')} disabled={quoteSubmitting} className="flex min-h-14 items-center justify-between gap-3 px-0 py-4 pr-4 text-left text-[10px] font-black uppercase tracking-[0.16em] text-expert-green transition hover:text-white disabled:opacity-50 sm:px-4">
                          <span className="flex items-center gap-3"><Check className="h-4 w-4" /> Approve scope</span>{quoteSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        <button type="button" onClick={() => handleQuoteResponse(currentBuildRecord, 'discuss')} disabled={quoteSubmitting} className="flex min-h-14 items-center justify-between gap-3 border-t border-white/10 px-0 py-4 pr-4 text-left text-[10px] font-black uppercase tracking-[0.16em] text-amber-200 transition hover:text-white disabled:opacity-50 sm:border-t-0 sm:px-4">
                          <span className="flex items-center gap-3"><MessageSquare className="h-4 w-4" /> {hasScopeDiscussion ? 'Update discussion' : 'Discuss changes'}</span><ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="border-y border-white/10 py-6">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/28">Scope in preparation</p>
                  <h5 className="mt-2 text-xl font-black tracking-tight text-white">Quote not ready yet</h5>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/54">The team is using the brief to prepare the scope, timeline, and final quote.</p>
                </div>
              )}
            </div>
          )}

          {selectedBuildChapter.id === 'agreement' && (
            <div className="space-y-6">
              {isProjectRequest(currentBuildRecord) && ['approved', 'payment_agreement'].includes(currentBuildStatus) ? (
                <div className="border-y border-white/10">
                  <div className="py-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <div className={`grid h-12 w-12 shrink-0 place-items-center ${currentBuildRecord.paymentAgreementStatus === 'confirmed' ? 'text-expert-green' : currentBuildStatus === 'payment_agreement' ? 'text-amber-300' : 'text-white/42'}`}>
                          {currentBuildRecord.paymentAgreementStatus === 'confirmed' ? <Check className="h-8 w-8" /> : <CircleDollarSign className="h-8 w-8" />}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${currentBuildRecord.paymentAgreementStatus === 'confirmed' ? 'text-expert-green' : currentBuildStatus === 'payment_agreement' ? 'text-amber-300' : 'text-white/42'}`}>
                            {currentBuildRecord.paymentAgreementStatus === 'confirmed' ? 'Deposit paid' : currentBuildStatus === 'payment_agreement' ? 'Deposit pending' : 'Payment terms pending'}
                          </p>
                          <h5 className="mt-2 text-3xl font-black tracking-tight text-white">{agreementDueNowLabel}</h5>
                        </div>
                      </div>
                      {currentBuildRecord.paymentAgreementStatus === 'confirmed' && (
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/34 lg:text-right">Verified {agreementPaymentVerifiedLabel || 'Confirmed'} - Paystack</p>
                      )}
                    </div>

                    <div className="mt-7 grid gap-4 border-y border-white/10 py-5 md:grid-cols-4">
                      {[{ label: 'Total', value: agreementTotalLabel }, { label: 'Deposit', value: agreementDueNowLabel }, { label: 'Balance', value: agreementBalanceLabel }, { label: 'Due', value: paymentDueDateLabel }].map(item => (
                        <div key={item.label} className="min-w-0">
                          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">{item.label}</p>
                          <p className="mt-1 truncate text-sm font-black capitalize text-white/76">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {agreementPaymentReference && currentBuildRecord.paymentAgreementStatus === 'confirmed' && (
                      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.14em] text-white/40">Reference: {agreementPaymentReference}</p>
                    )}

                    {canPayAgreement && (
                      <div className="mt-6 space-y-4">
                        <button type="button" onClick={() => setShowAgreementPaymentMethods(v => !v)} disabled={paymentSubmitting} className="flex min-h-12 w-full items-center justify-between gap-3 border border-amber-300/25 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-amber-300 transition hover:bg-amber-300/10 hover:text-white disabled:opacity-50 sm:max-w-sm">
                          <span className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Proceed to payment</span><ChevronRight className={`h-4 w-4 transition ${showAgreementPaymentMethods ? 'rotate-90' : ''}`} />
                        </button>

                        {showAgreementPaymentMethods && (
                          <div className="space-y-4 py-2">
                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                              {availableAgreementPaymentMethods.map(method => {
                                const isSelected = activeAgreementPaymentMethod.id === method.id;
                                return (
                                  <button key={method.id} type="button" onClick={() => setSelectedAgreementPaymentMethod(method.id)} className={`min-h-16 border-b pb-3 text-left transition ${isSelected ? 'border-amber-300 text-white' : 'border-white/10 text-white/70 hover:border-white/30 hover:text-white'}`}>
                                    <div className="flex min-h-7 items-center"><Image src={method.icon} alt="" width={112} height={31} unoptimized className="h-7 max-w-28 object-contain object-left" /></div>
                                    <div className="mt-2 flex items-end justify-between gap-3">
                                      <p className="truncate text-xs font-black text-white">{method.label}</p>
                                      <span className={`shrink-0 text-[9px] font-black uppercase tracking-[0.14em] ${isSelected ? 'text-amber-300' : 'text-white/34'}`}>{method.detail}</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            <button type="button" onClick={() => handleAgreementPayment(currentBuildRecord, activeAgreementPaymentMethod)} disabled={paymentSubmitting} className="flex min-h-12 w-full items-center justify-between gap-3 border border-amber-300/35 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-amber-200 transition hover:border-amber-200 hover:bg-amber-300/10 hover:text-white disabled:opacity-50 sm:max-w-sm">
                              <span>{paymentSubmitting ? 'Opening secure checkout' : `Continue with ${activeAgreementPaymentMethod.label} (${agreementDueNowLabel})`}</span>
                              {paymentSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
              <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(17rem,0.36fr)] xl:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex h-2.5 w-2.5 rounded-full ${blockedBuildMilestones.length ? 'bg-amber-300' : 'bg-expert-green'}`} />
                    <p className={`text-[9px] font-black uppercase tracking-[0.18em] ${blockedBuildMilestones.length ? 'text-amber-300' : 'text-expert-green'}`}>{clientBuildStateLabel}</p>
                    <span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/32">{buildMilestoneProgress}% complete</span>
                  </div>
                  <h4 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">{clientProductionHeadline}</h4>
                  <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-white/74">{clientProductionUpdate}</p>
                </div>
                <div className="border-t border-white/10 pt-5 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${blockedBuildMilestones.length ? 'bg-amber-300/12 text-amber-300' : 'bg-expert-green/12 text-expert-green'}`}>
                      {blockedBuildMilestones.length ? <TriangleAlert className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/42">Your part</p>
                      <p className="mt-1 text-lg font-black tracking-tight text-white">{blockedBuildMilestones.length ? 'Input needed' : 'Nothing needed'}</p>
                      <p className="mt-1 text-sm leading-6 text-white/58">{clientActionMessage}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-6 grid gap-6 border-b border-white/10 py-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(18rem,0.48fr)]">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/46">Project shape</p>
                  <div className="mt-3 divide-y divide-white/10">
                    {clientPreparedItems.length ? clientPreparedItems.map(item => <p key={item} className="py-3 text-sm font-semibold leading-6 text-white/72">{item}</p>)
                      : <p className="py-3 text-sm font-semibold leading-6 text-white/62">The approved scope is being prepared for production.</p>}
                  </div>
                </div>
                <div className="border-t border-white/10 pt-5 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/46">Preview checkpoint</p>
                  <p className="mt-3 text-xl font-black tracking-tight text-white">{clientPreviewIsReal ? 'Open preview' : 'Not ready yet'}</p>
                  <p className="mt-2 text-sm leading-6 text-white/62">{clientPreviewIsReal ? 'The preview is available for inspection.' : 'A preview link will appear here when the build is ready to inspect.'}</p>
                  <div className="mt-4 flex flex-wrap gap-4">
                    {clientPreviewIsReal && <a href={clientPreviewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:text-white">Open preview <ExternalLink className="h-3.5 w-3.5" /></a>}
                    {clientDesignLink?.url && <a href={clientDesignLink.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-expert-green transition hover:text-white">Open design <ExternalLink className="h-3.5 w-3.5" /></a>}
                  </div>
                </div>
              </section>

              <section className="pt-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/46">Team updates</p>
                  {clientStudioUpdates.length > 0 && <span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/40">{clientStudioUpdates.length}</span>}
                </div>
                <div className="mt-3 divide-y divide-white/10">
                  {clientStudioUpdates.length ? clientStudioUpdates.slice(0, 3).map(update => (
                    <div key={update.id} className="py-3">
                      <p className="text-sm font-semibold leading-6 text-white/72">{update.message}</p>
                      {update.createdAt && <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/40">{new Date(update.createdAt).toLocaleDateString()}</p>}
                    </div>
                  )) : <p className="py-3 text-sm font-semibold leading-6 text-white/56">The team has not published a production update yet.</p>}
                </div>
              </section>
            </div>
          )}

          {selectedBuildChapter.id === 'review' && (
            <div className="border-y border-white/10 py-5">
              {isProjectRequest(currentBuildRecord) && currentBuildStatus === 'staging_review' ? (
                <>
                  <section className="grid gap-6 xl:grid-cols-[minmax(0,0.86fr)_minmax(18rem,0.36fr)] xl:items-stretch">
                    <div className="min-w-0 border-y border-white/10 py-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`inline-flex h-2.5 w-2.5 rounded-full ${clientReviewStatus === 'approved' ? 'bg-expert-green' : clientReviewStatus === 'changes_requested' ? 'bg-amber-300' : 'bg-ai-blue'}`} />
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-ai-blue">Preview review</p>
                        <span className={`text-[9px] font-black uppercase tracking-[0.14em] ${clientReviewStatusTone}`}>{clientReviewStatusLabel}</span>
                      </div>
                      <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0">
                          <h4 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{clientReviewHeadline}</h4>
                          <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-white/66">{clientReviewIntro}</p>
                        </div>
                        {currentBuildRecord.stagingUrl && (
                          <a href={currentBuildRecord.stagingUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-12 shrink-0 items-center justify-between gap-3 border border-ai-blue/25 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:bg-ai-blue/10 hover:text-white">
                            Open preview <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        {clientReviewFlow.map(item => (
                          <div key={item.label} className="border-b border-white/10 pb-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/30">{item.label}</p>
                            <p className={`mt-2 text-sm font-black uppercase tracking-[0.12em] ${item.tone}`}>{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button type="button" onClick={() => setReviewChatOpen(prev => { const next = !prev; return next; })}
                      className={`group flex min-h-40 flex-col justify-between border-y py-5 text-left transition ${reviewChatOpen ? 'border-ai-blue/45 text-white' : 'border-white/10 text-white/74 hover:border-ai-blue/35 hover:text-white'}`}>
                      <span className="flex items-start justify-between gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ai-blue/10 text-ai-blue transition group-hover:bg-ai-blue group-hover:text-white"><MessageSquare className="h-5 w-5" /></span>
                        {reviewChatUnreadCount > 0 && !reviewChatOpen && <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-amber-300 px-2 text-[10px] font-black text-black">{reviewChatUnreadCount}</span>}
                      </span>
                      <span className="mt-5 block">
                        <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-ai-blue">Preview discussion</span>
                        <span className="mt-2 line-clamp-2 block text-sm font-semibold leading-6 text-white/58">
                          {reviewChatUnreadCount ? `${reviewChatUnreadCount} unread message${reviewChatUnreadCount === 1 ? '' : 's'}` : latestPreviewDiscussionMessage?.message || (reviewChatLoading ? 'Loading thread' : 'Open the project chat')}
                        </span>
                      </span>
                    </button>
                  </section>

                  <section className="mt-6 border-y border-white/10 py-5">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/34">Review focus</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {clientReviewChecklist.map((item, i) => (
                        <div key={item.label} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-b border-white/10 pb-3">
                          <span className="text-[9px] font-black uppercase tracking-[0.12em] text-white/28">{String(i + 1).padStart(2, '0')}</span>
                          <span className="min-w-0"><span className="block text-sm font-black tracking-tight text-white/78">{item.label}</span><span className="mt-1 block text-xs font-semibold leading-5 text-white/42">{item.detail}</span></span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="mt-6 border-t border-white/10 pt-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/34">{clientReviewStatus === 'changes_requested' ? 'Decision sent' : clientReviewStatus === 'approved' ? 'Approval recorded' : 'Ready for your decision'}</p>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">{clientReviewStatus === 'sent' ? 'Approve the preview if it is ready. If something should change, open the discussion and send one clear note.' : clientReviewDecisionText}</p>
                      </div>
                      <div className={`grid gap-3 ${clientReviewStatus === 'sent' ? 'sm:grid-cols-2 lg:min-w-[28rem]' : 'lg:min-w-[18rem]'}`}>
                        {clientReviewStatus === 'changes_requested' ? (
                          <div className="flex min-h-12 items-center gap-3 border-y border-amber-300/20 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-amber-300"><Check className="h-4 w-4" /> Changes sent</div>
                        ) : clientReviewStatus === 'approved' ? (
                          <div className="flex min-h-12 items-center gap-3 border border-expert-green/25 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-expert-green"><Check className="h-4 w-4" /> Preview approved</div>
                        ) : (
                          <>
                            <button type="button" onClick={() => handleStagingReviewResponse(currentBuildRecord, 'approve')} disabled={stagingReviewSubmitting} className="flex min-h-12 items-center justify-between gap-3 border border-expert-green/25 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.16em] text-expert-green transition hover:bg-expert-green/10 hover:text-white disabled:opacity-50">
                              <span className="flex items-center gap-3"><Check className="h-4 w-4" /> Approve preview</span>{stagingReviewSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                            <button type="button" onClick={() => { if (!stagingReviewMessage.trim() && !reviewChatDraft.trim() && reviewChatMessages.length === 0) { setReviewChatOpen(true); return; } handleStagingReviewResponse(currentBuildRecord, 'changes'); }} disabled={stagingReviewSubmitting} className="flex min-h-12 items-center justify-between gap-3 border border-ai-blue/25 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.16em] text-ai-blue transition hover:bg-ai-blue/10 hover:text-white disabled:opacity-50">
                              <span className="flex items-center gap-3"><MessageSquare className="h-4 w-4" /> {stagingReviewMessage.trim() || reviewChatDraft.trim() || reviewChatMessages.length > 0 ? 'Send change request' : 'Request changes in chat'}</span><ChevronRight className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </section>

                  {reviewChatOpen && (
                    <div className="fixed inset-x-0 bottom-0 z-[90] flex h-[100dvh] flex-col border-t border-white/10 bg-[#05070a] shadow-2xl sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[520px] sm:w-[390px] sm:border sm:shadow-black/50">
                      <div className="flex min-h-16 items-center justify-between gap-3 border-b border-white/10 bg-ai-blue px-4 text-white">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15"><MessageSquare className="h-4 w-4" /></div>
                          <div className="min-w-0"><p className="truncate text-sm font-black tracking-tight">Preview discussion</p><p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/72">{reviewChatLoading ? 'Loading thread' : `${reviewChatMessages.length} message${reviewChatMessages.length === 1 ? '' : 's'}`}</p></div>
                        </div>
                        <button type="button" onClick={() => setReviewChatOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white" aria-label="Close preview discussion"><X className="h-4 w-4" /></button>
                      </div>
                      <div className="flex-1 space-y-4 overflow-y-auto bg-black/35 p-4">
                        {reviewChatMessages.length ? reviewChatMessages.map(message => {
                          const isClientMessage = message.senderRole === 'client';
                          return (
                            <div key={message.id} className={`flex ${isClientMessage ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[84%] ${isClientMessage ? 'text-right' : 'text-left'}`}>
                                <div className={`inline-block rounded-2xl px-4 py-3 text-sm font-semibold leading-6 ${isClientMessage ? 'rounded-tr-sm bg-ai-blue text-white' : 'rounded-tl-sm border border-white/10 bg-white/[0.06] text-white/78'}`}>
                                  <p className="whitespace-pre-line">{message.message}</p>
                                  <p className={`mt-1 text-[9px] font-black uppercase tracking-[0.12em] ${isClientMessage ? 'text-white/65' : 'text-white/35'}`}>{isClientMessage ? 'You' : 'Team'} - {new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                                </div>
                                {!isClientMessage && Array.isArray(message.choices) && message.choices.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {message.choices.map(choice => (
                                      <button key={choice} type="button" onClick={() => handleSendClientReviewChat(currentBuildRecord.id, choice)} disabled={reviewChatSending} className="rounded-full border border-ai-blue/25 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-ai-blue transition hover:bg-ai-blue/10 hover:text-white disabled:opacity-40">{choice}</button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }) : (
                          <div className="flex h-full items-center justify-center text-center"><p className="max-w-xs text-sm font-semibold leading-6 text-white/50">Ask a question or write the changes you want the team to review.</p></div>
                        )}
                      </div>
                      <div className="border-t border-white/10 bg-[#05070a] p-4">
                        <div className="relative">
                          <textarea value={reviewChatDraft} onChange={(e) => setReviewChatDraft(e.target.value)} rows={2} className="max-h-28 min-h-12 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-4 pr-12 text-sm leading-6 text-white outline-none transition placeholder:text-white/28 focus:border-ai-blue/55" placeholder="Message about this preview..." />
                          <button type="button" onClick={() => handleSendClientReviewChat(currentBuildRecord.id)} disabled={reviewChatSending || !reviewChatDraft.trim()} className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-ai-blue text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30" aria-label="Send preview discussion message">
                            {reviewChatSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-ai-blue">Preview review</p>
                  <p className="mt-2 text-sm leading-7 text-white/60">The preview and approval controls will appear here when the project is ready for review.</p>
                </>
              )}
            </div>
          )}

          {selectedBuildChapter.id === 'launch' && (
            <div className="border-y border-expert-green/25 py-6 md:py-8">
              {isProjectRequest(currentBuildRecord) && ['launched', 'handoff', 'completed'].includes(currentBuildStatus) ? (
                <>
                  {/* Hero row */}
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3"><span className="inline-flex h-2.5 w-2.5 rounded-full bg-expert-green" /><p className="text-[9px] font-black uppercase tracking-[0.18em] text-expert-green">Launch</p></div>
                      <h4 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">{currentBuildStatus === 'completed' ? 'Your build is complete' : currentBuildStatus === 'handoff' ? 'Confirm handoff' : 'Your build is live'}</h4>
                      <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/60">{currentBuildStatus === 'handoff' ? 'Review the live build and handoff details. Accept delivery if everything is okay, or report what is missing.' : currentBuildRecord.launchNotes || 'The live build and handoff details are ready here.'}</p>
                    </div>
                    <div className="border border-white/10 bg-white/[0.02] p-5">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/34">Delivery state</p>
                      <p className="mt-2 text-lg font-black tracking-tight text-expert-green">{currentBuildStatus === 'completed' ? 'Completed' : currentBuildStatus === 'handoff' ? 'Waiting confirmation' : 'Live'}</p>
                    </div>
                  </div>

                  {/* Delivery details card */}
                  <div className="mt-6 grid grid-cols-1 divide-y divide-white/10 border border-white/10 bg-white/[0.02] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                    <div className="p-5">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">Live build</p>
                      {currentBuildRecord.launchUrl ? (
                        <a href={currentBuildRecord.launchUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center justify-between gap-3 border border-expert-green/25 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-expert-green transition hover:bg-expert-green/10 hover:text-white">Open live build <ExternalLink className="h-4 w-4 shrink-0" /></a>
                      ) : <p className="mt-3 text-sm font-semibold text-white/52">Live link pending</p>}
                    </div>
                    <div className="p-5">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">Handoff details</p>
                      <p className="mt-3 whitespace-pre-line text-sm font-semibold leading-7 text-white/64">{currentBuildRecord.handoffNotes || 'Access details and final next steps will appear here.'}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-6">
                    {/* Handoff: not yet accepted, no issues -> default summary with buttons */}
                    {currentBuildStatus === 'handoff' && !currentBuildRecord.completionAcknowledgedAt && !currentBuildRecord.handoffIssuesReportedAt && !handoffChatStarted && (
                      <div className="border border-white/10 bg-white/[0.02]">
                        <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                          {[{ label: 'Total', value: agreementTotalLabel, tone: 'text-white/70' }, { label: 'Deposit paid', value: agreementDueNowLabel, tone: 'text-expert-green' }, { label: 'Final balance', value: agreementBalanceLabel, tone: agreementBalanceAmount ? 'text-amber-300' : 'text-expert-green' }].map(item => (
                            <div key={item.label} className="p-5">
                              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/28">{item.label}</p>
                              <p className={`mt-2 text-sm font-black uppercase tracking-[0.1em] ${item.tone}`}>{item.value}</p>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 border-t border-white/10 sm:grid-cols-2 sm:divide-x sm:divide-white/10">
                          <button type="button" onClick={() => handleHandoffResponse(currentBuildRecord, 'complete')} disabled={handoffSubmitting} className="flex items-center justify-between gap-3 px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.16em] text-expert-green transition hover:bg-white/[0.04] hover:text-white disabled:opacity-50">
                            <span className="flex items-center gap-3"><Check className="h-4 w-4 shrink-0" /> Accept handoff</span>{handoffSubmittingAction === 'complete' ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                          </button>
                          <button type="button" onClick={() => handleOpenHandoffChat(currentBuildRecord)} className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.16em] text-ai-blue transition hover:bg-white/[0.04] hover:text-white sm:border-t-0">
                            <span className="flex items-center gap-3"><MessageSquare className="h-4 w-4 shrink-0" /> Report handoff issue</span><ChevronRight className="h-4 w-4 shrink-0" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Handoff issues reported, or client opened the thread manually -> discussion chat */}
                    {currentBuildStatus === 'handoff' && (currentBuildRecord.handoffIssuesReportedAt || handoffChatStarted) && (
                      <div className="border border-ai-blue/20 bg-white/[0.02]">
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 p-5">
                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-ai-blue">Handoff discussion</p>
                            <p className="mt-1 text-xs leading-5 text-white/44">{currentBuildRecord.completionAcknowledgedAt ? "You've already accepted handoff. Flag anything you spot before or during final payment." : "Tell the team what's missing. You can accept handoff here once it's sorted."}</p>
                          </div>
                          <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.14em] text-white/34">{handoffChatLoading ? 'Loading' : `${handoffChatMessages.length} message${handoffChatMessages.length === 1 ? '' : 's'}`}</span>
                        </div>
                        <div className="max-h-72 space-y-3 overflow-y-auto p-5">
                          {handoffChatMessages.length ? handoffChatMessages.map(message => {
                            const isClientMessage = message.senderRole === 'client';
                            return (
                              <div key={message.id} className={`flex ${isClientMessage ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm font-semibold leading-6 ${isClientMessage ? 'rounded-tr-sm bg-ai-blue text-white' : 'rounded-tl-sm border border-white/10 bg-white/[0.06] text-white/78'}`}>
                                  <p className="whitespace-pre-line">{message.message}</p>
                                  <p className={`mt-1 text-[9px] font-black uppercase tracking-[0.12em] ${isClientMessage ? 'text-white/65' : 'text-white/35'}`}>{isClientMessage ? 'You' : 'Team'} - {new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                                </div>
                              </div>
                            );
                          }) : <p className="py-6 text-center text-sm font-semibold leading-6 text-white/50">Describe what's missing below to start the conversation.</p>}
                        </div>
                        <div className="border-t border-white/10 p-5">
                          <textarea value={handoffChatDraft} onChange={(e) => setHandoffChatDraft(e.target.value)} rows={2} className="w-full resize-none bg-transparent text-sm leading-6 text-white outline-none transition placeholder:text-white/24" placeholder="Describe the handoff issue..." />
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <button type="button" onClick={() => handleSendClientHandoffChat(currentBuildRecord.id)} disabled={handoffChatSending || !handoffChatDraft.trim()} className="inline-flex min-h-10 items-center gap-2 border border-ai-blue/30 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:bg-ai-blue/10 hover:text-white disabled:opacity-40">
                              {handoffChatSending ? 'Sending' : 'Send'}<Send className="h-3.5 w-3.5 shrink-0" />
                            </button>
                            {(currentBuildRecord.completionAcknowledgedAt || handoffChatMessages.some(m => m.senderRole === 'admin')) && (
                              <button type="button" onClick={() => handleHandoffResponse(currentBuildRecord, 'complete')} disabled={handoffSubmitting} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 border border-expert-green/30 px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] text-expert-green transition hover:bg-expert-green/10 hover:text-white disabled:opacity-40 sm:flex-none">
                                {handoffSubmittingAction === 'complete' ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" /> : <Check className="h-3.5 w-3.5 shrink-0" />} {currentBuildRecord.completionAcknowledgedAt ? 'Mark resolved' : 'Accept handoff'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Handoff accepted, build not yet fully completed -> modernized closeout / final payment */}
                    {currentBuildStatus === 'handoff' && currentBuildRecord.completionAcknowledgedAt && !currentBuildRecord.handoffIssuesReportedAt && !handoffChatStarted && (
                      <div className="border border-expert-green/20 bg-white/[0.02] p-5 sm:p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3"><Check className="h-4 w-4 shrink-0 text-expert-green" /><p className="text-[9px] font-black uppercase tracking-[0.18em] text-expert-green">Handoff accepted</p></div>
                          <button type="button" onClick={() => handleOpenHandoffChat(currentBuildRecord)} className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-white/40 transition hover:text-ai-blue">
                            <MessageSquare className="h-3.5 w-3.5 shrink-0" /> Something not right?
                          </button>
                        </div>
                        <h4 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">Finish activating your project</h4>
                        <p className="mt-2 max-w-2xl text-sm font-semibold leading-7 text-white/60">Pay the remaining balance to fully finalize and activate the project.</p>

                        <div className="mt-6 grid grid-cols-1 gap-4 border-y border-white/10 py-5 sm:grid-cols-3">
                          {[{ label: 'Total', value: agreementTotalLabel, tone: 'text-white/70' }, { label: 'Deposit paid', value: agreementDueNowLabel, tone: 'text-expert-green' }, { label: 'Final balance', value: agreementBalanceLabel, tone: agreementBalanceAmount ? 'text-amber-300' : 'text-expert-green' }].map(item => (
                            <div key={item.label} className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/28">{item.label}</p><p className={`mt-2 text-lg font-black tracking-tight ${item.tone}`}>{item.value}</p></div>
                          ))}
                        </div>

                        {(agreementBalanceAmount <= 0 || currentBuildRecord.finalPaymentConfirmedAt) ? (
                          <div className="mt-6">
                            <div className="grid grid-cols-4 gap-1.5">
                              {[
                                { label: 'Delivered', done: true },
                                { label: 'Accepted', done: true },
                                { label: 'Paid', done: true },
                                { label: 'Closed', done: false },
                              ].map(step => (
                                <div key={step.label} className="min-w-0">
                                  <div className={`h-1 w-full ${step.done ? 'bg-expert-green' : 'bg-white/10'}`} />
                                  <p className={`mt-2 truncate text-[8px] font-black uppercase tracking-[0.1em] ${step.done ? 'text-expert-green' : 'text-white/30'}`}>{step.label}</p>
                                </div>
                              ))}
                            </div>
                            <div className="mt-5 border border-expert-green/25 bg-expert-green/[0.04] p-4 sm:p-5">
                              <div className="flex items-center gap-2 text-expert-green"><Check className="h-4 w-4 shrink-0" /><p className="text-[10px] font-black uppercase tracking-[0.14em]">Payment confirmed</p></div>
                              <p className="mt-2 text-sm font-semibold leading-6 text-white/64">Our team is doing one last check before marking this fully complete — you'll be notified the moment it's official.</p>
                              {currentBuildRecord.launchUrl && (
                                <a href={currentBuildRecord.launchUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-ai-blue transition hover:text-white">Open live build <ExternalLink className="h-3.5 w-3.5 shrink-0" /></a>
                              )}
                            </div>
                          </div>
                        ) : (
                          <button type="button" onClick={() => handleFinalBalancePayment(currentBuildRecord, activeAgreementPaymentMethod, agreementBalanceAmount)} disabled={finalPaymentSubmitting} className="mt-5 flex min-h-12 w-full items-center justify-between gap-3 border border-expert-green/35 px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.16em] text-expert-green transition hover:border-expert-green hover:bg-expert-green/10 hover:text-white disabled:opacity-50 sm:max-w-sm">
                            <span>{finalPaymentSubmitting ? 'Opening secure checkout' : `Proceed to final payment (${agreementBalanceLabel})`}</span>
                            {finalPaymentSubmitting ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                </>
              ) : (
                <>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-expert-green">Launch</p>
                  <p className="mt-2 text-sm leading-7 text-white/60">Launch details will appear here after review is approved.</p>
                </>
              )}
            </div>
          )}
        </section>

        {selectedBuildChapter.id !== 'brief' && (
          <aside className="border-t border-white/10 px-5 py-6 sm:px-8 xl:border-t-0 xl:px-6">
            <div className="px-1 py-4">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/28">
                {selectedBuildChapter.id === 'launch' ? 'Delivery' : 'Status'}
              </p>
              <p className="mt-2 text-xs leading-6 text-white/50">
                {selectedBuildChapter.id === 'launch'
                  ? currentBuildStatus === 'completed' ? 'Completed' : currentBuildStatus === 'handoff' ? 'Handoff ready' : 'Live'
                  : 'Progress updates for this stage appear here as they happen.'}
              </p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function BuildSummaryHeader({ averageProgress, projects, onStartRequest }: { averageProgress: number; projects: ClientProject[]; onStartRequest: () => void }) {
  return (
    <div className="border-y border-white/10">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_24rem] lg:divide-x lg:divide-white/10">
        <div className="px-5 py-7 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-ai-blue/70">Build workspace</p>
            <button type="button" onClick={onStartRequest} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-3 rounded-md bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#05070a] transition hover:bg-ai-blue hover:text-white">
              New build request
            </button>
          </div>
          <div className="mt-7 grid gap-px bg-white/10 sm:grid-cols-3">
            {[
              { label: 'Records', value: projects.length, detail: `${averageProgress}% avg progress` },
              { label: 'Active', value: projects.filter(p => ['in_development', 'staging_review', 'launched', 'handoff'].includes(normalizeBuildStatus(p.status))).length, detail: 'In production' },
              { label: 'Waiting', value: projects.filter(p => ['submitted', 'in_review', 'quote_ready', 'approved', 'payment_agreement'].includes(normalizeBuildStatus(p.status))).length, detail: 'Needs action' },
            ].map(metric => (
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
      </div>
    </div>
  );
}