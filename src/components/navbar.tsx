"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import style from "../styles/navBar.module.css";
import FloatingCart from "./floatingCart";
import HamburgerMenu from "./hamburgerMenu";
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

type Product = {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category_name: string;
};

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<any>(undefined); // undefined = not yet known
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [adminEmails, setAdminEmails] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const supabase = getSupabaseBrowser();

  const isAdmin = user?.email && adminEmails.includes(user.email);
  const userInitial = user ? (user?.user_metadata?.full_name || user?.email || "?")[0].toUpperCase() : "";
  const userName = user ? (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "") : "";

  useEffect(() => {
    fetch("/api/settings?key=admin_emails")
      .then(r => r.json())
      .then((data: unknown) => {
        const d = data as { settings?: Record<string, string> };
        const raw = d?.settings?.admin_emails;
        if (raw) {
          try { setAdminEmails(JSON.parse(raw)); } catch { /* ignore */ }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {

    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setUser(session?.user ?? null);
    });

 
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [menuOpen]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 1024);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setSearchFocused(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = searchQuery.trim();
    if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json() as { results: Product[] };
        setSuggestions((data.results || []).slice(0, 6));
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
      finally { setSearchLoading(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    router.push("/");
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const highlight = (text: string, query: string) => {
    if (!query.trim()) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: "#FFE14D", color: "#111", borderRadius: 2, padding: "0 1px" }}>
          {text.slice(idx, idx + query.length)}
        </mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  const SuggestionsList = ({ isMobileCtx = false }: { isMobileCtx?: boolean }) => (
    <div className={`cc-suggestions ${isMobileCtx ? "cc-suggestions--mobile" : ""}`}>
      <div className="cc-suggestions__header">Results for "{searchQuery}"</div>
      {suggestions.map(product => (
        <button
          key={product.id}
          className="cc-suggestion-item"
          onMouseDown={(e) => {
            e.stopPropagation();
            setShowSuggestions(false);
            setSearchQuery("");
            router.push(`/products/${product.id}`);
          }}
        >
          <div className="cc-suggestion-item__img-wrap">
            <img src={product.image_url || "https://placehold.co/44x44?text=?"} alt={product.name} className="cc-suggestion-item__img"/>
          </div>
          <div className="cc-suggestion-item__info">
            <span className="cc-suggestion-item__name">{highlight(product.name, searchQuery)}</span>
            {product.category_name && <span className="cc-suggestion-item__cat">{product.category_name}</span>}
          </div>
          <span className="cc-suggestion-item__price">RS {product.price.toFixed(2)}</span>
          <svg className="cc-suggestion-item__arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      ))}
      <button
        className="cc-suggestions__footer"
        onMouseDown={(e) => {
          e.stopPropagation();
          const q = searchQuery.trim();
          if (!q) return;
          setShowSuggestions(false);
          router.push(`/search?q=${encodeURIComponent(q)}`);
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        See all results for "{searchQuery}"
      </button>
    </div>
  );

 
  const authSection = user === undefined ? (
    <div style={{ width: 80 }} /> 
  ) : !user ? (
    <>
      <button className="cc-btn cc-btn--ghost" onClick={() => router.push("/login")}>Sign In</button>
      <button className="cc-btn cc-btn--primary" onClick={() => router.push("/register")}>Sign Up</button>
    </>
  ) : (
    <div className="cc-user" ref={dropdownRef}>
      <button className="cc-avatar" onClick={() => setDropdownOpen(o => !o)} aria-label="User menu">
        {user.user_metadata?.avatar_url
          ? <img src={user.user_metadata.avatar_url} alt="" className="cc-avatar__img"/>
          : <span className="cc-avatar__initial">{userInitial}</span>
        }
        <span className="cc-avatar__name">{userName}</span>
        <svg className={`cc-avatar__chevron ${dropdownOpen ? "cc-avatar__chevron--open" : ""}`} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {dropdownOpen && (
        <div className="cc-dropdown">
          <div className="cc-dropdown__header">
            <span className="cc-dropdown__name">{userName}</span>
            <span className="cc-dropdown__email">{user.email}</span>
          </div>
          <div className="cc-dropdown__divider"/>
          <button className="cc-dropdown__item cc-dropdown__item--danger" onClick={handleSignOut}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>{navCss}</style>

      <nav className={`cc-nav ${scrolled ? "cc-nav--scrolled" : ""}`}>
        {/* Logo */}
        <button className="cc-logo" onClick={() => router.push("/")} aria-label="Go to home">
          <span className="cc-logo__icon">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </span>
          <span className="cc-logo__text">AzeemCosmetics</span>
        </button>

        {/* Desktop Search */}
        <div className="cc-search-wrap" ref={searchWrapRef}>
          <form className={`cc-search ${searchFocused ? "cc-search--focused" : ""}`} onSubmit={handleSearch}>
            <svg className="cc-search__icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="cc-search__input"
              type="text"
              placeholder="Search products…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => { setSearchFocused(true); if (suggestions.length > 0) setShowSuggestions(true); }}
              autoComplete="off"
            />
            {searchLoading && <div className="cc-search__spinner"/>}
            {searchQuery && (
              <button type="button" className="cc-search__clear" onClick={clearSearch}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </form>
          {showSuggestions && suggestions.length > 0 && <SuggestionsList/>}
        </div>

        {/* Desktop right side */}
        <div className="cc-right">
          <button className="cc-link" onClick={() => router.push("/")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Home
          </button>
          <button className="cc-link" onClick={() => router.push("/orders")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
            </svg>
            Orders
          </button>
          {isAdmin && (
            <button className="cc-link cc-link--admin" onClick={() => router.push("/admin")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Admin
            </button>
          )}

          <div className="cc-divider"/>
          {authSection}
        </div>

        {/* Hamburger — mobile only */}
        <button
          className={`${style.hamburger} ${menuOpen ? style.active : ""}`}
          onClick={() => setMenuOpen(p => !p)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span/><span/><span/>
        </button>
      </nav>

      {/* Mobile Search Bar */}
      <div className="cc-mobile-search-bar" ref={mobileSearchRef}>
        <form className="cc-search cc-search--mobile" onSubmit={handleSearch}>
          <svg className="cc-search__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="cc-search__input"
            type="text"
            placeholder="Search products…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            autoComplete="off"
          />
          {searchLoading && <div className="cc-search__spinner"/>}
          {searchQuery && (
            <button type="button" className="cc-search__clear" onClick={clearSearch}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </form>
        {showSuggestions && suggestions.length > 0 && <SuggestionsList isMobileCtx/>}
      </div>

      {menuOpen && <div className={style.overlay} onClick={() => setMenuOpen(false)} aria-hidden="true"/>}
      <HamburgerMenu isOpen={menuOpen} closeMenu={() => setMenuOpen(false)}/>
      <FloatingCart/>
    </>
  );
}

const navCss = `
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&display=swap');

  .cc-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    height: 60px;
    display: flex; align-items: center; gap: 10px;
    padding: 0 24px;
    font-family: 'Jost', sans-serif;
    background: #ffffff;
    border-bottom: 2.5px solid #111;
    transition: box-shadow 0.2s ease;
  }
  .cc-nav--scrolled { box-shadow: 0 4px 0 #111; }
  .cc-logo { display: flex; align-items: center; gap: 9px; background: none; border: none; cursor: pointer; padding: 0; flex-shrink: 0; }
  .cc-logo__icon { width: 32px; height: 32px; background: #C03EFF; border: 2px solid #111; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; box-shadow: 2px 2px 0 #111; transition: transform 0.18s; }
  .cc-logo:hover .cc-logo__icon { transform: rotate(-6deg) scale(1.08); }
  .cc-logo__text { font-size: 1.05rem; font-weight: 700; color: #111; letter-spacing: -0.02em; }
  .cc-search-wrap { flex: 1; max-width: 580px; min-width: 0; position: relative; z-index: 101; }
  .cc-search { display: flex; align-items: center; gap: 8px; background: #f5f5f5; border: 2px solid #111; border-radius: 6px; padding: 0 12px; height: 45px; transition: background 0.15s, box-shadow 0.15s; }
  .cc-search--focused { background: #fff; box-shadow: 3px 3px 0 #111; }
  .cc-search__icon { color: #C03EFF; flex-shrink: 0; }
  .cc-search__input { flex: 1; background: none; border: none; outline: none !important; box-shadow: none !important; -webkit-appearance: none; font-family: 'Jost', sans-serif; font-size: 0.83rem; font-weight: 500; color: #111; min-width: 0; }
  .cc-search__input::placeholder { color: #aaa; font-weight: 400; }
  .cc-search__input:focus { outline: none !important; box-shadow: none !important; border: none !important; }
  .cc-search__spinner { width: 13px; height: 13px; flex-shrink: 0; border: 2px solid #ddd; border-top-color: #C03EFF; border-radius: 50%; animation: ccSpin 0.6s linear infinite; }
  @keyframes ccSpin { to { transform: rotate(360deg); } }
  .cc-search__clear { display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; flex-shrink: 0; background: #ddd; border: none; border-radius: 3px; color: #666; cursor: pointer; transition: background 0.15s, color 0.15s; padding: 0; }
  .cc-search__clear:hover { background: #111; color: #fff; }
  .cc-suggestions { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: #fff; border: 2px solid #111; border-radius: 8px; overflow: hidden; box-shadow: 4px 4px 0 #111; animation: ccDropIn 0.16s cubic-bezier(.22,1,.36,1) both; z-index: 300; }
  .cc-suggestions--mobile { position: static; margin-top: 8px; animation: none; }
  @keyframes ccDropIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
  .cc-suggestions__header { padding: 7px 12px 5px; font-size: 0.66rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #aaa; border-bottom: 1.5px solid #f0f0f0; font-family: 'Jost', sans-serif; }
  .cc-suggestion-item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 9px 12px; background: none; border: none; border-bottom: 1px solid #f5f5f5; cursor: pointer; text-align: left; transition: background 0.1s; }
  .cc-suggestion-item:last-of-type { border-bottom: none; }
  .cc-suggestion-item:hover { background: #FFF9E6; }
  .cc-suggestion-item__img-wrap { width: 40px; height: 40px; flex-shrink: 0; border-radius: 5px; overflow: hidden; border: 1.5px solid #111; }
  .cc-suggestion-item__img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cc-suggestion-item__info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .cc-suggestion-item__name { font-size: 0.84rem; font-weight: 600; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'Jost', sans-serif; }
  .cc-suggestion-item__cat { font-size: 0.7rem; color: #999; font-family: 'Jost', sans-serif; }
  .cc-suggestion-item__price { font-size: 0.84rem; font-weight: 700; color: #C03EFF; flex-shrink: 0; font-family: 'Jost', sans-serif; }
  .cc-suggestion-item__arrow { color: #ccc; flex-shrink: 0; transition: color 0.15s, transform 0.15s; }
  .cc-suggestion-item:hover .cc-suggestion-item__arrow { color: #111; transform: translateX(2px); }
  .cc-suggestions__footer { width: 100%; display: flex; align-items: center; justify-content: center; gap: 7px; padding: 10px 12px; background: #f9f9f9; border: none; border-top: 1.5px solid #eee; font-family: 'Jost', sans-serif; font-size: 0.8rem; font-weight: 700; color: #111; cursor: pointer; transition: background 0.15s; }
  .cc-suggestions__footer:hover { background: #FFE14D; }
  .cc-right { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
  .cc-divider { width: 1.5px; height: 22px; background: #ddd; margin: 0 4px; flex-shrink: 0; }
  .cc-link { display: flex; align-items: center; gap: 5px; padding: 6px 11px; background: none; border: 2px solid transparent; cursor: pointer; font-family: 'Jost', sans-serif; font-size: 0.78rem; font-weight: 600; color: #444; letter-spacing: 0.02em; border-radius: 6px; transition: all 0.15s; white-space: nowrap; }
  .cc-link:hover { background: #FFE14D; border-color: #111; color: #111; box-shadow: 2px 2px 0 #111; transform: translateY(-1px); }
  .cc-link svg { opacity: 0.5; transition: opacity 0.15s; flex-shrink: 0; }
  .cc-link:hover svg { opacity: 1; }
  .cc-link--admin { color: #7C3AED; }
  .cc-link--admin:hover { background: #EDE9FE; border-color: #7C3AED; color: #7C3AED; box-shadow: 2px 2px 0 #7C3AED; }
  .cc-btn { display: inline-flex; align-items: center; justify-content: center; padding: 6px 14px; font-family: 'Jost', sans-serif; font-size: 0.77rem; font-weight: 700; letter-spacing: 0.04em; border-radius: 6px; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
  .cc-btn--ghost { background: #fff; color: #111; border: 2px solid #111; }
  .cc-btn--ghost:hover { background: #f5f5f5; transform: translateY(-1px); box-shadow: 2px 2px 0 #111; }
  .cc-btn--primary { background: #00D084; color: #111; border: 2px solid #111; }
  .cc-btn--primary:hover { background: #00E891; transform: translateY(-1px); box-shadow: 2px 2px 0 #111; }
  .cc-user { position: relative; }
  .cc-avatar { display: flex; align-items: center; gap: 6px; background: #fff; border: 2px solid #111; border-radius: 6px; padding: 4px 10px 4px 4px; cursor: pointer; transition: all 0.15s; }
  .cc-avatar:hover { background: #FFE14D; box-shadow: 2px 2px 0 #111; transform: translateY(-1px); }
  .cc-avatar__img { width: 24px; height: 24px; border-radius: 3px; object-fit: cover; border: 1.5px solid #111; }
  .cc-avatar__initial { width: 24px; height: 24px; border-radius: 3px; background: #C03EFF; color: #fff; border: 1.5px solid #111; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 700; }
  .cc-avatar__name { font-size: 0.76rem; font-weight: 600; color: #111; }
  .cc-avatar__chevron { color: #555; transition: transform 0.2s; }
  .cc-avatar__chevron--open { transform: rotate(180deg); }
  .cc-dropdown { position: absolute; top: calc(100% + 8px); right: 0; min-width: 180px; background: #fff; border: 2px solid #111; border-radius: 8px; padding: 6px; box-shadow: 4px 4px 0 #111; animation: ccPopIn 0.16s cubic-bezier(.22,1,.36,1) both; z-index: 200; }
  @keyframes ccPopIn { from { opacity: 0; transform: translateY(-6px) scale(0.97); } to { opacity: 1; transform: none; } }
  .cc-dropdown__header { padding: 8px 10px 6px; }
  .cc-dropdown__name { display: block; font-size: 0.85rem; font-weight: 700; color: #111; font-family: 'Jost', sans-serif; }
  .cc-dropdown__email { display: block; font-size: 0.7rem; color: #888; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; font-family: 'Jost', sans-serif; }
  .cc-dropdown__divider { height: 1px; background: rgba(0,0,0,0.1); margin: 4px 0; }
  .cc-dropdown__item { display: flex; align-items: center; gap: 9px; width: 100%; padding: 8px 10px; background: none; border: none; border-radius: 5px; cursor: pointer; font-family: 'Jost', sans-serif; font-size: 0.8rem; font-weight: 500; color: #444; text-align: left; transition: all 0.12s; }
  .cc-dropdown__item:hover { background: #FFE14D; color: #111; }
  .cc-dropdown__item--danger { color: #E11D48; }
  .cc-dropdown__item--danger:hover { background: #FFF1F5; color: #E11D48; }
  .cc-mobile-search-bar { display: none; position: fixed; top: 60px; left: 0; right: 0; z-index: 99; background: #fff; border-bottom: 2px solid #111; padding: 8px 14px 10px; }
  .cc-search--mobile { width: 100%; height: 48px; }
  .cc-mobile-search-bar .cc-suggestions--mobile { border-radius: 6px; border: 2px solid #111; box-shadow: 3px 3px 0 #111; overflow: hidden; background: #fff; }
  @media (max-width: 1024px) { .cc-right { display: none; } .cc-search-wrap { display: none; } .cc-mobile-search-bar { display: block; } .cc-nav { padding: 0 14px; gap: 8px; } }
  @media (min-width: 1025px) { .cc-mobile-search-bar { display: none; } }
`;