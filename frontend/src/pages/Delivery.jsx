import LegalPage from "../components/LegalPage";

export default function Delivery() {
  return (
    <LegalPage
      title="Delivery Info"
      updated="September 2026"
      intro="Because Azard Stores hosts many independent shops, delivery timelines can vary slightly by shop and location — here's what to expect."
      sections={[
        {
          heading: "Delivery areas",
          body: "We currently deliver across Nairobi and surrounding areas, with wider coverage expanding regularly. You'll see accurate delivery availability for your address at checkout.",
        },
        {
          heading: "Estimated timelines",
          body: [
            "Nairobi and immediate surroundings: 1–3 business days",
            "Other regions within Kenya: 3–7 business days",
            "Exact estimates are shown at checkout based on your delivery address and the shop fulfilling your order",
          ],
        },
        {
          heading: "Delivery fees",
          body: "Delivery costs depend on your location, order size, and the shop fulfilling it. The final fee is always shown before you confirm your order — nothing is added afterward.",
        },
        {
          heading: "Tracking your order",
          body: "Once your order ships, you can follow its progress from the Track My Order page or directly in your dashboard under My Orders.",
        },
        {
          heading: "Buying from multiple shops",
          body: "You can add products from different shops to one cart and check out once — one order, one delivery fee, one confirmation. Your order may include items sourced from more than one shop within the mall.",
        },
        {
          heading: "Missed or delayed deliveries",
          body: "If a delivery is running late or you're not available at the scheduled time, contact us and we'll help coordinate a redelivery or pickup option.",
        },
      ]}
    />
  );
}
