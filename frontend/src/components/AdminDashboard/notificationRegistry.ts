import { Bell, ShieldAlert, Globe2, Clock3, type LucideIcon } from 'lucide-react';

export type NotificationStatus = 'active' | 'paused' | 'removed';

export interface NotificationRule {
  id: string;
  name: string;
  purpose: string;
  recipient: string;
  channels: string[];
  trigger: string;
  status: NotificationStatus;
  icon: LucideIcon;
}

export const notificationRules: NotificationRule[] = [
  {
    id: 'overdue-subscription',
    name: 'Overdue Subscription',
    purpose: 'Warn the account owner and admin when a subscription is behind on payment.',
    recipient: 'Admin + account owner',
    channels: ['In-app', 'Email'],
    trigger: 'Subscription crosses grace period',
    status: 'active',
    icon: Bell,
  },
  {
    id: 'suspension-applied',
    name: 'Suspension Applied',
    purpose: 'Confirm that access has been suspended after enforcement runs.',
    recipient: 'Admin + affected client',
    channels: ['In-app', 'Email'],
    trigger: 'Suspension watchdog executes',
    status: 'active',
    icon: ShieldAlert,
  },
  {
    id: 'dns-verification-failed',
    name: 'DNS Verification Failed',
    purpose: 'Alert the admin when custom domain records fail validation.',
    recipient: 'Admin only',
    channels: ['In-app', 'Email'],
    trigger: 'DNS verify worker fails',
    status: 'active',
    icon: Globe2,
  },
  {
    id: 'grace-period-ending',
    name: 'Grace Period Ending',
    purpose: 'Give the admin and owner a final warning before enforcement.',
    recipient: 'Admin + account owner',
    channels: ['In-app'],
    trigger: 'Grace period reaches final day',
    status: 'paused',
    icon: Clock3,
  },
];
