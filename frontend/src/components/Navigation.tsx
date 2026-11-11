'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  ChevronDown,
  CreditCard,
  Headphones,
  LayoutDashboard,
  LogOut,
  FileText,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';
import { apiClient, User } from '@/lib/api';

type NavLink = {
  name: string;
  href: string;
  icon?: LucideIcon;
};

const publicLinks: NavLink[] = [
  { name: 'Services', href: '/#services' },
  { name: 'How it works', href: '/#process' },
  { name: 'Portfolio', href: '/#work' },
  { name: 'Contact', href: '/contact' },
];

const clientNavItems: NavLink[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Projects', href: '/dashboard?tab=projects', icon: Briefcase },
  { name: 'Billing', href: '/dashboard?tab=billing', icon: CreditCard },
  { name: 'Support', href: '/dashboard?tab=support', icon: Headphones },
  { name: 'Resources', href: '/dashboard?tab=resources', icon: FileText },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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
    document.body.style.overflow = isMenuOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  }, [pathname]);

  const closeMenus = () => {
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav
        suppressHydrationWarning
        aria-label="Main navigation"
        className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#05070a]/90 text-white backdrop-blur-xl"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" onClick={closeMenus} className="group flex min-w-0 items-center gap-3">
  <Image src="/Sitemendr_Tech_Logo.png" alt="Sitemendr" width={50} height={40} className="h-7 w-auto object-contain" />
  <span className="text-lg font-bold tracking-tight text-white">Sitemendr</span>
</Link>

            <div className="hidden items-center gap-1 lg:flex">
              {publicLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={closeMenus}
                  className="whitespace-nowrap px-2.5 py-2 text-[13px] font-medium text-white/64 transition hover:text-white"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="hidden items-center gap-3 lg:flex">
              {(mounted && user) ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(!isProfileOpen);
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-white/80 transition hover:text-white"
                  >
                    <span className="grid h-7 w-7 place-items-center bg-ai-blue text-xs font-bold text-white">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                    <span className="hidden max-w-[110px] truncate xl:block">{user.name?.split(' ')[0]}</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-white/36 transition ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-3 w-64 bg-[#071019] p-2 shadow-2xl ring-1 ring-white/10">
                      <div className="border-b border-white/10 px-3 py-2.5">
                        <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                        <p className="truncate text-xs text-white/36">{user.email}</p>
                      </div>
                      {clientNavItems.slice(0, 5).map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={closeMenus}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/64 transition hover:bg-white/[0.06] hover:text-white"
                          >
                            {Icon && <Icon className="h-4 w-4 text-ai-blue" />}
                            {item.name}
                          </Link>
                        );
                      })}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-1 flex w-full items-center gap-3 border-t border-white/10 px-3 py-2.5 text-sm text-red-300 transition hover:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login" onClick={closeMenus} className="text-sm font-medium text-white/64 transition hover:text-white">
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeMenus}
                    className="bg-white px-3.5 py-2 text-sm font-semibold text-black transition hover:bg-ai-blue hover:text-white"
                  >
                    Create account
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(!isMenuOpen);
                setIsProfileOpen(false);
              }}
              className="grid h-9 w-9 place-items-center text-white lg:hidden"
              aria-label="Open main menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </nav>

      <div
        className={`fixed inset-0 z-40 bg-[#05070a] text-white transition lg:hidden ${
          isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto px-5 pb-8 pt-[76px]">
          <div className="divide-y divide-white/10 border-t border-white/10">
            {publicLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={closeMenus}
                className="flex min-h-14 items-center py-4 text-base font-semibold text-white"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="mt-5 grid gap-3 border-t border-white/10 pt-5">
            {(mounted && user) ? (
              <>
                <Link href="/dashboard" onClick={closeMenus} className="bg-white px-5 py-3 text-center text-sm font-semibold text-black">
                  Go to Dashboard
                </Link>
                <button type="button" onClick={handleLogout} className="py-3 text-center text-sm font-semibold text-red-300">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/register" onClick={closeMenus} className="bg-white px-5 py-3 text-center text-sm font-semibold text-black">
                  Create account
                </Link>
                <Link href="/login" onClick={closeMenus} className="ring-1 ring-white/10 px-5 py-3 text-center text-sm font-semibold text-white">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
