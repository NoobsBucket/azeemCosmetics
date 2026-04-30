"use client";
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { useCart } from "@/components/CartContext";

type Product = {
  id: number;
  name: string;
  price: number;
  image_url: string;
  description: string;
  category_name: string;
};

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    const search = async () => {
      setLoading(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      // FIX 1: type assertion so TypeScript knows the shape of the response
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json() as { results: Product[] };
      setResults(data.results || []);
      setLoading(false);
    };

    search();
  }, [query]);

  const handleAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
    });

    setAdded(prev => ({ ...prev, [product.id]: true }));
    setTimeout(
      () => setAdded(prev => ({ ...prev, [product.id]: false })),
      1800
    );
  };

  return (
    <>
      <Navbar />

      <div
        style={{
      
          width: "100%",
          padding: "80px 20px 40px",
          background: "linear-gradient(180deg, #fff 0%, #fff5f7 100%)",
          minHeight: "100vh",
          fontFamily: "sans-serif",
          boxSizing: "border-box",
        }}
      >
        {/* HEADER */}
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 900,
            color: "#111",
            marginBottom: 6,
          }}
        >
          Results for{" "}
          <span style={{ color: "#C03EFF" }}>"{query}"</span>
        </h1>

        <p
          style={{
            color: "#666",
            marginBottom: 30,
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          {!loading &&
            `${results.length} product${
              results.length !== 1 ? "s" : ""
            } found`}
        </p>

        {/* LOADING */}
        {loading ? (
          <div style={{ textAlign: "center", marginTop: 80 }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: "4px solid #eee",
                borderTop: "4px solid #C03EFF",
                borderRadius: "50%",
                margin: "0 auto",
                animation: "spin 0.7s linear infinite",
              }}
            />
          </div>
        ) : results.length === 0 ? (
          /* EMPTY STATE */
          <div style={{ textAlign: "center", marginTop: 80 }}>
            <div style={{ fontSize: "3rem" }}>😕</div>
            <p style={{ marginTop: 10, fontWeight: 600 }}>
              No results for <span style={{ color: "#C03EFF" }}>"{query}"</span>
            </p>
            <button
              onClick={() => router.push("/")}
              style={{
                marginTop: 20,
                padding: "10px 24px",
                background: "#C03EFF",
                color: "#fff",
                border: "2px solid #111",
                borderRadius: 10,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "3px 3px 0 #111",
              }}
            >
              Browse Products
            </button>
          </div>
        ) : (
          /* GRID */
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(230px, 1fr))",
              gap: 28,
            }}
          >
            {results.map(product => (
              <div
                key={product.id}
                onClick={() =>
                  router.push(`/products/${product.id}`)
                }
                style={{
                  background: "#fff",
                  border: "2.5px solid #111",
                  borderRadius: 16,
                  cursor: "pointer",
                  overflow: "hidden",
                  boxShadow: "6px 6px 0 #111",
                  transition: "all 0.18s",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = "translate(-4px,-4px)";
                  el.style.boxShadow = "10px 10px 0 #111";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = "translate(0,0)";
                  el.style.boxShadow = "6px 6px 0 #111";
                }}
              >
                {/* IMAGE */}
                <div style={{ position: "relative" }}>
                  <img
                    src={
                      product.image_url ||
                      "https://placehold.co/400x300"
                    }
                    alt={product.name}
                    // FIX 4 (bonus): graceful fallback if image fails to load
                    onError={e => {
                      e.currentTarget.src = "https://placehold.co/400x300";
                    }}
                    style={{
                      width: "100%",
                      height: 180,
                      objectFit: "cover",
                    }}
                  />

                  {/* CATEGORY */}
                  {product.category_name && (
                    <span
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        background: "#C03EFF",
                        color: "#fff",
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "2px solid #111",
                        boxShadow: "2px 2px 0 #111",
                      }}
                    >
                      {product.category_name}
                    </span>
                  )}
                </div>

                {/* CONTENT */}
                <div style={{ padding: 14 }}>
                  <h3
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      color: "#111",
                      marginBottom: 6,
                    }}
                  >
                    {product.name}
                  </h3>

                  <div
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 900,
                      color: "#C03EFF",
                      marginBottom: 12,
                    }}
                  >
                    RS {product.price.toFixed(2)}
                  </div>

                  {/* BUTTONS */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={e => handleAdd(e, product)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        background: added[product.id]
                          ? "#00c853"
                          : "#C03EFF",
                        color: "#fff",
                        border: "2px solid #111",
                        borderRadius: 8,
                        fontWeight: 800,
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        boxShadow: "2px 2px 0 #111",
                      }}
                    >
                      {added[product.id] ? "✓ Added" : "Add"}
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        router.push(
                          `/products/${product.id}`
                        );
                      }}
                      style={{
                        flex: 1,
                        padding: "8px",
                        background: "#fff",
                        color: "#111",
                        border: "2px solid #111",
                        borderRadius: 8,
                        fontWeight: 800,
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        boxShadow: "2px 2px 0 #111",
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SPINNER ANIMATION */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: "center", marginTop: 120 }}>
          Loading...
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}