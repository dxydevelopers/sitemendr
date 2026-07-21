'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  Headphones,
  Mail,
  MapPin,
  MessageSquare,
  MessagesSquare,
  Phone,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

const contactRoutes = [
  {
    label: 'New project',
    detail: 'Use this when you want to discuss a website, workspace, repair, commerce setup, or ongoing maintenance.',
    icon: MessageSquare,
    tone: 'text-ai-blue',
  },
  {
    label: 'Client support',
    detail: 'Use this when you already have work in progress and need help with files, billing, access, or a project record.',
    icon: Headphones,
    tone: 'text-expert-green',
  },
  {
    label: 'Private workspace',
    detail: 'Use this when you want the conversation to move into a client account with messages, approvals, and delivery context.',
    icon: ShieldCheck,
    tone: 'text-tech-purple',
  },
];

const directContacts = [
  {
    label: 'Email',
    value: 'dxydevelopers@gmail.com',
    href: 'mailto:dxydevelopers@gmail.com',
    icon: Mail,
    tone: 'text-ai-blue',
  },
  {
    label: 'Phone',
    value: '+254 790 057 596',
    href: 'tel:+254790057596',
    icon: Phone,
    tone: 'text-expert-green',
  },
  {
    label: 'WhatsApp',
    value: '+254 140 122 685',
    href: 'https://wa.me/254140122685',
    icon: MessagesSquare,
    tone: 'text-amber-300',

  },
  {
    label: 'Operating center',
    value: 'Nairobi, Kenya',
    href: 'https://www.google.com/maps/search/Nairobi+Kenya',
    icon: MapPin,
    tone: 'text-tech-purple',
  },
];

const projectTypes = [
  'Custom development',
  'Business website',
  'Repair or recovery',
  'Maintenance',
  'eCommerce or dropshipping',
  'Workspace or account help',
];

const inputClass =
  'w-full border-0 border-b border-white/12 bg-transparent px-0 py-4 text-base text-white outline-none transition placeholder:text-white/28 focus:border-ai-blue';

interface ContactResponse {
  success: boolean;
  message?: string;
}

