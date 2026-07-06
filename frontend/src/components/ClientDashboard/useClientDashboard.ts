// components/client-dashboard/useClientDashboard.ts
//
// All state, data-fetching, socket.io wiring, and action handlers
// for the client dashboard. This is the piece that used to live
// inline at the top of the old ClientDashboard.tsx (~140 useState
// calls' worth of logic). The shell and tab components just consume
// what this hook returns - no fetch/socket code lives in JSX files.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '@/lib/api';
import {
  getDefaultCurrencyForCountry,
  isValidProfilePhone,
  normalizePhoneForCountry,
} from '@/lib/account-profile';
import {
  normalizeDashboardTab,
  loadPaystackInline,
  mapApiProjectToClientProject,
  isApiRecord,
  readApiArray,
} from './utils';
import type {
  ClientStats, ClientProject, ClientActivity, BillingItem, MessageItem,
  SupportTicket, ResourceItem, BookingItem, CustomDomain, UserData,
  ApiRecord, ClientAssessment, ReviewChatMessage, AnalysisResult,
} from './types';
import type { SupporterTier } from '@/lib/api';
import { mockTiers } from './utils';

export function useClientDashboard(initialTab?: string) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(normalizeDashboardTab(initialTab));
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [billing, setBilling] = useState<BillingItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<ClientAssessment | null>(null);
  const [activeBuildChapter, setActiveBuildChapter] = useState<string | null>(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showProjectRequestModal, setShowProjectRequestModal] = useState(false);
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [showAgreementPaymentMethods, setShowAgreementPaymentMethods] = useState(false);
  const [selectedAgreementPaymentMethod, setSelectedAgreementPaymentMethod] = useState('card');
  const [briefResponseAnswers, setBriefResponseAnswers] = useState<Record<string, string>>({});
  const [briefResponseSubmitting, setBriefResponseSubmitting] = useState(false);
  const [briefResponseFeedback, setBriefResponseFeedback] = useState('');
  const [stagingReviewMessage, setStagingReviewMessage] = useState('');
  const [stagingReviewSubmitting, setStagingReviewSubmitting] = useState(false);
  const [reviewChatOpen, setReviewChatOpen] = useState(false);
  const [reviewChatMessages, setReviewChatMessages] = useState<ReviewChatMessage[]>([]);
  const [reviewChatUnreadCount, setReviewChatUnreadCount] = useState(0);
  const [reviewChatLoadedProjectId, setReviewChatLoadedProjectId] = useState<string | null>(null);
  const [reviewChatDraft, setReviewChatDraft] = useState('');
  const [reviewChatLoading, setReviewChatLoading] = useState(false);
  const [reviewChatSending, setReviewChatSending] = useState(false);
  const [handoffMessage, setHandoffMessage] = useState('');
  const [handoffMessageError, setHandoffMessageError] = useState('');
  const [handoffSubmitting, setHandoffSubmitting] = useState(false);
  const [handoffSubmittingAction, setHandoffSubmittingAction] = useState<'complete' | 'issue' | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [openSidebarGroup, setOpenSidebarGroup] = useState<string | null>(null);
  const [mobileRailGroup, setMobileRailGroup] = useState<string | null>(null);
  const [revealTier, setRevealTier] = useState<SupporterTier | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    name: '', phone: '', country: 'US', defaultCurrency: 'USD',
    accountType: 'individual', billingRegion: 'US',
  });
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  const socketRef = useRef<Socket | null>(null);
  const activeTabRef = useRef(activeTab);
  const selectedProjectIdRef = useRef(selectedProjectId);
  const reviewChatOpenRef = useRef(reviewChatOpen);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const revealId = searchParams.get('reveal');
    if (revealId) handleReveal(revealId);
    const tabParam = searchParams.get('tab');
    if (tabParam) setActiveTab(normalizeDashboardTab(tabParam));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReveal = async (tierId: string) => {
    try {
      setIsRevealing(true);
      const res = await apiClient.fetchAllSupporterTiers();
      let tier = null;
      if (res.success) tier = res.tiers.find(t => t.id === tierId);
      if (!tier) tier = mockTiers.find(t => t.id === tierId);
      if (tier) {
        setRevealTier(tier);
        setTimeout(() => setIsRevealing(false), 3000);
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

      const fetchWithTimeout = async <T,>(promise: Promise<T>, name: string, timeoutMs = 20000): Promise<T | null> => {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        try {
          const result = await Promise.race([
            promise,
            new Promise<null>((resolve) => {
              timeout = setTimeout(() => resolve(null), timeoutMs);
            }),
          ]);
          if (timeout) clearTimeout(timeout);
          return result;
        } catch (err) {
          console.warn(`[ClientDashboard] ${name} unavailable:`, err);
          return null;
        }
      };

      const [statsRes, projectsRes, activitiesRes, billingRes, messagesRes, ticketsRes, resourcesRes, domainsRes, bookingsRes] = await Promise.all([
        fetchWithTimeout(apiClient.getClientStats(projectId), 'stats'),
        fetchWithTimeout(apiClient.getClientProjects(), 'projects'),
        fetchWithTimeout(apiClient.getClientActivities(), 'activities'),
        fetchWithTimeout(apiClient.getClientBilling(), 'billing'),
        fetchWithTimeout(apiClient.getClientMessages(), 'messages'),
        fetchWithTimeout(apiClient.getClientSupportTickets(), 'tickets'),
        fetchWithTimeout(apiClient.getClientResources(), 'resources'),
        fetchWithTimeout(apiClient.getClientDomains(), 'domains', 30000),
        fetchWithTimeout(apiClient.getUserBookings(projectId), 'bookings'),
      ]);

      const safeStatsRes = (statsRes || { success: false, stats: null }) as { success: boolean; stats: ClientStats | null };
      const safeProjectsRes = (projectsRes || { success: false, data: [] }) as ApiRecord & { success: boolean };
      const safeActivitiesRes = (activitiesRes || { success: false, data: [] }) as ApiRecord & { success: boolean };
      const safeBillingRes = (billingRes || { success: false, data: [] }) as ApiRecord & { success: boolean };
      const safeMessagesRes = (messagesRes || { success: false, messages: [] }) as ApiRecord & { success: boolean };
      const safeTicketsRes = (ticketsRes || { success: false, data: [] }) as ApiRecord & { success: boolean };
      const safeResourcesRes = (resourcesRes || { success: false, data: [] }) as ApiRecord & { success: boolean };
      const safeDomainsRes = (domainsRes || { success: false, domains: [] }) as ApiRecord & { success: boolean };
      const safeBookingsRes = bookingsRes || [];

      if (safeStatsRes.success && safeStatsRes.stats) setStats(safeStatsRes.stats);

      const projectList = readApiArray<ApiRecord>(safeProjectsRes, ['data', 'projects', 'subscriptions']);
      const mappedProjects = projectList.map(mapApiProjectToClientProject);

      if (mappedProjects.length > 0) {
        setProjects(mappedProjects);
        if (selectedProjectId && !mappedProjects.some(project => project.id === selectedProjectId)) {
          setSelectedProjectId(null);
          setActiveBuildChapter(null);
        }
        if (projectId && !selectedProjectId) {
          const requestedProject = mappedProjects.find((p) => p.id === projectId);
          if (requestedProject) setSelectedProjectId(requestedProject.id);
        }
      } else {
        setProjects([]);
        if (selectedProjectId) {
          setSelectedProjectId(null);
          setActiveBuildChapter(null);
        }
      }

      const activityList = readApiArray<ClientActivity>(safeActivitiesRes, ['data', 'activities']);
      if (safeActivitiesRes.success && activityList) setActivities(activityList);

      const billingList = readApiArray<BillingItem>(safeBillingRes, ['data', 'billing']);
      if (safeBillingRes.success && billingList) setBilling(billingList);

      const messageList = readApiArray<MessageItem>(safeMessagesRes, ['messages', 'data']);
      if (safeMessagesRes.success && messageList) setMessages(messageList);

      const ticketList = readApiArray<SupportTicket>(safeTicketsRes, ['data', 'tickets']);
      if (safeTicketsRes.success && ticketList) setTickets(ticketList);

      const resourceList = readApiArray<ResourceItem>(safeResourcesRes, ['data', 'resources']);
      if (safeResourcesRes.success && resourceList) setResources(resourceList);

      const domainList = readApiArray<CustomDomain>(safeDomainsRes, ['domains', 'data']);
      if (safeDomainsRes.success && domainList) setDomains(domainList);

      if (Array.isArray(safeBookingsRes)) setBookings(safeBookingsRes as BookingItem[]);

      const userData = localStorage.getItem('sitemendr_client_user') || localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'admin') {
          setUser(parsedUser);
          setProfileData({
            name: parsedUser.name || '',
            phone: parsedUser.phone || '',
            country: parsedUser.country || 'US',
            defaultCurrency: parsedUser.defaultCurrency || getDefaultCurrencyForCountry(parsedUser.country || 'US'),
            accountType: parsedUser.accountType || 'individual',
            billingRegion: parsedUser.billingRegion || parsedUser.country || 'US',
          });
        }
      }
    } catch (err) {
      console.error('[ClientDashboard] Fetch failed:', err);
      setFetchError('The workspace could not load all account data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { selectedProjectIdRef.current = selectedProjectId; }, [selectedProjectId]);
  useEffect(() => {
    reviewChatOpenRef.current = reviewChatOpen;
    if (reviewChatOpen) setReviewChatUnreadCount(0);
  }, [reviewChatOpen]);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    let normalizedUrl = socketUrl;
    if (!process.env.NEXT_PUBLIC_SOCKET_URL && normalizedUrl.includes('/api')) {
      normalizedUrl = normalizedUrl.replace(/\/api$/, '');
    }

    socketRef.current = io(normalizedUrl);

    socketRef.current.on('connect', () => {
      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('sitemendr_client_user') || localStorage.getItem('user');
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            if (parsedUser.role !== 'admin') socketRef.current?.emit('join_user', parsedUser.id);
          } catch { /* ignore malformed local user data */ }
        }
      }
    });

    socketRef.current.on('new_support_message', () => {
      if (activeTabRef.current === 'support' || activeTabRef.current === 'dashboard') fetchData();
    });

    socketRef.current.on('new_system_message', () => {
      if (activeTabRef.current === 'messages' || activeTabRef.current === 'dashboard') fetchData();
    });

    socketRef.current.on('project_request_updated', (data: { request?: ApiRecord }) => {
      if (!data?.request) return;
      const updatedProject = mapApiProjectToClientProject(data.request);
      if (!updatedProject.id) return;

      const normalizeSocketStatus = (status?: string) => ({
        quoted: 'quote_ready',
        awaiting_payment: 'approved',
        payment_pending: 'payment_agreement',
        active: 'in_development',
        operational: 'launched',
      }[status || ''] || status || 'submitted');

      let stageChanged = false;
      setProjects(prev => {
        const existingProject = prev.find(project => project.id === updatedProject.id);
        stageChanged = Boolean(existingProject && normalizeSocketStatus(existingProject.status) !== normalizeSocketStatus(updatedProject.status));
        return existingProject
          ? prev.map(project => project.id === updatedProject.id ? { ...project, ...updatedProject } : project)
          : [updatedProject, ...prev];
      });

      const currentSelectedId = selectedProjectIdRef.current;
      if (!currentSelectedId) {
        setSelectedProjectId(updatedProject.id);
      } else if (currentSelectedId === updatedProject.id && stageChanged) {
        setActiveBuildChapter(null);
      }
    });

    socketRef.current.on('review_chat_message', (data: { requestId?: string; message?: ReviewChatMessage }) => {
      if (!data?.message || data.requestId !== selectedProjectIdRef.current) return;
      setReviewChatMessages(prev => prev.some(message => message.id === data.message?.id) ? prev : [...prev, data.message as ReviewChatMessage]);
      if (!reviewChatOpenRef.current && data.message.senderRole !== 'client') {
        setReviewChatUnreadCount(prev => prev + 1);
      }
    });

    return () => { socketRef.current?.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch {
      alert('Failed to export codebase.');
    } finally {
      setExportingId(null);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidProfilePhone(profileData.phone, profileData.country)) {
      setProfileMessage({ text: 'Enter a valid phone number for the selected country.', type: 'error' });
      setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
      return;
    }
    const cleanProfileData = {
      ...profileData,
      phone: normalizePhoneForCountry(profileData.phone, profileData.country),
      billingRegion: profileData.country,
    };
    try {
      const res = await apiClient.updateProfile(cleanProfileData);
      if (res.success) {
        setProfileMessage({ text: 'Settings saved.', type: 'success' });
        const updatedUser: UserData = { ...(user || { id: '', email: '' }), ...(res.user || {}), ...cleanProfileData };
        localStorage.setItem('sitemendr_client_user', JSON.stringify(updatedUser));
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setProfileData(cleanProfileData);
        await fetchData(selectedProjectId || undefined);
      } else {
        setProfileMessage({ text: 'Could not save settings.', type: 'error' });
      }
    } catch {
      setProfileMessage({ text: 'Could not save settings.', type: 'error' });
    }
    setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setPasswordMessage({ text: 'Enter your current and new password.', type: 'error' });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    try {
      const res = await apiClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (res.success) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordMessage({ text: 'Password updated.', type: 'success' });
      } else {
        setPasswordMessage({ text: 'Could not update password.', type: 'error' });
      }
    } catch {
      setPasswordMessage({ text: 'Could not update password.', type: 'error' });
    }
    setTimeout(() => setPasswordMessage({ text: '', type: '' }), 3000);
  };

  const handleAnalyzeSite = async (projectId: string, url: string) => {
    setIsAnalyzing(true);
    try {
      const res = await apiClient.analyzePerformance(url);
      setAnalysisResult(res.data as unknown as AnalysisResult);
      setActiveTab('audit');
    } catch {
      alert('Audit failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleViewAssessment = async (project: ClientProject, briefFallback: Record<string, string>) => {
    const fallbackAssessment: ClientAssessment = {
      id: project.assessmentId || project.id,
      createdAt: project.createdAt || new Date().toISOString(),
      source: 'Build brief',
      responses: {
        ...briefFallback,
        budget: project.budget || 'Not specified',
        timeline: project.timeline || 'Flexible',
      },
    };

    if (!project.assessmentId) {
      setSelectedAssessment(fallbackAssessment);
      setShowAssessmentModal(true);
      return;
    }

    try {
      const res = await apiClient.getAssessmentDetails(project.assessmentId);
      if (res.success) {
        setSelectedAssessment(isApiRecord(res.data) && typeof res.data.id === 'string' ? res.data as ClientAssessment : fallbackAssessment);
        setShowAssessmentModal(true);
      } else {
        setSelectedAssessment(fallbackAssessment);
        setShowAssessmentModal(true);
      }
    } catch {
      setSelectedAssessment(fallbackAssessment);
      setShowAssessmentModal(true);
    }
  };

  const handleQuoteResponse = async (project: ClientProject, action: 'accept' | 'discuss') => {
    if (!project?.id || quoteSubmitting) return;
    setQuoteSubmitting(true);
    try {
      const res = await apiClient.respondToProjectQuote(project.id, action, quoteMessage.trim());
      if (!res.success) throw new Error(res.message || 'Failed to respond to quote');
      setQuoteMessage('');
      await fetchData(project.id);
      setSelectedProjectId(project.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to respond to quote.');
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const handleAgreementPayment = async (
    project: ClientProject,
    selectedMethod: { id: string; label: string; gateway: string; channels?: string[] }
  ) => {
    if (!project?.id || paymentSubmitting) return;
    if (selectedMethod.gateway !== 'paystack') {
      alert(`${selectedMethod.label} needs its own payment gateway setup before it can process this deposit.`);
      return;
    }
    const amount = project.depositAmount || project.totalAgreedAmount || project.quotedAmount;
    if (!amount) { alert('Payment amount is not ready yet.'); return; }
    if (!user?.email) { alert('Your account email is required before checkout can start.'); return; }

    setPaymentSubmitting(true);
    let checkoutOpened = false;
    let checkoutFallbackTimer: number | null = null;
    let checkoutSettled = false;
    try {
      const res = await apiClient.initializePayment({
        amount,
        serviceType: 'build_agreement',
        description: `${project.name} agreement payment`,
        metadata: {
          projectRequestId: project.id,
          paymentStage: project.depositAmount ? 'deposit' : 'agreement',
          buildTitle: project.name,
          checkoutRoute: 'inline_checkout',
          selectedPaymentMethod: selectedMethod.id,
          selectedPaymentChannels: selectedMethod.channels || [],
          currency: project.quoteCurrency || user?.defaultCurrency || 'USD',
        },
      });

      const publicKey = res.data?.publicKey;
      const reference = res.data?.paystack?.reference || res.data?.payment?.reference;
      const accessCode = res.data?.paystack?.access_code;
      const checkoutAmount = res.data?.payment?.amount || Math.round(Number(amount) * 100);
      const checkoutCurrency = res.data?.payment?.currency || project.quoteCurrency || user?.defaultCurrency || 'USD';

      if (res.success && publicKey && reference) {
        await loadPaystackInline();
        if (!window.PaystackPop) throw new Error('Paystack checkout is not available.');

        checkoutOpened = true;
        const popup = new window.PaystackPop();
        const paymentCallbacks = {
          onSuccess: async (response: { reference?: string; trxref?: string }) => {
            checkoutSettled = true;
            if (checkoutFallbackTimer) window.clearTimeout(checkoutFallbackTimer);
            try {
              await apiClient.verifyPayment(response.reference || response.trxref || reference);
              await fetchData(project.id);
              setSelectedProjectId(project.id);
              setShowAgreementPaymentMethods(false);
            } catch (err) {
              alert(err instanceof Error ? err.message : 'Payment was completed, but verification needs support review.');
            } finally {
              setPaymentSubmitting(false);
            }
          },
          onCancel: () => {
            checkoutSettled = true;
            if (checkoutFallbackTimer) window.clearTimeout(checkoutFallbackTimer);
            setPaymentSubmitting(false);
          },
          onError: (error: { message?: string }) => {
            checkoutSettled = true;
            if (checkoutFallbackTimer) window.clearTimeout(checkoutFallbackTimer);
            setPaymentSubmitting(false);
            alert(error.message || 'Payment checkout could not be opened.');
          },
        };
        if (accessCode) {
          popup.resumeTransaction(accessCode, paymentCallbacks);
        } else {
          popup.newTransaction({
            key: publicKey,
            email: user.email,
            amount: checkoutAmount,
            currency: checkoutCurrency,
            ref: reference,
            channels: selectedMethod.channels || ['card', 'bank', 'bank_transfer', 'ussd', 'qr', 'mobile_money', 'eft', 'apple_pay'],
            metadata: { projectRequestId: project.id, checkoutRoute: 'inline_checkout', selectedPaymentMethod: selectedMethod.id },
            ...paymentCallbacks,
          });
        }
        checkoutFallbackTimer = window.setTimeout(() => {
          if (!checkoutSettled) setPaymentSubmitting(false);
        }, 8000);
        return;
      }

      throw new Error(res.message || 'Inline payment checkout could not be started.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start payment checkout.');
    } finally {
      if (!checkoutOpened) setPaymentSubmitting(false);
    }
  };

  const handleBriefClarificationResponse = async (project: ClientProject, responseLines: string[]) => {
    if (!project?.id || briefResponseSubmitting) return;
    setBriefResponseSubmitting(true);
    setBriefResponseFeedback('');
    try {
      const res = await apiClient.respondToBriefClarification(project.id, responseLines.join('\n'));
      if (!res.success) throw new Error(res.message || 'Failed to send brief clarification');
      setBriefResponseAnswers({});
      setBriefResponseFeedback(res.message || 'Your clarification has been sent to the team.');
      await fetchData(project.id);
      setSelectedProjectId(project.id);
    } catch (err) {
      setBriefResponseFeedback(err instanceof Error ? err.message : 'Failed to send brief clarification.');
    } finally {
      setBriefResponseSubmitting(false);
    }
  };

  const handleStagingReviewResponse = async (project: ClientProject, action: 'approve' | 'changes') => {
    if (!project?.id || stagingReviewSubmitting) return;
    setStagingReviewSubmitting(true);
    try {
      const reviewResponseMessage = action === 'changes'
        ? (stagingReviewMessage.trim() || reviewChatDraft.trim())
        : stagingReviewMessage.trim();
      const res = await apiClient.respondToStagingReview(project.id, action, reviewResponseMessage);
      if (!res.success) throw new Error(res.message || 'Failed to respond to staging review');
      setStagingReviewMessage('');
      if (action === 'changes') setReviewChatDraft('');
      await fetchData(project.id);
      setSelectedProjectId(project.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to respond to staging review.');
    } finally {
      setStagingReviewSubmitting(false);
    }
  };

  const fetchClientReviewChat = useCallback(async (requestId: string) => {
    setReviewChatLoading(true);
    try {
      const res = await apiClient.getClientReviewChat(requestId) as { success: boolean; data?: ReviewChatMessage[] };
      if (res.success) {
        setReviewChatMessages(res.data || []);
        setReviewChatLoadedProjectId(requestId);
        setReviewChatUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to load review chat:', error);
    } finally {
      setReviewChatLoading(false);
    }
  }, []);

  useEffect(() => {
    setReviewChatMessages([]);
    setReviewChatDraft('');
    setReviewChatUnreadCount(0);
    setReviewChatLoadedProjectId(null);
  }, [selectedProjectId]);

  useEffect(() => {
    const selectedProject = projects.find(project => project.id === selectedProjectId);
    const shouldLoadReviewChat = Boolean(
      selectedProjectId && selectedProject?.status === 'staging_review' && reviewChatLoadedProjectId !== selectedProjectId
    );
    if (shouldLoadReviewChat && selectedProjectId) fetchClientReviewChat(selectedProjectId);
  }, [fetchClientReviewChat, projects, reviewChatLoadedProjectId, selectedProjectId]);

  const handleSendClientReviewChat = async (projectId: string | undefined, choice?: string) => {
    if (!projectId || reviewChatSending) return;
    const message = (choice || reviewChatDraft).trim();
    if (!message) return;
    setReviewChatSending(true);
    try {
      const res = await apiClient.sendClientReviewChat(projectId, {
        message, kind: choice ? 'choice_response' : 'message', selectedChoice: choice || undefined,
      }) as { success: boolean; data?: ReviewChatMessage; message?: string };
      if (res.success && res.data) {
        setReviewChatMessages(prev => prev.some(item => item.id === res.data?.id) ? prev : [...prev, res.data as ReviewChatMessage]);
        setReviewChatDraft('');
        setReviewChatUnreadCount(0);
        setReviewChatOpen(true);
      }
    } catch (error) {
      console.error('Failed to send review chat message:', error);
    } finally {
      setReviewChatSending(false);
    }
  };

  const handleHandoffResponse = async (project: ClientProject, action: 'complete' | 'issue') => {
    if (!project?.id || handoffSubmitting) return;
    if (action === 'issue' && !handoffMessage.trim()) {
      setHandoffMessageError('Please describe what is missing before sending the handoff issue.');
      return;
    }
    if (action === 'issue' && handoffMessage.trim().length > 2000) {
      setHandoffMessageError('Your message is too long. Please keep it under 2000 characters.');
      return;
    }
    setHandoffMessageError('');
    setHandoffSubmitting(true);
    setHandoffSubmittingAction(action);
    try {
      const res = await apiClient.respondToHandoff(project.id, action, handoffMessage.trim());
      if (!res.success) throw new Error(res.message || 'Failed to respond to handoff');
      setHandoffMessage('');
      await fetchData(project.id);
      setSelectedProjectId(project.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to respond to handoff.');
    } finally {
      setHandoffSubmitting(false);
      setHandoffSubmittingAction(null);
    }
  };

  const handleLogoutAction = (onLogout?: () => void) => {
    apiClient.logout();
    if (onLogout) onLogout();
    router.push('/login');
  };

  const handleVerifyDomain = async (domainId: string, setVerifyingDomainId: (id: string | null) => void) => {
    setVerifyingDomainId(domainId);
    try {
      const res = await apiClient.verifyDomainDNS(domainId);
      if (res.success && res.verified) {
        alert('Domain verified successfully!');
        fetchData();
      } else {
        alert(res.message || 'Verification failed. Please check your DNS records.');
      }
    } catch {
      alert('Verification failed.');
    } finally {
      setVerifyingDomainId(null);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;
    try {
      await apiClient.delete(`/client/domains/${domainId}`);
      alert('Domain deleted.');
      fetchData();
    } catch {
      alert('Failed to delete domain.');
    }
  };

  return {
    router,
    // tab / nav
    activeTab, setActiveTab,
    isSidebarOpen, setIsSidebarOpen,
    isSidebarExpanded, setIsSidebarExpanded,
    openSidebarGroup, setOpenSidebarGroup,
    mobileRailGroup, setMobileRailGroup,
    // data
    stats, projects, setProjects, activities, billing, messages, tickets, resources, bookings, domains,
    loading, user, fetchError, fetchData,
    // project selection / build journey
    selectedProjectId, setSelectedProjectId,
    activeBuildChapter, setActiveBuildChapter,
    isAnalyzing, analysisResult, handleAnalyzeSite,
    exportingId, handleExportCodebase,
    selectedAssessment, showAssessmentModal, setShowAssessmentModal, handleViewAssessment,
    showProjectRequestModal, setShowProjectRequestModal,
    quoteMessage, setQuoteMessage, quoteSubmitting, handleQuoteResponse,
    paymentSubmitting, showAgreementPaymentMethods, setShowAgreementPaymentMethods,
    selectedAgreementPaymentMethod, setSelectedAgreementPaymentMethod, handleAgreementPayment,
    briefResponseAnswers, setBriefResponseAnswers, briefResponseSubmitting, briefResponseFeedback,
    handleBriefClarificationResponse,
    stagingReviewMessage, setStagingReviewMessage, stagingReviewSubmitting, handleStagingReviewResponse,
    reviewChatOpen, setReviewChatOpen, reviewChatMessages, reviewChatUnreadCount,
    reviewChatDraft, setReviewChatDraft, reviewChatLoading, reviewChatSending, handleSendClientReviewChat,
    handoffMessage, setHandoffMessage, handoffMessageError, setHandoffMessageError,
    handoffSubmitting, handoffSubmittingAction, handleHandoffResponse,
    // community reveal
    revealTier, isRevealing, setIsRevealing,
    // settings
    profileData, setProfileData, profileMessage, handleUpdateProfile,
    passwordData, setPasswordData, passwordMessage, handleChangePassword,
    // domains
    handleVerifyDomain, handleDeleteDomain,
    // auth
    handleLogoutAction,
  };
}

export type UseClientDashboardReturn = ReturnType<typeof useClientDashboard>;
