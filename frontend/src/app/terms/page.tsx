import LegalPolicyPage from '@/components/LegalPolicyPage';

const sections = [
  {
    title: 'Using Sitemendr',
    body: 'Sitemendr provides public information, client accounts, private workspaces, service communication, community membership, and digital work connected to websites, applications, commerce, repair, and maintenance.',
    points: [
      'A visitor may read public pages without an account.',
      'A client or member may need an account to access workspace records, billing, support, resources, community benefits, or project delivery.',
    ],
  },
  {
    title: 'Accounts and responsibility',
    body: 'Users are responsible for keeping account credentials, contact information, workspace access, and payment details accurate and secure. Activity inside an account may be treated as activity by the account holder unless reported promptly.',
  },
  {
    title: 'Service scope and approvals',
    body: 'Custom work, repair work, maintenance, commerce setup, and workspace-related services depend on the scope, approvals, access, content, payment status, and information provided by the client.',
    points: [
      'Sitemendr may pause work when required access, content, payment, or approvals are missing.',
      'Changes outside an agreed scope may require a new estimate, timeline, or payment path.',
    ],
  },
  {
    title: 'Ownership and handoff',
    body: 'Ownership of custom work is handled according to the agreed service path. Where code, files, website access, or hosted delivery are part of the work, handoff depends on final payment, scope terms, third-party platform rules, and any agreed maintenance arrangement.',
  },
  {
    title: 'Community membership',
    body: 'Community membership is separate from client project delivery. Membership may provide learning resources, account benefits, updates, opportunities, events, access paths, or tier-based perks, but it does not automatically include custom project work.',
  },
  {
    title: 'Platform conduct',
    body: 'Users may not abuse Sitemendr systems, attempt unauthorized access, misuse workspace records, submit harmful files, interfere with other accounts, or use the platform for unlawful activity.',
  },
  {
    title: 'Limits and changes',
    body: 'Sitemendr may update pages, services, membership structures, dashboard features, pricing, and operational processes over time. Material changes may be reflected through updated pages, dashboard notices, or direct communication where appropriate.',
  },
];

export default function TermsOfService() {
  return (
    <LegalPolicyPage
      title="Terms Of Service"
      lead="These terms govern use of Sitemendr public pages, accounts, workspaces, services, payments, support, and community membership."
      effectiveLabel="Effective: May 24, 2026"
      contactLabel="Contact legal"
      contactHref="mailto:legal@sitemendr.com"
      sections={sections}
    />
  );
}
