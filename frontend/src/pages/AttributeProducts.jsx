import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Package, Tag } from "lucide-react";
import api from "../api/client";
import Breadcrumbs from "../components/Breadcrumbs";
import StripProductCard from "../components/StripProductCard";

// ─── Browse-by-attribute page ──────────────────────────────────────────────────
// Used for both /brand/:name and /category/:name — "attribute" tells it which
// product field to match against ("brand" or "subcategory"). The backend
// filters exactly (case-insensitively) on this field, so unlike the old
// version of this page, results aren't capped by however many products
// happened to fit in one over-fetched batch.
export default function AttributeProducts({ attribute, label }) {
  const { name } = useParams();
  // React Router already URL-decodes route params, so use it as-is.
  // (Re-decoding here would throw on names containing a literal "%".)
  const decoded = (name || "").trim();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    setProducts([]);
    setPage(1);
    window.scrollTo(0, 0);
    api.get("/products", { params: { [attribute]: decoded, limit: 40, page: 1 } })
      .then((res) => {
        setProducts(res.data.products || []);
        setTotalPages(res.data.pages || 1);
        setTotal(res.data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [attribute, decoded]);

  function loadMore() {
    setLoadingMore(true);
    const nextPage = page + 1;
    api.get("/products", { params: { [attribute]: decoded, limit: 40, page: nextPage } })
      .then((res) => {
        setProducts((prev) => [...prev, ...(res.data.products || [])]);
        setPage(nextPage);
      })
      .finally(() => setLoadingMore(false));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-mall-900 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-mall-accent/30 border-t-mall-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mall-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Breadcrumbs */}
        <Breadcrumbs crumbs={[
          { label: "Home", to: "/" },
          { label: "Directory", to: "/directory" },
          { label: decoded },
        ]} />

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="mt-6 mb-8 sm:mb-10 pb-8 border-b border-cream/10">
          <p className="font-mono-tag text-[10px] uppercase text-mall-orange tracking-widest mb-2">
            {label}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-cream leading-tight mb-3">
            {decoded}
          </h1>
          <div className="flex items-center gap-1.5 text-cream/50 text-sm">
            <Package size={13} className="text-mall-accent shrink-0" />
            <span>{total} product{total !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* ── Products ───────────────────────────────────────────────── */}
        {products.length === 0 ? (
          <div className="py-20 text-center">
            <Tag size={40} className="text-cream/20 mx-auto mb-3" />
            <p className="text-cream/40 font-display text-xl">No products found</p>
            <p className="text-cream/30 text-sm mt-1">
              Nothing matches this {label.toLowerCase()} right now.
            </p>
            <Link to="/directory" className="inline-block mt-4 text-mall-accent hover:underline text-sm">
              Browse the mall →
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {products.map((p) => <StripProductCard key={p._id} product={p} />)}
            </div>
            {page < totalPages && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-full border border-cream/15 text-cream/70 text-sm font-medium hover:border-mall-accent hover:text-cream transition disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : `Load more (${products.length} of ${total})`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}