'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Terminal, ArrowUp, X, User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
import { apiClient, User } from '@/lib/api';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await apiClient.getProfile();
      if (res.success) setUser(res.user);
    } catch {
      // User not logged in, ignore
    }
  };

  const handleLogout = async () => {
    await apiClient.logout();
    setUser(null);
    window.location.href = '/';
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when menu is open
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const guestNavItems = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Process', href: '/about#process' },
    { name: 'Pricing', href: '/payment' },
    { name: 'Contact', href: '/contact' },
  ];

  const clientNavItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'My Projects', href: '/dashboard/projects' },
    { name: 'Billing', href: '/dashboard/billing' },
    { name: 'Support', href: '/dashboard/support' },
  ];

  const currentNavItems = user ? clientNavItems : guestNavItems;

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'bg-darker-bg/80 backdrop-blur-lg border-b border-ai-blue/20 py-2 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' : 'bg-transparent py-6'
      }`}>
      {/* Subtle Scanline Effect when scrolled */}
      {isScrolled && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="w-full h-[1px] bg-ai-blue/50 animate-scan shadow-[0_0_8px_rgba(0,102,255,0.8)]"></div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo with HUD elements */}
          <Link href="/" className="flex items-center group relative">
            <div className="absolute -inset-2 bg-ai-blue/10 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* HUD Corner Brackets */}
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-ai-blue/40 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-ai-blue/40 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            
            <span className="relative text-2xl md:text-3xl font-black bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent tracking-tighter">
              Sitemendr
            </span>
            <div className="relative ml-1 w-1.5 h-1.5 bg-ai-blue rounded-full shadow-[0_0_12px_#0066FF] animate-pulse"></div>
            
            {/* Technical Identifier */}
            <span className="ml-3 hidden md:block font-mono text-[10px] text-ai-blue/40 uppercase tracking-[0.2em] self-end mb-1">
              SYS-NAV
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {currentNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="relative px-5 py-2.5 text-[11px] font-bold text-medium-gray hover:text-white transition-all duration-300 group rounded-lg"
              >
                <span className="relative z-10 uppercase tracking-[0.2em] font-mono">{item.name}</span>
                <div className="absolute inset-0 bg-ai-blue/5 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg scale-95 group-hover:scale-100"></div>
                <div className="absolute bottom-1 left-5 right-5 h-[1px] bg-ai-blue scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center"></div>
              </Link>
            ))}
            <div className="ml-6 pl-6 border-l border-white/5 flex items-center gap-6">
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-3 px-4 py-2 bg-ai-blue/5 border border-ai-blue/20 rounded-xl hover:bg-ai-blue/10 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ai-blue to-tech-purple flex items-center justify-center font-black text-[10px] text-white">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="text-left hidden xl:block">
                      <p className="text-[10px] font-black text-white uppercase tracking-tight">{user.name?.split(' ')[0]}</p>
                      <p className="text-[7px] font-mono text-ai-blue uppercase tracking-widest">{user.role}</p>
                    </div>
                    <ChevronDown className={`w-3 h-3 text-medium-gray transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute top-full right-0 mt-3 w-56 bg-darker-bg/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl animate-fade-in z-[60]">
                      <div className="p-4 border-b border-white/5 mb-2">
                        <p className="text-[10px] font-black text-white uppercase truncate">{user.name}</p>
                        <p className="text-[8px] font-mono text-medium-gray truncate">{user.email}</p>
                      </div>
                      <Link 
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 text-[10px] font-black text-medium-gray hover:text-white hover:bg-ai-blue/10 rounded-xl transition-all uppercase tracking-widest"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        href="/dashboard?tab=settings"
                        className="flex items-center gap-3 px-4 py-3 text-[10px] font-black text-medium-gray hover:text-white hover:bg-ai-blue/10 rounded-xl transition-all uppercase tracking-widest"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <UserIcon className="w-4 h-4 text-tech-purple" />
                        Settings
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black text-red-500 hover:bg-red-500/10 rounded-xl transition-all uppercase tracking-widest mt-2 border-t border-white/5"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/dashboard"
                    className="hidden lg:flex relative px-6 py-3 bg-ai-blue/5 border border-ai-blue/20 text-white font-black text-[10px] rounded-lg hover:bg-ai-blue/10 hover:border-ai-blue/40 transition-all duration-300 group overflow-hidden items-center gap-3 uppercase tracking-[0.2em] shadow-lg shadow-ai-blue/5"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-ai-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Terminal className="w-4 h-4 text-ai-blue group-hover:animate-pulse" />
                    <span className="relative z-10 font-mono text-xs">Dashboard</span>
                  </Link>
                  <Link
                    href="/login"
                    className="hidden lg:flex px-4 py-2 text-[10px] font-bold text-medium-gray hover:text-white transition-colors uppercase tracking-widest"
                  >
                    <span className="font-mono">→ Client Portal</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 text-light-text"
            >
              <div className={`w-6 h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></div>
              <div className={`w-6 h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></div>
              <div className={`w-6 h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></div>
            </button>
          </div>
        </div>
      </div>
    </nav>

    {/* Mobile Navigation */}
    <div className={`lg:hidden fixed inset-0 bg-darker-bg/95 backdrop-blur-xl z-40 transition-all duration-700 ease-in-out ${
      isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
    }`}>
      {/* Technical Grid Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,102,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-ai-blue/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative px-8 py-16 space-y-12 flex flex-col items-center text-center h-full overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setIsMenuOpen(false)}
          className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center text-white/60 hover:text-white transition-colors duration-300 z-10"
        >
          <X className="w-8 h-8" />
        </button>

        <div className="space-y-2">
          <span className="font-mono text-[10px] text-ai-blue/100 uppercase tracking-[0.6em]">Main Interface</span>
          <div className="h-px w-12 bg-ai-blue/50 mx-auto"></div>
        </div>

        <div className="flex flex-col space-y-8">
          {currentNavItems.map((item, index) => (
            <Link
              key={item.name}
              href={item.href}
              className={`group relative ${
                isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="text-4xl font-black tracking-tighter text-white group-hover:text-ai-blue transition-colors duration-300 uppercase font-mono">
                {item.name}
              </span>
              <div className="absolute -bottom-2 left-0 right-0 h-px bg-ai-blue/0 group-hover:bg-ai-blue/30 transition-all duration-500 scale-x-0 group-hover:scale-x-100"></div>
            </Link>
          ))}
        </div>

        <div className={`pt-12 w-full max-w-sm transition-all duration-700 delay-500 ${
          isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          {user ? (
            <div className="space-y-4">
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ai-blue to-tech-purple flex items-center justify-center font-black text-white">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-white uppercase tracking-tight">{user.name}</p>
                  <p className="text-[9px] font-mono text-ai-blue uppercase tracking-[0.2em]">{user.role}</p>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="relative block w-full bg-ai-blue text-white py-5 rounded-lg font-mono text-sm tracking-[0.2em] uppercase overflow-hidden group transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="w-full py-5 bg-red-500/10 border border-red-500/20 text-red-500 font-mono text-sm tracking-[0.2em] uppercase rounded-lg hover:bg-red-500 hover:text-white transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/dashboard"
              className="relative block w-full bg-ai-blue/10 border border-ai-blue/30 text-white py-5 rounded-lg font-mono text-sm tracking-[0.2em] uppercase overflow-hidden group transition-all duration-300 hover:bg-ai-blue/20"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-ai-blue/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <span className="relative z-10 flex items-center justify-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-ai-blue shadow-[0_0_8px_#0066FF]"></span>
                Start Assessment
              </span>
            </Link>
          )}
          
          <div className="mt-8 flex justify-center gap-8 font-mono text-[9px] text-white/40 uppercase tracking-widest">
            <span>Node: US-WEST-01</span>
            <span>Port: 443</span>
          </div>
        </div>
        <p className="text-ai-blue/100 text-[7px] font-mono uppercase tracking-[0.4em] pt-8">Sitemendr v4.0.2</p>
      </div>
    </div>

    {/* Back to Top Button */}
    <button
      onClick={scrollToTop}
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-14 h-14 bg-ai-blue text-white rounded-full shadow-[0_0_30px_rgba(0,102,255,0.4)] hover:shadow-[0_0_50px_rgba(0,102,255,0.6)] transition-all duration-300 hover:scale-110 active:scale-95 ${
        showBackToTop ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-20 pointer-events-none'
      }`}
    >
      <ArrowUp className="w-6 h-6" />
    </button>
    </>
  );
}