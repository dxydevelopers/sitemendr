'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  ChevronDown,
  CircleDollarSign,
  Code2,
  Cookie,
  CreditCard,
  FileText,
  FolderKanban,
  Gauge,
  Globe,
  Headphones,
  Home,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  MonitorCheck,
  Package,
  ReceiptText,
  Rocket,
  Scale,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Undo2,
  UserPlus,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { apiClient, User } from '@/lib/api';

type NavLink = {
  name: string;
  href: string;
  icon?: LucideIcon;
  description?: string;
  accent?: string;
  disabled?: boolean;
};

type NavSection = {
  title: string;
  links: NavLink[];
};

type MegaMenu = {
  label: string;
  sections: NavSection[];
  feature?: NavLink;
};

const megaMenus: MegaMenu[] = [
  {
    label: 'Services',
    sections: [
      {
        title: 'Core Paths',
        links: [
          { name: 'All Services', href: '/services', icon: Briefcase, description: 'Complete service overview.', accent: 'text-ai-blue' },
          { name: 'Build Overview', href: '/services/development', icon: Code2, description: 'Websites, portals, and platforms.', accent: 'text-ai-blue' },
          { name: 'Repair Overview', href: '/services/development#repair', icon: Wrench, description: 'Fixes, audits, and recovery.', accent: 'text-expert-green' },
          { name: 'Grow Overview', href: '/services/ecommerce', icon: ShoppingBag, description: 'Commerce and dropshipping launch paths.', accent: 'text-amber-300' },
        ],
      },
      {
        title: 'Service Types',
        links: [
          { name: 'Custom Development', href: '/services/development#custom-development', icon: Building2, description: 'Custom apps and integrations.', accent: 'text-ai-blue' },
          { name: 'Business Websites', href: '/services/development#business-websites', icon: Globe, description: 'Professional public websites.', accent: 'text-ai-blue' },
          { name: 'Maintenance', href: '/services/development#maintenance', icon: ShieldCheck, description: 'Ongoing care and monitoring.', accent: 'text-expert-green' },
          { name: 'eCommerce Solutions', href: '/services/ecommerce#storefront-setup', icon: Store, description: 'Storefront and checkout structure.', accent: 'text-amber-300' },
        ],
      },
      {
        title: 'Delivery',
        links: [
          { name: 'Self-Hosted Delivery', href: '/services/development#self-hosted', icon: Package, description: 'Code handoff and ownership.', accent: 'text-tech-purple' },
          { name: 'Build Pricing', href: '', icon: CreditCard, description: 'Custom build investment paths.', accent: 'text-ai-blue', disabled: true },
          { name: 'Repair Pricing', href: '', icon: CreditCard, description: 'Repair and recovery pricing.', accent: 'text-expert-green', disabled: true },
          { name: 'Maintenance Plans', href: '', icon: CreditCard, description: 'Monthly care options.', accent: 'text-expert-green', disabled: true },
        ],
      },
    ],
    feature: { name: 'Create Workspace', href: '/register', icon: UserPlus, description: 'Start with a private Sitemendr workspace.', accent: 'text-ai-blue' },
  },
  {
    label: 'Workspace',
    sections: [
      {
        title: 'Entry',
        links: [
          { name: 'Create Workspace', href: '/register', icon: UserPlus, description: 'Open a new client account.', accent: 'text-ai-blue' },
          { name: 'Client Login', href: '/login', icon: LockKeyhole, description: 'Return to your workspace.', accent: 'text-ai-blue' },
          { name: 'Client Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Projects, messages, and billing.', accent: 'text-ai-blue' },
          { name: 'Workspace Preview', href: '/workspace', icon: MonitorCheck, description: 'See the dashboard model.', accent: 'text-expert-green' },
        ],
      },
      {
        title: 'Workflow',
        links: [
          { name: 'Operating Flow', href: '/workspace#operating-flow', icon: Activity, description: 'Account to delivery journey.', accent: 'text-amber-300' },
          { name: 'Process Page', href: '/process', icon: Rocket, description: 'Full delivery process.', accent: 'text-amber-300' },
          { name: 'My Projects', href: '/dashboard?tab=projects', icon: FolderKanban, description: 'Active work and status.', accent: 'text-ai-blue' },
          { name: 'Billing Area', href: '/dashboard?tab=billing', icon: ReceiptText, description: 'Payments and subscriptions.', accent: 'text-tech-purple' },
        ],
      },
      {
        title: 'Support',
        links: [
          { name: 'Support Center', href: '/help', icon: Headphones, description: 'Help articles and support.', accent: 'text-tech-purple' },
          { name: 'Support Tickets', href: '/dashboard?tab=support', icon: MessageSquare, description: 'Dashboard support requests.', accent: 'text-expert-green' },
          { name: 'Resources', href: '/dashboard?tab=resources', icon: BookOpen, description: 'Client resources.', accent: 'text-ai-blue' },
          { name: 'Account Settings', href: '/dashboard?tab=settings', icon: Settings, description: 'Profile and account controls.', accent: 'text-white/70' },
        ],
      },
    ],
    feature: { name: 'How Sitemendr Works', href: '/process', icon: Activity, description: 'Create account, choose path, approve, and track delivery.', accent: 'text-amber-300' },
  },
  {
    label: 'Company',
    sections: [
      {
        title: 'Company',
        links: [
          { name: 'Home', href: '/', icon: Home, description: 'Sitemendr front gate.', accent: 'text-ai-blue' },
          { name: 'About', href: '/about', icon: BadgeCheck, description: 'Company and standards.', accent: 'text-ai-blue' },
          { name: 'Portfolio', href: '/portfolio', icon: FolderKanban, description: 'Work and proof.', accent: 'text-ai-blue' },
          { name: 'Case Studies', href: '/case-studies', icon: Gauge, description: 'Outcome stories.', accent: 'text-expert-green' },
        ],
      },
      {
        title: 'Connect',
        links: [
          { name: 'Contact', href: '/contact', icon: Mail, description: 'Speak with the team.', accent: 'text-expert-green' },
          { name: 'Contact Sales', href: '/contact?intent=sales', icon: MessageSquare, description: 'Discuss a new project.', accent: 'text-expert-green' },
          { name: 'Community', href: '/community', icon: Sparkles, description: 'Membership, learning, and opportunity.', accent: 'text-amber-300' },
          { name: 'Community Dashboard', href: '/dashboard/supporter', icon: CircleDollarSign, description: 'Community access and account perks.', accent: 'text-amber-300' },
        ],
      },
      {
        title: 'Policy',
        links: [
          { name: 'Legal', href: '/legal', icon: Scale, accent: 'text-white/70' },
          { name: 'Privacy Policy', href: '/privacy', icon: ShieldCheck, accent: 'text-ai-blue' },
          { name: 'Terms Of Service', href: '/terms', icon: Scale, accent: 'text-white/70' },
          { name: 'Refund Policy', href: '/refund', icon: Undo2, accent: 'text-amber-300' },
          { name: 'Cookie Policy', href: '/cookie-policy', icon: Cookie, accent: 'text-tech-purple' },
        ],
      },
    ],
  },
];

