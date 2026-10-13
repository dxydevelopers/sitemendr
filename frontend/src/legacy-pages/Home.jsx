import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Zap, Star, Shirt, Cpu, Sparkles,
  ShoppingBasket, Sofa, Dumbbell, Blocks, Gem,
  BookOpen, Wrench, ChevronLeft, Flame, Package,
  TrendingUp, Lock, Store, Target,
  Briefcase, Gamepad2, Plane, Activity,
  Award, Heart, Tag, Gift, Crown, ThumbsUp, ShoppingBag,
} from "lucide-react";
import api from "../api/client";
import StripProductCard from "../components/StripProductCard";
import { getHomeCache, setHomeCache } from "../utils/homeCache";
import { useSettings } from "../context/SettingsContext";

// Matches the icon whitelist admins pick from in AdminBadges.jsx — a badge's
// saved icon name resolves here to the actual component. Falls back to Tag
// for anything unrecognized (e.g. an option removed after being saved).
const BADGE_ICON_BY_NAME = {
  Star, Flame, Gem, Lock, Package, TrendingUp, Sparkles, Zap,
  Award, Heart, Tag, Gift, Crown, ThumbsUp, ShoppingBag,
};
const SECTION_PADDING = "px-4 sm:px-6";

// ─── Zone video background ────────────────────────────────────────────────────
// NOTE: `src` should point at a self-hosted, full-resolution (720p/1080p) mp4.
// Don't hotlink assets.mixkit.co "-360" files — those are Mixkit's low-res
// hover-preview thumbnails, not the real clips, which is why they look
// blurry and play back looking sped up. Download the real file from the
// clip's page on mixkit.co and host it yourself.
function ZoneBg({ src, poster, overlay = "bg-mall-900/60" }) {
  const videoRef = useRef(null);

  useEffect(() => {
    // Defensive: make sure nothing is altering playback speed.
    if (videoRef.current) videoRef.current.playbackRate = 1;
  }, [src]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <video
        ref={videoRef}
        autoPlay muted loop playsInline
        className="w-full h-full object-cover"
        poster={poster}
      >
        <source src={src} type="video/mp4" />
      </video>
      <div className={`absolute inset-0 ${overlay}`} />
    </div>
  );
}

// ─── Still-photo accent background ─────────────────────────────────────────────
// A quiet, non-moving alternative to ZoneBg — for a section that deserves a
// photographic moment without adding another layer of motion to the page.
function PhotoBg({ src, overlay = "bg-mall-900/75" }) {
  return (
    <div className="absolute inset-0 -z-[1] overflow-hidden rounded-2xl">
      <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
      <div className={`absolute inset-0 ${overlay}`} />
    </div>
  );
}

// ─── Floor icons ──────────────────────────────────────────────────────────────
const FLOOR_ICONS = {
  1: Shirt, 2: Cpu, 3: Sparkles, 4: ShoppingBasket,
  5: Sofa, 6: Dumbbell, 7: Blocks, 8: Gem, 9: BookOpen, 10: Wrench,
};

