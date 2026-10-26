'use client';

import React from 'react';
import { apiClient } from '@/lib/api';
import {
  Zap, Shield, Search, Smartphone, Info,
  RefreshCw, LifeBuoy, Check, ScanLine, MessageCircle, Send,
} from 'lucide-react';

interface Metric {
  name: string;
  value: number | null;
  status: 'good' | 'warning' | 'unknown';
  icon: React.ElementType;
  color: string;
  unit?: string;
}

interface Recommendation {
  message: string;
  impact: string;
}

interface SiteAvailability {
  url?: string;
  status: 'UP' | 'DOWN' | null;
  statusCode?: number | null;
  responseTime?: string;
  latency?: number | null;
  timestamp?: string;
  lastChecked?: string | null;
  error?: string | null;
  saved?: boolean;
}

interface PerformanceAuditProps {
  subscriptionId?: string;
  data: {
  metrics?: {
  score?: number;
  vitals?: {
  fcp?: string;
  inp?: string | null;
  tbt?: string | null;
  cls?: string;
  lcp?: string;
  };
  };
  strategy?: 'mobile' | 'desktop';
  availability?: SiteAvailability;
  aiInsights?: {
  summary?: string;
  actionPlan?: Array<{ task: string; impact: string }>;
  };
  timestamp?: string;
  } | null;
  onRefresh?: (strategy: 'mobile' | 'desktop') => void;
  isRefreshing?: boolean;
  errorMessage?: string | null;
  disabledReason?: string | null;
  actionsLocked?: boolean;
  // Omit this prop entirely to hide the action (e.g. in the admin view) —
  // pass it to route to a support ticket pre-scoped to this project.
  onRequestOptimization?: () => void;
}

interface PerformanceScanRecord {
  id: string;
  score: number | null;
  url: string;
  scannedAt: string;
  metrics: { score?: number; vitals?: Record<string, string | null> };
  recommendations?: Array<{ task: string; impact?: string }>;
  conditions?: { formFactor?: string | null; lighthouseVersion?: string | null } | null;
}

interface AvailabilityCheckRecord {
  id: string;
  status: 'UP' | 'DOWN';
  statusCode: number | null;
  responseTimeMs: number | null;
  error: string | null;
  source: 'scheduled' | 'manual';
  checkedAt: string;
}

interface PerformanceRequestRecord {
  id: string;
  title: string;
  summary?: string | null;
  status: string;
  createdAt: string;
  completionNotes?: string | null;
  performanceContext?: {
    baseline?: { score?: number | null; strategy?: string; scannedAt?: string } | null;
    completion?: { note?: string; followupScan?: { score?: number | null; url?: string; strategy?: string; scannedAt?: string } | null } | null;
  } | null;
  quoteVersions?: Array<{
    id: string;
    version: number;
    status: string;
    snapshot: {
      scope?: string;
      amount?: number;
      totalAgreedAmount?: number;
      currency?: string;
      timeline?: string;
      paymentSchedule?: string;
      depositAmount?: number;
      balanceAmount?: number;
      paymentDueDate?: string | null;
    };
  }>;
  invoices?: Array<{
    id: string;
    invoiceNumber: string;
    stage: string;
    amountMinor: number;
    currency: string;
    status: string;
    dueAt?: string | null;
  }>;
}

