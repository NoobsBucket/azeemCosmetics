"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import ProductSections from "./cardDisplay";

// ── Types from API ──────────────────────────────────────────────────────────
interface HomepageSection {
  id: number;
  type: "promo_banners" | "category_carousel" | "brand_grid" | "category_circles" | "product_sections";
  label: string;
  sort_order: number;
  enabled: number;
  items: string;
}

interface BannerItem   { id: string; image_url: string; heading: string; button_text: string; link_type: string; link_value: string }
interface CarouselItem { id: string; image_url: string; link_type: string; link_value: string }
interface BrandItem    { id: string; name: string; logo_url?: string; link_type: string; link_value: string }
interface CategoryItem { id: number; name: string; slug: string; image_url?: string }

// ── Shuffle ─────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Inline section renderers ────────────────────────────────────────────────

function PromoSection({ items }: { items: BannerItem[] }) {
  const router = useRouter();
  if (!items.length) return null;
  return (
    <section style={{ padding: "0 20px 32px", maxWidth: 1400, margin: "0 auto", fontFamily: "'Jost', sans-serif" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {items.map((b, i) => (
          <div key={b.id}
            onClick={() => b.link_value && router.push(b.link_type === "category" ? `/?category=${b.link_value}` : `/products/${b.link_value}`)}
            style={{
              position: "relative", border: "2.5px solid #111", borderRadius: 14, overflow: "hidden",
              boxShadow: "5px 5px 0 #111", aspectRatio: i === 0 && items.length % 2 !== 0 ? "16/5" : "16/7",
              gridColumn: i === 0 && items.length % 2 !== 0 ? "1 / -1" : undefined,
              cursor: b.link_value ? "pointer" : "default", background: "#f5f5f5",
            }}>
            <img src={b.image_url} alt={b.heading} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 18px",
              background: "linear-gradient(to top, rgba(0,0,0,.55), transparent)",
              display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10,
            }}>
              {b.heading && <h3 style={{ fontSize: ".95rem", fontWeight: 900, color: "#fff", margin: 0 }}>{b.heading}</h3>}
              {b.button_text && <button style={{ padding: "6px 14px", background: "#FF3E5E", color: "#fff", border: "2px solid #fff", borderRadius: 7, fontSize: ".75rem", fontWeight: 800, cursor: "pointer" }}>{b.button_text} →</button>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CarouselSection({ items }: { items: CarouselItem[] }) {
  const router = useRouter();
  const SPEED = 55;
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const paused = useRef(false);
  const pos = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !items.length) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      if (!paused.current) {
        pos.current -= SPEED * dt;
        const half = track.scrollWidth / 2;
        if (Math.abs(pos.current) >= half) pos.current = 0;
        track.style.transform = `translateX(${pos.current}px)`;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current !== null) cancelAnimationFrame(animRef.current); };
  }, [items]);

  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <section style={{ padding: "28px 0 36px", overflow: "hidden", fontFamily: "'Jost', sans-serif" }}>
      <div style={{ position: "relative", width: "100%", overflow: "hidden" }}
        onMouseEnter={() => { paused.current = true; }} onMouseLeave={() => { paused.current = false; }}>
        <div ref={trackRef} style={{ display: "flex", gap: 14, padding: "8px 20px", width: "max-content" }}>
          {doubled.map((item, i) => (
            <div key={`${item.id}-${i}`} onClick={() => router.push(item.link_type === "category" ? `/?category=${item.link_value}` : `/products/${item.link_value}`)}
              style={{ width: 220, height: 140, borderRadius: 12, overflow: "hidden", border: "2.5px solid #111", boxShadow: "4px 4px 0 #111", flexShrink: 0, cursor: "pointer" }}>
              <img src={item.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BrandSection({ items }: { items: BrandItem[] }) {
  const router = useRouter();
  if (!items.length) return null;
  const go = (b: BrandItem) => {
    if (!b.link_value) return;
    if (b.link_type === "url") window.open(b.link_value, "_blank", "noopener");
    else if (b.link_type === "category") router.push(`/?category=${b.link_value}`);
    else router.push(`/products/${b.link_value}`);
  };
  return (
    <section style={{ padding: "28px 20px 44px", maxWidth: 1400, margin: "0 auto", fontFamily: "'Jost', sans-serif" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
        {items.map(b => (
          <button key={b.id} onClick={() => go(b)}
            style={{ aspectRatio: "3/2", background: "#fff", border: "2.5px solid #111", borderRadius: 12, overflow: "hidden", boxShadow: "4px 4px 0 #111", display: "flex", alignItems: "center", justifyContent: "center", padding: 14, cursor: b.link_value ? "pointer" : "default" }}>
            {b.logo_url
              ? <img src={b.logo_url} alt={b.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              : <span style={{ fontWeight: 900, fontSize: "clamp(.75rem,1.5vw,1.1rem)", color: "#111" }}>{b.name}</span>}
          </button>
        ))}
      </div>
    </section>
  );
}

function CategoryCirclesSection() {
  const [cats, setCats] = useState<CategoryItem[]>([]);
  const router = useRouter();
  const SPEED = 55;
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const paused = useRef(false);
  const pos = useRef(0);

  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json() as Promise<{ results: CategoryItem[] }>)
      .then(d => setCats(d.results ?? []));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !cats.length) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      if (!paused.current) {
        pos.current -= SPEED * dt;
        const half = track.scrollWidth / 2;
        if (Math.abs(pos.current) >= half) pos.current = 0;
        track.style.transform = `translateX(${pos.current}px)`;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current !== null) cancelAnimationFrame(animRef.current); };
  }, [cats]);

  if (!cats.length) return null;
  const items = [...cats, ...cats, ...cats];
  return (
    <section style={{ padding: "28px 0 36px", overflow: "hidden", fontFamily: "'Jost', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 24px", marginBottom: 22, maxWidth: 1400, margin: "0 auto 22px" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111", margin: 0, whiteSpace: "nowrap" }}>Shop by Category</h2>
        <div style={{ flex: 1, height: 2.5, background: "#111", borderRadius: 1 }} />
      </div>
      <div style={{ position: "relative", overflow: "hidden" }}
        onMouseEnter={() => { paused.current = true; }} onMouseLeave={() => { paused.current = false; }}>
        <div ref={trackRef} style={{ display: "flex", gap: 18, padding: "8px 40px", width: "max-content" }}>
          {items.map((cat, i) => (
            <button key={`${cat.id}-${i}`} onClick={() => router.push(`/?category=${cat.slug}`)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer", flexShrink: 0, padding: 4 }}>
              <div style={{ width: 88, height: 88, borderRadius: "50%", border: "2.5px solid #111", boxShadow: "4px 4px 0 #111", overflow: "hidden", background: "#FFF5F7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {cat.image_url
                  ? <img src={cat.image_url} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: "1.8rem", fontWeight: 900, color: "#FF3E5E" }}>{cat.name[0]}</span>}
              </div>
              <span style={{ fontSize: ".76rem", fontWeight: 800, color: "#111", textAlign: "center", maxWidth: 88 }}>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Sentinel type for product sections injection ────────────────────────────
const PRODUCT_SECTIONS_SENTINEL: HomepageSection = {
  id: -1,
  type: "product_sections",
  label: "Product Sections",
  sort_order: 0,
  enabled: 1,
  items: "[]",
};

// ── Main ────────────────────────────────────────────────────────────────────
export default function HomepageBuilder() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/homepage-sections")
      .then(r => r.json() as Promise<{ results: HomepageSection[] }>)
      .then(d => setSections(d.results ?? []))
      .catch(() => setSections([]))
      .finally(() => setLoaded(true));
  }, []);

  const shuffled = useMemo(() => {
    if (!loaded) return [];
    // Shuffle the enabled API sections
    const enabled = shuffle(sections.filter(s => s.enabled === 1));
    // Insert ProductSections at a random position
    const insertAt = Math.floor(Math.random() * (enabled.length + 1));
    enabled.splice(insertAt, 0, PRODUCT_SECTIONS_SENTINEL);
    return enabled;
  }, [loaded, sections]);

  if (!loaded) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
      <div style={{ width: 36, height: 36, border: "4px solid #eee", borderTopColor: "#FF3E5E", borderRadius: "50%", animation: "hb-spin .7s linear infinite" }} />
      <style>{`@keyframes hb-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  if (shuffled.length === 0) return (
    <div style={{ textAlign: "center", padding: "60px 20px", fontFamily: "sans-serif", color: "#aaa", fontSize: "0.9rem" }}>
      No sections enabled. Go to Admin → Homepage tab to turn some on.
    </div>
  );

  return (
    <div>
      {shuffled.map(section => {
        let items: any[] = [];
        try { items = JSON.parse(section.items); } catch {}

        switch (section.type) {
          case "promo_banners":     return <PromoSection          key={section.id} items={items} />;
          case "category_carousel": return <CarouselSection       key={section.id} items={items} />;
          case "brand_grid":        return <BrandSection          key={section.id} items={items} />;
          case "category_circles":  return <CategoryCirclesSection key={section.id} />;
          case "product_sections":  return <ProductSections        key={section.id} />;
          default:                  return null;
        }
      })}
    </div>
  );
}