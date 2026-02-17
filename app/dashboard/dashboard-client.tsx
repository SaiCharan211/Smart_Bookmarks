// "use client";

// import { useEffect, useState } from "react";
// import { createClient } from "@/lib/supabase/client";

// type Bookmark = {
//   id: string;
//   title: string;
//   url: string;
//   user_id: string;
//   created_at: string;
// };

// export default function DashboardClient({
//   user,
//   initialBookmarks,
// }: {
//   user: any;
//   initialBookmarks: Bookmark[];
// }) {
//   const supabase = createClient();

//   const [bookmarks, setBookmarks] =
//     useState<Bookmark[]>(initialBookmarks);

//   const [title, setTitle] = useState("");
//   const [url, setUrl] = useState("");

//   useEffect(() => {
//     if (!user?.id) return;

//     const channel = supabase
//       .channel(`bookmarks-${user.id}`)
//       .on(
//         "postgres_changes",
//         {
//           event: "*",
//           schema: "public",
//           table: "bookmarks",
//           filter: `user_id=eq.${user.id}`,
//         },
//         (payload) => {
//           console.log("REALTIME:", payload);

//           if (payload.eventType === "INSERT") {
//             setBookmarks((prev) => [
//               payload.new as Bookmark,
//               ...prev,
//             ]);
//           }

//           if (payload.eventType === "DELETE") {
//             setBookmarks((prev) =>
//               prev.filter((b) => b.id !== payload.old.id)
//             );
//           }
//         }
//       )
//       .subscribe((status) => {
//         console.log("STATUS:", status);
//       });

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [user?.id]);

//   const addBookmark = async () => {
//     if (!title || !url) return;

//     await supabase.from("bookmarks").insert({
//       title,
//       url,
//       user_id: user.id,
//     });

//     setTitle("");
//     setUrl("");
//   };

//   const deleteBookmark = async (id: string) => {
//     await supabase.from("bookmarks").delete().eq("id", id);
//   };

//   const logout = async () => {
//     await supabase.auth.signOut();
//     window.location.href = "/";
//   };

//   return (
//     <div className="max-w-xl mx-auto mt-10">
//       <div className="flex justify-between mb-6">
//         <h1 className="text-xl font-bold">My Bookmarks</h1>
//         <button
//           onClick={logout}
//           className="text-sm underline"
//         >
//           Logout
//         </button>
//       </div>

//       <div className="flex gap-2 mb-6">
//         <input
//           className="border p-2 flex-1"
//           placeholder="Title"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//         />
//         <input
//           className="border p-2 flex-1"
//           placeholder="URL"
//           value={url}
//           onChange={(e) => setUrl(e.target.value)}
//         />
//         <button
//           onClick={addBookmark}
//           className="bg-black text-white px-4"
//         >
//           Add
//         </button>
//       </div>

//       <ul className="space-y-3">
//         {bookmarks.map((b) => (
//           <li
//             key={b.id}
//             className="flex justify-between border p-3 rounded"
//           >
//             <a href={b.url} target="_blank">
//               {b.title}
//             </a>

//             <button
//               onClick={() => deleteBookmark(b.id)}
//               className="text-red-500"
//             >
//               Delete
//             </button>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }









"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type Bookmark = {
  id: string;
  title: string;
  url: string;
  user_id: string;
  created_at: string;
};

