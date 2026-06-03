import LegalPolicyPage from '@/components/LegalPolicyPage';

const sections = [
  {
    title: 'Information Sitemendr receives',
    body: 'Sitemendr receives information when a person visits the site, opens an account, creates a workspace, contacts the team, pays for a service, joins the community, or works with us on a project.',
    points: [
      'This may include name, email, phone number, company details, project notes, uploaded files, messages, billing references, support requests, and workspace activity.',
      'Technical information such as browser type, device information, IP address, session data, and page activity may also be collected to keep the platform reliable.',
    ],
  },
  {
    title: 'How the information is used',
    body: 'The information is used to operate accounts, understand requests, prepare service conversations, manage workspaces, process payments, provide support, maintain records, and improve Sitemendr pages and systems.',
    points: [
      'Project information is used to scope, deliver, repair, maintain, or support the work requested by the client.',
      'Community membership information is used to manage tier status, account benefits, updates, resources, and access paths.',
    ],
  },
  {
    title: 'Project and workspace privacy',
    body: 'Workspace content is treated as work context. Files, access notes, messages, decisions, billing details, and project records are not public portfolio material unless there is separate permission or an agreed public case-study format.',
  },
  {
    title: 'Payments and third-party services',
    body: 'Sitemendr may use payment processors, hosting providers, analytics tools, email systems, and infrastructure services to operate the platform. These services receive only the information needed for their role.',
    points: [
      'Payment card details are handled by the payment provider and are not stored directly as raw card data by Sitemendr.',
      'Analytics are used to understand site performance and visitor behavior at a practical level, not to sell personal data.',
    ],
  },
  {
    title: 'Access, correction, and deletion',
    body: 'A user may ask Sitemendr to review, correct, export, or delete personal information where the request is reasonable and allowed by operational, legal, payment, security, and recordkeeping obligations.',
  },
  {
    title: 'Retention',
    body: 'Sitemendr keeps information for as long as needed to provide services, maintain project history, meet payment and accounting needs, resolve disputes, protect the platform, and support active accounts.',
  },
];

export default function PrivacyPolicy() {
  return (
    <LegalPolicyPage
      title="Privacy Policy"
      lead="This policy explains how Sitemendr handles personal data, workspace records, project information, payment context, community membership data, and support communication."
      effectiveLabel="Last updated: May 24, 2026"
      contactLabel="Contact privacy"
      contactHref="mailto:privacy@sitemendr.com"
      sections={sections}
    />
  );
}
