"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type CarouselItem = {
  id: number;
  image_url: string;
  link_type: string;
  link_value: string;
  sort_order: number;
  created_at: string;
};

const SIDE_RATIO = 0.12;
const GAP = 10;

export default function InfiniteCarousel() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [sceneW, setSceneW] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  const slidingRef = useRef(false);
  const pausedRef  = useRef(false);
  const dragStart  = useRef<number | null>(null);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackRef   = useRef<HTMLDivElement>(null);
  const sceneRef   = useRef<HTMLDivElement>(null);
  const currentRef = useRef(0);
  const router     = useRouter();

  useEffect(() => { currentRef.current = current; }, [current]);

  // Mark as mounted (client-only)
  useEffect(() => { setMounted(true); }, []);

  // Fetch items
  useEffect(() => {
    fetch("/api/carousel")
      .then((r) => r.json() as Promise<{ results: CarouselItem[] }>)
      .then((d) => setItems(d.results || []));
  }, []);

  // Read width only after mounted on client
  useEffect(() => {
    if (!mounted) return;
    const el = sceneRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setSceneW(w);
    };

    measure(); // immediate read

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted]);

  const TOTAL = items.length;
  const sv    = sceneW * SIDE_RATIO;
  const cw    = sceneW > 0 ? sceneW - 2 * (sv + GAP) : 0;
  const ch    = cw > 0 ? Math.round(cw / (16 / 6.2)) : 0;
  const tIdx  = current + 1;
  const getX  = useCallback(
    (ti: number) => -(ti * (cw + GAP)) + sv + GAP,
    [cw, sv]
  );

  const jumpSilent = useCallback(
    (ti: number) => {
      if (!trackRef.current) return;
      trackRef.current.style.transition = "none";
      trackRef.current.style.transform  = `translateX(${getX(ti)}px)`;
    },
    [getX]
  );

  const goTo = useCallback(
    (idx: number) => {
      if (slidingRef.current || TOTAL === 0) return;
      slidingRef.current = true;
      const realIdx = ((idx % TOTAL) + TOTAL) % TOTAL;
      setCurrent(realIdx);
      currentRef.current = realIdx;

      setTimeout(() => {
        if (idx >= TOTAL) {
          setCurrent(0);
          currentRef.current = 0;
          jumpSilent(1);
        } else if (idx < 0) {
          setCurrent(TOTAL - 1);
          currentRef.current = TOTAL - 1;
          jumpSilent(TOTAL);
        }
        slidingRef.current = false;
      }, 490);
    },
    [TOTAL, jumpSilent]
  );

  const next = useCallback(() => goTo(currentRef.current + 1), [goTo]);
  const prev = useCallback(() => goTo(currentRef.current - 1), [goTo]);

  // Auto-play
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

  // Sync track position on current or cw change
  useEffect(() => {
    if (!trackRef.current || cw === 0) return;
    trackRef.current.style.transform = `translateX(${getX(tIdx)}px)`;
  }, [current, cw, getX, tIdx]);

  const handleClick = (item: CarouselItem) => {
    if (item.link_type === "product") router.push(`/products/${item.link_value}`);
    else router.push(`/category/${item.link_value}`);
  };

  const extendedItems =
    TOTAL > 0 ? [items[TOTAL - 1], ...items, items[0]] : [];

  // Don't render until mounted and we have a width
  if (!mounted || items.length === 0) return null;

  return (
    <>
      <style>{css}</style>
      <div className="hc-outer">
        <div
          ref={sceneRef}
          className="hc-scene"
          onMouseEnter={() => { pausedRef.current = true;  setHovered(true);  }}
          onMouseLeave={() => { pausedRef.current = false; setHovered(false); }}
          onPointerDown={(e) => { dragStart.current = e.clientX; }}
          onPointerUp={(e) => {
            if (dragStart.current === null) return;
            const diff = dragStart.current - e.clientX;
            if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
            dragStart.current = null;
          }}
        >
          {cw > 0 && (
            <div
              ref={trackRef}
              className="hc-track"
              style={{
                transform:  `translateX(${getX(tIdx)}px)`,
                transition: "transform 0.48s cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              {extendedItems.map((item, i) => {
                const isCenter = i === tIdx;
                const realIdx  = ((i - 1) % TOTAL + TOTAL) % TOTAL;
                return (
                  <div
                    key={`${i}-${item.id}`}
                    className="hc-slide"
                    style={{
                      width:      cw,
                      height:     ch,
                      marginLeft: i === 0 ? 0 : GAP,
                      transform:  isCenter ? "scale(1)"  : "scale(0.9)",
                      opacity:    isCenter ? 1            : 0.65,
                      boxShadow:  isCenter
                        ? "0 8px 40px rgba(0,0,0,0.22)"
                        : "none",
                    }}
                    onClick={() => {
                      if (!isCenter) goTo(realIdx);
                      else handleClick(item);
                    }}
                  >
                    <img
                      src={item.image_url}
                      alt=""
                      className="hc-img"
                      draggable={false}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {TOTAL > 1 && (
            <>
              <button
                className={`hc-arrow hc-arrow--left ${hovered ? "hc-arrow--visible" : ""}`}
                onClick={prev}
                aria-label="Previous"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                className={`hc-arrow hc-arrow--right ${hovered ? "hc-arrow--visible" : ""}`}
                onClick={next}
                aria-label="Next"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
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
    width: 100%;
    padding: 20px 0 18px;
    background: #f5f5f5;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    overflow: hidden;
  }
  .hc-scene {
    position: relative;
    width: 100%;
    overflow: hidden;
    user-select: none;
    touch-action: pan-y;
  }
  .hc-track {
    display: flex;
    align-items: center;
    will-change: transform;
  }
  .hc-slide {
    flex-shrink: 0;
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    transition:
      transform  0.48s cubic-bezier(0.4, 0, 0.2, 1),
      opacity    0.48s cubic-bezier(0.4, 0, 0.2, 1),
      box-shadow 0.48s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .hc-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
    pointer-events: none;
  }
  .hc-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255,255,255,0.92);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #111;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s, background 0.15s, transform 0.15s;
  }
  .hc-arrow--visible { opacity: 1; pointer-events: auto; }
  .hc-arrow:hover {
    background: #FFE14D;
    transform: translateY(calc(-50% - 2px));
  }
  .hc-arrow--left  { left: 16px; }
  .hc-arrow--right { right: 16px; }
  .hc-dots {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .hc-dot {
    height: 8px;
    width: 8px;
    border-radius: 4px;
    background: #bbb;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: background 0.25s, width 0.3s;
  }
  .hc-dot--active {
    background: #FFE14D;
    width: 28px;
  }
  @media (max-width: 768px) {
    .hc-arrow--left  { left: 8px; }
    .hc-arrow--right { right: 8px; }
  }
`;