type Status = "idle" | "adding" | "error";

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function getFavicon(url: string) {
  try {
    const { origin } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
  } catch {
    return null;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardClient({
  user,
  initialBookmarks,
}: {
  user: any;
  initialBookmarks: Bookmark[];
}) {
  const supabase = createClient();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  // ─── Realtime subscription ───────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`bookmarks-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const incoming = payload.new as Bookmark;
            setBookmarks((prev) => {
              // Avoid duplicates if optimistic item already exists with same id
              const exists = prev.some((b) => b.id === incoming.id);
              if (exists) return prev;
              return [incoming, ...prev];
            });
          }

          if (payload.eventType === "DELETE") {
            setBookmarks((prev) =>
              prev.filter((b) => b.id !== payload.old.id)
            );
          }

          if (payload.eventType === "UPDATE") {
            const updated = payload.new as Bookmark;
            setBookmarks((prev) =>
              prev.map((b) => (b.id === updated.id ? updated : b))
            );
          }
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // ─── Add bookmark ─────────────────────────────────────────────────────────
  const addBookmark = async () => {
    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();
    if (!trimmedTitle || !trimmedUrl) return;

    // Validate URL
    try {
      new URL(trimmedUrl);
    } catch {
      setErrorMsg("Please enter a valid URL (include https://)");
      return;
    }

    setStatus("adding");
    setErrorMsg("");

    // Optimistic insert
    const tempId = `optimistic-${crypto.randomUUID()}`;
    const optimistic: Bookmark = {
      id: tempId,
      title: trimmedTitle,
      url: trimmedUrl,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    setBookmarks((prev) => [optimistic, ...prev]);
    setTitle("");
    setUrl("");

    const { data, error } = await supabase
      .from("bookmarks")
      .insert({ title: trimmedTitle, url: trimmedUrl, user_id: user.id })
      .select()
      .single();

    if (error) {
      // Roll back optimistic item
      setBookmarks((prev) => prev.filter((b) => b.id !== tempId));
      setTitle(trimmedTitle);
      setUrl(trimmedUrl);
      setErrorMsg("Failed to save bookmark. Please try again.");
      setStatus("error");
      return;
    }

    // Replace optimistic item with real DB record
    setBookmarks((prev) =>
      prev.map((b) => (b.id === tempId ? (data as Bookmark) : b))
    );

    setStatus("idle");
    titleRef.current?.focus();
  };

  // ─── Delete bookmark ──────────────────────────────────────────────────────
  const deleteBookmark = async (id: string) => {
    // Optimistic delete
    setDeletingIds((prev) => new Set(prev).add(id));
    setBookmarks((prev) => prev.filter((b) => b.id !== id));

    const { error } = await supabase.from("bookmarks").delete().eq("id", id);

    if (error) {
      // Roll back — we'd need the original bookmark; keep it simple and refresh
      setErrorMsg("Failed to delete bookmark.");
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // ─── Handle Enter key ─────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addBookmark();
  };

  const isAdding = status === "adding";

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
          --green: #2D6A4F;
          --green-bg: #E8F4EE;
          --shadow-sm: 0 1px 3px rgba(26,18,8,0.08);
          --shadow-md: 0 4px 12px rgba(26,18,8,0.10);
          --shadow-lg: 0 8px 32px rgba(26,18,8,0.12);
        }

        body {
          background: var(--bg);
          font-family: 'DM Sans', sans-serif;
          color: var(--ink);
          min-height: 100vh;
        }

        .wrapper {
          max-width: 680px;
          margin: 0 auto;
          padding: 48px 24px 80px;
        }

        /* ── Header ── */
        .header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 40px;
        }

        .header-left h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 2.4rem;
          line-height: 1.1;
          color: var(--ink);
          letter-spacing: -0.5px;
        }

        .header-left .subtitle {
          font-size: 0.82rem;
          color: var(--ink-muted);
          margin-top: 4px;
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.02em;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .realtime-dot {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-family: 'DM Mono', monospace;
          color: var(--ink-muted);
        }

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--border-strong);
          transition: background 0.4s;
        }

        .dot.connected {
          background: var(--green);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .btn-logout {
          font-size: 0.8rem;
          font-family: 'DM Mono', monospace;
          color: var(--ink-muted);
          background: none;
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 5px 12px;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: 0.02em;
        }

        .btn-logout:hover {
          border-color: var(--border-strong);
          color: var(--ink);
          background: var(--surface);
        }

        /* ── Add Form ── */
        .add-form {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 32px;
          box-shadow: var(--shadow-sm);
        }

        .add-form-label {
          font-size: 0.72rem;
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-muted);
          margin-bottom: 12px;
          display: block;
        }

        .input-row {
          display: flex;
          gap: 10px;
        }

        .input-field {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          color: var(--ink);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .input-field::placeholder {
          color: var(--border-strong);
        }

        .input-field:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(201,79,30,0.10);
        }

        .input-field.url-field {
          font-family: 'DM Mono', monospace;
          font-size: 0.82rem;
        }

        .btn-add {
          padding: 10px 22px;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(201,79,30,0.25);
        }

        .btn-add:hover:not(:disabled) {
          background: var(--accent-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(201,79,30,0.30);
        }

        .btn-add:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-add:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-msg {
          margin-top: 10px;
          font-size: 0.8rem;
          color: var(--accent);
          font-family: 'DM Mono', monospace;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* ── Bookmarks list ── */
        .list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .list-title {
          font-size: 0.72rem;
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-muted);
        }

        .count-badge {
          background: var(--border);
          color: var(--ink-muted);
          font-size: 0.72rem;
          font-family: 'DM Mono', monospace;
          padding: 2px 8px;
          border-radius: 20px;
        }

        .bookmarks-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .bookmark-item {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: border-color 0.15s, box-shadow 0.15s, opacity 0.2s, transform 0.15s;
          box-shadow: var(--shadow-sm);
          animation: slideIn 0.22s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .bookmark-item:hover {
          border-color: var(--border-strong);
          box-shadow: var(--shadow-md);
        }

        .bookmark-item.optimistic {
          opacity: 0.65;
          border-style: dashed;
        }

        .bookmark-item.deleting {
          opacity: 0.4;
          pointer-events: none;
          transform: scale(0.98);
        }

        .favicon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--bg);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        .favicon-wrap img {
          width: 16px;
          height: 16px;
        }

        .favicon-fallback {
          width: 16px;
          height: 16px;
          color: var(--border-strong);
          font-size: 14px;
        }

        .bookmark-info {
          flex: 1;
          min-width: 0;
        }

        .bookmark-title {
          font-size: 0.92rem;
          font-weight: 500;
          color: var(--ink);
          text-decoration: none;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
          transition: color 0.12s;
        }

        .bookmark-title:hover {
          color: var(--accent);
        }

        .bookmark-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 3px;
        }

        .bookmark-host {
          font-size: 0.75rem;
          font-family: 'DM Mono', monospace;
          color: var(--ink-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }

        .meta-sep {
          color: var(--border-strong);
          font-size: 0.65rem;
        }

        .bookmark-date {
          font-size: 0.72rem;
          color: var(--border-strong);
          white-space: nowrap;
        }

        .btn-delete {
          background: none;
          border: 1px solid transparent;
          border-radius: 6px;
          color: var(--border-strong);
          cursor: pointer;
          padding: 5px 8px;
          font-size: 0.8rem;
          transition: all 0.15s;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: 'DM Mono', monospace;
        }

        .btn-delete:hover {
          color: var(--accent);
          border-color: rgba(201,79,30,0.25);
          background: var(--accent-light);
        }

        /* ── Empty state ── */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: var(--ink-muted);
        }

        .empty-icon {
          font-size: 2.5rem;
          margin-bottom: 14px;
          opacity: 0.5;
        }

        .empty-state h3 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.4rem;
          color: var(--ink);
          margin-bottom: 6px;
        }

        .empty-state p {
          font-size: 0.85rem;
          color: var(--ink-muted);
        }

        @media (max-width: 520px) {
          .input-row { flex-wrap: wrap; }
          .btn-add { width: 100%; }
          .header-left h1 { font-size: 1.8rem; }
          .bookmark-date { display: none; }
        }
      `}</style>

      <div className="wrapper">

        {/* ── Header ── */}
        <header className="header">
          <div className="header-left">
            <h1>Bookmarks</h1>
            <p className="subtitle">{user?.email}</p>
          </div>
          <div className="header-right">
            <div className="realtime-dot">
              <span className={`dot ${realtimeConnected ? "connected" : ""}`} />
              {realtimeConnected ? "live" : "connecting"}
            </div>
            <button className="btn-logout" onClick={logout}>
              sign out
            </button>
          </div>
        </header>

        {/* ── Add form ── */}
        <div className="add-form">
          <span className="add-form-label">Add bookmark</span>
          <div className="input-row">
            <input
              ref={titleRef}
              className="input-field"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isAdding}
            />
            <input
              className="input-field url-field"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isAdding}
              type="url"
            />
            <button
              className="btn-add"
              onClick={addBookmark}
              disabled={isAdding || !title.trim() || !url.trim()}
            >
              {isAdding ? "Saving…" : "Save"}
            </button>
          </div>
          {errorMsg && (
            <p className="error-msg">
              <span>⚠</span> {errorMsg}
            </p>
          )}
        </div>

        {/* ── List ── */}
        <div className="list-header">
          <span className="list-title">Saved links</span>
          <span className="count-badge">{bookmarks.length}</span>
        </div>

        {bookmarks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📎</div>
            <h3>Nothing saved yet</h3>
            <p>Add your first bookmark above to get started.</p>
          </div>
        ) : (
          <ul className="bookmarks-list">
            {bookmarks.map((b) => {
              const isOptimistic = b.id.startsWith("optimistic-");
              const isDeleting = deletingIds.has(b.id);
              const favicon = getFavicon(b.url);

              return (
                <li
                  key={b.id}
                  className={`bookmark-item${isOptimistic ? " optimistic" : ""}${isDeleting ? " deleting" : ""}`}
                >
                  {/* Favicon */}
                  <div className="favicon-wrap">
                    {favicon ? (
                      <img
                        src={favicon}
                        alt=""
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="favicon-fallback">🔗</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="bookmark-info">
                    <a
                      className="bookmark-title"
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {b.title}
                    </a>
                    <div className="bookmark-meta">
                      <span className="bookmark-host">{getHostname(b.url)}</span>
                      {!isOptimistic && (
                        <>
                          <span className="meta-sep">·</span>
                          <span className="bookmark-date">{formatDate(b.created_at)}</span>
                        </>
                      )}
                      {isOptimistic && (
                        <>
                          <span className="meta-sep">·</span>
                          <span className="bookmark-date">saving…</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  {!isOptimistic && (
                    <button
                      className="btn-delete"
                      onClick={() => deleteBookmark(b.id)}
                      title="Remove bookmark"
                    >
                      ✕
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}