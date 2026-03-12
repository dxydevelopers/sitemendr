'use client';

import { usePathname } from 'next/navigation';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ChatSupport from "@/components/ChatSupport";
import PaymentEnforcer from "@/components/PaymentEnforcer";

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
    normalizedPath === '/login' ||
    normalizedPath === '/register' ||
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
      {!isDashboardRoute && <Footer />}
      {!isAdminRoute && !isAuthRoute && <ChatSupport />}
    </PaymentEnforcer>
  );
}
