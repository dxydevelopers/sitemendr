import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { ShoppingBag, ChevronRight, Clock, CheckCircle, Truck, XCircle, Package, Download } from "lucide-react";
import api from "../../api/client";
import AdminPagination from "../../components/AdminPagination";
import { downloadCsv } from "../../utils/downloadCsv";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const STATUS_CONFIG = {
  pending:   { label: "Pending",   icon: Clock,        color: "text-mall-accent",   bg: "bg-mall-accent/10"  },
  confirmed: { label: "Confirmed", icon: CheckCircle,  color: "text-blue-400",    bg: "bg-blue-400/10"   },
  shipped:   { label: "Shipped",   icon: Truck,        color: "text-purple-400",  bg: "bg-purple-400/10" },
  delivered: { label: "Delivered", icon: CheckCircle,  color: "text-emerald-400", bg: "bg-emerald-400/10"},
  cancelled: { label: "Cancelled", icon: XCircle,      color: "text-red-400",     bg: "bg-red-400/10"    },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState(null);

  function load() {
    setLoading(true);
    api.get("/orders", { params: { status: filterStatus || undefined, search: search || undefined, page, limit: 20 } })
      .then((res) => {
        setOrders(res.data.orders);
        setTotal(res.data.total);
        setPages(res.data.pages);
      })
      .finally(() => setLoading(false));
  }
  useEffect(load, [filterStatus, search, page]);

  // Reflects status changes made from another admin session in real time,
  // so this list doesn't go stale without a manual refresh.
  useEffect(() => {
    const socket = io("/", { path: "/socket.io" });
    socket.on("order-status-updated", ({ id, status, paymentStatus }) => {
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status, ...(paymentStatus ? { paymentStatus } : {}) } : o)));
    });
    return () => socket.disconnect();
  }, []);

  async function updateStatus(id, status) {
    setUpdating(id);
    try {
      await api.put(`/orders/${id}/status`, { status });
      setOrders((prev) => prev.map((o) => o._id === id ? { ...o, status } : o));
    } finally {
      setUpdating(null);
    }
  }

  async function markPaid(id) {
    setUpdating(id);
    try {
      await api.put(`/orders/${id}/payment-status`, { paymentStatus: "paid" });
      setOrders((prev) => prev.map((o) => o._id === id ? { ...o, paymentStatus: "paid" } : o));
    } finally {
      setUpdating(null);
    }
  }

  function setStatusFilter(status) {
    setFilterStatus(status);
    setPage(1);
  }

  const filtered = orders;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-cream/10">
        <div>
          <p className="font-mono-tag text-[10px] uppercase text-mall-orange tracking-widest mb-0.5">Admin</p>
          <h1 className="font-display text-2xl text-cream">Orders</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => downloadCsv(api, "/orders/export", "orders-export.csv")}
            className="flex items-center gap-1.5 border border-cream/15 text-cream/70 font-semibold text-xs px-4 py-2.5 rounded-xl hover:text-cream hover:border-cream/30 transition">
            <Download size={13} /> Export CSV
          </button>
          <p className="font-mono-tag text-[10px] uppercase text-cream/30 tracking-widest">{total} total</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by customer name..."
          className="w-full sm:w-72 bg-mall-800 border border-cream/10 rounded-xl px-3 py-2.5 text-cream text-sm placeholder-cream/20 outline-none focus:border-mall-accent transition"
        />
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6" style={{ scrollbarWidth: "none" }}>
        <button
          onClick={() => setStatusFilter("")}
          className={`shrink-0 font-mono-tag text-[9px] uppercase px-3 py-1.5 rounded-full border transition ${
            !filterStatus ? "bg-mall-accent text-mall-900 border-mall-accent" : "border-cream/15 text-cream/50 hover:text-cream"
          }`}
        >
          All
        </button>
        {STATUSES.map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 font-mono-tag text-[9px] uppercase px-3 py-1.5 rounded-full border transition ${
                filterStatus === s ? `${cfg.bg} ${cfg.color} border-current` : "border-cream/15 text-cream/50 hover:text-cream"
              }`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-mall-accent/30 border-t-mall-accent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <ShoppingBag size={32} className="text-cream/15 mx-auto mb-3" />
          <p className="text-cream/30 text-sm">No orders found.</p>
        </div>
      ) : (
        <div className="divide-y divide-cream/8">
          {filtered.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            const isOpen = expanded === order._id;

            return (
              <div key={order._id} className="py-5">
                {/* Order header row */}
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => setExpanded(isOpen ? null : order._id)}
                    className="flex-1 flex items-start justify-between gap-3 text-left min-w-0"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono-tag text-[10px] uppercase text-cream/40 tracking-widest">
                          #{order._id.slice(-6).toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center gap-1 font-mono-tag text-[9px] uppercase px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                          <StatusIcon size={9} /> {cfg.label}
                        </span>
                        <span className="font-mono-tag text-[9px] uppercase text-cream/25">{order.channel}</span>
                        <span className={`font-mono-tag text-[9px] uppercase px-2 py-0.5 rounded-full ${
                          order.paymentStatus === "paid" ? "bg-emerald-500/10 text-emerald-400"
                          : order.paymentStatus === "failed" ? "bg-red-500/10 text-red-400"
                          : "bg-cream/5 text-cream/40"
                        }`}>
                          {order.paymentMethod === "mpesa" ? "M-Pesa" : order.paymentMethod === "paystack" ? "Card" : "COD"} · {order.paymentStatus}
                        </span>
                      </div>
                      <p className="text-cream text-sm font-medium">
                        {order.user ? order.user.name : order.guestInfo?.name || "Guest"}
                      </p>
                      <p className="text-cream/40 text-xs">
                        {order.user?.email || order.guestInfo?.phone || "—"}
                        {" · "}{new Date(order.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display text-lg text-cream">KSh {order.totalAmount?.toLocaleString()}</p>
                      <p className="text-cream/30 text-xs">{order.items?.length} item{order.items?.length !== 1 ? "s" : ""}</p>
                      <ChevronRight size={13} className={`text-cream/20 ml-auto mt-1 transition ${isOpen ? "rotate-90" : ""}`} />
                    </div>
                  </button>

                  {/* Status update dropdown */}
                  <select
                    value={order.status}
                    disabled={updating === order._id}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    className="shrink-0 bg-mall-800 border border-cream/10 rounded-lg px-2 py-1.5 text-cream text-xs outline-none focus:border-mall-accent transition disabled:opacity-50"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                  </select>
                </div>

                {/* Expanded order details */}
                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-cream/8 space-y-3">
                    {order.paymentStatus !== "paid" && (
                      <button
                        onClick={() => markPaid(order._id)}
                        disabled={updating === order._id}
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition disabled:opacity-50"
                      >
                        Mark as Paid
                      </button>
                    )}
                    {order.paymentReference && (
                      <p className="text-cream/30 text-[11px]">Payment ref: {order.paymentReference}</p>
                    )}
                    {order.items?.map((item, i) => (
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
                        <p className="text-cream/70 text-sm shrink-0">
                          KSh {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                    {order.deliveryAddress && (
                      <div className="pt-3 border-t border-cream/8">
                        <p className="font-mono-tag text-[9px] uppercase text-cream/30 tracking-widest mb-1">Delivery Address</p>
                        <p className="text-cream/50 text-xs">{order.deliveryAddress}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <AdminPagination page={page} pages={pages} onChange={setPage} />
    </div>
  );
}