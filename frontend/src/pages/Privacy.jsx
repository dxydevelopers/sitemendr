import LegalPage from "../components/LegalPage";

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="September 2026"
      intro="This explains what information Azard Stores collects, how it's used, and the choices you have around it."
      sections={[
        {
          heading: "Information we collect",
          body: [
            "Account details you provide — name, email, phone number, delivery addresses",
            "Order history and payment confirmation details (we do not store full card numbers)",
            "Basic usage data — pages visited, searches made, device and browser type",
          ],
        },
        {
          heading: "How we use your information",
          body: [
            "To process and deliver your orders",
            "To communicate order updates, account activity, and support requests",
            "To improve the mall experience, including search relevance and recommendations",
          ],
        },
        {
          heading: "Sharing with shops",
          body: "When you place an order, the shop fulfilling it receives the information necessary to prepare and deliver your order — such as your name, address, and order contents. Shops do not receive your full account details or payment information.",
        },
        {
          heading: "Data security",
          body: "We use industry-standard measures to protect your data, including encrypted connections and restricted access to personal information within our systems.",
        },
        {
          heading: "Your choices",
          body: [
            "You can update your account details from Account Settings at any time",
            "You can request a copy or deletion of your data by contacting us directly",
          ],
        },
        {
          heading: "Questions about this policy",
          body: "If anything here is unclear, or you'd like to exercise any of the choices above, reach out via the Contact page.",
        },
      ]}
    />
  );
}
