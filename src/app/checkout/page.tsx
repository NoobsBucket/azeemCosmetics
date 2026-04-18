"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Navbar from "@/components/navbar";
import { useCart } from "@/components/CartContext";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setIsSignedIn(!!data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsSignedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const [address, setAddress] = useState("");
  const [city, setCity]       = useState("");
  const [phone, setPhone]     = useState("");
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const placeOrder = async () => {
    if (!address.trim() || !city.trim() || !phone.trim())
      return alert("Please fill all fields");
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          address: address.trim(), city: city.trim(), phone: phone.trim(),
          items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        }),
      });
      const data = (await res.json()) as { orderId: number; error?: string };
      if (res.ok) { clearCart(); setOrderId(data.orderId); setSuccess(true); }
      else alert(data.error || "Failed to place order");
    } catch (err) {
      console.error(err); alert("Something went wrong");
    } finally {
      setPlacing(false);
    }
  };

  /* ── Success ── */
  if (success) return (
    <>
      <Navbar />
      <style>{css}</style>
      <div className="co-page">
        <div className="co-solo anim-1">
          <div className="co-check-ring">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <span className="co-badge">Order Confirmed 🎉</span>
          <h1 className="co-display">Thank you!</h1>
          <p className="co-muted">Your order is being prepared. We'll keep you updated every step of the way.</p>
          <p className="co-order-num">Order #{String(orderId).padStart(6, "0")}</p>
          <div className="co-btn-row">
            <button className="co-btn-primary" onClick={() => router.push("/orders")}>View Orders</button>
            <button className="co-btn-ghost" onClick={() => router.push("/")}>Keep Shopping</button>
          </div>
        </div>
      </div>
    </>
  );

  /* ── Loading ── */
  if (isSignedIn === null) return (
    <>
      <Navbar />
      <style>{css}</style>
      <div className="co-page co-center">
        <div className="co-spinner" />
      </div>
    </>
  );

  /* ── Not signed in ── */
  if (!isSignedIn) return (
    <>
      <Navbar />
      <style>{css}</style>
      <div className="co-page">
        <div className="co-solo anim-1">
          <span className="co-badge">Checkout</span>
          <h2 className="co-display" style={{ marginTop: 16 }}>Sign in to continue</h2>
          <p className="co-muted">You'll need an account to securely place your order.</p>
          <div className="co-btn-row" style={{ marginTop: 32 }}>
            <button className="co-btn-primary" onClick={() => router.push("/login")}>Sign In</button>
          </div>
        </div>
      </div>
    </>
  );

  /* ── Empty cart ── */
  if (items.length === 0) return (
    <>
      <Navbar />
      <style>{css}</style>
      <div className="co-page">
        <div className="co-solo anim-1">
          <span className="co-badge">Your Cart</span>
          <h2 className="co-display" style={{ marginTop: 16 }}>Nothing here yet</h2>
          <p className="co-muted">Add items to your cart before heading to checkout.</p>
          <div className="co-btn-row" style={{ marginTop: 32 }}>
            <button className="co-btn-primary" onClick={() => router.push("/")}>Explore Products</button>
          </div>
        </div>
      </div>
    </>
  );

  /* ── Main Checkout ── */
  return (
    <>
      <Navbar />
      <style>{css}</style>
      <div className="co-page">

        <div className="co-header anim-1">
          <span className="co-badge">🛍️ Secure Checkout</span>
          <h1 className="co-display">Complete your order</h1>
        </div>

        <div className="co-grid">
          {/* LEFT — Delivery */}
          <div className="co-panel anim-2">
            <div className="co-panel-head">
              <span className="co-step">01</span>
              <div>
                <p className="co-eyebrow">Delivery Info</p>
                <h2 className="co-panel-title">Where should we send it?</h2>
              </div>
            </div>

            <div className="co-fields">
              <div>
                <label className="co-label">Full Address</label>
                <textarea
                  className="co-input"
                  placeholder="Street, building, apartment..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="co-field-row">
                <div>
                  <label className="co-label">City</label>
                  <input className="co-input" placeholder="Karachi" value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div>
                  <label className="co-label">Phone</label>
                  <input className="co-input" placeholder="03001234567" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="co-trust-row">
              {[["🔒","SSL Encrypted"],["📦","Fast Delivery"],["↩","Easy Returns"]].map(([icon, label]) => (
                <div className="co-trust" key={label}>
                  <span>{icon}</span><span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Summary */}
          <div className="co-panel anim-3">
            <div className="co-panel-head">
              <span className="co-step">02</span>
              <div>
                <p className="co-eyebrow">Order Summary</p>
                <h2 className="co-panel-title">Your selection</h2>
              </div>
            </div>

            <div className="co-items">
              {items.map(item => (
                <div className="co-item" key={item.id}>
                  <div className="co-item-dot" />
                  <div className="co-item-info">
                    <span className="co-item-name">{item.name}</span>
                    <span className="co-item-meta">Qty {item.quantity} · RS {item.price.toFixed(2)} each</span>
                  </div>
                  <span className="co-item-price">RS {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="co-totals">
              <div className="co-totals-row">
                <span>Subtotal</span>
                <span>RS {totalPrice.toFixed(2)}</span>
              </div>
              <div className="co-totals-row">
                <span>Shipping</span>
                <span style={{ fontStyle: "italic" }}>Calculated at dispatch</span>
              </div>
              <div className="co-totals-final">
                <span>Total</span>
                <span>RS {totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button
              className={`co-btn-primary co-btn-full ${placing ? "co-btn-loading" : ""}`}
              onClick={placeOrder}
              disabled={placing}
            >
              {placing
                ? <><span className="co-spinner" /> Processing…</>
                : `Place Order — RS ${totalPrice.toFixed(2)}`
              }
            </button>

            <p className="co-fine">🔐 Encrypted & secure · By ordering you agree to our terms</p>
          </div>
        </div>
      </div>
    </>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .anim-1 { animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) both; }
  .anim-2 { animation: fadeUp 0.5s 0.07s cubic-bezier(.22,1,.36,1) both; }
  .anim-3 { animation: fadeUp 0.5s 0.14s cubic-bezier(.22,1,.36,1) both; }

  .co-page {
    min-height: 100vh;
    background: #f5f5f5;
    padding: 80px 20px 100px;
    font-family: 'Jost', sans-serif;
  }
  .co-center {
    display: flex; align-items: center; justify-content: center;
  }

  /* Header */
  .co-header {
    max-width: 1000px; margin: 0 auto 32px;
  }
  .co-display {
    font-family: 'Jost', sans-serif;
    font-size: clamp(2rem, 5vw, 3.4rem);
    font-weight: 900;
    color: #111;
    letter-spacing: -0.03em;
    line-height: 1;
    margin-top: 10px;
  }

  /* Badge */
  .co-badge {
    display: inline-flex; align-items: center;
    padding: 5px 14px;
    background: #FF3E5E;
    color: #fff;
    border: 2px solid #111;
    border-radius: 100px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    box-shadow: 2px 2px 0 #111;
  }

  /* Grid */
  .co-grid {
    max-width: 1000px; margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 20px;
    align-items: start;
  }
  @media (max-width: 800px) {
    .co-grid { grid-template-columns: 1fr; }
  }

  /* Panel */
  .co-panel {
    background: #fff;
    border: 2.5px solid #111;
    border-radius: 20px;
    padding: 32px;
    box-shadow: 5px 5px 0 #111;
  }

  .co-panel-head {
    display: flex; align-items: flex-start; gap: 16px;
    margin-bottom: 28px; padding-bottom: 24px;
    border-bottom: 2px solid #f0f0f0;
  }
  .co-step {
    font-family: 'Jost', sans-serif;
    font-weight: 900; font-size: 2.2rem;
    line-height: 1; color: #FF3E5E;
    flex-shrink: 0; margin-top: 2px;
    letter-spacing: -0.04em;
  }
  .co-eyebrow {
    font-size: 0.65rem; font-weight: 700;
    letter-spacing: 0.15em; color: #aaa;
    text-transform: uppercase; margin-bottom: 4px;
  }
  .co-panel-title {
    font-size: 1.2rem; font-weight: 800;
    color: #111; letter-spacing: -0.02em;
  }

  /* Fields */
  .co-fields { display: flex; flex-direction: column; gap: 18px; }
  .co-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 480px) { .co-field-row { grid-template-columns: 1fr; } }

  .co-label {
    display: block;
    font-size: 0.68rem; font-weight: 700;
    letter-spacing: 0.12em; color: #888;
    text-transform: uppercase; margin-bottom: 7px;
  }
  .co-input {
    width: 100%; padding: 12px 14px;
    background: #f9f9f9;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    font-family: 'Jost', sans-serif;
    font-size: 0.9rem; font-weight: 500;
    color: #111; resize: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .co-input::placeholder { color: #bbb; }
  .co-input:focus {
    outline: none;
    border-color: #FF3E5E;
    box-shadow: 0 0 0 4px rgba(255,62,94,0.12);
    background: #fff;
  }

  /* Trust */
  .co-trust-row {
    display: flex; flex-wrap: wrap; gap: 16px;
    margin-top: 24px; padding-top: 20px;
    border-top: 2px solid #f0f0f0;
  }
  .co-trust {
    display: flex; align-items: center; gap: 6px;
    font-size: 0.72rem; font-weight: 600;
    color: #888; letter-spacing: 0.03em;
  }

  /* Items */
  .co-items { display: flex; flex-direction: column; margin-bottom: 4px; }
  .co-item {
    display: flex; align-items: center; gap: 12px;
    padding: 13px 0; border-bottom: 1.5px solid #f0f0f0;
  }
  .co-item-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #FF3E5E; border: 2px solid #111;
    flex-shrink: 0;
  }
  .co-item-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .co-item-name { font-size: 0.88rem; font-weight: 700; color: #111; }
  .co-item-meta { font-size: 0.7rem; color: #999; font-weight: 500; letter-spacing: 0.04em; }
  .co-item-price { font-size: 0.92rem; font-weight: 800; color: #111; }

  /* Totals */
  .co-totals { padding: 18px 0 20px; }
  .co-totals-row {
    display: flex; justify-content: space-between;
    font-size: 0.82rem; font-weight: 500; color: #888;
    padding: 5px 0;
  }
  .co-totals-final {
    display: flex; justify-content: space-between; align-items: baseline;
    margin-top: 12px; padding-top: 14px;
    border-top: 2.5px solid #111;
  }
  .co-totals-final > span:first-child {
    font-size: 0.75rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.1em; color: #888;
  }
  .co-totals-final > span:last-child {
    font-size: 1.8rem; font-weight: 900;
    color: #111; letter-spacing: -0.03em;
  }

  /* Buttons */
  .co-btn-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }

  .co-btn-primary {
    padding: 13px 28px;
    background: #FF3E5E;
    color: #fff;
    border: 2px solid #111;
    border-radius: 100px;
    font-family: 'Jost', sans-serif;
    font-size: 0.8rem; font-weight: 800;
    letter-spacing: 0.08em; text-transform: uppercase;
    cursor: pointer;
    box-shadow: 3px 3px 0 #111;
    transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
  }
  .co-btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 3px 5px 0 #111;
    background: #e02e4e;
  }
  .co-btn-primary:active:not(:disabled) { transform: translateY(0); box-shadow: 3px 3px 0 #111; }
  .co-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .co-btn-full {
    width: 100%; display: flex;
    align-items: center; justify-content: center;
    gap: 10px; padding: 16px 28px;
    font-size: 0.85rem; border-radius: 14px;
  }

  .co-btn-ghost {
    padding: 13px 28px;
    background: #fff;
    color: #111;
    border: 2px solid #111;
    border-radius: 100px;
    font-family: 'Jost', sans-serif;
    font-size: 0.8rem; font-weight: 700;
    letter-spacing: 0.06em;
    cursor: pointer;
    box-shadow: 3px 3px 0 #111;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .co-btn-ghost:hover {
    transform: translateY(-2px);
    box-shadow: 3px 5px 0 #111;
  }

  .co-spinner {
    display: inline-block; width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.65s linear infinite;
    flex-shrink: 0;
  }

  .co-fine {
    margin-top: 12px; text-align: center;
    font-size: 0.67rem; color: #bbb;
    font-weight: 500; letter-spacing: 0.03em; line-height: 1.6;
  }

  .co-muted {
    font-size: 0.92rem; color: #666;
    line-height: 1.7; margin-top: 10px; font-weight: 500;
  }
  .co-order-num {
    font-size: 0.75rem; font-weight: 700;
    letter-spacing: 0.18em; color: #bbb;
    margin: 8px 0 36px; text-transform: uppercase;
  }

  /* Solo card (success / empty / auth) */
  .co-solo {
    max-width: 480px; margin: 60px auto 0;
    background: #fff;
    border: 2.5px solid #111;
    border-radius: 24px;
    padding: 48px;
    box-shadow: 6px 6px 0 #111;
  }

  .co-check-ring {
    width: 64px; height: 64px; border-radius: 50%;
    background: #FF3E5E;
    border: 2.5px solid #111;
    box-shadow: 3px 3px 0 #111;
    display: flex; align-items: center; justify-content: center;
    color: #fff; margin-bottom: 20px;
  }
    @media (max-width: 600px) {
       .co-page {padding: 160px 20px 100px;}
    }


  @media (max-width: 600px) {
    .co-page { padding: 143px 14px 80px; }
    .co-panel { padding: 22px 18px; }
    .co-solo  { padding: 32px 22px; margin-top: 115px; }
    .co-display { font-size: 2rem; }
  }
`;