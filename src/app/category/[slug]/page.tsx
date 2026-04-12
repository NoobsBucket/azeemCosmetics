"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { useCart } from "@/components/CartContext";

type Product = {
  id: number; name: string; price: number;
  image_url: string; description?: string;
};
type Category = { id: number; name: string; slug: string; image_url?: string };

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { addToCart } = useCart();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [added, setAdded] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch("/api/categories").then(r => r.json() as Promise<{ results: Category[] }>),
      fetch("/api/products").then(r => r.json() as Promise<{ results: Product[] }>),
    ]).then(([catData, prodData]) => {
      const cat = catData.results?.find(c => c.slug === slug);
      setCategory(cat || null);
      if (cat) {
        fetch(`/api/products?category_id=${cat.id}`)
          .then(r => r.json() as Promise<{ results: Product[] }>)
          .then(d => {
            setProducts(d.results || []);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });
  }, [slug]);

  const handleAdd = (p: Product) => {
    addToCart({ id: p.id, name: p.name, price: p.price, image_url: p.image_url });
    setAdded(prev => ({ ...prev, [p.id]: true }));
    setTimeout(() => setAdded(prev => ({ ...prev, [p.id]: false })), 1800);
  };

  return (
    <>
      <style>{css}</style>
      <Navbar />
      <main className="cat-page">
        {loading ? (
          <div className="cat-loading">
            <div className="cat-spinner" />
          </div>
        ) : !category ? (
          <div className="cat-empty">
            <h2>Category not found</h2>
            <button className="cat-back-btn" onClick={() => router.push("/")}>← Back to Home</button>
          </div>
        ) : (
          <>
            <div className="cat-header">
              {category.image_url && (
                <div className="cat-header-img-wrap">
                  <img src={category.image_url} alt={category.name} className="cat-header-img" />
                </div>
              )}
              <div>
                <p className="cat-header-eyebrow">Category</p>
                <h1 className="cat-header-title">{category.name}</h1>
                <p className="cat-header-count">{products.length} product{products.length !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="cat-empty">
                <p>No products in this category yet.</p>
                <button className="cat-back-btn" onClick={() => router.push("/")}>← Back to Home</button>
              </div>
            ) : (
              <div className="cat-grid">
                {products.map(p => (
                  <article key={p.id} className="cat-card"
                    onClick={() => router.push(`/products/${p.id}`)}>
                    <div className="cat-card-img-wrap">
                      <img
                        src={p.image_url || "https://placehold.co/400x500?text=No+Image"}
                        alt={p.name} className="cat-card-img" loading="lazy"
                      />
                    </div>
                    <div className="cat-card-info">
                      <h3 className="cat-card-name">{p.name}</h3>
                      <p className="cat-card-price">RS {p.price.toFixed(2)}</p>
                      <div className="cat-card-btns">
                        <button className={`cat-btn-cart ${added[p.id] ? "cat-btn-cart--added" : ""}`}
                          onClick={e => { e.stopPropagation(); handleAdd(p); }}>
                          {added[p.id] ? "✓ Added" : "Add to Cart"}
                        </button>
                        <button className="cat-btn-details"
                          onClick={e => { e.stopPropagation(); router.push(`/products/${p.id}`); }}>
                          Details
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}

const css = `
  .cat-page {
    min-height: 100vh;
    background: #f5f5f5;
    padding: 80px 24px 80px;
    font-family: 'Jost', sans-serif;
  }
  .cat-loading {
    display: flex; align-items: center; justify-content: center;
    height: 60vh;
  }
  .cat-spinner {
    width: 36px; height: 36px;
    border: 3px solid #ddd; border-top-color: #111;
    border-radius: 50%; animation: catSpin 0.7s linear infinite;
  }
  @keyframes catSpin { to { transform: rotate(360deg); } }

  .cat-header {
    max-width: 1200px; margin: 0 auto 40px;
    display: flex; align-items: center; gap: 24px;
    padding: 28px; background: #fff;
    border: 2px solid #111; border-radius: 16px;
    box-shadow: 4px 4px 0 #111;
  }
  .cat-header-img-wrap {
    width: 80px; height: 80px; border-radius: 50%; overflow: hidden;
    border: 2.5px solid #111; flex-shrink: 0;
    box-shadow: 3px 3px 0 #111;
  }
  .cat-header-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cat-header-eyebrow {
    font-size: 0.68rem; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; color: #888; margin-bottom: 4px;
  }
  .cat-header-title {
    font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 700;
    color: #111; letter-spacing: -0.03em; line-height: 1;
  }
  .cat-header-count {
    font-size: 0.82rem; color: #888; margin-top: 6px; font-weight: 500;
  }

  .cat-empty {
    max-width: 400px; margin: 80px auto; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 16px;
  }
  .cat-empty h2 { font-size: 1.4rem; font-weight: 700; color: #111; }
  .cat-empty p  { font-size: 0.9rem; color: #666; }
  .cat-back-btn {
    padding: 10px 22px; background: #FFE14D; color: #111;
    border: 2px solid #111; border-radius: 100px;
    font-family: 'Jost', sans-serif; font-size: 0.82rem; font-weight: 700;
    cursor: pointer; box-shadow: 2px 2px 0 #111; transition: all 0.15s;
  }
  .cat-back-btn:hover { transform: translateY(-2px); box-shadow: 2px 4px 0 #111; }

  .cat-grid {
    max-width: 1200px; margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
  }
  .cat-card {
    background: #fff; border: 2px solid #111; border-radius: 14px;
    overflow: hidden; cursor: pointer;
    box-shadow: 3px 3px 0 #111; transition: transform 0.18s, box-shadow 0.18s;
  }
  .cat-card:hover { transform: translateY(-4px); box-shadow: 3px 7px 0 #111; }
  .cat-card-img-wrap { width: 100%; aspect-ratio: 3/4; overflow: hidden; }
  .cat-card-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s; }
  .cat-card:hover .cat-card-img { transform: scale(1.04); }
  .cat-card-info { padding: 14px; border-top: 2px solid #111; }
  .cat-card-name { font-size: 0.9rem; font-weight: 700; color: #111; margin-bottom: 4px; }
  .cat-card-price { font-size: 0.85rem; font-weight: 600; color: #444; margin-bottom: 12px; }
  .cat-card-btns { display: flex; gap: 8px; }
  .cat-btn-cart {
    flex: 1; padding: 8px 10px; background: #111; color: #fff;
    border: 2px solid #111; border-radius: 100px;
    font-family: 'Jost', sans-serif; font-size: 0.72rem; font-weight: 700;
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
  }
  .cat-btn-cart--added { background: #00D084; border-color: #00D084; color: #111; }
  .cat-btn-cart:hover:not(.cat-btn-cart--added) { background: #333; }
  .cat-btn-details {
    padding: 8px 12px; background: #FFE14D; color: #111;
    border: 2px solid #111; border-radius: 100px;
    font-family: 'Jost', sans-serif; font-size: 0.72rem; font-weight: 700;
    cursor: pointer; box-shadow: 2px 2px 0 #111; transition: all 0.15s;
  }
  .cat-btn-details:hover { transform: translateY(-1px); box-shadow: 2px 3px 0 #111; }

  @media (max-width: 600px) {
    .cat-page { padding: 80px 14px 80px; }
    .cat-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .cat-header {
     flex-direction: column;
      align-items: flex-start;
       margin-top:46px;
       }
  }
`;