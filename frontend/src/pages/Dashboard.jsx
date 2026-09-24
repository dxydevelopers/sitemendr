import { useEffect, useState } from "react";
import { Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingBag, Heart, Settings, Package, ChevronRight,
  CheckCircle, Clock, Truck, XCircle, LogOut, User, Phone, Mail, Lock, Eye, EyeOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../api/client";
import StripProductCard from "../components/StripProductCard";
import VerificationCenter from "../components/VerificationCenter";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  pending:   { label: "Pending",   icon: Clock,         color: "text-mall-accent",  bg: "bg-mall-accent/10" },
  confirmed: { label: "Confirmed", icon: CheckCircle,   color: "text-blue-400",   bg: "bg-blue-400/10"  },
  shipped:   { label: "Shipped",   icon: Truck,         color: "text-purple-400", bg: "bg-purple-400/10"},
  delivered: { label: "Delivered", icon: CheckCircle,   color: "text-emerald-400",bg: "bg-emerald-400/10"},
  cancelled: { label: "Cancelled", icon: XCircle,       color: "text-red-400",    bg: "bg-red-400/10"   },
};

// ─── Tab nav ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: "orders",   label: "My Orders",  icon: ShoppingBag },
  { id: "wishlist", label: "Wishlist",   icon: Heart       },
  { id: "settings", label: "Settings",  icon: Settings    },
];

