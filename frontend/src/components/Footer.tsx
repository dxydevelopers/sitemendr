'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  FolderKanban,
  Globe,
  Mail,
  MapPin,
  Phone,
  Scale,
} from 'lucide-react';

const footerLinks = {
  Services: [
    { name: 'All Services', href: '/services' },
    { name: 'Development Path', href: '/services/development' },
    { name: 'Business Websites', href: '/services/development#business-websites' },
    { name: 'Commerce & Dropshipping', href: '/services/ecommerce' },
  ],
  Workspace: [
    { name: 'Create Workspace', href: '/register' },
    { name: 'Workspace Preview', href: '/workspace' },
    { name: 'Operating Flow', href: '/process' },
    { name: 'Client Login', href: '/login' },
  ],
  Company: [
    { name: 'About', href: '/about' },
    { name: 'Portfolio', href: '/portfolio' },
    { name: 'Case Studies', href: '/case-studies' },
    { name: 'Contact', href: '/contact' },
  ],
  Library: [
    { name: 'Pricing', href: '/pricing' },
    { name: 'Resources', href: '/resources' },
    { name: 'Blog', href: '/blog' },
    { name: 'Community', href: '/community' },
  ],
};

const legalLinks = [
  { name: 'Legal', href: '/legal' },
  { name: 'Privacy', href: '/privacy' },
  { name: 'Terms', href: '/terms' },
  { name: 'Refunds', href: '/refund' },
  { name: 'Cookies', href: '/cookie-policy' },
];

const contactLinks = [
  { name: 'support@sitemendr.com', href: 'mailto:dxydevelopers@gmail.com', icon: Mail },
  { name: '+254 140 122 685', href: 'tel:+254140122685', icon: Phone },
  { name: 'Sitemendr Tech, Nairobi, Kenya', href: 'https://www.google.com/maps/search/Nairobi+Kenya', icon: MapPin },
];

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path fill="currentColor" d="M17.2 3h3.1l-6.8 7.8L21.5 21h-6.3l-4.9-6.4L4.7 21H1.6l7.3-8.4L1.3 3h6.5l4.4 5.8L17.2 3Zm-1.1 16.2h1.7L6.9 4.7H5.1l11 14.5Z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path fill="currentColor" d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.35 8h4.3v13H.35V8Zm7.25 0h4.12v1.78h.06c.57-1.08 1.98-2.22 4.08-2.22 4.36 0 5.17 2.87 5.17 6.6V21h-4.3v-6.07c0-1.45-.03-3.31-2.02-3.31-2.02 0-2.33 1.58-2.33 3.2V21H7.6V8Z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <defs>
      <linearGradient id="ig-gradient" x1="2" x2="22" y1="22" y2="2">
        <stop stopColor="#FCAF45" />
        <stop offset="0.45" stopColor="#FD1D1D" />
        <stop offset="1" stopColor="#833AB4" />
      </linearGradient>
    </defs>
    <rect width="18" height="18" x="3" y="3" rx="5" fill="none" stroke="url(#ig-gradient)" strokeWidth="2" />
    <circle cx="12" cy="12" r="4" fill="none" stroke="url(#ig-gradient)" strokeWidth="2" />
    <circle cx="17.5" cy="6.5" r="1.3" fill="#FD1D1D" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path fill="currentColor" d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.23.2 2.23.2v2.46h-1.25c-1.24 0-1.62.77-1.62 1.56v1.87h2.76l-.44 2.91h-2.32V22C18.34 21.24 22 17.08 22 12.06Z" />
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path fill="currentColor" d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5a2.7 2.7 0 0 0-1.9 1.9C2 8.9 2 12 2 12s0 3.1.4 4.8a2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9c.4-1.7.4-4.8.4-4.8s0-3.1-.4-4.8ZM10 15.2V8.8l5.3 3.2L10 15.2Z" />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path fill="currentColor" d="M16.6 5.2c.8.9 1.8 1.5 3.1 1.6v3.1a7.5 7.5 0 0 1-3.2-.8v6.1c0 3.2-2.6 5.8-5.9 5.8a5.7 5.7 0 0 1-5.8-5.7c0-3.2 2.6-5.8 5.8-5.8.4 0 .7 0 1.1.1v3.3a2.3 2.3 0 0 0-1.1-.2 2.4 2.4 0 1 0 2.4 2.4V3h3.1c.1.8.2 1.5.5 2.2Z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path fill="currentColor" d="M12 2a9.8 9.8 0 0 0-8.4 14.8L2.4 22l5.3-1.4A9.8 9.8 0 1 0 12 2Zm0 17.9c-1.5 0-2.9-.4-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3A8 8 0 1 1 12 19.9Zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.3-.7.8-.8 1-.2.2-.3.2-.6.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-1 1-1 2.3s1 2.6 1.1 2.8c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.2-.3-.2-.6-.4Z" />
  </svg>
);

const GoogleGIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" role="img" aria-label="Google Pay">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" />
  </svg>
);

