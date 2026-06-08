'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Github } from 'lucide-react';
import { apiClient } from '@/lib/api';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C4 20.52 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 4 3.48 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#ffffff" aria-hidden="true">
      <path d="M16.8 12.36c-.02-2.1 1.72-3.11 1.8-3.16-1.01-1.45-2.57-1.65-3.11-1.67-1.31-.13-2.58.77-3.25.77-.68 0-1.72-.75-2.83-.73-1.45.02-2.8.84-3.54 2.13-1.53 2.63-.39 6.5 1.08 8.63.73 1.04 1.58 2.2 2.7 2.16 1.09-.04 1.5-.69 2.82-.69 1.31 0 1.68.69 2.83.67 1.18-.02 1.92-1.04 2.63-2.09.84-1.19 1.17-2.36 1.18-2.42-.03-.01-2.28-.86-2.31-3.6z" />
      <path d="M14.63 6.17c.6-.74 1-1.75.89-2.77-.87.04-1.96.6-2.58 1.33-.56.64-1.06 1.69-.93 2.68.98.07 2-.5 2.62-1.24z" />
    </svg>
  );
}

const socialOptions = [
  { label: 'Google', Icon: GoogleIcon },
  { label: 'GitHub', Icon: Github, className: 'text-white' },
  { label: 'Apple', Icon: AppleIcon },
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (!response.success) {
        throw new Error(response.message || 'Registration failed. Please try again.');
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#05070a] pt-16 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col px-5 sm:px-8 lg:px-10">
        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[0.9fr_1fr] lg:gap-20">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-ai-blue">Create workspace</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl">
              Create the account that keeps the work clear.
            </h1>
          </div>

          <div className="w-full max-w-md lg:ml-auto">
            <div className="border-y border-white/10 py-7">
              <h2 className="text-2xl font-black tracking-tight">New Sitemendr account</h2>

              <div className="mt-6 flex flex-wrap items-center gap-5">
                {socialOptions.map((option) => {
                  const Icon = option.Icon;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      disabled
                      aria-disabled="true"
                      title={`${option.label} signup is not active yet`}
                      className="grid h-12 w-12 place-items-center transition"
                    >
                      <Icon className={`h-8 w-8 ${option.className || ''}`} />
                      <span className="sr-only">{option.label}</span>
                    </button>
                  );
                })}
              </div>

              <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <div role="alert" className="border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-100">
                    {error}
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white/36">Full name</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="mt-2 w-full border-0 border-b border-white/16 bg-transparent px-0 py-4 text-base text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white/36">Email address</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="mt-2 w-full border-0 border-b border-white/16 bg-transparent px-0 py-4 text-base text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white/36">Password</label>
                    <input
                      name="password"
                      type="password"
                      required
                      className="mt-2 w-full border-0 border-b border-white/16 bg-transparent px-0 py-4 text-base text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white/36">Confirm</label>
                    <input
                      name="confirmPassword"
                      type="password"
                      required
                      className="mt-2 w-full border-0 border-b border-white/16 bg-transparent px-0 py-4 text-base text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue"
                      placeholder="Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-13 w-full bg-white px-5 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:bg-ai-blue hover:text-white disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create workspace'}
                </button>

                <p className="text-center text-sm text-white/48">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-white transition hover:text-ai-blue">
                    Sign in
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
