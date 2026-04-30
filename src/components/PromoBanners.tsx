"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Banner = {
  id: number;
  image_url: string;
  heading: string;
  button_text: string;
  sort_order: number;
  link_type?: "category" | "product" | "none";
  link_value?: string;
};

export default function PromoBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/banners")
      .then(r => r.json())
      .then((d: unknown) => {
        const data = d as { results: Banner[] };
        setBanners((data.results || []).sort((a, b) => a.sort_order - b.sort_order));
      })
      .catch(() => {});
  }, []);

  function handleClick(banner: Banner, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!banner.link_type || banner.link_type === "none" || !banner.link_value) return;
    if (banner.link_type === "category") router.push(`/category/${banner.link_value}`);
    else if (banner.link_type === "product") router.push(`/products/${banner.link_value}`);
  }

  const hasLink = (b: Banner) => b.link_type && b.link_type !== "none" && b.link_value;

  if (banners.length === 0) return null;

  return (
    <>
      <style>{css}</style>
      <section className="pb-section">
        <div className="pb-grid">
          {banners.map((banner, i) => (
            <div
              key={banner.id}
              className={`pb-card ${i === 0 && banners.length % 2 !== 0 ? "pb-card--wide" : ""}`}
              onClick={() => handleClick(banner)}
              style={{ cursor: hasLink(banner) ? "pointer" : "default" }}
            >
              <img src={banner.image_url} alt={banner.heading} className="pb-img" />
              <div className="pb-shine" />
              <div className="pb-overlay">
                {banner.heading && <h3 className="pb-heading">{banner.heading}</h3>}
                {banner.button_text && hasLink(banner) && (
                  <button className="pb-cta" onClick={e => handleClick(banner, e)}>
                    {banner.button_text} →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

const css = `
  .pb-section { padding: 0 20px 32px; max-width: 1400px; margin: 0 auto; font-family: 'Jost', sans-serif; }
  .pb-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .pb-card {
    position: relative; border: 2.5px solid #111; border-radius: 14px; overflow: hidden;
    box-shadow: 5px 5px 0 #111; transition: transform .18s, box-shadow .18s;
    background: #f5f5f5; aspect-ratio: 16/7;
  }
  .pb-card--wide { grid-column: 1 / -1; aspect-ratio: 16/5; }
  .pb-card:hover { transform: translate(-3px,-3px); box-shadow: 8px 8px 0 #111; }
  .pb-img { width: 100%; height: 110%; display: block; transition: transform .4s; }
  .pb-card:hover .pb-img { transform: scale(1.03); }
  .pb-shine {
    position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,.18) 50%, transparent 60%);
    background-size: 200% 100%; background-position: 200% 0;
    transition: background-position .5s ease;
  }
  .pb-card:hover .pb-shine { background-position: -200% 0; }
  .pb-overlay {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 14px 18px;
    background: linear-gradient(to top, rgba(0,0,0,.55), transparent);
    display: flex; align-items: flex-end; justify-content: space-between; gap: 10px;
    opacity: 0; transform: translateY(6px); transition: opacity .2s, transform .2s;
  }
  .pb-card:hover .pb-overlay { opacity: 1; transform: translateY(0); }
  .pb-heading { font-size: .95rem; font-weight: 900; color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,.5); margin: 0; }
  .pb-cta {
    padding: 6px 14px; background: #C03EFF; color: #fff;
    border: 2px solid #fff; border-radius: 7px;
    font-size: .75rem; font-weight: 800; cursor: pointer; font-family: 'Jost', sans-serif;
    box-shadow: 2px 2px 0 rgba(0,0,0,.3); transition: background .15s; white-space: nowrap;
  }
  .pb-cta:hover { background: #c0002e; }
  @media (max-width: 680px) {
    .pb-grid { grid-template-columns: 1fr; }
    .pb-card--wide { grid-column: auto; aspect-ratio: 16/7; }
    .pb-overlay { opacity: 1; transform: none; }
  }
`;