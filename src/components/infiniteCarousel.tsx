"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type CarouselItem = {
  id: number;
  image_url: string;
  link_type: string;
  link_value: string;
  sort_order: number;
};

export default function HeroCarousel() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [sliding, setSliding] = useState(false);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef(false);
  const dragStart = useRef<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/carousel")
      .then(r => r.json() as Promise<{ results: CarouselItem[] }>)
      .then(d => setItems(d.results || []));
  }, []);

  const goTo = useCallback((nextIdx: number) => {
    if (sliding) return;
    setSliding(true);
    setCurrent(nextIdx);
    setTimeout(() => setSliding(false), 460);
  }, [sliding]);

  const next = useCallback(() => {
    goTo((current + 1) % items.length);
  }, [current, items.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + items.length) % items.length);
  }, [current, items.length, goTo]);

  useEffect(() => {
    if (items.length === 0) return;
    const schedule = () => {
      timerRef.current = setTimeout(() => {
        if (!pausedRef.current) next();
        schedule();
      }, 4000);
    };
    schedule();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [items.length, next]);

  const handleClick = (item: CarouselItem) => {
    if (item.link_type === "product") router.push(`/products/${item.link_value}`);
    else router.push(`/category/${item.link_value}`);
  };

  const prevIdx = (current - 1 + items.length) % items.length;
  const nextIdx = (current + 1) % items.length;

  if (items.length === 0) return null;

  return (
    <>
      <style>{css}</style>
      <div className="hc-outer">
        <div
          className="hc-scene"
          onMouseEnter={() => { pausedRef.current = true; setHovered(true); }}
          onMouseLeave={() => { pausedRef.current = false; setHovered(false); }}
          onPointerDown={e => { dragStart.current = e.clientX; }}
          onPointerUp={e => {
            if (dragStart.current === null) return;
            const diff = dragStart.current - e.clientX;
            if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
            dragStart.current = null;
          }}
        >
          {/* Left peek */}
          {items.length > 1 && (
            <div className="hc-peek-left">
              <div className="hc-peek-img-wrap">
                <img src={items[prevIdx].image_url} alt="" className="hc-img" draggable={false} />
              </div>
              <div className="hc-peek-blur" />
            </div>
          )}

          {/* Main sliding track */}
          <div className="hc-track-wrapper">
            <div
              className="hc-track"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {items.map(item => (
                <div key={item.id} className="hc-slide">
                  <button
                    className="hc-card-btn"
                    onClick={() => handleClick(item)}
                    aria-label={`Go to ${item.link_type} ${item.link_value}`}
                  >
                    <img src={item.image_url} alt="" className="hc-img" draggable={false} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right peek */}
          {items.length > 1 && (
            <div className="hc-peek-right">
              <div className="hc-peek-img-wrap">
                <img src={items[nextIdx].image_url} alt="" className="hc-img" draggable={false} />
              </div>
              <div className="hc-peek-blur" />
            </div>
          )}

          {items.length > 1 && (
            <>
              <button className={`hc-arrow hc-arrow--left ${hovered ? "hc-arrow--visible" : ""}`} onClick={prev} aria-label="Previous">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <button className={`hc-arrow hc-arrow--right ${hovered ? "hc-arrow--visible" : ""}`} onClick={next} aria-label="Next">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </>
          )}
        </div>

        {items.length > 1 && (
          <div className="hc-dots">
            {items.map((_, i) => (
              <button
                key={i}
                className={`hc-dot ${i === current ? "hc-dot--active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const css = `
  .hc-outer {
    width: 100%;
    padding: 24px 0 16px;
    background: #f5f5f5;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    overflow: hidden;
  }
  .hc-scene {
    position: relative;
    width: 100%;
    max-width: 1400px;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    touch-action: pan-y;
  }
  .hc-track-wrapper {
    position: relative;
    z-index: 2;
    width: 74%;
    border: 2.5px solid #111;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 6px 6px 0 #111;
  }
  .hc-track {
    display: flex;
    transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
  }
  .hc-slide {
    flex: 0 0 100%;
    width: 100%;
    aspect-ratio: 16/8;
  }
  .hc-card-btn {
    width: 100%; height: 100%;
    border: none; padding: 0; margin: 0;
    background: none; cursor: pointer;
    display: block;
  }
  .hc-img {
    width: 100%; height: 100%;
    object-fit: cover; object-position: center;
    display: block; pointer-events: none;
  }
  .hc-peek-left, .hc-peek-right {
    position: absolute;
    top: 0; bottom: 0;
    width: 13%;
    z-index: 1;
    overflow: hidden;
  }
  .hc-peek-left  { left: 0; border-radius: 0 14px 14px 0; border: 2px solid #111; border-left: none; }
  .hc-peek-right { right: 0; border-radius: 14px 0 0 14px; border: 2px solid #111; border-right: none; }
  .hc-peek-img-wrap { position: absolute; inset: 0; overflow: hidden; }
  .hc-peek-blur {
    position: absolute; inset: 0;
    background: rgba(245,245,245,0.5);
    backdrop-filter: blur(3px);
  }
  .hc-arrow {
    position: absolute;
    top: 50%; transform: translateY(-50%);
    z-index: 10;
    width: 42px; height: 42px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid #111;
    box-shadow: 2px 2px 0 #111;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #111;
    opacity: 0;
    transition: opacity 0.2s, background 0.15s, transform 0.15s, box-shadow 0.15s;
    pointer-events: none;
  }
  .hc-arrow--visible { opacity: 1; pointer-events: auto; }
  .hc-arrow:hover { background: #FFE14D; transform: translateY(calc(-50% - 2px)); box-shadow: 2px 4px 0 #111; }
  .hc-arrow--left  { left: 11%; }
  .hc-arrow--right { right: 11%; }
  .hc-dots { display: flex; gap: 7px; align-items: center; justify-content: center; }
  .hc-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #bbb; border: 1.5px solid #111;
    padding: 0; cursor: pointer;
    transition: background 0.2s, width 0.25s, border-radius 0.25s;
  }
  .hc-dot--active { background: #111; width: 24px; border-radius: 4px; }

  @media (min-width: 1200px) { .hc-slide { aspect-ratio: 21/8; } }
  @media (max-width: 768px) {
    .hc-peek-left, .hc-peek-right { width: 8%; }
    .hc-track-wrapper { width: 82%; }
    .hc-arrow--left  { left: 7%; }
    .hc-arrow--right { right: 7%; }
    .hc-slide { aspect-ratio: 4/3; }
  }
  @media (max-width: 480px) {
    .hc-peek-left, .hc-peek-right { display: none; }
    .hc-track-wrapper { width: 92%; border-radius: 12px; }
    .hc-slide { aspect-ratio: 3/2; }
    .hc-arrow--left  { left: 4px; }
    .hc-arrow--right { right: 4px; }
  }
`;