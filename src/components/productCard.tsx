"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import style from "../styles/productCard.module.css";
import { useCart } from "./CartContext";

const DOMAIN = "https://rehancosmetics.store/";
const PREVIEW_COUNT = 4;

type Product = {
  id: number; name: string; price: number;
  image_url: string; description?: string; tag?: string;
};
type Props = {
  title?: string; products: Product[];
  isFirst?: boolean; categorySlug?: string;
};

function ShareButton({ productId, productName, size = "md" }: { productId: number; productName: string; size?: "sm" | "md"; }) {
  const [state, setState] = useState<"idle" | "copied">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${DOMAIN}/products/${productId}`;
    if (navigator.share) { navigator.share({ title: productName, url }).catch(() => {}); return; }
    navigator.clipboard.writeText(url).then(() => {
      setState("copied");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setState("idle"), 2000);
    });
  };
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  const isSm = size === "sm";
  return (
    <button className={`${style.shareBtn} ${isSm ? style.shareBtnSm : ""} ${state === "copied" ? style.shareBtnCopied : ""}`}
      onClick={handleShare} title="Copy share link" aria-label="Share product">
      {state === "copied" ? (
        <><svg width={isSm ? 11 : 13} height={isSm ? 11 : 13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg><span className={style.shareBtnLabel}>Copied!</span></>
      ) : (
        <><svg width={isSm ? 11 : 13} height={isSm ? 11 : 13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg><span className={style.shareBtnLabel}>Share</span></>
      )}
    </button>
  );
}

function ImageShareBadge({ productId, productName }: { productId: number; productName: string; }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${DOMAIN}/products/${productId}`;
    if (navigator.share) { navigator.share({ title: productName, url }).catch(() => {}); return; }
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    });
  };
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  return (
    <button className={`${style.cardShareBadge} ${copied ? style.cardShareBadgeCopied : ""}`}
      onClick={handleShare} title="Copy share link" aria-label="Share product">
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
      )}
    </button>
  );
}

type LbState = { open: boolean; product: Product | null };

