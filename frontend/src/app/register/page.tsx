'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Github } from 'lucide-react';
import { apiClient, type OAuthProvider, type OAuthProviderStatus } from '@/lib/api';
import {
  accountTypes,
  countryOptions,
  getDefaultCurrencyForCountry,
  isValidEmail,
  isValidProfilePhone,
  normalizeEmail,
  normalizePhoneForCountry,
} from '@/lib/account-profile';

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
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'next' | 'back'>('next');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [oauthProviders, setOauthProviders] = useState<OAuthProviderStatus>({});
  const [oauthProvidersLoaded, setOauthProvidersLoaded] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: 'KE',
    phone: '',
    defaultCurrency: 'KES',
    accountType: '',
    entityName: '',
    entityContactEmail: '',
    entityPhone: '',
  });

  const selectedCountry = useMemo(() => countryOptions.find(option => option.code === formData.country), [formData.country]);
  const progress = ((step + 1) / 3) * 100;
  const passwordScore = [
    formData.password.length >= 8,
    /[A-Z]/.test(formData.password),
    /[0-9]/.test(formData.password),
    /[^A-Za-z0-9]/.test(formData.password),
  ].filter(Boolean).length;
  const passwordStrength = formData.password
    ? passwordScore >= 4 ? { label: 'Strong', color: 'bg-expert-green', text: 'text-expert-green' }
      : passwordScore >= 3 ? { label: 'Good', color: 'bg-ai-blue', text: 'text-ai-blue' }
        : { label: 'Weak', color: 'bg-amber-300', text: 'text-amber-300' }
    : null;
  const emailStatus = formData.email.trim()
    ? !isValidEmail(formData.email)
      ? { label: 'Invalid email', className: 'text-red-300' }
      : null
    : null;

  const fieldClass = 'w-full border-0 border-b border-white/16 bg-transparent px-0 py-4 text-base text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue';
  const isEntityAccount = formData.accountType !== '' && formData.accountType !== 'individual';

  useEffect(() => {
    let mounted = true;
    apiClient.getOAuthProviders().then(response => {
      if (!mounted) return;
      setOauthProviders(response.success ? response.providers || {} : {});
      setOauthProvidersLoaded(true);
    }).catch(() => {
      if (mounted) setOauthProvidersLoaded(true);
    });
    return () => { mounted = false; };
  }, []);

  const goToStep = (nextStep: number, nextDirection: 'next' | 'back') => {
    setDirection(nextDirection);
    setStep(nextStep);
    setError('');
  };

  const clearFieldFeedback = () => {
    if (error) setError('');
  };

  const validateStep = () => {
    if (step === 0) {
      if (!formData.accountType) return 'Select an account type.';
      if (formData.name.trim().length < 2) return 'Enter your name.';
      if (!isValidEmail(formData.email)) return 'Enter a valid email.';
      if (isEntityAccount && formData.entityName.trim().length < 2) return 'Enter the business, organisation, or agency name.';
      if (formData.entityContactEmail.trim() && !isValidEmail(formData.entityContactEmail)) return 'Enter a valid entity contact email.';
      if (!isValidProfilePhone(formData.entityPhone, formData.country)) return 'Enter a valid entity phone number.';
    }
    if (step === 1 && !isValidProfilePhone(formData.phone, formData.country)) {
      return 'Enter a valid phone number.';
    }
    if (step === 2) {
      if (formData.password.length < 8) return 'Use at least 8 characters.';
      if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
    }
    return '';
  };

  const handleNext = () => {
    const stepError = validateStep();
    if (stepError) {
      setError(stepError);
      return;
    }
    goToStep(Math.min(step + 1, 2), 'next');
  };

  const handleSocialSignup = (provider: OAuthProvider) => {
    if (!formData.accountType) {
      setError('Select an account type.');
      return;
    }
    if (isEntityAccount && formData.entityName.trim().length < 2) {
      setError('Enter the business, organisation, or agency name.');
      return;
    }
    if (formData.entityContactEmail.trim() && !isValidEmail(formData.entityContactEmail)) {
      setError('Enter a valid entity contact email.');
      return;
    }
    if (!isValidProfilePhone(formData.entityPhone, formData.country)) {
      setError('Enter a valid entity phone number.');
      return;
    }
    if (step !== 0) {
      setError('Return to account details before using social sign-up.');
      return;
    }
    sessionStorage.setItem('sitemendr_oauth_signup_profile', JSON.stringify({
      name: formData.name.trim(),
      accountType: formData.accountType,
      entityName: isEntityAccount ? formData.entityName.trim() : '',
      entityContactEmail: isEntityAccount ? normalizeEmail(formData.entityContactEmail) : '',
      entityPhone: isEntityAccount ? normalizePhoneForCountry(formData.entityPhone, formData.country) : '',
      country: formData.country,
      defaultCurrency: formData.defaultCurrency,
    }));
    apiClient.beginOAuth(provider, 'register');
  };

  const handleSubmit = async () => {
    const stepError = validateStep();
    if (stepError) {
      setError(stepError);
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: normalizePhoneForCountry(formData.phone, formData.country),
        country: formData.country,
        defaultCurrency: formData.defaultCurrency,
        accountType: formData.accountType,
        billingRegion: formData.country,
        entityName: isEntityAccount ? formData.entityName.trim() : undefined,
        entityContactEmail: isEntityAccount ? normalizeEmail(formData.entityContactEmail) : undefined,
        entityPhone: isEntityAccount ? normalizePhoneForCountry(formData.entityPhone, formData.country) : undefined,
      });

      if (!response.success) {
        throw new Error(response.message || 'Registration failed. Please try again.');
      }

      setVerificationEmailSent(response.verificationEmailSent === true);
      setRegisteredEmail(response.user?.email || normalizeEmail(formData.email));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!registeredEmail) return;
    setResendState('sending');
    try {
      const response = await apiClient.resendVerification(registeredEmail);
      setResendState(response.success ? 'sent' : 'error');
    } catch {
      setResendState('error');
    }
  };

  if (registeredEmail) {
    return (
      <main className="min-h-screen bg-[#05070a] pt-16 text-white">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center px-5 py-14 sm:px-8 lg:px-10">
          <section className="border-y border-white/10 py-10">
            <div className="mb-8 h-1 w-24 bg-ai-blue" />
            <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{verificationEmailSent || resendState === 'sent' ? 'Check your email to finish signing up.' : 'Your account is created.'}</h1>
            <p className="mt-5 text-sm leading-6 text-white/60">{verificationEmailSent || resendState === 'sent' ? 'We sent a verification link to:' : 'Email delivery is not available right now. Your account is saved, and you can request another verification email below.'}</p>
            <p className="mt-5 break-all text-lg font-bold text-white">{registeredEmail}</p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <button type="button" onClick={handleResendVerification} disabled={resendState === 'sending' || resendState === 'sent'} className="min-h-11 bg-white px-5 text-sm font-bold text-black transition hover:bg-ai-blue hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
                {resendState === 'sending' ? 'Sending...' : resendState === 'sent' ? 'Verification email sent' : 'Resend verification email'}
              </button>
              <Link href="/login" className="text-sm font-semibold text-white/60 transition hover:text-white">Back to sign in</Link>
            </div>
            {resendState === 'error' && <p role="alert" className="mt-4 text-sm font-semibold text-red-300">Could not resend the email. Check the address and try again later.</p>}
            <p className="mt-5 text-xs leading-5 text-white/40">Verification links expire after 24 hours. Check your spam folder if the email does not arrive.</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05070a] pt-16 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col px-5 sm:px-8 lg:px-10">
        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[0.8fr_1fr] lg:gap-20">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-ai-blue">Create workspace</p>
            <h1 className="mt-5 text-2xl font-bold leading-[0.98] tracking-tight sm:text-3xl">
              Start with a clean account.
            </h1>
          </div>

          <div className="w-full max-w-md overflow-hidden border-y border-white/10 py-7 lg:ml-auto">
            <div className="mb-7 h-1 bg-white/10">
              <div className="h-1 bg-ai-blue transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>

            <div className="min-h-[430px] overflow-hidden">
              <div key={step} className={`animate-in duration-300 ${direction === 'next' ? 'slide-in-from-right-8' : 'slide-in-from-left-8'}`}>
                {error && (
                  <div role="alert" className="mb-6 border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-100">
                    {error}
                  </div>
                )}

                {step === 0 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Create account</h2>
                      <div className="mt-6 flex flex-wrap items-center gap-5">
                        {socialOptions.map((option) => {
                          const Icon = option.Icon;
                          const provider = option.label.toLowerCase() as OAuthProvider;
                          const available = oauthProviders[provider]?.available === true;
                          return (
                            <button key={option.label} type="button" onClick={() => handleSocialSignup(provider)} disabled={!oauthProvidersLoaded || !available} title={available ? `Continue with ${option.label}` : `${option.label} sign-up is not configured yet`} aria-label={available ? `Continue with ${option.label}` : `${option.label} sign-up is not available yet`} className={`grid h-12 w-12 place-items-center transition ${available ? 'hover:opacity-70' : 'cursor-not-allowed opacity-35'}`}>
                              <Icon className={`h-8 w-8 ${option.className || ''}`} />
                              <span className="sr-only">{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-3 text-xs leading-5 text-white/42">{!oauthProvidersLoaded ? 'Checking social sign-up availability…' : Object.values(oauthProviders).some(provider => provider?.available) ? 'Or create an account with email and password.' : 'Google, GitHub, and Apple sign-up are not configured yet. Use your email and password for now.'}</p>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-[0.1em] text-white/36">Account type</label>
                      <select
                        value={formData.accountType}
                        onChange={(e) => {
                          clearFieldFeedback();
                          setFormData({ ...formData, accountType: e.target.value });
                        }}
                        className="mt-2 w-full border-0 border-b border-white/16 bg-transparent px-0 py-4 text-base text-white outline-none transition focus:border-ai-blue"
                      >
                        <option value="" disabled className="bg-black text-white">Select account type</option>
                        {accountTypes.map(type => (
                          <option key={type.value} value={type.value} className="bg-black text-white">{type.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-[0.1em] text-white/36">Name</label>
                      <input type="text" value={formData.name} onFocus={clearFieldFeedback} onChange={(e) => {
                        clearFieldFeedback();
                        setFormData({ ...formData, name: e.target.value });
                      }} className={fieldClass} placeholder="Your name" />
                    </div>
                    {isEntityAccount && (
                      <div className="space-y-5 border-l border-ai-blue/40 pl-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.1em] text-ai-blue">{accountTypes.find(type => type.value === formData.accountType)?.label} details</p>
                          <p className="mt-1 text-xs leading-5 text-white/48">These identify the client receiving Sitemendr’s services. Your personal sign-in stays yours.</p>
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-[0.1em] text-white/36">{formData.accountType === 'agency' ? 'Agency name' : formData.accountType === 'organization' ? 'Organisation name' : 'Business name'}</label>
                          <input type="text" maxLength={160} value={formData.entityName} onFocus={clearFieldFeedback} onChange={(e) => setFormData({ ...formData, entityName: e.target.value })} className={fieldClass} placeholder="Name of the entity" />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-[0.1em] text-white/36">Entity contact email <span className="normal-case text-white/30">(optional)</span></label>
                          <input type="email" value={formData.entityContactEmail} onFocus={clearFieldFeedback} onChange={(e) => setFormData({ ...formData, entityContactEmail: e.target.value })} className={fieldClass} placeholder="team@example.com" />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-[0.1em] text-white/36">Entity phone <span className="normal-case text-white/30">(optional)</span></label>
                          <div className="flex border-b border-white/16 transition focus-within:border-ai-blue">
                            <span className="shrink-0 py-4 pr-3 text-base font-semibold text-white/36">{selectedCountry?.dialCode || '+'}</span>
                            <input type="tel" value={formData.entityPhone} onFocus={clearFieldFeedback} onChange={(e) => setFormData({ ...formData, entityPhone: e.target.value })} className="min-w-0 flex-1 bg-transparent py-4 text-base text-white outline-none placeholder:text-white/24" placeholder="Optional" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-[0.1em] text-white/36">Email</label>
                      <input type="email" value={formData.email} onFocus={clearFieldFeedback} onBlur={() => setFormData({ ...formData, email: normalizeEmail(formData.email) })} onChange={(e) => {
                        clearFieldFeedback();
                        setFormData({ ...formData, email: e.target.value });
                      }} className={fieldClass} placeholder="name@company.com" />
                      {emailStatus && (
                        <p className={`mt-2 text-xs font-bold ${emailStatus.className}`}>
                          {emailStatus.label}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold tracking-tight">Region</h2>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-[0.1em] text-white/36">Country</label>
                      <select
                        value={formData.country}
                        onChange={(e) => {
                          clearFieldFeedback();
                          const country = e.target.value;
                          setFormData({ ...formData, country, defaultCurrency: getDefaultCurrencyForCountry(country) });
                        }}
                        className="mt-2 w-full border-0 border-b border-white/16 bg-transparent px-0 py-4 text-base text-white outline-none transition focus:border-ai-blue"
                      >
                        {countryOptions.map(option => <option key={option.code} value={option.code} className="bg-black text-white">{option.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-[0.1em] text-white/36">Phone</label>
                      <div className="mt-2 flex border-b border-white/16 transition focus-within:border-ai-blue">
                        <span className="shrink-0 py-4 pr-3 text-base font-semibold text-white/36">{selectedCountry?.dialCode || '+'}</span>
                        <input type="tel" value={formData.phone} onFocus={clearFieldFeedback} onChange={(e) => {
                          clearFieldFeedback();
                          setFormData({ ...formData, phone: e.target.value });
                        }} className="min-w-0 flex-1 bg-transparent py-4 text-base text-white outline-none" placeholder="Optional" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-[0.1em] text-white/36">Currency</label>
                      <select value={formData.defaultCurrency} onChange={(e) => {
                        clearFieldFeedback();
                        setFormData({ ...formData, defaultCurrency: e.target.value });
                      }} className="mt-2 w-full border-0 border-b border-white/16 bg-transparent px-0 py-4 text-base text-white outline-none transition focus:border-ai-blue">
                        {Array.from(new Set(countryOptions.map(option => option.currency))).sort().map(currency => <option key={currency} value={currency} className="bg-black text-white">{currency}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold tracking-tight">Secure account</h2>
                    <div className="divide-y divide-white/10 border-y border-white/10">
                      {[
                        ['Name', formData.name],
                        ['Email', formData.email],
                        ['Country', selectedCountry?.name || formData.country],
                        ['Currency', formData.defaultCurrency],
                        ['Account type', accountTypes.find(type => type.value === formData.accountType)?.label || formData.accountType],
                        ...(isEntityAccount ? [[formData.accountType === 'agency' ? 'Agency name' : formData.accountType === 'organization' ? 'Organisation name' : 'Business name', formData.entityName]] : []),
                        ...(formData.entityContactEmail ? [['Entity contact email', formData.entityContactEmail]] : []),
                        ...(formData.entityPhone ? [['Entity phone', normalizePhoneForCountry(formData.entityPhone, formData.country)]] : []),
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-5 py-3 text-sm">
                          <span className="font-semibold text-white/36">{label}</span>
                          <span className="text-right font-bold text-white">{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-[0.1em] text-white/36">Password</label>
                        <div className="mt-2 flex border-b border-white/16 transition focus-within:border-ai-blue">
                          <input type={showPassword ? 'text' : 'password'} value={formData.password} onFocus={clearFieldFeedback} onChange={(e) => {
                            clearFieldFeedback();
                            setFormData({ ...formData, password: e.target.value });
                          }} className="min-w-0 flex-1 bg-transparent py-4 text-base text-white outline-none placeholder:text-white/24" placeholder="Password" />
                          <button type="button" onClick={() => setShowPassword(value => !value)} className="grid w-10 place-items-center text-white/36 transition hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-[0.1em] text-white/36">Confirm</label>
                        <div className="mt-2 flex border-b border-white/16 transition focus-within:border-ai-blue">
                          <input type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onFocus={clearFieldFeedback} onChange={(e) => {
                            clearFieldFeedback();
                            setFormData({ ...formData, confirmPassword: e.target.value });
                          }} className="min-w-0 flex-1 bg-transparent py-4 text-base text-white outline-none placeholder:text-white/24" placeholder="Password" />
                          <button type="button" onClick={() => setShowConfirmPassword(value => !value)} className="grid w-10 place-items-center text-white/36 transition hover:text-white" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    {passwordStrength && (
                      <div className="flex items-center gap-3">
                        <div className="h-1 flex-1 bg-white/10">
                          <div className={`h-1 transition-all ${passwordStrength.color}`} style={{ width: `${Math.max(25, passwordScore * 25)}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${passwordStrength.text}`}>{passwordStrength.label}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              {step > 0 ? (
                <button type="button" onClick={() => goToStep(step - 1, 'back')} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-white/64 transition hover:text-white">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <Link href="/login" className="text-sm font-semibold text-white/36 transition hover:text-white">Sign in</Link>
              )}

              {step < 2 ? (
                <button type="button" onClick={handleNext} className="inline-flex min-h-11 items-center gap-2 bg-white px-5 text-sm font-bold text-black transition hover:bg-ai-blue hover:text-white">
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="button" disabled={loading} onClick={handleSubmit} className="min-h-11 bg-white px-5 text-sm font-bold text-black transition hover:bg-ai-blue hover:text-white disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create account'}
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
