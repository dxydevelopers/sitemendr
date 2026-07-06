// components/admin-dashboard/useAdminDashboard.ts
//
// All state, data-fetching, socket.io wiring, and action handlers for
// the admin dashboard. Mirrors useClientDashboard.ts on the client side.
// No JSX lives here - tab components consume what this returns.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '@/lib/api';
import type {
  DashboardStats, Lead, User, Subscription, Assessment, ProjectRequest,
  MediaAsset, AnalyticsData, EnforcementSettings, SiteVitals, StudioTask,
  StudioBlocker, StudioLink, StudioUpdate, ReviewChatMessage,
} from './types';

export function useAdminDashboard(initialTab?: string) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab || 'dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [openSidebarGroup, setOpenSidebarGroup] = useState<string | null>('work');
  const [mobileRailGroup, setMobileRailGroup] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [buildOperatorView, setBuildOperatorView] = useState('overview');
  const [briefMissingItems, setBriefMissingItems] = useState<string[]>([]);
  const [briefClarificationMessage, setBriefClarificationMessage] = useState('');
  const [briefDecisionMessage, setBriefDecisionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [scopeClientNote, setScopeClientNote] = useState('');
  const [studioTaskDraft, setStudioTaskDraft] = useState({ title: '', area: 'design' });
  const [studioBlockerDraft, setStudioBlockerDraft] = useState('');
  const [studioUpdateDraft, setStudioUpdateDraft] = useState('');
  const [studioLinkDraft, setStudioLinkDraft] = useState({ type: 'design', label: '', url: '' });
  const [reviewChatOpen, setReviewChatOpen] = useState(false);
  const [handoffChatMessages, setHandoffChatMessages] = useState<ReviewChatMessage[]>([]);
  const [handoffChatDraft, setHandoffChatDraft] = useState('');
  const [handoffChatLoading, setHandoffChatLoading] = useState(false);
  const [handoffChatSending, setHandoffChatSending] = useState(false);
  const [handoffChatLoadedRequestId, setHandoffChatLoadedRequestId] = useState<string | null>(null);
  const [reviewChatMessages, setReviewChatMessages] = useState<ReviewChatMessage[]>([]);
  const [reviewChatDraft, setReviewChatDraft] = useState('');
  const [reviewChatChoiceDraft, setReviewChatChoiceDraft] = useState('');
  const [reviewChatLoading, setReviewChatLoading] = useState(false);
  const [reviewChatSending, setReviewChatSending] = useState(false);
  const [agreementDraft, setAgreementDraft] = useState({
    paymentAgreementType: '', paymentDueDate: '', totalAgreedAmount: '', depositAmount: '', paymentInstructions: '',
  });
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [projectRequests, setProjectRequests] = useState<ProjectRequest[]>([]);
  const [selectedProjectRequestId, setSelectedProjectRequestId] = useState<string | null>(null);
  const [activeAdminBuildChapter, setActiveAdminBuildChapter] = useState<string | null>(null);
  const [reviewProjects, setReviewProjects] = useState<Subscription[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    users: { total: 0, new: 0, active: 0 }, assessments: { total: 0, conversionRate: 0 },
    leads: { total: 0, conversionRate: 0 }, revenue: { total: 0, averageOrderValue: 0 },
    content: {}, traffic: {}, predictions: { recommendations: [] },
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [selectedSubscriptionForEditor, setSelectedSubscriptionForEditor] = useState<string | null>(null);
  const [selectedSiteForVitals, setSelectedSiteForVitals] = useState<string | null>(null);
  const [siteVitals, setSiteVitals] = useState<SiteVitals | null>(null);
  const [loadingVitals, setLoadingVitals] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [enforcementSettings, setEnforcementSettings] = useState<EnforcementSettings | null>(null);
  const [isSystemWorking, setIsSystemWorking] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const activeTabRef = useRef(activeTab);
  const selectedProjectRequestIdRef = useRef(selectedProjectRequestId);

  const fetchData = useCallback(async () => {
    try {
      if (activeTab === 'dashboard') {
        const res = await apiClient.getAdminStats() as unknown as { success: boolean; data: DashboardStats };
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
      } else if (activeTab === 'project-requests') {
        const res = await apiClient.getAdminProjectRequests() as { success: boolean; data: ProjectRequest[] };
        if (res.success) setProjectRequests(res.data);
      } else if (activeTab === 'assessments') {
        const res = await apiClient.getAdminAssessments() as { success: boolean; data: Assessment[] };
        if (res.success) setAssessments(res.data);
      } else if (activeTab === 'review') {
        const res = await apiClient.getAdminSubscriptions() as { success: boolean; data: Subscription[] };
        if (res.success) setReviewProjects(res.data.filter((s) => s.reviewRequested === true));
      } else if (activeTab === 'media') {
        const res = await apiClient.getMedia() as { success: boolean; data: MediaAsset[] };
        if (res.success) setMedia(res.data);
      } else if (activeTab === 'analytics') {
        const res = await apiClient.getAdminAnalytics() as unknown as { success: boolean; analytics: AnalyticsData };
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

  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { selectedProjectRequestIdRef.current = selectedProjectRequestId; }, [selectedProjectRequestId]);
  useEffect(() => {
    setBriefMissingItems([]);
    setBriefClarificationMessage('');
    setBriefDecisionMessage(null);
  }, [selectedProjectRequestId]);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    let normalizedUrl = socketUrl;
    if (!process.env.NEXT_PUBLIC_SOCKET_URL && normalizedUrl.includes('/api')) {
      normalizedUrl = normalizedUrl.replace(/\/api$/, '');
    }
    socketRef.current = io(normalizedUrl);

    socketRef.current.on('connect', () => { socketRef.current?.emit('admin_join'); });

    socketRef.current.on('new_client_message', () => {
      if (activeTabRef.current === 'dashboard') fetchData();
    });
    socketRef.current.on('new_support_ticket', () => {
      if (activeTabRef.current === 'tickets' || activeTabRef.current === 'dashboard') fetchData();
    });
    socketRef.current.on('new_support_message_from_user', () => {
      if (activeTabRef.current === 'tickets') fetchData();
    });
    socketRef.current.on('project_request_updated', (data: { request?: ProjectRequest }) => {
      if (!data?.request) return;
      setProjectRequests(prev => {
        const exists = prev.some(request => request.id === data.request?.id);
        return exists
          ? prev.map(request => request.id === data.request?.id ? data.request as ProjectRequest : request)
          : [data.request as ProjectRequest, ...prev];
      });
    });
    socketRef.current.on('review_chat_message', (data: { requestId?: string; message?: ReviewChatMessage }) => {
      if (!data?.message || data.requestId !== selectedProjectRequestIdRef.current) return;
      setReviewChatMessages(prev => prev.some(message => message.id === data.message?.id) ? prev : [...prev, data.message as ReviewChatMessage]);
    });

    return () => { socketRef.current?.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  useEffect(() => { fetchData(); }, [fetchData, activeTab]);
  useEffect(() => { if (initialTab) setActiveTab(initialTab); }, [initialTab]);

  const handleRunSuspensionCheck = async () => {
    setIsSystemWorking(true);
    try {
      const res = await apiClient.runSuspensionCheck() as { success: boolean; message: string };
      alert(res.message);
    } catch (error) {
      console.error('Suspension check failed:', error);
    } finally { setIsSystemWorking(false); }
  };

  const handleRunDNSVerification = async () => {
    setIsSystemWorking(true);
    try {
      const res = await apiClient.runDNSVerification() as { success: boolean; message: string };
      alert(res.message);
    } catch (error) {
      console.error('DNS verification failed:', error);
    } finally { setIsSystemWorking(false); }
  };

  const handleUpdateEnforcementSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enforcementSettings) return;
    setSubmitting(true);
    try {
      await apiClient.updateEnforcementSettings(enforcementSettings);
      alert('Settings updated successfully');
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally { setSubmitting(false); }
  };

  const handleUpdateLeadStatus = async (id: string, status: string) => {
    try { await apiClient.updateLeadStatus(id, status); fetchData(); }
    catch (error) { console.error('Failed to update lead status:', error); }
  };

  const handleDeleteLead = async (id: string) => {
    try { await apiClient.deleteLead(id); fetchData(); }
    catch (error) { console.error('Failed to delete lead:', error); }
  };

  const handleToggleUserBan = async (id: string, currentBanned: boolean) => {
    try { await apiClient.toggleUserBan(id, !currentBanned); fetchData(); }
    catch (error) { console.error('Failed to toggle user ban:', error); }
  };

  const handleUpdateUserRole = async (id: string, role: string) => {
    try { await apiClient.updateUserRole(id, role); fetchData(); }
    catch (error) { console.error('Failed to update user role:', error); }
  };

  const handleDeleteUser = async (id: string) => {
    try { await apiClient.deleteUser(id); fetchData(); }
    catch (error) { console.error('Failed to delete user:', error); }
  };

  const handleUploadMedia = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try { await apiClient.uploadMedia(formData); fetchData(); }
    catch (error) {
      console.error('Failed to upload media:', error);
      alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try { await apiClient.deleteMedia(id); fetchData(); }
    catch (error) { console.error('Failed to delete media:', error); }
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
      await apiClient.updateSubscriptionReview(id, { reviewNotes: notes, incrementRevision: increment });
      alert('Review updated successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to update review:', error);
      alert('Review update failed');
    }
  };

  const handleCompleteReview = async (id: string) => {
    if (!confirm('Mark this review as complete? This will notify the user.')) return;
    try {
      await apiClient.updateSubscriptionReview(id, { reviewRequested: false });
      fetchData();
    } catch (err) {
      console.error('Failed to complete review:', err);
      alert('Failed to complete review');
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
    } finally { setIsSystemWorking(false); }
  };

  const handleViewAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setIsAssessmentModalOpen(true);
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;
    try { await apiClient.deleteAssessment(id); fetchData(); }
    catch (error) { console.error('Failed to delete assessment:', error); }
  };

  const handleSuspendSubscription = async (id: string, currentStatus: string) => {
    const isSuspended = currentStatus === 'SUSPENDED';
    if (!confirm(`Are you sure you want to ${isSuspended ? 'unsuspend' : 'suspend'} this node?`)) return;
    try { await apiClient.suspendSubscription(id, !isSuspended); fetchData(); }
    catch (error) { console.error('Failed to update suspension status:', error); }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm('CRITICAL: Delete this node? All associated data will be PERMANENTLY lost.')) return;
    try { await apiClient.deleteSubscription(id); fetchData(); }
    catch (error) { console.error('Failed to delete subscription:', error); }
  };

  const patchProjectRequestLocal = (requestId: string, updater: (request: ProjectRequest) => ProjectRequest) => {
    setProjectRequests(prev => prev.map(request => request.id === requestId ? updater(request) : request));
    setSelectedProjectRequestId(requestId);
  };

  const replaceProjectRequestLocal = (requestId: string, request: ProjectRequest) => {
    setProjectRequests(prev => {
      const exists = prev.some(item => item.id === requestId);
      return exists ? prev.map(item => item.id === requestId ? request : item) : [request, ...prev];
    });
    setSelectedProjectRequestId(requestId);
  };

  const handleUpdateProjectRequest = async (id: string, data: Record<string, unknown>) => {
    setSubmitting(true);
    setBriefDecisionMessage(null);
    patchProjectRequestLocal(id, request => ({ ...request, ...data, updatedAt: new Date().toISOString() } as ProjectRequest));
    try {
      const res = await apiClient.updateAdminProjectRequest(id, data) as { success: boolean; data?: ProjectRequest; message?: string };
      if (res.success) {
        if (!res.data) throw new Error('Build request updated, but the server did not return the updated request.');
        replaceProjectRequestLocal(id, res.data);
        const successText = data.status === 'quote_ready' ? 'Brief approved. Scope is now open for the client.'
          : data.status === 'payment_agreement' ? 'Payment agreement updated.'
          : data.status === 'in_development' ? 'Development started.' : 'Build request updated.';
        setBriefDecisionMessage({ type: 'success', text: successText });
      } else {
        setBriefDecisionMessage({ type: 'error', text: res.message || 'The build request could not be updated.' });
      }
    } catch (error) {
      console.error('Failed to update build request:', error);
      setBriefDecisionMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update build request.' });
    } finally { setSubmitting(false); }
  };

  const fetchAdminReviewChat = useCallback(async (requestId: string) => {
    setReviewChatLoading(true);
    try {
      const res = await apiClient.getAdminReviewChat(requestId) as { success: boolean; data?: ReviewChatMessage[] };
      if (res.success) setReviewChatMessages(res.data || []);
    } catch (error) {
      console.error('Failed to load review chat:', error);
    } finally { setReviewChatLoading(false); }
  }, []);

  useEffect(() => {
    setReviewChatMessages([]);
    setReviewChatDraft('');
    setReviewChatChoiceDraft('');
    if (selectedProjectRequestId && reviewChatOpen) fetchAdminReviewChat(selectedProjectRequestId);
  }, [fetchAdminReviewChat, reviewChatOpen, selectedProjectRequestId]);

  const handleSendAdminReviewChat = async () => {
    if (!selectedProjectRequestId || reviewChatSending) return;
    const message = reviewChatDraft.trim();
    const choices = reviewChatChoiceDraft.split(',').map(c => c.trim()).filter(Boolean);
    if (!message && !choices.length) return;
    setReviewChatSending(true);
    try {
      const res = await apiClient.sendAdminReviewChat(selectedProjectRequestId, {
        message, kind: choices.length ? 'question' : 'message', choices,
      }) as { success: boolean; data?: ReviewChatMessage; message?: string };
      if (res.success && res.data) {
        setReviewChatMessages(prev => prev.some(item => item.id === res.data?.id) ? prev : [...prev, res.data as ReviewChatMessage]);
        setReviewChatDraft('');
        setReviewChatChoiceDraft('');
        setReviewChatOpen(true);
      }
    } catch (error) {
      console.error('Failed to send review chat message:', error);
    } finally { setReviewChatSending(false); }
  };

  // --- Handoff chat: shown inline in the Launch stage whenever a request is
  // in 'handoff' and not yet accepted by the client. Replaces the old
  // regex-parsed "client reported a handoff issue" note.
  const fetchAdminHandoffChat = useCallback(async (requestId: string) => {
    setHandoffChatLoading(true);
    try {
      const res = await apiClient.getAdminHandoffChat(requestId) as { success: boolean; data?: ReviewChatMessage[] };
      if (res.success) {
        setHandoffChatMessages(res.data || []);
        setHandoffChatLoadedRequestId(requestId);
      }
    } catch (error) {
      console.error('Failed to load handoff chat:', error);
    } finally { setHandoffChatLoading(false); }
  }, []);

  useEffect(() => {
    setHandoffChatMessages([]);
    setHandoffChatDraft('');
    setHandoffChatLoadedRequestId(null);
  }, [selectedProjectRequestId]);

  const handleSendAdminHandoffChat = async (requestId: string) => {
    if (!requestId || handoffChatSending) return;
    const message = handoffChatDraft.trim();
    if (!message) return;
    setHandoffChatSending(true);
    try {
      const res = await apiClient.sendAdminHandoffChat(requestId, { message }) as { success: boolean; data?: ReviewChatMessage; message?: string };
      if (res.success && res.data) {
        setHandoffChatMessages(prev => prev.some(item => item.id === res.data?.id) ? prev : [...prev, res.data as ReviewChatMessage]);
        setHandoffChatDraft('');
      }
    } catch (error) {
      console.error('Failed to send handoff chat message:', error);
    } finally { setHandoffChatSending(false); }
  };

  const handleMarkFinalPaymentReceived = (requestId: string) => {
    if (!confirm('Confirm the final balance has been received for this build?')) return;
    handleUpdateProjectRequest(requestId, { finalPaymentConfirmedAt: new Date().toISOString() });
  };

  const applyStudioProjectResponse = (requestId: string, response: { success?: boolean; data?: ProjectRequest; message?: string }) => {
    if (!response.success || !response.data) throw new Error(response.message || 'Studio update failed.');
    replaceProjectRequestLocal(requestId, response.data);
  };

  const handleCreateStudioTask = async (requestId: string) => {
    if (!studioTaskDraft.title.trim()) return;
    const optimisticTask: StudioTask = { id: `pending-task-${Date.now()}`, title: studioTaskDraft.title.trim(), area: studioTaskDraft.area, status: 'active', createdAt: new Date().toISOString() };
    patchProjectRequestLocal(requestId, request => ({ ...request, studioTasks: [optimisticTask, ...(request.studioTasks || [])], updatedAt: new Date().toISOString() }));
    setSubmitting(true);
    try {
      const res = await apiClient.createStudioTask(requestId, studioTaskDraft) as { success: boolean; data?: ProjectRequest; message?: string };
      applyStudioProjectResponse(requestId, res);
      setStudioTaskDraft({ title: '', area: studioTaskDraft.area });
    } catch (error) {
      console.error('Failed to create Studio task:', error);
      alert(error instanceof Error ? error.message : 'Failed to create Studio task');
    } finally { setSubmitting(false); }
  };

  const handleUpdateStudioTask = async (requestId: string, taskId: string, data: Record<string, unknown>) => {
    patchProjectRequestLocal(requestId, request => ({ ...request, studioTasks: (request.studioTasks || []).map(task => task.id === taskId ? { ...task, ...data } as StudioTask : task), updatedAt: new Date().toISOString() }));
    setSubmitting(true);
    try {
      const res = await apiClient.updateStudioTask(requestId, taskId, data) as { success: boolean; data?: ProjectRequest; message?: string };
      applyStudioProjectResponse(requestId, res);
    } catch (error) {
      console.error('Failed to update Studio task:', error);
      alert(error instanceof Error ? error.message : 'Failed to update Studio task');
    } finally { setSubmitting(false); }
  };

  const handleCreateStudioBlocker = async (requestId: string) => {
    if (!studioBlockerDraft.trim()) return;
    const optimisticBlocker: StudioBlocker = { id: `pending-blocker-${Date.now()}`, title: studioBlockerDraft.trim(), area: 'general', status: 'open', createdAt: new Date().toISOString() };
    patchProjectRequestLocal(requestId, request => ({ ...request, studioBlockers: [optimisticBlocker, ...(request.studioBlockers || [])], updatedAt: new Date().toISOString() }));
    setSubmitting(true);
    try {
      const res = await apiClient.createStudioBlocker(requestId, { title: studioBlockerDraft, area: 'general' }) as { success: boolean; data?: ProjectRequest; message?: string };
      applyStudioProjectResponse(requestId, res);
      setStudioBlockerDraft('');
    } catch (error) {
      console.error('Failed to create Studio blocker:', error);
      alert(error instanceof Error ? error.message : 'Failed to create Studio blocker');
    } finally { setSubmitting(false); }
  };

  const handleUpdateStudioBlocker = async (requestId: string, blockerId: string, data: Record<string, unknown>) => {
    patchProjectRequestLocal(requestId, request => ({ ...request, studioBlockers: (request.studioBlockers || []).map(b => b.id === blockerId ? { ...b, ...data } as StudioBlocker : b), updatedAt: new Date().toISOString() }));
    setSubmitting(true);
    try {
      const res = await apiClient.updateStudioBlocker(requestId, blockerId, data) as { success: boolean; data?: ProjectRequest; message?: string };
      applyStudioProjectResponse(requestId, res);
    } catch (error) {
      console.error('Failed to update Studio blocker:', error);
      alert(error instanceof Error ? error.message : 'Failed to update Studio blocker');
    } finally { setSubmitting(false); }
  };

  const handleCreateStudioUpdate = async (requestId: string) => {
    if (!studioUpdateDraft.trim()) return;
    const optimisticUpdate: StudioUpdate = { id: `pending-update-${Date.now()}`, message: studioUpdateDraft.trim(), visibility: 'client', createdAt: new Date().toISOString() };
    patchProjectRequestLocal(requestId, request => ({ ...request, studioUpdates: [optimisticUpdate, ...(request.studioUpdates || [])], updatedAt: new Date().toISOString() }));
    setSubmitting(true);
    try {
      const res = await apiClient.createStudioUpdate(requestId, { message: studioUpdateDraft, visibility: 'client' }) as { success: boolean; data?: ProjectRequest; message?: string };
      applyStudioProjectResponse(requestId, res);
      setStudioUpdateDraft('');
    } catch (error) {
      console.error('Failed to publish Studio update:', error);
      alert(error instanceof Error ? error.message : 'Failed to publish Studio update');
    } finally { setSubmitting(false); }
  };

  const handleCreatePreviewLink = async (requestId: string, url: string) => {
    if (!url.trim()) return;
    const cleanUrl = url.trim();
    const optimisticLink: StudioLink = { id: `pending-preview-${Date.now()}`, label: 'Staging preview', url: cleanUrl, type: 'preview', createdAt: new Date().toISOString() };
    patchProjectRequestLocal(requestId, request => ({ ...request, stagingUrl: cleanUrl, studioLinks: [optimisticLink, ...(request.studioLinks || []).filter(l => l.type !== 'preview')], updatedAt: new Date().toISOString() }));
    setSubmitting(true);
    try {
      const res = await apiClient.createStudioLink(requestId, { label: 'Staging preview', url: cleanUrl, type: 'preview' }) as { success: boolean; data?: ProjectRequest; message?: string };
      applyStudioProjectResponse(requestId, res);
    } catch (error) {
      console.error('Failed to save preview link:', error);
      alert(error instanceof Error ? error.message : 'Failed to save preview link');
    } finally { setSubmitting(false); }
  };

  const handleClearPreviewLink = async (requestId: string, previewLinkId?: string, previewLinkLabel?: string) => {
    patchProjectRequestLocal(requestId, request => ({ ...request, stagingUrl: '', studioLinks: (request.studioLinks || []).map(l => l.type === 'preview' ? { ...l, url: '' } as StudioLink : l), updatedAt: new Date().toISOString() }));
    setSubmitting(true);
    try {
      let latestRequest: ProjectRequest | undefined;
      if (previewLinkId) {
        const linkRes = await apiClient.updateStudioLink(requestId, previewLinkId, { url: '', label: previewLinkLabel || 'Staging preview' }) as { success: boolean; data?: ProjectRequest; message?: string };
        if (!linkRes.success) throw new Error(linkRes.message || 'Failed to clear preview artifact');
        latestRequest = linkRes.data;
      }
      const requestRes = await apiClient.updateAdminProjectRequest(requestId, { stagingUrl: '' }) as { success: boolean; data?: ProjectRequest; message?: string };
      if (!requestRes.success || !requestRes.data) throw new Error(requestRes.message || 'Failed to clear preview link');
      latestRequest = requestRes.data || latestRequest;
      if (latestRequest) {
        setProjectRequests(prev => prev.map(request => request.id === requestId ? latestRequest as ProjectRequest : request));
        setSelectedProjectRequestId(requestId);
      }
    } catch (error) {
      console.error('Failed to clear preview link:', error);
      alert(error instanceof Error ? error.message : 'Failed to clear preview link');
    } finally { setSubmitting(false); }
  };

  const handleCreateStudioLink = async (requestId: string) => {
    if (!studioLinkDraft.label.trim() && !studioLinkDraft.url.trim()) return;
    const optimisticLink: StudioLink = { id: `pending-link-${Date.now()}`, type: studioLinkDraft.type, label: studioLinkDraft.label.trim() || studioLinkDraft.type.replace(/_/g, ' '), url: studioLinkDraft.url.trim(), createdAt: new Date().toISOString() };
    patchProjectRequestLocal(requestId, request => ({ ...request, studioLinks: [optimisticLink, ...(request.studioLinks || [])], updatedAt: new Date().toISOString() }));
    setSubmitting(true);
    try {
      const res = await apiClient.createStudioLink(requestId, { type: studioLinkDraft.type, label: studioLinkDraft.label.trim() || studioLinkDraft.type.replace(/_/g, ' '), url: studioLinkDraft.url.trim() }) as { success: boolean; data?: ProjectRequest; message?: string };
      applyStudioProjectResponse(requestId, res);
      setStudioLinkDraft({ type: studioLinkDraft.type, label: '', url: '' });
    } catch (error) {
      console.error('Failed to add Studio artifact:', error);
      alert(error instanceof Error ? error.message : 'Failed to add Studio artifact');
    } finally { setSubmitting(false); }
  };

  const handleLogout = (onLogout: () => void) => {
    onLogout();
    router.push('/');
  };

  const openAdminTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false);
    setMobileRailGroup(null);
    if (typeof window !== 'undefined') window.history.pushState(null, '', `/admin/${tabId}`);
  };

  return {
    router,
    activeTab, setActiveTab, openAdminTab,
    isSidebarOpen, setIsSidebarOpen, isSidebarExpanded, setIsSidebarExpanded,
    openSidebarGroup, setOpenSidebarGroup, mobileRailGroup, setMobileRailGroup,
    searchTerm, setSearchTerm, filterStatus, setFilterStatus,
    buildOperatorView, setBuildOperatorView,
    briefMissingItems, setBriefMissingItems, briefClarificationMessage, setBriefClarificationMessage,
    briefDecisionMessage, setBriefDecisionMessage, scopeClientNote, setScopeClientNote,
    studioTaskDraft, setStudioTaskDraft, studioBlockerDraft, setStudioBlockerDraft,
    studioUpdateDraft, setStudioUpdateDraft, studioLinkDraft, setStudioLinkDraft,
    reviewChatOpen, setReviewChatOpen, reviewChatMessages, reviewChatDraft, setReviewChatDraft,
    reviewChatChoiceDraft, setReviewChatChoiceDraft, reviewChatLoading, reviewChatSending, handleSendAdminReviewChat,
    handoffChatMessages, handoffChatDraft, setHandoffChatDraft, handoffChatLoading, handoffChatSending,
    handoffChatLoadedRequestId, fetchAdminHandoffChat, handleSendAdminHandoffChat, handleMarkFinalPaymentReceived,
    agreementDraft, setAgreementDraft,
    stats, leads, users, subscriptions, assessments, projectRequests, setProjectRequests,
    selectedProjectRequestId, setSelectedProjectRequestId, activeAdminBuildChapter, setActiveAdminBuildChapter,
    reviewProjects, media, analytics, loading, submitting, fetchData,
    selectedAssessment, selectedSubscriptionForEditor, setSelectedSubscriptionForEditor,
    selectedSiteForVitals, setSelectedSiteForVitals, siteVitals, setSiteVitals, loadingVitals, setLoadingVitals,
    isAssessmentModalOpen, setIsAssessmentModalOpen, enforcementSettings, setEnforcementSettings, isSystemWorking,
    handleRunSuspensionCheck, handleRunDNSVerification, handleUpdateEnforcementSettings,
    handleUpdateLeadStatus, handleDeleteLead, handleToggleUserBan, handleUpdateUserRole, handleDeleteUser,
    handleUploadMedia, handleDeleteMedia, handleDeploySite, handleUpdateReview, handleCompleteReview,
    handleTriggerAIGeneration, handleViewAssessment, handleDeleteAssessment,
    handleSuspendSubscription, handleDeleteSubscription,
    handleUpdateProjectRequest, patchProjectRequestLocal, replaceProjectRequestLocal,
    handleCreateStudioTask, handleUpdateStudioTask, handleCreateStudioBlocker, handleUpdateStudioBlocker,
    handleCreateStudioUpdate, handleCreatePreviewLink, handleClearPreviewLink, handleCreateStudioLink,
    handleLogout,
  };
}

export type UseAdminDashboardReturn = ReturnType<typeof useAdminDashboard>;
