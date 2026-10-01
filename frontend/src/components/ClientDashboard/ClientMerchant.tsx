// components/client-dashboard/ClientMerchant.tsx
//
// The "business" tab. This is intentionally thin: it's a landing list into
// three already-existing shared components (EcommerceManager, BookingManager,
// AddonMarketplace live in components/dashboard/ and are rendered directly
// by the shell when those specific tabs are active).
//
// Billing intentionally does NOT live here — it moved under Settings, so it
// has exactly one entry point (Settings -> Billing), not two.

'use client';

import { ShoppingBag, Clock, Plus } from 'lucide-react';
import { DrillList } from '@/components/ui/DrillShell';
import type { BookingItem } from './ClientDashboard_types';

interface ClientMerchantProps {
  bookings: BookingItem[];
  onOpenTab: (tab: string) => void;
}

export default function ClientMerchant({ bookings, onOpenTab }: ClientMerchantProps) {
  return (
    <div className="w-full min-w-0 animate-fade-in">
      <DrillList
        items={[
          { id: 'ecommerce', icon: <ShoppingBag className="h-4 w-4" />, label: 'Commerce', meta: 'Products and orders' },
          { id: 'booking', icon: <Clock className="h-4 w-4" />, label: 'Bookings', meta: `${bookings.length} booking${bookings.length === 1 ? '' : 's'}` },
          { id: 'addons', icon: <Plus className="h-4 w-4" />, label: 'Add-ons', meta: 'Workspace upgrades' },
        ]}
        onSelect={onOpenTab}
      />
    </div>
  );
}
