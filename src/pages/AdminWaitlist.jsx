import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SESSION_KEY = "careera_admin_secret";
const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 h

function loadCachedSecret() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { secret, ts } = JSON.parse(raw);
    if (Date.now() - ts > SESSION_TTL) { sessionStorage.removeItem(SESSION_KEY); return null; }
    return secret;
  } catch { return null; }
}

function cacheSecret(secret) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ secret, ts: Date.now() })); } catch { /* noop */ }
}

function formatDate(iso) {
  try { return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}

function exportCSV(entries) {
  const header = "Position,Email,Signed Up At";
  const rows = entries.map((e, i) => `${i + 1},"${e.email}","${e.signedUpAt || ""}"`);
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `careera-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Password screen ─────────────────────────────────────────────────────────
function PasswordGate({ onSuccess }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function submit(e) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/waitlist?secret=${encodeURIComponent(value.trim())}`);
      if (res.status === 401) { setError("Incorrect password."); setLoading(false); return; }
      if (!res.ok) { setError("Server error. Try again."); setLoading(false); return; }
      const data = await res.json();
      cacheSecret(value.trim());
      onSuccess(value.trim(), data);
    } catch {
      setError("Connection failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.013) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.013) 1px,transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <span className="text-[10px] font-mono text-zinc-600 tracking-[0.3em] uppercase">
            Careera · Admin
          </span>
          <h1 className="mt-3 text-2xl font-bold text-white">Waitlist Access</h1>
          <p className="mt-1.5 text-sm text-zinc-500">Enter your admin password to continue.</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="password"
            value={value}
            onChange={e => { setValue(e.target.value); setError(""); }}
            placeholder="Password"
            autoComplete="current-password"
            className="w-full bg-zinc-900/60 border border-zinc-700/60 rounded-xl px-4 py-3.5 text-white text-sm
                       placeholder-zinc-600 outline-none focus:border-zinc-500/80 focus:ring-1 focus:ring-zinc-500/20 transition-all"
          />

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-red-400 text-xs font-mono px-1"
              >
                ⚠ {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading || !value}
            className="w-full bg-white text-black font-semibold py-3.5 rounded-xl text-sm
                       hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying…" : "Enter →"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ secret, initialData }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [copied, setCopied] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/waitlist?secret=${encodeURIComponent(secret)}`);
      if (res.ok) { setData(await res.json()); setLastRefreshed(new Date()); }
    } finally { setLoading(false); }
  }, [secret]);

  const entries = (data?.entries ?? []).filter(e =>
    !search || e.email.toLowerCase().includes(search.toLowerCase())
  );

  function copyEmail(email) {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(email);
      setTimeout(() => setCopied(null), 1800);
    });
  }

  function copyAllEmails() {
    const allEmails = (data?.entries ?? []).map(e => e.email).join("\n");
    navigator.clipboard.writeText(allEmails).then(() => {
      setCopied("__all__");
      setTimeout(() => setCopied(null), 1800);
    });
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.013) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.013) 1px,transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      {/* Header */}
      <div className="relative z-10 border-b border-zinc-800/70 bg-zinc-950/80 backdrop-blur-sm px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-zinc-600 tracking-[0.25em] uppercase">Careera · Admin</span>
            <span className="text-zinc-700">·</span>
            <h1 className="text-sm font-semibold text-zinc-200">Waitlist Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-600">
            <span>Last refreshed: {lastRefreshed.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Signups",    value: data?.count ?? 0,       sub: "all time" },
            { label: "Showing",          value: entries.length,          sub: search ? "filtered" : "all entries" },
            { label: "Latest",           value: data?.entries?.length ? formatDate(data.entries[data.entries.length - 1].signedUpAt).split(",")[0] : "—", sub: "most recent signup" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 px-5 py-4">
              <div className="text-[10px] font-mono text-zinc-600 mb-1.5 tracking-widest uppercase">{label}</div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-[11px] text-zinc-600 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email…"
            className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white
                       placeholder-zinc-600 outline-none focus:border-zinc-600 transition-colors"
          />
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60
                       text-sm text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors disabled:opacity-50"
          >
            <span className={loading ? "animate-spin inline-block" : ""}>↻</span>
            Refresh
          </button>
          <button
            onClick={copyAllEmails}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60
                       text-sm text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
          >
            {copied === "__all__" ? "✓ Copied!" : "Copy all"}
          </button>
          <button
            onClick={() => exportCSV(data?.entries ?? [])}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-zinc-700 bg-white/6
                       text-sm text-white font-medium hover:bg-white/10 transition-colors"
          >
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-zinc-800/60 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[48px_1fr_200px_80px] gap-0 bg-zinc-900/50 border-b border-zinc-800/60 px-5 py-2.5">
            {["#", "Email", "Signed Up", ""].map((h) => (
              <div key={h} className="text-[10px] font-mono text-zinc-600 tracking-widest uppercase">{h}</div>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-zinc-800/40">
            {entries.length === 0 ? (
              <div className="px-5 py-10 text-center text-zinc-600 text-sm">
                {search ? "No emails matching your search." : "No signups yet."}
              </div>
            ) : (
              entries.map((entry, i) => {
                const position = (data?.entries ?? []).indexOf(entry) + 1;
                return (
                  <motion.div
                    key={entry.email}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className="grid grid-cols-[48px_1fr_200px_80px] gap-0 px-5 py-3 hover:bg-zinc-900/40 transition-colors group"
                  >
                    <div className="font-mono text-[11px] text-zinc-600 self-center">
                      {String(position).padStart(4, "0")}
                    </div>
                    <div className="self-center">
                      <span className="text-sm text-zinc-200 font-mono">{entry.email}</span>
                    </div>
                    <div className="self-center text-[11px] text-zinc-500 font-mono">
                      {formatDate(entry.signedUpAt)}
                    </div>
                    <div className="self-center">
                      <button
                        onClick={() => copyEmail(entry.email)}
                        className="text-[10px] font-mono text-zinc-600 hover:text-zinc-300 transition-colors
                                   opacity-0 group-hover:opacity-100 px-2 py-1 rounded border border-transparent
                                   hover:border-zinc-700"
                      >
                        {copied === entry.email ? "✓" : "Copy"}
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {entries.length > 0 && (
          <p className="text-[11px] text-zinc-700 font-mono mt-3 text-right">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}{search ? " (filtered)" : ""}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Page orchestrator ────────────────────────────────────────────────────────
export default function AdminWaitlist() {
  const [secret, setSecret] = useState(null);
  const [data,   setData]   = useState(null);

  // Try to restore session on mount
  useEffect(() => {
    const cached = loadCachedSecret();
    if (!cached) return;
    fetch(`/api/waitlist?secret=${encodeURIComponent(cached)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setSecret(cached); setData(d); } else { sessionStorage.removeItem(SESSION_KEY); } })
      .catch(() => {});
  }, []);

  if (secret && data) {
    return <Dashboard secret={secret} initialData={data} />;
  }

  return (
    <PasswordGate
      onSuccess={(s, d) => { setSecret(s); setData(d); }}
    />
  );
}
