// components/client-dashboard/ClientSettings.tsx
'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Loader2, MessageCircle, MessageSquare, ShieldCheck, TriangleAlert, X } from 'lucide-react';
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

/* ======== ui ======== */

type ProfileFormData = UseClientDashboardReturn['profileData'];
type ClientUser = NonNullable<UseClientDashboardReturn['user']>;

const EMPTY_USER = { id: '', name: '', email: '', role: '' } as ClientUser;

const inputClass =
  'min-h-11 w-full border border-white/[0.12] bg-[#11151c] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 hover:border-white/20 focus:border-ai-blue focus:ring-2 focus:ring-ai-blue/20 disabled:cursor-not-allowed disabled:opacity-60';

const primaryButtonClass =
  'inline-flex min-h-10 items-center justify-center gap-2 bg-ai-blue px-4 text-sm font-semibold text-white transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-blue focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0e13] disabled:cursor-not-allowed disabled:opacity-50';

const secondaryButtonClass =
  'inline-flex min-h-10 items-center justify-center gap-2 border border-white/15 px-4 text-sm font-semibold text-white/75 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-blue disabled:cursor-not-allowed disabled:opacity-50';

const fieldLabelClass = 'mb-1.5 block text-xs font-medium text-white/65';

const badgeStyles = {
  verified: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  unverified: 'border-amber-300/20 bg-amber-300/10 text-amber-200',
  pending: 'border-sky-300/20 bg-sky-300/10 text-sky-200',
};
const badgeLabels = { verified: 'Verified', unverified: 'Not verified', pending: 'Change pending' };

