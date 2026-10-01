import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { XCircle } from "lucide-react";
import api from "../api/client";
import { useCart } from "../context/CartContext";

// Paystack redirects the browser back here after the customer finishes (or
// abandons) its hosted checkout page, with ?reference=... in the URL. This
// verifies the payment directly rather than waiting on the webhook, so the
// customer sees a result immediately instead of a blank wait.
export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [status, setStatus] = useState("checking"); // checking | success | failed

  useEffect(() => {
    const reference = searchParams.get("reference");
    if (!reference) { setStatus("failed"); return; }

    api.get(`/payments/paystack/verify/${reference}`).then((res) => {
      if (res.data.paymentStatus === "paid") {
        clearCart();
        navigate("/order-success", { state: { order: res.data.order }, replace: true });
      } else {
        setStatus("failed");
      }
    }).catch(() => setStatus("failed"));
  }, [searchParams]);

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-mall-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-mall-accent/30 border-t-mall-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cream/50 text-sm">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mall-900 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <XCircle size={40} className="text-red-400 mx-auto mb-4" />
        <p className="font-display text-xl text-cream mb-2">Payment not confirmed</p>
        <p className="text-cream/50 text-sm mb-6 leading-relaxed">
          We couldn't confirm this payment went through. If money left your account, it will be refunded automatically — otherwise, you can try again from your cart.
        </p>
        <Link to="/cart" className="inline-block bg-mall-accent text-mall-900 font-semibold px-6 py-3 rounded-xl text-sm hover:bg-mall-accentDark transition">
          Back to Cart
        </Link>
      </div>
    </div>
  );
}
