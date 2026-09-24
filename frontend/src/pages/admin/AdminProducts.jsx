import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, Package, Upload, CheckCircle2, AlertCircle, FileSpreadsheet, Download } from "lucide-react";
import api from "../../api/client";
import AdminPagination from "../../components/AdminPagination";
import { downloadCsv } from "../../utils/downloadCsv";
import { useBadges } from "../../context/BadgesContext";

const PURPOSES = ["work", "gaming", "travel", "home", "fitness"];
const EMPTY = { name: "", description: "", price: "", compareAtPrice: "", images: "", shop: "", category: "", subcategory: "", brand: "", stock: "", badge: "", isFlashSale: false, purposeTags: [], variants: [] };

function ProductForm({ initial, shops, categories, brands, onSave, onCancel }) {
  const { badges } = useBadges();
  const [form, setForm] = useState(initial
    ? { ...initial, images: initial.images?.join(", ") || "", purposeTags: initial.purposeTags || [], variants: initial.variants || [] }
    : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  function togglePurpose(tag) {
    setForm((f) => ({
      ...f,
      purposeTags: f.purposeTags.includes(tag) ? f.purposeTags.filter((t) => t !== tag) : [...f.purposeTags, tag],
    }));
  }

  function addVariant() {
    setForm((f) => ({ ...f, variants: [...f.variants, { name: "", sku: "", price: "", compareAtPrice: "", stock: "", image: "" }] }));
  }
  function updateVariant(index, key, value) {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, [key]: value } : v)),
    }));
  }
  function removeVariant(index) {
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== index) }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.price || !form.shop) { setError("Name, price and shop are required"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        images: form.images ? form.images.split(",").map((s) => s.trim()).filter(Boolean) : [],
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        stock: Number(form.stock) || 0,
        variants: form.variants
          .filter((v) => v.name && v.name.trim())
          .map((v) => ({
            name: v.name.trim(),
            sku: v.sku || "",
            price: v.price !== "" && v.price !== undefined ? Number(v.price) : undefined,
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
            stock: Number(v.stock) || 0,
            image: v.image || "",
          })),
      };
      await onSave(payload);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save product");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full bg-mall-800 border border-cream/10 rounded-xl px-3 py-2.5 text-cream text-sm placeholder-cream/20 outline-none focus:border-mall-accent transition";

  return (
    <form onSubmit={handleSave} className="border border-cream/10 rounded-2xl p-5 bg-mall-800/50 mb-4">
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <div className="sm:col-span-2">
          <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">Product Name</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Oraimo AirBuds Pro" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className={`${inputClass} resize-none`} />
        </div>
        <div>
          <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">Price (KSh)</label>
          <input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="3499" className={inputClass} />
        </div>
        <div>
          <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">Compare At Price</label>
          <input type="number" value={form.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} placeholder="4500" className={inputClass} />
        </div>
        <div>
          <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">Shop</label>
          <select value={form.shop?._id || form.shop} onChange={(e) => set("shop", e.target.value)} className={inputClass}>
            <option value="">Select shop</option>
            {shops.map((s) => <option key={s._id} value={s._id}>#{s.shopNumber} {s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">Brand</label>
          <select value={form.brand} onChange={(e) => set("brand", e.target.value)} className={inputClass}>
            <option value="">Select brand</option>
            {brands.map((b) => <option key={b._id} value={b.name}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">Stock</label>
          <input type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)} placeholder="50" className={inputClass} />
        </div>
        <div>
          <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">Badge</label>
          <select value={form.badge} onChange={(e) => set("badge", e.target.value)} className={inputClass}>
            <option value="">None</option>
            {badges.map((b) => <option key={b._id} value={b.slug}>{b.chipLabel}</option>)}
          </select>
        </div>
        <div>
          <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">Category</label>
          <select
            value={form.category}
            onChange={(e) => { set("category", e.target.value); set("subcategory", ""); }}
            className={inputClass}
          >
            <option value="">Select category</option>
            {categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">Subcategory</label>
          <select
            value={form.subcategory}
            onChange={(e) => set("subcategory", e.target.value)}
            disabled={!form.category}
            className={`${inputClass} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <option value="">{form.category ? "Select subcategory" : "Pick a category first"}</option>
            {(categories.find((c) => c.name === form.category)?.subcategories || []).map((s) => (
              <option key={s._id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input type="checkbox" id="flashSale" checked={form.isFlashSale} onChange={(e) => set("isFlashSale", e.target.checked)} className="accent-mall-accent" />
          <label htmlFor="flashSale" className="text-cream/60 text-sm">Flash Sale</label>
        </div>
        <div className="sm:col-span-2">
          <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">Image URLs (comma separated)</label>
          <textarea value={form.images} onChange={(e) => set("images", e.target.value)} rows={2} placeholder="https://..., https://..." className={`${inputClass} resize-none`} />
        </div>
        <div className="sm:col-span-2">
          <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-2">Purpose Tags</label>
          <div className="flex gap-2 flex-wrap">
            {PURPOSES.map((tag) => (
              <button key={tag} type="button" onClick={() => togglePurpose(tag)}
                className={`font-mono-tag text-[9px] uppercase px-2.5 py-1 rounded-full border transition ${
                  form.purposeTags.includes(tag) ? "bg-mall-accent text-mall-900 border-mall-accent" : "border-cream/15 text-cream/50 hover:text-cream"
                }`}>
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Variants — optional. A product with none behaves exactly as before,
          using its own top-level price/stock. */}
      <div className="mb-4 pt-4 border-t border-cream/10">
        <div className="flex items-center justify-between mb-2">
          <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest">
            Variants (optional — e.g. sizes or colors)
          </label>
          <button type="button" onClick={addVariant}
            className="flex items-center gap-1 text-mall-accent text-xs font-medium hover:text-mall-accentDark transition">
            <Plus size={11} /> Add Variant
          </button>
        </div>
        {form.variants.length === 0 ? (
          <p className="text-cream/25 text-xs">No variants — this product uses its own price and stock above.</p>
        ) : (
          <div className="space-y-3">
            {form.variants.map((variant, i) => (
              <div key={i} className="bg-mall-900/40 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    value={variant.name}
                    onChange={(e) => updateVariant(i, "name", e.target.value)}
                    placeholder="e.g. Red / Large"
                    className="flex-1 bg-mall-800 border border-cream/10 rounded-lg px-2 py-1.5 text-cream text-xs placeholder-cream/20 outline-none focus:border-mall-accent transition"
                  />
                  <input
                    value={variant.sku || ""}
                    onChange={(e) => updateVariant(i, "sku", e.target.value)}
                    placeholder="SKU (optional)"
                    className="w-32 bg-mall-800 border border-cream/10 rounded-lg px-2 py-1.5 text-cream text-xs placeholder-cream/20 outline-none focus:border-mall-accent transition"
                  />
                  <button type="button" onClick={() => removeVariant(i)}
                    className="shrink-0 flex items-center justify-center w-7 h-7 text-cream/30 hover:text-red-400 transition">
                    <X size={13} />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input
                    type="number"
                    value={variant.price ?? ""}
                    onChange={(e) => updateVariant(i, "price", e.target.value)}
                    placeholder="Price (blank = default)"
                    className="bg-mall-800 border border-cream/10 rounded-lg px-2 py-1.5 text-cream text-xs placeholder-cream/20 outline-none focus:border-mall-accent transition"
                  />
                  <input
                    type="number"
                    value={variant.compareAtPrice ?? ""}
                    onChange={(e) => updateVariant(i, "compareAtPrice", e.target.value)}
                    placeholder="Compare at (optional)"
                    className="bg-mall-800 border border-cream/10 rounded-lg px-2 py-1.5 text-cream text-xs placeholder-cream/20 outline-none focus:border-mall-accent transition"
                  />
                  <input
                    type="number"
                    value={variant.stock ?? ""}
                    onChange={(e) => updateVariant(i, "stock", e.target.value)}
                    placeholder="Stock"
                    className="bg-mall-800 border border-cream/10 rounded-lg px-2 py-1.5 text-cream text-xs placeholder-cream/20 outline-none focus:border-mall-accent transition"
                  />
                  <input
                    value={variant.image || ""}
                    onChange={(e) => updateVariant(i, "image", e.target.value)}
                    placeholder="Image URL (optional)"
                    className="bg-mall-800 border border-cream/10 rounded-lg px-2 py-1.5 text-cream text-xs placeholder-cream/20 outline-none focus:border-mall-accent transition"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="flex items-center gap-1.5 bg-mall-accent text-mall-900 font-semibold text-xs px-4 py-2 rounded-lg hover:bg-mall-accentDark transition disabled:opacity-50">
          <Check size={13} /> {saving ? "Saving..." : "Save Product"}
        </button>
        <button type="button" onClick={onCancel} className="flex items-center gap-1.5 border border-cream/15 text-cream/50 text-xs px-4 py-2 rounded-lg hover:text-cream transition">
          <X size={13} /> Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Bulk CSV import ────────────────────────────────────────────────────────
// Currently supports WooCommerce product exports (see utils/wooCommerceImport.js
// on the backend for the field mapping). Two-step flow: first analyze the
// file to see which categories it contains, then map each category to a
// shop (or leave it on the default) before actually importing anything.
function ImportPanel({ shops, onDone, onCancel }) {
  const [step, setStep] = useState("select"); // select | mapping | done
  const [file, setFile] = useState(null);
  const [shopId, setShopId] = useState("");
  const [defaultStock, setDefaultStock] = useState("10");
  const [categories, setCategories] = useState([]);
  const [categoryShopMap, setCategoryShopMap] = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleAnalyze(e) {
    e.preventDefault();
    setError("");
    if (!file) { setError("Choose a CSV file first"); return; }

    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("csv", file);
      const res = await api.post("/products/bulk-import/preview", formData);
      setCategories(res.data.categories);
      setStep("mapping");
    } catch (err) {
      setError(err.response?.data?.message || "Could not read that file — check it's a valid CSV export");
    } finally {
      setAnalyzing(false);
    }
  }

  function setCategoryShop(categoryName, shopIdForCategory) {
    setCategoryShopMap((prev) => {
      const next = { ...prev };
      if (shopIdForCategory) next[categoryName] = shopIdForCategory;
      else delete next[categoryName];
      return next;
    });
  }

  async function handleImport(e) {
    e.preventDefault();
    setError("");
    if (!shopId) { setError("Select a default shop"); return; }
    if (defaultStock === "" || Number(defaultStock) < 0) { setError("Enter a valid default stock quantity"); return; }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("csv", file);
      formData.append("shopId", shopId);
      formData.append("defaultStock", defaultStock);
      formData.append("categoryMap", JSON.stringify(categoryShopMap));
      const res = await api.post("/products/bulk-import", formData);
      setResult(res.data);
      setStep("done");
    } catch (err) {
      setError(err.response?.data?.message || "Import failed — check the file and try again");
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setStep("select");
    setFile(null);
    setCategories([]);
    setCategoryShopMap({});
    setResult(null);
    setError("");
  }

  const inputClass = "w-full bg-mall-800 border border-cream/10 rounded-xl px-3 py-2.5 text-cream text-sm placeholder-cream/20 outline-none focus:border-mall-accent transition";

  // ── Step 3: result ──────────────────────────────────────────────────────
  if (step === "done" && result) {
    return (
      <div className="border border-cream/10 rounded-2xl p-5 bg-mall-800/50 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <p className="text-cream text-sm font-medium">
            Imported {result.imported} of {result.total} products
          </p>
        </div>
        {result.skippedCount > 0 && (
          <div className="mb-4">
            <p className="text-cream/50 text-xs mb-2">
              {result.skippedCount} row{result.skippedCount !== 1 ? "s" : ""} skipped:
            </p>
            <ul className="space-y-1">
              {result.skipped.map((reason, i) => (
                <li key={i} className="flex items-start gap-1.5 text-cream/40 text-xs">
                  <AlertCircle size={11} className="shrink-0 mt-0.5" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          onClick={onDone}
          className="flex items-center gap-1.5 bg-mall-accent text-mall-900 font-semibold text-xs px-4 py-2 rounded-lg hover:bg-mall-accentDark transition"
        >
          <Check size={13} /> Done
        </button>
      </div>
    );
  }

  // ── Step 2: map categories to shops ─────────────────────────────────────
  if (step === "mapping") {
    return (
      <div className="border border-cream/10 rounded-2xl p-5 bg-mall-800/50 mb-4">
        <form onSubmit={handleImport}>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">Default Shop</label>
              <select value={shopId} onChange={(e) => setShopId(e.target.value)} className={inputClass}>
                <option value="">Select shop</option>
                {shops.map((s) => <option key={s._id} value={s._id}>#{s.shopNumber} {s.name}</option>)}
              </select>
              <p className="text-cream/30 text-[10px] mt-1.5 leading-relaxed">
                Used for any category you don't map below.
              </p>
            </div>
            <div>
              <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">
                Default Stock (applied to every row)
              </label>
              <input
                type="number"
                min="0"
                value={defaultStock}
                onChange={(e) => setDefaultStock(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="mb-4">
            <p className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest mb-2">
              Map categories to shops ({categories.length} found)
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div key={cat.name} className="flex items-center gap-3 bg-mall-900/40 rounded-xl px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-cream text-sm truncate">{cat.name}</p>
                    <p className="text-cream/30 text-[10px]">{cat.count} product{cat.count !== 1 ? "s" : ""}</p>
                  </div>
                  <select
                    value={categoryShopMap[cat.name] || ""}
                    onChange={(e) => setCategoryShop(cat.name, e.target.value)}
                    className="shrink-0 bg-mall-800 border border-cream/10 rounded-lg px-2.5 py-2 text-cream text-xs outline-none focus:border-mall-accent transition w-48"
                  >
                    <option value="">Use default shop</option>
                    {shops.map((s) => <option key={s._id} value={s._id}>#{s.shopNumber} {s.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={importing} className="flex items-center gap-1.5 bg-mall-accent text-mall-900 font-semibold text-xs px-4 py-2 rounded-lg hover:bg-mall-accentDark transition disabled:opacity-50">
              <Upload size={13} /> {importing ? "Importing..." : "Import Products"}
            </button>
            <button type="button" onClick={reset} className="flex items-center gap-1.5 border border-cream/15 text-cream/50 text-xs px-4 py-2 rounded-lg hover:text-cream transition">
              Back
            </button>
            <button type="button" onClick={onCancel} className="flex items-center gap-1.5 border border-cream/15 text-cream/50 text-xs px-4 py-2 rounded-lg hover:text-cream transition">
              <X size={13} /> Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── Step 1: select file ─────────────────────────────────────────────────
  return (
    <div className="border border-cream/10 rounded-2xl p-5 bg-mall-800/50 mb-4">
      <form onSubmit={handleAnalyze}>
        <div className="mb-3">
          <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">
            CSV File (WooCommerce export)
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className={`${inputClass} file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-mall-accent file:text-mall-900 file:text-xs file:font-semibold`}
          />
        </div>
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={analyzing} className="flex items-center gap-1.5 bg-mall-accent text-mall-900 font-semibold text-xs px-4 py-2 rounded-lg hover:bg-mall-accentDark transition disabled:opacity-50">
            <FileSpreadsheet size={13} /> {analyzing ? "Analyzing..." : "Analyze File"}
          </button>
          <button type="button" onClick={onCancel} className="flex items-center gap-1.5 border border-cream/15 text-cream/50 text-xs px-4 py-2 rounded-lg hover:text-cream transition">
            <X size={13} /> Cancel
          </button>
        </div>
      </form>
    </div>
  );
}


// ─── Bulk edit ──────────────────────────────────────────────────────────────
// Applies to every selected product at once. Only fields the admin actually
// touches get sent — leaving a field blank means "don't change this."
function BulkEditPanel({ count, shops, categories, brands, onApply, onCancel }) {
  const { badges } = useBadges();
  const [shop, setShop] = useState("");
  const [category, setCategory] = useState("");
  const [badge, setBadge] = useState("");
  const [stock, setStock] = useState("");
  const [priceType, setPriceType] = useState("");
  const [priceValue, setPriceValue] = useState("");
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");

  async function handleApply(e) {
    e.preventDefault();
    setError("");

    const set = {};
    if (shop) set.shop = shop;
    if (category) set.category = category;
    if (badge) set.badge = badge;
    if (stock !== "") set.stock = Number(stock);

    const priceAdjustment = priceType && priceValue !== "" ? { type: priceType, value: priceValue } : null;

    if (Object.keys(set).length === 0 && !priceAdjustment) {
      setError("Change at least one field before applying");
      return;
    }

    setApplying(true);
    try {
      await onApply({ set, priceAdjustment });
    } catch (err) {
      setError(err.response?.data?.message || "Bulk edit failed");
    } finally {
      setApplying(false);
    }
  }

  const inputClass = "w-full bg-mall-800 border border-cream/10 rounded-xl px-3 py-2.5 text-cream text-sm placeholder-cream/20 outline-none focus:border-mall-accent transition";

  return (
    <div className="border border-mall-accent/30 rounded-2xl p-5 bg-mall-accent/5 mb-4">
      <p className="text-cream text-sm font-medium mb-4">
        Editing {count} product{count !== 1 ? "s" : ""} — only filled-in fields will change
      </p>
      <form onSubmit={handleApply}>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">Move to Shop</label>
            <select value={shop} onChange={(e) => setShop(e.target.value)} className={inputClass}>
              <option value="">Don't change</option>
              {shops.map((s) => <option key={s._id} value={s._id}>#{s.shopNumber} {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">Set Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              <option value="">Don't change</option>
              {categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">Set Badge</label>
            <select value={badge} onChange={(e) => setBadge(e.target.value)} className={inputClass}>
              <option value="">Don't change</option>
              {badges.map((b) => <option key={b._id} value={b.slug}>{b.chipLabel}</option>)}
            </select>
          </div>
          <div>
            <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">Set Stock</label>
            <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Don't change" className={inputClass} />
          </div>
          <div>
            <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">Price Adjustment</label>
            <select value={priceType} onChange={(e) => setPriceType(e.target.value)} className={inputClass}>
              <option value="">Don't change</option>
              <option value="percent">Adjust by %</option>
              <option value="flat">Adjust by flat KSh amount</option>
              <option value="set">Set exact price</option>
            </select>
          </div>
          <div>
            <label className="font-mono-tag text-[9px] uppercase text-cream/40 tracking-widest block mb-1.5">
              {priceType === "percent" ? "% (e.g. 10 or -10)" : priceType === "flat" ? "KSh amount (e.g. -200)" : "New price (KSh)"}
            </label>
            <input
              type="number"
              value={priceValue}
              onChange={(e) => setPriceValue(e.target.value)}
              disabled={!priceType}
              className={`${inputClass} disabled:opacity-40 disabled:cursor-not-allowed`}
            />
          </div>
        </div>
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={applying} className="flex items-center gap-1.5 bg-mall-accent text-mall-900 font-semibold text-xs px-4 py-2 rounded-lg hover:bg-mall-accentDark transition disabled:opacity-50">
            <Check size={13} /> {applying ? "Applying..." : `Apply to ${count} product${count !== 1 ? "s" : ""}`}
          </button>
          <button type="button" onClick={onCancel} className="flex items-center gap-1.5 border border-cream/15 text-cream/50 text-xs px-4 py-2 rounded-lg hover:text-cream transition">
            <X size={13} /> Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  // Reference data for the form's dropdowns — fetched once, not paginated
  // (these lists are small and needed in full regardless of which page of
  // products is currently showing).
  useEffect(() => {
    Promise.all([api.get("/shops"), api.get("/categories"), api.get("/brands")]).then(
      ([shopsRes, catRes, brandRes]) => {
        setShops(shopsRes.data);
        setCategories(catRes.data);
        setBrands(brandRes.data);
      }
    );
  }, []);

  function load() {
    setLoading(true);
    api.get("/products", { params: { search: search || undefined, page, limit: 20 } })
      .then((res) => {
        setProducts(res.data.products);
        setPages(res.data.pages);
      })
      .finally(() => setLoading(false));
  }
  useEffect(load, [search, page]);
  // A search or page change means the on-screen product set has changed —
  // clear any selection so Bulk Edit can never silently apply to products
  // that are no longer even visible.
  useEffect(() => { setSelectedIds([]); setShowBulkEdit(false); }, [search, page]);

  async function handleAdd(form) { await api.post("/products", form); setShowAdd(false); load(); }
  async function handleEdit(id, form) { await api.put(`/products/${id}`, form); setEditId(null); load(); }
  async function handleDelete(id) {
    if (!confirm("Delete this product?")) return;
    await api.delete(`/products/${id}`);
    load();
  }

  async function handleBulkEdit(changes) {
    await api.patch("/products/bulk-edit", { ids: selectedIds, ...changes });
    setSelectedIds([]);
    setShowBulkEdit(false);
    load();
  }

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => prev.length === filtered.length ? [] : filtered.map((p) => p._id));
  }

  const filtered = products;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-cream/10">
        <div>
          <p className="font-mono-tag text-[10px] uppercase text-mall-orange tracking-widest mb-0.5">Admin</p>
          <h1 className="font-display text-2xl text-cream">Products</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadCsv(api, "/products/export", "products-export.csv")}
            className="flex items-center gap-1.5 border border-cream/15 text-cream/70 font-semibold text-xs px-4 py-2.5 rounded-xl hover:text-cream hover:border-cream/30 transition">
            <Download size={13} /> Export CSV
          </button>
          <button onClick={() => { setShowImport(true); setShowAdd(false); setEditId(null); }}
            className="flex items-center gap-1.5 border border-cream/15 text-cream/70 font-semibold text-xs px-4 py-2.5 rounded-xl hover:text-cream hover:border-cream/30 transition">
            <FileSpreadsheet size={13} /> Import CSV
          </button>
          <button onClick={() => { setShowAdd(true); setShowImport(false); setEditId(null); }}
            className="flex items-center gap-1.5 bg-mall-accent text-mall-900 font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-mall-accentDark transition">
            <Plus size={13} /> Add Product
          </button>
        </div>
      </div>

      {showImport && (
        <ImportPanel
          shops={shops}
          onDone={() => { setShowImport(false); load(); }}
          onCancel={() => setShowImport(false)}
        />
      )}

      {showAdd && <ProductForm shops={shops} categories={categories} brands={brands} onSave={handleAdd} onCancel={() => setShowAdd(false)} />}

      {/* Search */}
      <div className="mb-5">
        <input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search products..."
          className="w-full sm:w-72 bg-mall-800 border border-cream/10 rounded-xl px-3 py-2.5 text-cream text-sm placeholder-cream/20 outline-none focus:border-mall-accent transition"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-mall-accent/30 border-t-mall-accent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Package size={32} className="text-cream/15 mx-auto mb-3" />
          <p className="text-cream/30 text-sm">No products found.</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="flex items-center gap-2 text-cream/50 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={filtered.length > 0 && selectedIds.length === filtered.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-mall-accent"
              />
              {selectedIds.length > 0 ? `${selectedIds.length} selected` : `${filtered.length} products`}
            </label>
            {selectedIds.length > 0 && !showBulkEdit && (
              <button onClick={() => setShowBulkEdit(true)}
                className="flex items-center gap-1.5 bg-mall-accent text-mall-900 font-semibold text-xs px-4 py-2 rounded-lg hover:bg-mall-accentDark transition">
                <Pencil size={13} /> Bulk Edit
              </button>
            )}
          </div>

          {showBulkEdit && selectedIds.length > 0 && (
            <BulkEditPanel
              count={selectedIds.length}
              shops={shops}
              categories={categories}
              brands={brands}
              onApply={handleBulkEdit}
              onCancel={() => setShowBulkEdit(false)}
            />
          )}

          <div className="divide-y divide-cream/8">
            {filtered.map((product) => (
              <div key={product._id}>
                {editId === product._id ? (
                  <div className="py-3">
                    <ProductForm initial={product} shops={shops} categories={categories} brands={brands} onSave={(form) => handleEdit(product._id, form)} onCancel={() => setEditId(null)} />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product._id)}
                      onChange={() => toggleSelect(product._id)}
                      className="w-4 h-4 accent-mall-accent shrink-0"
                    />
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-mall-800 flex items-center justify-center shrink-0">
                        <Package size={16} className="text-cream/20" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        {product.brand && <p className="font-mono-tag text-[9px] uppercase text-mall-accent tracking-widest">{product.brand}</p>}
                        {product.badge && <span className="font-mono-tag text-[9px] uppercase text-cream/30">{product.badge}</span>}
                      </div>
                      <p className="text-cream text-sm font-medium line-clamp-1">{product.name}</p>
                      <p className="text-cream/40 text-xs">KSh {product.price?.toLocaleString()} · Stock: {product.stock}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => { setEditId(product._id); setShowAdd(false); }}
                        className="w-8 h-8 rounded-lg bg-mall-800 text-cream/50 hover:text-cream flex items-center justify-center transition">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(product._id)}
                        className="w-8 h-8 rounded-lg bg-mall-800 text-cream/50 hover:text-red-400 flex items-center justify-center transition">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <AdminPagination page={page} pages={pages} onChange={setPage} />
    </div>
  );
}