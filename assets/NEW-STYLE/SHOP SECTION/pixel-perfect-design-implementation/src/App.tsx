import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, PackageSearch } from "lucide-react";
import Header from "./components/Header";
import ProductCard from "./components/ProductCard";
import { faNum, products, type Product } from "./data/products";
import silkBg from "./assets/silk-bg.jpg";

type FilterId = "all" | "stock" | "new" | "cheap" | "expensive" | "special";

const filters: { id: FilterId; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "stock", label: "فقط قابل خرید" },
  { id: "new", label: "جدیدترین" },
  { id: "cheap", label: "ارزان‌ترین" },
  { id: "expensive", label: "گران‌ترین" },
  { id: "special", label: "پیشنهاد ویژه" },
];

export default function App() {
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");
  const [cartCount, setCartCount] = useState(1);
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  const scroller = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number | null>(null);

  const list = useMemo(() => {
    let out = [...products];
    const q = query.trim().toLowerCase();
    if (q) out = out.filter((p) => p.name.toLowerCase().includes(q));
    switch (filter) {
      case "stock":
        out = out.filter((p) => p.inStock);
        break;
      case "new":
        out = out.filter((p) => p.isNew).sort((a, b) => b.addedAt - a.addedAt);
        break;
      case "cheap":
        out.sort((a, b) => a.price - b.price);
        break;
      case "expensive":
        out.sort((a, b) => b.price - a.price);
        break;
      case "special":
        out = out.filter((p) => p.badge === "special");
        break;
    }
    return out;
  }, [filter, query]);

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const step = 288;
    const count = max > 10 ? Math.round(max / step) + 1 : 1;
    setPages(count);
    setPage(max > 10 ? Math.min(count - 1, Math.round(el.scrollLeft / step)) : 0);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, list]);

  useEffect(() => {
    scroller.current?.scrollTo({ left: 0 });
    setPage(0);
  }, [filter, query]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const step = 288;
    setPage(Math.round(el.scrollLeft / step));
  };

  const goPage = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const target = Math.min(max, Math.max(0, i * 288));
    el.scrollTo({ left: target, behavior: "smooth" });
  };

  const next = () => goPage(page >= pages - 1 ? 0 : page + 1);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const handleAdd = (p: Product) => {
    setCartCount((c) => c + 1);
    showToast(`${p.name} به سبد خرید اضافه شد`);
  };

  const toggleWish = (id: number) => {
    setWishlist((prev) => {
      const nxt = new Set(prev);
      if (nxt.has(id)) nxt.delete(id);
      else nxt.add(id);
      return nxt;
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ---- ambient background ---- */}
      <div className="fixed inset-0 -z-10">
        <img src={silkBg} alt="" className="kenburns h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-wine-950/55 via-wine-950/10 to-wine-950/70" />
        <div className="glow-pulse absolute -top-32 right-[12%] h-[420px] w-[420px] rounded-full bg-wine-500/25 blur-[120px]" />
        <div
          className="glow-pulse absolute bottom-[-140px] left-[6%] h-[380px] w-[380px] rounded-full bg-cream-200/10 blur-[110px]"
          style={{ animationDelay: "3s" }}
        />
      </div>

      {/* ---- blurred foliage ---- */}
      <div className="plant-sway pointer-events-none absolute -bottom-10 -left-14 z-20 hidden opacity-80 blur-[5px] md:block">
        <Foliage />
      </div>

      <div className="relative z-10 pt-6 pb-10">
        <Header cartCount={cartCount} query={query} onQuery={setQuery} />

        <main className="relative mx-auto mt-7 w-full max-w-[1280px] px-4 sm:px-6">
          {/* breadcrumb */}
          <nav className="reveal flex items-center gap-2 text-[12.5px] font-medium text-cream-100/60" style={{ animationDelay: "0.1s" }}>
            <a href="#" className="transition-colors hover:text-cream-50">خانه</a>
            <span className="text-cream-100/30">/</span>
            <a href="#" className="transition-colors hover:text-cream-50">فروشگاه</a>
            <span className="text-cream-100/30">/</span>
            <span className="text-cream-100/90">محصولات سامسونگ</span>
          </nav>

          {/* calligraphy flourish */}
          <div className="pointer-events-none absolute top-24 left-[3%] hidden w-[340px] lg:block xl:left-[5%]">
            <div className="reveal float-y -rotate-6" style={{ animationDelay: "0.7s" }}>
              <p className="font-nasta text-[26px] leading-[2.1] text-cream-50/95 xl:text-[30px]">
                کیفیت، اعتبار، همراهی همیشگی
              </p>
              <svg viewBox="0 0 320 64" className="mt-1 w-[300px]" fill="none">
                <path
                  d="M8 30 C 80 50 240 50 312 22"
                  stroke="#f4ece2"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  className="draw-line"
                />
                <path
                  d="M52 40 C 120 52 200 52 268 38"
                  stroke="#f4ece2"
                  strokeWidth="1"
                  strokeLinecap="round"
                  opacity="0.45"
                />
                <path
                  d="M160 20c-3.2-6.4-13-5.2-13 2.2 0 6 13 13 13 13s13-7 13-13c0-7.4-9.8-8.6-13-2.2z"
                  fill="#f4ece2"
                />
                <circle cx="26" cy="33" r="2.2" fill="#f4ece2" opacity="0.8" />
                <circle cx="296" cy="27" r="2.2" fill="#f4ece2" opacity="0.8" />
              </svg>
            </div>
          </div>

          {/* heading */}
          <section className="max-w-2xl text-right">
            <p className="reveal text-[12px] font-bold tracking-[0.35em] text-cream-100/55" style={{ animationDelay: "0.18s" }}>
              BRAND
            </p>
            <h1 className="reveal mt-2 text-[34px] leading-tight font-black text-cream-50 sm:text-[42px]" style={{ animationDelay: "0.26s" }}>
              محصولات سامسونگ
            </h1>
            <p className="reveal mt-3 text-[14.5px] leading-7 text-cream-100/70" style={{ animationDelay: "0.34s" }}>
              سامسونگ — {faNum(list.length)} محصول از فروشگاه حامی همراه در دسترس.
            </p>
            <p className="reveal mt-1 text-[13px] font-semibold text-cream-100/60" style={{ animationDelay: "0.4s" }}>
              {faNum(list.length)} محصول
            </p>
            <p className="reveal mt-1 text-[12.5px] text-cream-100/45" style={{ animationDelay: "0.46s" }}>
              قیمت‌ها و توضیحات موجودی، به‌روزرسانی تا تاریخ ۱۸ شهریور ۱۴۰۵
            </p>
          </section>

          {/* filters */}
          <div className="reveal mt-7 flex flex-wrap items-center gap-2.5" style={{ animationDelay: "0.52s" }}>
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-5 py-2 text-[12.5px] font-bold transition-all duration-300 active:scale-95 ${
                  filter === f.id
                    ? "bg-gradient-to-l from-wine-600 to-wine-800 text-cream-50 shadow-lg shadow-wine-900/40 ring-1 ring-wine-400/50"
                    : "bg-cream-50/[0.06] text-cream-100/75 ring-1 ring-cream-100/20 backdrop-blur-sm hover:bg-cream-50/[0.14] hover:text-cream-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* carousel */}
          <section className="relative mt-8">
            <div
              ref={scroller}
              onScroll={onScroll}
              dir="ltr"
              className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-3"
            >
              {list.map((p, i) => (
                <ProductCard
                  key={`${filter}-${query}-${p.id}`}
                  product={p}
                  index={i}
                  wished={wishlist.has(p.id)}
                  onWish={toggleWish}
                  onAdd={handleAdd}
                />
              ))}
              {list.length === 0 && (
                <div dir="rtl" className="card-in grid w-full place-items-center rounded-[26px] bg-cream-50/[0.05] py-20 ring-1 ring-cream-100/15">
                  <PackageSearch className="h-10 w-10 text-cream-100/40" />
                  <p className="mt-4 text-[15px] font-bold text-cream-100/70">محصولی با این مشخصات پیدا نشد</p>
                  <button
                    onClick={() => {
                      setFilter("all");
                      setQuery("");
                    }}
                    className="mt-4 rounded-full bg-cream-100 px-5 py-2 text-[12.5px] font-bold text-wine-900 transition-transform hover:scale-105"
                  >
                    نمایش همه محصولات
                  </button>
                </div>
              )}
            </div>

            {/* next arrow */}
            {list.length > 0 && (
              <button
                onClick={next}
                aria-label="اسلاید بعدی"
                className="absolute top-[38%] -right-2 z-20 hidden h-12 w-12 place-items-center rounded-full border border-cream-100/35 bg-wine-950/30 text-cream-50 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-cream-100 hover:text-wine-900 active:scale-95 md:grid xl:-right-5"
              >
                <ArrowRight className="h-5 w-5" strokeWidth={2.2} />
              </button>
            )}
          </section>

          {/* dots */}
          {pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {Array.from({ length: pages }).map((_, i) => (
                <button
                  key={i}
                  aria-label={`صفحه ${i + 1}`}
                  onClick={() => goPage(i)}
                  className={`h-2 rounded-full transition-all duration-400 ${
                    i === page ? "w-7 bg-cream-100" : "w-2 bg-cream-100/30 hover:bg-cream-100/60"
                  }`}
                />
              ))}
            </div>
          )}

          <p className="mt-10 text-center text-[11.5px] text-cream-100/35">
            © ۱۴۰۵ فروشگاه حامی همراه — کیفیت، اعتبار، همراهی همیشگی
          </p>
        </main>
      </div>

      {/* toast */}
      <div
        className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-500 ${
          toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
        }`}
      >
        <div className="flex items-center gap-2.5 rounded-full bg-cream-100 px-5 py-3 text-[13px] font-bold text-wine-900 shadow-pill ring-1 ring-wine-900/10">
          <CheckCircle2 className="h-5 w-5 text-[#1f7a4d]" />
          {toast}
        </div>
      </div>
    </div>
  );
}

/* decorative blurred eucalyptus branch */
function Foliage() {
  const leaves = [
    [26, 150, -38], [52, 128, 30], [44, 104, -34], [74, 86, 34], [66, 60, -30],
    [98, 44, 32], [92, 20, -28], [122, 8, 30], [12, 118, -70], [30, 74, 62],
    [58, 132, -64], [86, 96, 66], [110, 56, -60],
  ] as const;
  return (
    <svg width="230" height="260" viewBox="0 0 230 260" fill="none">
      <path d="M8 258 C 40 200 70 120 128 6" stroke="#2f4a35" strokeWidth="4" strokeLinecap="round" />
      <path d="M28 258 C 60 210 96 150 150 86" stroke="#28402e" strokeWidth="3" strokeLinecap="round" />
      {leaves.map(([x, y, r], i) => (
        <ellipse
          key={i}
          cx={x}
          cy={y}
          rx="20"
          ry="9"
          fill={i % 3 === 0 ? "#3a5a40" : i % 3 === 1 ? "#2f4a35" : "#456b4c"}
          transform={`rotate(${r} ${x} ${y})`}
        />
      ))}
    </svg>
  );
}
