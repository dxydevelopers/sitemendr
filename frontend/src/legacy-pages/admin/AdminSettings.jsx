import { useEffect, useState } from "react";
import { Check, Settings as SettingsIcon } from "lucide-react";
import api from "../../api/client";

export default function AdminSettings() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/settings/admin").then((res) => setForm(res.data)).finally(() => setLoading(false));
  }, []);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await api.put("/settings", form);
      setForm(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full bg-mall-800 border border-cream/10 rounded-xl px-3 py-2.5 text-cream text-sm placeholder-cream/20 outline-none focus:border-mall-accent transition";

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-mall-accent/30 border-t-mall-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 pb-4 border-b border-cream/10">
        <p className="font-mono-tag text-[10px] uppercase text-mall-orange tracking-widest mb-0.5">Admin</p>
        <h1 className="font-display text-2xl text-cream">Settings</h1>
      </div>

      <div className="flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-6 max-w-2xl">
        <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-cream/70 text-xs leading-relaxed">
          Everything below is live: WhatsApp number, contact email, delivery fee, and maintenance mode all
          take effect across the site as soon as you save.
        </p>
      </div>

      <form onSubmit={handleSave} className="max-w-lg space-y-5">
        <div>
          <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">WhatsApp Number</label>
          <input
            value={form.whatsappNumber || ""}
            onChange={(e) => set("whatsappNumber", e.target.value)}
            placeholder="254700000000"
            className={inputClass}
          />
          <p className="text-cream/25 text-[10px] mt-1">No + or spaces — digits only.</p>
        </div>

        <div>
          <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">Contact Email</label>
          <input
            type="email"
            value={form.contactEmail || ""}
            onChange={(e) => set("contactEmail", e.target.value)}
            placeholder="hello@azardstores.co.ke"
            className={inputClass}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">Delivery Fee (KSh)</label>
            <input
              type="number"
              min="0"
              value={form.deliveryFee ?? 0}
              onChange={(e) => set("deliveryFee", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">Free Delivery Above (KSh)</label>
            <input
              type="number"
              min="0"
              value={form.freeDeliveryThreshold ?? 0}
              onChange={(e) => set("freeDeliveryThreshold", e.target.value)}
              placeholder="0 = disabled"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="maintenanceMode"
            checked={form.maintenanceMode || false}
            onChange={(e) => set("maintenanceMode", e.target.checked)}
            className="w-4 h-4 accent-mall-accent"
          />
          <label htmlFor="maintenanceMode" className="text-cream/70 text-sm">
            Maintenance mode <span className="text-cream/30 text-xs">(blocks the storefront for everyone except admins when on)</span>
          </label>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-mall-accent text-mall-900 font-semibold py-2.5 px-5 rounded-xl hover:bg-mall-accentDark transition disabled:opacity-50 text-sm">
          <Check size={14} /> {saving ? "Saving..." : saved ? "Saved" : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
