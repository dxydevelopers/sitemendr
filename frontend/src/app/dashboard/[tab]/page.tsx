'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ClientDashboard from '@/components/ClientDashboard';

import { apiClient } from '@/lib/api';

export default function DashboardTabPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const tab = params.tab as string;

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('sitemendr_auth_token');
      if (!token) {
        setLoading(false);
        router.push('/login');
        return;
      }

      const data = await apiClient.getProfile();

      if (data.success && data.user) {
        if (data.user.role === 'user' || data.user.role === 'admin' || data.user.role === 'client') {
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleLogout = () => {
    localStorage.removeItem('sitemendr_auth_token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darker-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-ai-blue"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-darker-bg text-white selection:bg-ai-blue/30">
      {isAuthenticated ? (
        <ClientDashboard onLogout={handleLogout} initialTab={tab} />
      ) : null}
    </main>
  );
}
