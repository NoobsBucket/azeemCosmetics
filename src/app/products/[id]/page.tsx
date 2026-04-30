"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import type { User } from "@supabase/supabase-js";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import Navbar from "@/components/navbar";
import { useCart } from "@/components/CartContext";
import { getSupabaseBrowser } from '@/lib/supabase-browser';

type ProductResponse = { product: Product };
type ReviewsResponse = { results: Review[] };
type ErrorResponse   = { error?: string };
type ProductImage    = { id: number; image_url: string; sort_order: number };
type Product = {
  id: number; name: string; price: number;
  description: string; category_id: number; images: ProductImage[];
};
type Review = {
  id: number; user_id: string; user_name: string;
  rating: number; comment: string; created_at: string;
};

/* ── Star Rating ── */
function StarRating({ value, onChange, size = "1.2rem" }: {
  value: number; onChange?: (v: number) => void; size?: string;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map(star => (
        <span key={star}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          style={{
            fontSize: size, cursor: onChange ? "pointer" : "default",
            color: star <= (hovered || value) ? "#C03EFF" : "#ddd",
            transition: "color 0.12s, transform 0.12s", display: "inline-block",
            transform: hovered === star && onChange ? "scale(1.25)" : "scale(1)",
          }}>★</span>
      ))}
    </div>
  );
}

