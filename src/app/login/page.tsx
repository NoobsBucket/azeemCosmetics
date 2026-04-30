"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type View = "login" | "forgot";

export default function LoginPage() {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();

  const sb = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const login = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
    const { error: e } = await sb.auth.signInWithPassword({ email, password });
    if (e) { setError(e.message); setLoading(false); return; }
    router.push("/");
  };

  const oauth = async (provider: "google" | "github") => {
    setLoading(true); setError("");
    await sb.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const forgotPassword = async () => {
    if (!email) { setError("Please enter your email address."); return; }
    setLoading(true); setError(""); setSuccessMsg("");
    const { error: e } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (e) { setError(e.message); return; }
    setSuccessMsg("Reset link sent! Check your inbox.");
  };

  const switchView = (v: View) => {
    setView(v); setError(""); setSuccessMsg("");
  };

  return (
    <>
      <style>{css}</style>
      <div className="page">
        <div className="blob blob1" />
        <div className="blob blob2" />
        <div className="blob blob3" />

        <div className="card">
          {/* LOGO */}
          <div className="logo">
            <div className="logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </div>
            <span className="logo-text">AzeenCosmatics</span>
          </div>

          {view === "login" ? (
            <>
              <h1 className="title">Welcome back<span className="dot">!</span></h1>
              <p className="subtitle">Sign in to your account</p>

              <div className="oauth-row">
                <button className="oauth-btn google" onClick={() => oauth("google")} disabled={loading}>
                  <svg width="17" height="17" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                <button className="oauth-btn github" onClick={() => oauth("github")} disabled={loading}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  GitHub
                </button>
              </div>

              <div className="divider"><span>or</span></div>

              <div className="form">
                {error && <div className="alert err">⚠ {error}</div>}

                <div className="field">
                  <label className="label">Email</label>
                  <input className="input" type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && login()}/>
                </div>

                <div className="field">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                    <label className="label" style={{margin:0}}>Password</label>
                    <button className="link-btn small" onClick={() => switchView("forgot")}>Forgot password?</button>
                  </div>
                  <input className="input" type="password" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && login()}/>
                </div>

                <button className="submit-btn" onClick={login} disabled={loading}>
                  {loading ? <span className="spinner"/> : "Sign In →"}
                </button>
              </div>

              <p className="footer-text">
                No account yet? <button className="link-btn" onClick={() => router.push("/register")}>Sign up free</button>
              </p>
            </>
          ) : (
            <>
              <h1 className="title">Reset password<span className="dot">?</span></h1>
              <p className="subtitle">We&apos;ll send a reset link to your inbox</p>

              <div className="form" style={{marginTop:24}}>
                {error && <div className="alert err">⚠ {error}</div>}
                {successMsg && <div className="alert ok">✓ {successMsg}</div>}

                <div className="field">
                  <label className="label">Email</label>
                  <input className="input" type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && forgotPassword()}/>
                </div>

                <button className="submit-btn" onClick={forgotPassword} disabled={loading}>
                  {loading ? <span className="spinner"/> : "Send Reset Link →"}
                </button>
              </div>

              <p className="footer-text">
                <button className="link-btn" onClick={() => switchView("login")}>← Back to sign in</button>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

const css = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  .page{
    min-height:100vh;
    background:linear-gradient(160deg,#fff 0%,#fff5f7 100%);
    display:flex;align-items:center;justify-content:center;
    padding:24px;font-family:sans-serif;
    position:relative;overflow:hidden;
  }

  .blob{position:absolute;border-radius:50%;filter:blur(70px);opacity:.3;pointer-events:none}
  .blob1{width:380px;height:380px;background:#C03EFF;top:-100px;left:-100px}
  .blob2{width:280px;height:280px;background:#ffcc00;bottom:-80px;right:-60px}
  .blob3{width:200px;height:200px;background:#3ecfff;top:45%;left:65%}

  .card{
    width:100%;max-width:440px;
    background:#fff;
    border:2.5px solid #111;
    border-radius:24px;
    padding:40px 36px;
    box-shadow:8px 8px 0 #111;
    position:relative;z-index:1;
    animation:pop-in .35s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes pop-in{
    from{opacity:0;transform:translateY(18px) scale(.97)}
    to{opacity:1;transform:translateY(0) scale(1)}
  }

  .logo{display:flex;align-items:center;gap:10px;margin-bottom:28px}
  .logo-icon{
    width:40px;height:40px;border-radius:12px;
    background:#C03EFF;border:2px solid #111;
    box-shadow:3px 3px 0 #111;
    display:flex;align-items:center;justify-content:center;
  }
  .logo-text{font-size:1.25rem;font-weight:900;color:#C03EFF;letter-spacing:-.02em}

  .title{font-size:2rem;font-weight:900;color:#111;letter-spacing:-.04em;line-height:1.1;margin-bottom:6px}
  .dot{color:#C03EFF}
  .subtitle{font-size:.88rem;color:#666;font-weight:500;margin-bottom:24px}

  .oauth-row{display:flex;gap:10px;margin-bottom:18px}
  .oauth-btn{
    flex:1;display:flex;align-items:center;justify-content:center;gap:8px;
    padding:11px 14px;
    border:2px solid #111;border-radius:12px;
    font-size:.85rem;font-weight:800;cursor:pointer;font-family:sans-serif;
    box-shadow:3px 3px 0 #111;
    transition:transform .15s,box-shadow .15s;
  }
  .oauth-btn:hover:not(:disabled){transform:translate(-2px,-2px);box-shadow:5px 5px 0 #111}
  .oauth-btn:active:not(:disabled){transform:translate(1px,1px);box-shadow:1px 1px 0 #111}
  .oauth-btn:disabled{opacity:.5;cursor:not-allowed}
  .google{background:#fff;color:#111}
  .github{background:#111;color:#fff}

  .divider{
    display:flex;align-items:center;gap:10px;
    margin-bottom:18px;color:#aaa;font-size:.78rem;font-weight:700;
    text-transform:uppercase;letter-spacing:.08em;
  }
  .divider::before,.divider::after{content:'';flex:1;height:2px;background:#111;opacity:.07;border-radius:1px}

  .form{display:flex;flex-direction:column;gap:14px}

  .alert{
    padding:11px 14px;border-radius:10px;
    font-size:.83rem;font-weight:700;border:2px solid;
  }
  .alert.err{background:#fff0f2;border-color:#C03EFF;color:#c0002e}
  .alert.ok{background:#f0fff6;border-color:#00c853;color:#006b2b}

  .field{display:flex;flex-direction:column}
  .label{font-size:.7rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#111;margin-bottom:7px}

  .input{
    padding:12px 14px;
    border:2px solid #111;border-radius:10px;
    font-size:.9rem;font-family:sans-serif;color:#111;
    background:#fafafa;outline:none;
    box-shadow:3px 3px 0 #111;
    transition:box-shadow .15s,transform .15s,border-color .15s;
  }
  .input:focus{background:#fff;border-color:#C03EFF;box-shadow:4px 4px 0 #C03EFF;transform:translate(-1px,-1px)}
  .input::placeholder{color:#ccc}

  .submit-btn{
    padding:13px;
    background:#C03EFF;color:#fff;
    border:2px solid #111;border-radius:12px;
    font-size:.95rem;font-weight:900;font-family:sans-serif;
    cursor:pointer;letter-spacing:.01em;
    box-shadow:4px 4px 0 #111;
    transition:transform .15s,box-shadow .15s;
    margin-top:4px;width:100%;
  }
  .submit-btn:hover:not(:disabled){transform:translate(-3px,-3px);box-shadow:7px 7px 0 #111}
  .submit-btn:active:not(:disabled){transform:translate(1px,1px);box-shadow:1px 1px 0 #111}
  .submit-btn:disabled{opacity:.5;cursor:not-allowed}

  .spinner{
    display:inline-block;width:18px;height:18px;
    border:3px solid rgba(255,255,255,.3);
    border-top-color:#fff;border-radius:50%;
    animation:spin .65s linear infinite;
  }
  @keyframes spin{to{transform:rotate(360deg)}}

  .link-btn{
    background:none;border:none;padding:0;
    color:#C03EFF;font-weight:800;cursor:pointer;
    font-family:sans-serif;font-size:.83rem;
    text-decoration:underline;text-underline-offset:2px;
  }
  .link-btn:hover{color:#c0002e}
  .link-btn.small{font-size:.75rem}

  .footer-text{
    text-align:center;font-size:.83rem;
    color:#888;margin-top:22px;font-weight:500;
  }
`;