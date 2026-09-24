import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, MessageCircle } from "lucide-react";

const FAQS = [
  {
    q: "How is Azard Stores different from a regular online store?",
    a: "Because you get more for less effort. Azard Stores brings together the best independent shops in one place — so instead of juggling ten different sites and ten different delivery fees, you browse, compare, and checkout everything in one cart, one delivery, done.",
  },
  {
    q: "Can I buy from more than one shop in a single order?",
    a: "Yes. Add products from different shops to your cart and check out once — no need to place separate orders per shop.",
  },
  {
    q: "How do I track my order?",
    a: "Once your order is placed, visit the Track My Order page or your dashboard to see its current status, from confirmation through to delivery.",
  },
  {
    q: "What payment methods are supported?",
    a: "We support the standard payment options available at checkout. If a method you expect isn't showing, reach out and we'll confirm what's currently supported in your region.",
  },
  {
    q: "How long does delivery take?",
    a: "Delivery times vary by shop and location. Check the Delivery Info page for general timelines, or the specific product page for shop-level estimates.",
  },
  {
    q: "Can I return or exchange a product?",
    a: "Yes, most items are eligible for return within the window outlined on our Returns & Refunds page. Some categories may have shop-specific policies, noted on the product page.",
  },
  {
    q: "Do I need an account to shop?",
    a: "No — you can browse, check out as a guest, and track your order without creating one. An account just makes it easier to see your full order history in one place across devices.",
  },
  {
    q: "Is Azard Stores available outside Kenya?",
    a: "Azard Stores currently operates out of Nairobi, Kenya, with delivery available across the regions our shops support. Reach out via Contact if you're unsure whether we deliver to you.",
  },
];

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div className="border-b border-cream/10">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="font-display text-cream text-base sm:text-lg group-hover:text-mall-accent transition">
          {item.q}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-mall-accent transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 pb-5" : "grid-rows-[0fr] opacity-0"}`}
        style={{ display: "grid" }}
      >
        <div className="overflow-hidden">
          <p className="text-cream/50 text-sm leading-relaxed pr-8">{item.a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="min-h-screen bg-mall-900 px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-2xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12 sm:mb-16">
          <p className="font-mono-tag text-[10px] uppercase text-mall-orange tracking-widest mb-3">
            Azard Stores
          </p>
          <h1 className="font-display text-3xl sm:text-5xl text-cream mb-4 leading-tight">
            Frequently asked questions
          </h1>
          <p className="text-cream/50 text-sm sm:text-base leading-relaxed">
            Everything you need to know before you start shopping.
          </p>
        </div>

        {/* Accordion */}
        <div className="bg-mall-800/40 border border-cream/10 rounded-2xl px-5 sm:px-6">
          {FAQS.map((item, i) => (
            <FAQItem
              key={item.q}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>

        {/* Still need help */}
        <div className="mt-10 sm:mt-14 flex flex-col sm:flex-row items-center justify-between gap-4 bg-mall-800/60 border border-cream/10 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mall-accent/10 flex items-center justify-center shrink-0">
              <MessageCircle size={18} className="text-mall-accent" />
            </div>
            <div>
              <p className="text-cream text-sm font-medium">Still have questions?</p>
              <p className="text-cream/50 text-xs">We're happy to help directly.</p>
            </div>
          </div>
          <Link
            to="/contact"
            className="shrink-0 bg-mall-accent text-mall-900 font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-mall-accentDark transition"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
