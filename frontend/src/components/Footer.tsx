'use client';

import Link from 'next/link';
import { useState } from 'react';
import { X, Linkedin, Github, Lock, ArrowUp, Mail, Phone, MapPin } from 'lucide-react';
import { apiClient } from '@/lib/api';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await apiClient.post('/contact/newsletter', { email });
        setStatusMessage('Thank you for subscribing!');
        setEmail('');
      } catch (_error) {
        setStatusMessage('Failed to subscribe. Please try again.');
      } finally {
        setIsSubmitting(false);
        setTimeout(() => {
          setStatusMessage('');
        }, 5000);
      }
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerLinks = {
    Solutions: [
      { name: 'eCommerce Solutions', href: '/services#ecommerce' },
      { name: 'Business Websites', href: '/services#business' },
      { name: 'AI Solutions', href: '/services#ai' },
      { name: 'Maintenance', href: '/services#maintenance' },
    ],
    Ecosystem: [
      { name: 'Our Process', href: '/about#process' },
      { name: 'Pricing', href: '/payment' },
      { name: 'Portfolio', href: '/portfolio' },
      { name: 'Blog', href: '/blog' },
    ],
    Legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Refund Policy', href: '/refund' },
      { name: 'Cookie Policy', href: '/cookie-policy' },
    ],
    Contact_Uplink: [
      { name: 'support@sitemendr.com', href: 'mailto:support@sitemendr.com', icon: <Mail className="w-3 h-3" /> },
      { name: '+254 790 057 596', href: 'tel:+254790057596', icon: <Phone className="w-3 h-3" /> },
      { name: 'Sitemendr Tech, Nairobi, Kenya', href: 'https://www.google.com/maps/search/Nairobi+Kenya', icon: <MapPin className="w-3 h-3" /> },
    ],
  };

  return (
    <footer className="relative bg-[#050505] pt-48 pb-12 overflow-hidden border-t border-white/5">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,102,255,0.05),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-12 gap-y-16 mb-24">
          {/* Brand Identity */}
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-2 space-y-10">
            <Link href="/" className="inline-block group relative">
              <div className="absolute -inset-4 bg-ai-blue/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
              <div className="flex items-center gap-2 relative z-10">
                <span className="text-3xl font-black text-white tracking-tighter uppercase">
                  Sitemendr<span className="text-ai-blue italic">.sys</span>
                </span>
                <div className="w-2 h-2 rounded-full bg-ai-blue animate-pulse shadow-[0_0_10px_#0066FF]"></div>
              </div>
            </Link>
            
            <p className="text-white/40 text-[11px] leading-relaxed max-w-sm font-mono uppercase tracking-tight">
              Architecting high-performance digital infrastructure with neural optimization and mission-critical stability.
            </p>
            
            <div className="space-y-6">
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em]">
                Newsletter
              </div>
              <form onSubmit={handleNewsletterSubmit} className="relative max-w-md group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-6 py-5 bg-white/[0.02] border border-white/10 rounded-2xl text-white placeholder:text-white/10 text-[10px] font-mono focus:outline-none focus:border-ai-blue/40 transition-all duration-500 group-hover:bg-white/[0.04]"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="absolute right-2 top-2 bottom-2 px-8 bg-white text-black font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-ai-blue hover:text-white transition-all duration-300 disabled:opacity-50"
                >
                  {isSubmitting ? 'Syncing...' : 'Sync'}
                </button>
              </form>
              {statusMessage && (
                <div className={`text-[8px] font-mono uppercase tracking-widest animate-pulse ${statusMessage.includes('Failed') ? 'text-red-500' : 'text-expert-green'}`}>
                  {statusMessage}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              {[
                { name: 'twitter', icon: <X className="w-4 h-4" />, href: 'https://twitter.com/sitemendr' },
                { name: 'linkedin', icon: <Linkedin className="w-4 h-4" />, href: 'https://linkedin.com/company/sitemendr' },
                { name: 'github', icon: <Github className="w-4 h-4" />, href: 'https://github.com/sitemendr' }
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-ai-blue/40 hover:bg-ai-blue/5 transition-all duration-300 group"
                >
                  <span className="group-hover:scale-110 transition-transform">{social.icon}</span>
                </a>
              ))}
            </div>

            <div className="pt-6 border-t border-white/5">
              <div className="text-[8px] font-mono text-white/40 uppercase tracking-[0.4em] mb-4">Secure Payment Processing</div>
              <div className="flex items-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                {/* Visa */}
                <svg className="h-4 w-auto" viewBox="0 0 100 32" fill="currentColor">
                  <path d="M37.5 4.3l-6.2 19.1h-4.8l2.9-19.1h8.1zm22.4 0c-1.1-.4-2.8-.8-4.9-.8-5.4 0-9.2 2.9-9.2 7 0 3 2.7 4.7 4.7 5.7 2.1 1 2.8 1.6 2.8 2.5 0 1.3-1.6 1.9-3.1 1.9-2.1 0-3.2-.3-4.9-.8l-.7-.3-.7 4.4c1.2.5 3.4 1 5.7 1 5.7 0 9.4-2.8 9.4-7.2 0-2.4-1.4-4.2-4.6-5.7-1.9-.9-3.1-1.6-3.1-2.5 0-1 .9-1.8 3-1.8 1.8 0 3.1.4 4.1.8l.5.2.7-4.4zm16.5 0l-3.8 19.1h-4.6l3.8-19.1h4.6zm13.6 0l-1.9 4.3c-.5-.1-1.1-.2-1.7-.2-2.1 0-4 1.2-5 3.1l-6.1 11.9h-4.9l8.8-19.1h4.8l1.4 4.3c1.5-2.9 3.4-4.3 5.3-4.3.5 0 1 .1 1.4.2v4.1c-.2-.1-.5-.1-.8-.1-.4-.1-1-.1-1.3-.1zm-80.1 0l6.2 14.5 2.5-14.5h5.1L18.8 23.4h-5.4L6.9 8.2l-1.9-3.9H0l.1.2c4.4 1.1 7.6 3.8 9.9 7.6z"/>
                </svg>
                {/* Mastercard */}
                <svg className="h-6 w-auto" viewBox="0 0 100 62" fill="currentColor">
                  <path d="M35.4 31c0-5.7 2.4-11 6.3-14.8-3.9-3.2-8.9-5.2-14.3-5.2-12.3 0-22.3 10-22.3 22.3s10 22.3 22.3 22.3c5.4 0 10.4-1.9 14.3-5.2-3.9-3.8-6.3-9.1-6.3-14.8z" fillOpacity="0.8"/>
                  <path d="M94.9 33.3c0-12.3-10-22.3-22.3-22.3-5.4 0-10.4 1.9-14.3 5.2 3.9 3.8 6.3 9.1 6.3 14.8s-2.4 11-6.3 14.8c3.9 3.2 8.9 5.2 14.3 5.2 12.3 0 22.3-10 22.3-22.3 0-.8 0-1.6-.1-2.4z" fillOpacity="0.8"/>
                  <path d="M41.7 45.8c3.9-3.8 6.3-9.1 6.3-14.8s-2.4-11-6.3-14.8c-3.9 3.8-6.3 9.1-6.3 14.8s2.4 11 6.3 14.8z"/>
                </svg>
                {/* Paystack Logo Style */}
                <div className="flex items-center gap-1.5 group/ps">
                  <div className="flex -space-x-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-ai-blue shadow-[0_0_8px_#0066FF]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-ai-blue/40 border border-ai-blue/20"></div>
                  </div>
                  <span className="text-[10px] font-black text-white uppercase tracking-tighter italic">Paystack</span>
                </div>
              </div>
            </div>
          </div>

          {/* Optimized Links Grid */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="sm:col-span-1 space-y-10">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-ai-blue/40 rounded-full"></div>
                <h3 className="text-white font-black text-[10px] uppercase tracking-[0.3em] font-mono opacity-80">
                  {title.replace('_', ' ')}
                </h3>
              </div>
              <ul className="space-y-5">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-2 text-white/40 hover:text-ai-blue transition-all duration-300 text-[10px] font-mono uppercase tracking-widest"
                    >
                      {('icon' in link) && <span className="opacity-50 group-hover:opacity-100 group-hover:translate-x-[-2px] transition-transform">{link.icon}</span>}
                      <span className="group-hover:translate-x-1 transition-transform">{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Technical Status Footer */}
        <div className="pt-12 border-t border-white/5 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="flex flex-wrap justify-center lg:justify-start items-center gap-8 text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-expert-green animate-pulse"></div>
              <span>Status: Operational</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3 text-ai-blue" />
              <span>Encryption: 256-bit SSL</span>
            </div>
            <span>© {currentYear} Sitemendr</span>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-center lg:text-right space-y-1">
              <div className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">Server Uptime</div>
              <div className="text-xs font-mono text-white/60 tracking-tighter italic">99.99%</div>
            </div>
            <button
              onClick={scrollToTop}
              className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/20 hover:text-white hover:border-ai-blue/40 hover:bg-ai-blue/5 transition-all duration-300 group"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