interface PerformanceConversationItem {
  id: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

const PerformanceAudit: React.FC<PerformanceAuditProps> = ({ subscriptionId, data, onRefresh, isRefreshing, errorMessage, disabledReason, actionsLocked = false, onRequestOptimization }) => {
  const [scans, setScans] = React.useState<PerformanceScanRecord[]>([]);
  const [requests, setRequests] = React.useState<PerformanceRequestRecord[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [selectedStrategy, setSelectedStrategy] = React.useState<'mobile' | 'desktop'>('mobile');
  const [historyError, setHistoryError] = React.useState<string | null>(null);
  const [availability, setAvailability] = React.useState<SiteAvailability | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = React.useState(false);
  const [availabilityError, setAvailabilityError] = React.useState<string | null>(null);
  const [availabilityHistory, setAvailabilityHistory] = React.useState<AvailabilityCheckRecord[]>([]);
  const [availabilitySummary, setAvailabilitySummary] = React.useState<{ periodDays: number; retentionDays?: number; scheduledChecks: number; uptimePercent: number | null } | null>(null);
  const [availabilityHistoryError, setAvailabilityHistoryError] = React.useState<string | null>(null);
  const [requestHistoryError, setRequestHistoryError] = React.useState<string | null>(null);
  const [requestOpen, setRequestOpen] = React.useState(false);
  const [requestSending, setRequestSending] = React.useState(false);
  const [requestError, setRequestError] = React.useState<string | null>(null);
  const [requestMessage, setRequestMessage] = React.useState<string | null>(null);
  const [requestGoal, setRequestGoal] = React.useState('');
  const [requestNotes, setRequestNotes] = React.useState('');
  const [evidenceLinks, setEvidenceLinks] = React.useState('');
  const [requestScanId, setRequestScanId] = React.useState('');
  const [findingIndex, setFindingIndex] = React.useState('');
  const [openRequestId, setOpenRequestId] = React.useState<string | null>(null);
  const [conversationItems, setConversationItems] = React.useState<PerformanceConversationItem[]>([]);
  const [conversationLoading, setConversationLoading] = React.useState(false);
  const [conversationSending, setConversationSending] = React.useState(false);
  const [conversationDraft, setConversationDraft] = React.useState('');
  const [conversationError, setConversationError] = React.useState<string | null>(null);
  const [quoteTermsAccepted, setQuoteTermsAccepted] = React.useState<Record<string, boolean>>({});
  const [quoteActionId, setQuoteActionId] = React.useState<string | null>(null);
  const [invoicePaymentId, setInvoicePaymentId] = React.useState<string | null>(null);
  const [reviewMessage, setReviewMessage] = React.useState('');
  const [reviewActionId, setReviewActionId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!subscriptionId) return;
    let active = true;
    setHistoryLoading(true);
    setHistoryError(null);
    setRequestHistoryError(null);
    setAvailabilityHistoryError(null);
    setAvailability(null);
    setAvailabilityHistory([]);
    setAvailabilitySummary(null);
    Promise.allSettled([
      apiClient.getPerformanceScans(subscriptionId),
      apiClient.getPerformanceRequests(subscriptionId),
      apiClient.getSiteAvailabilityHistory(subscriptionId),
    ]).then(([scanResult, requestResult, availabilityResult]) => {
      if (!active) return;
      if (scanResult.status === 'fulfilled' && scanResult.value.success) {
        setScans((scanResult.value.data || []) as unknown as PerformanceScanRecord[]);
        setHistoryError(scanResult.value.historyAvailable === false
          ? 'Scan history storage is not enabled yet. Your latest scan remains available.'
          : null);
      } else {
        setScans([]);
        const error = scanResult.status === 'rejected' ? scanResult.reason : new Error(scanResult.value.message || 'Performance scan history could not be loaded.');
        setHistoryError(error instanceof Error ? error.message : 'Performance scan history could not be loaded.');
      }

      if (requestResult.status === 'fulfilled' && requestResult.value.success) {
        setRequests((requestResult.value.data || []) as unknown as PerformanceRequestRecord[]);
        setRequestHistoryError(null);
      } else {
        setRequests([]);
        const error = requestResult.status === 'rejected' ? requestResult.reason : new Error(requestResult.value.message || 'Performance requests could not be loaded.');
        setRequestHistoryError(error instanceof Error ? error.message : 'Performance requests could not be loaded.');
      }

      if (availabilityResult.status === 'fulfilled' && availabilityResult.value.success) {
        setAvailabilityHistory((availabilityResult.value.data || []) as AvailabilityCheckRecord[]);
        setAvailabilitySummary(availabilityResult.value.summary || null);
        setAvailabilityHistoryError(availabilityResult.value.historyAvailable === false
          ? 'Availability history storage is not enabled yet.'
          : null);
      } else {
        setAvailabilityHistory([]);
        const error = availabilityResult.status === 'rejected' ? availabilityResult.reason : new Error(availabilityResult.value.message || 'Availability history could not be loaded.');
        setAvailabilityHistoryError(error instanceof Error ? error.message : 'Availability history could not be loaded.');
      }
    }).finally(() => {
      if (active) setHistoryLoading(false);
    });
    return () => { active = false; };
  }, [subscriptionId, data?.timestamp]);

