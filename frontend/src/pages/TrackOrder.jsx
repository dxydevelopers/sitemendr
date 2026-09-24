import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Search, Package, AlertCircle, ArrowRight, MapPin } from "lucide-react";
import api from "../api/client";
import OrderStatusTracker from "../components/OrderStatusTracker";

export default function TrackOrder() {
  const { id: idFromUrl } = useParams();
  const [orderId, setOrderId] = useState(idFromUrl || "");
  const [contact, setContact] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!orderId.trim() || !contact.trim()) {
      setError("Enter your order number and the phone or email used for it");
      return;
    }
    setLoading(true);
    setOrder(null);
    try {
      const res = await api.get(`/orders/${orderId.trim()}/track`, { params: { contact: contact.trim() } });
      setOrder(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't find that order — double check the details and try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-mall-900">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10 sm:py-16">

        {/* Header */}
        <div className="text-center mb-8">
          <p className="font-mono-tag text-[10px] uppercase text-mall-orange tracking-widest mb-2">Azard Stores</p>
          <h1 className="font-display text-3xl sm:text-4xl text-cream mb-2">Track your order</h1>
          <p className="text-cream/40 text-sm">
            Enter your order number and the phone or email you used at checkout.
          </p>
        </div>

        {/* Lookup form */}
        <form onSubmit={handleSubmit} className="bg-mall-800 rounded-2xl p-5 sm:p-6 border border-cream/8 mb-6">
          <div className="mb-4">
            <label className="font-mono-tag text-[9px] uppercase text-cream/30 tracking-widest block mb-2">Order Number</label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. 68a1f2..."
              className="w-full bg-mall-700 rounded-xl px-3.5 py-3 text-cream placeholder-cream/25 text-sm outline-none focus:ring-1 focus:ring-mall-accent transition"
            />
          </div>
          <div className="mb-5">
            <label className="font-mono-tag text-[9px] uppercase text-cream/30 tracking-widest block mb-2">Phone or Email</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="The one you used at checkout"
              className="w-full bg-mall-700 rounded-xl px-3.5 py-3 text-cream placeholder-cream/25 text-sm outline-none focus:ring-1 focus:ring-mall-accent transition"
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 text-red-400 text-xs mb-4">
              <AlertCircle size={13} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-mall-accent text-mall-900 font-semibold py-3.5 rounded-xl hover:bg-mall-accentDark transition disabled:opacity-50 text-sm"
          >
            <Search size={15} />
            {loading ? "Looking up..." : "Track Order"}
          </button>
        </form>

        {/* Result */}
        {order && (
          <div className="bg-mall-800 rounded-2xl p-5 sm:p-6 border border-cream/8">
            <div className="flex items-center justify-between mb-5 pb-5 border-b border-cream/10">
              <span className="font-mono-tag text-[10px] uppercase text-cream/40 tracking-widest">
                Order #{order._id.slice(-6).toUpperCase()}
              </span>
              <span className="font-display text-lg text-cream">KSh {order.totalAmount?.toLocaleString()}</span>
            </div>

            <div className="mb-5">
              <OrderStatusTracker status={order.status} />
            </div>

            {/* Items */}
            <div className="space-y-3 mb-5 pt-5 border-t border-cream/8">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-mall-700 overflow-hidden shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={12} className="text-cream/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-cream text-sm line-clamp-1">{item.name}</p>
                    {item.variantName && <p className="text-cream/30 text-[11px]">{item.variantName}</p>}
                    <p className="text-cream/40 text-xs">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-cream/70 text-sm shrink-0">
                    KSh {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {order.deliveryAddress && (
              <div className="flex items-start gap-2.5 pt-4 border-t border-cream/8 text-sm text-cream/50">
                <MapPin size={14} className="text-mall-accent shrink-0 mt-0.5" />
                {order.deliveryAddress}
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-8">
          <Link to="/directory" className="inline-flex items-center gap-1.5 text-cream/30 hover:text-mall-accent transition text-sm">
            Continue browsing the mall <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}