function Lightbox({ product, onClose }: { product: Product; onClose: () => void; }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  const handleAdd = () => {
    addToCart({ id: product.id, name: product.name, price: product.price, image_url: product.image_url });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };
  return createPortal(
    <div className={style.lbOverlay} onClick={onClose}>
      <div className={style.lbBox} onClick={e => e.stopPropagation()}>
        <div className={style.lbTopActions}>
          <ShareButton productId={product.id} productName={product.name} size="sm" />
          <button className={style.lbClose} onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className={style.lbImgWrap}>
          <img src={product.image_url || "https://placehold.co/600x800?text=No+Image"} alt={product.name} className={style.lbImg}/>
        </div>
        <div className={style.lbInfo}>
          {product.tag && <span className={style.lbTag}>{product.tag}</span>}
          <h2 className={style.lbTitle}>{product.name}</h2>
          <p className={style.lbPrice}>RS {product.price.toFixed(2)}</p>
          <div className={style.lbShareRow}><span className={style.lbShareUrl}>rehancosmetics.store/products/{product.id}</span></div>
          <div className={style.lbDivider}/>
          {product.description ? <p className={style.lbDesc}>{product.description}</p> : <p className={style.lbDesc} style={{ opacity: 0.4 }}>No description available.</p>}
          <div className={style.lbBtnGroup}>
            <button className={`${style.lbBtnCart} ${added ? style.lbBtnCartAdded : ""}`} onClick={handleAdd}>
              {added ? "✓ Added to Cart" : "Add to Cart"}
            </button>
            <button className={style.lbBtnDetails} onClick={() => { onClose(); router.push(`/products/${product.id}`); }}>
              View Full Details
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ProductCard({ title = "Featured Collection", products, isFirst = false, categorySlug }: Props) {
  const router = useRouter();
  const { addToCart } = useCart();
  const trackRef = useRef<HTMLDivElement>(null);
  const firstCardRef = useRef<HTMLElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [added, setAdded] = useState<Record<number, boolean>>({});
  const [lb, setLb] = useState<LbState>({ open: false, product: null });

  const displayed = products.slice(0, PREVIEW_COUNT);
  const hasMore = products.length > PREVIEW_COUNT;

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    setTimeout(updateArrows, 150);
    return () => el.removeEventListener("scroll", updateArrows);
  }, [updateArrows]);

  const scroll = (dir: "left" | "right") => {
    const track = trackRef.current;
    const card = firstCardRef.current;
    if (!track || !card) return;
    const step = card.getBoundingClientRect().width + 12;
    track.scrollBy({ left: dir === "right" ? step : -step, behavior: "smooth" });
  };

  const handleAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart({ id: product.id, name: product.name, price: product.price, image_url: product.image_url });
    setAdded(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAdded(prev => ({ ...prev, [product.id]: false })), 1800);
  };

  if (products.length === 0) return null;

  return (
    <>
      <section className={style.section} style={isFirst ? { paddingTop: 56 } : { paddingTop: 32 }}>
        <div className={style.header}>
          <h2 className={style.sectionTitle}>{title}</h2>
          {hasMore && categorySlug && (
            <button className={style.seeAllBtn}
              onClick={() => router.push(`/category/${categorySlug}`)}>
              See All →
            </button>
          )}
        </div>

        <div className={style.carouselOuter}>
          <button className={`${style.arrowOverlay} ${style.arrowLeft} ${!canLeft ? style.arrowHidden : ""}`}
            onClick={() => scroll("left")} aria-label="Scroll left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button className={`${style.arrowOverlay} ${style.arrowRight} ${!canRight ? style.arrowHidden : ""}`}
            onClick={() => scroll("right")} aria-label="Scroll right">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          <div className={style.trackWrapper}>
            <div className={style.track} ref={trackRef}>
              {displayed.map((p, i) => (
                <article className={style.card} key={p.id}
                  ref={el => { if (i === 0) firstCardRef.current = el; }}
                  onClick={() => router.push(`/products/${p.id}`)} style={{ cursor: "pointer" }}>
                  <div className={style.imgWrap} onClick={e => { e.stopPropagation(); setLb({ open: true, product: p }); }}>
                    {p.tag && <span className={style.tag}>{p.tag}</span>}
                    <img src={p.image_url || "https://placehold.co/600x800?text=No+Image"} alt={p.name} className={style.img} loading="lazy"/>
                    <div className={style.zoomHint}>
                      <div className={style.zoomIcon}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                      </div>
                    </div>
                    <ImageShareBadge productId={p.id} productName={p.name}/>
                  </div>
                  <div className={style.info}>
                    <h3 className={style.title}>{p.name}</h3>
                    <p className={style.price}>RS {p.price.toFixed(2)}</p>
                    <div className={style.btnGroup}>
                      <ShareButton productId={p.id} productName={p.name} size="sm"/>
                      <div className={style.btnGroupRight}>
                        <button className={`${style.btnCart} ${added[p.id] ? style.btnCartAdded : ""}`}
                          onClick={e => handleAdd(e, p)}>
                          {added[p.id] ? "✓ Added" : "Add to Cart"}
                        </button>
                        <button className={style.btnLearn}
                          onClick={e => { e.stopPropagation(); router.push(`/products/${p.id}`); }}>
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {hasMore && categorySlug && (
                <article className={style.card} style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 180, background: "#FFE14D", border: "2px solid #111", boxShadow: "3px 3px 0 #111" }}
                  onClick={() => router.push(`/category/${categorySlug}`)}>
                  <div style={{ fontSize: "2rem", marginBottom: 10 }}>→</div>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#111", textAlign: "center", padding: "0 16px" }}>
                    See all {products.length} products
                  </p>
                </article>
              )}
            </div>
          </div>
        </div>
      </section>

      {lb.open && lb.product && (
        <Lightbox product={lb.product} onClose={() => setLb({ open: false, product: null })}/>
      )}
    </>
  );
}