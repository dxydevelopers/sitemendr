import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle, ArrowRight, ShoppingBag, Copy, Check, UserPlus } from "lucide-react";
import OrderStatusTracker from "../components/OrderStatusTracker";

export default function OrderSuccess() {
  const { state } = useLocation();
  const order = state?.order || null;
  const [copied, setCopied] = useState(false);

  const orderRef = order ? order._id.slice(-6).toUpperCase() : null;
  const isGuestOrder = order && !order.user;

  function copyRef() {
    navigator.clipboard.writeText(orderRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-mall-900 flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="max-w-md w-full mx-auto">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-emerald-400" />
        </div>

        {/* Heading */}
        <p className="font-mono-tag text-[10px] uppercase text-mall-orange tracking-widest mb-3">
          Azard Stores
        </p>
        <h1 className="font-display text-3xl sm:text-4xl text-cream mb-3 leading-tight">
          Order placed!
        </h1>
        <p className="text-cream/50 text-sm sm:text-base leading-relaxed mb-6">
          Thank you for shopping at Azard Stores. Your order is being processed.
        </p>

        {order && (
          <>
            {/* Order reference — save this, it's how you track the order later */}
            <button
              onClick={copyRef}
              className="inline-flex items-center gap-2 bg-mall-800 border border-cream/10 rounded-full px-4 py-2 mb-6 hover:border-cream/25 transition"
            >
              <span className="font-mono-tag text-[10px] uppercase text-cream/40 tracking-widest">Order #{orderRef}</span>
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-cream/30" />}
            </button>

            {/* Status tracker */}
            <div className="bg-mall-800 rounded-2xl p-5 mb-6 border border-cream/8">
              <OrderStatusTracker status={order.status || "pending"} />
            </div>
          </>
        )}

        {/* Divider */}
        <div className="border-t border-cream/10 mb-8" />

        {/* Trust signals — only claims what actually happens */}
        <div className="space-y-2 mb-8 text-left">
          {[
            "Your order has been received and is being processed",
            order?.paymentMethod === "cod"
              ? "Pay on delivery — no upfront payment required"
              : order?.paymentStatus === "paid"
                ? "Payment received — thank you!"
                : null,
            order?.deliveryAddress ? `Delivering to: ${order.deliveryAddress}` : null,
          ].filter(Boolean).map((line, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm text-cream/50">
              <CheckCircle size={13} className="text-emerald-400 shrink-0 mt-0.5" />
              {line}
            </div>
          ))}
        </div>

        {/* Guest account CTA — the whole point being: create an account and
            this exact order gets linked to it automatically, no re-entering info */}
        {isGuestOrder && (
          <Link
            to="/signup"
            state={{ claimOrderId: order._id, prefillName: order.guestInfo?.name }}
            className="flex items-center justify-center gap-2 bg-mall-accent/10 border border-mall-accent/30 text-mall-accent font-medium py-3.5 rounded-xl hover:bg-mall-accent/20 transition text-sm mb-3"
          >
            <UserPlus size={15} />
            Create an account to track this order
          </Link>
        )}

        {order && (
          <p className="text-cream/25 text-[11px] mb-6 leading-relaxed">
            Keep your order number — you can check its status anytime at{" "}
            <Link to={`/track-order/${order._id}`} className="text-mall-accent hover:underline">
              Track Order
            </Link>
            .
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/directory"
            className="flex-1 flex items-center justify-center gap-2 bg-mall-accent text-mall-900 font-semibold py-3.5 rounded-xl hover:bg-mall-accentDark transition text-sm"
          >
            <ShoppingBag size={15} />
            Continue Shopping
          </Link>
          <Link
            to={order?.user ? "/dashboard" : order ? `/track-order/${order._id}` : "/track-order"}
            className="flex-1 flex items-center justify-center gap-2 border border-cream/15 text-cream/60 hover:text-cream hover:border-cream/30 font-medium py-3.5 rounded-xl transition text-sm"
          >
            {order?.user ? "View My Orders" : "Track Order"} <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}