'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Github } from 'lucide-react';
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

const countryCodes = ['AF','AL','DZ','AS','AD','AO','AI','AG','AR','AM','AW','AU','AT','AZ','BS','BH','BD','BB','BY','BE','BZ','BJ','BM','BT','BO','BA','BW','BR','BN','BG','BF','BI','KH','CM','CA','CV','KY','CF','TD','CL','CN','CO','KM','CG','CD','CR','CI','HR','CU','CY','CZ','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FJ','FI','FR','GA','GM','GE','DE','GH','GI','GR','GD','GT','GN','GW','GY','HT','HN','HK','HU','IS','IN','ID','IR','IQ','IE','IL','IT','JM','JP','JO','KZ','KE','KI','KR','KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MG','MW','MY','MV','ML','MT','MH','MR','MU','MX','MD','MC','MN','ME','MA','MZ','MM','NA','NR','NP','NL','NZ','NI','NE','NG','MK','NO','OM','PK','PW','PS','PA','PG','PY','PE','PH','PL','PT','QA','RO','RW','KN','LC','VC','WS','SM','ST','SA','SN','RS','SC','SL','SG','SK','SI','SB','SO','ZA','SS','ES','LK','SD','SR','SE','CH','TW','TJ','TZ','TH','TL','TG','TO','TT','TN','TR','TM','UG','UA','AE','GB','US','UY','UZ','VU','VN','YE','ZM','ZW'];

const countryCurrencyByCode: Record<string, string> = {
  KE: 'KES', US: 'USD', GB: 'GBP', NG: 'NGN', GH: 'GHS', ZA: 'ZAR', CA: 'CAD', AU: 'AUD', NZ: 'NZD', IN: 'INR', AE: 'AED', SA: 'SAR',
  UG: 'UGX', TZ: 'TZS', RW: 'RWF', BI: 'BIF', ET: 'ETB', EG: 'EGP', MA: 'MAD', DZ: 'DZD', TN: 'TND', SN: 'XOF', CI: 'XOF', CM: 'XAF',
  FR: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR', PT: 'EUR', NL: 'EUR', BE: 'EUR', IE: 'EUR', FI: 'EUR', AT: 'EUR', GR: 'EUR', SK: 'EUR', SI: 'EUR',
  SE: 'SEK', NO: 'NOK', DK: 'DKK', CH: 'CHF', PL: 'PLN', CZ: 'CZK', RO: 'RON', HU: 'HUF', TR: 'TRY',
  BR: 'BRL', MX: 'MXN', AR: 'ARS', CL: 'CLP', CO: 'COP', PE: 'PEN', UY: 'UYU', PY: 'PYG',
  CN: 'CNY', HK: 'HKD', JP: 'JPY', KR: 'KRW', SG: 'SGD', MY: 'MYR', ID: 'IDR', PH: 'PHP', TH: 'THB', VN: 'VND', TW: 'TWD',
};

const countryDialCodeByCode: Record<string, string> = {
  US: '+1', CA: '+1', GB: '+44', KE: '+254', NG: '+234', GH: '+233', ZA: '+27', AU: '+61', NZ: '+64', IN: '+91', PK: '+92', BD: '+880', AE: '+971', SA: '+966',
  UG: '+256', TZ: '+255', RW: '+250', BI: '+257', ET: '+251', EG: '+20', MA: '+212', DZ: '+213', TN: '+216', CM: '+237', CI: '+225', SN: '+221',
  FR: '+33', DE: '+49', IT: '+39', ES: '+34', PT: '+351', NL: '+31', BE: '+32', CH: '+41', AT: '+43', IE: '+353', NO: '+47', SE: '+46', DK: '+45', FI: '+358',
  BR: '+55', MX: '+52', AR: '+54', CL: '+56', CO: '+57', PE: '+51', CN: '+86', HK: '+852', JP: '+81', KR: '+82', SG: '+65', MY: '+60', ID: '+62', PH: '+63', TH: '+66', VN: '+84',
};

