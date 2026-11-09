// components/client-dashboard/ClientSettings.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Mail, TriangleAlert, Loader2, MessageCircle, Phone, X, ShieldCheck } from 'lucide-react';
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

const accountCardClass = 'rounded-2xl border border-white/[0.09] bg-white/[0.025] p-5 sm:p-6';
const accountInputClass = 'min-h-11 w-full rounded-xl border border-white/[0.12] bg-[#11151c] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 hover:border-white/20 focus:border-ai-blue focus:ring-2 focus:ring-ai-blue/20 disabled:cursor-not-allowed disabled:opacity-60';
const accountButtonClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-ai-blue px-4 text-sm font-semibold text-white transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-blue focus-visible:ring-offset-2 focus-visible:ring-offset-[#11151c] disabled:cursor-not-allowed disabled:opacity-50';

function StatusBadge({ status }: { status: 'verified' | 'unverified' | 'pending' }) {
  const styles = {
    verified: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    unverified: 'border-amber-300/20 bg-amber-300/10 text-amber-200',
    pending: 'border-sky-300/20 bg-sky-300/10 text-sky-200',
  };
  const labels = { verified: 'Verified', unverified: 'Not verified', pending: 'Change pending' };
  return <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}>
    {status === 'verified' ? <ShieldCheck className="h-3.5 w-3.5" /> : status === 'pending' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TriangleAlert className="h-3.5 w-3.5" />}
    {labels[status]}
  </span>;
}

