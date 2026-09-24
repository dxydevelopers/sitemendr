import { Link } from "react-router-dom";
import { ShoppingBag, ShoppingBasket, Heart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { useState, useEffect } from "react";

const WISHLIST_KEY = "azard_wishlist";

function WhatsAppIcon({ size = 13 }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: size, height: size, flexShrink: 0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.127 1.532 5.86L.057 23.857l6.174-1.448A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.001-1.366l-.36-.214-3.664.86.876-3.565-.233-.375A9.818 9.818 0 1112 21.818z"/>
    </svg>
  );
}

// ─── Wishlist helpers ─────────────────────────────────────────────────────────
function getWishlist() {
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]"); } catch { return []; }
}
function toggleWishlist(slug) {
  const list = getWishlist();
  const exists = list.includes(slug);
  const updated = exists ? list.filter((s) => s !== slug) : [...list, slug];
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
  return !exists;
}

export default function StripProductCard({ product }) {
  const { addItem } = useCart();
  const { settings } = useSettings();
  const WHATSAPP_NUMBER = settings.whatsappNumber;
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const [wishlisted, setWishlisted] = useState(false);

  // Check wishlist state on mount
  useEffect(() => {
    setWishlisted(getWishlist().includes(product.slug));
  }, [product.slug]);

  const whatsappMsg = encodeURIComponent(
    `Hi! I'm interested in "${product.name}" (KSh ${product.price?.toLocaleString()}) from Shop ${product.shop?.shopNumber ?? ""}. Is it available?`
  );

  const hasVariants = product.variants?.length > 0;

  function handleAddToCart(e) {
    if (hasVariants) return; // let the card's Link navigate to the product page to pick one
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  }

  function handleWishlist(e) {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleWishlist(product.slug);
    setWishlisted(added);
  }

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group relative shrink-0 w-36 sm:w-40 md:w-44 rounded-xl overflow-hidden bg-mall-800 hover:ring-2 hover:ring-mall-accent transition flex flex-col"
    >
      {/* ── Image ─────────────────────────────────────────────────── */}
      <div className="aspect-square overflow-hidden bg-mall-700 relative">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBasket size={28} className="text-cream/20" />
          </div>
        )}

        {/* Badge — top left */}
        {product.badge && (
          <span className="absolute top-2 left-2 font-mono-tag text-[9px] uppercase bg-mall-accent text-mall-900 px-1.5 py-0.5 rounded-full font-semibold z-10">
            {product.badge.replace(/-/g, " ")}
          </span>
        )}

        {/* Wishlist heart — top right */}
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition ${
            wishlisted
              ? "bg-red-500 text-white"
              : "bg-mall-900/60 backdrop-blur-sm text-cream/60 hover:text-red-400"
          }`}
        >
          <Heart size={12} fill={wishlisted ? "currentColor" : "none"} />
        </button>

        {/* Cart icon — bottom right of image */}
        <button
          onClick={handleAddToCart}
          aria-label="Add to cart"
          className="absolute bottom-2 right-2 z-10 w-8 h-8 rounded-full bg-mall-900/80 backdrop-blur-sm text-cream hover:bg-mall-accent hover:text-mall-900 flex items-center justify-center transition shadow-lg"
        >
          <ShoppingBag size={14} />
        </button>
      </div>

      {/* ── Info ──────────────────────────────────────────────────── */}
      <div className="p-2.5 sm:p-3 flex flex-col gap-1 flex-1">
        {/* Brand */}
        {product.brand && (
          <p className="font-mono-tag text-[9px] uppercase text-mall-accent/70 tracking-wide leading-none">
            {product.brand}
          </p>
        )}

        {/* Name */}
        <p className="text-cream text-[11px] sm:text-xs font-medium line-clamp-2 leading-tight">
          {product.name}
        </p>

        {/* Shop tag */}
        {product.shop && (
          <p className="text-cream/30 text-[9px] font-mono-tag leading-none">
            Shop #{product.shop.shopNumber} · Floor {product.shop.floor?.floorNumber}
          </p>
        )}

        {/* Price */}
        <div className="mt-0.5">
          <span className="font-display text-sm text-cream">
            KSh {product.price?.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="ml-1.5 text-cream/40 text-[9px] line-through">
              {product.compareAtPrice?.toLocaleString()}
            </span>
          )}
        </div>

        {/* Two action buttons */}
        <div className="grid grid-cols-2 gap-1.5 mt-auto pt-2">
          <button
            onClick={handleAddToCart}
            className="flex items-center justify-center gap-1 bg-mall-accent text-mall-900 text-[10px] font-semibold py-1.5 rounded-lg hover:bg-mall-accentDark transition"
          >
            <ShoppingBag size={10} /> Order
          </button>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1 bg-[#25D366]/15 text-[#25D366] text-[10px] font-semibold py-1.5 rounded-lg hover:bg-[#25D366] hover:text-white transition"
          >
            <WhatsAppIcon size={10} /> WhatsApp
          </a>
        </div>
      </div>
    </Link>
  );
}