import LegalPolicyPage from '@/components/LegalPolicyPage';

const sections = [
  {
    title: 'How refund requests are reviewed',
    body: 'Refunds are reviewed according to the payment type, service status, work already completed, access already provided, third-party costs, and whether the request relates to a subscription, community membership, repair, maintenance, or custom project.',
  },
  {
    title: 'Custom development and project work',
    body: 'Payments for custom work may cover planning, design, development, technical diagnosis, meetings, integrations, handoff preparation, and delivery time. Work that has already been started, delivered, approved, or reserved may not be fully refundable.',
    points: [
      'If a project is cancelled before meaningful work begins, Sitemendr may review the unused portion of the payment.',
      'Completed milestones, approved deliverables, diagnostic work, and time already spent are generally not treated as unused work.',
    ],
  },
  {
    title: 'Repair, recovery, and maintenance',
    body: 'Repair and recovery work often begins with diagnosis. Diagnostic work, emergency response, stabilization, backups, monitoring, updates, and maintenance checks may be non-refundable once performed.',
  },
  {
    title: 'Subscriptions and community membership',
    body: 'Recurring subscriptions and community memberships can be cancelled according to the available account controls or by contacting Sitemendr. Access usually continues until the end of the paid period unless otherwise stated.',
    points: [
      'A community membership payment does not automatically convert into project credit unless Sitemendr agrees to that in writing.',
      'Discounts, perks, resources, events, and access already made available may affect refund eligibility.',
    ],
  },
  {
    title: 'Third-party and payment costs',
    body: 'Some payments may include processor fees, hosting costs, domain costs, plugin licenses, templates, subscriptions, or other third-party expenses. These costs may be deducted or excluded from any refund where they cannot be recovered.',
  },
  {
    title: 'Processing time',
    body: 'Approved refunds are returned through the original payment channel where possible. Processing time depends on the payment provider, bank, card network, and currency route.',
  },
];

export default function RefundPolicy() {
  return (
    <LegalPolicyPage
      title="Refund Policy"
      lead="This policy explains how Sitemendr reviews refunds, cancellations, unused work, subscriptions, community membership payments, and third-party costs."
      effectiveLabel="Effective: May 24, 2026"
      contactLabel="Contact billing"
      contactHref="mailto:billing@sitemendr.com"
      sections={sections}
    />
  );
}
