'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const Navigation = dynamic(() => import("@/components/Navigation"), { ssr: true });
const ChatSupport = dynamic(() => import("@/components/ChatSupport"), { ssr: false });
const PaymentEnforcer = dynamic(() => import("@/components/PaymentEnforcer"), { ssr: true });

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Normalize pathname to handle trailing slashes
  const normalizedPath = pathname?.endsWith('/') && pathname.length > 1 
    ? pathname.slice(0, -1) 
    : pathname;

  // Routes that should NOT have the global navigation, footer, and chat
  const isDashboardRoute = 
    normalizedPath === '/dashboard' || 
    normalizedPath?.startsWith('/dashboard/') || 
    normalizedPath === '/supporter/dashboard' || 
    normalizedPath?.startsWith('/supporter/dashboard/') || 
    normalizedPath === '/admin' || 
    normalizedPath?.startsWith('/admin/') ||
    normalizedPath === '/admin-dashboard' ||
    normalizedPath === '/deployment' ||
    normalizedPath === '/https-config' ||
    normalizedPath?.startsWith('/forgot-password') ||
    normalizedPath?.startsWith('/reset-password') ||
    normalizedPath?.startsWith('/verify-email');

  const isAdminRoute = 
    normalizedPath === '/admin' || 
    normalizedPath?.startsWith('/admin/') ||
    normalizedPath === '/admin-dashboard';

  const isAuthRoute =
    normalizedPath === '/login' || 
    normalizedPath === '/register' || 
    normalizedPath?.startsWith('/forgot-password') || 
    normalizedPath?.startsWith('/reset-password') || 
    normalizedPath?.startsWith('/verify-email');

  return (
    <PaymentEnforcer>
      {!isDashboardRoute && <Navigation />}
      {children}
      {!isAdminRoute && !isAuthRoute && <ChatSupport />}
    </PaymentEnforcer>
  );
}