// ─── Product strip ────────────────────────────────────────────────────────────
function ProductStrip({ products }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  if (!products.length) return null;
  return (
    <div className="relative -mx-4 sm:mx-0">
      <button onClick={() => scroll(-1)} aria-label="Scroll left"
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 rounded-full bg-mall-900/80 text-cream border border-cream/10 shadow-lg items-center justify-center hover:bg-mall-900 transition">
        <ChevronLeft size={18} />
      </button>
      <div ref={ref} className="flex gap-2.5 sm:gap-3 overflow-x-auto px-4 sm:px-0 pb-3"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
        {products.map((p) => <StripProductCard key={p._id} product={p} />)}
        <div className="shrink-0 w-2 sm:hidden" />
      </div>
      <button onClick={() => scroll(1)} aria-label="Scroll right"
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 rounded-full bg-mall-900/80 text-cream border border-cream/10 shadow-lg items-center justify-center hover:bg-mall-900 transition">
        <ChevronLeft size={18} className="rotate-180" />
      </button>
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ icon: Icon, label, tag, linkTo }) {
  return (
    <div className="flex items-center justify-between mb-4 sm:mb-5">
      <div className="flex items-center gap-2 flex-wrap">
        <Icon size={16} className="text-mall-accent shrink-0" />
        <h2 className="font-display text-lg sm:text-xl md:text-2xl text-cream">{label}</h2>
        {tag && <span className="font-mono-tag text-[9px] uppercase bg-mall-orange/20 text-mall-orange px-2 py-0.5 rounded-full">{tag}</span>}
      </div>
      {linkTo && (
        <Link to={linkTo} className="flex items-center gap-1 text-xs text-cream/50 hover:text-mall-accent transition shrink-0 ml-2">
          See all <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}

// ─── Homepage section ───────────────────────────────────────────────────────
// One of these renders per entry in AdminHomeSections.jsx, in admin-set
// order — replaces what used to be 6 hand-written badge sections plus a
// separately hardcoded Featured Shop. `section.products` is attached by
// the fetch effect below; everything else comes straight from the backend.
function HomeSectionBlock({ section }) {
  if (section.type === "featured-shop") {
    return (
      <section className="py-10 sm:py-14 relative z-10">
        <div className={SECTION_PADDING}>
          <SectionHeading
            icon={Store}
            label={section.heading || "Featured Shop"}
            tag={section.tag || "Spotlight"}
            linkTo={section.shop ? `/shop/${section.shop.slug}` : undefined}
          />
          <div className="relative rounded-2xl p-3 sm:p-5">
            <PhotoBg
              src="https://images.pexels.com/photos/27677152/pexels-photo-27677152.jpeg?auto=compress&cs=tinysrgb&h=1080&fit=crop&w=1920"
              overlay="bg-mall-900/78"
            />
            <FeaturedShop shop={section.shop} products={section.products} />
          </div>
        </div>
      </section>
    );
  }

  if (section.type === "featured-category") {
    return (
      <section className="py-10 sm:py-14 relative z-10">
        <div className={SECTION_PADDING}>
          <SectionHeading
            icon={Tag}
            label={section.heading || `Featured: ${section.category}`}
            tag={section.tag}
            linkTo={`/collection/${encodeURIComponent(section.category)}`}
          />
        </div>
        <div className={SECTION_PADDING}><ProductStrip products={section.products} /></div>
      </section>
    );
  }

  // type === "badge"
  const Icon = BADGE_ICON_BY_NAME[section.badge?.icon] || Tag;
  return (
    <section className="py-10 sm:py-14 relative z-10">
      <div className={SECTION_PADDING}>
        <SectionHeading
          icon={Icon}
          label={section.heading || section.badge?.sectionHeading}
          tag={section.tag || section.badge?.sectionTag}
          linkTo={section.badge ? `/search?badge=${section.badge.slug}` : undefined}
        />
      </div>
      <div className={SECTION_PADDING}><ProductStrip products={section.products} /></div>
    </section>
  );
}

// ─── Floor card ───────────────────────────────────────────────────────────────
function FloorCard({ floor, variant = "normal" }) {
  const Icon = FLOOR_ICONS[floor.floorNumber] || Cpu;
  const aspectClass = { hero: "aspect-[16/9] sm:aspect-[21/9]", normal: "aspect-[4/3]", small: "aspect-[4/3]" }[variant];
  return (
    <Link to={`/floor/${floor.slug}`}
      className={`group relative rounded-xl sm:rounded-2xl overflow-hidden bg-mall-800/80 backdrop-blur-sm hover:ring-2 hover:ring-mall-accent transition block w-full ${aspectClass}`}>
      {floor.image ? (
        <img src={floor.image} alt={floor.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-mall-800 to-mall-700" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="w-5 h-5 rounded-md bg-mall-accent/20 flex items-center justify-center shrink-0">
            <Icon size={10} className="text-mall-accent" />
          </span>
          <span className="font-mono-tag text-[9px] text-mall-orange uppercase tracking-widest">Floor {floor.floorNumber}</span>
        </div>
        <h3 className={`font-display text-cream leading-tight ${variant === "hero" ? "text-base sm:text-xl md:text-2xl" : "text-sm sm:text-base"}`}>{floor.name}</h3>
        <p className="text-cream/50 text-[10px] mt-0.5 font-mono-tag">{floor.shopCount} {floor.shopCount === 1 ? "shop" : "shops"}</p>
      </div>
      <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition">
        <ArrowRight size={12} className="text-cream/0 group-hover:text-cream transition" />
      </div>
    </Link>
  );
}

function FloorShowcase({ floors, shopsByFloor }) {
  const activeFloors = floors.map((f) => ({ ...f, shopCount: (shopsByFloor[f._id] || []).length })).filter((f) => f.shopCount > 0);
  if (activeFloors.length === 0) return null;
  const [hero, ...rest] = activeFloors;
  const pair = rest.slice(0, 2);
  const grid = rest.slice(2);
  return (
    <div className="space-y-2.5 sm:space-y-3">
      <FloorCard floor={hero} variant="hero" />
      {pair.length > 0 && (
        <div className={`grid gap-2.5 sm:gap-3 ${pair.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {pair.map((f) => <FloorCard key={f._id} floor={f} variant="normal" />)}
        </div>
      )}
      {grid.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {grid.map((f) => <FloorCard key={f._id} floor={f} variant="small" />)}
        </div>
      )}
    </div>
  );
}

// ─── Purpose tiles ────────────────────────────────────────────────────────────
const PURPOSES = [
  { tag: "work",    label: "Work",    icon: Briefcase, color: "#0096D6", bg: "from-blue-900/80"    },
  { tag: "gaming",  label: "Gaming",  icon: Gamepad2,  color: "#FF6900", bg: "from-orange-900/80"  },
  { tag: "travel",  label: "Travel",  icon: Plane,     color: "#00C853", bg: "from-emerald-900/80" },
  { tag: "home",    label: "Home",    icon: Activity,  color: "#E8A33D", bg: "from-amber-900/80"   },
  { tag: "fitness", label: "Fitness", icon: Activity,  color: "#CC0000", bg: "from-red-900/80"     },
];

function PurposeTile({ purpose }) {
  const Icon = purpose.icon;
  return (
    <Link to={`/search?purpose=${purpose.tag}`}
      className={`group relative rounded-xl overflow-hidden bg-gradient-to-b ${purpose.bg} to-mall-900/90 border border-cream/10 hover:border-mall-accent transition p-4 sm:p-5 flex flex-col gap-3 min-h-[100px] sm:min-h-[120px] backdrop-blur-sm`}>
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${purpose.color}20` }}>
        <Icon size={16} style={{ color: purpose.color }} />
      </div>
      <div>
        <p className="font-display text-cream text-sm sm:text-base">{purpose.label}</p>
        <p className="text-cream/40 text-[10px] font-mono-tag uppercase tracking-wide mt-0.5">Shop by purpose</p>
      </div>
      <ArrowRight size={12} className="text-cream/0 group-hover:text-mall-accent transition absolute bottom-3 right-3" />
    </Link>
  );
}

// ─── Featured shop ────────────────────────────────────────────────────────────
function FeaturedShop({ shop, products }) {
  if (!shop) return null;
  const Icon = FLOOR_ICONS[shop.floor?.floorNumber] || Store;
  return (
    <div className="bg-mall-900/70 backdrop-blur-sm rounded-2xl overflow-hidden border border-cream/10">
      <div className="relative h-32 sm:h-44 overflow-hidden bg-mall-700">
        {shop.banner ? (
          <img src={shop.banner} alt={shop.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-mall-700 to-mall-900 flex items-center justify-center">
            <Store size={40} className="text-cream/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-mall-900/80 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-4 flex items-center gap-2">
          <span className="font-mono-tag text-[9px] bg-mall-orange text-mall-900 px-2 py-0.5 rounded-full uppercase font-semibold">Shop #{shop.shopNumber}</span>
          <span className="font-mono-tag text-[9px] text-cream/60 uppercase"><Icon size={9} className="inline mr-1" />Floor {shop.floor?.floorNumber}</span>
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-display text-cream text-lg sm:text-xl">{shop.name}</h3>
            <p className="text-cream/50 text-xs mt-0.5 line-clamp-1">{shop.description}</p>
          </div>
          <Link to={`/shop/${shop.slug}`} className="shrink-0 flex items-center gap-1.5 bg-mall-accent text-mall-900 text-xs font-semibold px-3 py-2 rounded-full hover:bg-mall-accentDark transition whitespace-nowrap">
            Visit Shop <ArrowRight size={12} />
          </Link>
        </div>
        {products.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {products.slice(0, 6).map((p) => (
              <Link key={p._id} to={`/product/${p.slug}`} className="shrink-0 w-16 sm:w-20 rounded-lg overflow-hidden bg-mall-700 hover:ring-1 hover:ring-mall-accent transition">
                <div className="aspect-square overflow-hidden">
                  {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package size={14} className="text-cream/20" /></div>}
                </div>
                <p className="text-cream/70 text-[9px] px-1 py-1 line-clamp-1">{p.name}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mall stats ───────────────────────────────────────────────────────────────
function MallStats({ floors, shops, products }) {
  const stats = [
    { value: floors, label: "Floors" },
    { value: shops, label: "Shops Open" },
    { value: products, label: "Products" },
    { value: "24/7", label: "Always Open" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((s, i) => (
        <div key={i} className="bg-mall-900/60 backdrop-blur-sm border border-cream/10 rounded-xl p-4 sm:p-5 text-center">
          <p className="font-display text-2xl sm:text-3xl md:text-4xl text-mall-accent mb-1">{s.value}</p>
          <p className="font-mono-tag text-[10px] uppercase text-cream/40 tracking-widest">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Hero slideshow ───────────────────────────────────────────────────────────
const HERO_SLIDES = [
  { line: "One cart. Every brand you want.", cta: "Explore the mall", to: "/directory" },
  { line: "Flash deals worth moving quickly for.", cta: "Shop the deals", to: "/search?flashSale=true" },
  { line: "A calmer, cleaner way to browse the mall.", cta: "Open the edit", to: "/directory" },
  { line: "Curated brands. Current finds. Zero clutter.", cta: "Browse collections", to: "/search" },
];

function SlideTypewriter({ text }) {
  const [displayed, setDisplayed] = useState("");
  const timeoutRef = useRef(null);
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    function tick() { i += 1; setDisplayed(text.slice(0, i)); if (i < text.length) timeoutRef.current = setTimeout(tick, 56); }
    timeoutRef.current = setTimeout(tick, 480);
    return () => clearTimeout(timeoutRef.current);
  }, [text]);
  return <span>{displayed}<span className="inline-block w-[2px] h-6 sm:h-8 md:h-10 bg-mall-accent ml-1 align-middle animate-pulse" /></span>;
}

function HeroSlideshow({ homeSections }) {
  // Two generic slides built from whichever non-shop sections exist right
  // now (in admin order), plus a dedicated slide for the featured shop if
  // one is set — all fully dynamic, none of it hardcoded to a specific
  // badge/shop/category that could go stale if an admin changes it.
  const featuredShopSection = homeSections.find((s) => s.type === "featured-shop" && s.shop);
  const dynamicSlides = homeSections
    .filter((s) => s.type !== "featured-shop")
    .slice(0, 2)
    .map((s) => {
      const isBadge = s.type === "badge";
      const heading = s.heading || (isBadge ? s.badge?.sectionHeading : `Featured: ${s.category}`);
      const ctaLabel = isBadge ? s.badge?.chipLabel : s.category;
      const to = isBadge ? `/search?badge=${s.badge?.slug}` : `/collection/${encodeURIComponent(s.category)}`;
      return { line: `${heading} — worth a closer look.`, cta: `See ${(ctaLabel || "").toLowerCase()}`, to };
    });
  const slides = [
    ...HERO_SLIDES,
    ...dynamicSlides,
    ...(featuredShopSection ? [{ line: `Featured: ${featuredShopSection.shop.name} — a sharper edit of what's in store.`, cta: "Visit the shop", to: `/shop/${featuredShopSection.shop.slug}` }] : []),
  ];
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  useEffect(() => {
    if (slides.length <= 1) return;
    const duration = Math.min(12000, 6200 + slides[index].line.length * 70);
    timerRef.current = setTimeout(() => setIndex((i) => (i + 1) % slides.length), duration);
    return () => clearTimeout(timerRef.current);
  }, [index, slides.length]);

  return (
    <div className="relative z-10 max-w-xl px-4 sm:px-6 py-32 sm:py-40 md:py-48">
      <h1 className="font-display text-2xl sm:text-4xl md:text-5xl text-cream leading-[1.15] tracking-tight mb-4 sm:mb-6 min-h-[3.6em] sm:min-h-[2.4em] drop-shadow-lg">
        <SlideTypewriter text={slides[index].line} key={index} />
      </h1>
      <Link to={slides[index].to} className="group inline-flex items-center gap-2 bg-mall-accent text-mall-900 text-sm font-semibold px-5 py-3 rounded-full hover:bg-mall-accentDark transition">
        {slides[index].cta} <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
      </Link>
      {/* Slide dots */}
      <div className="flex gap-1.5 mt-8">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)}
            className={`h-0.5 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-mall-accent" : "w-2 bg-cream/30"}`} />
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const { settings } = useSettings();
  const [floors, setFloors] = useState([]);
  const [shops, setShops] = useState([]);
  const [shopsByFloor, setShopsByFloor] = useState({});
  const [allProducts, setAllProducts] = useState([]);
  const [totalProductCount, setTotalProductCount] = useState(0);
  const [flashSale, setFlashSale] = useState([]);
  const [homeSections, setHomeSections] = useState([]);
  const [loading, setLoading] = useState(() => !getHomeCache());
  const [loadError, setLoadError] = useState(false);

  // Applies a fully-fetched data bundle to state. Shared by the cache-hit
  // path and the fresh-fetch path so they can't drift out of sync.
  function applyData(bundle) {
    setFloors(bundle.floors);
    setShops(bundle.shops);
    setAllProducts(bundle.allProducts);
    setTotalProductCount(bundle.totalProductCount ?? bundle.allProducts.length);
    setShopsByFloor(bundle.shopsByFloor);
    setFlashSale(bundle.flashSale);
    setHomeSections(bundle.homeSections || []);
  }

  useEffect(() => {
    // Already fetched once this session — render immediately, no spinner,
    // no refetch. This is what makes navigating back to Home instant.
    const cached = getHomeCache();
    if (cached) {
      applyData(cached);
      setLoading(false);
      return;
    }

    // Homepage layout is fully admin-managed now (see AdminHomeSections.jsx)
    // — fetch the section list first, since we need to know each one's
    // type and reference before we know which product fetch it needs.
    api.get("/home-sections").then((sectionsRes) => {
      // A section can outlive what it points to — its badge, shop, or
      // category may have been deleted since. Drop those here rather than
      // let a missing reference turn into an unfiltered "all products"
      // fetch below (undefined badge/shop/category params match everything).
      const sectionConfigs = sectionsRes.data.filter((s) =>
        (s.type === "badge" && s.badge) ||
        (s.type === "featured-shop" && s.shop) ||
        (s.type === "featured-category" && s.category)
      );

      return Promise.all([
        api.get("/floors"),
        api.get("/shops"),
        api.get("/products", { params: { flashSale: true, limit: 12 } }),
        api.get("/products", { params: { limit: 100 } }),
        ...sectionConfigs.map((s) => {
          if (s.type === "badge") return api.get("/products", { params: { badge: s.badge?.slug, limit: 12 } });
          if (s.type === "featured-shop") return api.get("/products", { params: { shop: s.shop?._id, limit: 12 } });
          return api.get("/products", { params: { category: s.category, limit: 12 } }); // featured-category
        }),
      ]).then(([floorsRes, shopsRes, flashRes, allRes, ...sectionResults]) => {
        const grouped = {};
        shopsRes.data.forEach((shop) => { const fid = shop.floor?._id; if (!grouped[fid]) grouped[fid] = []; grouped[fid].push(shop); });

        // Flash Sale takes priority — a product already shown there shouldn't
        // repeat further down the page in another section.
        const flashSaleProducts = flashRes.data.products;
        const flashSaleIds = new Set(flashSaleProducts.map((p) => p._id));
        const excludeFlashSale = (list) => list.filter((p) => !flashSaleIds.has(p._id));

        // One entry per admin-managed homepage section, in admin-set order.
        // A section with no matching products right now just doesn't render
        // — same as badges always did, now true for shop/category sections too.
        const homeSectionsResult = sectionConfigs
          .map((s, i) => ({ ...s, products: excludeFlashSale(sectionResults[i].data.products || []) }))
          .filter((s) => s.products.length > 0);

        const bundle = {
          floors: floorsRes.data,
          shops: shopsRes.data,
          allProducts: allRes.data.products,
          totalProductCount: allRes.data.total,
          shopsByFloor: grouped,
          flashSale: flashSaleProducts,
          homeSections: homeSectionsResult,
        };

        applyData(bundle);
        setHomeCache(bundle);
      });
    }).catch(() => {
      setLoadError(true);
    }).finally(() => setLoading(false));
  }, []);

  const activeFloorCount = floors.filter((f) => (shopsByFloor[f._id] || []).length > 0).length;
  const si = SECTION_PADDING;

  // Wait for everything together instead of letting the Hero render
  // immediately while product sections pop in piecemeal underneath it —
  // one clean loading state, then the whole page appears fully populated.
  if (loading) {
    return (
      <div className="bg-mall-900 min-h-screen flex items-center justify-center">
        <img
          src="/pics/azard-stores.png"
          alt="Azard Stores"
          className="w-40 sm:w-56 object-contain animate-pulse"
        />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-mall-900 min-h-screen flex items-center justify-center px-4">
        <div className="flex flex-col items-center text-center gap-3">
          <p className="text-cream/60 text-sm">Something went wrong loading the mall.</p>
          <button
            onClick={() => window.location.reload()}
            className="text-mall-accent text-sm font-medium hover:text-mall-accentDark transition"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-mall-900 min-h-screen">

      {/* ══════════════════════════════════════════════════════════════
          ZONE 1 — THE ARRIVAL
          Video: People walking inside a shopping mall
          Covers: Hero + Flash Sale + Mall Stats
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative">
        <ZoneBg
          src="https://videos.pexels.com/video-files/4750056/4750056-hd_1920_1080_25fps.mp4"
          poster="https://images.pexels.com/videos/4750056/pexels-photo-4750056.jpeg?auto=compress&cs=tinysrgb&h=1080&fit=crop&w=1920"
          overlay="bg-mall-900/65"
        />
        {/* Bottom fade into next zone */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-mall-900 to-transparent pointer-events-none z-0" />

        {/* Hero slideshow */}
        <HeroSlideshow homeSections={homeSections} />

        {/* Flash Sale */}
        {!loading && flashSale.length > 0 && (
          <section className="pb-10 sm:pb-14 relative z-10">
            <div className={si}><SectionHeading icon={Zap} label="Flash Sale" tag="Limited time" linkTo="/search?flashSale=true" /></div>
            <div className={si}><ProductStrip products={flashSale} /></div>
          </section>
        )}

        {/* Mall Stats */}
        {!loading && (
          <section className="pb-16 sm:pb-20 relative z-10">
            <div className={si}>
              <MallStats floors={activeFloorCount} shops={shops.length} products={totalProductCount} />
            </div>
          </section>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ZONE 2 — THE CORRIDORS (no video — calm content zone)
          Covers: Floor Jump Strip + Shop by Purpose + Explore Floors
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative">
        {/* Floor Jump */}
        {!loading && activeFloorCount > 0 && (
          <section className="py-8 sm:py-10 relative z-10">
            <div className={si}>
              <div className="flex items-baseline justify-between mb-4 sm:mb-5">
                <h2 className="font-display text-sm sm:text-base text-cream font-medium">Jump to a floor</h2>
                <Link to="/directory" className="text-xs text-cream/40 hover:text-mall-accent transition shrink-0 ml-3">Full directory →</Link>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {floors.filter((f) => (shopsByFloor[f._id] || []).length > 0).map((floor) => (
                  <Link key={floor._id} to={`/floor/${floor.slug}`}
                    className="shrink-0 flex items-center gap-2 bg-mall-900/60 backdrop-blur-sm border border-cream/10 rounded-full px-3.5 py-2 hover:border-mall-accent transition">
                    <span className="font-mono-tag text-[10px] text-mall-orange">{String(floor.floorNumber).padStart(2, "0")}</span>
                    <span className="text-cream text-xs">{floor.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Shop by Purpose */}
        <section className="py-10 sm:py-14 relative z-10">
          <div className={si}>
            <SectionHeading icon={Target} label="Shop by Purpose" tag="Find what fits your life" linkTo="/search" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3">
              {PURPOSES.map((p) => <PurposeTile key={p.tag} purpose={p} />)}
            </div>
          </div>
        </section>

        {/* Explore Floors */}
        {!loading && activeFloorCount > 0 && (
          <section className="py-10 sm:py-14 relative z-10">
            <div className={si}>
              <div className="relative rounded-2xl px-4 py-6 sm:px-6 sm:py-8 mb-4 sm:mb-5 flex items-start justify-between overflow-hidden">
                <PhotoBg
                  src="https://images.pexels.com/photos/32340449/pexels-photo-32340449.jpeg?auto=compress&cs=tinysrgb&h=1080&fit=crop&w=1920"
                  overlay="bg-mall-900/72"
                />
                <div>
                  <p className="font-mono-tag text-[10px] uppercase text-mall-orange tracking-widest mb-0.5">{activeFloorCount} of {floors.length} floors open</p>
                  <h2 className="font-display text-lg sm:text-xl md:text-2xl text-cream">Explore the Mall</h2>
                </div>
                <Link to="/directory" className="flex items-center gap-1 text-xs text-cream/50 hover:text-mall-accent transition shrink-0 ml-3 mt-1">
                  Full directory <ArrowRight size={12} />
                </Link>
              </div>
              <FloorShowcase floors={floors} shopsByFloor={shopsByFloor} />
            </div>
          </section>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ZONE 3 — INSIDE THE SHOPS (no video — calm content zone)
          Every homepage section (AdminHomeSections.jsx) renders here, in
          admin-set order — badge sections, the featured shop, and featured
          categories are all just entries in one unified, reorderable list.
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative">
        {!loading && homeSections.map((section) => (
          <HomeSectionBlock key={section._id} section={section} />
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ZONE 5 — THE FINALE
          Video: People walking inside the mall (evening energy)
          Covers: Closing statement + Footer entry
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative">
        <ZoneBg
          src="https://videos.pexels.com/video-files/3243946/3243946-uhd_2560_1440_30fps.mp4"
          poster="https://images.pexels.com/videos/3243946/free-video-3243946.jpg?auto=compress&cs=tinysrgb&h=1080&fit=crop&w=1920"
          overlay="bg-mall-900/60"
        />

        {/* Closing statement */}
        <section className="relative z-10 min-h-[60vh] sm:min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-20">
          <p className="font-mono-tag text-[9px] sm:text-[10px] uppercase text-mall-orange/60 tracking-[0.3em] mb-8">Azard Stores</p>
          <h2 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-cream leading-none tracking-tight mb-12">
            The standard<br /><span className="text-mall-accent">has changed.</span>
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
            <Link to="/directory" className="group flex items-center gap-2 text-cream/60 hover:text-cream transition text-sm sm:text-base font-medium">
              <span>Enter the Mall</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
            </Link>
            <span className="hidden sm:block w-px h-4 bg-cream/20" />
            <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer"
              className="group flex items-center gap-2 text-cream/60 hover:text-cream transition text-sm sm:text-base font-medium">
              <span>Chat on WhatsApp</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
            </a>
          </div>
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono-tag text-[9px] uppercase text-cream/15 tracking-widest whitespace-nowrap">
            The Whole Mall. One Cart. Zero Hassle.
          </p>
        </section>
      </div>

    </div>
  );
}