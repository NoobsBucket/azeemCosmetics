"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type SocialKey = "instagram" | "facebook" | "tiktok" | "twitter" | "youtube" | "whatsapp";
type SocialSettings = Record<SocialKey, { url: string; visible: boolean }>;

const SOCIAL_ICONS: Record<SocialKey, React.ReactNode> = {
  instagram: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="2" width="20" height="20" rx="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  ),
  facebook: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  ),
  tiktok: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.26 8.26 0 0 0 4.83 1.55V6.79a4.85 4.85 0 0 1-1.06-.1z"/>
    </svg>
  ),
  twitter: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  youtube: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
    </svg>
  ),
  whatsapp: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
};

const SOCIAL_COLORS: Record<SocialKey, string> = {
  instagram: "#E1306C",
  facebook:  "#1877F2",
  tiktok:    "#111",
  twitter:   "#111",
  youtube:   "#FF0000",
  whatsapp:  "#25D366",
};

export default function Footer() {
  const router = useRouter();
  const [socials, setSocials] = useState<SocialSettings | null>(null);
  const [footerMessage, setFooterMessage] = useState("");

  useEffect(() => {
fetch("/api/settings")
  .then(r => r.json())
  .then((data: unknown) => {
    const d = data as { settings?: Record<string, string> };
    if (d.settings?.socials) {
      try { setSocials(JSON.parse(d.settings.socials)); } catch { /* ignore */ }
    }
    if (d.settings?.footer_message) {
      setFooterMessage(d.settings.footer_message);
    }
  })
  .catch(() => {});
  }, []);

  const visibleSocials = socials
    ? (Object.entries(socials) as [SocialKey, { url: string; visible: boolean }][]).filter(([, v]) => v.visible && v.url)
    : [];

  return (
    <>
      <style>{css}</style>
      <footer className="ft">
        <div className="ft-inner">

          {/* Top row: logo + nav links */}
          <div className="ft-top">
            <button className="ft-logo" onClick={() => router.push("/")}>
              <span className="ft-logo__icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
              </span>
              <span className="ft-logo__text">AzeenCosmetics</span>
            </button>

            <nav className="ft-nav">
              <button className="ft-nav__link" onClick={() => router.push("/")}>Home</button>
              <button className="ft-nav__link" onClick={() => router.push("/orders")}>Orders</button>
              <button className="ft-nav__link" onClick={() => router.push("/login")}>Sign In</button>
            </nav>
          </div>

          {/* Divider */}
          <div className="ft-divider"/>

          {/* Social icons */}
          {visibleSocials.length > 0 && (
            <div className="ft-socials">
              <span className="ft-socials__label">Follow us</span>
              <div className="ft-socials__icons">
                {visibleSocials.map(([key, val]) => (
                  <a
                    key={key}
                    href={val.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ft-social-btn"
                    style={{ "--social-color": SOCIAL_COLORS[key] } as React.CSSProperties}
                    title={key.charAt(0).toUpperCase() + key.slice(1)}
                  >
                    {SOCIAL_ICONS[key]}
                  </a>
                ))}
              </div>
            </div>
          )}


          {footerMessage && (
            <p className="ft-message">{footerMessage}</p>
          )}

          {/* Bottom copyright */}
          <div className="ft-bottom">
            <span className="ft-copy">© {new Date().getFullYear()} AzeenCosmetics. All rights reserved.</span>
            <span className="ft-made">Made with ♥ in Pakistan</span>
          </div>

        </div>
      </footer>
    </>
  );
}

const css = `
  .ft {
    background: #fff;
    border-top: 2.5px solid #111;
    box-shadow: 0 -4px 0 #111;
    font-family: sans-serif;
    margin-top: 60px;
  }
  .ft-inner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 40px 24px 32px;
  }

  /* Top row */
  .ft-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 28px;
  }
  .ft-logo {
    display: flex; align-items: center; gap: 9px;
    background: none; border: none; cursor: pointer; padding: 0;
  }
  .ft-logo__icon {
    width: 34px; height: 34px;
    background: #C03EFF; border: 2px solid #111; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: #fff; box-shadow: 2px 2px 0 #111;
  }
  .ft-logo__text {
    font-size: 1.1rem; font-weight: 900; color: #C03EFF; letter-spacing: -0.02em;
  }
  .ft-nav {
    display: flex; align-items: center; gap: 4px; flex-wrap: wrap;
  }
  .ft-nav__link {
    background: none; border: 2px solid transparent; padding: 6px 12px;
    font-family: sans-serif; font-size: 0.82rem; font-weight: 700; color: #555;
    cursor: pointer; border-radius: 6px; transition: all 0.15s;
  }
  .ft-nav__link:hover {
    background: #FFE14D; border-color: #111; color: #111;
    box-shadow: 2px 2px 0 #111; transform: translateY(-1px);
  }

  /* Divider */
  .ft-divider {
    height: 2.5px; background: #111; opacity: 0.07; border-radius: 1px;
    margin-bottom: 28px;
  }

  /* Socials */
  .ft-socials {
    display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
    margin-bottom: 24px;
  }
  .ft-socials__label {
    font-size: 0.7rem; font-weight: 800; letter-spacing: 0.1em;
    text-transform: uppercase; color: #aaa;
  }
  .ft-socials__icons {
    display: flex; gap: 8px; flex-wrap: wrap;
  }
  .ft-social-btn {
    display: flex; align-items: center; justify-content: center;
    width: 40px; height: 40px;
    border: 2px solid #111; border-radius: 10px;
    background: #fff; color: #111;
    text-decoration: none;
    box-shadow: 3px 3px 0 #111;
    transition: transform 0.15s, box-shadow 0.15s, background 0.15s, color 0.15s;
  }
  .ft-social-btn:hover {
    transform: translate(-2px, -2px);
    box-shadow: 5px 5px 0 #111;
    background: var(--social-color, #111);
    color: #fff;
    border-color: #111;
  }

  /* Footer message */
  .ft-message {
    font-size: 0.88rem; color: #555; font-weight: 500;
    padding: 14px 18px;
    background: #fff5f7;
    border: 2px solid #ffd6de;
    border-radius: 10px;
    box-shadow: 3px 3px 0 #ffd6de;
    margin-bottom: 24px;
    line-height: 1.6;
  }

  /* Bottom */
  .ft-bottom {
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
    gap: 8px;
  }
  .ft-copy {
    font-size: 0.75rem; color: #aaa; font-weight: 500;
  }
  .ft-made {
    font-size: 0.75rem; color: #C03EFF; font-weight: 700;
  }

  @media (max-width: 600px) {
    .ft-top { flex-direction: column; align-items: flex-start; }
    .ft-bottom { flex-direction: column; }
  }
`;