const directLinks: NavLink[] = [
  { name: 'Pricing', href: '/pricing' },
  { name: 'Resources', href: '/resources' },
  { name: 'Blog', href: '/blog' },
];

const clientNavItems: NavLink[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Projects', href: '/dashboard?tab=projects', icon: Briefcase },
  { name: 'Billing', href: '/dashboard?tab=billing', icon: CreditCard },
  { name: 'Support', href: '/dashboard?tab=support', icon: Headphones },
  { name: 'Resources', href: '/dashboard?tab=resources', icon: FileText },
  { name: 'Community', href: '/dashboard/supporter', icon: Sparkles },
];

function NavItem({ item, onClick }: { item: NavLink; onClick: () => void }) {
  const Icon = item.icon;
  const content = (
    <>
      {Icon && <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${item.disabled ? 'text-white/24' : item.accent || 'text-white/40'}`} />}
      <span className="min-w-0">
        <span className={`block font-semibold leading-5 ${item.disabled ? 'text-white/42' : 'text-white/86 group-hover:text-white'}`}>{item.name}</span>
        {item.description && <span className="mt-0.5 block text-xs leading-5 text-white/42">{item.description}</span>}
      </span>
    </>
  );

  if (item.disabled) {
    return (
      <div
        aria-disabled="true"
        className="flex min-h-[52px] cursor-default items-start gap-3 px-2 py-2.5 text-sm opacity-75"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="group flex min-h-[52px] items-start gap-3 px-2 py-2.5 text-sm transition hover:bg-white/[0.045]"
    >
      {content}
    </Link>
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
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
    setActiveMenu(null);
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  }, [pathname]);

  const closeMenus = () => {
    setActiveMenu(null);
    setIsProfileOpen(false);
    setIsMenuOpen(false);
  };

  const activeMegaMenu = megaMenus.find((menu) => menu.label === activeMenu);

  return (
    <>
      <nav
        suppressHydrationWarning
        onMouseLeave={() => setActiveMenu(null)}
        className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#05070a]/90 text-white backdrop-blur-xl"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" onClick={closeMenus} className="group flex min-w-0 items-center gap-3">
  <Image src="/Sitemendr_Tech_Logo.png" alt="Sitemendr" width={50} height={40} className="h-7 w-auto object-contain" />
  <span className="text-lg font-bold tracking-tight text-white">Sitemendr</span>
</Link>

            <div className="hidden items-center gap-0.5 lg:flex">
              {megaMenus.map((menu) => (
                <button
                  key={menu.label}
                  type="button"
                  onMouseEnter={() => setActiveMenu(menu.label)}
                  onFocus={() => setActiveMenu(menu.label)}
                  onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition ${
                    activeMenu === menu.label ? 'text-white' : 'text-white/66 hover:text-white'
                  }`}
                >
                  {menu.label}
                  <ChevronDown className={`h-3.5 w-3.5 transition ${activeMenu === menu.label ? 'rotate-180 text-white/60' : 'text-white/34'}`} />
                </button>
              ))}
              {directLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={closeMenus}
                  className="px-3 py-2 text-sm font-medium text-white/66 transition hover:text-white"
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
                      setActiveMenu(null);
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-white/76 transition hover:text-white"
                  >
                    <span className="grid h-7 w-7 place-items-center bg-ai-blue text-xs font-bold text-white">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                    <span className="hidden max-w-[110px] truncate xl:block">{user.name?.split(' ')[0]}</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-white/42 transition ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-3 w-64 bg-[#071019] p-2 shadow-2xl ring-1 ring-white/10">
                      <div className="border-b border-white/10 px-3 py-2.5">
                        <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                        <p className="truncate text-xs text-white/42">{user.email}</p>
                      </div>
                      {clientNavItems.slice(0, 5).map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={closeMenus}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/68 transition hover:bg-white/[0.06] hover:text-white"
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
                  <Link href="/login" onClick={closeMenus} className="text-sm font-medium text-white/66 transition hover:text-white">
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeMenus}
                    className="bg-white px-3.5 py-2 text-sm font-semibold text-black transition hover:bg-ai-blue hover:text-white"
                  >
                    Create Workspace
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(!isMenuOpen);
                setActiveMenu(null);
                setIsProfileOpen(false);
              }}
              className="grid h-9 w-9 place-items-center text-white lg:hidden"
              aria-label="Open main menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {activeMegaMenu && (
            <div className="hidden pb-3 lg:block">
              <div className="bg-[#071019]/98 p-4 shadow-2xl shadow-black/40 ring-1 ring-white/10 backdrop-blur-xl">
                <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr_220px]">
                  {activeMegaMenu.sections.map((section) => (
                    <div key={section.title}>
                      <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/36">{section.title}</div>
                      <div className="space-y-0.5">
                        {section.links.map((item) => (
                          <NavItem key={`${section.title}-${item.name}`} item={item} onClick={closeMenus} />
                        ))}
                      </div>
                    </div>
                  ))}

                  {activeMegaMenu.feature && (
                    <Link
                      href={activeMegaMenu.feature.href}
                      onClick={closeMenus}
                      className="group flex min-h-full flex-col justify-between bg-white/[0.035] p-4 transition hover:bg-white/[0.055]"
                    >
                      <span>
                        {activeMegaMenu.feature.icon && (
                          <activeMegaMenu.feature.icon className={`h-5 w-5 ${activeMegaMenu.feature.accent || 'text-ai-blue'}`} />
                        )}
                        <span className="mt-4 block text-sm font-semibold text-white">{activeMegaMenu.feature.name}</span>
                        {activeMegaMenu.feature.description && (
                          <span className="mt-2 block text-xs leading-5 text-white/44">{activeMegaMenu.feature.description}</span>
                        )}
                      </span>
                      <ArrowRight className="mt-5 h-4 w-4 text-white/28 transition group-hover:translate-x-0.5 group-hover:text-ai-blue" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-40 bg-[#05070a] text-white transition lg:hidden ${
          isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto px-5 pb-8 pt-[76px]">
          <div className="divide-y divide-white/10 border-t border-white/10">
            {megaMenus.map((menu) => (
              <div key={menu.label} className="py-4">
                <button
                  type="button"
                  onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="text-base font-semibold">{menu.label}</span>
                  <ChevronDown className={`h-4 w-4 text-white/42 transition ${activeMenu === menu.label ? 'rotate-180 text-ai-blue' : ''}`} />
                </button>

                {activeMenu === menu.label && (
                  <div className="mt-4 space-y-5 pb-1">
                    {menu.sections.map((section) => (
                      <div key={`${menu.label}-${section.title}`}>
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/34">{section.title}</div>
                        <div className="grid gap-1">
                          {section.links.map((item) => {
                            const Icon = item.icon;
                            if (item.disabled) {
                              return (
                                <div
                                  key={`${section.title}-mobile-${item.name}`}
                                  aria-disabled="true"
                                  className="flex cursor-default items-start gap-3 py-2.5 text-sm text-white/46 opacity-75"
                                >
                                  {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-white/24" />}
                                  <span className="min-w-0">
                                    <span className="block font-medium leading-5 text-white/46">{item.name}</span>
                                    {item.description && <span className="mt-0.5 block text-xs leading-5 text-white/34">{item.description}</span>}
                                  </span>
                                </div>
                              );
                            }
                            return (
                              <Link
                                key={`${section.title}-mobile-${item.name}`}
                                href={item.href}
                                onClick={closeMenus}
                                className="flex items-start gap-3 py-2.5 text-sm text-white/72"
                              >
                                {Icon && <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${item.accent || 'text-ai-blue'}`} />}
                                <span className="min-w-0">
                                  <span className="block font-medium leading-5 text-white/86">{item.name}</span>
                                  {item.description && <span className="mt-0.5 block text-xs leading-5 text-white/42">{item.description}</span>}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {directLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={`${link.name}-${link.href}`} href={link.href} onClick={closeMenus} className="flex items-center gap-3 py-4 text-base font-semibold text-white">
                  {Icon && <Icon className="h-4 w-4 text-ai-blue" />}
                  {link.name}
                </Link>
              );
            })}
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
                  Create Workspace
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
