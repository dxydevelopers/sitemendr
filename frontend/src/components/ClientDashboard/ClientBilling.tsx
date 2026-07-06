// components/client-dashboard/ClientBilling.tsx
//
// The "billing" tab. BillingViewer already exists in components/dashboard/
// and does all the real rendering - this file just wires up the callbacks
// that used to be inline in the old ClientDashboard.tsx.

'use client';

import dynamic from 'next/dynamic';
import type { BillingItem, ClientProject } from './types';

const BillingViewer = dynamic(() => import('../dashboard/BillingViewer'), { ssr: false });

interface ClientBillingProps {
  billing: BillingItem[];
  projects: ClientProject[];
}

export default function ClientBilling({ billing, projects }: ClientBillingProps) {
  return (
    <div className="animate-fade-in">
      <BillingViewer
        billing={billing}
        subscriptions={projects}
        onManageSubscription={() => { window.location.href = '/payment'; }}
        onDownloadReceipt={() => alert('Receipt download coming soon. Contact billing@sitemendr.com for invoices.')}
        onUpdatePaymentMethod={() => { window.location.href = '/payment'; }}
        onChangeBillingEmail={() => alert('Please contact support@sitemendr.com to change your billing email.')}
        onRequestAudit={() => alert('Billing audit request submitted. Our team will contact you within 24 hours.')}
      />
    </div>
  );
}
