"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import style from "../styles/hamburgerMenu.module.css";

interface HamburgerMenuProps {
  isOpen: boolean;
  closeMenu: () => void;
}

type Category = { id: number; name: string; slug: string; image_url?: string };

export default function HamburgerMenu({ isOpen, closeMenu }: HamburgerMenuProps) {
  const [user, setUser] = useState<any>(undefined);
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();
  const sb = getSupabaseBrowser();

  // Auth — singleton + getSession (no flash)
  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Admin emails from D1 via API
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

  // Fetch categories for the menu
  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json() as Promise<{ results: Category[] }>)
      .then(d => setCategories(d.results || []))
      .catch(() => {});
  }, []);

  const isAdmin = user?.email && adminEmails.includes(user.email);
  const userName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split("@")[0] ?? "User";
  const userInitial = userName[0]?.toUpperCase() ?? "?";

  const go = (path: string) => { router.push(path); closeMenu(); };

  const handleSignOut = async () => {
    await sb.auth.signOut();
    closeMenu();
    router.push("/");
  };

  return (
    <>
      <style>{css}</style>
      <div className={`${style.mobileMenu} ${isOpen ? style.active : ""} hm-wrap`}>

        {/* ── User block ── */}
        <div className="hm-user-block">
          {user === undefined ? (
            <div className="hm-user-skeleton" />
          ) : user ? (
            <div className="hm-user-card">
              <div className="hm-avatar">
                {user.user_metadata?.avatar_url
                  ? <img src={user.user_metadata.avatar_url} alt="" className="hm-avatar__img" />
                  : <span className="hm-avatar__initial">{userInitial}</span>
                }
              </div>
              <div className="hm-user-info">
                <span className="hm-user-name">{userName}</span>
                <span className="hm-user-email">{user.email}</span>
              </div>
              {isAdmin && <span className="hm-badge hm-badge--admin">ADMIN</span>}
            </div>
          ) : (
            <div className="hm-auth-btns">
              <button className="hm-auth-btn hm-auth-btn--ghost" onClick={() => go("/login")}>Sign In</button>
              <button className="hm-auth-btn hm-auth-btn--primary" onClick={() => go("/register")}>Sign Up</button>
            </div>
          )}
        </div>

        {/* ── Nav ── */}
        <nav className="hm-nav">
          <button className="hm-nav-item" onClick={() => go("/")}>
            <span className="hm-nav-item__icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </span>
            Home
          </button>

          <button className="hm-nav-item" onClick={() => go("/orders")}>
            <span className="hm-nav-item__icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              </svg>
            </span>
            Orders
          </button>

          {isAdmin && (
            <button className="hm-nav-item hm-nav-item--admin" onClick={() => go("/admin")}>
              <span className="hm-nav-item__icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </span>
              Admin Panel
            </button>
          )}
        </nav>

        {/* ── Categories ── */}
        {categories.length > 0 && (
          <div className="hm-section">
            <p className="hm-section__label">Shop by Category</p>
            <div className="hm-cats">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className="hm-cat"
                  onClick={() => go(`/category/${encodeURIComponent(cat.slug)}`)}
                >
                  {cat.image_url && (
                    <img src={cat.image_url} alt="" className="hm-cat__img" />
                  )}
                  <span className="hm-cat__name">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Sign out ── */}
        {user && (
          <div className="hm-footer">
            <button className="hm-signout" onClick={handleSignOut}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );
}

const css = `
  .hm-wrap {
    font-family: 'Jost', sans-serif;
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow-y: auto;
    padding-bottom: 24px;
  }

  /* ── User block ── */
  .hm-user-block {
    padding: 16px 16px 12px;
    border-bottom: 2px solid #111;
  }
  .hm-user-skeleton {
    height: 52px;
    border-radius: 12px;
    background: repeating-linear-gradient(90deg, #f0f0f0 0px, #e8e8e8 40px, #f0f0f0 80px);
    background-size: 200px;
    animation: hmShimmer 1.2s ease-in-out infinite;
  }
  @keyframes hmShimmer {
    0% { background-position: -200px; }
    100% { background-position: 200px; }
  }
  .hm-user-card {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff;
    border: 2px solid #111;
    border-radius: 12px;
    padding: 10px 12px;
    box-shadow: 3px 3px 0 #111;
  }
  .hm-avatar__img {
    width: 36px; height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #111;
  }
  .hm-avatar__initial {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: #C03EFF;
    color: #fff;
    border: 2px solid #111;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.85rem; font-weight: 700;
  }
  .hm-user-info {
    flex: 1; min-width: 0;
    display: flex; flex-direction: column; gap: 1px;
  }
  .hm-user-name {
    font-size: 0.84rem; font-weight: 700; color: #111;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .hm-user-email {
    font-size: 0.68rem; color: #888;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .hm-badge {
    font-size: 0.55rem; font-weight: 800;
    letter-spacing: 0.12em; padding: 3px 7px;
    border-radius: 100px; border: 1.5px solid; flex-shrink: 0;
  }
  .hm-badge--admin {
    color: #7C3AED; background: #EDE9FE; border-color: #7C3AED;
  }

  /* Auth buttons */
  .hm-auth-btns { display: flex; gap: 8px; }
  .hm-auth-btn {
    flex: 1; padding: 11px 0;
    border-radius: 100px; font-family: 'Jost', sans-serif;
    font-size: 0.8rem; font-weight: 700; cursor: pointer;
    transition: all 0.15s; border: 2px solid #111;
  }
  .hm-auth-btn--ghost { background: #fff; color: #111; box-shadow: 2px 2px 0 #111; }
  .hm-auth-btn--ghost:hover { background: #f5f5f5; }
  .hm-auth-btn--primary { background: #C03EFF; color: #fff; box-shadow: 2px 2px 0 #111; }
  .hm-auth-btn--primary:hover { background: #e8304f; }

  /* ── Nav ── */
  .hm-nav {
    display: flex; flex-direction: column;
    padding: 8px 12px;
    border-bottom: 2px solid #111;
    gap: 2px;
  }
  .hm-nav-item {
    display: flex; align-items: center; gap: 12px;
    width: 100%; padding: 12px 12px;
    background: none; border: 2px solid transparent;
    border-radius: 10px; cursor: pointer;
    font-family: 'Jost', sans-serif; font-size: 0.9rem;
    font-weight: 600; color: #333; text-align: left;
    transition: all 0.15s;
  }
  .hm-nav-item:hover {
    background: #FFE14D; border-color: #111;
    color: #111; box-shadow: 2px 2px 0 #111;
    transform: translateX(2px);
  }
  .hm-nav-item__icon {
    width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    background: #f5f5f5; border: 2px solid #111;
    border-radius: 8px; flex-shrink: 0; color: #111;
    transition: background 0.15s;
  }
  .hm-nav-item:hover .hm-nav-item__icon { background: #fff; }
  .hm-nav-item--admin { color: #7C3AED; }
  .hm-nav-item--admin .hm-nav-item__icon { background: #EDE9FE; color: #7C3AED; border-color: #7C3AED; }
  .hm-nav-item--admin:hover { background: #EDE9FE; border-color: #7C3AED; box-shadow: 2px 2px 0 #7C3AED; color: #7C3AED; }

  /* ── Categories section ── */
  .hm-section { padding: 14px 14px 4px; }
  .hm-section__label {
    font-size: 0.62rem; font-weight: 800;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: #aaa; margin: 0 0 10px 2px;
  }
  .hm-cats {
    display: flex; flex-direction: column; gap: 4px;
  }
  .hm-cat {
    display: flex; align-items: center; gap: 10px;
    width: 100%; padding: 9px 12px;
    background: #fff; border: 2px solid #111;
    border-radius: 10px; cursor: pointer;
    font-family: 'Jost', sans-serif; font-size: 0.82rem;
    font-weight: 600; color: #111; text-align: left;
    box-shadow: 2px 2px 0 #111;
    transition: all 0.14s;
  }
  .hm-cat:hover {
    background: #FFE14D;
    transform: translateX(3px);
    box-shadow: 3px 3px 0 #111;
  }
  .hm-cat__img {
    width: 28px; height: 28px;
    border-radius: 50%; object-fit: cover;
    border: 2px solid #111; flex-shrink: 0;
  }
  .hm-cat__name {
    flex: 1; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
  }

  /* ── Footer / Sign out ── */
  .hm-footer {
    margin-top: auto;
    padding: 14px 14px 0;
  }
  .hm-signout {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 12px 0;
    background: #fff0f3; color: #E11D48;
    border: 2px solid #E11D48; border-radius: 100px;
    font-family: 'Jost', sans-serif; font-size: 0.8rem; font-weight: 700;
    cursor: pointer; box-shadow: 2px 2px 0 #E11D48;
    transition: all 0.15s;
  }
  .hm-signout:hover { background: #ffe0e6; transform: translateY(-1px); box-shadow: 2px 3px 0 #E11D48; }
`;