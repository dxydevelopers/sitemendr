// API client for communicating with the backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface AssessmentResultsData {
  recommendedPackage: string;
  confidence: number;
  recommendedFeatures: string[];
  pricing: {
    package: string;
    basePrice: number;
    estimatedTotal: number;
    currency: string;
    breakdown: {
      basePackage: number;
      features: Record<string, number>;
      total: number;
    };
  };
  timeline: string;
  aiInsights: string;
  predictions: {
    trafficIncrease: string;
    conversionImprovement: string;
    roiTimeline: string;
    maintenanceNeeds: string;
  };
  riskAssessment: string[];
  competitorAnalysis: string;
  marketTrends: string[];
  nextSteps: string[];
}

export interface Subscription {
  id: string;
  status: string;
  planType: string;
  tier: string;
  expiresAt: string;
  lastPaymentDate?: string;
  paymentStatus?: {
    active: boolean;
    daysOverdue: number;
    isExpired: boolean;
    nextBillingDate: string;
    amountDue: number;
  };
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  status: string;
  order: number;
}

class ApiClient {
  private baseURL: string;
  private cache: Record<string, { data: unknown; timestamp: number }> = {};
  private pendingRequests: Map<string, Promise<unknown>> = new Map();

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Simple 30-second cache for GET requests to profile and stats to prevent rate limiting
    const cacheKey = `${options.method || 'GET'}:${endpoint}`;
    const now = Date.now();
    const CACHE_TTL = 30000; // 30 seconds

    if (!options.method || options.method === 'GET') {
      if (this.cache[cacheKey] && (now - this.cache[cacheKey].timestamp < CACHE_TTL)) {
        return this.cache[cacheKey].data as T;
      }
      
      // If there's already a pending request for the same endpoint, return that instead of starting a new one
      if (this.pendingRequests.has(cacheKey)) {
        return this.pendingRequests.get(cacheKey) as any;
      }
    }

    const performRequest = async (): Promise<T> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Merge any custom headers from options
      if (options.headers) {
        Object.assign(headers, options.headers);
      }

