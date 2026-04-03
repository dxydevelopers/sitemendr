'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User as UserIcon, LogOut, ChevronDown, Menu, X, Briefcase, Globe, Palette, Search, Mail, Headphones, CreditCard, FileText, Star } from 'lucide-react';
import { apiClient, User } from '@/lib/api';

const guestNavItems = [
  { name: 'Home', href: '/', icon: Globe },
  { name: 'Services', href: '/services', icon: Briefcase },
  { name: 'Portfolio', href: '/about', icon: Palette },
  { name: 'Process', href: '/about#process', icon: Search },
  { name: 'Pricing', href: '/payment', icon: CreditCard },
  { name: 'Contact', href: '/contact', icon: Mail },
];

const clientNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Globe },
  { name: 'My Projects', href: '/dashboard/projects', icon: Briefcase },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Support', href: '/dashboard/support', icon: Headphones },
  { name: 'Resources', href: '/dashboard/resources', icon: FileText },
  { name: 'Rewards', href: '/supporter/dashboard', icon: Star },
];

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  // Use lazy initialization to avoid hydration mismatch
  // Start with true to match client-side rendering
  const [mounted, setMounted] = useState<boolean>(true);

  useEffect(() => {
    setMounted(true);
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await apiClient.getProfile();
      if (res.success) setUser(res.user);
    } catch {
      // User not logged in
    }
  };

  const handleLogout = async () => {
    await apiClient.logout();
    setUser(null);
    window.location.href = '/';
  };

  useEffect(() => {
    // Scroll listener removed - navigation uses consistent styling
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const currentNavItems = user ? clientNavItems : guestNavItems;

  return (
    <>
      {/* Clean Navigation Bar */}
      <nav suppressHydrationWarning className={`fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 shadow-lg py-3 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center group relative">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                Sitemendr
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {currentNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
              
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-700">
                {(mounted && user) ? (
                  <div className="relative">
                    <button 
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-sm font-semibold shadow-md">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="text-left hidden xl:block">
                        <p className="text-sm font-semibold text-white">
                          {user.name?.split(' ')[0]}
                        </p>
                        <p className="text-xs text-gray-400">
                          {user.email}
                        </p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>

                    {isProfileOpen && (
                      <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl p-2">
                        <div className="px-4 py-3 border-b border-gray-100 mb-2">
                          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <Link 
                          href="/dashboard"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Globe className="w-4 h-4 text-blue-600" />
                          Dashboard
                        </Link>
                        <Link 
                          href="/dashboard?tab=settings"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <UserIcon className="w-4 h-4 text-purple-600" />
                          Account Settings
                        </Link>
                        <Link 
                          href="/dashboard/billing"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <CreditCard className="w-4 h-4 text-green-600" />
                          Billing & Payments
                        </Link>
                        <div className="h-px bg-gray-100 my-2"></div>
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-5 py-2.5 text-sm font-medium transition-colors text-gray-300 hover:text-white"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/dashboard"
                      className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      <div className={`lg:hidden fixed inset-0 bg-gray-900 z-40 transition-all duration-300 ${
        isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="flex flex-col h-full pt-24 px-6">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-800">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Sitemendr</span>
          </div>

          {/* Mobile Nav Links */}
          <div className="flex flex-col space-y-2">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-4 px-4 py-3 text-lg font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="w-5 h-5 text-blue-400" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Mobile User Section */}
          <div className="mt-auto pb-8">
            {(mounted && user) ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-xl border border-gray-700">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-lg font-semibold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{user.name}</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="block w-full py-3 text-center bg-blue-600 text-white rounded-lg font-semibold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full py-3 text-center text-red-400 font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <Link
                  href="/login"
                  className="block w-full py-3 text-center border-2 border-gray-700 text-gray-300 rounded-lg font-semibold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/dashboard"
                  className="block w-full py-3 text-center bg-blue-600 text-white rounded-lg font-semibold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
