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
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/carousel")
      .then(r => r.json() as Promise<{ results: CarouselItem[] }>)
      .then(d => setItems(d.results || []));
  }, []);

  const goTo = useCallback((index: number) => {
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 400);
  }, []);

  const next = useCallback(() => {
    setCurrent(c => {
      const nextIdx = (c + 1) % items.length;
      setAnimating(true);
      setTimeout(() => setAnimating(false), 400);
      return nextIdx;
    });
  }, [items.length]);

  const prev = useCallback(() => {
    setCurrent(c => {
      const prevIdx = (c - 1 + items.length) % items.length;
      setAnimating(true);
      setTimeout(() => setAnimating(false), 400);
      return prevIdx;
    });
  }, [items.length]);

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

  const dragStart = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => { dragStart.current = e.clientX; };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    const diff = dragStart.current - e.clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    dragStart.current = null;
  };

  if (items.length === 0) return null;

  const item = items[current];

  return (
    <>
      <style>{css}</style>
      <div className="hc-outer">
        <div
          className="hc-wrap"
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {/* Single slide — only render current */}
          <div className={`hc-slide ${animating ? "hc-slide--exit" : "hc-slide--active"}`}>
            <button
              className="hc-slide-btn"
              onClick={() => handleClick(item)}
              aria-label={`Go to ${item.link_type} ${item.link_value}`}
            >
              <img
                src={item.image_url}
                alt=""
                className="hc-img"
                draggable={false}
              />
            </button>
          </div>

          {/* Arrows */}
          {items.length > 1 && (
            <>
              <button className="hc-arrow hc-arrow--left" onClick={prev} aria-label="Previous">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <button className="hc-arrow hc-arrow--right" onClick={next} aria-label="Next">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </>
          )}

          {/* Dots */}
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
      </div>
    </>
  );
}

const css = `
  .hc-outer {
    width: 100%;
    padding: 20px 24px;
    background: #f5f5f5;
    display: flex;
    justify-content: center;
  }

  .hc-wrap {
    position: relative;
    width: 100%;
    max-width: 900px;
    border: 2px solid #111;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 5px 5px 0 #111;
    background: #111;
    cursor: pointer;
    user-select: none;
    touch-action: pan-y;
  }

  .hc-slide {
    width: 100%;
    aspect-ratio: 16/7;
    transition: opacity 0.4s ease;
  }

  .hc-slide--active { opacity: 1; }
  .hc-slide--exit   { opacity: 0; }

  .hc-slide-btn {
    width: 100%; height: 100%;
    border: none; padding: 0; margin: 0;
    background: none; cursor: pointer;
    display: block;
  }

  .hc-img {
    width: 100%; height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
    pointer-events: none;
  }

  /* Arrows */
  .hc-arrow {
    position: absolute;
    top: 50%; transform: translateY(-50%);
    z-index: 10;
    width: 38px; height: 38px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid #111;
    box-shadow: 2px 2px 0 #111;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #111;
    transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
  }
  .hc-arrow:hover {
    background: #FFE14D;
    transform: translateY(calc(-50% - 2px));
    box-shadow: 2px 4px 0 #111;
  }
  .hc-arrow--left  { left: 12px; }
  .hc-arrow--right { right: 12px; }

  /* Dots */
  .hc-dots {
    position: absolute;
    bottom: 12px; left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    display: flex; gap: 6px; align-items: center;
  }
  .hc-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: rgba(255,255,255,0.5);
    border: none; padding: 0; cursor: pointer;
    transition: background 0.2s, width 0.2s;
  }
  .hc-dot--active {
    background: #FFE14D;
    width: 22px;
    border-radius: 4px;
  }

  @media (max-width: 600px) {
    .hc-outer { padding: 14px 12px; }
    .hc-slide { aspect-ratio: 4/3; }
    .hc-arrow { width: 32px; height: 32px; }
  }
`;