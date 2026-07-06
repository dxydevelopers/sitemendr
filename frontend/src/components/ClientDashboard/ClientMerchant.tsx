// components/client-dashboard/ClientMerchant.tsx
//
// The "business" tab. This is intentionally thin: it's a launcher into
// three already-existing shared components (EcommerceManager,
// BookingManager, AddonMarketplace live in components/dashboard/ and
// are rendered directly by the shell when those specific tabs are
// active). This file is just the landing/summary card grid.

'use client';

import { ShoppingBag, Clock, Plus, CreditCard, ChevronRight } from 'lucide-react';
import type { BookingItem, BillingItem } from './types';

interface ClientMerchantProps {
  bookings: BookingItem[];
  billing: BillingItem[];
  onOpenTab: (tab: string) => void;
}

export default function ClientMerchant({ bookings, billing, onOpenTab }: ClientMerchantProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="max-w-3xl space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-ai-blue/70">Business tools</p>
        <h1 className="text-3xl font-black tracking-tight text-white lg:text-5xl">Commerce and service operations.</h1>
        <p className="text-sm leading-7 text-white/56">Products, orders, bookings, and add-ons stay grouped here so the sidebar stays calm.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Commerce', count: 'Products and orders', icon: <ShoppingBag className="w-5 h-5" />, tab: 'ecommerce' },
          { title: 'Bookings', count: `${bookings.length} booking${bookings.length === 1 ? '' : 's'}`, icon: <Clock className="w-5 h-5" />, tab: 'booking' },
          { title: 'Add-ons', count: 'Workspace upgrades', icon: <Plus className="w-5 h-5" />, tab: 'addons' },
          { title: 'Billing', count: `${billing.length} billing item${billing.length === 1 ? '' : 's'}`, icon: <CreditCard className="w-5 h-5" />, tab: 'billing' },
        ].map(item => (
          <button key={item.title} type="button" onClick={() => onOpenTab(item.tab)} className="group border border-white/8 bg-white/[0.025] p-6 text-left transition hover:border-white/18 hover:bg-white/[0.045]">
            <div className="mb-10 flex items-center justify-between text-ai-blue">
              {item.icon}
              <ChevronRight className="w-4 h-4 text-white/22 transition group-hover:translate-x-1 group-hover:text-white" />
            </div>
            <h2 className="text-lg font-black tracking-tight text-white">{item.title}</h2>
            <p className="mt-2 text-xs text-white/44">{item.count}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
