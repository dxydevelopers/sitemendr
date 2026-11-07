// components/client-dashboard/ClientSettings.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Mail, Check, TriangleAlert, Loader2, MessageCircle, Phone, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { apiClient } from '@/lib/api';
import {
  accountTypes as accountTypeOptions,
  countryOptions as accountCountryOptions,
  getDefaultCurrencyForCountry,
  getDialCodeForCountry,
  getLocalPhoneForCountry,
} from '@/lib/account-profile';
import type { UseClientDashboardReturn } from './useClientDashboard';

export default function ClientSettings({ dashboard }: { dashboard: UseClientDashboardReturn }) {
  const {
  user, setUser, profileData, setProfileData, profileMessage, handleUpdateProfile,
  passwordData, setPasswordData, passwordMessage, handleChangePassword,
  } = dashboard;

  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [verificationMethods, setVerificationMethods] = useState<{ sms: boolean; whatsapp: boolean } | null>(null);
  const [verificationMethodsLoading, setVerificationMethodsLoading] = useState(true);
  const [verificationMethodsError, setVerificationMethodsError] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [phoneChannel, setPhoneChannel] = useState<'sms' | 'whatsapp'>('sms');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState('');
  const [whatsappWebLink, setWhatsappWebLink] = useState('');
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [currencyImpactAcknowledged, setCurrencyImpactAcknowledged] = useState(false);

  const loadVerificationMethods = useCallback(async () => {
    setVerificationMethodsLoading(true);
    setVerificationMethodsError(false);
    try {
      const res = await apiClient.getVerificationMethods();
      if (!res.success) {
        setVerificationMethods(null);
        setVerificationMethodsError(true);
        return;
      }
      setVerificationMethods({ sms: res.sms, whatsapp: res.whatsapp });
      if (!res.sms && res.whatsapp) setPhoneChannel('whatsapp');
    } catch {
      setVerificationMethods(null);
      setVerificationMethodsError(true);
    } finally {
      setVerificationMethodsLoading(false);
    }
  }, []);

  const refreshAccountProfile = useCallback(async (refreshForm = false) => {
    try {
      const res = await apiClient.getProfile();
      if (!res.success || !res.user) return;
      setUser((current) => ({ ...(current || res.user), ...res.user }));
      if (typeof window !== 'undefined') {
        localStorage.setItem('sitemendr_client_user', JSON.stringify(res.user));
        localStorage.setItem('user', JSON.stringify(res.user));
      }
      if (refreshForm) {
        setProfileData((current) => ({ ...current,
          name: res.user.name || current.name,
          phone: res.user.phone || '',
          country: res.user.country || current.country,
          defaultCurrency: res.user.defaultCurrency || current.defaultCurrency,
          accountType: res.user.accountType || current.accountType,
          billingRegion: res.user.billingRegion || current.billingRegion,
          entityName: res.user.entityName || '',
          entityContactEmail: res.user.entityContactEmail || '',
          entityPhone: res.user.entityPhone || '',
          billingAddressLine1: res.user.billingAddressLine1 || '',
          billingAddressLine2: res.user.billingAddressLine2 || '',
          billingCity: res.user.billingCity || '',
          billingPostalCode: res.user.billingPostalCode || '',
          billingCountry: res.user.billingCountry || res.user.country || current.country,
        }));
      }
    } catch { /* Keep the current form values if a background refresh is unavailable. */ }
  }, [setProfileData, setUser]);

  useEffect(() => {
    void loadVerificationMethods();
    void refreshAccountProfile(true);
    const refreshOnReturn = () => {
      if (document.visibilityState === 'visible') void refreshAccountProfile();
    };
    window.addEventListener('focus', refreshOnReturn);
    document.addEventListener('visibilitychange', refreshOnReturn);
    return () => {
      window.removeEventListener('focus', refreshOnReturn);
      document.removeEventListener('visibilitychange', refreshOnReturn);
    };
  }, [loadVerificationMethods, refreshAccountProfile]);

  useEffect(() => setPhoneDraft(profileData.phone), [profileData.phone]);

  useEffect(() => {
    if (!whatsappLink) return;
    let active = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    const checkStatus = async () => {
      try {
        const status = await apiClient.getPhoneVerificationStatus();
        if (!active) return;
        if (status.verified && status.phone === phoneDraft.trim()) {
          const nextUser = { ...(user || { id: '', name: '', email: '', role: '' }), phone: status.phone, phoneVerified: true } as NonNullable<typeof user>;
          localStorage.setItem('sitemendr_client_user', JSON.stringify(nextUser));
          localStorage.setItem('user', JSON.stringify(nextUser));
          setUser(nextUser);
          setProfileData((current) => ({ ...current, phone: status.phone || '' }));
          setPhoneDraft(status.phone || '');
          setPhoneMessage('Your WhatsApp number is verified.');
          setWhatsappLink('');
          setWhatsappWebLink('');
          setPhoneCodeSent(false);
          return;
        }
        if (status.expiresAt && Date.now() >= new Date(status.expiresAt).getTime()) {
          setWhatsappLink('');
          setPhoneMessage('This verification request expired. Start again to get a new code.');
        }
      } catch { /* A temporary connection issue is retried on the next poll. */ }
    };
    void checkStatus();
    timer = setInterval(() => { void checkStatus(); }, 3000);
    return () => { active = false; if (timer) clearInterval(timer); };
  }, [phoneDraft, setProfileData, setUser, user, whatsappLink]);

  const handleResendVerification = async () => {
  setResendState('sending');
  try {
  const res = await apiClient.resendVerification(user?.email || '');
  setResendState(res.success ? 'sent' : 'error');
  } catch {
  setResendState('error');
  }
  };

  const savedCurrency = user?.defaultCurrency || getDefaultCurrencyForCountry(user?.country || profileData.country);
  const currencyChanged = Boolean(savedCurrency && profileData.defaultCurrency !== savedCurrency);

  const persistUser = (nextUser: typeof user) => {
    if (!nextUser) return;
    localStorage.setItem('sitemendr_client_user', JSON.stringify(nextUser));
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const handleSendPhoneCode = async () => {
    setPhoneBusy(true); setPhoneMessage('');
    try {
      const res = await apiClient.sendPhoneVerificationCode(phoneDraft.trim(), phoneChannel);
      if (!res.success) { setPhoneMessage(res.message || 'Could not send the verification code.'); return; }
      setPhoneMessage(res.message);
      if (phoneChannel === 'whatsapp') {
        if (!res.whatsappLink) { setPhoneMessage('WhatsApp verification could not be prepared. Try again shortly.'); return; }
        setWhatsappLink(res.whatsappLink);
        setWhatsappWebLink(res.whatsappWebLink || res.whatsappLink);
      } else {
        setPhoneCodeSent(true);
      }
    } catch (error) {
      setPhoneMessage(error instanceof Error ? error.message : 'Could not send the verification code.');
    } finally { setPhoneBusy(false); }
  };

  const handleVerifyPhoneCode = async () => {
    setPhoneBusy(true); setPhoneMessage('');
    try {
      const res = await apiClient.verifyPhoneCode(phoneCode.trim());
      if (!res.success) { setPhoneMessage(res.message || 'The code could not be verified.'); return; }
      const nextUser = { ...(user || { id: '', name: '', email: '', role: '' }), phone: res.phone || phoneDraft.trim(), phoneVerified: true } as NonNullable<typeof user>;
      persistUser(nextUser);
      setProfileData((current) => ({ ...current, phone: nextUser.phone || '' }));
      setPhoneDraft(nextUser.phone || ''); setPhoneCode(''); setPhoneCodeSent(false); setPhoneMessage(res.message);
    } catch (error) {
      setPhoneMessage(error instanceof Error ? error.message : 'The code could not be verified.');
    } finally { setPhoneBusy(false); }
  };

  const handleCancelPhoneVerification = async () => {
    setPhoneBusy(true);
    try {
      const res = await apiClient.cancelPhoneVerification();
      if (!res.success) { setPhoneMessage(res.message || 'Could not cancel this verification request.'); return; }
      setWhatsappLink('');
      setWhatsappWebLink('');
      setPhoneCodeSent(false);
      setPhoneCode('');
      setPhoneMessage(res.message);
    } catch (error) {
      setPhoneMessage(error instanceof Error ? error.message : 'Could not cancel this verification request.');
    } finally { setPhoneBusy(false); }
  };

  const handleRequestEmailChange = async (event: React.FormEvent) => {
    event.preventDefault(); setEmailBusy(true); setEmailMessage('');
    try {
      const res = await apiClient.requestEmailChange(emailDraft.trim(), emailPassword);
      if (!res.success) { setEmailMessage(res.message || 'Could not start the email change.'); return; }
      setEmailMessage(res.message); setEmailPassword('');
      persistUser({ ...(user || { id: '', name: '', email: '', role: '' }), pendingEmail: emailDraft.trim() } as NonNullable<typeof user>);
    } catch (error) {
      setEmailMessage(error instanceof Error ? error.message : 'Could not start the email change.');
    } finally { setEmailBusy(false); }
  };

  const handleCancelEmailChange = async () => {
    setEmailBusy(true);
    try {
      const res = await apiClient.cancelEmailChange();
      if (!res.success) { setEmailMessage(res.message || 'Could not cancel the pending email change.'); return; }
      setEmailMessage(res.message); persistUser({ ...(user || { id: '', name: '', email: '', role: '' }), pendingEmail: '' } as NonNullable<typeof user>);
    } catch { setEmailMessage('Could not cancel the pending email change.'); }
    finally { setEmailBusy(false); }
  };

  return (
  <div className="max-w-6xl animate-fade-in pb-20 pt-2">
  <div className="mb-8 border-b border-white/10 pb-5">
  <div className="flex min-w-0 flex-wrap items-center gap-3">
  <Mail className="h-4 w-4 shrink-0 text-white/38" />
  <p className="min-w-0 break-all text-base font-semibold text-white">{user?.email}</p>
  <span className={`inline-flex w-fit items-center gap-1.5 text-xs font-semibold ${user?.isEmailVerified ? 'text-expert-green' : 'text-amber-300'}`}>
  {user?.isEmailVerified ? <Check className="h-3.5 w-3.5" /> : <TriangleAlert className="h-3.5 w-3.5" />}
  {user?.isEmailVerified ? 'Verified' : 'Not verified'}
  </span>
  {!user?.isEmailVerified && (
  <button
  type="button"
  onClick={handleResendVerification}
  disabled={resendState === 'sending' || resendState === 'sent'}
  className="flex items-center gap-1.5 border border-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/70 transition hover:border-ai-blue/30 hover:text-white disabled:opacity-50"
  >
  {resendState === 'sending' && <Loader2 className="h-3 w-3 animate-spin" />}
  {resendState === 'sent' ? 'Email sent' : resendState === 'error' ? 'Try again' : 'Resend verification'}
  </button>
  )}
  </div>
  </div>

  {profileMessage.text && (
  <div className={`mb-7 border px-4 py-3 text-sm font-semibold ${profileMessage.type === 'success' ? 'bg-expert-green/10 border-expert-green/20 text-expert-green' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
  <div className="flex items-center gap-3">
  {profileMessage.type === 'success' ? <Check className="w-4 h-4" /> : <TriangleAlert className="w-4 h-4" />}
  {profileMessage.text}
  </div>
  </div>
  )}

  <div className="mb-8 grid gap-5 lg:grid-cols-2">
  <section className="border border-white/10 p-5">
  <div className="mb-4 flex items-center gap-2"><Phone className="h-4 w-4 text-white/45" /><h2 className="text-sm font-semibold text-white">Phone verification</h2></div>
  <p className="mb-4 text-xs text-white/50">Your current number stays active until you verify its replacement.</p>
  <p className="mb-4 break-all text-sm text-white">{user?.phone || 'No phone number added'} <span className={`ml-2 text-xs ${user?.phone ? (user.phoneVerified ? 'text-expert-green' : 'text-amber-300') : 'text-white/30'}`}>{user?.phone ? (user.phoneVerified ? 'Verified' : 'Not verified') : ''}</span></p>
  {verificationMethodsLoading ? (
    <p role="status" className="text-xs leading-5 text-white/42">Checking whether phone verification is available…</p>
  ) : verificationMethodsError ? (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-xs leading-5 text-amber-200/75">Couldn’t check phone verification availability. Try again before requesting a code.</p>
      <button type="button" onClick={() => void loadVerificationMethods()} className="min-h-9 border border-white/15 px-3 text-xs font-semibold text-white/75 transition hover:border-ai-blue/40 hover:text-white">Retry</button>
    </div>
  ) : verificationMethods && !verificationMethods.sms && !verificationMethods.whatsapp ? (
    <p className="text-xs leading-5 text-white/42">Phone verification is not available yet. Sitemendr needs an SMS provider or WhatsApp webhook configuration before you can verify a number.</p>
  ) : (
    <div className="space-y-3">
      {!whatsappLink && <input type="tel" value={phoneDraft} disabled={phoneCodeSent} onChange={(event) => { setPhoneDraft(event.target.value); setPhoneCodeSent(false); setPhoneMessage(''); }} placeholder="New number, e.g. +254712345678" className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none focus:border-ai-blue disabled:opacity-60" />}
      <div className="flex flex-wrap gap-2">
        {!phoneCodeSent && !whatsappLink && verificationMethods?.sms && <button type="button" onClick={() => { setPhoneChannel('sms'); setPhoneCode(''); }} className={`min-h-9 border px-3 text-xs ${phoneChannel === 'sms' ? 'border-ai-blue text-white' : 'border-white/12 text-white/55'}`}>SMS</button>}
        {!phoneCodeSent && !whatsappLink && verificationMethods?.whatsapp && <button type="button" onClick={() => { setPhoneChannel('whatsapp'); setPhoneCode(''); }} className={`flex min-h-9 items-center gap-1.5 border px-3 text-xs ${phoneChannel === 'whatsapp' ? 'border-ai-blue text-white' : 'border-white/12 text-white/55'}`}><MessageCircle className="h-3.5 w-3.5" />WhatsApp</button>}
        {!phoneCodeSent && !whatsappLink && <button type="button" disabled={phoneBusy || !phoneDraft.trim() || !verificationMethods} onClick={handleSendPhoneCode} className="min-h-9 bg-ai-blue px-3 text-xs font-semibold text-white disabled:opacity-45">{phoneBusy ? 'Preparing…' : phoneChannel === 'whatsapp' ? 'Continue with WhatsApp' : 'Send code'}</button>}
        {phoneChannel === 'whatsapp' && whatsappLink && (
          <div className="w-full space-y-4 border border-white/10 p-4">
            <div>
              <p className="text-sm font-semibold text-white">Send a verification message to Sitemendr</p>
              <p className="mt-1 text-xs leading-5 text-white/55">The message includes a short-lived code. Send it from the WhatsApp account for {phoneDraft.trim()} so we can verify the right number.</p>
            </div>
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-center">
              <div className="hidden shrink-0 rounded-lg bg-white p-3 md:block">
                <QRCodeSVG value={whatsappLink} size={176} level="M" marginSize={2} title="Scan to open the Sitemendr WhatsApp verification chat" />
              </div>
              <div className="w-full space-y-2">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex min-h-10 items-center justify-center gap-2 bg-[#25D366] px-4 text-xs font-semibold text-[#07130b] transition hover:bg-[#41e77d] md:hidden">
                  <MessageCircle className="h-4 w-4" />Open WhatsApp
                </a>
                <a href={whatsappWebLink} target="_blank" rel="noopener noreferrer" className="hidden min-h-10 items-center justify-center gap-2 bg-[#25D366] px-4 text-xs font-semibold text-[#07130b] transition hover:bg-[#41e77d] md:flex">
                  <MessageCircle className="h-4 w-4" />Open WhatsApp Web
                </a>
                <p className="text-center text-[11px] leading-5 text-white/45 md:hidden">WhatsApp opens with the message ready. Tap Send to verify.</p>
                <p className="hidden text-[11px] leading-5 text-white/45 md:block">Scan with the phone that has WhatsApp for this number, then tap Send. You can also open WhatsApp Web if it’s already linked.</p>
                <div role="status" className="flex items-center justify-center gap-2 pt-1 text-xs text-white/60">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-ai-blue" />Waiting for your WhatsApp message…
                </div>
              </div>
            </div>
            <button type="button" disabled={phoneBusy} onClick={() => void handleCancelPhoneVerification()} className="text-xs text-white/45 underline decoration-white/25 underline-offset-4 transition hover:text-white/75">Use a different number</button>
          </div>
        )}
        {phoneChannel === 'sms' && phoneCodeSent && <>
          <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={phoneCode} onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" className="min-h-9 w-32 border border-white/15 bg-transparent px-3 text-sm text-white outline-none focus:border-ai-blue" />
          <button type="button" disabled={phoneBusy || phoneCode.length !== 6} onClick={handleVerifyPhoneCode} className="min-h-9 bg-ai-blue px-3 text-xs font-semibold text-white disabled:opacity-45">{phoneBusy ? 'Checking…' : 'Verify number'}</button>
          <button type="button" disabled={phoneBusy} onClick={handleSendPhoneCode} className="min-h-9 border border-white/15 px-3 text-xs text-white/70 disabled:opacity-45">Resend</button>
        </>}
      </div>
      {phoneMessage && <p role="status" className="text-xs leading-5 text-white/65">{phoneMessage}</p>}
    </div>
  )}
  </section>

  <section className="border border-white/10 p-5">
  <div className="mb-4 flex items-center gap-2"><Mail className="h-4 w-4 text-white/45" /><h2 className="text-sm font-semibold text-white">Sign-in email</h2></div>
  <p className="mb-3 break-all text-sm text-white">{user?.email} <span className={`ml-2 text-xs ${user?.isEmailVerified ? 'text-expert-green' : 'text-amber-300'}`}>{user?.isEmailVerified ? 'Verified' : 'Not verified'}</span></p>
  {user?.pendingEmail ? <div className="space-y-3"><p className="text-xs leading-5 text-amber-200/80">Waiting for confirmation at {user.pendingEmail}. Your current sign-in email remains active until you confirm.</p><button type="button" disabled={emailBusy} onClick={handleCancelEmailChange} className="flex min-h-9 items-center gap-1.5 border border-white/15 px-3 text-xs text-white/70 disabled:opacity-50"><X className="h-3.5 w-3.5" />Cancel change</button></div> : <form onSubmit={handleRequestEmailChange} className="space-y-3">
    <input type="email" autoComplete="email" required value={emailDraft} onChange={(event) => setEmailDraft(event.target.value)} placeholder="New sign-in email" className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none focus:border-ai-blue" />
    <input type="password" autoComplete="current-password" required value={emailPassword} onChange={(event) => setEmailPassword(event.target.value)} placeholder="Confirm with current password" className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none focus:border-ai-blue" />
    <button type="submit" disabled={emailBusy || !emailDraft.trim()} className="min-h-9 bg-ai-blue px-3 text-xs font-semibold text-white disabled:opacity-45">{emailBusy ? 'Sending…' : 'Send confirmation'}</button>
    {emailMessage && <p role="status" className="text-xs leading-5 text-white/65">{emailMessage}</p>}
  </form>}
  {user?.pendingEmail && emailMessage && <p role="status" className="mt-3 text-xs text-white/65">{emailMessage}</p>}
  </section>
  </div>

  <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
  <section>
  <form onSubmit={handleUpdateProfile} className="grid gap-5 sm:grid-cols-2">
  <div className="space-y-3">
  <label className="text-[10px] font-semibold text-white/40">Name</label>
  <input type="text" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
  className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none transition focus:border-ai-blue" placeholder="Your name" />
  </div>
  <div className="space-y-3">
  <label className="text-[10px] font-semibold text-white/40">Verified phone</label>
  <p className="break-all border-b border-white/14 py-3 text-sm text-white/75">{user?.phone || 'Add and verify a number above'}</p>
  </div>
  <div className="space-y-3">
  <label className="text-[10px] font-semibold text-white/40">Country</label>
  <select value={profileData.country} onChange={(e) => {
  const country = e.target.value;
  setCurrencyImpactAcknowledged(false);
  setProfileData({ ...profileData, country, billingRegion: country, defaultCurrency: getDefaultCurrencyForCountry(country) });
  }} className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none transition focus:border-ai-blue">
  {accountCountryOptions.map(option => <option key={option.code} value={option.code} className="bg-black text-white">{option.name}</option>)}
  </select>
  </div>
  <div className="space-y-3">
  <label className="text-[10px] font-semibold text-white/40">Currency</label>
  <select value={profileData.defaultCurrency} onChange={(e) => { setCurrencyImpactAcknowledged(false); setProfileData({ ...profileData, defaultCurrency: e.target.value }); }}
  className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none transition focus:border-ai-blue">
  {Array.from(new Set(accountCountryOptions.map(o => o.currency))).map(currency => <option key={currency} value={currency} className="bg-black text-white">{currency}</option>)}
  </select>
  {currencyChanged && (
    <label className="flex cursor-pointer items-start gap-2 text-xs leading-5 text-amber-100/75 sm:col-span-2">
      <input type="checkbox" checked={currencyImpactAcknowledged} onChange={(event) => setCurrencyImpactAcknowledged(event.target.checked)} className="mt-1 accent-sky-400" />
      <span>Changing your default currency also updates amounts on open build requests that do not yet have a confirmed payment agreement.</span>
    </label>
  )}
  </div>
  <div className="space-y-3">
  <label className="text-[10px] font-semibold text-white/40">Account type</label>
  <select value={profileData.accountType} onChange={(e) => {
    const nextType = e.target.value;
    const hasEntityDetails = Boolean(profileData.entityName || profileData.entityContactEmail || profileData.entityPhone);
    if (nextType === 'individual' && profileData.accountType !== 'individual' && hasEntityDetails && !window.confirm('Switching to Individual clears the saved business or organisation contact details. Continue?')) return;
    setProfileData({ ...profileData, accountType: nextType, ...(nextType === 'individual' ? { entityName: '', entityContactEmail: '', entityPhone: '' } : {}) });
  }}
  className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none transition focus:border-ai-blue">
  {accountTypeOptions.map(option => <option key={option.value} value={option.value} className="bg-black text-white">{option.label}</option>)}
  </select>
  </div>
  {profileData.accountType !== 'individual' && (
  <div className="space-y-4 border-l border-ai-blue/35 pl-4 sm:col-span-2">
  <p className="text-xs leading-5 text-white/48">These details identify the client entity on this Sitemendr account.</p>
  <div className="grid gap-5 sm:grid-cols-2">
  <div className="space-y-3">
  <label className="text-[10px] font-semibold text-white/40">{profileData.accountType === 'agency' ? 'Agency name' : profileData.accountType === 'organization' ? 'Organisation name' : 'Business name'}</label>
  <input type="text" maxLength={160} required value={profileData.entityName} onChange={(e) => setProfileData({ ...profileData, entityName: e.target.value })}
  className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none transition focus:border-ai-blue" placeholder="Name of the entity" />
  </div>
  <div className="space-y-3">
  <label className="text-[10px] font-semibold text-white/40">Entity contact email <span className="normal-case text-white/30">(optional)</span></label>
  <input type="email" value={profileData.entityContactEmail} onChange={(e) => setProfileData({ ...profileData, entityContactEmail: e.target.value })}
  className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none transition focus:border-ai-blue" placeholder="team@example.com" />
  </div>
  <div className="space-y-3">
  <label className="text-[10px] font-semibold text-white/40">Entity phone <span className="normal-case text-white/30">(optional)</span></label>
  <div className="flex border-b border-white/14 transition focus-within:border-ai-blue">
  <span className="shrink-0 py-3 pr-3 text-sm font-semibold text-white/38">{getDialCodeForCountry(profileData.country) || '+'}</span>
  <input type="tel" value={getLocalPhoneForCountry(profileData.entityPhone, profileData.country)} onChange={(e) => setProfileData({ ...profileData, entityPhone: e.target.value })}
  className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none" placeholder="Add entity phone" />
  </div>
  </div>
  </div>
  </div>
  )}
  <div className="space-y-4 border-t border-white/10 pt-5 sm:col-span-2">
  <div><h3 className="text-sm font-semibold text-white">Billing address</h3><p className="mt-1 text-xs text-white/45">Optional address details for invoices and account billing records.</p></div>
  <div className="grid gap-5 sm:grid-cols-2">
    <div className="space-y-3 sm:col-span-2"><label className="text-[10px] font-semibold text-white/40">Address line 1</label><input maxLength={180} value={profileData.billingAddressLine1} onChange={(event) => setProfileData({ ...profileData, billingAddressLine1: event.target.value })} className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none focus:border-ai-blue" placeholder="Street address" /></div>
    <div className="space-y-3 sm:col-span-2"><label className="text-[10px] font-semibold text-white/40">Address line 2 <span className="normal-case text-white/30">(optional)</span></label><input maxLength={180} value={profileData.billingAddressLine2} onChange={(event) => setProfileData({ ...profileData, billingAddressLine2: event.target.value })} className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none focus:border-ai-blue" placeholder="Apartment, suite, etc." /></div>
    <div className="space-y-3"><label className="text-[10px] font-semibold text-white/40">City / town</label><input maxLength={100} value={profileData.billingCity} onChange={(event) => setProfileData({ ...profileData, billingCity: event.target.value })} className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none focus:border-ai-blue" /></div>
    <div className="space-y-3"><label className="text-[10px] font-semibold text-white/40">Postal code <span className="normal-case text-white/30">(optional)</span></label><input maxLength={24} value={profileData.billingPostalCode} onChange={(event) => setProfileData({ ...profileData, billingPostalCode: event.target.value })} className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none focus:border-ai-blue" /></div>
    <div className="space-y-3"><label className="text-[10px] font-semibold text-white/40">Billing country</label><select value={profileData.billingCountry} onChange={(event) => setProfileData({ ...profileData, billingCountry: event.target.value })} className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none focus:border-ai-blue">{accountCountryOptions.map((option) => <option key={option.code} value={option.code} className="bg-black text-white">{option.name}</option>)}</select></div>
  </div>
  </div>
  <div className="sm:col-span-2 pt-3">
  <button type="submit" disabled={currencyChanged && !currencyImpactAcknowledged} className="min-h-11 bg-ai-blue px-5 text-sm font-semibold text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-45">{currencyChanged && !currencyImpactAcknowledged ? 'Review currency change to save' : 'Save changes'}</button>
  </div>
  </form>
  </section>

  <section className="space-y-6 border-t border-white/10 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
  <form onSubmit={handleChangePassword} className="space-y-5">
  {passwordMessage.text && (
  <div className={`border px-4 py-3 text-sm font-semibold ${passwordMessage.type === 'success' ? 'border-expert-green/20 bg-expert-green/10 text-expert-green' : 'border-red-500/20 bg-red-500/10 text-red-400'}`}>
  {passwordMessage.text}
  </div>
  )}
  <div className="space-y-4">
  <input type="password" autoComplete="current-password" required value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
  className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none transition focus:border-ai-blue" placeholder="Current password" />
  <input type="password" autoComplete="new-password" minLength={8} required value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
  className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none transition focus:border-ai-blue" placeholder="New password" />
  <input type="password" autoComplete="new-password" minLength={8} required value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
  className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none transition focus:border-ai-blue" placeholder="Confirm new password" />
  </div>
  <button type="submit" className="min-h-11 border border-white/16 px-5 text-sm font-semibold text-white transition hover:border-white/34 hover:bg-white/8">Change password</button>
  </form>
  </section>
  </div>
  </div>
  );
}
