'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboard from '@/components/AdminDashboard';
import AdminLogin from '@/components/AdminLogin';

import { apiClient } from '@/lib/api';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('sitemendr_auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const data = await apiClient.getProfile();

      if (data.success && data.user) {
        if (data.user.role === 'admin') {
          setIsAuthenticated(true);
          // Store user data in localStorage for dashboard display
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          // Redirect to client dashboard if not admin
          router.push('/dashboard');
        }
      } else {
        // Redirect to login if not authenticated
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

  const handleLogin = () => {
    setIsAuthenticated(true);
    router.push('/admin');
  };

  const handleLogout = () => {
    localStorage.removeItem('sitemendr_auth_token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-ai-blue"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-dark-bg text-light-text">
      {isAuthenticated ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        <AdminLogin onLogin={handleLogin} />
      )}
    </main>
  );
}
