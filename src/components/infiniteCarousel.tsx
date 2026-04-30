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

const GAP = 10;

function getSideRatio(w: number) {
  if (w < 480) return 0.04;
  if (w < 768) return 0.06;
  return 0.12;
}

export default function InfiniteCarousel() {
  const [items, setItems]       = useState<CarouselItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [current, setCurrent]   = useState(0);
  const [sceneW, setSceneW]     = useState(0);
  const [hovered, setHovered]   = useState(false);
  const [ready, setReady]       = useState(false);

  const isJumping  = useRef(false);
  const pausedRef  = useRef(false);
  const dragStart  = useRef<number | null>(null);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackRef   = useRef<HTMLDivElement>(null);
  const sceneRef   = useRef<HTMLDivElement>(null);
  const currentRef = useRef(0);
  const initializedRef = useRef(false);
  const router = useRouter();

  useEffect(() => { currentRef.current = current; }, [current]);

  useEffect(() => {
    fetch("/api/carousel")
      .then(r => {
        if (!r.ok) return { results: [] };
        return r.json() as Promise<{ results: CarouselItem[] }>;
      })
      .then(d => {
        const results = Array.isArray(d?.results) ? d.results : [];
        setItems(results);
        setLoading(false);
        if (results.length === 0) setReady(true);
      })
      .catch(() => {
        setLoading(false);
        setReady(true);
      });
  }, []);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setSceneW(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const TOTAL = items.length;
  const sv    = sceneW > 0 ? sceneW * getSideRatio(sceneW) : 0;
  const cw    = sceneW > 0 ? sceneW - 2 * (sv + GAP) : 0;
  const ch    = cw > 0 ? Math.round(cw / (16 / 6.5)) : 0;
  const tIdx  = current + 1;

  const getX = useCallback(
    (ti: number) => -(ti * (cw + GAP)) + sv + GAP,
    [cw, sv]
  );

  const jumpSilent = useCallback((ti: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.transform  = `translateX(${getX(ti)}px)`;
    void el.offsetHeight;
  }, [getX]);

  const animateTo = useCallback((ti: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = "transform 0.48s cubic-bezier(0.4,0,0.2,1)";
    el.style.transform  = `translateX(${getX(ti)}px)`;
  }, [getX]);

  const goTo = useCallback((nextReal: number) => {
    if (isJumping.current || TOTAL === 0) return;
    isJumping.current = true;

    const wrappedReal = ((nextReal % TOTAL) + TOTAL) % TOTAL;
    const nextTIdx    = nextReal + 1;

    animateTo(nextTIdx);
    setCurrent(wrappedReal);
    currentRef.current = wrappedReal;

    setTimeout(() => {
      if (nextReal >= TOTAL) {
        jumpSilent(1);
      } else if (nextReal < 0) {
        jumpSilent(TOTAL);
      }
      isJumping.current = false;
    }, 490);
  }, [TOTAL, animateTo, jumpSilent]);

  const next = useCallback(() => {
    if (isJumping.current) return;
    goTo(currentRef.current + 1);
  }, [goTo]);

  const prev = useCallback(() => {
    if (isJumping.current) return;
    goTo(currentRef.current - 1);
  }, [goTo]);

  useEffect(() => {
    if (cw === 0 || TOTAL === 0 || initializedRef.current) return;
    initializedRef.current = true;
    setCurrent(0);
    currentRef.current = 0;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        jumpSilent(1);
        setReady(true);
      });
    });
  }, [cw, TOTAL, jumpSilent]);

  useEffect(() => {
    if (!initializedRef.current || cw === 0) return;
    jumpSilent(currentRef.current + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cw]);

  useEffect(() => {
    if (TOTAL === 0) return;
    const schedule = () => {
      timerRef.current = setTimeout(() => {
        if (!pausedRef.current && !isJumping.current) next();
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

  const extendedItems = TOTAL > 0 ? [items[TOTAL - 1], ...items, items[0]] : [];

  const skeletonCount = sceneW < 480 ? 1 : sceneW < 768 ? 2 : 3;

  if (!loading && TOTAL === 0) return null;

  return (
    <>
      <style>{css}</style>
      {/* ── Outer wrapper: matches banner padding + max-width exactly ── */}
      <div className="hc-wrapper">
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
            {/* Skeleton loading */}
            {(loading || !ready) && sceneW > 0 && (
              <div className="hc-skeleton-row" style={{ padding: `0 ${sv + GAP}px` }}>
                {Array.from({ length: skeletonCount }).map((_, i) => (
                  <div
                    key={i}
                    className="hc-skeleton"
                    style={{
                      width: i === 0 ? cw || sceneW * 0.7 : (cw || sceneW * 0.7) * 0.88,
                      height: ch || Math.round((cw || sceneW * 0.7) / (16 / 6.5)),
                      opacity: i === 0 ? 1 : 0.5,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Real track */}
            {!loading && TOTAL > 0 && (
              <div
                ref={trackRef}
                className="hc-track"
                style={{ opacity: ready ? 1 : 0, transition: "opacity 0.3s" }}
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
                        transform:  isCenter ? "scale(1)" : "scale(0.88)",
                        opacity:    isCenter ? 1 : 0.55,
                        boxShadow:  isCenter ? "0 8px 40px rgba(0,0,0,0.22)" : "none",
                      }}
                      onClick={() => {
                        if (!isCenter) goTo(realIdx);
                        else handleClick(item);
                      }}
                    >
                      <img src={item.image_url} alt="" className="hc-img" draggable={false}/>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Arrows */}
            {!loading && ready && TOTAL > 1 && (
              <>
                <button
                  className={`hc-arrow hc-arrow--left ${hovered ? "hc-arrow--visible" : ""}`}
                  onClick={prev} aria-label="Previous"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                <button
                  className={`hc-arrow hc-arrow--right ${hovered ? "hc-arrow--visible" : ""}`}
                  onClick={next} aria-label="Next"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Dots */}
          {!loading && ready && TOTAL > 1 && (
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
  /*
   * hc-wrapper mirrors the banner's .wrapper padding + max-width logic.
   * hc-outer is the inner container (was previously the outermost element).
   * This way the carousel content aligns perfectly with the banner grid.
   */

  /* ── Banner-matching outer shell ── */
  .hc-wrapper {
    width: 100%;
    padding: 0 24px;           /* matches banner .wrapper padding: 24px */
    box-sizing: border-box;
    background: #f5f5f5;
  }

  /* ── Inner container: constrained like banner's .parent ── */
  .hc-outer {
    width: 100%;
    max-width: 1200px;         /* matches banner .parent max-width: 1200px */
    margin: 0 auto;            /* matches banner .parent margin: 0 auto */
    padding: 20px 0 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    overflow: hidden;
  }

  .hc-scene {
    position: relative;
    width: 100%;
    overflow: hidden;
    user-select: none;
    touch-action: pan-y;
    min-height: 60px;
  }
  .hc-track {
    display: flex;
    align-items: center;
    will-change: transform;
  }
  .hc-slide {
    flex-shrink: 0;
    border-radius: 12px;
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

  /* ── Skeleton ── */
  .hc-skeleton-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    box-sizing: border-box;
  }
  .hc-skeleton {
    flex-shrink: 0;
    border-radius: 12px;
    background: linear-gradient(90deg, #f0f0f0 25%, #fce4e9 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: hcShimmer 1.4s ease-in-out infinite;
  }
  @keyframes hcShimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Arrows ── */
  .hc-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    width: 38px; height: 38px;
    border-radius: 50%;
    background: rgba(255,255,255,0.95);
    border: 2px solid #111;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #111;
    opacity: 0; pointer-events: none;
    box-shadow: 2px 2px 0 #111;
    transition: opacity 0.2s, background 0.15s, transform 0.15s;
  }
  .hc-arrow--visible { opacity: 1; pointer-events: auto; }
  .hc-arrow:hover {
    background: #C03EFF;
    color: #fff;
    border-color: #111;
    transform: translateY(calc(-50% - 2px));
    box-shadow: 2px 4px 0 #111;
  }
  .hc-arrow--left  { left: 14px; }
  .hc-arrow--right { right: 14px; }

  /* ── Dots ── */
  .hc-dots {
    display: flex; gap: 6px; align-items: center;
  }
  .hc-dot {
    height: 7px; width: 7px; border-radius: 4px;
    background: #ccc; border: none; padding: 0; cursor: pointer;
    transition: background 0.25s, width 0.3s;
  }
  .hc-dot--active { background: #C03EFF; width: 26px; }

  /* ── Tablet (matches banner @media 768px) ── */
  @media (max-width: 768px) {
    .hc-wrapper {
      padding: 0 14px;         /* matches banner .wrapper mobile padding: 14px */
    }
    .hc-outer {
      padding: 14px 0 12px;
      gap: 10px;
    }
    .hc-arrow--left  { left: 6px; }
    .hc-arrow--right { right: 6px; }
    .hc-arrow { width: 32px; height: 32px; }
    .hc-slide { border-radius: 10px; }
  }

  /* ── Mobile: single column (matches banner @media 520px) ── */
  @media (max-width: 520px) {
    .hc-wrapper {
      padding: 0 14px;         /* same 14px padding, single column */
    }
    .hc-arrow--visible { opacity: 1; pointer-events: auto; }
  }
`;