const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
const countryOptions = countryCodes
  .map(code => ({
    code,
    name: displayNames.of(code) || code,
    currency: countryCurrencyByCode[code] || 'USD',
    dialCode: countryDialCodeByCode[code] || '',
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const accountTypes = [
  { value: 'individual', label: 'Individual' },
  { value: 'business', label: 'Business' },
  { value: 'organization', label: 'Organization' },
  { value: 'agency', label: 'Agency' },
];

const socialOptions = [
  { label: 'Google', Icon: GoogleIcon },
  { label: 'GitHub', Icon: Github, className: 'text-white' },
  { label: 'Apple', Icon: AppleIcon },
];

const getCurrency = (country: string) => countryOptions.find(option => option.code === country)?.currency || 'USD';
const getDialCode = (country: string) => countryOptions.find(option => option.code === country)?.dialCode || '';
const normalizePhone = (phone: string, country: string) => {
  const trimmed = phone.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) return trimmed.replace(/[^\d+]/g, '');
  const local = trimmed.replace(/\D/g, '').replace(/^0+/, '');
  const dialCode = getDialCode(country);
  return dialCode ? `${dialCode}${local}` : local;
};
const isValidPhone = (phone: string, country: string) => {
  if (!phone.trim()) return true;
  const normalized = normalizePhone(phone, country);
  const digits = normalized.replace(/\D/g, '');
  const dialCode = getDialCode(country);
  return digits.length >= 8 && digits.length <= 15 && (!dialCode || normalized.startsWith(dialCode));
};

export default function RegisterPage() {
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'next' | 'back'>('next');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inactiveSocial, setInactiveSocial] = useState(false);
  const [pulseIdentity, setPulseIdentity] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: 'KE',
    phone: '',
    defaultCurrency: 'KES',
    accountType: '',
  });

  const selectedCountry = useMemo(() => countryOptions.find(option => option.code === formData.country), [formData.country]);
  const progress = ((step + 1) / 3) * 100;

  const fieldClass = `w-full border-0 border-b bg-transparent px-0 py-4 text-base text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue ${
    pulseIdentity ? 'border-red-400 animate-pulse' : 'border-white/16'
  }`;

  const goToStep = (nextStep: number, nextDirection: 'next' | 'back') => {
    setDirection(nextDirection);
    setStep(nextStep);
    setError('');
  };

  const handleSocialClick = () => {
    setInactiveSocial(true);
    setPulseIdentity(true);
    setStep(0);
    nameRef.current?.focus();
    window.setTimeout(() => setPulseIdentity(false), 900);
  };

  const clearInactiveSocial = () => {
    if (inactiveSocial) setInactiveSocial(false);
  };

  const clearFieldFeedback = () => {
    clearInactiveSocial();
    if (error) setError('');
  };

  const validateStep = () => {
    if (step === 0) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.accountType) return 'Select an account type.';
      if (formData.name.trim().length < 2) return 'Enter your name.';
      if (!emailPattern.test(formData.email.trim())) return 'Enter a valid email.';
    }
    if (step === 1 && !isValidPhone(formData.phone, formData.country)) {
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
    setInactiveSocial(false);
    goToStep(Math.min(step + 1, 2), 'next');
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
        phone: normalizePhone(formData.phone, formData.country),
        country: formData.country,
        defaultCurrency: formData.defaultCurrency,
        accountType: formData.accountType,
        billingRegion: formData.country,
      });

      if (!response.success) {
        throw new Error(response.message || 'Registration failed. Please try again.');
      }

      if (response.token) {
        localStorage.setItem('sitemendr_auth_token', response.token);
      }
      if (response.user) {
        localStorage.setItem('sitemendr_client_user', JSON.stringify(response.user));
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#05070a] pt-16 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col px-5 sm:px-8 lg:px-10">
        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[0.8fr_1fr] lg:gap-20">
          <div className="max-w-xl">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-ai-blue">Create workspace</p>
            <h1 className="mt-5 text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl">
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
                      <h2 className="text-2xl font-black tracking-tight">Create account</h2>
                      <div className="mt-6 flex flex-wrap items-center gap-5">
                        {socialOptions.map((option) => {
                          const Icon = option.Icon;
                          return (
                            <button key={option.label} type="button" onClick={handleSocialClick} className="grid h-12 w-12 place-items-center transition hover:opacity-70">
                              <Icon className={`h-8 w-8 ${option.className || ''}`} />
                              <span className="sr-only">{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      {inactiveSocial && <p className="mt-3 text-xs font-black text-red-300">Inactive</p>}
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white/36">Account type</label>
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
                      <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white/36">Name</label>
                      <input ref={nameRef} type="text" value={formData.name} onFocus={clearFieldFeedback} onChange={(e) => {
                        clearFieldFeedback();
                        setFormData({ ...formData, name: e.target.value });
                      }} className={fieldClass} placeholder="Your name" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white/36">Email</label>
                      <input type="email" value={formData.email} onFocus={clearFieldFeedback} onChange={(e) => {
                        clearFieldFeedback();
                        setFormData({ ...formData, email: e.target.value });
                      }} className={fieldClass} placeholder="name@company.com" />
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-black tracking-tight">Region</h2>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white/36">Country</label>
                      <select
                        value={formData.country}
                        onChange={(e) => {
                          clearFieldFeedback();
                          const country = e.target.value;
                          setFormData({ ...formData, country, defaultCurrency: getCurrency(country) });
                        }}
                        className="mt-2 w-full border-0 border-b border-white/16 bg-transparent px-0 py-4 text-base text-white outline-none transition focus:border-ai-blue"
                      >
                        {countryOptions.map(option => <option key={option.code} value={option.code} className="bg-black text-white">{option.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white/36">Phone</label>
                      <div className="mt-2 flex border-b border-white/16 transition focus-within:border-ai-blue">
                        <span className="shrink-0 py-4 pr-3 text-base font-semibold text-white/38">{selectedCountry?.dialCode || '+'}</span>
                        <input type="tel" value={formData.phone} onFocus={clearFieldFeedback} onChange={(e) => {
                          clearFieldFeedback();
                          setFormData({ ...formData, phone: e.target.value });
                        }} className="min-w-0 flex-1 bg-transparent py-4 text-base text-white outline-none" placeholder="Optional" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white/36">Currency</label>
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
                    <h2 className="text-2xl font-black tracking-tight">Secure account</h2>
                    <div className="divide-y divide-white/10 border-y border-white/10">
                      {[
                        ['Name', formData.name],
                        ['Email', formData.email],
                        ['Country', selectedCountry?.name || formData.country],
                        ['Currency', formData.defaultCurrency],
                        ['Account type', accountTypes.find(type => type.value === formData.accountType)?.label || formData.accountType],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-5 py-3 text-sm">
                          <span className="font-semibold text-white/42">{label}</span>
                          <span className="text-right font-black text-white">{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white/36">Password</label>
                        <input type="password" value={formData.password} onFocus={clearFieldFeedback} onChange={(e) => {
                          clearFieldFeedback();
                          setFormData({ ...formData, password: e.target.value });
                        }} className="mt-2 w-full border-0 border-b border-white/16 bg-transparent px-0 py-4 text-base text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue" placeholder="Password" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white/36">Confirm</label>
                        <input type="password" value={formData.confirmPassword} onFocus={clearFieldFeedback} onChange={(e) => {
                          clearFieldFeedback();
                          setFormData({ ...formData, confirmPassword: e.target.value });
                        }} className="mt-2 w-full border-0 border-b border-white/16 bg-transparent px-0 py-4 text-base text-white outline-none transition placeholder:text-white/24 focus:border-ai-blue" placeholder="Password" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              {step > 0 ? (
                <button type="button" onClick={() => goToStep(step - 1, 'back')} className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-white/62 transition hover:text-white">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <Link href="/login" className="text-sm font-semibold text-white/42 transition hover:text-white">Sign in</Link>
              )}

              {step < 2 ? (
                <button type="button" onClick={handleNext} className="inline-flex min-h-11 items-center gap-2 bg-white px-5 text-sm font-black text-black transition hover:bg-ai-blue hover:text-white">
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="button" disabled={loading} onClick={handleSubmit} className="min-h-11 bg-white px-5 text-sm font-black text-black transition hover:bg-ai-blue hover:text-white disabled:opacity-50">
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
