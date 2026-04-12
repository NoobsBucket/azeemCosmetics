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

const SIDE_RATIO = 0.12;
const GAP = 10;

export default function HeroCarousel() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [sceneW, setSceneW] = useState(0);
  const [hovered, setHovered] = useState(false);
  const slidingRef = useRef(false);
  const pausedRef  = useRef(false);
  const dragStart  = useRef<number | null>(null);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackRef   = useRef<HTMLDivElement>(null);
  const sceneRef   = useRef<HTMLDivElement>(null);
  const router     = useRouter();

  useEffect(() => {
    fetch("/api/carousel")
      .then(r => r.json() as Promise<{ results: CarouselItem[] }>)
      .then(d => setItems(d.results || []));
  }, []);

  // ResizeObserver — fires immediately on mount
  useEffect(() => {
    if (!sceneRef.current) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      setSceneW(prev => (prev === w ? prev : w));
    });
    ro.observe(sceneRef.current);
    return () => ro.disconnect();
  }, []);

  const TOTAL   = items.length;
  const sv      = sceneW * SIDE_RATIO;
  const cw      = sceneW - 2 * (sv + GAP);
  const ch      = Math.round(cw / (16 / 6.2));
  // Track has TOTAL+2 slides: [clone-last, ...real, clone-first]
  // real slide i lives at trackIdx = i+1
  const tIdx    = current + 1;
  const trackX  = -(tIdx * (cw + GAP)) + sv + GAP;

  // Extended items array: [last, ...all, first]
  const extendedItems = TOTAL > 0
    ? [items[TOTAL - 1], ...items, items[0]]
    : [];

  const applyInstant = useCallback((trackIdx: number) => {
    if (!trackRef.current) return;
    const x = -(trackIdx * (cw + GAP)) + sv + GAP;
    trackRef.current.style.transition = "none";
    trackRef.current.style.transform  = `translateX(${x}px)`;
  }, [cw, sv]);

  const goTo = useCallback((idx: number) => {
    if (slidingRef.current || TOTAL === 0) return;
    slidingRef.current = true;
    const next = ((idx % TOTAL) + TOTAL) % TOTAL;
    setCurrent(next);

    setTimeout(() => {
      // Silently jump from clone to real slide
      if (next === 0) {
        // came from clone-of-first (trackIdx TOTAL+1) → jump to real first (trackIdx 1)
        applyInstant(1);
      } else if (next === TOTAL - 1 && idx < 0) {
        // came from clone-of-last (trackIdx 0) → jump to real last (trackIdx TOTAL)
        applyInstant(TOTAL);
      }
      slidingRef.current = false;
    }, 490);
  }, [TOTAL, applyInstant]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (TOTAL === 0) return;
    const schedule = () => {
      timerRef.current = setTimeout(() => {
        if (!pausedRef.current) next();
        schedule();
      }, 4000);
    };
    schedule();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [TOTAL, next]);

  const handleClick = (item: CarouselItem) => {
    if (item.link_type === "product") router.push(`/products/${item.link_value}`);
    else router.push(`/category/${item.link_value}`);
  };

  if (items.length === 0) return null;

  return (
    <>
      <style>{css}</style>
      <div className="hc-outer">
        <div
          ref={sceneRef}
          className="hc-scene"
          onMouseEnter={() => { pausedRef.current = true;  setHovered(true);  }}
          onMouseLeave={() => { pausedRef.current = false; setHovered(false); }}
          onPointerDown={e => { dragStart.current = e.clientX; }}
          onPointerUp={e => {
            if (dragStart.current === null) return;
            const diff = dragStart.current - e.clientX;
            if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
            dragStart.current = null;
          }}
        >
          {sceneW > 0 && (
            <div
              ref={trackRef}
              className="hc-track"
              style={{ transform: `translateX(${trackX}px)`, transition: "transform 0.48s cubic-bezier(0.4,0,0.2,1)" }}
            >
              {extendedItems.map((item, i) => {
                const isCenter = i === tIdx;
                return (
                  <div
                    key={`${i}-${item.id}`}
                    className="hc-slide"
                    style={{
                      width:     cw,
                      height:    ch,
                      marginLeft: i === 0 ? 0 : GAP,
                      transform:  isCenter ? "scale(1)"   : "scale(0.9)",
                      opacity:    isCenter ? 1             : 0.65,
                      boxShadow:  isCenter ? "0 8px 32px rgba(0,0,0,0.18)" : "none",
                    }}
                    onClick={() => {
                      // real index of this extended slot
                      const realIdx = (i - 1 + TOTAL) % TOTAL;
                      if (!isCenter) goTo(realIdx);
                      else handleClick(item);
                    }}
                  >
                    <img src={item.image_url} alt="" className="hc-img" draggable={false} />
                  </div>
                );
              })}
            </div>
          )}

          {TOTAL > 1 && (
            <>
              <button className={`hc-arrow hc-arrow--left ${hovered ? "hc-arrow--visible" : ""}`} onClick={prev} aria-label="Previous">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button className={`hc-arrow hc-arrow--right ${hovered ? "hc-arrow--visible" : ""}`} onClick={next} aria-label="Next">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </>
          )}
        </div>

        {TOTAL > 1 && (
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
    width: 100%; padding: 20px 0 18px; background: #f5f5f5;
    display: flex; flex-direction: column; align-items: center;
    gap: 16px; overflow: hidden;
  }
  .hc-scene {
    position: relative; width: 100%;
    overflow: hidden; user-select: none; touch-action: pan-y;
  }
  .hc-track { display: flex; align-items: center; will-change: transform; }
  .hc-slide {
    flex-shrink: 0; border-radius: 14px; overflow: hidden; cursor: pointer;
    transition: transform 0.48s cubic-bezier(0.4,0,0.2,1), opacity 0.48s, box-shadow 0.48s;
  }
  .hc-img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
  .hc-arrow {
    position: absolute; top: 50%; transform: translateY(-50%);
    z-index: 10; width: 40px; height: 40px; border-radius: 50%;
    background: rgba(255,255,255,0.92); border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #111; opacity: 0;
    transition: opacity 0.2s, background 0.15s, transform 0.15s;
    pointer-events: none;
  }
  .hc-arrow--visible { opacity: 1; pointer-events: auto; }
  .hc-arrow:hover { background: #FFE14D; transform: translateY(calc(-50% - 2px)); }
  .hc-arrow--left { left: 16px; }
  .hc-arrow--right { right: 16px; }
  .hc-dots { display: flex; gap: 6px; align-items: center; }
  .hc-dot {
    height: 8px; width: 8px; border-radius: 4px;
    background: #888; border: none; padding: 0; cursor: pointer;
    transition: background 0.25s, width 0.3s;
  }
  .hc-dot--active { background: #FFE14D; width: 28px; outline: 2px solid #111; outline-offset: 1px; }
`;