const socials = [
  { name: 'X', href: 'https://twitter.com/sitemendr', className: 'text-white', icon: <XIcon /> },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/sitemendr', className: 'text-[#0A66C2]', icon: <LinkedInIcon /> },
  { name: 'Instagram', href: 'https://instagram.com/sitemendr', className: 'text-white', icon: <InstagramIcon /> },
  { name: 'Facebook', href: 'https://facebook.com/sitemendr', className: 'text-[#1877F2]', icon: <FacebookIcon /> },
  { name: 'YouTube', href: 'https://youtube.com/@sitemendr', className: 'text-[#FF0000]', icon: <YouTubeIcon /> },
  { name: 'TikTok', href: 'https://tiktok.com/@sitemendr', className: 'text-white', icon: <TikTokIcon /> },
  { name: 'WhatsApp', href: 'https://wa.me/254790057596', className: 'text-[#25D366]', icon: <WhatsAppIcon /> },
];

const paymentProcessors = [
  { name: 'Visa', src: 'https://cdn.simpleicons.org/visa/1434CB?viewbox=auto', className: 'h-5 max-w-[58px]' },
  { name: 'Mastercard', src: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg', className: 'h-8 max-w-[42px]' },
  { name: 'Stripe', wordmark: 'stripe', accent: 'text-[#635BFF]', className: 'text-[21px] font-black tracking-[-0.04em]' },
  { name: 'PayPal', src: 'https://cdn.simpleicons.org/paypal/009CDE?viewbox=auto', className: 'h-5 max-w-[72px]' },
  { name: 'Apple Pay', src: 'https://cdn.simpleicons.org/apple/FFFFFF?viewbox=auto', className: 'h-5 max-w-[22px]' },
  { name: 'Google Pay', icon: <GoogleGIcon /> },
  { name: 'M-Pesa', wordmark: 'M-PESA', accent: 'text-[#00A651]' },
  { name: 'Paystack', wordmark: 'Paystack', accent: 'text-[#09A5DB]' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#05070a] text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ai-blue/70 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(0,102,255,0.1),transparent_28%),radial-gradient(circle_at_85%_8%,rgba(245,158,11,0.07),transparent_26%)]" />

      <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-6 md:py-14 lg:px-8">
        <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-[1fr_1.55fr_0.82fr]">
          <div className="max-w-xl">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center border border-white/10 bg-white/[0.04]">
                <Globe className="h-5 w-5 text-ai-blue" />
              </span>
              <span className="text-2xl font-semibold tracking-tight">Sitemendr</span>
            </Link>

            <p className="mt-6 max-w-lg text-[15px] leading-7 text-white/66">
              Digital work should leave a record: what was requested, what was approved, what was paid for, what was delivered, and what continues after launch.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 border-b border-white/40 pb-1 text-sm font-semibold text-white transition hover:border-ai-blue hover:text-ai-blue"
              >
                Create workspace
                <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/contact"
                className="group inline-flex items-center gap-2 border-b border-white/18 pb-1 text-sm font-semibold text-white/62 transition hover:border-white hover:text-white"
              >
                Speak with the team
                <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {socials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className={`grid h-9 w-9 place-items-center border border-white/10 bg-white/[0.03] transition hover:border-white/24 hover:bg-white/[0.06] ${social.className}`}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
                  <span className="h-px w-5 bg-white/18" />
                  {title}
                </h3>
                <ul className="mt-5 space-y-3.5">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className="text-sm text-white/64 transition hover:text-white">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          </div>

          <div className="lg:border-l lg:border-white/10 lg:pl-7">
            <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
              <span className="h-px w-5 bg-ai-blue/70" />
              Contact
            </h3>
            <ul className="mt-5 space-y-4">
              {contactLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="group grid grid-cols-[34px_1fr] items-start gap-3 text-sm leading-5 text-white/68 transition hover:text-white"
                    >
                      <span className={`grid h-8 w-8 place-items-center border border-white/10 bg-white/[0.035] transition group-hover:border-ai-blue/55 group-hover:bg-ai-blue/10 ${index === 0 ? 'text-ai-blue' : 'text-white/42'}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="pt-1">{link.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="grid gap-8 border-b border-white/10 py-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/legal" className="group flex items-center gap-2.5 text-xs text-white/50 transition hover:text-white">
              <Scale className="h-3.5 w-3.5 text-amber-300/70 transition group-hover:text-amber-300" />
              Policy center
            </Link>
            <Link href="/resources" className="group flex items-center gap-2.5 text-xs text-white/50 transition hover:text-white">
              <BookOpen className="h-3.5 w-3.5 text-ai-blue/75 transition group-hover:text-ai-blue" />
              Public resources
            </Link>
            <Link href="/portfolio" className="group flex items-center gap-2.5 text-xs text-white/50 transition hover:text-white">
              <FolderKanban className="h-3.5 w-3.5 text-expert-green/75 transition group-hover:text-expert-green" />
              Work record
            </Link>
          </div>

          <div className="lg:text-right">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4 lg:justify-end" aria-label="Accepted payment methods">
              {paymentProcessors.map((processor) => (
                <span
                  key={processor.name}
                  className="inline-flex h-7 items-center text-white/46 transition hover:text-white"
                  title={processor.name}
                >
                  {processor.icon ? (
                    processor.icon
                  ) : processor.src ? (
                    <Image
                      src={processor.src}
                      alt={processor.name}
                      width={96}
                      height={32}
                      unoptimized
                      className={`w-auto object-contain opacity-90 transition hover:opacity-100 ${processor.className}`}
                    />
                  ) : (
                    <span className={`${processor.className || 'text-[12px] font-black tracking-[0.16em]'} ${processor.accent}`}>
                      {processor.wordmark}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 pt-6 text-xs text-white/42 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>© {currentYear} Sitemendr Technologies. All rights reserved.</span>
            {legalLinks.map((link) => (
              <Link key={link.name} href={link.href} className="transition hover:text-white">
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span>Build, repair, operate, and grow with a record.</span>
            <button
              onClick={scrollToTop}
              className="grid h-9 w-9 place-items-center border border-white/10 bg-white/[0.04] text-white transition hover:border-ai-blue hover:bg-ai-blue"
              aria-label="Scroll to top"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