function StatusBadge({ status }: { status: keyof typeof badgeStyles }) {
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 border px-2 py-0.5 text-[11px] font-semibold ${badgeStyles[status]}`}>
      {status === 'verified' ? (
        <ShieldCheck className="h-3.5 w-3.5" />
      ) : status === 'pending' ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <TriangleAlert className="h-3.5 w-3.5" />
      )}
      {badgeLabels[status]}
    </span>
  );
}

const feedbackStyles = {
  success: 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200',
  error: 'border-red-400/20 bg-red-400/[0.08] text-red-200',
  info: 'border-sky-300/20 bg-sky-300/[0.06] text-sky-100/80',
};

function FeedbackMessage({ children, tone = 'info' }: { children: ReactNode; tone?: keyof typeof feedbackStyles }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`border px-3.5 py-3 text-xs leading-5 ${feedbackStyles[tone]}`}>
      {children}
    </div>
  );
}

function SettingsSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="border border-white/[0.08] bg-white/[0.02]">
      <header className="border-b border-white/[0.08] px-5 py-5 sm:px-6">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-white/50">{description}</p>
      </header>
      <div className="px-5 sm:px-6">{children}</div>
    </section>
  );
}

interface SettingsRowProps {
  label: string;
  value: ReactNode;
  badge?: ReactNode;
  /** Text of the row action. Leave undefined to hide the action. */
  actionLabel?: string;
  extraAction?: ReactNode;
  open: boolean;
  onToggle: () => void;
  /** The editor, shown under the row while it is open. */
  children?: ReactNode;
  /** Feedback shown under the row, open or closed. */
  message?: ReactNode;
}

function SettingsRow({ label, value, badge, actionLabel, extraAction, open, onToggle, children, message }: SettingsRowProps) {
  return (
    <div className="border-t border-white/[0.08] first:border-t-0">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-4 sm:grid-cols-[10rem_minmax(0,1fr)_auto]">
        <span className="col-span-2 text-xs font-medium text-white/45 sm:col-span-1">{label}</span>
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-white">
          <span className="min-w-0 break-words">{value}</span>
          {badge}
        </div>
        <div className="flex items-center gap-1">
          {extraAction}
          {actionLabel && (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={open}
              className="min-h-9 px-2 text-xs font-semibold text-ai-blue transition hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-blue"
            >
              {open ? 'Close' : actionLabel}
            </button>
          )}
        </div>
      </div>
      {open && children && <div className="pb-5 sm:pl-[11rem]">{children}</div>}
      {message && <div className="pb-4 sm:pl-[11rem]">{message}</div>}
    </div>
  );
}

function RowActions({ onCancel, saveLabel = 'Save', busy = false }: { onCancel: () => void; saveLabel?: string; busy?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <button type="submit" disabled={busy} className={primaryButtonClass}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {saveLabel}
      </button>
      <button type="button" onClick={onCancel} className={secondaryButtonClass}>
        Cancel
      </button>
    </div>
  );
}

function CurrencyImpactNotice({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 border border-amber-300/15 bg-amber-300/[0.06] p-3 text-xs leading-5 text-amber-100/75">
      <input type="checkbox" required checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 accent-sky-400" />
      <span>Changing your currency also updates amounts on open build requests that don’t have a confirmed payment agreement yet.</span>
    </label>
  );
}

/* ======== ProfileRows ======== */

interface RowShell {
  open: boolean;
  onToggle: () => void;
  message?: ReactNode;
}

type SaveProfile = (patch: Partial<ProfileFormData>) => void;

/* ---------- Generic single-value text row (name, entity name, entity email, entity phone) ---------- */

interface TextFieldRowProps extends RowShell {
  id: string;
  label: string;
  value: string;
  /** What to show when the row is closed, if different from the raw value. */
  display?: string;
  emptyText?: string;
  type?: 'text' | 'email' | 'tel';
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  /** Fixed text shown inside the input, e.g. a dial code. */
  prefix?: string;
  onSave: (value: string) => void;
}

function TextFieldRow({
  id, label, value, display, emptyText = 'Not set', type = 'text', placeholder, maxLength, required, prefix,
  open, onToggle, message, onSave,
}: TextFieldRowProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = draft.trim();
    if (next === value.trim()) { onToggle(); return; }
    onSave(next);
  };

  return (
    <SettingsRow
      label={label}
      value={value ? (display ?? value) : <span className="text-white/40">{emptyText}</span>}
      actionLabel={value ? 'Edit' : 'Add'}
      open={open}
      onToggle={onToggle}
      message={message}
    >
      <form onSubmit={submit} className="max-w-md space-y-3">
        <div>
          <label htmlFor={id} className="sr-only">{label}</label>
          {prefix ? (
            <div className="flex min-h-11 items-center border border-white/[0.12] bg-[#11151c] px-3.5 transition focus-within:border-ai-blue focus-within:ring-2 focus-within:ring-ai-blue/20">
              <span className="shrink-0 pr-3 text-sm font-medium text-white/50">{prefix}</span>
              <input id={id} type={type} value={draft} maxLength={maxLength} required={required} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-white/30" />
            </div>
          ) : (
            <input id={id} type={type} value={draft} maxLength={maxLength} required={required} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} className={inputClass} />
          )}
        </div>
        <RowActions onCancel={onToggle} />
      </form>
    </SettingsRow>
  );
}

/* ---------- Account type ---------- */

function entityNameLabel(accountType: string) {
  if (accountType === 'agency') return 'Agency name';
  if (accountType === 'organization') return 'Organisation name';
  return 'Business name';
}

function AccountTypeRow({ profile, open, onToggle, message, onSave }: RowShell & { profile: ProfileFormData; onSave: SaveProfile }) {
  const [draftType, setDraftType] = useState(profile.accountType);
  const [draftEntityName, setDraftEntityName] = useState(profile.entityName);

  useEffect(() => {
    if (open) {
      setDraftType(profile.accountType);
      setDraftEntityName(profile.entityName);
    }
  }, [open, profile.accountType, profile.entityName]);

  const savedLabel = accountTypeOptions.find((o) => o.value === profile.accountType)?.label || profile.accountType;
  const hasEntityDetails = Boolean(profile.entityName || profile.entityContactEmail || profile.entityPhone);
  const clearsDetails = draftType === 'individual' && profile.accountType !== 'individual' && hasEntityDetails;
  const needsName = draftType !== 'individual' && !profile.entityName;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (draftType === profile.accountType) { onToggle(); return; }
    if (draftType === 'individual') {
      onSave({ accountType: draftType, entityName: '', entityContactEmail: '', entityPhone: '' });
    } else {
      onSave({ accountType: draftType, ...(needsName ? { entityName: draftEntityName.trim() } : {}) });
    }
  };

  return (
    <SettingsRow label="Account type" value={savedLabel} actionLabel="Edit" open={open} onToggle={onToggle} message={message}>
      <form onSubmit={submit} className="max-w-md space-y-3">
        <div>
          <label htmlFor="account-type" className={fieldLabelClass}>Account type</label>
          <select id="account-type" value={draftType} onChange={(e) => setDraftType(e.target.value)} className={inputClass}>
            {accountTypeOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#11151c] text-white">{option.label}</option>
            ))}
          </select>
        </div>
        {needsName && (
          <div>
            <label htmlFor="account-entity-name" className={fieldLabelClass}>{entityNameLabel(draftType)}</label>
            <input id="account-entity-name" required maxLength={160} value={draftEntityName} onChange={(e) => setDraftEntityName(e.target.value)} placeholder="Name of the entity" className={inputClass} />
          </div>
        )}
        {clearsDetails && (
          <FeedbackMessage tone="info">Switching to Individual removes your saved business contact details.</FeedbackMessage>
        )}
        <RowActions onCancel={onToggle} />
      </form>
    </SettingsRow>
  );
}

/* ---------- Country ---------- */

function CountryRow({ profile, open, onToggle, message, onSave }: RowShell & { profile: ProfileFormData; onSave: SaveProfile }) {
  const [draft, setDraft] = useState(profile.country);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (open) { setDraft(profile.country); setAcknowledged(false); }
  }, [open, profile.country]);

  const countryName = accountCountryOptions.find((o) => o.code === profile.country)?.name || profile.country;
  const nextCurrency = getDefaultCurrencyForCountry(draft);
  const currencyChanges = Boolean(nextCurrency) && nextCurrency !== profile.defaultCurrency;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (draft === profile.country) { onToggle(); return; }
    onSave({ country: draft, billingRegion: draft, defaultCurrency: nextCurrency || profile.defaultCurrency });
  };

  return (
    <SettingsRow label="Country" value={countryName} actionLabel="Edit" open={open} onToggle={onToggle} message={message}>
      <form onSubmit={submit} className="max-w-md space-y-3">
        <div>
          <label htmlFor="account-country" className={fieldLabelClass}>Country</label>
          <select id="account-country" value={draft} onChange={(e) => { setDraft(e.target.value); setAcknowledged(false); }} className={inputClass}>
            {accountCountryOptions.map((option) => (
              <option key={option.code} value={option.code} className="bg-[#11151c] text-white">{option.name}</option>
            ))}
          </select>
        </div>
        {currencyChanges && (
          <>
            <FeedbackMessage tone="info">Your currency will change from {profile.defaultCurrency} to {nextCurrency}.</FeedbackMessage>
            <CurrencyImpactNotice checked={acknowledged} onChange={setAcknowledged} />
          </>
        )}
        <RowActions onCancel={onToggle} />
      </form>
    </SettingsRow>
  );
}

/* ---------- Currency ---------- */

const PINNED_CURRENCIES = ['KES', 'USD', 'EUR', 'GBP'];

function buildCurrencyOptions(current: string) {
  const all = Array.from(new Set(accountCountryOptions.map((o) => o.currency)));
  if (current && !all.includes(current)) all.push(current);
  const pinned = PINNED_CURRENCIES.filter((c) => all.includes(c));
  const rest = all.filter((c) => !PINNED_CURRENCIES.includes(c)).sort();
  return { pinned, rest };
}

function CurrencyRow({ profile, open, onToggle, message, onSave }: RowShell & { profile: ProfileFormData; onSave: SaveProfile }) {
  const [draft, setDraft] = useState(profile.defaultCurrency);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (open) { setDraft(profile.defaultCurrency); setAcknowledged(false); }
  }, [open, profile.defaultCurrency]);

  const { pinned, rest } = buildCurrencyOptions(profile.defaultCurrency);
  const changed = draft !== profile.defaultCurrency;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!changed) { onToggle(); return; }
    onSave({ defaultCurrency: draft });
  };

  return (
    <SettingsRow label="Currency" value={profile.defaultCurrency} actionLabel="Edit" open={open} onToggle={onToggle} message={message}>
      <form onSubmit={submit} className="max-w-md space-y-3">
        <div>
          <label htmlFor="account-currency" className={fieldLabelClass}>Currency</label>
          <select id="account-currency" value={draft} onChange={(e) => { setDraft(e.target.value); setAcknowledged(false); }} className={inputClass}>
            <optgroup label="Common">
              {pinned.map((c) => <option key={c} value={c} className="bg-[#11151c] text-white">{c}</option>)}
            </optgroup>
            <optgroup label="All currencies">
              {rest.map((c) => <option key={c} value={c} className="bg-[#11151c] text-white">{c}</option>)}
            </optgroup>
          </select>
        </div>
        {changed && <CurrencyImpactNotice checked={acknowledged} onChange={setAcknowledged} />}
        <RowActions onCancel={onToggle} />
      </form>
    </SettingsRow>
  );
}

/* ======== EmailRow ======== */

interface EmailRowProps {
  user: ClientUser | null;
  open: boolean;
  onToggle: () => void;
  onUserChange: (user: ClientUser) => void;
}

function EmailRow({ user, open, onToggle, onUserChange }: EmailRowProps) {
  const [emailDraft, setEmailDraft] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    if (open) { setEmailDraft(''); setPassword(''); setError(''); }
  }, [open]);

  const base = (user ?? EMPTY_USER) as ClientUser;
  const pending = Boolean(user?.pendingEmail);
  const verified = Boolean(user?.isEmailVerified);

  const handleResend = async () => {
    setResendState('sending');
    try {
      const res = await apiClient.resendVerification(user?.email || '');
      setResendState(res.success ? 'sent' : 'error');
    } catch {
      setResendState('error');
    }
  };

  const handleRequestChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await apiClient.requestEmailChange(emailDraft.trim(), password);
      if (!res.success) { setError(res.message || 'Could not start the email change.'); return; }
      onUserChange({ ...base, pendingEmail: emailDraft.trim() } as ClientUser);
      setPassword('');
      onToggle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the email change.');
    } finally {
      setBusy(false);
    }
  };

  const handleCancelChange = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await apiClient.cancelEmailChange();
      if (!res.success) { setError(res.message || 'Could not cancel the pending email change.'); return; }
      onUserChange({ ...base, pendingEmail: '' } as ClientUser);
    } catch {
      setError('Could not cancel the pending email change.');
    } finally {
      setBusy(false);
    }
  };

  const resendLabel =
    resendState === 'sending' ? 'Sending…' : resendState === 'sent' ? 'Email sent' : resendState === 'error' ? 'Try again' : 'Resend verification';

  const footer =
    pending || error ? (
      <div className="max-w-xl space-y-3">
        {pending && (
          <>
            <FeedbackMessage tone="info">
              Confirmation is pending for <span className="font-semibold text-white">{user?.pendingEmail}</span>. We sent a link to that address. Your current email stays active until you confirm.
            </FeedbackMessage>
            <button type="button" disabled={busy} onClick={handleCancelChange} className={secondaryButtonClass}>
              <X className="h-3.5 w-3.5" />Cancel change
            </button>
          </>
        )}
        {error && <FeedbackMessage tone="error">{error}</FeedbackMessage>}
      </div>
    ) : undefined;

  return (
    <SettingsRow
      label="Email"
      value={user?.email || 'No email available'}
      badge={<StatusBadge status={pending ? 'pending' : verified ? 'verified' : 'unverified'} />}
      actionLabel={pending ? undefined : 'Change'}
      extraAction={
        !verified && !pending ? (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendState === 'sending' || resendState === 'sent'}
            className="min-h-9 px-2 text-xs font-semibold text-white/60 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-blue disabled:opacity-50"
          >
            {resendLabel}
          </button>
        ) : undefined
      }
      open={open}
      onToggle={onToggle}
      message={footer}
    >
      <form onSubmit={handleRequestChange} className="max-w-md space-y-3" autoComplete="off">
        <div>
          <label htmlFor="new-signin-email" className={fieldLabelClass}>New email</label>
          <input id="new-signin-email" name="new-signin-email" type="email" autoComplete="off" required value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} placeholder="name@company.com" className={inputClass} />
        </div>
        <div>
          <label htmlFor="email-change-password" className={fieldLabelClass}>Current password</label>
          <input id="email-change-password" name="email-change-password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </div>
        <p className="text-xs leading-5 text-white/45">We’ll send a link to the new address. Your current email stays active until you confirm.</p>
        <RowActions onCancel={onToggle} saveLabel={busy ? 'Sending…' : 'Send confirmation'} busy={busy} />
      </form>
    </SettingsRow>
  );
}

/* ======== PhoneRow ======== */

type Channel = 'sms' | 'whatsapp';
type Tone = 'success' | 'error' | 'info';

interface PhoneRowProps {
  user: ClientUser | null;
  open: boolean;
  onToggle: () => void;
  /** Called once the server confirms the number. The parent saves it and closes the row. */
  onVerified: (phone: string) => void;
}

function formatPhone(phone?: string | null) {
  if (!phone) return '';
  const compact = phone.replace(/\s+/g, '');
  const ke = compact.match(/^\+254(\d{3})(\d{3})(\d{3})$/);
  return ke ? `+254 ${ke[1]} ${ke[2]} ${ke[3]}` : phone;
}

const channelButtonClass =
  'flex min-h-11 items-center gap-2 border px-3.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-blue';

function PhoneRow({ user, open, onToggle, onVerified }: PhoneRowProps) {
  const [methods, setMethods] = useState<{ sms: boolean; whatsapp: boolean } | null>(null);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [methodsError, setMethodsError] = useState(false);
  const [draft, setDraft] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [waLink, setWaLink] = useState('');
  const [waWebLink, setWaWebLink] = useState('');
  const [busy, setBusy] = useState<Channel | 'verify' | 'cancel' | null>(null);
  const [note, setNote] = useState<{ text: string; tone: Tone } | null>(null);

  const onVerifiedRef = useRef(onVerified);
  onVerifiedRef.current = onVerified;

  const loadMethods = useCallback(async () => {
    setMethodsLoading(true);
    setMethodsError(false);
    try {
      const res = await apiClient.getVerificationMethods();
      if (!res.success) { setMethods(null); setMethodsError(true); return; }
      setMethods({ sms: res.sms, whatsapp: res.whatsapp });
    } catch {
      setMethods(null);
      setMethodsError(true);
    } finally {
      setMethodsLoading(false);
    }
  }, []);

  // Fresh start every time the row opens.
  useEffect(() => {
    if (!open) return;
    setDraft(user?.phone && !user.phoneVerified ? user.phone : '');
    setCode('');
    setCodeSent(false);
    setWaLink('');
    setWaWebLink('');
    setNote(null);
    if (!methods) void loadMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Watch for the WhatsApp message to arrive.
  useEffect(() => {
    if (!waLink) return;
    let active = true;
    const check = async () => {
      try {
        const status = await apiClient.getPhoneVerificationStatus();
        if (!active) return;
        if (status.verified && status.phone === draft.trim()) {
          active = false;
          setWaLink('');
          setWaWebLink('');
          setNote({ text: 'Your WhatsApp number is verified.', tone: 'success' });
          onVerifiedRef.current(status.phone || draft.trim());
          return;
        }
        if (status.expiresAt && Date.now() >= new Date(status.expiresAt).getTime()) {
          setWaLink('');
          setNote({ text: 'This verification request expired. Choose WhatsApp again to get a new one.', tone: 'error' });
        }
      } catch {
        /* A temporary connection issue is retried on the next poll. */
      }
    };
    void check();
    const timer = setInterval(() => { void check(); }, 3000);
    return () => { active = false; clearInterval(timer); };
  }, [waLink, draft]);

  const handleToggle = () => {
    if (open && waLink) void apiClient.cancelPhoneVerification().catch(() => undefined);
    onToggle();
  };

  const start = async (channel: Channel) => {
    const phone = draft.trim();
    if (!phone) { setNote({ text: 'Enter a phone number first.', tone: 'error' }); return; }
    if (methodsLoading) { setNote({ text: 'Checking which options are available…', tone: 'info' }); return; }
    if (!methods) { setNote({ text: 'Couldn’t check which verification options are available.', tone: 'error' }); return; }
    if (!methods[channel]) {
      const other = channel === 'sms' ? 'WhatsApp' : 'SMS';
      const otherOk = channel === 'sms' ? methods.whatsapp : methods.sms;
      setNote({
        text: otherOk
          ? `${channel === 'sms' ? 'SMS' : 'WhatsApp'} verification isn’t available right now. Use ${other} instead.`
          : 'Phone verification isn’t available right now. Try again later.',
        tone: 'info',
      });
      return;
    }

    setBusy(channel);
    setNote(null);
    try {
      const res = await apiClient.sendPhoneVerificationCode(phone, channel);
      if (!res.success) { setNote({ text: res.message || 'Could not start verification.', tone: 'error' }); return; }
      if (channel === 'whatsapp') {
        if (!res.whatsappLink) { setNote({ text: 'WhatsApp verification could not be prepared. Try again shortly.', tone: 'error' }); return; }
        setWaLink(res.whatsappLink);
        setWaWebLink(res.whatsappWebLink || res.whatsappLink);
      } else {
        setCodeSent(true);
        setNote({ text: res.message, tone: 'info' });
      }
    } catch (error) {
      setNote({ text: error instanceof Error ? error.message : 'Could not start verification.', tone: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy('verify');
    setNote(null);
    try {
      const res = await apiClient.verifyPhoneCode(code.trim());
      if (!res.success) { setNote({ text: res.message || 'The code could not be verified.', tone: 'error' }); return; }
      setCodeSent(false);
      setCode('');
      setNote({ text: res.message || 'Your phone number is verified.', tone: 'success' });
      onVerifiedRef.current(res.phone || draft.trim());
    } catch (error) {
      setNote({ text: error instanceof Error ? error.message : 'The code could not be verified.', tone: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const useDifferentNumber = async () => {
    setBusy('cancel');
    try {
      if (waLink) {
        const res = await apiClient.cancelPhoneVerification();
        if (!res.success) { setNote({ text: res.message || 'Could not cancel this verification request.', tone: 'error' }); return; }
      }
      setWaLink('');
      setWaWebLink('');
      setCodeSent(false);
      setCode('');
      setNote(null);
    } catch (error) {
      setNote({ text: error instanceof Error ? error.message : 'Could not cancel this verification request.', tone: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const hasPhone = Boolean(user?.phone);
  const verified = Boolean(user?.phoneVerified);
  const stage = waLink ? 'whatsapp' : codeSent ? 'sms' : 'choose';
  const smsOff = methods ? !methods.sms : false;
  const waOff = methods ? !methods.whatsapp : false;

  return (
    <SettingsRow
      label="Phone"
      value={hasPhone ? formatPhone(user?.phone) : <span className="text-white/40">Not added</span>}
      badge={waLink || codeSent ? <StatusBadge status="pending" /> : hasPhone ? <StatusBadge status={verified ? 'verified' : 'unverified'} /> : undefined}
      actionLabel={!hasPhone ? 'Add' : verified ? 'Change' : 'Verify'}
      open={open}
      onToggle={handleToggle}
      message={note ? <div className="max-w-xl"><FeedbackMessage tone={note.tone}>{note.text}</FeedbackMessage></div> : undefined}
    >
      <div className="max-w-xl space-y-4">
        {stage === 'choose' && (
          <>
            <div className="max-w-md">
              <label htmlFor="phone-number" className={fieldLabelClass}>{hasPhone && verified ? 'New phone number' : 'Phone number'}</label>
              <input id="phone-number" type="tel" autoComplete="tel" value={draft} onChange={(e) => { setDraft(e.target.value); setNote(null); }} placeholder="+254 712 345 678" className={inputClass} />
            </div>
            <div>
              <p className="mb-2 text-xs text-white/45">Verify with</p>
              <div className="grid max-w-md grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void start('sms')}
                  aria-disabled={smsOff}
                  className={`${channelButtonClass} ${smsOff ? 'border-white/10 text-white/35' : 'border-white/15 text-white hover:border-ai-blue/60 hover:bg-ai-blue/10'}`}
                >
                  {busy === 'sms' ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                  SMS
                  {smsOff && <span className="ml-auto text-[11px] font-medium text-white/40">Unavailable</span>}
                </button>
                <button
                  type="button"
                  onClick={() => void start('whatsapp')}
                  aria-disabled={waOff}
                  className={`${channelButtonClass} ${waOff ? 'border-white/10 text-white/35' : 'border-white/15 text-white hover:border-ai-blue/60 hover:bg-ai-blue/10'}`}
                >
                  {busy === 'whatsapp' ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                  WhatsApp
                  {waOff && <span className="ml-auto text-[11px] font-medium text-white/40">Unavailable</span>}
                </button>
              </div>
            </div>
            {methodsError && (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs text-amber-200/75">Couldn’t check which options are available.</p>
                <button type="button" onClick={() => void loadMethods()} className={secondaryButtonClass}>Retry</button>
              </div>
            )}
          </>
        )}

        {stage === 'sms' && (
          <form onSubmit={verifyCode} className="max-w-md space-y-3">
            <p className="text-sm text-white/70">Enter the 6-digit code we sent to <span className="font-medium text-white">{formatPhone(draft)}</span>.</p>
            <div>
              <label htmlFor="phone-code" className="sr-only">Six-digit verification code</label>
              <input id="phone-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" className={`${inputClass} w-40 tracking-[0.3em]`} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={busy === 'verify' || code.length !== 6} className={primaryButtonClass}>
                {busy === 'verify' && <Loader2 className="h-4 w-4 animate-spin" />}Verify number
              </button>
              <button type="button" disabled={busy !== null} onClick={() => void start('sms')} className={secondaryButtonClass}>Resend code</button>
              <button type="button" disabled={busy !== null} onClick={() => void useDifferentNumber()} className={secondaryButtonClass}>Use a different number</button>
            </div>
          </form>
        )}

        {stage === 'whatsapp' && (
          <div className="space-y-4 border border-white/[0.09] bg-black/15 p-4 sm:p-5">
            <div>
              <p className="text-sm font-semibold text-white">Send a verification message on WhatsApp</p>
              <p className="mt-1 text-xs leading-5 text-white/55">Send it from the WhatsApp account for {formatPhone(draft)} so we can confirm the right number.</p>
            </div>
            <div className="flex flex-col items-center gap-4 md:flex-row">
              <div className="hidden shrink-0 bg-white p-3 md:block">
                <QRCodeSVG value={waLink} size={160} level="M" marginSize={2} title="Scan to open the Sitemendr WhatsApp verification chat" />
              </div>
              <div className="w-full space-y-2">
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-2 bg-[#25D366] px-4 text-sm font-semibold text-[#07130b] transition hover:bg-[#41e77d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] md:hidden">
                  <MessageCircle className="h-4 w-4" />Open WhatsApp
                </a>
                <a href={waWebLink} target="_blank" rel="noopener noreferrer" className="hidden min-h-11 items-center justify-center gap-2 bg-[#25D366] px-4 text-sm font-semibold text-[#07130b] transition hover:bg-[#41e77d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] md:flex">
                  <MessageCircle className="h-4 w-4" />Open WhatsApp Web
                </a>
                <p className="text-center text-[11px] leading-5 text-white/45 md:hidden">WhatsApp opens with the message ready. Tap Send.</p>
                <p className="hidden text-[11px] leading-5 text-white/45 md:block">Scan the code with the phone that has this number, then tap Send. Or open WhatsApp Web if it’s already linked.</p>
                <div role="status" className="flex items-center gap-2 pt-1 text-xs text-white/60">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-ai-blue" />Waiting for your message…
                </div>
              </div>
            </div>
            <button type="button" disabled={busy !== null} onClick={() => void useDifferentNumber()} className="text-xs text-white/55 underline decoration-white/25 underline-offset-4 transition hover:text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-blue disabled:opacity-50">
              Use a different number
            </button>
          </div>
        )}
      </div>
    </SettingsRow>
  );
}

/* ======== PasswordRow ======== */

interface PasswordRowProps {
  open: boolean;
  onToggle: () => void;
  passwordData: UseClientDashboardReturn['passwordData'];
  setPasswordData: UseClientDashboardReturn['setPasswordData'];
  passwordMessage: UseClientDashboardReturn['passwordMessage'];
  onSubmit: UseClientDashboardReturn['handleChangePassword'];
}

function PasswordRow({ open, onToggle, passwordData, setPasswordData, passwordMessage, onSubmit }: PasswordRowProps) {
  const submitted = useRef(false);

  // Close the editor once a change we submitted has succeeded.
  useEffect(() => {
    if (submitted.current && passwordMessage.text) {
      submitted.current = false;
      if (passwordMessage.type === 'success' && open) onToggle();
    }
  }, [passwordMessage, open, onToggle]);

  const handleSubmit = (event: React.FormEvent) => {
    submitted.current = true;
    onSubmit(event as never);
  };

  return (
    <SettingsRow
      label="Password"
      value={<span className="tracking-[0.2em] text-white/70">••••••••</span>}
      actionLabel="Change"
      open={open}
      onToggle={onToggle}
      message={
        passwordMessage.text ? (
          <div className="max-w-xl">
            <FeedbackMessage tone={passwordMessage.type === 'success' ? 'success' : 'error'}>{passwordMessage.text}</FeedbackMessage>
          </div>
        ) : undefined
      }
    >
      <form onSubmit={handleSubmit} className="max-w-md space-y-3" autoComplete="off">
        <div>
          <label htmlFor="current-password" className={fieldLabelClass}>Current password</label>
          <input id="current-password" type="password" autoComplete="current-password" required value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label htmlFor="new-password" className={fieldLabelClass}>New password</label>
          <input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} placeholder="At least 8 characters" className={inputClass} />
        </div>
        <div>
          <label htmlFor="confirm-new-password" className={fieldLabelClass}>Confirm new password</label>
          <input id="confirm-new-password" type="password" autoComplete="new-password" minLength={8} required value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className={inputClass} />
        </div>
        <RowActions onCancel={onToggle} saveLabel="Change password" />
      </form>
    </SettingsRow>
  );
}

/* ======== BillingAddressRow ======== */

interface BillingAddressRowProps {
  profile: ProfileFormData;
  open: boolean;
  onToggle: () => void;
  message?: ReactNode;
  onSave: (patch: Partial<ProfileFormData>) => void;
}

const draftFrom = (p: ProfileFormData) => ({
  line1: p.billingAddressLine1 || '',
  line2: p.billingAddressLine2 || '',
  city: p.billingCity || '',
  postal: p.billingPostalCode || '',
  country: p.billingCountry || p.country,
});

function BillingAddressRow({ profile, open, onToggle, message, onSave }: BillingAddressRowProps) {
  const [draft, setDraft] = useState(draftFrom(profile));

  useEffect(() => {
    if (open) setDraft(draftFrom(profile));
  }, [open, profile]);

  const saved = draftFrom(profile);
  const lines = [saved.line1, saved.line2, [saved.city, saved.postal].filter(Boolean).join(' ')].filter(Boolean);
  const hasAddress = lines.length > 0;
  const countryName = accountCountryOptions.find((o) => o.code === saved.country)?.name || saved.country;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({
      billingAddressLine1: draft.line1.trim(),
      billingAddressLine2: draft.line2.trim(),
      billingCity: draft.city.trim(),
      billingPostalCode: draft.postal.trim(),
      billingCountry: draft.country,
    });
  };

  const set = (key: keyof typeof draft) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft((current) => ({ ...current, [key]: event.target.value }));

  return (
    <SettingsRow
      label="Billing address"
      value={
        hasAddress ? (
          <span className="block leading-6">
            {lines.map((line) => <span key={line} className="block">{line}</span>)}
            <span className="block text-white/60">{countryName}</span>
          </span>
        ) : (
          <span className="text-white/40">Not added</span>
        )
      }
      actionLabel={hasAddress ? 'Edit' : 'Add address'}
      open={open}
      onToggle={onToggle}
      message={message}
    >
      <form onSubmit={submit} className="grid max-w-xl gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="billing-address-1" className={fieldLabelClass}>Address line 1</label>
          <input id="billing-address-1" maxLength={180} value={draft.line1} onChange={set('line1')} placeholder="Street address" autoComplete="address-line1" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="billing-address-2" className={fieldLabelClass}>Address line 2 <span className="text-white/35">(optional)</span></label>
          <input id="billing-address-2" maxLength={180} value={draft.line2} onChange={set('line2')} placeholder="Apartment, suite, etc." autoComplete="address-line2" className={inputClass} />
        </div>
        <div>
          <label htmlFor="billing-city" className={fieldLabelClass}>City / town</label>
          <input id="billing-city" maxLength={100} value={draft.city} onChange={set('city')} autoComplete="address-level2" className={inputClass} />
        </div>
        <div>
          <label htmlFor="billing-postal" className={fieldLabelClass}>Postal code <span className="text-white/35">(optional)</span></label>
          <input id="billing-postal" maxLength={24} value={draft.postal} onChange={set('postal')} autoComplete="postal-code" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="billing-country" className={fieldLabelClass}>Country</label>
          <select id="billing-country" value={draft.country} onChange={set('country')} className={inputClass}>
            {accountCountryOptions.map((option) => (
              <option key={option.code} value={option.code} className="bg-[#11151c] text-white">{option.name}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <RowActions onCancel={onToggle} />
        </div>
      </form>
    </SettingsRow>
  );
}

/* ======== page ======== */

type RowKey =
  | 'name' | 'type' | 'entity-name' | 'entity-email' | 'entity-phone'
  | 'country' | 'currency' | 'email' | 'phone' | 'password' | 'billing';

export default function ClientSettings({ dashboard }: { dashboard: UseClientDashboardReturn }) {
  const {
    user, setUser, profileData, setProfileData, profileMessage, handleUpdateProfile,
    passwordData, setPasswordData, passwordMessage, handleChangePassword,
  } = dashboard;

  const [openRow, setOpenRow] = useState<RowKey | null>(null);
  const [savedRow, setSavedRow] = useState<RowKey | null>(null);
  const [saveRequested, setSaveRequested] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggle = (key: RowKey) => setOpenRow((current) => (current === key ? null : key));

  /* ---------- Keep the profile in sync with the server ---------- */

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
        setProfileData((current) => ({
          ...current,
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
    } catch { /* Keep the current values if a background refresh is unavailable. */ }
  }, [setProfileData, setUser]);

  useEffect(() => {
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
  }, [refreshAccountProfile]);

  const persistUser = useCallback((nextUser: ClientUser) => {
    localStorage.setItem('sitemendr_client_user', JSON.stringify(nextUser));
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
  }, [setUser]);

  /* ---------- Per-row profile saving ----------
     Rows hand back a patch. We merge it into profileData, then submit once the
     new state has rendered, so handleUpdateProfile sees the updated values. */

  const commitProfile = (key: RowKey, patch: Partial<ProfileFormData>) => {
    setSavedRow(key);
    setProfileData((current) => ({ ...current, ...patch }));
    setSaveRequested(true);
    setOpenRow(null);
  };

  useEffect(() => {
    if (!saveRequested) return;
    setSaveRequested(false);
    void (async () => {
      setSaving(true);
      try {
        await handleUpdateProfile({ preventDefault() { /* no-op */ } } as unknown as React.FormEvent);
      } finally {
        setSaving(false);
      }
    })();
  }, [saveRequested, handleUpdateProfile]);

  // If a save fails, roll the form back to what the server has.
  useEffect(() => {
    if (savedRow && profileMessage.text && profileMessage.type !== 'success') void refreshAccountProfile(true);
  }, [profileMessage, savedRow, refreshAccountProfile]);

  // Let success messages fade out of the row after a few seconds.
  useEffect(() => {
    if (!savedRow || saving || profileMessage.type !== 'success' || !profileMessage.text) return;
    const timer = setTimeout(() => setSavedRow(null), 4000);
    return () => clearTimeout(timer);
  }, [savedRow, saving, profileMessage]);

  const rowMessage = (key: RowKey) => {
    if (savedRow !== key) return undefined;
    if (saving) return <div className="max-w-xl"><FeedbackMessage tone="info">Saving…</FeedbackMessage></div>;
    if (!profileMessage.text) return undefined;
    return (
      <div className="max-w-xl">
        <FeedbackMessage tone={profileMessage.type === 'success' ? 'success' : 'error'}>{profileMessage.text}</FeedbackMessage>
      </div>
    );
  };

  const handlePhoneVerified = useCallback((phone: string) => {
    persistUser({ ...(user ?? EMPTY_USER), phone, phoneVerified: true } as ClientUser);
    setProfileData((current) => ({ ...current, phone }));
    setOpenRow(null);
  }, [persistUser, setProfileData, user]);

  /* ---------- Render ---------- */

  const isEntity = profileData.accountType !== 'individual';
  const dialCode = getDialCodeForCountry(profileData.country) || '+';
  const localEntityPhone = getLocalPhoneForCountry(profileData.entityPhone, profileData.country);

  return (
    <div className="max-w-3xl animate-fade-in space-y-6 pb-20 pt-2">
      <h1 className="sr-only">My account</h1>

      <SettingsSection title="My account" description="Your details and how you sign in.">
        <TextFieldRow
          id="account-name" label="Name" value={profileData.name} placeholder="Your name" required
          open={openRow === 'name'} onToggle={() => toggle('name')} message={rowMessage('name')}
          onSave={(name) => commitProfile('name', { name })}
        />

        <AccountTypeRow
          profile={profileData}
          open={openRow === 'type'} onToggle={() => toggle('type')} message={rowMessage('type')}
          onSave={(patch) => commitProfile('type', patch)}
        />

        {isEntity && (
          <>
            <TextFieldRow
              id="entity-name" label={entityNameLabel(profileData.accountType)} value={profileData.entityName} required maxLength={160}
              placeholder="Name of the entity" emptyText="Not added"
              open={openRow === 'entity-name'} onToggle={() => toggle('entity-name')} message={rowMessage('entity-name')}
              onSave={(entityName) => commitProfile('entity-name', { entityName })}
            />
            <TextFieldRow
              id="entity-email" label="Contact email" type="email" value={profileData.entityContactEmail} placeholder="team@company.com" emptyText="Not added"
              open={openRow === 'entity-email'} onToggle={() => toggle('entity-email')} message={rowMessage('entity-email')}
              onSave={(entityContactEmail) => commitProfile('entity-email', { entityContactEmail })}
            />
            <TextFieldRow
              id="entity-phone" label="Contact phone" type="tel" value={localEntityPhone} display={`${dialCode} ${localEntityPhone}`.trim()}
              prefix={dialCode} placeholder="712 345 678" emptyText="Not added"
              open={openRow === 'entity-phone'} onToggle={() => toggle('entity-phone')} message={rowMessage('entity-phone')}
              onSave={(entityPhone) => commitProfile('entity-phone', { entityPhone })}
            />
          </>
        )}

        <CountryRow
          profile={profileData}
          open={openRow === 'country'} onToggle={() => toggle('country')} message={rowMessage('country')}
          onSave={(patch) => commitProfile('country', patch)}
        />

        <CurrencyRow
          profile={profileData}
          open={openRow === 'currency'} onToggle={() => toggle('currency')} message={rowMessage('currency')}
          onSave={(patch) => commitProfile('currency', patch)}
        />

        <EmailRow user={user} open={openRow === 'email'} onToggle={() => toggle('email')} onUserChange={persistUser} />

        <PhoneRow user={user} open={openRow === 'phone'} onToggle={() => toggle('phone')} onVerified={handlePhoneVerified} />

        <PasswordRow
          open={openRow === 'password'} onToggle={() => toggle('password')}
          passwordData={passwordData} setPasswordData={setPasswordData}
          passwordMessage={passwordMessage} onSubmit={handleChangePassword}
        />
      </SettingsSection>

      <SettingsSection title="Invoice details" description="The address that appears on your invoices.">
        <BillingAddressRow
          profile={profileData}
          open={openRow === 'billing'} onToggle={() => toggle('billing')} message={rowMessage('billing')}
          onSave={(patch) => commitProfile('billing', patch)}
        />
      </SettingsSection>
    </div>
  );
}