"use client";

export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Navbar from "@/components/navbar";

type OrderItem = { id: number; product_name: string; price: number; quantity: number };
type Order = {
  id: number; total: number; status: string;
  address: string; city: string; phone: string;
  created_at: string; items: OrderItem[];
};

const STATUS: Record<string, { color: string; bg: string; border: string; label: string }> = {
  pending:   { color: "#b45309", bg: "#fef3c7", border: "#fcd34d", label: "Pending" },
  confirmed: { color: "#1d4ed8", bg: "#dbeafe", border: "#93c5fd", label: "Confirmed" },
  shipped:   { color: "#6d28d9", bg: "#ede9fe", border: "#c4b5fd", label: "Shipped" },
  delivered: { color: "#065f46", bg: "#d1fae5", border: "#6ee7b7", label: "Delivered" },
  cancelled: { color: "#991b1b", bg: "#fee2e2", border: "#fca5a5", label: "Cancelled" },
};

const STATUS_STEPS = ["pending", "confirmed", "shipped", "delivered"];

export default function OrdersPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setIsSignedIn(false); setLoading(false); return; }
      setIsSignedIn(true);
      try {
        const res = await fetch("/api/orders", { credentials: "include" });
        if (res.ok) {
          const data = await res.json() as { results: Order[] };
          setOrders(data.results || []);
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    init();
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) { setIsSignedIn(false); setOrders([]); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const toggle = (id: number) => setExpanded(prev => prev === id ? null : id);

  if (isSignedIn === null) return null;

  if (!isSignedIn) return (
    <>
      <Navbar /><style>{css}</style>
      <div className="or-page">
        <div className="or-solo anim-1">
          <span className="or-badge">My Orders</span>
          <h2 className="or-display" style={{ marginTop: 16 }}>Sign in to continue</h2>
          <p className="or-muted">View your order history and track deliveries.</p>
          <div className="or-btn-row" style={{ marginTop: 32 }}>
            <button className="or-btn-primary" onClick={() => router.push("/login")}>Sign In</button>
          </div>
        </div>
      </div>
    </>
  );

  if (loading) return (
    <>
      <Navbar /><style>{css}</style>
      <div className="or-page">
        <div className="or-header anim-1">
          <span className="or-badge">My Orders</span>
          <h1 className="or-display-xl">Your Orders</h1>
        </div>
        <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
          {[1,2,3].map(i => (
            <div key={i} className="or-skeleton" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    </>
  );

  if (orders.length === 0) return (
    <>
      <Navbar /><style>{css}</style>
      <div className="or-page">
        <div className="or-solo anim-1">
          <div className="or-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <span className="or-badge" style={{ marginTop: 20 }}>My Orders</span>
          <h2 className="or-display" style={{ marginTop: 12 }}>Nothing here yet</h2>
          <p className="or-muted">You haven't placed any orders. Start exploring our collection.</p>
          <div className="or-btn-row" style={{ marginTop: 32 }}>
            <button className="or-btn-primary" onClick={() => router.push("/")}>Browse Collection</button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Navbar /><style>{css}</style>
      <div className="or-page">

        <div className="or-header anim-1">
          <span className="or-badge">🛍️ My Orders</span>
          <h1 className="or-display-xl">Your Orders</h1>
          <p className="or-header-sub">{orders.length} order{orders.length !== 1 ? "s" : ""} placed</p>
        </div>

        <div className="or-list">
          {orders.map((order, idx) => {
            const s = STATUS[order.status] || STATUS.pending;
            const isOpen = expanded === order.id;
            const stepIdx = STATUS_STEPS.indexOf(order.status);
            const isCancelled = order.status === "cancelled";

            return (
              <div key={order.id} className="or-card anim-card" style={{ animationDelay: `${idx * 0.07}s` }}>

                <button className="or-card-header" onClick={() => toggle(order.id)}>
                  <div className="or-meta">
                    <span className="or-id">#{String(order.id).padStart(6, "0")}</span>
                    <span className="or-date">
                      {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <div className="or-center">
                    <span className="or-status-pill" style={{ color: s.color, background: s.bg, border: `2px solid ${s.border}` }}>
                      {s.label}
                    </span>
                  </div>
                  <div className="or-right">
                    <span className="or-total">RS {order.total.toFixed(2)}</span>
                    <span className={`or-chevron ${isOpen ? "open" : ""}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </span>
                  </div>
                </button>

                {!isCancelled && stepIdx >= 0 && (
                  <div className="or-progress">
                    {STATUS_STEPS.map((step, i) => {
                      const done = i <= stepIdx;
                      const active = i === stepIdx;
                      return (
                        <div key={step} className="or-step">
                          <div className={`or-dot ${done ? "done" : ""} ${active ? "active" : ""}`} />
                          <span className={`or-step-label ${done ? "done" : ""}`}>{STATUS[step].label}</span>
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={`or-line ${i < stepIdx ? "done" : ""}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className={`or-body ${isOpen ? "open" : ""}`}>
                  <div className="or-body-inner">
                    <div>
                      <div className="or-section-label">Items ordered</div>
                      {order.items.map(item => (
                        <div key={item.id} className="or-item">
                          <div className="or-item-dot" />
                          <span className="or-item-name">{item.product_name}</span>
                          <span className="or-item-qty">×{item.quantity}</span>
                          <span className="or-item-price">RS {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="or-section-label">Delivery details</div>
                      <div className="or-delivery-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>{order.address}, {order.city}</span>
                      </div>
                      <div className="or-delivery-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.64a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/>
                        </svg>
                        <span>{order.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse  { 0%,100% { opacity: 0.4; } 50% { opacity: 0.7; } }

  .anim-1    { animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) both; }
  .anim-card { opacity: 0; animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) forwards; }

  .or-page {
    min-height: 100vh;
    background: #f5f5f5;
    padding: 80px 20px 100px;
    font-family: 'Jost', sans-serif;
  }

  /* Header */
  .or-header { max-width: 780px; margin: 0 auto 32px; }
  .or-display-xl {
    font-family: 'Jost', sans-serif;
    font-size: clamp(2rem, 5vw, 3.4rem);
    font-weight: 900; color: #111;
    letter-spacing: -0.03em; line-height: 1;
    margin-top: 10px;
  }
  .or-display {
    font-family: 'Jost', sans-serif;
    font-size: clamp(1.8rem, 4vw, 2.6rem);
    font-weight: 900; color: #111;
    letter-spacing: -0.03em; line-height: 1;
  }
  .or-header-sub { margin-top: 8px; font-size: 0.82rem; font-weight: 600; color: #aaa; letter-spacing: 0.04em; }

  /* Badge */
  .or-badge {
    display: inline-flex; align-items: center;
    padding: 5px 14px;
    background: #FF3E5E; color: #fff;
    border: 2px solid #111; border-radius: 100px;
    font-size: 0.7rem; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    box-shadow: 2px 2px 0 #111;
  }

  /* Solo card */
  .or-solo {
    max-width: 480px; margin: 60px auto 0;
    background: #fff;
    border: 2.5px solid #111;
    border-radius: 24px; padding: 48px;
    box-shadow: 6px 6px 0 #111;
  }
  .or-empty-icon {
    width: 64px; height: 64px; border-radius: 50%;
    background: #fff0f3;
    border: 2.5px solid #111;
    box-shadow: 3px 3px 0 #111;
    display: flex; align-items: center; justify-content: center;
    color: #FF3E5E;
  }
  .or-muted { font-size: 0.92rem; color: #666; line-height: 1.7; margin-top: 10px; font-weight: 500; max-width: 340px; }
  .or-btn-row { display: flex; flex-wrap: wrap; gap: 12px; }
  .or-btn-primary {
    padding: 13px 28px;
    background: #FF3E5E; color: #fff;
    border: 2px solid #111; border-radius: 100px;
    font-family: 'Jost', sans-serif;
    font-size: 0.78rem; font-weight: 800;
    letter-spacing: 0.08em; text-transform: uppercase;
    cursor: pointer; box-shadow: 3px 3px 0 #111;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .or-btn-primary:hover { transform: translateY(-2px); box-shadow: 3px 5px 0 #111; }

  /* Skeleton */
  .or-skeleton {
    height: 84px; background: #e8e8e8;
    border: 2px solid #ddd; border-radius: 18px;
    animation: pulse 1.6s ease-in-out infinite;
  }

  /* Orders list */
  .or-list { max-width: 780px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

  /* Order card */
  .or-card {
    background: #fff;
    border: 2.5px solid #111;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 4px 4px 0 #111;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .or-card:hover { transform: translateY(-2px); box-shadow: 4px 6px 0 #111; }

  .or-card-header {
    width: 100%; display: flex; align-items: center;
    justify-content: space-between; gap: 12px;
    padding: 20px 24px;
    background: transparent; border: none;
    cursor: pointer; text-align: left; flex-wrap: wrap;
  }

  .or-meta { display: flex; flex-direction: column; gap: 3px; min-width: 110px; }
  .or-id { font-family: 'Jost', sans-serif; font-size: 1rem; font-weight: 800; color: #111; letter-spacing: 0.02em; }
  .or-date { font-size: 0.7rem; font-weight: 600; color: #aaa; letter-spacing: 0.05em; }

  .or-center { flex: 1; display: flex; justify-content: center; }
  .or-status-pill {
    display: inline-flex; align-items: center;
    padding: 5px 14px; border-radius: 100px;
    font-size: 0.68rem; font-weight: 800;
    letter-spacing: 0.1em; text-transform: uppercase;
    box-shadow: 2px 2px 0 rgba(0,0,0,0.1);
  }

  .or-right { display: flex; align-items: center; gap: 14px; }
  .or-total { font-family: 'Jost', sans-serif; font-size: 1.1rem; font-weight: 900; color: #111; letter-spacing: -0.02em; }
  .or-chevron { color: #aaa; transition: transform 0.25s ease; display: flex; align-items: center; }
  .or-chevron.open { transform: rotate(180deg); }

  /* Progress */
  .or-progress {
    display: flex; align-items: flex-start;
    padding: 0 24px 20px; gap: 0;
    border-top: 2px dashed #f0f0f0;
    padding-top: 16px;
  }
  .or-step { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; }
  .or-dot {
    width: 11px; height: 11px; border-radius: 50%;
    background: #e0e0e0; border: 2px solid #ccc;
    transition: background 0.3s, border-color 0.3s; z-index: 1; flex-shrink: 0;
  }
  .or-dot.done { background: #FF3E5E; border-color: #FF3E5E; }
  .or-dot.active { box-shadow: 0 0 0 4px rgba(255,62,94,0.2); }
  .or-step-label {
    font-size: 0.6rem; font-weight: 700; color: #ccc;
    letter-spacing: 0.08em; margin-top: 5px;
    text-transform: uppercase; text-align: center; white-space: nowrap;
  }
  .or-step-label.done { color: #FF3E5E; }
  .or-line {
    position: absolute; top: 4px; left: 50%;
    width: 100%; height: 2px;
    background: #e0e0e0; z-index: 0;
    transition: background 0.3s;
  }
  .or-line.done { background: #FF3E5E; }

  /* Body */
  .or-body { max-height: 0; overflow: hidden; transition: max-height 0.35s cubic-bezier(.22,1,.36,1); }
  .or-body.open { max-height: 600px; }
  .or-body-inner {
    display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
    padding: 20px 24px 24px;
    border-top: 2px solid #f0f0f0;
  }
  .or-section-label {
    font-size: 0.62rem; font-weight: 800;
    letter-spacing: 0.15em; color: #aaa;
    text-transform: uppercase; margin-bottom: 12px;
  }
  .or-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 0; border-bottom: 1.5px solid #f5f5f5;
  }
  .or-item:last-child { border-bottom: none; }
  .or-item-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #FF3E5E; border: 1.5px solid #111; flex-shrink: 0;
  }
  .or-item-name { flex: 1; font-size: 0.87rem; font-weight: 600; color: #111; }
  .or-item-qty  { font-size: 0.72rem; font-weight: 700; color: #aaa; }
  .or-item-price { font-size: 0.9rem; font-weight: 800; color: #111; }
  .or-delivery-row {
    display: flex; align-items: flex-start; gap: 9px;
    padding: 9px 0; font-size: 0.82rem; font-weight: 500;
    color: #555; line-height: 1.5;
    border-bottom: 1.5px solid #f5f5f5;
  }
  .or-delivery-row:last-child { border-bottom: none; }
  .or-delivery-row svg { flex-shrink: 0; margin-top: 2px; color: #FF3E5E; }
@media (max-width: 1024px) {padding: 150px 20px 100px;}

  @media (max-width: 520px) {
    .or-body-inner { grid-template-columns: 1fr; }
    .or-card-header { flex-wrap: wrap; gap: 10px; }
    .or-center { justify-content: flex-start; }
    .or-progress { display: none; }
  }
  @media (max-width: 600px) {
    .or-page { padding: 150px 14px 80px; }
    .or-solo { padding: 32px 20px; margin-top: 95px; }
    .or-card-header { padding: 16px 18px; }
    .or-body-inner { padding: 16px 18px 18px; }
    .or-progress { padding: 12px 18px 16px; }
  }
`;