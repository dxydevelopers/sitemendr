import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Package, MapPin, User, Phone, Mail, ShieldAlert, Truck, Smartphone, CreditCard, XCircle } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import api from "../api/client";

export default function Cart() {
  const { items, updateQuantity, removeItem, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const { settings } = useSettings();
  const WHATSAPP_NUMBER = settings.whatsappNumber;
  const navigate = useNavigate();

  const [address, setAddress] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [caps, setCaps] = useState(null);
  // Tracks an in-progress M-Pesa STK push on the just-created order — "idle"
  // means no attempt is in flight; "waiting" starts the polling below.
  const [mpesaStatus, setMpesaStatus] = useState("idle");
  const [mpesaOrderId, setMpesaOrderId] = useState(null);

  // Mirrors the server-side calculation in routes/orders.js: this is a
  // preview only, so the checkout total matches what's shown before the
  // order is submitted — the real fee is still computed server-side.
  const freeDeliveryThreshold = settings.freeDeliveryThreshold || 0;
  const deliveryFee =
    freeDeliveryThreshold > 0 && totalAmount >= freeDeliveryThreshold
      ? 0
      : settings.deliveryFee || 0;
  const grandTotal = totalAmount + deliveryFee;

  useEffect(() => {
    api.get("/auth/verification-methods").then((res) => setCaps(res.data)).catch(() => {});
  }, []);

  // Polls the order's payment status every 3s while an M-Pesa STK push is
  // in flight. Stops on a definite result, or after ~90s (Safaricom's own
  // prompt expires around then too) — a callback that arrives after that
  // will still have correctly settled the order server-side, the customer
  // just won't see it reflected live here and can check "My Orders" instead.
  useEffect(() => {
    if (mpesaStatus !== "waiting" || !mpesaOrderId) return;
    let cancelled = false;
    let elapsed = 0;
    const interval = setInterval(async () => {
      elapsed += 3000;
      try {
        const res = await api.get(`/payments/mpesa/status/${mpesaOrderId}`);
        if (cancelled) return;
        if (res.data.paymentStatus === "paid") {
          clearInterval(interval);
          clearCart();
          navigate("/order-success", { state: { order: res.data.order } });
        } else if (res.data.paymentStatus === "failed") {
          clearInterval(interval);
          setMpesaStatus("failed");
        } else if (elapsed >= 90000) {
          clearInterval(interval);
          setMpesaStatus("timeout");
        }
      } catch {
        // transient network hiccup — just let the next poll try again
      }
    }, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [mpesaStatus, mpesaOrderId]);

  const phoneVerificationLive = Boolean(caps && (caps.sms || caps.whatsapp));
  const needsEmailVerification = Boolean(user && !user.isEmailVerified);
  const needsPhoneVerification = Boolean(user && phoneVerificationLive && !user.isPhoneVerified);
  const blockedByVerification = needsEmailVerification || needsPhoneVerification;

  async function handleCheckout() {
    setError("");
    if (blockedByVerification) return;
    if (!address.trim()) { setError("Please enter a delivery address"); return; }
    if (!user && (!guestName.trim() || !guestPhone.trim())) { setError("Please enter your name and phone number"); return; }
    if (paymentMethod === "paystack" && !user && !guestEmail.trim()) {
      setError("Please enter an email address for card payment");
      return;
    }
    setPlacing(true);
    try {
      const res = await api.post("/orders", {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, variantId: i.variantId || undefined })),
        channel: "cart",
        deliveryAddress: address,
        paymentMethod,
        guestInfo: user ? undefined : { name: guestName, phone: guestPhone, email: guestEmail || undefined },
      });
      const order = res.data;

      if (paymentMethod === "cod") {
        clearCart();
        navigate("/order-success", { state: { order } });
        return;
      }

      if (paymentMethod === "mpesa") {
        await api.post("/payments/mpesa/initiate", { orderId: order._id });
        // Cart stays intact until payment actually confirms — a failed or
        // abandoned attempt shouldn't cost the customer their cart.
        setMpesaOrderId(order._id);
        setMpesaStatus("waiting");
        return;
      }

      if (paymentMethod === "paystack") {
        const payRes = await api.post("/payments/paystack/initialize", { orderId: order._id });
        window.location.href = payRes.data.authorizationUrl; // hands off to Paystack's hosted checkout
        return;
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  function retryPayment() {
    setMpesaStatus("idle");
    setMpesaOrderId(null);
  }

  // WhatsApp order — build message from cart items
  const whatsappMsg = encodeURIComponent(
    `Hi! I'd like to order the following from Azard Stores:\n\n` +
    items.map((i) => `• ${i.name}${i.variantName ? ` (${i.variantName})` : ""} x${i.quantity} — KSh ${(i.price * i.quantity).toLocaleString()}`).join("\n") +
    `\n\nSubtotal: KSh ${totalAmount.toLocaleString()}` +
    (deliveryFee > 0 ? `\nDelivery: KSh ${deliveryFee.toLocaleString()}` : "") +
    `\nTotal: KSh ${grandTotal.toLocaleString()}\nDelivery to: ${address || "[address not yet provided]"}`
  );

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-mall-900 flex flex-col items-center justify-center px-4 text-center gap-4">
        <ShoppingBag size={48} className="text-cream/15" />
        <p className="font-display text-2xl text-cream/40">Your cart is empty</p>
        <p className="text-cream/30 text-sm">Add some products to get started.</p>
        <Link to="/directory" className="mt-2 inline-flex items-center gap-2 text-mall-accent hover:underline text-sm">
          Browse the mall <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mall-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Header */}
        <div className="mb-8 pb-6 border-b border-cream/10">
          <p className="font-mono-tag text-[10px] uppercase text-mall-orange tracking-widest mb-1">Azard Stores</p>
          <h1 className="font-display text-3xl sm:text-4xl text-cream">Your Cart</h1>
          <p className="text-cream/40 text-sm mt-1">{items.length} {items.length === 1 ? "item" : "items"}</p>
        </div>

        <div className="grid md:grid-cols-[1fr_340px] gap-8 lg:gap-12 items-start">

          {/* ── Cart items ───────────────────────────────────────── */}
          <div>
            <div className="space-y-0 divide-y divide-cream/8">
              {items.map((item) => (
                <div key={`${item.productId}::${item.variantId || ""}`} className="flex items-start gap-4 py-5">
                  {/* Image */}
                  <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-mall-800">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={20} className="text-cream/20" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-cream text-sm sm:text-base font-medium leading-tight mb-0.5 line-clamp-2">
                      {item.name}
                    </p>
                    {item.variantName && (
                      <p className="text-cream/40 text-xs mt-0.5">{item.variantName}</p>
                    )}
                    <p className="font-display text-mall-accent text-base sm:text-lg">
                      KSh {item.price.toLocaleString()}
                    </p>
                    <p className="text-cream/30 text-xs mt-0.5">
                      Subtotal: KSh {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>

                  {/* Quantity + remove */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1), item.variantId)}
                        className="w-7 h-7 rounded-full border border-cream/20 flex items-center justify-center text-cream/60 hover:border-cream hover:text-cream transition"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-cream text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                        className="w-7 h-7 rounded-full border border-cream/20 flex items-center justify-center text-cream/60 hover:border-cream hover:text-cream transition"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="flex items-center gap-1 text-cream/25 hover:text-red-400 transition text-xs"
                    >
                      <Trash2 size={11} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue shopping */}
            <div className="pt-4 border-t border-cream/8">
              <Link to="/directory" className="text-cream/30 hover:text-mall-accent transition text-xs flex items-center gap-1">
                ← Continue browsing the mall
              </Link>
            </div>
          </div>

          {/* ── Checkout panel ───────────────────────────────────── */}
          <div className="bg-mall-800 rounded-2xl p-5 sm:p-6 border border-cream/8 sticky top-6">
            <p className="font-mono-tag text-[10px] uppercase text-mall-orange tracking-widest mb-5">Order Summary</p>

            {/* Order total */}
            <div className="mb-5 pb-5 border-b border-cream/10 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-cream/60 text-sm">Subtotal ({items.length} items)</span>
                <span className="text-cream text-sm">KSh {totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-cream/60 text-sm">Delivery</span>
                <span className="text-cream text-sm">
                  {deliveryFee > 0 ? `KSh ${deliveryFee.toLocaleString()}` : "Free"}
                </span>
              </div>
              {freeDeliveryThreshold > 0 && deliveryFee > 0 && (
                <p className="text-mall-accent/70 text-[10px]">
                  Free delivery on orders over KSh {freeDeliveryThreshold.toLocaleString()}
                </p>
              )}
              <div className="flex items-baseline justify-between pt-2">
                <span className="text-cream/60 text-sm">Total</span>
                <span className="font-display text-2xl text-cream">KSh {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Guest info */}
            {!user && (
              <div className="space-y-3 mb-5">
                <p className="font-mono-tag text-[9px] uppercase text-cream/30 tracking-widest">Your Details</p>
                <div className="flex items-center gap-2.5 bg-mall-700 rounded-xl px-3 py-2.5">
                  <User size={14} className="text-cream/30 shrink-0" />
                  <input
                    type="text"
                    placeholder="Your name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="flex-1 bg-transparent text-cream placeholder-cream/25 text-sm outline-none"
                  />
                </div>
                <div className="flex items-center gap-2.5 bg-mall-700 rounded-xl px-3 py-2.5">
                  <Phone size={14} className="text-cream/30 shrink-0" />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="flex-1 bg-transparent text-cream placeholder-cream/25 text-sm outline-none"
                  />
                </div>
                <div className="flex items-center gap-2.5 bg-mall-700 rounded-xl px-3 py-2.5">
                  <Mail size={14} className="text-cream/30 shrink-0" />
                  <input
                    type="email"
                    placeholder={paymentMethod === "paystack" ? "Email (required for card payment)" : "Email (optional)"}
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="flex-1 bg-transparent text-cream placeholder-cream/25 text-sm outline-none"
                  />
                </div>
              </div>
            )}

            {/* Delivery address */}
            <div className="mb-5">
              <p className="font-mono-tag text-[9px] uppercase text-cream/30 tracking-widest mb-2">Delivery Address</p>
              <div className="flex items-start gap-2.5 bg-mall-700 rounded-xl px-3 py-2.5">
                <MapPin size={14} className="text-cream/30 shrink-0 mt-0.5" />
                <textarea
                  placeholder="Enter your delivery address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="flex-1 bg-transparent text-cream placeholder-cream/25 text-sm outline-none resize-none"
                />
              </div>
            </div>

            {/* Payment method */}
            <div className="mb-5">
              <p className="font-mono-tag text-[9px] uppercase text-cream/30 tracking-widest mb-2">Payment Method</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition ${
                    paymentMethod === "cod" ? "bg-mall-accent text-mall-900 border-mall-accent font-semibold" : "border-cream/15 text-cream/60 hover:border-cream/30"
                  }`}
                >
                  <Truck size={15} /> Cash on Delivery
                </button>
                {settings.paymentMethods?.mpesa && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("mpesa")}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition ${
                      paymentMethod === "mpesa" ? "bg-mall-accent text-mall-900 border-mall-accent font-semibold" : "border-cream/15 text-cream/60 hover:border-cream/30"
                    }`}
                  >
                    <Smartphone size={15} /> M-Pesa
                  </button>
                )}
                {settings.paymentMethods?.paystack && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("paystack")}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition ${
                      paymentMethod === "paystack" ? "bg-mall-accent text-mall-900 border-mall-accent font-semibold" : "border-cream/15 text-cream/60 hover:border-cream/30"
                    }`}
                  >
                    <CreditCard size={15} /> Card
                  </button>
                )}
              </div>
            </div>

            {/* Verification required */}
            {blockedByVerification && (
              <div className="flex items-start gap-2.5 bg-mall-accent/10 border border-mall-accent/20 rounded-xl px-3.5 py-3 mb-5">
                <ShieldAlert size={15} className="text-mall-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-mall-accent text-xs font-medium mb-1">
                    Verify your {needsEmailVerification && needsPhoneVerification ? "email and phone" : needsEmailVerification ? "email" : "phone"} to check out
                  </p>
                  <Link to="/dashboard#settings" className="text-mall-accent/80 hover:text-mall-accent text-xs underline">
                    Go to Settings
                  </Link>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-red-400 text-xs mb-4 leading-relaxed">{error}</p>
            )}

            {mpesaStatus === "waiting" ? (
              <div className="bg-mall-700 rounded-xl px-4 py-6 text-center mb-3">
                <div className="w-8 h-8 border-2 border-mall-accent/30 border-t-mall-accent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-cream text-sm font-medium mb-1">Check your phone</p>
                <p className="text-cream/50 text-xs leading-relaxed">
                  Enter your M-Pesa PIN to complete payment of KSh {grandTotal.toLocaleString()}
                </p>
              </div>
            ) : mpesaStatus === "failed" || mpesaStatus === "timeout" ? (
              <div className="bg-mall-700 rounded-xl px-4 py-5 mb-3">
                <div className="flex items-start gap-2.5 mb-3">
                  <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-cream/70 text-sm leading-relaxed">
                    {mpesaStatus === "timeout"
                      ? "This is taking longer than expected. If you completed the payment, it may still go through — check My Orders shortly."
                      : "Payment didn't go through. You can try again."}
                  </p>
                </div>
                <button
                  onClick={retryPayment}
                  className="w-full bg-mall-accent text-mall-900 font-semibold py-2.5 rounded-lg text-sm hover:bg-mall-accentDark transition"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                {/* Place order button */}
                <button
                  onClick={handleCheckout}
                  disabled={placing || blockedByVerification}
                  className="w-full flex items-center justify-center gap-2 bg-mall-accent text-mall-900 font-semibold py-3.5 rounded-xl hover:bg-mall-accentDark transition disabled:opacity-50 mb-3 text-sm"
                >
                  {paymentMethod === "paystack" ? <CreditCard size={15} /> : paymentMethod === "mpesa" ? <Smartphone size={15} /> : <ShoppingBag size={15} />}
                  {placing ? "Placing order..." : paymentMethod === "cod" ? "Place Order" : `Pay KSh ${grandTotal.toLocaleString()}`}
                </button>

                {/* WhatsApp order alternative */}
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366]/15 text-[#25D366] font-semibold py-3.5 rounded-xl hover:bg-[#25D366] hover:text-white transition text-sm"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.127 1.532 5.86L.057 23.857l6.174-1.448A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.001-1.366l-.36-.214-3.664.86.876-3.565-.233-.375A9.818 9.818 0 1112 21.818z"/>
                  </svg>
                  Order via WhatsApp
                </a>

                <p className="text-cream/20 text-[10px] text-center mt-3 leading-relaxed">
                  {paymentMethod === "cod" ? "Pay on delivery" : paymentMethod === "mpesa" ? "Pay via M-Pesa" : "Pay by card"} · Fast dispatch · 7-day returns
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}