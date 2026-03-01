import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiResponse, User, Subscription, Assessment, Lead, SupportTicket, BlogPost } from '@/lib/types';

// Base API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Get auth token from storage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
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
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
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
        localStorage.setItem('token', response.data.token);
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
      localStorage.removeItem('token');
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
      const token = getAuthToken();
      if (!token) return null;
      
      try {
        const response = await fetchApi<ApiResponse<User>>('/api/auth/me');
        return response.data || null;
      } catch {
        localStorage.removeItem('token');
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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
    queryFn: () => fetchApi<ApiResponse<Subscription[]>>('/api/client/subscriptions'),
    staleTime: 60 * 1000,
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
    queryFn: () => fetchApi<ApiResponse<Assessment[]>>('/api/client/assessments'),
    staleTime: 30 * 1000,
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
    queryFn: () => fetchApi<ApiResponse<Lead[]>>('/api/admin/leads'),
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
    queryFn: () => fetchApi<ApiResponse<SupportTicket[]>>('/api/client/support'),
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
    queryFn: () => fetchApi<ApiResponse<BlogPost[]>>('/api/blog'),
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