/* ── Lightbox ── */
function ImageLightbox({ images, activeIndex, productName, onClose }: {
  images: ProductImage[]; activeIndex: number;
  productName: string; onClose: () => void;
}) {
  const [current, setCurrent] = useState(activeIndex);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowRight") setCurrent(c => Math.min(c + 1, images.length - 1));
      if (e.key === "ArrowLeft")  setCurrent(c => Math.max(c - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, images.length]);

  return createPortal(
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.92)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "20px 20px 110px",
    }}>
      <button onClick={onClose} style={{
        position: "fixed", top: 16, right: 16,
        width: 40, height: 40, borderRadius: "50%",
        border: "2px solid #fff", background: "none",
        color: "#fff", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {current > 0 && (
        <button onClick={e => { e.stopPropagation(); setCurrent(c => c - 1); }} style={{
          position: "fixed", left: 16, top: "50%", transform: "translateY(-50%)",
          width: 44, height: 44, borderRadius: "50%",
          border: "2px solid #fff", background: "none",
          color: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      )}
      {current < images.length - 1 && (
        <button onClick={e => { e.stopPropagation(); setCurrent(c => c + 1); }} style={{
          position: "fixed", right: 16, top: "50%", transform: "translateY(-50%)",
          width: 44, height: 44, borderRadius: "50%",
          border: "2px solid #fff", background: "none",
          color: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      )}

      <img src={images[current].image_url} alt={productName}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: "88vw", maxHeight: "72vh", objectFit: "contain", borderRadius: 12, border: "3px solid #fff" }}
      />

      {images.length > 1 && (
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontFamily: "Jost, sans-serif", margin: "12px 0 10px" }}>
          {current + 1} / {images.length}
        </p>
      )}

      {images.length > 1 && (
        <div onClick={e => e.stopPropagation()} style={{
          position: "fixed", bottom: 20,
          display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", padding: "0 20px",
        }}>
          {images.map((img, i) => (
            <div key={img.id} onClick={() => setCurrent(i)} style={{
              width: 54, height: 54, borderRadius: 8, overflow: "hidden", cursor: "pointer",
              border: current === i ? "3px solid #C03EFF" : "3px solid rgba(255,255,255,0.25)",
              boxShadow: current === i ? "2px 2px 0 #111" : "none",
              opacity: current === i ? 1 : 0.5, transition: "all 0.2s",
            }}>
              <img src={img.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      )}
      <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.7rem", fontFamily: "Jost, sans-serif", margin: 0 }}>
        ESC to close · ← → to navigate
      </p>
    </div>,
    document.body
  );
}

/* ── Main Page ── */
export default function ProductDetailPage() {
  const { id }        = useParams();
  const router        = useRouter();
  const { addToCart } = useCart();
  const supabase      = getSupabaseBrowser();

  const [user,         setUser]         = useState<User | null | undefined>(undefined);
  const [adminEmails,  setAdminEmails]  = useState<string[]>([]);
  const [product,      setProduct]      = useState<Product | null>(null);
  const [activeImg,    setActiveImg]    = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [added,        setAdded]        = useState(false);
  const [reviews,      setReviews]      = useState<Review[]>([]);
  const [rating,       setRating]       = useState(0);
  const [comment,      setComment]      = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const reviewsRef = useRef<HTMLDivElement>(null);

  const isAdmin    = !!(user?.email && adminEmails.includes(user.email));
  const isSignedIn = !!user;

  // Auth — singleton
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Admin emails from D1
  useEffect(() => {
    fetch("/api/settings?key=admin_emails")
      .then(r => r.json())
      .then((data: unknown) => {
        const d = data as { settings?: Record<string, string> };
        const raw = d?.settings?.admin_emails;
        if (raw) { try { setAdminEmails(JSON.parse(raw)); } catch { /* ignore */ } }
      }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/products?id=${id}`)
      .then(r => r.json() as Promise<ProductResponse>)
      .then(d => setProduct(d.product));
  }, [id]);

  const fetchReviews = () => {
    if (!id) return;
    fetch(`/api/reviews?product_id=${id}`, { credentials: "include" })
      .then(r => r.json() as Promise<ReviewsResponse>)
      .then(d => setReviews(d.results || []));
  };
  useEffect(() => { fetchReviews(); }, [id]);

  const handleAdd = () => {
    if (!product) return;
    addToCart({ id: product.id, name: product.name, price: product.price, image_url: product.images?.[0]?.image_url || "" });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart({ id: product.id, name: product.name, price: product.price, image_url: product.images?.[0]?.image_url || "" });
    router.push("/checkout");
  };

  const submitReview = async () => {
    if (!rating)         return alert("Please select a rating");
    if (!comment.trim()) return alert("Please write a comment");
    setSubmitting(true);
    try {
      const res  = await fetch("/api/reviews", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product_id: Number(id), rating, comment }),
      });
      const data = await res.json() as ErrorResponse;
      if (res.ok) { setRating(0); setComment(""); fetchReviews(); }
      else alert(data.error || "Failed");
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const deleteReview = async (reviewId: number) => {
    if (!confirm("Delete this review?")) return;
    await fetch("/api/reviews", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ id: reviewId }),
    });
    fetchReviews();
  };

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  /* ── Loading ── */
  if (!product) return (
    <>
      <Navbar />
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, border: "3px solid #ddd", borderTop: "3px solid #111", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 14px" }} />
          <p style={{ color: "#999", fontFamily: "Jost, sans-serif", fontSize: "0.85rem" }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );

  const images = product.images?.length
    ? product.images
    : [{ id: 0, image_url: "https://placehold.co/800x800?text=No+Image", sort_order: 0 }];

  return (
    <>
      <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700;800&display=swap');
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

        .pd-page { background: #f5f5f5; min-height: 100vh; font-family: 'Jost', sans-serif; }
        .pd-wrap { max-width: 1100px; margin: 60px auto; padding: 28px 24px 100px; animation: fadeUp 0.4s ease both; }

        .pd-back {
          display: inline-flex; align-items: center; gap: 6px;
          background: #fff; border: 2px solid #111; border-radius: 100px;
          padding: 6px 14px; font-family: 'Jost', sans-serif;
          font-size: 0.78rem; font-weight: 700; color: #111;
          cursor: pointer; box-shadow: 2px 2px 0 #111;
          transition: all 0.15s; margin-bottom: 28px;
        }
        .pd-back:hover { background: #FFE14D; transform: translateY(-1px); box-shadow: 2px 3px 0 #111; }

        .pd-grid { display: flex; gap: 48px; align-items: flex-start; }
        .pd-img-col { flex: 1 1 420px; position: sticky; top: 24px; }
        .pd-info-col { flex: 1 1 320px; }

        /* Main image */
        .pd-main-img {
          width: 100%; aspect-ratio: 3/4;
          border: 3px solid #111; border-radius: 16px;
          overflow: hidden; background: #fff;
          box-shadow: 6px 6px 0 #111; cursor: zoom-in;
          position: relative;
        }
        .pd-main-img img {
          width: 100%; height: 100%; object-fit: cover; object-position: top;
          display: block; transition: transform 0.4s ease;
        }
        .pd-main-img:hover img { transform: scale(1.04); }
        .pd-zoom-badge {
          position: absolute; bottom: 12px; right: 12px;
          background: #FFE14D; border: 2px solid #111; border-radius: 100px;
          padding: 4px 10px; font-size: 0.65rem; font-weight: 800;
          letter-spacing: 0.1em; text-transform: uppercase; color: #111;
          box-shadow: 2px 2px 0 #111; pointer-events: none;
          opacity: 0; transition: opacity 0.2s;
        }
        .pd-main-img:hover .pd-zoom-badge { opacity: 1; }

        /* Thumbnails */
        .pd-thumbs { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
        .pd-thumb {
          width: 64px; height: 64px; border-radius: 10px; overflow: hidden;
          cursor: pointer; transition: all 0.15s; flex-shrink: 0;
        }
        .pd-thumb img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }

        /* Info */
        .pd-eyebrow {
          font-size: 0.62rem; font-weight: 800; letter-spacing: 0.18em;
          text-transform: uppercase; color: #C03EFF; margin-bottom: 8px;
        }
        .pd-title {
          font-size: clamp(1.5rem, 4vw, 2rem); font-weight: 800;
          color: #111; line-height: 1.15; letter-spacing: -0.02em;
          margin: 0 0 12px;
        }
        .pd-price {
          display: inline-block;
          font-size: 1.7rem; font-weight: 800; color: #111;
          background: #FFE14D; border: 2.5px solid #111;
          border-radius: 10px; padding: 6px 16px;
          box-shadow: 3px 3px 0 #111; margin-bottom: 20px;
        }
        .pd-desc {
          color: #555; line-height: 1.8; font-size: 0.9rem;
          margin: 0 0 24px; border-left: 3px solid #FFE14D;
          padding-left: 14px;
        }
        .pd-divider { height: 2px; background: #111; margin-bottom: 20px; border-radius: 2px; }

        /* Buttons */
        .pd-btn-buy {
          width: 100%; padding: 15px; background: #C03EFF; color: #fff;
          border: 2.5px solid #111; border-radius: 12px; font-weight: 800;
          font-size: 0.95rem; cursor: pointer; font-family: 'Jost', sans-serif;
          box-shadow: 4px 4px 0 #111; transition: all 0.15s;
          letter-spacing: 0.04em;
        }
        .pd-btn-buy:hover { background: #e8304f; transform: translateY(-2px); box-shadow: 4px 6px 0 #111; }
        .pd-btn-cart {
          width: 100%; padding: 15px; color: #111;
          border: 2.5px solid #111; border-radius: 12px; font-weight: 800;
          font-size: 0.95rem; cursor: pointer; font-family: 'Jost', sans-serif;
          box-shadow: 4px 4px 0 #111; transition: all 0.15s;
          letter-spacing: 0.04em;
        }
        .pd-btn-cart:hover { transform: translateY(-2px); box-shadow: 4px 6px 0 #111; }

        /* Trust badges */
        .pd-trust { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 18px; }
        .pd-trust-item {
          display: flex; align-items: center; gap: 6px;
          background: #fff; border: 2px solid #111; border-radius: 100px;
          padding: 5px 12px; font-size: 0.72rem; font-weight: 700;
          color: #111; box-shadow: 2px 2px 0 #111;
        }

        /* Reviews section */
        .pd-reviews-section { margin-top: 60px; }
        .pd-section-title {
          font-size: 1.4rem; font-weight: 800; color: #111;
          letter-spacing: -0.02em; margin: 0 0 24px;
          display: flex; align-items: center; gap: 12px;
        }
        .pd-section-title::after {
          content: ''; flex: 1; height: 3px;
          background: #111; border-radius: 2px;
        }

        .pd-review-form {
          background: #fff; border: 2.5px solid #111; border-radius: 16px;
          padding: 24px; box-shadow: 4px 4px 0 #111; margin-bottom: 32px;
        }
        .pd-review-form h3 {
          margin: 0 0 16px; font-size: 0.9rem; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.1em; color: #111;
        }
        .pd-review-textarea {
          width: 100%; min-height: 90px; padding: 12px 14px;
          border: 2px solid #111; border-radius: 10px;
          font-size: 0.88rem; resize: vertical; box-sizing: border-box;
          font-family: 'Jost', sans-serif; background: #f5f5f5;
          outline: none; color: #111; margin-top: 12px;
          transition: box-shadow 0.15s;
        }
        .pd-review-textarea:focus { box-shadow: 3px 3px 0 #111; background: #fff; }
        .pd-submit-btn {
          margin-top: 12px; padding: 10px 24px;
          background: #111; color: #fff; border: 2.5px solid #111;
          border-radius: 100px; font-weight: 700; cursor: pointer;
          font-family: 'Jost', sans-serif; font-size: 0.82rem;
          box-shadow: 2px 2px 0 #111; transition: all 0.15s;
        }
        .pd-submit-btn:hover { background: #333; transform: translateY(-1px); box-shadow: 2px 3px 0 #111; }
        .pd-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .pd-signin-prompt {
          background: #fff; border: 2.5px solid #111; border-radius: 16px;
          padding: 28px; text-align: center; box-shadow: 4px 4px 0 #111; margin-bottom: 32px;
        }
        .pd-signin-btn {
          padding: 10px 24px; background: #C03EFF; color: #fff;
          border: 2.5px solid #111; border-radius: 100px;
          font-weight: 700; cursor: pointer; font-family: 'Jost', sans-serif;
          box-shadow: 2px 2px 0 #111; transition: all 0.15s;
        }
        .pd-signin-btn:hover { background: #e8304f; transform: translateY(-1px); }

        .pd-reviews-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .pd-review-card {
          background: #fff; border: 2.5px solid #111; border-radius: 14px;
          padding: 18px; box-shadow: 3px 3px 0 #111;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .pd-review-card:hover { transform: translateY(-2px); box-shadow: 3px 5px 0 #111; }
        .pd-reviewer-name { font-weight: 800; font-size: 0.88rem; color: #111; margin-bottom: 4px; }
        .pd-review-comment { color: #555; line-height: 1.7; font-size: 0.84rem; margin: 10px 0 0; }
        .pd-delete-btn {
          background: none; border: 1.5px solid #E11D48; color: #E11D48;
          cursor: pointer; font-size: 0.68rem; padding: 3px 10px;
          border-radius: 100px; font-family: 'Jost', sans-serif; font-weight: 700;
          letter-spacing: 0.06em; transition: all 0.15s;
        }
        .pd-delete-btn:hover { background: #E11D48; color: #fff; }

        .pd-no-reviews {
          text-align: center; padding: 48px 0; color: #bbb;
          border: 2.5px dashed #ddd; border-radius: 16px;
        }
        .pd-avg-badge {
          background: #FFE14D; border: 2px solid #111; border-radius: 100px;
          padding: 4px 14px; font-weight: 800; font-size: 0.82rem; color: #111;
          box-shadow: 2px 2px 0 #111; display: inline-flex; align-items: center; gap: 6px;
        }
        @media (max-width: 1025px){
        .pd-wrap {margin: 126px auto;}
        }
        @media (max-width: 768px) {
          .pd-wrap {margin: 128px auto;}
          .pd-grid { flex-direction: column; gap: 0; }
          .pd-img-col { position: relative; top: 0; flex: none; width: 100%; }
          .pd-info-col { flex: none; width: 100%; }
          .pd-reviews-grid { grid-template-columns: 1fr; }
          .pd-main-img { border-radius: 12px; }
          .pd-info-inner { padding-top: 20px; }
        }
        @media (max-width: 480px) {
          .pd-wrap { padding: 147px 14px 80px}
          .pd-main-img { border-left: none; border-right: none; border-radius: 0; }
        }
      `}</style>

      <div className="pd-page">
        <div className="pd-wrap">

          <button className="pd-back" onClick={() => router.back()}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>

          <div className="pd-grid">

            {/* ── Image Column ── */}
            <div className="pd-img-col">
              <div className="pd-main-img" onClick={() => setLightboxOpen(true)}>
                <img key={images[activeImg].image_url} src={images[activeImg].image_url} alt={product.name} />
                <span className="pd-zoom-badge">ZOOM</span>
              </div>

              {images.length > 1 && (
                <div className="pd-thumbs">
                  {images.map((img, i) => (
                    <div key={img.id} className="pd-thumb"
                      onClick={() => setActiveImg(i)}
                      style={{
                        border: activeImg === i ? "2.5px solid #C03EFF" : "2.5px solid #111",
                        boxShadow: activeImg === i ? "2px 2px 0 #C03EFF" : "2px 2px 0 #111",
                        opacity: activeImg === i ? 1 : 0.6,
                      }}
                    >
                      <img src={img.image_url} alt="" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Info Column ── */}
            <div className="pd-info-col">
              <div className="pd-info-inner">
                <p className="pd-eyebrow">Product Details</p>
                <h1 className="pd-title">{product.name}</h1>

                {reviews.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, cursor: "pointer" }}
                    onClick={() => reviewsRef.current?.scrollIntoView({ behavior: "smooth" })}>
                    <StarRating value={Math.round(avgRating)} size="0.9rem" />
                    <span style={{ fontSize: "0.78rem", color: "#888", fontWeight: 600 }}>
                      {avgRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                <div className="pd-price">RS {product.price.toFixed(2)}</div>

                <div className="pd-divider" />

                {product.description && (
                  <p className="pd-desc">{product.description}</p>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  <button className="pd-btn-buy" onClick={handleBuyNow}>Buy Now →</button>
                  <button className="pd-btn-cart" onClick={handleAdd}
                    style={{ background: added ? "#00D084" : "#FFE14D" }}>
                    {added ? "✓ Added to Cart!" : "Add to Cart"}
                  </button>
                </div>

                <div className="pd-trust">
                  {[["🚚", "Fast Delivery"], ["🔄", "Easy Returns"], ["🔒", "Secure Pay"]].map(([icon, label]) => (
                    <div key={label} className="pd-trust-item">
                      <span style={{ fontSize: "0.9rem" }}>{icon}</span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Reviews ── */}
          <div className="pd-reviews-section" ref={reviewsRef}>
            <h2 className="pd-section-title">
              Reviews
              {reviews.length > 0 && (
                <span className="pd-avg-badge">
                  <StarRating value={Math.round(avgRating)} size="0.75rem" />
                  {avgRating.toFixed(1)} ({reviews.length})
                </span>
              )}
            </h2>

            {/* Write review */}
            {user === undefined ? null : isSignedIn ? (
              <div className="pd-review-form">
                <h3>Write a Review</h3>
                <div>
                  <label style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#aaa" }}>Your Rating</label>
                  <div style={{ marginTop: 6 }}><StarRating value={rating} onChange={setRating} size="1.6rem" /></div>
                </div>
                <textarea className="pd-review-textarea"
                  placeholder="What did you think of this product?"
                  value={comment} onChange={e => setComment(e.target.value)}
                />
                <br />
                <button className="pd-submit-btn" onClick={submitReview} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            ) : (
              <div className="pd-signin-prompt">
                <p style={{ margin: "0 0 14px", color: "#888", fontSize: "0.9rem", fontWeight: 600 }}>Sign in to leave a review</p>
                <button className="pd-signin-btn" onClick={() => router.push("/login")}>Sign In</button>
              </div>
            )}

            {/* Reviews list */}
            {reviews.length === 0 ? (
              <div className="pd-no-reviews">
                <div style={{ fontSize: "2rem", marginBottom: 10 }}>★</div>
                <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600 }}>No reviews yet — be the first!</p>
              </div>
            ) : (
              <div className="pd-reviews-grid">
                {reviews.map(review => (
                  <div key={review.id} className="pd-review-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div className="pd-reviewer-name">{review.user_name}</div>
                        <StarRating value={review.rating} size="0.85rem" />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                        <span style={{ color: "#bbb", fontSize: "0.7rem", fontWeight: 600 }}>
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                        {(user?.id === review.user_id || isAdmin) && (
                          <button className="pd-delete-btn" onClick={() => deleteReview(review.id)}>
                            {isAdmin && user?.id !== review.user_id ? "Delete (Admin)" : "Delete"}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="pd-review-comment">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {lightboxOpen && (
        <ImageLightbox
          images={images}
          activeIndex={activeImg}
          productName={product.name}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}