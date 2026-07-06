// components/client-dashboard/ClientSettings.tsx
'use client';

import { Mail, Check, TriangleAlert } from 'lucide-react';
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
    user, profileData, setProfileData, profileMessage, handleUpdateProfile,
    passwordData, setPasswordData, passwordMessage, handleChangePassword,
  } = dashboard;

  return (
    <div className="max-w-6xl animate-fade-in pb-20 pt-2">
      <div className="mb-8 border-b border-white/10 pb-5">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Mail className="h-4 w-4 shrink-0 text-white/38" />
          <p className="min-w-0 break-all text-base font-black text-white">{user?.email}</p>
          <span className={`inline-flex w-fit items-center gap-1.5 text-xs font-black ${user?.isEmailVerified ? 'text-expert-green' : 'text-amber-300'}`}>
            {user?.isEmailVerified ? <Check className="h-3.5 w-3.5" /> : <TriangleAlert className="h-3.5 w-3.5" />}
            {user?.isEmailVerified ? 'Verified' : 'Not verified'}
          </span>
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

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section>
          <form onSubmit={handleUpdateProfile} className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-white/60">Name</label>
              <input type="text" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none transition focus:border-ai-blue" placeholder="Your name" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-white/60">Phone</label>
                <span className={`text-xs font-black ${profileData.phone ? (user?.phoneVerified ? 'text-expert-green' : 'text-amber-300') : 'text-white/28'}`}>
                  {profileData.phone ? (user?.phoneVerified ? 'Verified' : 'Not verified') : 'Not added'}
                </span>
              </div>
              <div className="flex border-b border-white/14 transition focus-within:border-ai-blue">
                <span className="shrink-0 py-3 pr-3 text-sm font-semibold text-white/38">{getDialCodeForCountry(profileData.country) || '+'}</span>
                <input type="tel" value={getLocalPhoneForCountry(profileData.phone, profileData.country)}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none" placeholder="Add phone number" />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-semibold text-white/60">Country</label>
              <select value={profileData.country} onChange={(e) => {
                const country = e.target.value;
                setProfileData({ ...profileData, country, billingRegion: country, defaultCurrency: getDefaultCurrencyForCountry(country) });
              }} className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none transition focus:border-ai-blue">
                {accountCountryOptions.map(option => <option key={option.code} value={option.code} className="bg-black text-white">{option.name}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-semibold text-white/60">Currency</label>
              <select value={profileData.defaultCurrency} onChange={(e) => setProfileData({ ...profileData, defaultCurrency: e.target.value })}
                className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none transition focus:border-ai-blue">
                {Array.from(new Set(accountCountryOptions.map(o => o.currency))).map(currency => <option key={currency} value={currency} className="bg-black text-white">{currency}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-semibold text-white/60">Account type</label>
              <select value={profileData.accountType} onChange={(e) => setProfileData({ ...profileData, accountType: e.target.value })}
                className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none transition focus:border-ai-blue">
                {accountTypeOptions.map(option => <option key={option.value} value={option.value} className="bg-black text-white">{option.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 pt-3">
              <button type="submit" className="min-h-11 bg-ai-blue px-5 text-sm font-black text-white transition hover:bg-white hover:text-black">Save changes</button>
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
              <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none transition focus:border-ai-blue" placeholder="Current password" />
              <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none transition focus:border-ai-blue" placeholder="New password" />
              <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full border-b border-white/14 bg-transparent px-0 py-3 text-sm text-white outline-none transition focus:border-ai-blue" placeholder="Confirm new password" />
            </div>
            <button type="submit" className="min-h-11 border border-white/16 px-5 text-sm font-black text-white transition hover:border-white/34 hover:bg-white/8">Change password</button>
          </form>
        </section>
      </div>
    </div>
  );
}