      // Add authorization header if we have a session token or auth token
      if (typeof window !== 'undefined') {
        const authToken = localStorage.getItem('sitemendr_auth_token');
        const sessionToken = localStorage.getItem('assessment_session_token');
        
        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`;
        } else if (sessionToken) {
          headers.Authorization = `Bearer ${sessionToken}`;
        }
      }

      const config: RequestInit = {
        ...options,
        headers,
      };

      const isProfileCheck = endpoint === '/auth/profile' || endpoint.includes('/auth/profile');

      try {
        const response = await fetch(url, config);
        
        // Handle network errors
        if (!response.ok || response.status >= 400) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
          }
          
          // Clear invalid tokens on 401 Unauthorized
          if (response.status === 401 && typeof window !== 'undefined') {
            // Clear tokens on any 401 to prevent infinite loops of failed requests
            if (!isProfileCheck) {
              console.warn('Invalid or expired token, clearing from localStorage');
            }
            
            localStorage.removeItem('sitemendr_auth_token');
            localStorage.removeItem('assessment_session_token');
            localStorage.removeItem('user');
          }
          
          const error = new Error(errorData.message || `API request failed with status ${response.status}`);
          (error as Error & { status: number }).status = response.status;
          throw error;
        }

        const data = await response.json();
        
        // Save to cache if it's a candidate for caching
        if (!options.method || options.method === 'GET') {
          this.cache[cacheKey] = { data, timestamp: Date.now() };
        }
        
        return data;
      } catch (error) {
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          throw new Error('Unable to connect to the server. Please check your internet connection and ensure the backend server is running.');
        }
        
        // Don't log 401 for profile check as it's expected when not logged in
        if ((error as { status?: number }).status !== 401 || !isProfileCheck) {
          console.error('API request error:', error);
        }
        throw error;
      } finally {
        // Clean up pending requests
        if (!options.method || options.method === 'GET') {
          this.pendingRequests.delete(cacheKey);
        }
      }
    };

    if (!options.method || options.method === 'GET') {
      const requestPromise = performRequest();
      this.pendingRequests.set(cacheKey, requestPromise);
      return requestPromise;
    }

    return performRequest();
  }

  // Generic HTTP methods
  async get<T = unknown>(endpoint: string, options: RequestInit = {}) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, body: unknown, options: RequestInit = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T = unknown>(endpoint: string, body: unknown, options: RequestInit = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T = unknown>(endpoint: string, options: RequestInit = {}) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Auth API methods
  async login(credentials: Record<string, unknown>) {
    this.cache = {}; // Clear cache on login
    const data = await this.request<{ success: boolean; token: string; user: User; message?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sitemendr_auth_token', data.token);
      }
    }
    return data;
  }

  async logout() {
    this.cache = {}; // Clear cache on logout
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sitemendr_auth_token');
      localStorage.removeItem('assessment_session_token');
      localStorage.removeItem('user');
    }
  }

  async getProfile() {
    if (typeof window !== 'undefined') {
      const authToken = localStorage.getItem('sitemendr_auth_token');
      if (!authToken) {
        return { success: false, message: 'No authentication token found', user: {} as User };
      }
    }
    return this.request<{ success: boolean; user: User }>('/auth/profile');
  }

  async register(userData: Record<string, unknown>) {
    return this.request<{ success: boolean; message: string; token?: string; user?: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async forgotPassword(email: string) {
    return this.request<{ success: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(resetData: Record<string, unknown>) {
    return this.request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(resetData),
    });
  }

  async updateProfile(profileData: Record<string, unknown>) {
    this.cache = {}; // Clear cache on update
    return this.request<{ success: boolean; user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData: Record<string, unknown>) {
    return this.request<{ success: boolean }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  async verifyEmail(token: string) {
    return this.request<{ success: boolean; message: string }>(`/auth/verify-email/${token}`);
  }

  async resendVerification() {
    return this.request<{ success: boolean; message: string }>('/auth/resend-verification', {
      method: 'POST',
    });
  }

  // Subscription API methods
  async getMySubscription() {
    return this.request<{ success: boolean; data: Subscription }>('/subscriptions/my-subscription');
  }

  // Payment API methods
  async initializePayment(paymentData: Record<string, unknown>) {
    return this.request<{ success: boolean; data?: { paystack?: { authorization_url: string } }; message?: string }>('/payments/initialize', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async verifyPayment(reference: string) {
    return this.request<{ success: boolean; data: { reference?: string }; message?: string }>(`/payments/verify/${reference}`);
  }

  // Assessment API methods
  async startAssessment(source = 'homepage', referrer = '') {
    return this.request<{ success: boolean; assessmentId: string; sessionToken: string }>('/assessment/start', {
      method: 'POST',
      body: JSON.stringify({ source, referrer }),
    });
  }

  async saveAssessmentResponses(assessmentId: string, step: number, responses: Record<string, unknown>) {
    return this.request<{ success: boolean }>(`/assessment/${assessmentId}/responses`, {
      method: 'POST',
      body: JSON.stringify({ step, responses }),
    });
  }

  async processAssessment(assessmentId: string, finalResponses: Record<string, unknown>) {
    return this.request<{ success: boolean; results: AssessmentResultsData; assessmentId: string }>(`/assessment/${assessmentId}/process`, {
      method: 'POST',
      body: JSON.stringify({ finalResponses }),
    });
  }

  async getAssessmentResults(assessmentId: string) {
    return this.request<{ success: boolean; results: AssessmentResultsData }>(`/assessment/${assessmentId}/results`);
  }

  async convertToLead(assessmentId: string, leadData: Record<string, unknown>) {
    return this.request(`/assessment/${assessmentId}/lead`, {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  }

  // Client Dashboard API methods
  async getClientStats(subscriptionId?: string) {
    const query = subscriptionId ? `?subscriptionId=${subscriptionId}` : '';
    return this.request(`/client/stats${query}`);
  }

  async getSiteVitals(subscriptionId: string) {
    return this.request<{ success: boolean; vitals: Record<string, unknown> }>(`/client/vitals/${subscriptionId}`);
  }

  async getClientProjects() {
    return this.request<{ success: boolean; data: Subscription[] }>('/client/projects');
  }

  async getProjectTemplate(subscriptionId: string) {
    return this.request<{ success: boolean; data: { html: string; css: string; js: string } }>(`/client/projects/${subscriptionId}/template`);
  }

  async updateProjectTemplate(subscriptionId: string, templateData: { html?: string; css?: string; js?: string }) {
    return this.request<{ success: boolean }>(`/client/projects/${subscriptionId}/template`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  }

  async getProjectMilestones(subscriptionId: string) {
    return this.request<{ success: boolean; data: Milestone[] }>(`/client/projects/${subscriptionId}/milestones`);
  }

  async regenerateProjectAI(subscriptionId: string) {
    return this.request<{ success: boolean; message: string }>(`/client/projects/${subscriptionId}/regenerate`, {
      method: 'POST',
    });
  }

  async exportProjectCodebase(subscriptionId: string) {
    return this.request<{ success: boolean; data: { name: string; files: Record<string, string>; instructions: string } }>(`/client/projects/${subscriptionId}/export`);
  }

  async requestProjectReview(subscriptionId: string) {
    return this.request<{ success: boolean; message: string }>(`/client/projects/${subscriptionId}/request-review`, {
      method: 'POST',
    });
  }

  async getClientActivities() {
    return this.request<{ success: boolean; data: unknown[] }>('/client/activities');
  }

  async getClientBilling() {
    return this.request<{ success: boolean; data: unknown[] }>('/client/billing');
  }

  async getClientMessages() {
    return this.request<{ success: boolean; messages: Record<string, unknown>[] }>('/client/messages');
  }

  async sendClientMessage(subject: string, content: string) {
    return this.request<{ success: boolean; message: Record<string, unknown> }>('/client/messages', {
      method: 'POST',
      body: JSON.stringify({ subject, content }),
    });
  }

  async getClientResources() {
    return this.request<{ success: boolean; data: unknown[] }>('/client/resources');
  }

  async getClientSupportTickets(subscriptionId?: string) {
    const query = subscriptionId ? `?subscriptionId=${subscriptionId}` : '';
    return this.request<{ success: boolean; data: Record<string, unknown>[] }>(`/client/support${query}`);
  }

  async getClientSupportTicket(id: string) {
    return this.request<{ success: boolean; data: Record<string, unknown> }>(`/support/tickets/${id}`);
  }

  async createSupportTicket(ticketData: Record<string, unknown>) {
    return this.request<{ success: boolean; data: { ticket: Record<string, unknown>; aiResponse?: string } }>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  }

  async addSupportMessage(id: string, content: string) {
    return this.request<{ success: boolean; data: Record<string, unknown> }>(`/support/tickets/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async getClientDomains() {
    return this.request('/client/domains');
  }

  async addCustomDomain(domainData: Record<string, unknown>) {
    return this.request('/client/domains', {
      method: 'POST',
      body: JSON.stringify(domainData),
    });
  }

  async verifyDomainDNS(domainId: string) {
    return this.request<{ success: boolean; verified: boolean; message: string; records?: string[] }>(`/client/domains/${domainId}/verify`, {
      method: 'POST',
    });
  }

  async requestManagedDomain(email: string, domainInterest: string) {
    return this.request<{ message: string }>('/request-managed-domain', {
      method: 'POST',
      body: JSON.stringify({ email, domainInterest }),
    });
  }

  async optimizeContent(content: string, type: string = 'text', instructions: string = '') {
    return this.request<{ success: boolean; data: string }>('/client/optimize-content', {
      method: 'POST',
      body: JSON.stringify({ content, type, instructions }),
    });
  }

  async sendContactMessage(contactData: Record<string, unknown>) {
    return this.request('/contact', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  // Blog API methods
  async getBlogPosts(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/blog/posts${query ? `?${query}` : ''}`);
  }

  async getBlogPostBySlug(slug: string) {
    return this.request(`/blog/posts/${slug}`);
  }

  async getRelatedPosts(slug: string) {
    return this.request(`/blog/posts/${slug}/related`);
  }

  async getBlogMeta() {
    return this.request('/blog/meta');
  }

  async getBlogComments(slug: string) {
    return this.request(`/blog/posts/${slug}/comments`);
  }

  async addBlogComment(slug: string, content: string) {
    return this.request(`/blog/posts/${slug}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async toggleBlogLike(slug: string) {
    return this.request(`/blog/posts/${slug}/like`, {
      method: 'POST',
    });
  }

  // Ecommerce API methods
  async getAllProducts(subscriptionId?: string) {
    const query = subscriptionId ? `?subscriptionId=${subscriptionId}` : '';
    return this.request<unknown[]>(`/ecommerce/products${query}`);
  }

  async getProductById(id: string) {
    return this.request<unknown>(`/ecommerce/products/${id}`);
  }

  async createOrder(items: Array<{ productId: string; quantity: number }>, subscriptionId?: string) {
    return this.request('/ecommerce/orders', {
      method: 'POST',
      body: JSON.stringify({ items, subscriptionId }),
    });
  }

  async getUserOrders(subscriptionId?: string) {
    const query = subscriptionId ? `?subscriptionId=${subscriptionId}` : '';
    return this.request(`/ecommerce/my-orders${query}`);
  }

  async createProduct(productData: Record<string, unknown>) {
    return this.request('/ecommerce/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: string, productData: Record<string, unknown>) {
    return this.request(`/ecommerce/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/ecommerce/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Booking API methods
  async getAllServices(subscriptionId?: string) {
    const query = subscriptionId ? `?subscriptionId=${subscriptionId}` : '';
    return this.request<unknown[]>(`/booking/services${query}`);
  }

  async createBooking(bookingData: { serviceId: string; startTime: string; notes?: string; subscriptionId?: string }) {
    return this.request('/booking/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async getUserBookings(subscriptionId?: string) {
    const query = subscriptionId ? `?subscriptionId=${subscriptionId}` : '';
    return this.request(`/booking/my-bookings${query}`);
  }

  async createService(serviceData: Record<string, unknown>) {
    return this.request('/booking/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  }

  async updateService(id: string, serviceData: Record<string, unknown>) {
    return this.request(`/booking/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
  }

  async deleteService(id: string) {
    return this.request(`/booking/services/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics API methods
  async getAnalyticsDashboard(period: string = '30d') {
    return this.request(`/analytics/dashboard?period=${period}`);
  }

  async exportAnalytics(type: string, format: string = 'json', period: string = '30d') {
    return this.request(`/analytics/export?type=${type}&format=${format}&period=${period}`);
  }

  // Support Chat API
  async chatWithSupport(message: string, history: Array<{ sender: string; text: string }> = [], chatId?: string) {
    return this.request<{ success: boolean; message: string }>('/support/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history, chatId }),
    });
  }

  // Monitoring API
  async checkUptime() {
    return this.request<{ success: boolean; data: unknown }>('/monitoring/uptime');
  }

  async analyzePerformance(url: string) {
    return this.request<{ success: boolean; data: Record<string, unknown> }>('/monitoring/analyze', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  // Media API methods
  async getMedia() {
    return this.request<{ success: boolean; data: unknown[] }>('/media');
  }

  async uploadMedia(formData: FormData) {
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('sitemendr_auth_token') : null;
    const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('assessment_session_token') : null;
    
    const headers: Record<string, string> = {};
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    } else if (sessionToken) {
      headers.Authorization = `Bearer ${sessionToken}`;
    }

    const response = await fetch(`${this.baseURL}/media/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { message?: string };
      throw new Error(errorData.message || 'Upload failed');
    }

    return response.json() as Promise<{ success: boolean; data: unknown }>;
  }

  async deleteMedia(id: string) {
    return this.request<{ success: boolean }>(`/media/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin Dashboard API methods
  async getAdminStats() {
    return this.request<{ success: boolean; data: Record<string, unknown> }>('/admin/dashboard/stats');
  }

  async getAdminAnalytics() {
    return this.request<{ success: boolean; analytics: Record<string, unknown> }>('/admin/analytics');
  }

  async getAdminSubscriptions() {
    return this.request<{ success: boolean; data: unknown[] }>('/admin/subscriptions');
  }

  async deleteSubscription(id: string) {
    return this.request<{ success: boolean }>(`/admin/subscriptions/${id}`, {
      method: 'DELETE',
    });
  }

  async suspendSubscription(id: string, suspended: boolean) {
    return this.request<{ success: boolean }>(`/admin/subscriptions/${id}/suspend`, {
      method: 'PUT',
      body: JSON.stringify({ suspended }),
    });
  }

  async updateSubscription(id: string, data: Record<string, unknown>) {
    return this.request<{ success: boolean }>(`/admin/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateSubscriptionReview(id: string, reviewData: Record<string, unknown>) {
    return this.request<{ success: boolean; data: unknown }>(`/admin/subscriptions/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify(reviewData),
    });
  }

  async triggerAIGeneration(subscriptionId: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/subscriptions/${subscriptionId}/generate`, {
      method: 'POST',
    });
  }

  async getAdminTemplate(subscriptionId: string) {
    return this.request<{ success: boolean; data: unknown }>(`/admin/subscriptions/${subscriptionId}/template`);
  }

  async updateAdminTemplate(subscriptionId: string, templateData: Record<string, unknown>) {
    return this.request<{ success: boolean }>(`/admin/subscriptions/${subscriptionId}/template`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  }

  async deployTemplate(subscriptionId: string) {
    return this.request<{ success: boolean; data: unknown }>(`/admin/subscriptions/${subscriptionId}/deploy`, {
      method: 'POST',
    });
  }

  async getAdminMilestones(subscriptionId: string) {
    return this.request<{ success: boolean; data: unknown[] }>(`/admin/milestones/${subscriptionId}`);
  }

  async createMilestone(milestoneData: Record<string, unknown>) {
    return this.request<{ success: boolean; data: unknown }>('/admin/milestones', {
      method: 'POST',
      body: JSON.stringify(milestoneData),
    });
  }

  async updateMilestone(id: string, milestoneData: Record<string, unknown>) {
    return this.request<{ success: boolean; data: unknown }>(`/admin/milestones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(milestoneData),
    });
  }

  async deleteMilestone(id: string) {
    return this.request<{ success: boolean }>(`/admin/milestones/${id}`, {
      method: 'DELETE',
    });
  }

  async getAdminSupportTickets(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ success: boolean; data: Record<string, unknown>[] }>(`/admin/support${query ? `?${query}` : ''}`);
  }

  async getAdminSupportTicket(id: string) {
    return this.request<{ success: boolean; data: Record<string, unknown> }>(`/admin/support/${id}`);
  }

  async updateSupportTicket(id: string, data: Record<string, unknown>) {
    return this.request<{ success: boolean }>(`/admin/support/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async addAdminSupportMessage(id: string, content: string) {
    return this.request<{ success: boolean; data: Record<string, unknown> }>(`/admin/support/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async getAdminComments(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<{ success: boolean; data: Record<string, unknown>[] }>(`/admin/comments${query}`);
  }

  async updateCommentStatus(id: string, status: string) {
    return this.request<{ success: boolean }>(`/admin/comments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deleteComment(id: string) {
    return this.request<{ success: boolean }>(`/admin/comments/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin Booking API
  async getAdminBookings() {
    return this.request<{ success: boolean; data: unknown[] }>('/admin/bookings');
  }

  async updateBookingStatus(id: string, status: string) {
    return this.request<{ success: boolean }>(`/admin/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deleteBooking(id: string) {
    return this.request<{ success: boolean }>(`/admin/bookings/${id}`, {
      method: 'DELETE',
    });
  }

  async getAdminLeads() {
    return this.request<{ success: boolean; data: unknown[] }>('/admin/leads');
  }

  async updateLeadStatus(id: string, status: string) {
    return this.request<{ success: boolean }>(`/admin/leads/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deleteLead(id: string) {
    return this.request<{ success: boolean }>(`/admin/leads/${id}`, {
      method: 'DELETE',
    });
  }

  async getAdminUsers() {
    return this.request<{ success: boolean; data: User[] }>('/admin/users');
  }

  async deleteUser(id: string) {
    return this.request<{ success: boolean }>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleUserBan(id: string, banned: boolean) {
    return this.request<{ success: boolean }>(`/admin/users/${id}/ban`, {
      method: 'PUT',
      body: JSON.stringify({ banned }),
    });
  }

  async updateUserRole(id: string, role: string) {
    return this.request<{ success: boolean }>(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async getAdminAssessments() {
    return this.request('/admin/assessments');
  }

  async deleteAssessment(id: string) {
    return this.request<{ success: boolean }>(`/admin/assessments/${id}`, {
      method: 'DELETE',
    });
  }

  async getAdminBlogPosts() {
    return this.request('/admin/blog');
  }

  async createBlogPost(data: Record<string, unknown>) {
    return this.request('/blog/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBlogPost(id: string, data: Record<string, unknown>) {
    return this.request(`/blog/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBlogPost(id: string) {
    return this.request(`/blog/posts/${id}`, {
      method: 'DELETE',
    });
  }

  async publishBlogPost(id: string) {
    return this.request(`/blog/posts/${id}/publish`, {
      method: 'POST',
    });
  }

  async unpublishBlogPost(id: string) {
    return this.request(`/blog/posts/${id}/unpublish`, {
      method: 'POST',
    });
  }

  // Admin System Management
  async getSystemHealth() {
    return this.request('/admin/system/health');
  }

  async getEnforcementSettings() {
    return this.request('/admin/settings/enforcement');
  }

  async updateEnforcementSettings(settings: Record<string, unknown>) {
    return this.request('/admin/settings/enforcement', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async runSuspensionCheck() {
    return this.request('/admin/automation/suspension-check', {
      method: 'POST',
    });
  }

  async runDNSVerification() {
    return this.request('/admin/automation/dns-verify', {
      method: 'POST',
    });
  }

  async healthCheck() {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Helper functions for session management
export const saveSessionToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('assessment_session_token', token);
  }
};

export const getSessionToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('assessment_session_token');
  }
  return null;
};

export const clearSessionToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('assessment_session_token');
  }
};
