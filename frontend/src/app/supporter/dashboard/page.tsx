'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SupporterDashboard from '@/components/SupporterDashboard';
import { apiClient } from '@/lib/api';

export default function SupporterDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('sitemendr_auth_token');
      if (!token) {
        setLoading(false);
        router.push('/login?redirect=/supporter/dashboard');
        return;
      }

      const data = await apiClient.getProfile();

      if (data.success && data.user) {
        setIsAuthenticated(true);
        // Store user data in localStorage for dashboard display
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        router.push('/login?redirect=/supporter/dashboard');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login?redirect=/supporter/dashboard');
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleLogout = () => {
    apiClient.logout();
    setIsAuthenticated(false);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-ai-blue/20 border-t-ai-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white selection:bg-ai-blue/30">
      {isAuthenticated ? (
        <SupporterDashboard onLogout={handleLogout} />
      ) : null}
    </main>
  );
}
