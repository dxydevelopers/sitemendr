import LegalPolicyPage from '@/components/LegalPolicyPage';

const sections = [
  {
    title: 'What cookies do on Sitemendr',
    body: 'Cookies and similar browser storage help Sitemendr keep sessions working, remember practical preferences, protect accounts, understand page performance, and support a stable workspace experience.',
  },
  {
    title: 'Essential cookies',
    body: 'Essential cookies support login sessions, account security, form behavior, payment flow continuity, workspace access, and basic platform operation. Disabling them may prevent parts of Sitemendr from working correctly.',
  },
  {
    title: 'Preferences and workspace behavior',
    body: 'Preference storage may remember interface choices, account context, dashboard state, form progress, or other settings that make the site and workspace easier to use across visits.',
  },
  {
    title: 'Analytics and performance',
    body: 'Analytics tools may help Sitemendr understand traffic, page performance, content usefulness, device behavior, and errors. This helps improve public pages, service paths, and workspace reliability.',
    points: [
      'Analytics data is used to improve Sitemendr operations and user experience.',
      'Sitemendr does not use cookies to sell personal data.',
    ],
  },
  {
    title: 'Third-party tools',
    body: 'Some cookies may come from services used for payments, analytics, embedded media, security, communication, or infrastructure. Those providers may process cookie data according to their own policies.',
  },
  {
    title: 'Managing cookies',
    body: 'Users can manage cookies through browser settings. Blocking non-essential cookies may reduce analytics or preference behavior. Blocking essential cookies may affect login, checkout, workspace access, or form submission.',
  },
];

export default function CookiePolicy() {
  return (
    <LegalPolicyPage
      title="Cookie Policy"
      lead="This policy explains how Sitemendr uses cookies and browser storage across public pages, accounts, checkout, workspaces, analytics, and community membership."
      effectiveLabel="Last updated: May 24, 2026"
      contactLabel="Contact privacy"
      contactHref="mailto:privacy@sitemendr.com"
      sections={sections}
    />
  );
}
