'use client';

import { useSubscriptions, useAssessments, useCurrentUser } from '@/hooks/use-api';
import { Loader2, AlertCircle, CreditCard, FileText, TrendingUp } from 'lucide-react';

/**
 * Dashboard Overview Component
 * 
 * Demonstrates React Query usage for data fetching.
 * Features:
 * - Automatic caching
 * - Loading states
 * - Error handling
 * - Auto-refetch on window focus (can be disabled)
 */
export function DashboardOverview() {
  // Using React Query hooks for data fetching
  const { data: user, isLoading: userLoading, error: userError } = useCurrentUser();
  const { data: subscriptions, isLoading: subsLoading, error: subsError } = useSubscriptions();
  const { data: assessments, isLoading: assessLoading, error: assessError } = useAssessments();

  // Show loading state while fetching
  if (userLoading || subsLoading || assessLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-400">Loading dashboard...</span>
      </div>
    );
  }

  // Show error state
  if (userError || subsError || assessError) {
    return (
      <div className="flex items-center justify-center p-8 text-red-400">
        <AlertCircle className="w-5 h-5 mr-2" />
        <span>Error loading dashboard data. Please try again.</span>
      </div>
    );
  }

  // Calculate stats
  const activeSubscriptions = subscriptions?.filter(s => s.status === 'active').length || 0;
  const completedAssessments = assessments?.filter(a => a.status === 'completed').length || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="text-gray-400 mt-1">
          Here's an overview of your account activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Subscriptions */}
        <div className="bg-dark-card rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Subscriptions</p>
              <p className="text-3xl font-bold text-white mt-1">{activeSubscriptions}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Completed Assessments */}
        <div className="bg-dark-card rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Assessments Completed</p>
              <p className="text-3xl font-bold text-white mt-1">{completedAssessments}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="bg-dark-card rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Account Status</p>
              <p className="text-3xl font-bold text-white mt-1 capitalize">{user?.role || 'User'}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-dark-card rounded-lg p-6 border border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
        
        {assessments && assessments.length > 0 ? (
          <div className="space-y-3">
            {assessments.slice(0, 5).map((assessment) => (
              <div 
                key={assessment.id} 
                className="flex items-center justify-between p-3 bg-dark-bg rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-white font-medium">{assessment.businessName}</p>
                    <p className="text-gray-500 text-sm">{assessment.businessType}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  assessment.status === 'completed' 
                    ? 'bg-green-500/20 text-green-400'
                    : assessment.status === 'processing'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {assessment.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No recent activity. Start your first assessment!
          </p>
        )}
      </div>
    </div>
  );
}

export default DashboardOverview;
