import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShoppingBag, ArrowRight, ChevronLeft, ChevronRight,
  MapPin, AlertCircle, CheckCircle, Minus, Plus,
  Share2, Truck, RotateCcw, Shield, Package,
} from "lucide-react";
import api from "../api/client";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import StripProductCard from "../components/StripProductCard";
import Breadcrumbs from "../components/Breadcrumbs";

function WhatsAppIcon({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: size, height: size, flexShrink: 0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.127 1.532 5.86L.057 23.857l6.174-1.448A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.001-1.366l-.36-.214-3.664.86.876-3.565-.233-.375A9.818 9.818 0 1112 21.818z"/>
    </svg>
  );
}

// ─── Image gallery ────────────────────────────────────────────────────────────
function ImageGallery({ images, name }) {
  const [active, setActive] = useState(0);
  const imgs = images?.length ? images : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-mall-800 group">
        {imgs[active] ? (
          <img src={imgs[active]} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={48} className="text-cream/20" />
          </div>
        )}
        {imgs.length > 1 && (
          <>
            <button onClick={() => setActive((i) => (i - 1 + imgs.length) % imgs.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-mall-900/70 backdrop-blur-sm text-cream flex items-center justify-center hover:bg-mall-900 transition opacity-0 group-hover:opacity-100">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setActive((i) => (i + 1) % imgs.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-mall-900/70 backdrop-blur-sm text-cream flex items-center justify-center hover:bg-mall-900 transition opacity-0 group-hover:opacity-100">
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>
      {imgs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {imgs.map((img, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition ${i === active ? "border-mall-accent" : "border-transparent opacity-60 hover:opacity-100"}`}>
              <img src={img} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Generate key features from product data ──────────────────────────────────
function getKeyFeatures(product) {
  const features = [];
  if (product.brand) features.push(`Made by ${product.brand} — a trusted name in ${product.subcategory || "this category"}`);
  if (product.description) features.push(product.description);
  if (product.purposeTags?.includes("work")) features.push("Designed for work and productivity use");
  if (product.purposeTags?.includes("travel")) features.push("Compact and travel-friendly design");
  if (product.purposeTags?.includes("gaming")) features.push("Optimized for gaming performance");
  if (product.purposeTags?.includes("fitness")) features.push("Built to keep up with an active lifestyle");
  if (product.purposeTags?.includes("home")) features.push("Perfect for everyday home use");
  if (product.stock <= 5 && product.stock > 0) features.push(`Limited availability — only ${product.stock} units remaining`);
  if (product.compareAtPrice) features.push(`Currently on sale — save KSh ${(product.compareAtPrice - product.price).toLocaleString()} off the regular price`);
  if (product.shop) features.push(`Available exclusively at ${product.shop.name}, Floor ${product.shop.floor?.floorNumber} of Azard Stores`);
  return features;
}

// ─── Related strip ────────────────────────────────────────────────────────────
function RelatedStrip({ title, products }) {
  if (!products?.length) return null;
  return (
    <div className="mb-12 sm:mb-16">
      <div className="flex items-baseline justify-between mb-5 border-b border-cream/10 pb-3">
        <h2 className="font-display text-lg sm:text-xl text-cream">{title}</h2>
        <span className="font-mono-tag text-[9px] uppercase text-cream/30 tracking-widest">{products.length} items</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
        {products.map((p) => <StripProductCard key={p._id} product={p} />)}
        <div className="shrink-0 w-2 sm:hidden" />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Product() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { settings } = useSettings();
  const WHATSAPP_NUMBER = settings.whatsappNumber;
  const [product, setProduct] = useState(null);
  const [shopProducts, setShopProducts] = useState([]);
  const [floorProducts, setFloorProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    setLoading(true);
    setProduct(null);
    setSelectedVariant(null);
    setQty(1);
    window.scrollTo(0, 0);
    api.get(`/products/${slug}`).then(async (res) => {
      const prod = res.data;
      setProduct(prod);
      const shopId = prod.shop?._id;
      const floorId = prod.shop?.floor?._id;
      const [shopRes, floorRes, trendRes] = await Promise.all([
        shopId ? api.get("/products", { params: { shop: shopId, limit: 10 } }) : null,
        floorId ? api.get("/products", { params: { floor: floorId, limit: 10 } }) : null,
        api.get("/products", { params: { badge: "trending", limit: 10 } }),
      ]);
      const exclude = (list) => list.filter((p) => p._id !== prod._id);
      if (shopRes) setShopProducts(exclude(shopRes.data.products));
      if (floorRes) setFloorProducts(exclude(floorRes.data.products));
      setTrendingProducts(exclude(trendRes.data.products));
    }).finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-mall-900 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-mall-accent/30 border-t-mall-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-mall-900 flex flex-col items-center justify-center gap-4 px-4">
        <AlertCircle size={40} className="text-cream/20" />
        <p className="font-display text-xl text-cream/40">Product not found</p>
        <Link to="/directory" className="text-mall-accent hover:underline text-sm">Back to directory</Link>
      </div>
    );
  }

  const hasVariants = product.variants?.length > 0;
  // A variant's own price/compareAtPrice/stock override the product's when
  // set — undefined/null on the variant means "use the product's own value".
  const effectivePrice = selectedVariant?.price ?? product.price;
  const effectiveCompareAtPrice = selectedVariant
    ? (selectedVariant.compareAtPrice ?? product.compareAtPrice)
    : product.compareAtPrice;
  // With variants, stock isn't known until one is picked — treat as 0 so
  // Add to Cart stays disabled and nothing is falsely shown as in-stock.
  const effectiveStock = hasVariants ? (selectedVariant ? selectedVariant.stock : 0) : product.stock;
  const needsVariantSelection = hasVariants && !selectedVariant;

  const hasDiscount = effectiveCompareAtPrice && effectiveCompareAtPrice > effectivePrice;
  const discountPct = hasDiscount ? Math.round((1 - effectivePrice / effectiveCompareAtPrice) * 100) : null;
  const isLowStock = effectiveStock > 0 && effectiveStock <= 5;
  const isOutOfStock = effectiveStock === 0;
  const keyFeatures = getKeyFeatures(product);

  const whatsappMsg = encodeURIComponent(
    `Hi! I'm interested in "${product.name}"${selectedVariant ? ` (${selectedVariant.name})` : ""} (KSh ${effectivePrice?.toLocaleString()}) from Shop ${product.shop?.shopNumber ?? ""}. Is it available?`
  );

  function handleAddToCart() {
    if (isOutOfStock || needsVariantSelection) return;
    for (let i = 0; i < qty; i++) addItem(product, 1, selectedVariant);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  return (
    <div className="min-h-screen bg-mall-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Breadcrumbs */}
        <Breadcrumbs crumbs={[
          { label: "Home", to: "/" },
          ...(product.shop?.floor ? [{ label: `Floor ${product.shop.floor.floorNumber}: ${product.shop.floor.name}`, to: `/floor/${product.shop.floor.slug}` }] : []),
          ...(product.shop ? [{ label: `Shop #${product.shop.shopNumber}: ${product.shop.name}`, to: `/shop/${product.shop.slug}` }] : []),
          { label: product.name },
        ]} />

        {/* ── Main section ──────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16 mt-6 mb-16 sm:mb-20">

          {/* Left — Image */}
          <ImageGallery
            key={selectedVariant?._id || "base"}
            images={
              selectedVariant?.image
                ? [selectedVariant.image, ...(product.images || []).filter((i) => i !== selectedVariant.image)]
                : product.images
            }
            name={product.name}
          />

          {/* Right — Info */}
          <div>

            {/* Brand + badge */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {product.brand && (
                <Link to={`/brand/${encodeURIComponent(product.brand)}`}
                  className="font-mono-tag text-[10px] uppercase text-mall-accent tracking-widest hover:underline">
                  {product.brand}
                </Link>
              )}
              {product.badge && (
                <span className="font-mono-tag text-[10px] uppercase bg-mall-accent text-mall-900 px-2.5 py-1 rounded-full font-semibold">
                  {product.badge.replace(/-/g, " ")}
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-cream leading-tight mb-3">
              {product.name}
            </h1>

            {/* Shop + floor */}
            {product.shop && (
              <div className="flex items-center gap-1.5 text-cream/40 text-sm flex-wrap mb-4">
                <MapPin size={13} className="text-mall-accent shrink-0" />
                <Link to={`/shop/${product.shop.slug}`} className="hover:text-mall-accent transition">
                  Shop #{product.shop.shopNumber} · {product.shop.name}
                </Link>
                {product.shop.floor && (
                  <>
                    <span>·</span>
                    <Link to={`/floor/${product.shop.floor.slug}`} className="hover:text-mall-accent transition">
                      Floor {product.shop.floor.floorNumber}: {product.shop.floor.name}
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-cream/10 mb-4" />

            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap mb-3">
              <span className="font-display text-3xl sm:text-4xl text-cream">
                KSh {effectivePrice?.toLocaleString()}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-cream/30 text-lg line-through">
                    KSh {effectiveCompareAtPrice?.toLocaleString()}
                  </span>
                  <span className="font-mono-tag text-xs text-red-400 font-semibold">
                    -{discountPct}% off
                  </span>
                </>
              )}
            </div>

            {/* Variant picker */}
            {hasVariants && (
              <div className="mb-4">
                <p className="font-mono-tag text-[9px] uppercase text-cream/30 tracking-widest mb-2">
                  {needsVariantSelection ? "Select an option" : "Option"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const active = selectedVariant?._id === v._id;
                    const outOfStock = v.stock === 0;
                    return (
                      <button
                        key={v._id}
                        type="button"
                        disabled={outOfStock}
                        onClick={() => { setSelectedVariant(v); setQty(1); }}
                        className={`px-3.5 py-2 rounded-lg text-sm border transition ${
                          outOfStock ? "border-cream/10 text-cream/25 cursor-not-allowed line-through"
                          : active ? "bg-mall-accent text-mall-900 border-mall-accent font-semibold"
                          : "border-cream/20 text-cream/70 hover:border-cream/40 hover:text-cream"
                        }`}
                      >
                        {v.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock status */}
            <div className="flex items-center gap-2 mb-4">
              {needsVariantSelection ? (
                <span className="text-sm text-cream/40">Select an option to see availability</span>
              ) : isOutOfStock ? (
                <><AlertCircle size={14} className="text-red-400 shrink-0" /><span className="text-sm text-red-400 font-medium">Out of Stock</span></>
              ) : isLowStock ? (
                <><AlertCircle size={14} className="text-mall-accent shrink-0" /><span className="text-sm text-mall-accent font-medium">Only {effectiveStock} left — order soon</span></>
              ) : (
                <><CheckCircle size={14} className="text-emerald-400 shrink-0" /><span className="text-sm text-emerald-400 font-medium">In Stock · Ready to ship</span></>
              )}
            </div>

            {/* Short description */}
            {product.description && (
              <p className="text-cream/60 text-sm sm:text-base leading-relaxed mb-5">
                {product.description}
              </p>
            )}

            {/* Divider */}
            <div className="border-t border-cream/10 mb-5" />

            {/* Quantity */}
            {!isOutOfStock && !needsVariantSelection && (
              <div className="flex items-center gap-4 mb-5">
                <span className="text-sm text-cream/50">Quantity</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-full border border-cream/20 flex items-center justify-center text-cream/60 hover:border-cream hover:text-cream transition">
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-display text-lg text-cream">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(effectiveStock, q + 1))}
                    className="w-8 h-8 rounded-full border border-cream/20 flex items-center justify-center text-cream/60 hover:border-cream hover:text-cream transition">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <button onClick={handleAddToCart} disabled={isOutOfStock || needsVariantSelection}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm transition ${
                  isOutOfStock || needsVariantSelection ? "bg-cream/10 text-cream/30 cursor-not-allowed"
                  : added ? "bg-emerald-500 text-white"
                  : "bg-mall-accent text-mall-900 hover:bg-mall-accentDark"
                }`}>
                <ShoppingBag size={16} />
                {added ? "Added to Cart ✓" : needsVariantSelection ? "Select an Option" : isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </button>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm bg-[#25D366] text-white hover:bg-[#20b858] transition">
                <WhatsAppIcon size={16} />
                Order via WhatsApp
              </a>
            </div>

            {/* Trust signals */}
            <div className="border-t border-cream/10 pt-4 space-y-2.5 mb-4">
              <div className="flex items-center gap-2.5 text-sm text-cream/50">
                <Truck size={14} className="text-mall-accent shrink-0" />
                Fast delivery across Nairobi and major towns
              </div>
              <div className="flex items-center gap-2.5 text-sm text-cream/50">
                <RotateCcw size={14} className="text-mall-accent shrink-0" />
                7-day hassle-free returns
              </div>
              <div className="flex items-center gap-2.5 text-sm text-cream/50">
                <Shield size={14} className="text-mall-accent shrink-0" />
                Secure checkout — pay on delivery available
              </div>
            </div>

            {/* Share */}
            <button onClick={handleShare}
              className="flex items-center gap-2 text-cream/30 hover:text-cream text-xs transition">
              <Share2 size={13} /> Share this product
            </button>

            {/* Divider */}
            <div className="border-t border-cream/10 mt-6 mb-6" />

            {/* Key features — longer description section */}
            <p className="font-mono-tag text-[10px] uppercase text-mall-orange tracking-widest mb-4">
              About this product
            </p>
            <div className="space-y-3">
              {keyFeatures.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-cream/60 leading-relaxed">
                  <span className="w-1 h-1 rounded-full bg-mall-accent mt-2 shrink-0" />
                  {feature}
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-cream/10 mt-6 mb-6" />

            {/* Product details — flat, no card */}
            <p className="font-mono-tag text-[10px] uppercase text-mall-orange tracking-widest mb-4">
              Product Details
            </p>
            <div className="space-y-3">
              {product.brand && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-cream/40">Brand</span>
                  <Link to={`/brand/${encodeURIComponent(product.brand)}`}
                    className="text-cream font-medium hover:text-mall-accent transition">
                    {product.brand}
                  </Link>
                </div>
              )}
              {product.category && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-cream/40">Collection</span>
                  <Link to={`/collection/${encodeURIComponent(product.category)}`}
                    className="text-cream font-medium hover:text-mall-accent transition">
                    {product.category}
                  </Link>
                </div>
              )}
              {product.subcategory && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-cream/40">Category</span>
                  <Link to={`/category/${encodeURIComponent(product.subcategory)}`}
                    className="text-cream font-medium hover:text-mall-accent transition">
                    {product.subcategory}
                  </Link>
                </div>
              )}
              {product.purposeTags?.length > 0 && (
                <div className="flex items-start justify-between text-sm gap-4">
                  <span className="text-cream/40 shrink-0">Best for</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {product.purposeTags.map((tag) => (
                      <Link key={tag} to={`/search?purpose=${tag}`}
                        className="font-mono-tag text-[9px] uppercase text-mall-accent hover:underline">
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {!needsVariantSelection && effectiveStock > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-cream/40">Stock</span>
                  <span className="text-cream font-medium">{effectiveStock} units available</span>
                </div>
              )}
              {product.shop && (
                <div className="flex items-center justify-between text-sm pt-2 border-t border-cream/8">
                  <span className="text-cream/40">Sold by</span>
                  <Link to={`/shop/${product.shop.slug}`}
                    className="flex items-center gap-1 text-mall-accent hover:underline font-medium">
                    {product.shop.name} <ArrowRight size={11} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Related sections ───────────────────────────────────────── */}
        <RelatedStrip title={`More from ${product.shop?.name || "this shop"}`} products={shopProducts} />
        <RelatedStrip title={`More on Floor ${product.shop?.floor?.floorNumber || ""}: ${product.shop?.floor?.name || ""}`} products={floorProducts} />
        <RelatedStrip title="Trending in the Store" products={trendingProducts} />
      </div>
    </div>
  );
}