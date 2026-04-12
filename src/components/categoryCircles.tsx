"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: number; name: string; slug: string; image_url?: string };

export default function CategoryCircles() {
  const [categories, setCategories] = useState<Category[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json() as Promise<{ results: Category[] }>)
      .then(d => setCategories(d.results || []));
  }, []);

  if (categories.length === 0) return null;

  return (
    <>
      <style>{css}</style>
      <section className="cc-wrap">
        <div className="cc-track" ref={trackRef}>
          {categories.map(cat => (
            <button
              key={cat.id}
              className="cc-item"
              onClick={() => router.push(`/category/${cat.slug}`)}
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
      </section>
    </>
  );
}

const css = `
  .cc-wrap {
    width: 100%;
    padding: 20px 20px 16px;
    background: #fff;
    margin-top: 60px;
  }

  .cc-track {
    display: flex;
    gap: 20px;
    overflow-x: auto;
    scrollbar-width: none;
    padding:6px 32px 5px;
    /* fade edges to hint scrollability */
    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 4%, black 90%, transparent 100%);
    mask-image: linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%);
  }
  .cc-track::-webkit-scrollbar { display: none; }

  .cc-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 9px;
    background: none;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
    transition: transform 0.18s;
  }
  .cc-item:hover { transform: translateY(-4px); }
  .cc-item:active { transform: translateY(-1px); }

  /* Bold gradient ring */
  .cc-ring {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #FF3E5E 0%, #FFE14D 50%, #00D084 100%);
    padding: 3px;
    box-shadow: 3px 3px 0 #111;
    transition: box-shadow 0.2s, background 0.25s, transform 0.18s;
  }
  .cc-item:hover .cc-ring {
    background: linear-gradient(135deg, #111 0%, #444 100%);
    box-shadow: 4px 4px 0 #111;
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
    max-width: 80px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  /* Mobile */
  @media (max-width: 600px) {
    .cc-wrap {
      padding: 14px 12px 12px;
      margin-top: 60px;
    }
    .cc-ring {
      width: 68px;
      height: 68px;
    }
    .cc-label {
      font-size: 0.65rem;
      max-width: 68px;
    }
    .cc-track {
      gap: 14px;
      padding : 60px 32px 5px;
    }
  }
`;