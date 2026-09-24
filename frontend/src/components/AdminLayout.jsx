import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Layers, Store, Package, ShoppingBag, LogOut, ChevronRight, Tag, Award, Users, Settings, BarChart3, Sparkles, Home,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const LINKS = [
  { to: "/admin",          label: "Overview",  icon: LayoutDashboard, end: true },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/homepage", label: "Homepage",  icon: Home },
  { to: "/admin/floors",   label: "Floors",    icon: Layers },
  { to: "/admin/shops",    label: "Shops",     icon: Store },
  { to: "/admin/categories", label: "Categories", icon: Tag },
  { to: "/admin/brands",   label: "Brands",    icon: Award },
  { to: "/admin/badges",   label: "Badges",    icon: Sparkles },
  { to: "/admin/products", label: "Products",  icon: Package },
  { to: "/admin/orders",   label: "Orders",    icon: ShoppingBag },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/settings", label: "Settings",  icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-mall-900 flex">

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-cream/8 py-6 px-3">
        {/* Brand */}
        <div className="px-3 mb-8">
          <p className="font-mono-tag text-[10px] uppercase text-mall-orange tracking-widest mb-0.5">Admin Panel</p>
          <p className="font-display text-cream text-base leading-tight">Azard Stores</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5">
          {LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                    isActive
                      ? "bg-mall-accent/10 text-mall-accent"
                      : "text-cream/50 hover:text-cream hover:bg-cream/5"
                  }`
                }
              >
                <Icon size={15} className="shrink-0" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="border-t border-cream/8 pt-4 px-3">
          <p className="text-cream/50 text-xs mb-0.5 truncate">{user?.name}</p>
          <p className="text-cream/25 text-[10px] truncate mb-3">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition text-xs"
          >
            <LogOut size={12} /> Log out
          </button>
        </div>
      </aside>

      {/* ── Mobile top nav ────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-mall-900 border-b border-cream/8 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-mono-tag text-[9px] uppercase text-mall-orange tracking-widest">Admin</p>
          <p className="font-display text-cream text-sm">Azard Stores</p>
        </div>
        <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono-tag uppercase transition ${
                    isActive ? "bg-mall-accent text-mall-900" : "text-cream/40 hover:text-cream"
                  }`
                }
              >
                <Icon size={11} />
                {link.label}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 md:pt-0 pt-16 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}