"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type CarouselItem = {
  id: number;
  image_url: string;
  link_type: string;
  link_value: string;
  sort_order: number;
};

export default function InfiniteCarousel() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/carousel")
      .then(r => r.json() as Promise<{ results: CarouselItem[] }>)
      .then(d => setItems(d.results || []));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || items.length === 0) return;

    let pos = 0;
    const speed = 0.6;

    const animate = () => {
      if (!pausedRef.current) {
        pos += speed;
        const half = track.scrollWidth / 2;
        if (pos >= half) pos = 0;
        track.style.transform = `translateX(-${pos}px)`;
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [items]);

  const handleClick = (item: CarouselItem) => {
    if (item.link_type === "product") {
      router.push(`/products/${item.link_value}`);
    } else {
      router.push(`/category/${item.link_value}`);
    }
  };

  if (items.length === 0) return null;

  const doubled = [...items, ...items];

  return (
    <>
      <style>{css}</style>
      <div className="ic-wrap"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}>
        <div className="ic-track" ref={trackRef}>
          {doubled.map((item, i) => (
            <button key={`${item.id}-${i}`} className="ic-slide"
              onClick={() => handleClick(item)}
              aria-label={`Go to ${item.link_type} ${item.link_value}`}>
              <img src={item.image_url} alt="" className="ic-img" loading="lazy" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

const css = `
  .ic-wrap {
    width: 100%;
    overflow: hidden;
    border-bottom: 2px solid #111;
    background: #fff;
    padding: 14px 0;
    cursor: grab;
  }
  .ic-track {
    display: flex;
    gap: 12px;
    width: max-content;
    will-change: transform;
  }
  .ic-slide {
    flex-shrink: 0;
    width: 220px; height: 140px;
    border: 2px solid #111;
    border-radius: 12px;
    overflow: hidden;
    padding: 0; background: none; cursor: pointer;
    box-shadow: 3px 3px 0 #111;
    transition: transform 0.18s, box-shadow 0.18s;
  }
  .ic-slide:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 3px 7px 0 #111;
  }
  .ic-img {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
    pointer-events: none;
  }
`;