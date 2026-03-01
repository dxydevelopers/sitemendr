'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { apiClient, Subscription } from '@/lib/api';
import PaymentReminder from './PaymentReminder';
import PaymentWall from './PaymentWall';

interface PaymentStatus {
  active: boolean;
  daysOverdue: number;
  isExpired: boolean;
  nextBillingDate: string;
  amountDue: number;
}

const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/payment/reactivate',
  '/contact',
  '/',
];

export default function PaymentEnforcer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReminder, setShowReminder] = useState(true);

  useEffect(() => {
    // Check if current route is public
    const isPublicRoute = PUBLIC_ROUTES.some(route => 
      pathname === route || pathname?.startsWith('/blog')
    );

    if (isPublicRoute) {
      setLoading(false);
      return;
    }

    const checkStatus = async () => {
      try {
        const token = localStorage.getItem('sitemendr_auth_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await apiClient.getMySubscription();
        if (response.success && response.data && response.data.paymentStatus) {
          setStatus(response.data.paymentStatus);
        }
      } catch (error) {
        console.error('Failed to check payment status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [pathname]);

  if (loading) {
    return <>{children}</>;
  }

  // If status is suspended or blocked by payment wall
  if (status && !status.active) {
    return (
      <PaymentWall
        amountDue={status.amountDue || 29}
        daysOverdue={status.daysOverdue}
        reactivationLink="/payment/reactivate"
      />
    );
  }

  return (
    <>
      {status && status.isExpired && showReminder && (
        <PaymentReminder
          daysLeft={Math.max(0, 14 - status.daysOverdue)} // Adjust based on tier if possible
          amountDue={status.amountDue || 29}
          updatePaymentLink="/payment/billing"
          onDismiss={() => setShowReminder(false)}
        />
      )}
      {children}
    </>
  );
}
