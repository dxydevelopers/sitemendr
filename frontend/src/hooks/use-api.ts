import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiResponse, User, Subscription, Assessment, Lead, SupportTicket, BlogPost } from '@/lib/types';

// Base API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Get auth token from storage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  // Check both 'token' (new) and 'sitemendr_auth_token' (legacy)
  return localStorage.getItem('token') || localStorage.getItem('sitemendr_auth_token');
}

/**
 * Generic fetch wrapper
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    signal: controller.signal,
  });
  
  clearTimeout(timeoutId);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

// =============================================================================
// AUTH HOOKS
// =============================================================================

/**
 * Login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetchApi<ApiResponse<{ token: string; user: User }>>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      if (response.data?.token) {
        // Store in both keys for compatibility
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('sitemendr_auth_token', response.data.token);
      }
      
      return response;
    },
    onSuccess: () => {
      // Invalidate user queries after login
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Remove both token keys
      localStorage.removeItem('token');
      localStorage.removeItem('sitemendr_auth_token');
      localStorage.removeItem('user');
      return { success: true };
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

/**
 * Get current user
 */
export function useCurrentUser() {
  return useQuery<User | null>({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        // Quick synchronous check for token
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('sitemendr_auth_token') : null;
        if (!token) return null;
        
        const response = await fetchApi<ApiResponse<User> & { user?: User }>('/api/auth/profile');
        return response.data || response.user || null;
      } catch (err) {
        console.error('[useCurrentUser] Error fetching user:', err);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('sitemendr_auth_token');
        }
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 0, // No retries for faster failure
    enabled: typeof window !== 'undefined' && (!!localStorage.getItem('token') || !!localStorage.getItem('sitemendr_auth_token')),
  });
}

// =============================================================================
// SUBSCRIPTION HOOKS
// =============================================================================

/**
 * Get user's subscriptions
 */
export function useSubscriptions() {
  return useQuery<Subscription[]>({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      try {
        // Try to fetch from the specific subscription endpoint first (returns object)
        const subResponse = await fetchApi<ApiResponse<Subscription> & { subscription?: Subscription }>('/api/subscriptions/my-subscription');
        const singleSub = subResponse.data || subResponse.subscription;
        if (singleSub) return [singleSub];

        // Fallback to projects endpoint (returns array)
        const projectsResponse = await fetchApi<ApiResponse<Subscription[]> & { projects?: Subscription[] }>('/api/client/projects');
        return projectsResponse.data || projectsResponse.projects || [];
      } catch (err) {
        console.error('[useSubscriptions] Error fetching subscriptions:', err);
        return []; // Return empty array on error instead of throwing
      }
    },
    staleTime: 60 * 1000,
    enabled: !!getAuthToken(),
    retry: 0, // No retries for faster failure
  });
}

/**
 * Get subscription by ID
 */
export function useSubscription(id: string) {
  return useQuery<Subscription | null>({
    queryKey: ['subscription', id],
    queryFn: () => fetchApi<ApiResponse<Subscription>>(`/api/client/subscriptions/${id}`).then(r => r.data || null),
    enabled: !!id,
    retry: 0,
  });
}

/**
 * Create subscription mutation
 */
export function useCreateSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { planId: string; paymentMethod?: string }) => 
      fetchApi<ApiResponse<Subscription>>('/api/subscriptions/create', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

// =============================================================================
// ASSESSMENT HOOKS
// =============================================================================

/**
 * Get user's assessments
 */
export function useAssessments() {
  return useQuery<Assessment[]>({
    queryKey: ['assessments'],
    queryFn: async () => {
      try {
        const response = await fetchApi<ApiResponse<Assessment[]> & { assessments?: Assessment[] }>('/api/client/assessments');
        return response.data || response.assessments || [];
      } catch (err) {
        console.error('[useAssessments] Error fetching assessments:', err);
        return []; // Return empty array on error instead of throwing
      }
    },
    staleTime: 30 * 1000,
    enabled: !!getAuthToken(),
    retry: 0, // No retries for faster failure
  });
}

/**
 * Get assessment by ID
 */
export function useAssessment(id: string) {
  return useQuery<Assessment | null>({
    queryKey: ['assessment', id],
    queryFn: () => fetchApi<ApiResponse<Assessment>>(`/api/client/assessments/${id}`).then(r => r.data || null),
    enabled: !!id,
    refetchInterval: (query) => {
      // Poll for completion
      const data = query.state.data;
      if (data?.status === 'processing' || data?.status === 'pending') {
        return 5000; // Poll every 5 seconds
      }
      return false; // Stop polling
    },
  });
}

/**
 * Create assessment mutation
 */
export function useCreateAssessment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      businessName: string;
      businessType: string;
      targetAudience?: string;
      keyFeatures?: string[];
    }) => fetchApi<ApiResponse<Assessment>>('/api/assessment/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });
}

// =============================================================================
// LEAD HOOKS (Admin only)
// =============================================================================

/**
 * Get all leads
 */
export function useLeads() {
  return useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: () => fetchApi<ApiResponse<Lead[]>>('/api/admin/leads').then(r => r.data || []),
    staleTime: 30 * 1000,
  });
}

/**
 * Update lead mutation
 */
export function useUpdateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) =>
      fetchApi<ApiResponse<Lead>>(`/api/admin/leads/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

// =============================================================================
// SUPPORT TICKET HOOKS
// =============================================================================

/**
 * Get user's support tickets
 */
export function useSupportTickets() {
  return useQuery<SupportTicket[]>({
    queryKey: ['supportTickets'],
    queryFn: () => fetchApi<ApiResponse<SupportTicket[]>>('/api/client/support').then(r => r.data || []),
    staleTime: 30 * 1000,
  });
}

/**
 * Create support ticket mutation
 */
export function useCreateTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { subject: string; description: string; priority?: string }) =>
      fetchApi<ApiResponse<SupportTicket>>('/api/client/support', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
    },
  });
}

// =============================================================================
// BLOG HOOKS
// =============================================================================

/**
 * Get all blog posts
 */
export function useBlogPosts() {
  return useQuery<BlogPost[]>({
    queryKey: ['blogPosts'],
    queryFn: () => fetchApi<ApiResponse<BlogPost[]>>('/api/blog').then(r => r.data || []),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get blog post by slug
 */
export function useBlogPost(slug: string) {
  return useQuery<BlogPost | null>({
    queryKey: ['blogPost', slug],
    queryFn: () => fetchApi<ApiResponse<BlogPost>>(`/api/blog/${slug}`).then(r => r.data || null),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// =============================================================================
// PREFETCH HELPERS
// =============================================================================

/**
 * Prefetch data for a route
 */
export function usePrefetchQuery() {
  const queryClient = useQueryClient();
  
  return {
    prefetchSubscription: (id: string) => {
      queryClient.prefetchQuery({
        queryKey: ['subscription', id],
        queryFn: () => fetchApi<ApiResponse<Subscription>>(`/api/client/subscriptions/${id}`).then(r => r.data),
      });
    },
    prefetchAssessment: (id: string) => {
      queryClient.prefetchQuery({
        queryKey: ['assessment', id],
        queryFn: () => fetchApi<ApiResponse<Assessment>>(`/api/client/assessments/${id}`).then(r => r.data),
      });
    },
  };
}