// ─── Orders tab ───────────────────────────────────────────────────────────────
function OrdersTab({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get("/orders/my").then((res) => setOrders(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-mall-accent/30 border-t-mall-accent rounded-full animate-spin" />
    </div>
  );

  if (orders.length === 0) return (
    <div className="py-20 text-center">
      <Package size={40} className="text-cream/15 mx-auto mb-3" />
      <p className="font-display text-xl text-cream/30 mb-2">No orders yet</p>
      <p className="text-cream/20 text-sm mb-6">Start shopping to see your orders here.</p>
      <Link to="/directory" className="inline-flex items-center gap-2 text-mall-accent hover:underline text-sm">
        Browse the mall <ChevronRight size={13} />
      </Link>
    </div>
  );

  return (
    <div className="space-y-0 divide-y divide-cream/8">
      {orders.map((order) => {
        const status = STATUS[order.status] || STATUS.pending;
        const StatusIcon = status.icon;
        const isOpen = expanded === order._id;

        return (
          <div key={order._id} className="py-5">
            <button
              onClick={() => setExpanded(isOpen ? null : order._id)}
              className="w-full flex items-start justify-between gap-4 text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono-tag text-[10px] uppercase text-cream/40 tracking-widest">
                    Order #{order._id.slice(-6).toUpperCase()}
                  </span>
                  <span className={`inline-flex items-center gap-1 font-mono-tag text-[9px] uppercase px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                    <StatusIcon size={9} />
                    {status.label}
                  </span>
                </div>
                <p className="text-cream/40 text-xs">
                  {new Date(order.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  {" · "}{order.items.length} item{order.items.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display text-lg text-cream">KSh {order.totalAmount.toLocaleString()}</p>
                <ChevronRight size={14} className={`text-cream/30 ml-auto mt-1 transition ${isOpen ? "rotate-90" : ""}`} />
              </div>
            </button>

            {/* Expanded items */}
            {isOpen && (
              <div className="mt-4 pt-4 border-t border-cream/8 space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-mall-800 overflow-hidden shrink-0">
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
                    <p className="text-cream/70 text-sm shrink-0">KSh {(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
                {Boolean(order.deliveryFee) && (
                  <div className="flex items-center justify-between pt-3 border-t border-cream/8 text-xs">
                    <span className="text-cream/40">Delivery fee</span>
                    <span className="text-cream/70">KSh {order.deliveryFee.toLocaleString()}</span>
                  </div>
                )}
                {order.deliveryAddress && (
                  <div className="pt-3 border-t border-cream/8">
                    <p className="font-mono-tag text-[9px] uppercase text-cream/30 tracking-widest mb-1">Delivery to</p>
                    <p className="text-cream/50 text-xs">{order.deliveryAddress}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Wishlist tab ─────────────────────────────────────────────────────────────
function WishlistTab() {
  // Wishlist stored in localStorage for now
  const [wishlist, setWishlist] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("azard_wishlist") || "[]");
      setWishlist(saved);
      if (saved.length === 0) { setLoading(false); return; }
      // Fetch each product
      Promise.all(saved.map((slug) => api.get(`/products/${slug}`).then((r) => r.data).catch(() => null)))
        .then((results) => setProducts(results.filter(Boolean)))
        .finally(() => setLoading(false));
    } catch {
      setLoading(false);
    }
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-mall-accent/30 border-t-mall-accent rounded-full animate-spin" />
    </div>
  );

  if (products.length === 0) return (
    <div className="py-20 text-center">
      <Heart size={40} className="text-cream/15 mx-auto mb-3" />
      <p className="font-display text-xl text-cream/30 mb-2">Nothing saved yet</p>
      <p className="text-cream/20 text-sm mb-6">Tap the heart on any product to save it here.</p>
      <Link to="/directory" className="inline-flex items-center gap-2 text-mall-accent hover:underline text-sm">
        Browse the mall <ChevronRight size={13} />
      </Link>
    </div>
  );

  return (
    <div>
      <p className="font-mono-tag text-[10px] uppercase text-cream/30 tracking-widest mb-5">
        {products.length} saved item{products.length !== 1 ? "s" : ""}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {products.map((p) => <StripProductCard key={p._id} product={p} />)}
      </div>
    </div>
  );
}

// ─── Settings tab ─────────────────────────────────────────────────────────────
function SettingsTab({ user }) {
  const { logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileError("");
    if (!name.trim()) { setProfileError("Name is required"); return; }
    setSaving(true);
    try {
      await api.put("/auth/me", { name, phone });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setProfileError(err.response?.data?.message || "Could not save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError("");
    if (!currentPw || !newPw) { setPwError("Please fill in both fields"); return; }
    if (newPw.length < 6) { setPwError("New password must be at least 6 characters"); return; }
    setPwSaving(true);
    try {
      await api.put("/auth/change-password", { currentPassword: currentPw, newPassword: newPw });
      setCurrentPw(""); setNewPw("");
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err) {
      setPwError(err.response?.data?.message || "Could not change password");
    } finally {
      setPwSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  const inputClass = "flex-1 bg-transparent text-cream placeholder-cream/20 text-sm outline-none";
  const rowClass = "flex items-center gap-2 border-b border-cream/15 pb-2 focus-within:border-mall-accent transition mb-5";

  return (
    <div className="max-w-md space-y-10">

      {/* Profile */}
      <div>
        <p className="font-mono-tag text-[10px] uppercase text-mall-orange tracking-widest mb-5">Profile</p>
        <form onSubmit={handleSaveProfile}>
          {/* Name */}
          <label className="font-mono-tag text-[10px] uppercase text-cream/40 tracking-widest block mb-2">Full Name</label>
          <div className={rowClass}>
            <User size={14} className="text-cream/30 shrink-0" />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputClass} />
          </div>

          {/* Email — read only */}
          <label className="font-mono-tag text-[10px] uppercase text-cream/40 tracking-widest block mb-2">Email</label>
          <div className={`${rowClass} opacity-50`}>
            <Mail size={14} className="text-cream/30 shrink-0" />
            <input value={user.email} readOnly className={`${inputClass} cursor-not-allowed`} />
          </div>
          <p className="text-cream/25 text-[10px] -mt-3 mb-5">Email cannot be changed</p>

          {/* Phone */}
          <label className="font-mono-tag text-[10px] uppercase text-cream/40 tracking-widest block mb-2">Phone Number</label>
          <div className={rowClass}>
            <Phone size={14} className="text-cream/30 shrink-0" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254..." className={inputClass} />
          </div>

          {profileError && <p className="text-red-400 text-xs mb-3">{profileError}</p>}

          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-mall-accent text-mall-900 font-semibold py-2.5 px-5 rounded-xl hover:bg-mall-accentDark transition disabled:opacity-50 text-sm">
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Divider */}
      <div className="border-t border-cream/10" />

      {/* Verification */}
      <VerificationCenter />

      {/* Divider */}
      <div className="border-t border-cream/10" />

      {/* Change password */}
      <div>
        <p className="font-mono-tag text-[10px] uppercase text-mall-orange tracking-widest mb-5">Change Password</p>
        <form onSubmit={handleChangePassword}>
          <label className="font-mono-tag text-[10px] uppercase text-cream/40 tracking-widest block mb-2">Current Password</label>
          <div className={rowClass}>
            <Lock size={14} className="text-cream/30 shrink-0" />
            <input type={showCurrent ? "text" : "password"} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="Current password" className={inputClass} />
            <button type="button" onClick={() => setShowCurrent((s) => !s)} className="text-cream/30 hover:text-cream transition shrink-0">
              {showCurrent ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>

          <label className="font-mono-tag text-[10px] uppercase text-cream/40 tracking-widest block mb-2">New Password</label>
          <div className={rowClass}>
            <Lock size={14} className="text-cream/30 shrink-0" />
            <input type={showNew ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min. 6 characters" className={inputClass} />
            <button type="button" onClick={() => setShowNew((s) => !s)} className="text-cream/30 hover:text-cream transition shrink-0">
              {showNew ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>

          {pwError && <p className="text-red-400 text-xs mb-3">{pwError}</p>}

          <button type="submit" disabled={pwSaving}
            className="flex items-center gap-2 border border-cream/15 text-cream/70 hover:text-cream hover:border-cream/30 font-medium py-2.5 px-5 rounded-xl transition text-sm">
            {pwSaving ? "Updating..." : pwSaved ? "Password updated ✓" : "Update Password"}
          </button>
        </form>
      </div>

      {/* Divider */}
      <div className="border-t border-cream/10" />

      {/* Logout */}
      <div>
        <p className="font-mono-tag text-[10px] uppercase text-cream/30 tracking-widest mb-4">Account</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 transition text-sm font-medium"
        >
          <LogOut size={14} /> Log out of Azard Stores
        </button>
      </div>
    </div>
  );
}

// ─── Main account page ────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL hash or default to orders
  const hash = location.hash.replace("#", "") || "orders";
  const activeTab = TABS.find((t) => t.id === hash)?.id || "orders";

  function setTab(id) {
    navigate(`/dashboard#${id}`, { replace: true });
  }

  if (authLoading) return (
    <div className="min-h-screen bg-mall-900 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-mall-accent/30 border-t-mall-accent rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  const ActiveIcon = TABS.find((t) => t.id === activeTab)?.icon || ShoppingBag;

  return (
    <div className="min-h-screen bg-mall-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Header */}
        <div className="mb-8 pb-6 border-b border-cream/10">
          <p className="font-mono-tag text-[10px] uppercase text-mall-orange tracking-widest mb-1">My Account</p>
          <h1 className="font-display text-3xl sm:text-4xl text-cream">Hi, {user.name?.split(" ")[0]}</h1>
          <p className="text-cream/40 text-sm mt-1">{user.email}</p>
        </div>

        <div className="grid md:grid-cols-[200px_1fr] gap-8 lg:gap-12 items-start">

          {/* ── Sidebar — desktop ──────────────────────────────────── */}
          <div className="hidden md:block">
            <nav className="space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition text-left ${
                      active ? "bg-mall-accent/10 text-mall-accent" : "text-cream/50 hover:text-cream hover:bg-cream/5"
                    }`}
                  >
                    <Icon size={15} className="shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* ── Tab pills — mobile ─────────────────────────────────── */}
          <div className="md:hidden mb-6 -mx-4 px-4">
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTab(tab.id)}
                    className={`shrink-0 flex items-center gap-1.5 font-mono-tag text-[10px] uppercase px-3 py-2 rounded-full border transition ${
                      active ? "bg-mall-accent text-mall-900 border-mall-accent font-semibold" : "bg-mall-800 text-cream/50 border-cream/10"
                    }`}
                  >
                    <Icon size={11} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Content ────────────────────────────────────────────── */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-cream/10">
              <ActiveIcon size={16} className="text-mall-accent shrink-0" />
              <h2 className="font-display text-xl text-cream">
                {TABS.find((t) => t.id === activeTab)?.label}
              </h2>
            </div>

            {activeTab === "orders"   && <OrdersTab user={user} />}
            {activeTab === "wishlist" && <WishlistTab />}
            {activeTab === "settings" && <SettingsTab user={user} />}
          </div>
        </div>
      </div>
    </div>
  );
}