export default function Contact() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    projectType: '',
    message: '',
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string | null;
  }>({ type: null, message: null });

  useEffect(() => {
    setIsLoaded(true);

    if (window.location.search.includes('intent=sales')) {
      setFormData((prev) => ({ ...prev, projectType: prev.projectType || 'Custom development' }));
    }
  }, []);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: null });

    try {
      const data = (await apiClient.sendContactMessage({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        message: formData.message,
        subject: formData.projectType,
      })) as ContactResponse;

      if (data.success) {
        setSubmitStatus({
          type: 'success',
          message: data.message || 'Your message has been received. The Sitemendr team will respond with the right next step.',
        });
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          projectType: '',
          message: '',
        });
      } else {
        throw new Error(data.message || 'The message could not be sent. Please try again or use email directly.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'The message could not be sent. Please use email or WhatsApp directly.';
      setSubmitStatus({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070a] pb-20 pt-24 text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.35) 1px, transparent 0)',
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 md:px-10">
        <section className={`grid min-h-[690px] items-center gap-12 transition duration-700 lg:grid-cols-[0.9fr_1.1fr] ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div>
            <h1 className="max-w-5xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl lg:text-8xl">
              Start the conversation with the right context.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-white/62 md:text-xl">
              Contact is not a waiting room. It is where the work begins to take shape: what you need, what already exists, what is broken, what must be built, and how the next decision should be handled.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ContactButton href="/register" tone="light">
                Create workspace
              </ContactButton>
              <ContactButton href="/services">
                View services
              </ContactButton>
            </div>
          </div>

          <div className="relative min-h-[560px] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1700&h=1300&fit=crop&crop=center"
              alt=""
              fill
              priority
              unoptimized
              sizes="(min-width: 1024px) 610px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.78),rgba(5,7,10,0.08)_50%,rgba(5,7,10,0.45))]" />
            <div className="absolute bottom-8 left-6 max-w-lg pr-6 sm:left-10">
              <p className="text-2xl font-black leading-tight tracking-tight md:text-4xl">
                The best first message is not long. It is clear.
              </p>
              <p className="mt-4 text-sm leading-7 text-white/66 md:text-base">
                Tell us what exists, what you want changed, and what cannot be allowed to fail.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-24 grid gap-10 border-y border-white/10 py-14 md:py-20 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <h2 className="text-4xl font-black leading-tight tracking-tight md:text-5xl">
              Choose the kind of conversation you need.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/58">
              A good contact page should route the message before it becomes noise. These are the three practical reasons people usually reach Sitemendr.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {contactRoutes.map((route) => {
              const Icon = route.icon;
              return (
                <div key={route.label} className="border-t border-white/10 pt-7">
                  <Icon className={`h-7 w-7 ${route.tone}`} />
                  <h3 className="mt-7 text-2xl font-black tracking-tight">{route.label}</h3>
                  <p className="mt-4 text-sm leading-7 text-white/58">{route.detail}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <aside>
            <h2 className="text-4xl font-black leading-tight tracking-tight md:text-5xl">
              Direct channels.
            </h2>
            <p className="mt-6 text-base leading-8 text-white/58">
              Use the form for project context. Use the direct channels when the matter is immediate or already attached to an existing account.
            </p>

            <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {directContacts.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="group grid gap-4 py-6 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                  >
                    <Icon className={`h-5 w-5 ${item.tone}`} />
                    <span>
                      <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/38">{item.label}</span>
                      <span className="mt-2 block text-lg font-semibold text-white/84">{item.value}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-white/34 transition group-hover:translate-x-1 group-hover:text-white" />
                  </a>
                );
              })}
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="border-t border-white/10 pt-8">
            <div className="grid gap-8 md:grid-cols-2">
              <Field label="First name">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={inputClass}
                  autoComplete="given-name"
                  required
                />
              </Field>
              <Field label="Last name">
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={inputClass}
                  autoComplete="family-name"
                  required
                />
              </Field>
            </div>

            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <Field label="Email address">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={inputClass}
                  autoComplete="email"
                  required
                />
              </Field>
              <Field label="What do you need?">
                <select
                  name="projectType"
                  value={formData.projectType}
                  onChange={handleInputChange}
                  className={inputClass}
                  required
                >
                  <option value="" className="bg-[#05070a]">Choose a path</option>
                  {projectTypes.map((type) => (
                    <option key={type} value={type} className="bg-[#05070a]">
                      {type}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Tell us what should happen next" className="mt-8">
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={7}
                className={`${inputClass} resize-none`}
                placeholder="Briefly describe the business, the current situation, what you want changed, and any urgent constraint."
                required
              />
            </Field>

            {submitStatus.type && (
              <div className={`mt-8 border-l pl-5 text-sm leading-7 ${
                submitStatus.type === 'success' ? 'border-expert-green text-expert-green' : 'border-red-400 text-red-300'
              }`}>
                {submitStatus.message}
              </div>
            )}

            <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-[52px] items-center justify-center gap-3 bg-white px-6 py-4 text-center text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-ai-blue hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Sending message' : 'Send message'}
                <Send className="h-4 w-4" />
              </button>
              <p className="flex max-w-md items-start gap-3 text-sm leading-7 text-white/50">
                <Check className="mt-1 h-4 w-4 shrink-0 text-expert-green" />
                We use the message to route the request, prepare the first response, and decide whether it belongs in a private workspace.
              </p>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/38">{label}</span>
      <div className="mt-3">{children}</div>
    </label>
  );
}

function ContactButton({ href, children, tone = 'dark' }: { href: string; children: React.ReactNode; tone?: 'light' | 'dark' }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[48px] items-center justify-center gap-3 px-5 py-3.5 text-center text-[11px] font-black uppercase tracking-[0.12em] transition sm:px-6 sm:py-4 sm:text-xs ${
        tone === 'light' ? 'bg-white text-black hover:bg-ai-blue hover:text-white' : 'bg-white/[0.06] text-white ring-1 ring-white/12 hover:bg-white/[0.1]'
      }`}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
