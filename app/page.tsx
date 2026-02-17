// "use client";

// import { createClient } from "@/lib/supabase/client";

// export default function Home() {
//   const supabase = createClient();

//   const login = async () => {
//     await supabase.auth.signInWithOAuth({
//       provider: "google",
//       options: {
//         redirectTo: `${location.origin}/auth/callback`,
//       },
//     });
//   };

//   return (
//     <div className="flex h-screen items-center justify-center">
//       <button
//         onClick={login}
//         className="bg-black text-white px-6 py-3 rounded-lg"
//       >
//         Login with Google
//       </button>
//     </div>
//   );
// }





"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
    // No need to setLoading(false) — page will redirect
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #F5F0E8;
          --surface: #FDFAF4;
          --border: #D4C9B0;
          --border-strong: #A89880;
          --ink: #1A1208;
          --ink-muted: #7A6B52;
          --accent: #C94F1E;
          --accent-hover: #A83C10;
          --accent-light: #FBE9E2;
        }

        body {
          background: var(--bg);
          font-family: 'DM Sans', sans-serif;
          color: var(--ink);
        }

        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        /* Subtle background grid */
        .page::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 48px 48px;
          opacity: 0.35;
          pointer-events: none;
        }

        /* Warm radial glow in center */
        .page::after {
          content: '';
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse 70% 60% at 50% 50%, rgba(245,240,232,0.95) 30%, transparent 100%);
          pointer-events: none;
        }

        .card {
          position: relative;
          z-index: 1;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 52px 48px 44px;
          width: 100%;
          max-width: 400px;
          box-shadow:
            0 1px 0 #fff inset,
            0 8px 40px rgba(26,18,8,0.10),
            0 2px 8px rgba(26,18,8,0.06);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          animation: riseIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes riseIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .logo-mark {
          width: 52px;
          height: 52px;
          background: var(--ink);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 28px;
          box-shadow: 0 4px 16px rgba(26,18,8,0.18);
        }

        .logo-mark svg {
          width: 26px;
          height: 26px;
          stroke: var(--bg);
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .card h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 2rem;
          line-height: 1.1;
          color: var(--ink);
          margin-bottom: 10px;
          letter-spacing: -0.3px;
        }

        .card p {
          font-size: 0.875rem;
          color: var(--ink-muted);
          line-height: 1.55;
          max-width: 280px;
          margin-bottom: 36px;
        }

        .divider {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .divider-label {
          font-size: 0.7rem;
          font-family: 'DM Mono', monospace;
          color: var(--border-strong);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .btn-google {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 13px 20px;
          background: var(--ink);
          color: var(--bg);
          border: none;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.15s, transform 0.12s, box-shadow 0.15s;
          box-shadow: 0 2px 8px rgba(26,18,8,0.20);
          letter-spacing: 0.01em;
        }

        .btn-google:hover:not(:disabled) {
          background: #2E2410;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(26,18,8,0.22);
        }

        .btn-google:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(26,18,8,0.18);
        }

        .btn-google:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .btn-google svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(245,240,232,0.3);
          border-top-color: var(--bg);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .footer-note {
          margin-top: 22px;
          font-size: 0.73rem;
          font-family: 'DM Mono', monospace;
          color: var(--border-strong);
          letter-spacing: 0.01em;
        }

        .footer-note a {
          color: var(--ink-muted);
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        /* Floating bookmark decorations */
        .deco {
          position: fixed;
          z-index: 0;
          opacity: 0;
          animation: floatIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .deco-1 { top: 14%; left: 10%; animation-delay: 0.15s; }
        .deco-2 { top: 22%; right: 9%; animation-delay: 0.25s; }
        .deco-3 { bottom: 20%; left: 8%; animation-delay: 0.35s; }
        .deco-4 { bottom: 14%; right: 11%; animation-delay: 0.2s; }

        @keyframes floatIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .deco-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 10px 14px;
          box-shadow: 0 2px 12px rgba(26,18,8,0.07);
          display: flex;
          align-items: center;
          gap: 9px;
          white-space: nowrap;
        }

        .deco-favicon {
          width: 22px;
          height: 22px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
        }

        .deco-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .deco-title {
          font-size: 0.73rem;
          font-weight: 500;
          color: var(--ink);
          font-family: 'DM Sans', sans-serif;
        }

        .deco-url {
          font-size: 0.65rem;
          font-family: 'DM Mono', monospace;
          color: var(--ink-muted);
        }

        @media (max-width: 600px) {
          .deco { display: none; }
          .card { padding: 40px 28px 36px; }
        }
      `}</style>

      <div className="page">

        
        <div className="deco deco-1">
          <div className="deco-card">
            <div className="deco-favicon">🔖</div>
            <div className="deco-text">
              <span className="deco-title">Design Inspiration</span>
              <span className="deco-url">dribbble.com</span>
            </div>
          </div>
        </div>

        <div className="deco deco-2">
          <div className="deco-card">
            <div className="deco-favicon">📄</div>
            <div className="deco-text">
              <span className="deco-title">MDN Web Docs</span>
              <span className="deco-url">developer.mozilla.org</span>
            </div>
          </div>
        </div>

        <div className="deco deco-3">
          <div className="deco-card">
            <div className="deco-favicon">⭐</div>
            <div className="deco-text">
              <span className="deco-title">Read Later</span>
              <span className="deco-url">medium.com</span>
            </div>
          </div>
        </div>

        <div className="deco deco-4">
          <div className="deco-card">
            <div className="deco-favicon">🛠</div>
            <div className="deco-text">
              <span className="deco-title">Next.js Docs</span>
              <span className="deco-url">nextjs.org</span>
            </div>
          </div>
        </div>

        {/* Main card */}
        <div className="card">
          <div className="logo-mark">
            <svg viewBox="0 0 24 24">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>

          <h1>Your bookmarks,<br />organised.</h1>
          <p>Save links from anywhere. Access them everywhere. Synced in real time.</p>

          <div className="divider">
            <span className="divider-line" />
            <span className="divider-label">continue with</span>
            <span className="divider-line" />
          </div>

          <button
            className="btn-google"
            onClick={login}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner" />
            ) : (
              
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>

          <p className="footer-note">
            By signing in you agree to our{" "}
            <a href="#">terms</a> &amp; <a href="#">privacy policy</a>.
          </p>
        </div>

      </div>
    </>
  );
}