  React.useEffect(() => {
    if (!subscriptionId) return;
    const onRequestUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ request?: { subscriptionId?: string } }>).detail;
      if (detail?.request?.subscriptionId === subscriptionId) {
        void refreshPerformanceRequests().catch(loadError => {
          setRequestHistoryError(loadError instanceof Error ? loadError.message : 'Performance requests could not be refreshed.');
        });
      }
    };
    const onConversationMessage = (event: Event) => {
      const detail = (event as CustomEvent<{ requestId?: string; message?: PerformanceConversationItem }>).detail;
      if (detail?.requestId !== openRequestId || !detail.message) return;
      setConversationItems(current => current.some(item => item.id === detail.message?.id) ? current : [...current, detail.message as PerformanceConversationItem]);
    };
    const onAvailabilityAlert = (event: Event) => {
      const detail = (event as CustomEvent<{ subscriptionId?: string; status?: 'UP' | 'DOWN'; statusCode?: number | null; checkedAt?: string }>).detail;
      if (detail?.subscriptionId !== subscriptionId || !detail.status) return;
      setAvailability({ status: detail.status, statusCode: detail.statusCode || null, timestamp: detail.checkedAt, saved: true });
      void apiClient.getSiteAvailabilityHistory(subscriptionId).then(response => {
        if (!response.success) return;
        setAvailabilityHistory((response.data || []) as AvailabilityCheckRecord[]);
        setAvailabilitySummary(response.summary || null);
      }).catch(() => setAvailabilityHistoryError('Availability history could not be refreshed.'));
    };
    window.addEventListener('sitemendr:performance-request-updated', onRequestUpdated);
    window.addEventListener('sitemendr:project-conversation-message', onConversationMessage);
    window.addEventListener('sitemendr:site-availability-alert', onAvailabilityAlert);
    return () => {
      window.removeEventListener('sitemendr:performance-request-updated', onRequestUpdated);
      window.removeEventListener('sitemendr:project-conversation-message', onConversationMessage);
      window.removeEventListener('sitemendr:site-availability-alert', onAvailabilityAlert);
    };
  }, [subscriptionId, openRequestId]);

  const selectedScan = scans.find(scan => scan.id === requestScanId) || null;
  const selectedRecommendations = Array.isArray(selectedScan?.recommendations) ? selectedScan.recommendations : [];
  const displayedAvailability = availability || (data?.availability?.status ? data.availability : null);

  const checkAvailability = async () => {
    if (!subscriptionId) return;
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    try {
      const response = await apiClient.checkUptime(subscriptionId);
      if (!response.success || !response.data) throw new Error(response.message || 'Availability could not be checked.');
      setAvailability(response.data);
      const historyResponse = await apiClient.getSiteAvailabilityHistory(subscriptionId);
      if (historyResponse.success) {
        setAvailabilityHistory((historyResponse.data || []) as AvailabilityCheckRecord[]);
        setAvailabilitySummary(historyResponse.summary || null);
        setAvailabilityHistoryError(null);
      }
    } catch (error) {
      setAvailabilityError(error instanceof Error ? error.message : 'Availability could not be checked.');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const loadConversation = async (requestId: string) => {
    setOpenRequestId(requestId);
    setConversationLoading(true);
    setConversationError(null);
    try {
      const response = await apiClient.getClientProjectConversation(requestId);
      if (!response.success) throw new Error(response.message || 'Conversation could not be loaded.');
      setConversationItems((response.data || []) as unknown as PerformanceConversationItem[]);
    } catch (error) {
      setConversationError(error instanceof Error ? error.message : 'Conversation could not be loaded.');
    } finally {
      setConversationLoading(false);
    }
  };

  const sendConversationMessage = async (event: React.FormEvent<HTMLFormElement>, requestId: string) => {
    event.preventDefault();
    const message = conversationDraft.trim();
    if (!message) return;
    setConversationSending(true);
    setConversationError(null);
    try {
      const response = await apiClient.sendClientProjectConversation(requestId, { message });
      if (!response.success) throw new Error(response.message || 'Message could not be sent.');
      setConversationDraft('');
      await loadConversation(requestId);
    } catch (error) {
      setConversationError(error instanceof Error ? error.message : 'Message could not be sent.');
    } finally {
      setConversationSending(false);
    }
  };

  const refreshPerformanceRequests = async () => {
    if (!subscriptionId) return;
    const refreshed = await apiClient.getPerformanceRequests(subscriptionId);
    if (!refreshed.success) throw new Error(refreshed.message || 'Performance requests could not be loaded.');
    setRequests((refreshed.data || []) as unknown as PerformanceRequestRecord[]);
    setRequestHistoryError(null);
  };

  const respondToQuote = async (requestId: string, action: 'accept' | 'decline') => {
    if (action === 'accept' && !quoteTermsAccepted[requestId]) return;
    setRequestError(null);
    setQuoteActionId(requestId);
    try {
      const response = await apiClient.respondToPerformanceQuote(requestId, {
        action,
        termsAccepted: action === 'accept'
      });
      if (!response.success) throw new Error(response.message || 'Your proposal response could not be saved.');
      await refreshPerformanceRequests();
      await loadConversation(requestId);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Your proposal response could not be saved.');
    } finally {
      setQuoteActionId(null);
    }
  };

  const payPerformanceInvoice = async (request: PerformanceRequestRecord, invoice: NonNullable<PerformanceRequestRecord['invoices']>[number]) => {
    const acceptedQuote = request.quoteVersions?.find(quote => quote.status === 'accepted');
    if (!acceptedQuote || invoice.amountMinor <= 0) return;
    setRequestError(null);
    setInvoicePaymentId(invoice.id);
    try {
      const response = await apiClient.initializePayment({
        amount: invoice.amountMinor / 100,
        serviceType: 'performance_payment',
        description: invoice.invoiceNumber,
        metadata: {
          projectRequestId: request.id,
          quoteVersionId: acceptedQuote.id,
          invoiceId: invoice.id,
          paymentStage: invoice.stage.startsWith('performance_balance_') ? 'balance' : 'quote',
          termsAccepted: true,
          currency: invoice.currency,
          checkoutRoute: 'hosted_checkout'
        }
      });
      const authorizationUrl = response.data?.paystack?.authorization_url;
      if (!response.success || !authorizationUrl) throw new Error(response.message || 'Payment checkout could not be started.');
      window.location.href = authorizationUrl;
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Payment checkout could not be started.');
      setInvoicePaymentId(null);
    }
  };

  const respondToPerformanceReview = async (requestId: string, action: 'accept' | 'changes') => {
    if (action === 'changes' && !reviewMessage.trim()) return;
    setReviewActionId(requestId);
    setRequestError(null);
    try {
      const response = await apiClient.respondToPerformanceReview(requestId, { action, message: reviewMessage.trim() || undefined });
      if (!response.success) throw new Error(response.message || 'Your review could not be saved.');
      setReviewMessage('');
      await refreshPerformanceRequests();
      await loadConversation(requestId);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Your review could not be saved.');
    } finally {
      setReviewActionId(null);
    }
  };

  const submitPerformanceRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!subscriptionId) return;
    setRequestSending(true);
    setRequestError(null);
    setRequestMessage(null);
    try {
      const response = await apiClient.createPerformanceRequest(subscriptionId, {
        goal: requestGoal.trim(),
        scanId: requestScanId || undefined,
        findingIndex: findingIndex === '' ? undefined : Number(findingIndex),
        evidenceLinks: evidenceLinks.split('\n').map(link => link.trim()).filter(Boolean),
        notes: requestNotes.trim() || undefined,
      });
      if (!response.success) throw new Error(response.message || 'Your request could not be sent.');
      setRequestGoal('');
      setRequestNotes('');
      setEvidenceLinks('');
      setFindingIndex('');
      setRequestOpen(false);
      setRequestMessage('Request sent. You can continue the discussion in its conversation below.');
      const refreshed = await apiClient.getPerformanceRequests(subscriptionId);
      setRequests((refreshed.data || []) as unknown as PerformanceRequestRecord[]);
      const createdId = typeof response.data?.id === 'string' ? response.data.id : null;
      if (createdId) await loadConversation(createdId);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Your request could not be sent.');
    } finally {
      setRequestSending(false);
    }
  };
  const auditData = React.useMemo(() => {
  if (!data || typeof data.metrics?.score !== 'number') return null;

  const readMetric = (raw: string | undefined) => {
    if (typeof raw !== 'string' || !raw.trim()) return null;
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const fcp = readMetric(data.metrics?.vitals?.fcp);
  const inp = readMetric(data.metrics?.vitals?.inp ?? undefined);
  const cls = readMetric(data.metrics?.vitals?.cls);
  const lcp = readMetric(data.metrics?.vitals?.lcp);
  const tbt = readMetric(data.metrics?.vitals?.tbt ?? undefined);
  const toStatus = (value: number | null, threshold: number): Metric['status'] => {
    if (value == null) return 'unknown';
    return value <= threshold ? 'good' : 'warning';
  };

  return {
  overall: typeof data.metrics?.score === 'number' ? data.metrics.score : null,
  strategy: data.strategy || 'mobile',
  summary: typeof data.aiInsights?.summary === 'string' ? data.aiInsights.summary : '',
  metrics: [
  {
  name: 'First contentful paint',
  value: fcp,
  status: toStatus(fcp, 1.8),
  icon: Zap, color: 'text-expert-green', unit: 's',
  },
  {
  name: 'Interaction to next paint',
  value: inp,
  status: toStatus(inp, 200),
  icon: Shield, color: 'text-ai-blue', unit: 'ms',
  },
  {
  name: 'Cumulative layout shift',
  value: cls,
  status: toStatus(cls, 0.1),
  icon: Search, color: 'text-tech-purple',
  },
  {
  name: 'Largest contentful paint',
  value: lcp,
  status: toStatus(lcp, 2.5),
  icon: Smartphone, color: 'text-expert-green', unit: 's',
  },
  {
  name: 'Total blocking time',
  value: tbt,
  status: toStatus(tbt, 200),
  icon: Zap, color: 'text-amber-300', unit: 'ms',
  },
  ] as Metric[],
  recommendations: (Array.isArray(data.aiInsights?.actionPlan)
    ? data.aiInsights.actionPlan.flatMap(item => {
        const task = typeof item?.task === 'string' ? item.task.trim() : '';
        if (!task) return [];
        return [{
          message: task,
          impact: typeof item.impact === 'string' ? item.impact.trim() : '',
        }];
      })
    : []) as Recommendation[],
  };
  }, [data]);

  const lastScanned = data?.timestamp
  ? new Date(data.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  : null;

  return (
  <div className="animate-fade-in space-y-6">
  <div className="flex flex-col gap-6 border border-white/[0.08] bg-white/[0.02] p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
  <div className="space-y-2">
  {auditData ? (
  <>
  <div className="flex items-end gap-3">
  <span className="text-5xl font-semibold leading-none text-white">{auditData.overall ?? '—'}</span>
  <span className="mb-1 text-[10px] font-semibold text-white/40">/ 100</span>
  </div>
  <p className="text-[10px] font-semibold text-white/40">
  {lastScanned ? `Last scanned ${lastScanned} · ${data?.strategy || 'mobile'} test` : 'Results not yet saved'}
  </p>
  {auditData.summary && <p className="max-w-xl text-xs leading-5 text-white/60">{auditData.summary}</p>}
  </>
  ) : (
  <>
  <div className="flex items-center gap-2 text-white/40">
  <ScanLine className="h-5 w-5" />
  <span className="text-sm font-semibold ">Not yet scanned</span>
  </div>
  <p className="max-w-sm text-xs font-medium text-white/40">
  Run a scan to see real paint, interaction, and layout measurements with recommendations for this site.
  </p>
  </>
  )}
  </div>

  <div className="flex flex-col gap-2 sm:flex-row">
  {onRefresh && <div role="group" aria-label="Scan device" className="flex border border-white/10 bg-white/[0.02] p-1">
    {(['mobile', 'desktop'] as const).map(strategy => <button key={strategy} type="button" onClick={() => setSelectedStrategy(strategy)} aria-pressed={selectedStrategy === strategy} className={`min-h-9 flex-1 px-3 text-[10px] font-semibold capitalize transition ${selectedStrategy === strategy ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/75'}`}>{strategy}</button>)}
  </div>}
  {onRefresh && <button
  onClick={() => onRefresh(selectedStrategy)}
  disabled={isRefreshing || Boolean(disabledReason)}
  className="flex items-center justify-center gap-2 border border-white/10 bg-white/[0.02] px-6 py-3 text-[10px] font-semibold text-white/80 transition hover:border-ai-blue/30 hover:text-white disabled:opacity-50"
  >
  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
  {isRefreshing ? 'Scanning...' : `${auditData ? 'Rescan' : 'Run'} ${selectedStrategy} scan`}
  </button>}

  {subscriptionId && <button
  type="button"
  onClick={() => void checkAvailability()}
  disabled={availabilityLoading || Boolean(disabledReason)}
  className="flex items-center justify-center gap-2 border border-white/10 bg-white/[0.02] px-6 py-3 text-[10px] font-semibold text-white/80 transition hover:border-ai-blue/30 hover:text-white disabled:opacity-50"
  >
  <Shield className={`h-4 w-4 ${availabilityLoading ? 'animate-pulse' : ''}`} />
  {availabilityLoading ? 'Checking…' : 'Check availability'}
  </button>}

  {(subscriptionId || onRequestOptimization) && (
  <button
  type="button"
  onClick={() => {
    if (actionsLocked) return;
    setRequestError(null);
    setRequestMessage(null);
    if (subscriptionId) {
      setRequestScanId(scans[0]?.id || '');
      setRequestOpen(true);
    } else {
      onRequestOptimization?.();
    }
  }}
  disabled={actionsLocked}
  title={actionsLocked ? 'Performance actions unlock after handoff and payment closeout.' : undefined}
  className="flex items-center justify-center gap-2 bg-ai-blue px-6 py-3 text-[10px] font-semibold text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-45"
  >
  <LifeBuoy className="h-4 w-4" /> Request an improvement
  </button>
  )}

  </div>
  </div>

  {(errorMessage || disabledReason) && <div role="status" className="border border-amber-300/20 bg-amber-300/[0.05] px-4 py-3 text-xs leading-5 text-amber-100/80">{errorMessage || disabledReason}</div>}

  {availabilityError && <div role="alert" className="border border-rose-300/20 bg-rose-300/[0.05] px-4 py-3 text-xs leading-5 text-rose-100/80">{availabilityError}</div>}
  {displayedAvailability && <div role="status" className={`flex flex-col gap-2 border px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between ${displayedAvailability.status === 'UP' ? 'border-emerald-300/20 bg-emerald-300/[0.04] text-emerald-100/80' : 'border-rose-300/20 bg-rose-300/[0.04] text-rose-100/80'}`}>
    <p><span className="font-semibold">Site {displayedAvailability.status === 'UP' ? 'responded' : 'did not respond'}</span>{displayedAvailability.statusCode ? ` · HTTP ${displayedAvailability.statusCode}` : ''}{displayedAvailability.responseTime ? ` · ${displayedAvailability.responseTime}` : displayedAvailability.latency ? ` · ${displayedAvailability.latency}ms` : ''}{displayedAvailability.error ? ` · ${displayedAvailability.error}` : ''}</p>
    <p className="text-[10px] opacity-60">{(displayedAvailability.timestamp || displayedAvailability.lastChecked) ? `Checked ${new Date((displayedAvailability.timestamp || displayedAvailability.lastChecked) as string).toLocaleString()}` : 'Latest check'}{displayedAvailability.saved === false ? ' · Not saved' : ''}</p>
  </div>}

  {subscriptionId && <section className="border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5" aria-labelledby="availability-history-title">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h3 id="availability-history-title" className="text-xs font-semibold text-white">Availability history</h3>
        <p className="mt-1 text-[10px] text-white/40">Automatic checks every 15 minutes · {availabilitySummary?.periodDays || 30}-day uptime summary · detailed checks kept {availabilitySummary?.retentionDays || 90} days</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-semibold text-white">{availabilitySummary?.uptimePercent == null ? '—' : `${availabilitySummary.uptimePercent}%`}</p>
        <p className="text-[9px] text-white/40">Observed uptime · {availabilitySummary?.scheduledChecks || 0} checks</p>
      </div>
    </div>
    {availabilityHistoryError && <p className="mt-3 text-[10px] text-amber-100/70">{availabilityHistoryError}</p>}
    {!availabilityHistoryError && availabilityHistory.length === 0 && <p className="mt-3 text-[10px] text-white/40">No availability checks recorded yet. Scheduled checks will appear here.</p>}
    {availabilityHistory.length > 0 && <ol className="mt-4 divide-y divide-white/[0.06]">
      {availabilityHistory.slice(0, 8).map(check => <li key={check.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${check.status === 'UP' ? 'bg-emerald-400' : 'bg-rose-400'}`} aria-hidden="true" />
          <span className="text-[10px] font-medium text-white/80">{check.status === 'UP' ? 'Responded' : 'Unavailable'}</span>
          <span className="text-[9px] text-white/35">{check.source === 'manual' ? 'Manual check' : 'Automatic check'}</span>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-white/40">
          {check.responseTimeMs != null && <span>{check.responseTimeMs} ms</span>}
          {check.statusCode != null && <span>HTTP {check.statusCode}</span>}
          <time dateTime={check.checkedAt}>{new Date(check.checkedAt).toLocaleString()}</time>
        </div>
      </li>)}
    </ol>}
  </section>}

  {auditData && (
  <>
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {auditData.metrics.map((metric) => (
  <div key={metric.name} className="flex flex-col justify-between gap-4 border border-white/[0.08] bg-white/[0.02] p-5">
  <metric.icon className={`h-5 w-5 ${metric.color}`} />
  <div className="space-y-1.5">
  <p className="text-[10px] font-semibold text-white/40">{metric.name}</p>
  <div className="flex items-center justify-between gap-3">
  <span className="text-xl font-semibold text-white">
  {metric.value == null ? '—' : `${metric.value}${metric.unit || ''}`}
  </span>
  <span className={`text-[10px] font-semibold ${metric.status === 'good' ? 'text-expert-green' : metric.status === 'warning' ? 'text-amber-300' : 'text-white/35'}`}>
  {metric.status === 'good' ? 'Good' : metric.status === 'warning' ? 'Needs work' : 'Not measured'}
  </span>
  </div>
  </div>
  </div>
  ))}
  </div>

  <div className="border border-white/[0.08] bg-white/[0.02] p-6 lg:p-8">
  <div className="mb-6 flex items-center justify-between">
  <h3 className="text-sm font-semibold text-white">Recommendations</h3>
  <span className="text-[10px] font-semibold text-white/40">
  {auditData.recommendations.length} {auditData.recommendations.length === 1 ? 'item' : 'items'}
  </span>
  </div>

  {auditData.recommendations.length > 0 ? (
  <div className="space-y-3">
  {auditData.recommendations.map((rec, idx) => (
  <div key={idx} className="flex items-start gap-4 border border-white/[0.06] p-4">
  <Info className="mt-0.5 h-4 w-4 shrink-0 text-ai-blue" />
  <div className="space-y-1">
  <p className="text-sm font-semibold text-white/88">{rec.message}</p>
  <span className="text-[10px] font-semibold text-ai-blue">
  {rec.impact || 'Suggested improvement'}
  </span>
  </div>
  </div>
  ))}
  </div>
  ) : (
  <div className="flex flex-col items-center gap-3 border border-dashed border-white/10 py-12 text-center">
  <Check className="h-8 w-8 text-expert-green/50" />
  <p className="text-xs font-semibold text-white/40">No recommendations are available for this scan.</p>
  </div>
  )}
  </div>
  </>
  )}
  {requestMessage && <div role="status" className="border border-emerald-300/20 bg-emerald-300/[0.05] px-4 py-3 text-xs text-emerald-100/80">{requestMessage}</div>}
  {requestError && !requestOpen && <p role="alert" className="border border-rose-300/20 bg-rose-300/[0.05] px-4 py-3 text-xs text-rose-100/80">{requestError}</p>}

  {requestOpen && subscriptionId && (
  <form onSubmit={submitPerformanceRequest} className="space-y-4 border border-ai-blue/20 bg-ai-blue/[0.035] p-5 sm:p-6">
  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
  <div>
  <h3 className="text-sm font-semibold text-white">Tell us what you want to improve</h3>
  <p className="mt-1 text-xs leading-5 text-white/45">This request is linked to this site. The team will review the scope and discuss the quote with you here.</p>
  </div>
  <button type="button" onClick={() => setRequestOpen(false)} className="self-start text-xs font-semibold text-white/45 hover:text-white">Close</button>
  </div>

  {scans.length > 0 && <div className="grid gap-4 sm:grid-cols-2">
  <label className="space-y-2 text-xs font-semibold text-white/65">
  <span>Scan to use as context</span>
  <select value={requestScanId} onChange={event => { setRequestScanId(event.target.value); setFindingIndex(''); }} className="min-h-11 w-full border border-white/10 bg-[#10141d] px-3 text-sm text-white outline-none focus:border-ai-blue/60">
  <option value="">No scan attached</option>
  {scans.map(scan => <option key={scan.id} value={scan.id}>{new Date(scan.scannedAt).toLocaleString()} · {scan.score ?? '—'}/100</option>)}
  </select>
  </label>
  <label className="space-y-2 text-xs font-semibold text-white/65">
  <span>Finding (optional)</span>
  <select value={findingIndex} onChange={event => setFindingIndex(event.target.value)} disabled={!selectedScan || selectedRecommendations.length === 0} className="min-h-11 w-full border border-white/10 bg-[#10141d] px-3 text-sm text-white outline-none focus:border-ai-blue/60 disabled:opacity-50">
  <option value="">Something else / general request</option>
  {selectedRecommendations.map((finding, index) => <option key={`${finding.task}-${index}`} value={index}>{finding.task}</option>)}
  </select>
  </label>
  </div>}

  <label className="block space-y-2 text-xs font-semibold text-white/65">
  <span>What outcome are you looking for? <span className="text-rose-300">*</span></span>
  <textarea required maxLength={3000} value={requestGoal} onChange={event => setRequestGoal(event.target.value)} rows={3} placeholder="For example: make the product pages load faster on mobile." className="w-full resize-y border border-white/10 bg-black/20 px-3 py-3 text-sm font-normal leading-5 text-white outline-none placeholder:text-white/25 focus:border-ai-blue/60" />
  </label>

  <div className="grid gap-4 sm:grid-cols-2">
  <label className="block space-y-2 text-xs font-semibold text-white/65">
  <span>Notes for the team (optional)</span>
  <textarea maxLength={3000} value={requestNotes} onChange={event => setRequestNotes(event.target.value)} rows={3} placeholder="Add any useful context." className="w-full resize-y border border-white/10 bg-black/20 px-3 py-3 text-sm font-normal leading-5 text-white outline-none placeholder:text-white/25 focus:border-ai-blue/60" />
  </label>
  <label className="block space-y-2 text-xs font-semibold text-white/65">
  <span>Reference links (optional, one per line)</span>
  <textarea value={evidenceLinks} onChange={event => setEvidenceLinks(event.target.value)} rows={3} placeholder="https://example.com/reference" className="w-full resize-y border border-white/10 bg-black/20 px-3 py-3 text-sm font-normal leading-5 text-white outline-none placeholder:text-white/25 focus:border-ai-blue/60" />
  <span className="block text-[10px] font-normal text-white/35">You can add up to five HTTPS links.</span>
  </label>
  </div>

  {requestError && <p role="alert" className="text-xs text-rose-200">{requestError}</p>}
  <div className="flex flex-col-reverse gap-2 border-t border-white/[0.07] pt-4 sm:flex-row sm:justify-end">
  <button type="button" onClick={() => setRequestOpen(false)} className="min-h-10 border border-white/10 px-4 text-xs font-semibold text-white/60 hover:text-white">Cancel</button>
  <button type="submit" disabled={requestSending || !requestGoal.trim()} className="min-h-10 bg-ai-blue px-5 text-xs font-semibold text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50">{requestSending ? 'Sending request…' : 'Send request'}</button>
  </div>
  </form>
  )}

  {subscriptionId && (
  <div className="grid gap-5 lg:grid-cols-2">
  <section className="border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
  <div className="mb-4 flex items-center justify-between gap-3">
  <div><h3 className="text-sm font-semibold text-white">Scan history</h3><p className="mt-1 text-xs text-white/40">Saved reports for this site</p></div>
  {historyLoading && <span className="text-[10px] text-white/35">Loading…</span>}
  </div>
  {historyError ? <p className="text-xs text-amber-100/70">{historyError}</p> : scans.length ? <div className="divide-y divide-white/[0.07]">
  {scans.slice(0, 8).map(scan => <div key={scan.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
  <div className="min-w-0"><p className="text-xs font-semibold text-white/80">{new Date(scan.scannedAt).toLocaleString()}</p><p className="mt-1 truncate text-[10px] text-white/35">{scan.url}</p><p className="mt-1 text-[9px] capitalize text-white/30">{scan.conditions?.formFactor || 'mobile'} scan{scan.conditions?.lighthouseVersion ? ` · Lighthouse ${scan.conditions.lighthouseVersion}` : ''}</p></div>
  <span className="shrink-0 text-sm font-semibold text-white">{scan.score ?? '—'}<span className="ml-1 text-[10px] text-white/35">/100</span></span>
  </div>)}
  </div> : <p className="text-xs leading-5 text-white/40">Your completed scans will appear here. Run a scan to start building history.</p>}
  </section>

  <section className="border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
  <div className="mb-4"><h3 className="text-sm font-semibold text-white">Improvement requests</h3><p className="mt-1 text-xs text-white/40">Requests and progress for this site</p></div>
  {requestHistoryError && <p role="alert" className="mb-3 border border-rose-300/20 bg-rose-300/[0.05] px-3 py-2 text-[10px] leading-4 text-rose-100/80">{requestHistoryError}</p>}
  {requests.length ? <div className="space-y-2">
  {requests.slice(0, 6).map(request => <div key={request.id} className="border border-white/[0.06] p-3">
  <div className="flex items-center justify-between gap-3">
  <div className="min-w-0"><p className="truncate text-xs font-semibold text-white/80">{request.title}</p><p className="mt-1 text-[10px] text-white/35">{new Date(request.createdAt).toLocaleDateString()}</p></div>
  <span className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[10px] capitalize text-white/55">{request.status.replace(/_/g, ' ')}</span>
  </div>
  {request.status === 'scope_and_quote' && (() => {
    const quote = request.quoteVersions?.find(item => item.status === 'sent');
    if (!quote) return null;
    const amount = Number(quote.snapshot.totalAgreedAmount || quote.snapshot.amount || 0);
    const currency = quote.snapshot.currency || 'USD';
    return <div className="mt-3 space-y-3 border border-ai-blue/20 bg-ai-blue/[0.035] p-3">
      <div><p className="text-[9px] font-semibold uppercase tracking-wide text-ai-blue">Proposal v{quote.version}</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-white/75">{quote.snapshot.scope}</p></div>
      <div className="grid gap-2 text-[10px] text-white/50 sm:grid-cols-2"><p>Timeline: <span className="text-white/75">{quote.snapshot.timeline || 'To be discussed'}</span></p><p>Payment: <span className="capitalize text-white/75">{String(quote.snapshot.paymentSchedule || '').replace(/_/g, ' ')}</span></p></div>
      <p className="text-sm font-semibold text-white">{currency} {amount.toFixed(2)}{quote.snapshot.paymentSchedule === 'deposit_balance' && <span className="ml-2 text-[10px] font-normal text-white/45">{currency} {Number(quote.snapshot.depositAmount || 0).toFixed(2)} due to start · balance after review</span>}</p>
      <p className="text-[10px] leading-4 text-white/45">Work starts after the required payment is verified. The scope, price, and timeline in this version are saved with your acceptance.</p>
      <label className="flex items-start gap-2 text-[10px] leading-4 text-white/60"><input type="checkbox" checked={Boolean(quoteTermsAccepted[request.id])} onChange={event => setQuoteTermsAccepted(current => ({ ...current, [request.id]: event.target.checked }))} className="mt-0.5 accent-blue-500" /><span>I agree to this proposal’s scope, price, timeline, and payment schedule.</span></label>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void respondToQuote(request.id, 'accept')} disabled={quoteActionId === request.id || !quoteTermsAccepted[request.id]} className="min-h-9 bg-ai-blue px-3 text-[10px] font-semibold text-white disabled:opacity-45">{quoteActionId === request.id ? 'Saving…' : 'Accept proposal'}</button><button type="button" onClick={() => void respondToQuote(request.id, 'decline')} disabled={quoteActionId === request.id} className="min-h-9 border border-white/10 px-3 text-[10px] font-semibold text-white/55 hover:text-white disabled:opacity-45">Decline</button></div>
    </div>;
  })()}
  {['awaiting_payment', 'awaiting_final_payment'].includes(request.status) && (() => {
    const acceptedQuote = request.quoteVersions?.find(item => item.status === 'accepted');
    const expectedStage = request.status === 'awaiting_final_payment' ? `performance_balance_${acceptedQuote?.version}` : `performance_quote_${acceptedQuote?.version}`;
    const invoice = acceptedQuote && request.invoices?.find(item => item.stage === expectedStage);
    if (!invoice || invoice.status === 'paid' || invoice.status === 'void') return null;
    return <div className="mt-3 flex flex-col gap-3 border border-amber-300/20 bg-amber-300/[0.035] p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-semibold text-white">Invoice {invoice.invoiceNumber}</p><p className="mt-1 text-xs text-white/55">{invoice.currency} {(invoice.amountMinor / 100).toFixed(2)} · {invoice.status}</p></div><button type="button" onClick={() => void payPerformanceInvoice(request, invoice)} disabled={invoicePaymentId === invoice.id} className="min-h-9 shrink-0 bg-ai-blue px-3 text-[10px] font-semibold text-white disabled:opacity-50">{invoicePaymentId === invoice.id ? 'Opening checkout…' : 'Pay invoice'}</button></div>;
  })()}
  {request.status === 'in_progress' && <p className="mt-3 border border-emerald-300/15 bg-emerald-300/[0.035] px-3 py-2 text-[10px] leading-4 text-emerald-100/70">Payment is verified. Sitemendr can begin the approved work. Follow progress in this request conversation.</p>}
  {request.status === 'ready_for_review' && <div className="mt-3 space-y-3 border border-ai-blue/20 bg-ai-blue/[0.035] p-3">
    <div><p className="text-[10px] font-semibold text-white">Work ready for your review</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-white/70">{request.completionNotes || request.performanceContext?.completion?.note || 'Sitemendr marked this work ready for review.'}</p></div>
    {request.performanceContext?.completion?.followupScan && <div className="border border-white/[0.07] p-3"><p className="text-[9px] font-semibold uppercase tracking-wide text-white/40">Measured result</p><p className="mt-1 text-xs text-white/75">{request.performanceContext.baseline?.score != null ? <>Before {request.performanceContext.baseline.score}/100 <span className="text-white/35">→</span> After {request.performanceContext.completion.followupScan.score ?? '—'}/100</> : <>Follow-up score {request.performanceContext.completion.followupScan.score ?? '—'}/100 <span className="text-white/40">(no baseline scan was attached)</span></>}</p><p className="mt-1 text-[10px] text-white/40">{request.performanceContext.completion.followupScan.strategy || 'mobile'} scan · {request.performanceContext.completion.followupScan.scannedAt ? new Date(request.performanceContext.completion.followupScan.scannedAt).toLocaleString() : 'date unavailable'}</p>{request.performanceContext.completion.followupScan.url && <p className="mt-1 truncate text-[10px] text-white/40">{request.performanceContext.completion.followupScan.url}</p>}</div>}
    <textarea value={reviewMessage} onChange={event => setReviewMessage(event.target.value)} maxLength={4000} rows={2} className="w-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white outline-none focus:border-ai-blue/50" placeholder="If changes are needed, describe them here." />
    <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void respondToPerformanceReview(request.id, 'accept')} disabled={reviewActionId === request.id} className="min-h-9 bg-ai-blue px-3 text-[10px] font-semibold text-white disabled:opacity-50">{reviewActionId === request.id ? 'Saving…' : 'Accept completed work'}</button><button type="button" onClick={() => void respondToPerformanceReview(request.id, 'changes')} disabled={reviewActionId === request.id || !reviewMessage.trim()} className="min-h-9 border border-white/10 px-3 text-[10px] font-semibold text-white/65 disabled:opacity-45">Request changes</button></div>
    <p className="text-[10px] leading-4 text-white/40">Accepting completes a fully paid request. If a balance remains, it creates the final invoice for payment.</p>
  </div>}
  {request.status === 'completed' && <p className="mt-3 border border-emerald-300/15 bg-emerald-300/[0.035] px-3 py-2 text-[10px] text-emerald-100/70">This Performance request is complete.</p>}
  <button type="button" onClick={() => openRequestId === request.id ? setOpenRequestId(null) : loadConversation(request.id)} className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-ai-blue hover:text-white"><MessageCircle className="h-3.5 w-3.5" />{openRequestId === request.id ? 'Close conversation' : 'Open conversation'}</button>
  {openRequestId === request.id && <div className="mt-3 border-t border-white/[0.07] pt-3">
  <div className="max-h-64 space-y-2 overflow-y-auto py-1">
  {conversationLoading ? <p className="py-4 text-center text-xs text-white/40">Loading conversation…</p> : conversationItems.length ? conversationItems.map(item => {
    const ownMessage = item.senderRole === 'client';
    const systemMessage = item.senderRole === 'system';
    return <div key={item.id} className={`flex ${systemMessage ? 'justify-center' : ownMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[88%] px-3 py-2 ${systemMessage ? 'border border-white/[0.07] text-center text-[10px] text-white/40' : ownMessage ? 'bg-ai-blue/20 text-white/90' : 'border border-white/[0.08] bg-white/[0.035] text-white/80'}`}>
        <p className="whitespace-pre-wrap break-words text-xs leading-5">{item.message}</p>
        <p className="mt-1 text-[9px] text-white/35">{systemMessage ? 'Update' : ownMessage ? 'You' : 'Sitemendr'} · {new Date(item.createdAt).toLocaleString()}</p>
      </div>
    </div>;
  }) : <p className="py-3 text-center text-xs text-white/40">No messages yet. Send a note to start the discussion.</p>}
  </div>
  {conversationError && <p role="alert" className="mt-2 text-[10px] text-rose-200">{conversationError}</p>}
  <form onSubmit={event => sendConversationMessage(event, request.id)} className="mt-3 flex gap-2">
  <input value={conversationDraft} onChange={event => setConversationDraft(event.target.value)} maxLength={4000} placeholder="Write a message…" className="min-h-10 min-w-0 flex-1 border border-white/10 bg-black/20 px-3 text-xs text-white outline-none placeholder:text-white/30 focus:border-ai-blue/60" />
  <button type="submit" disabled={conversationSending || !conversationDraft.trim()} aria-label="Send message" className="inline-flex min-h-10 items-center justify-center gap-2 bg-ai-blue px-3 text-xs font-semibold text-white disabled:opacity-50"><Send className="h-3.5 w-3.5" /><span className="hidden sm:inline">{conversationSending ? 'Sending…' : 'Send'}</span></button>
  </form>
  </div>}
  </div>)}
  </div> : <p className="text-xs leading-5 text-white/40">No improvement requests yet. Start one when you are ready to work with the team.</p>}
  </section>
  </div>
  )}


  </div>
  );
};

export default PerformanceAudit;
