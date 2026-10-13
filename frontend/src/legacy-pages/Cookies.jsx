import LegalPage from "../components/LegalPage";

export default function Cookies() {
  return (
    <LegalPage
      title="Cookie Policy"
      updated="September 2026"
      intro="Azard Stores doesn't use cookies. Here's what we actually use to make the site work, and what we don't do."
      sections={[
        {
          heading: "What we use instead of cookies",
          body: "Rather than cookies, Azard Stores uses your browser's local storage to keep you logged in and remember what's in your cart between visits. This information stays on your own device and isn't shared with us until you take an action, like placing an order.",
        },
        {
          heading: "What we don't do",
          body: [
            "We don't use tracking or analytics cookies",
            "We don't use third-party advertising cookies",
            "We don't currently integrate any third-party payment processor that would set its own cookies — order and delivery details are arranged directly through checkout and WhatsApp",
          ],
        },
        {
          heading: "Managing local storage",
          body: "Most browsers let you clear local storage through their settings, the same way you'd clear cookies. Clearing it will log you out and empty your cart, since that's where this information is kept.",
        },
        {
          heading: "If this changes",
          body: "If Azard Stores starts using cookies or third-party tracking in the future — for example, if we integrate a payment processor that requires it — this page will be updated to reflect that before it happens.",
        },
        {
          heading: "Questions",
          body: "If you have questions about how your data is stored on Azard Stores, reach out via the Contact page.",
        },
      ]}
    />
  );
}
