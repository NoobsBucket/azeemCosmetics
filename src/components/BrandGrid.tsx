"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Brand = { id: number; name: string; logo_url?: string; link_url?: string; sort_order: number };

export default function BrandGrid({ cols = 6 }: { cols?: 3 | 4 | 5 | 6 }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/brands")
      .then(r => r.json() as Promise<{ results: Brand[] }>)
      .then(d => setBrands(d.results || []))
      .catch(() => {});
  }, []);

  if (brands.length === 0) return null;

  const go = (b: Brand) => {
    if (!b.link_url) return;
    b.link_url.startsWith("http") ? window.open(b.link_url, "_blank", "noopener") : router.push(b.link_url);
  };

  return (
    <>
      <style>{css(cols)}</style>
      <section className="bg-section">
        <div className="bg-head">
          <h2 className="bg-title">Shop by Brand</h2>
          <div className="bg-line" />
        </div>
        <div className="bg-grid">
          {brands.map(b => (
            <button key={b.id} className="bg-card" onClick={() => go(b)} style={{ cursor: b.link_url ? "pointer" : "default" }}>
              {b.logo_url
                ? <img src={b.logo_url} alt={b.name} className="bg-img" />
                : <span className="bg-name">{b.name}</span>}
              <span className="bg-corner" />
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

const css = (cols: number) => `
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@400;800;900&display=swap');
  .bg-section { padding: 28px 20px 44px; max-width: 1400px; margin: 0 auto; font-family: 'Jost', sans-serif; }
  .bg-head { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
  .bg-title { font-size: 1.25rem; font-weight: 800; color: #111; white-space: nowrap; letter-spacing: -.02em; margin: 0; }
  .bg-line { flex: 1; height: 2.5px; background: #111; border-radius: 1px; }
  .bg-grid { display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 12px; }
  .bg-card {
    position: relative; aspect-ratio: 3/2; background: #fff;
    border: 2.5px solid #111; border-radius: 12px; overflow: hidden;
    box-shadow: 4px 4px 0 #111; display: flex; align-items: center;
    justify-content: center; padding: 14px; transition: transform .15s, box-shadow .15s;
  }
  .bg-card:hover { transform: translate(-3px,-3px); box-shadow: 7px 7px 0 #C03EFF; border-color: #C03EFF; }
  .bg-img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; display: block; transition: transform .2s; }
  .bg-card:hover .bg-img { transform: scale(1.06); }
  .bg-name { font-size: clamp(.75rem,1.5vw,1.1rem); font-weight: 900; color: #111; text-align: center; letter-spacing: -.02em; line-height: 1.2; word-break: break-word; transition: color .15s; }
  .bg-card:hover .bg-name { color: #C03EFF; }
  .bg-corner { position: absolute; top: 0; right: 0; width: 0; height: 0; border-style: solid; border-width: 0 26px 26px 0; border-color: transparent #C03EFF transparent transparent; opacity: 0; transition: opacity .15s; }
  .bg-card:hover .bg-corner { opacity: 1; }
  @media (max-width: 900px) { .bg-grid { grid-template-columns: repeat(${Math.min(cols, 4)}, 1fr); } }
  @media (max-width: 600px) { .bg-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; } .bg-card { border-radius: 8px; padding: 10px; box-shadow: 3px 3px 0 #111; } }
`;