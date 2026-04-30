"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: number; name: string; slug: string; image_url?: string };

export default function CategoryCircles() {
  const [categories, setCategories] = useState<Category[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json() as Promise<{ results: Category[] }>)
      .then(d => setCategories(d.results || []));
  }, []);

  useEffect(() => {
    if (categories.length === 0) return;
    const track = trackRef.current;
    if (!track) return;

    const SPEED = 0.5;
    const ITEM_WIDTH = 100; // cc-item width (80px ring + 4px padding each side)
    const GAP = 20;
    // UNIT = width of ONE full set of categories.
    // We render 3 copies; reset after scrolling exactly 1 copy so
    // copy 2 seamlessly becomes the new copy 1 — no gap, ever.
    const UNIT = (ITEM_WIDTH + GAP) * categories.length;

    // Make sure the track is wide enough before starting
    // (3 copies means we always have 2 full copies ahead)
    const animate = () => {
      if (!pausedRef.current) {
        offsetRef.current += SPEED;
        // When we've scrolled exactly one full set, snap back silently
        if (offsetRef.current >= UNIT) {
          offsetRef.current -= UNIT;
        }
        if (track) {
          track.style.transform = `translateX(-${offsetRef.current}px)`;
        }
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [categories]);

  if (categories.length === 0) return null;

  // Repeat enough times so the track is always wider than the viewport.
  // We need at least: viewport_width / (ITEM_WIDTH + GAP) extra items.
  // 6 copies is safe for any screen up to ~1440px with small categories.
  const repeated = [
    ...categories,
    ...categories,
    ...categories,
    ...categories,
    ...categories,
    ...categories,
  ];

  return (
    <>
      <style>{css}</style>
      <section className="cc-wrap">
        <div className="cc-viewport">
          <div
            className="cc-track"
            ref={trackRef}
            onMouseEnter={() => { pausedRef.current = true; }}
            onMouseLeave={() => { pausedRef.current = false; }}
          >
            {repeated.map((cat, i) => (
              <button
                key={`${cat.id}-${i}`}
                className="cc-item"
                onClick={() => router.push(`/category/${encodeURIComponent(cat.slug)}`)}
              >
                <div className="cc-ring">
                  <div className="cc-img-wrap">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="cc-img" />
                    ) : (
                      <div className="cc-placeholder">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <rect x="3" y="3" width="7" height="7" rx="1"/>
                          <rect x="14" y="3" width="7" height="7" rx="1"/>
                          <rect x="3" y="14" width="7" height="7" rx="1"/>
                          <rect x="14" y="14" width="7" height="7" rx="1"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                <span className="cc-label">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

const css = `
  .cc-wrap {
    width: 100%;
    padding: 20px 0 16px;
    background: #fff;
    margin-top: 60px;
    overflow: hidden;
  }

  .cc-viewport {
    width: 100%;
    overflow: hidden;
    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
    mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
  }

  .cc-track {
    display: flex;
    gap: 20px;
    width: max-content;
    padding: 20px 0 8px;
    will-change: transform;
  }

  .cc-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 9px;
    background: none;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    /* Explicit width so UNIT calc stays accurate */
    width: 100px;
    padding: 4px;
    box-sizing: border-box;
    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .cc-item:hover {
    transform: scale(1.18) translateY(-4px);
  }
  .cc-item:active {
    transform: scale(1.08) translateY(-1px);
  }

  .cc-ring {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #C03EFF 0%, #FFE14D 50%, #00D084 100%);
    padding: 3px;
    box-shadow: 3px 3px 0 #111;
    transition: box-shadow 0.2s, background 0.25s;
  }
  .cc-item:hover .cc-ring {
    background: linear-gradient(135deg, #111 0%, #444 100%);
    box-shadow: 4px 5px 0 #111;
  }

  .cc-img-wrap {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
    background: #f5f5f5;
    border: 3px solid #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cc-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    display: block;
  }

  .cc-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #efefef;
    color: #999;
    border-radius: 50%;
  }

  .cc-label {
    font-family: 'Jost', sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    color: #111;
    text-align: center;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  @media (max-width: 1026px) {
    .cc-wrap { margin-top: 120px; }
  }

  @media (max-width: 600px) {
    .cc-wrap {
      padding: 14px 0 12px;
      margin-top: 120px;
    }
    .cc-item {
      width: 82px;
    }
    .cc-ring {
      width: 68px;
      height: 68px;
    }
    .cc-label {
      font-size: 0.65rem;
    }
    .cc-track {
      gap: 14px;
    }
  }
`;