function FeedbackMessage({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'success' | 'error' | 'info' }) {
  const styles = {
    success: 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200',
    error: 'border-red-400/20 bg-red-400/[0.08] text-red-200',
    info: 'border-sky-300/20 bg-sky-300/[0.06] text-sky-100/80',
  };
  return <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-3.5 py-3 text-xs leading-5 ${styles[tone]}`}>{children}</div>;
}

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
  const [phoneMessageTone, setPhoneMessageTone] = useState<'success' | 'error' | 'info'>('info');
  const [emailDraft, setEmailDraft] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailMessageTone, setEmailMessageTone] = useState<'success' | 'error' | 'info'>('info');
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
          setPhoneMessageTone('success');
          setWhatsappLink('');
          setWhatsappWebLink('');
          setPhoneCodeSent(false);
          return;
        }
        if (status.expiresAt && Date.now() >= new Date(status.expiresAt).getTime()) {
          setWhatsappLink('');
          setPhoneMessage('This verification request expired. Start again to get a new code.');
          setPhoneMessageTone('error');
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
    setPhoneBusy(true); setPhoneMessage(''); setPhoneMessageTone('info');
    try {
      const res = await apiClient.sendPhoneVerificationCode(phoneDraft.trim(), phoneChannel);
      if (!res.success) { setPhoneMessage(res.message || 'Could not send the verification code.'); setPhoneMessageTone('error'); return; }
      setPhoneMessage(res.message);
      if (phoneChannel === 'whatsapp') {
        if (!res.whatsappLink) { setPhoneMessage('WhatsApp verification could not be prepared. Try again shortly.'); setPhoneMessageTone('error'); return; }
        setWhatsappLink(res.whatsappLink);
        setWhatsappWebLink(res.whatsappWebLink || res.whatsappLink);
      } else {
        setPhoneCodeSent(true);
      }
    } catch (error) {
      setPhoneMessage(error instanceof Error ? error.message : 'Could not send the verification code.'); setPhoneMessageTone('error');
    } finally { setPhoneBusy(false); }
  };

  const handleVerifyPhoneCode = async () => {
    setPhoneBusy(true); setPhoneMessage(''); setPhoneMessageTone('info');
    try {
      const res = await apiClient.verifyPhoneCode(phoneCode.trim());
      if (!res.success) { setPhoneMessage(res.message || 'The code could not be verified.'); setPhoneMessageTone('error'); return; }
      const nextUser = { ...(user || { id: '', name: '', email: '', role: '' }), phone: res.phone || phoneDraft.trim(), phoneVerified: true } as NonNullable<typeof user>;
      persistUser(nextUser);
      setProfileData((current) => ({ ...current, phone: nextUser.phone || '' }));
      setPhoneDraft(nextUser.phone || ''); setPhoneCode(''); setPhoneCodeSent(false); setPhoneMessage(res.message); setPhoneMessageTone('success');
    } catch (error) {
      setPhoneMessage(error instanceof Error ? error.message : 'The code could not be verified.'); setPhoneMessageTone('error');
    } finally { setPhoneBusy(false); }
  };

  const handleCancelPhoneVerification = async () => {
    setPhoneBusy(true);
    try {
      const res = await apiClient.cancelPhoneVerification();
      if (!res.success) { setPhoneMessage(res.message || 'Could not cancel this verification request.'); setPhoneMessageTone('error'); return; }
      setWhatsappLink('');
      setWhatsappWebLink('');
      setPhoneCodeSent(false);
      setPhoneCode('');
      setPhoneMessage(res.message); setPhoneMessageTone('success');
    } catch (error) {
      setPhoneMessage(error instanceof Error ? error.message : 'Could not cancel this verification request.'); setPhoneMessageTone('error');
    } finally { setPhoneBusy(false); }
  };

  const handleRequestEmailChange = async (event: React.FormEvent) => {
    event.preventDefault(); setEmailBusy(true); setEmailMessage(''); setEmailMessageTone('info');
    try {
      const res = await apiClient.requestEmailChange(emailDraft.trim(), emailPassword);
      if (!res.success) { setEmailMessage(res.message || 'Could not start the email change.'); setEmailMessageTone('error'); return; }
      setEmailMessage(res.message); setEmailMessageTone('success'); setEmailPassword('');
      persistUser({ ...(user || { id: '', name: '', email: '', role: '' }), pendingEmail: emailDraft.trim() } as NonNullable<typeof user>);
    } catch (error) {
      setEmailMessage(error instanceof Error ? error.message : 'Could not start the email change.'); setEmailMessageTone('error');
    } finally { setEmailBusy(false); }
  };

  const handleCancelEmailChange = async () => {
    setEmailBusy(true);
    try {
      const res = await apiClient.cancelEmailChange();
      if (!res.success) { setEmailMessage(res.message || 'Could not cancel the pending email change.'); setEmailMessageTone('error'); return; }
      setEmailMessage(res.message); setEmailMessageTone('success'); persistUser({ ...(user || { id: '', name: '', email: '', role: '' }), pendingEmail: '' } as NonNullable<typeof user>);
    } catch { setEmailMessage('Could not cancel the pending email change.'); setEmailMessageTone('error'); }
    finally { setEmailBusy(false); }
  };

  return (
  <div className="max-w-6xl animate-fade-in pb-20 pt-2">
  <header className="mb-8">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ai-blue">Account settings</p>
    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">My account</h1>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">Manage your sign-in details and the contact number associated with your account.</p>
  </header>

  {profileMessage.text && <div className="mb-7"><FeedbackMessage tone={profileMessage.type === 'success' ? 'success' : 'error'}>{profileMessage.text}</FeedbackMessage></div>}

  <div className="mb-8 grid items-start gap-4 lg:grid-cols-2">
  <section className={accountCardClass}>
  <div className="mb-5 flex items-center gap-3">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-400/10 text-sky-200"><Phone className="h-4 w-4" /></span><div><h2 className="text-sm font-semibold text-white">Phone number</h2><p className="mt-1 text-xs text-white/45">Verification protects account contact changes.</p></div>
  </div>
  <div className="mb-5 rounded-xl border border-white/[0.08] bg-black/15 px-3.5 py-3">
    <p className="text-[11px] font-medium text-white/42">Current phone</p>
    <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
      <p className="break-all text-sm font-medium text-white">{user?.phone || 'No phone number added'}</p>
      <div className="flex flex-wrap items-center gap-2">{user?.phone && <StatusBadge status={user.phoneVerified ? 'verified' : 'unverified'} />}{(whatsappLink || phoneCodeSent) && <StatusBadge status="pending" />}</div>
    </div>
    <p className="mt-2 text-xs leading-5 text-white/45">Your current number stays active until you verify its replacement.</p>
  </div>
  {verificationMethodsLoading ? (
    <p role="status" className="text-xs leading-5 text-white/42">Checking whether phone verification is available…</p>
  ) : verificationMethodsError ? (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-xs leading-5 text-amber-200/75">Couldn’t check phone verification availability. Try again before requesting a code.</p>
      <button type="button" onClick={() => void loadVerificationMethods()} className="min-h-10 rounded-xl border border-white/15 px-3.5 text-xs font-semibold text-white/75 transition hover:border-ai-blue/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-blue">Retry</button>
    </div>
  ) : verificationMethods && !verificationMethods.sms && !verificationMethods.whatsapp ? (
    <p className="text-xs leading-5 text-white/42">Phone verification is not available yet. Sitemendr needs an SMS provider or WhatsApp webhook configuration before you can verify a number.</p>
  ) : (
    <div className="space-y-3">
      {!whatsappLink && <div className="space-y-2"><label htmlFor="phone-number" className="block text-xs font-medium text-white/65">{user?.phone ? 'New phone number' : 'Phone number'}</label><input id="phone-number" type="tel" autoComplete="tel" value={phoneDraft} disabled={phoneCodeSent} onChange={(event) => { setPhoneDraft(event.target.value); setPhoneCodeSent(false); setPhoneMessage(''); }} placeholder="e.g. +254 712 345 678" className={accountInputClass} /></div>}
      <div className="flex flex-wrap gap-2">
        {!phoneCodeSent && !whatsappLink && verificationMethods?.sms && <button type="button" onClick={() => { setPhoneChannel('sms'); setPhoneCode(''); }} className={`min-h-10 rounded-xl border px-3.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-blue ${phoneChannel === 'sms' ? 'border-ai-blue/60 bg-ai-blue/10 text-white' : 'border-white/12 text-white/55 hover:border-white/25'}`}>SMS</button>}
        {!phoneCodeSent && !whatsappLink && verificationMethods?.whatsapp && <button type="button" onClick={() => { setPhoneChannel('whatsapp'); setPhoneCode(''); }} className={`flex min-h-10 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-blue ${phoneChannel === 'whatsapp' ? 'border-ai-blue/60 bg-ai-blue/10 text-white' : 'border-white/12 text-white/55 hover:border-white/25'}`}><MessageCircle className="h-3.5 w-3.5" />WhatsApp</button>}
        {!phoneCodeSent && !whatsappLink && <button type="button" disabled={phoneBusy || !phoneDraft.trim() || !verificationMethods} onClick={handleSendPhoneCode} className={accountButtonClass}>{phoneBusy ? 'Preparing…' : phoneChannel === 'whatsapp' ? 'Prepare WhatsApp verification' : 'Send code'}</button>}
        {phoneChannel === 'whatsapp' && whatsappLink && (
          <div className="w-full space-y-4 rounded-xl border border-white/[0.09] bg-black/15 p-4 sm:p-5">
            <div>
              <p className="text-sm font-semibold text-white">Send a verification message to Sitemendr</p>
              <p className="mt-1 text-xs leading-5 text-white/55">The message includes a short-lived code. Send it from the WhatsApp account for {phoneDraft.trim()} so we can verify the right number.</p>
            </div>
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-center">
              <div className="hidden shrink-0 rounded-lg bg-white p-3 md:block">
                <QRCodeSVG value={whatsappLink} size={176} level="M" marginSize={2} title="Scan to open the Sitemendr WhatsApp verification chat" />
              </div>
              <div className="w-full space-y-2">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-[#07130b] transition hover:bg-[#41e77d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] md:hidden">
                  <MessageCircle className="h-4 w-4" />Open WhatsApp to verify
                </a>
                <a href={whatsappWebLink} target="_blank" rel="noopener noreferrer" className="hidden min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-[#07130b] transition hover:bg-[#41e77d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] md:flex">
                  <MessageCircle className="h-4 w-4" />Open WhatsApp Web to verify
                </a>
                <p className="text-center text-[11px] leading-5 text-white/45 md:hidden">WhatsApp opens with the message ready. Tap Send to verify.</p>
                <p className="hidden text-[11px] leading-5 text-white/45 md:block">Scan with the phone that has WhatsApp for this number, then tap Send. You can also open WhatsApp Web if it’s already linked.</p>
                <div role="status" className="flex items-center justify-center gap-2 pt-1 text-xs text-white/60">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-ai-blue" />Waiting for your WhatsApp message…
                </div>
              </div>
            </div>
            <button type="button" disabled={phoneBusy} onClick={() => void handleCancelPhoneVerification()} className="rounded-lg px-2 py-1 text-xs text-white/55 underline decoration-white/25 underline-offset-4 transition hover:text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-blue disabled:opacity-50">Use a different number</button>
          </div>
        )}
        {phoneChannel === 'sms' && phoneCodeSent && <>
          <label htmlFor="phone-code" className="sr-only">Six-digit verification code</label><input id="phone-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={phoneCode} onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" className={`${accountInputClass} w-36`} />
          <button type="button" disabled={phoneBusy || phoneCode.length !== 6} onClick={handleVerifyPhoneCode} className="min-h-9 bg-ai-blue px-3 text-xs font-semibold text-white disabled:opacity-45">{phoneBusy ? 'Checking…' : 'Verify number'}</button>
          <button type="button" disabled={phoneBusy} onClick={handleSendPhoneCode} className="min-h-10 rounded-xl border border-white/15 px-3.5 text-xs font-semibold text-white/75 transition hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-blue disabled:opacity-45">Resend</button>
        </>}
      </div>
      {phoneMessage && <FeedbackMessage tone={phoneMessageTone}>{phoneMessage}</FeedbackMessage>}
    </div>
  )}
  </section>

  <section className={accountCardClass}>
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-400/10 text-sky-200"><Mail className="h-4 w-4" /></span><div><h2 className="text-sm font-semibold text-white">Sign-in email</h2><p className="mt-1 text-xs text-white/45">Used to sign in and receive account updates.</p></div></div>
      {user?.pendingEmail ? <StatusBadge status="pending" /> : <StatusBadge status={user?.isEmailVerified ? 'verified' : 'unverified'} />}
    </div>
    <div className="mb-5 rounded-xl border border-white/[0.08] bg-black/15 px-3.5 py-3">
      <p className="text-[11px] font-medium text-white/42">Current email</p>
      <p className="mt-1 break-all text-sm font-medium text-white">{user?.email || 'No email available'}</p>
      {!user?.isEmailVerified && !user?.pendingEmail && <div className="mt-3 flex flex-wrap items-center gap-3"><p className="text-xs text-amber-100/70">Verify your email to help protect account access.</p><button type="button" onClick={handleResendVerification} disabled={resendState === 'sending' || resendState === 'sent'} className="min-h-9 rounded-lg border border-white/15 px-3 text-xs font-semibold text-white/75 transition hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-blue disabled:opacity-50">{resendState === 'sending' ? 'Sending…' : resendState === 'sent' ? 'Email sent' : resendState === 'error' ? 'Try again' : 'Resend verification'}</button></div>}
    </div>
    {user?.pendingEmail ? <div className="space-y-3"><FeedbackMessage tone="info">Confirmation is pending for <span className="font-semibold text-white">{user.pendingEmail}</span>. Your current email remains active until you confirm the change.</FeedbackMessage><button type="button" disabled={emailBusy} onClick={handleCancelEmailChange} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 px-3.5 text-xs font-semibold text-white/75 transition hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-blue disabled:opacity-50"><X className="h-3.5 w-3.5" />Cancel change</button></div> : <form onSubmit={handleRequestEmailChange} className="space-y-4">
      <div className="space-y-2"><label htmlFor="new-signin-email" className="block text-xs font-medium text-white/65">New sign-in email</label><input id="new-signin-email" type="email" autoComplete="email" required value={emailDraft} onChange={(event) => setEmailDraft(event.target.value)} placeholder="name@example.com" className={accountInputClass} /></div>
      <div className="space-y-2"><label htmlFor="email-change-password" className="block text-xs font-medium text-white/65">Current password</label><input id="email-change-password" type="password" autoComplete="current-password" required value={emailPassword} onChange={(event) => setEmailPassword(event.target.value)} placeholder="Enter your current password" className={accountInputClass} /></div>
      <button type="submit" disabled={emailBusy || !emailDraft.trim()} className={accountButtonClass}>{emailBusy ? 'Sending…' : 'Send confirmation'}</button>
    </form>}
    {emailMessage && <div className="mt-4"><FeedbackMessage tone={emailMessageTone}>{emailMessage}</FeedbackMessage></div>}
  </section>
  </div>

  <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,.8fr)]">
  <section className={accountCardClass}>
  <form onSubmit={handleUpdateProfile} className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
  <div className="sm:col-span-2"><h2 className="text-sm font-semibold text-white">Profile and invoice details</h2><p className="mt-1 text-xs leading-5 text-white/45">Keep your contact information and invoice details up to date.</p></div>
  <div className="space-y-3">
  <label htmlFor="account-name" className="block text-xs font-medium text-white/65">Name</label>
  <input id="account-name" type="text" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} className={accountInputClass} placeholder="Your name" />
  </div>
  <div className="space-y-3">
  <label htmlFor="account-country" className="block text-xs font-medium text-white/65">Country</label>
  <select value={profileData.country} onChange={(e) => {
  const country = e.target.value;
  setCurrencyImpactAcknowledged(false);
  setProfileData({ ...profileData, country, billingRegion: country, defaultCurrency: getDefaultCurrencyForCountry(country) });
  }} id="account-country" className={accountInputClass}>
  {accountCountryOptions.map(option => <option key={option.code} value={option.code} className="bg-black text-white">{option.name}</option>)}
  </select>
  </div>
  <div className="space-y-3">
  <label htmlFor="account-currency" className="block text-xs font-medium text-white/65">Currency</label>
  <select value={profileData.defaultCurrency} onChange={(e) => { setCurrencyImpactAcknowledged(false); setProfileData({ ...profileData, defaultCurrency: e.target.value }); }}
  id="account-currency" className={accountInputClass}>
  {Array.from(new Set(accountCountryOptions.map(o => o.currency))).map(currency => <option key={currency} value={currency} className="bg-black text-white">{currency}</option>)}
  </select>
  {currencyChanged && (
     <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] p-3 text-xs leading-5 text-amber-100/75">
      <input type="checkbox" checked={currencyImpactAcknowledged} onChange={(event) => setCurrencyImpactAcknowledged(event.target.checked)} className="mt-1 accent-sky-400" />
      <span>Changing your default currency also updates amounts on open build requests that do not yet have a confirmed payment agreement.</span>
    </label>
  )}
  </div>
  <div className="space-y-3">
  <label htmlFor="account-type" className="block text-xs font-medium text-white/65">Account type</label>
  <select value={profileData.accountType} onChange={(e) => {
    const nextType = e.target.value;
    const hasEntityDetails = Boolean(profileData.entityName || profileData.entityContactEmail || profileData.entityPhone);
    if (nextType === 'individual' && profileData.accountType !== 'individual' && hasEntityDetails && !window.confirm('Switching to Individual clears the saved business or organisation contact details. Continue?')) return;
    setProfileData({ ...profileData, accountType: nextType, ...(nextType === 'individual' ? { entityName: '', entityContactEmail: '', entityPhone: '' } : {}) });
  }}
  id="account-type" className={accountInputClass}>
  {accountTypeOptions.map(option => <option key={option.value} value={option.value} className="bg-black text-white">{option.label}</option>)}
  </select>
  </div>
  {profileData.accountType !== 'individual' && (
  <div className="space-y-4 rounded-xl border border-ai-blue/20 bg-ai-blue/[0.04] p-4 sm:col-span-2">
  <p className="text-xs leading-5 text-white/55">These details identify the client entity on this Sitemendr account.</p>
  <div className="grid gap-5 sm:grid-cols-2">
  <div className="space-y-3">
  <label htmlFor="entity-name" className="block text-xs font-medium text-white/65">{profileData.accountType === 'agency' ? 'Agency name' : profileData.accountType === 'organization' ? 'Organisation name' : 'Business name'}</label>
  <input id="entity-name" type="text" maxLength={160} required value={profileData.entityName} onChange={(e) => setProfileData({ ...profileData, entityName: e.target.value })} className={accountInputClass} placeholder="Name of the entity" />
  </div>
  <div className="space-y-3">
  <label htmlFor="entity-email" className="block text-xs font-medium text-white/65">Entity contact email <span className="text-white/35">(optional)</span></label>
  <input id="entity-email" type="email" value={profileData.entityContactEmail} onChange={(e) => setProfileData({ ...profileData, entityContactEmail: e.target.value })} className={accountInputClass} placeholder="team@example.com" />
  </div>
  <div className="space-y-3">
  <label htmlFor="entity-phone" className="block text-xs font-medium text-white/65">Entity phone <span className="text-white/35">(optional)</span></label>
  <div className="flex min-h-11 items-center rounded-xl border border-white/[0.12] bg-[#11151c] px-3.5 transition focus-within:border-ai-blue focus-within:ring-2 focus-within:ring-ai-blue/20">
  <span className="shrink-0 pr-3 text-sm font-medium text-white/50">{getDialCodeForCountry(profileData.country) || '+'}</span>
  <input id="entity-phone" type="tel" value={getLocalPhoneForCountry(profileData.entityPhone, profileData.country)} onChange={(e) => setProfileData({ ...profileData, entityPhone: e.target.value })} className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-white/30" placeholder="Add entity phone" />
  </div>
  </div>
  </div>
  </div>
  )}
  <div className="space-y-4 rounded-xl border border-white/[0.08] bg-black/10 p-4 sm:col-span-2">
  <div><h3 className="text-sm font-semibold text-white">Invoice details</h3><p className="mt-1 text-xs text-white/45">Optional address details used for invoices and account billing records.</p></div>
  <div className="grid gap-4 sm:grid-cols-2">
    <div className="space-y-2 sm:col-span-2"><label htmlFor="billing-address-1" className="block text-xs font-medium text-white/65">Address line 1</label><input id="billing-address-1" maxLength={180} value={profileData.billingAddressLine1} onChange={(event) => setProfileData({ ...profileData, billingAddressLine1: event.target.value })} className={accountInputClass} placeholder="Street address" /></div>
    <div className="space-y-2 sm:col-span-2"><label htmlFor="billing-address-2" className="block text-xs font-medium text-white/65">Address line 2 <span className="text-white/35">(optional)</span></label><input id="billing-address-2" maxLength={180} value={profileData.billingAddressLine2} onChange={(event) => setProfileData({ ...profileData, billingAddressLine2: event.target.value })} className={accountInputClass} placeholder="Apartment, suite, etc." /></div>
    <div className="space-y-2"><label htmlFor="billing-city" className="block text-xs font-medium text-white/65">City / town</label><input id="billing-city" maxLength={100} value={profileData.billingCity} onChange={(event) => setProfileData({ ...profileData, billingCity: event.target.value })} className={accountInputClass} placeholder="City or town" /></div>
    <div className="space-y-2"><label htmlFor="billing-postal" className="block text-xs font-medium text-white/65">Postal code <span className="text-white/35">(optional)</span></label><input id="billing-postal" maxLength={24} value={profileData.billingPostalCode} onChange={(event) => setProfileData({ ...profileData, billingPostalCode: event.target.value })} className={accountInputClass} placeholder="Postal code" /></div>
    <div className="space-y-2 sm:col-span-2"><label htmlFor="billing-country" className="block text-xs font-medium text-white/65">Billing country</label><select id="billing-country" value={profileData.billingCountry} onChange={(event) => setProfileData({ ...profileData, billingCountry: event.target.value })} className={accountInputClass}>{accountCountryOptions.map((option) => <option key={option.code} value={option.code} className="bg-black text-white">{option.name}</option>)}</select></div>
  </div>
  </div>
  <div className="sm:col-span-2 pt-3">
  <button type="submit" disabled={currencyChanged && !currencyImpactAcknowledged} className={`${accountButtonClass} min-h-11 px-5`}>{currencyChanged && !currencyImpactAcknowledged ? 'Review currency change to save' : 'Save changes'}</button>
  </div>
  </form>
  </section>

  <section className={accountCardClass}>
  <form onSubmit={handleChangePassword} className="space-y-5">
  <div><h2 className="text-sm font-semibold text-white">Password</h2><p className="mt-1 text-xs leading-5 text-white/45">Choose a strong password you don’t use elsewhere.</p></div>
  {passwordMessage.text && <FeedbackMessage tone={passwordMessage.type === 'success' ? 'success' : 'error'}>{passwordMessage.text}</FeedbackMessage>}
  <div className="space-y-4">
  <div className="space-y-2"><label htmlFor="current-password" className="block text-xs font-medium text-white/65">Current password</label><input id="current-password" type="password" autoComplete="current-password" required value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} placeholder="Enter current password" className={accountInputClass} /></div>
  <div className="space-y-2"><label htmlFor="new-password" className="block text-xs font-medium text-white/65">New password</label><input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} placeholder="At least 8 characters" className={accountInputClass} /></div>
  <div className="space-y-2"><label htmlFor="confirm-new-password" className="block text-xs font-medium text-white/65">Confirm new password</label><input id="confirm-new-password" type="password" autoComplete="new-password" minLength={8} required value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} placeholder="Re-enter new password" className={accountInputClass} /></div>
  </div>
  <button type="submit" className={accountButtonClass}>Change password</button>
  </form>
  </section>
  </div>
  </div>
  );
}
