import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

// ── Deterministic star field ────────────────────────────────────────────────
function StarField() {
  const stars = useMemo(
    () =>
      Array.from({ length: 160 }, (_, i) => ({
        id: i,
        x: (((i * 7919 + 1) * 13) % 1000) / 10,
        y: (((i * 6271 + 3) * 17) % 1000) / 10,
        size: i % 14 === 0 ? 2.2 : i % 5 === 0 ? 1.4 : 0.7,
        duration: 3 + (i % 7),
        delay: (i % 9) * 0.4,
        opacity: i % 14 === 0 ? 0.7 : i % 5 === 0 ? 0.45 : 0.2,
      })),
    []
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {stars.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
          animate={{ opacity: [s.opacity * 0.3, s.opacity, s.opacity * 0.3] }}
          transition={{ duration: s.duration, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ── Orbital decoration ──────────────────────────────────────────────────────
function OrbitalRing({ r, opacity, duration, color = "rgba(134,239,172," }) {
  return (
    <motion.div
      className="absolute rounded-full border"
      style={{
        width: r * 2,
        height: r * 2,
        top: "50%",
        left: "50%",
        marginTop: -r,
        marginLeft: -r,
        borderColor: `${color}${opacity})`,
      }}
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
    />
  );
}

// ── States ──────────────────────────────────────────────────────────────────
const STATE = { IDLE: "idle", LOADING: "loading", SUCCESS: "success", DUPLICATE: "duplicate", ERROR: "error" };

export default function Waitlist() {
  const [email, setEmail]       = useState("");
  const [state, setState]       = useState(STATE.IDLE);
  const [position, setPosition] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const validate = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate(email)) {
      setErrorMsg("Please enter a valid email address.");
      setState(STATE.ERROR);
      return;
    }
    setState(STATE.LOADING);
    try {
      const res  = await fetch("/api/waitlist", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        setState(STATE.ERROR);
        return;
      }
      setPosition(data.position);
      setState(data.alreadyRegistered ? STATE.DUPLICATE : STATE.SUCCESS);
    } catch {
      setErrorMsg("Connection failed. Please try again.");
      setState(STATE.ERROR);
    }
  }

  const isSubmitted = state === STATE.SUCCESS || state === STATE.DUPLICATE;

  return (
    <div className="relative min-h-screen bg-[#09090b] flex flex-col items-center justify-center overflow-hidden px-4">
      <StarField />

      {/* Grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.013) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.013) 1px,transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Radial glow */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(134,239,172,0.055) 0%,transparent 65%)" }}
        />
      </div>

      {/* Orbital rings (decorative) */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <OrbitalRing r={260} opacity={0.06} duration={90} />
        <OrbitalRing r={360} opacity={0.04} duration={140} color="rgba(147,197,253," />
        <OrbitalRing r={480} opacity={0.025} duration={200} />
      </div>

      {/* Back to home */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="fixed top-6 left-6 z-20"
      >
        <Link
          to="/"
          className="flex items-center gap-2 text-zinc-600 hover:text-zinc-300 transition-colors text-xs font-mono tracking-widest uppercase group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          Careera
        </Link>
      </motion.div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex items-center justify-center gap-2 mb-8"
        >
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-[#86efac]"
            style={{ boxShadow: "0 0 8px 3px rgba(134,239,172,0.5)" }}
          />
          <span className="text-[10px] font-mono text-zinc-500 tracking-[0.35em] uppercase">
            Careera · Early Access
          </span>
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.9 }}
            className="w-1.5 h-1.5 rounded-full bg-[#86efac]"
            style={{ boxShadow: "0 0 8px 3px rgba(134,239,172,0.5)" }}
          />
        </motion.div>

        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl font-bold text-white text-center leading-[1.1] mb-5 tracking-tight">
                Leadership that{" "}
                <span className="text-[#86efac]">scales</span>
                <br />
                beyond you.
              </h1>

              <p className="text-zinc-400 text-center text-base leading-relaxed mb-10 max-w-sm mx-auto">
                Join the waitlist for early access to the world's first AI-powered leadership growth platform. 
                Know exactly what to change and how.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="relative group">
                  <input
                    ref={inputRef}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (state === STATE.ERROR) setState(STATE.IDLE);
                    }}
                    placeholder="Enter your email"
                    required
                    disabled={state === STATE.LOADING}
                    className={`w-full bg-zinc-900/80 border rounded-2xl px-5 py-4 text-white placeholder-zinc-600 text-sm outline-none transition-all backdrop-blur-sm focus:ring-2 disabled:opacity-60 ${
                      state === STATE.ERROR
                        ? "border-red-500/60 focus:ring-red-500/30"
                        : "border-zinc-700/60 focus:border-[#86efac]/50 focus:ring-[#86efac]/20 group-hover:border-zinc-600/80"
                    }`}
                  />
                  {/* Glow on focus */}
                  <div className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity opacity-0 group-focus-within:opacity-100"
                       style={{ boxShadow: "0 0 0 1px rgba(134,239,172,0.25), 0 0 24px rgba(134,239,172,0.08)" }}
                  />
                </div>

                <AnimatePresence>
                  {state === STATE.ERROR && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-400 text-xs font-mono px-1"
                    >
                      {errorMsg}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={state === STATE.LOADING || !email}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.975 }}
                  animate={state !== STATE.LOADING ? {
                    boxShadow: [
                      "0 0 0px rgba(134,239,172,0)",
                      "0 0 28px rgba(134,239,172,0.18)",
                      "0 0 0px rgba(134,239,172,0)",
                    ],
                  } : {}}
                  transition={{ duration: 2.8, repeat: Infinity }}
                  className="w-full bg-white text-black font-semibold py-4 rounded-2xl text-sm hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  {state === STATE.LOADING ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                        className="inline-block w-4 h-4 border-2 border-black/20 border-t-black rounded-full"
                      />
                      Reserving your spot…
                    </span>
                  ) : (
                    "Join the Waitlist →"
                  )}
                </motion.button>
              </form>

              <p className="text-zinc-700 text-[11px] text-center mt-5 font-mono">
                No spam. No credit card. Early access only.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              {/* Animated checkmark */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-[#86efac]/10 border border-[#86efac]/30 flex items-center justify-center mx-auto mb-8"
                style={{ boxShadow: "0 0 40px rgba(134,239,172,0.15)" }}
              >
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <motion.path
                    d="M8 18 L15 25 L28 11"
                    stroke="#86efac"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                  />
                </svg>
              </motion.div>

              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                {state === STATE.DUPLICATE ? "You're already in." : "You're on the list."}
              </h2>

              <p className="text-zinc-400 text-base leading-relaxed max-w-xs mx-auto mb-3">
                {state === STATE.DUPLICATE
                  ? "We already have your email on the waitlist. We'll reach out when early access opens."
                  : "We'll reach out when early access opens. Expect something worth waiting for."}
              </p>

              {position && state === STATE.SUCCESS && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="inline-flex items-center gap-2 bg-[#86efac]/8 border border-[#86efac]/20 rounded-full px-5 py-2 mb-8"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#86efac]" />
                  <span className="text-[#86efac] text-sm font-mono">
                    #{position} on the waitlist
                  </span>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <Link
                  to="/"
                  className="inline-block text-zinc-600 hover:text-zinc-400 transition-colors text-xs font-mono tracking-widest uppercase"
                >
                  ← Back to home
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature hints below the form */}
        {!isSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-14 grid grid-cols-3 gap-3"
          >
            {[
              { icon: "◎", label: "AI Assessment", sub: "Personalised to your stage" },
              { icon: "◈", label: "PDF Report",    sub: "Deep-dive leadership plan" },
              { icon: "◇", label: "Live Coaching", sub: "1:1 expert sessions" },
            ].map(({ icon, label, sub }) => (
              <div
                key={label}
                className="rounded-2xl border border-zinc-800/70 bg-zinc-900/30 px-3 py-4 text-center backdrop-blur-sm"
              >
                <div className="text-[#86efac] text-lg mb-1.5 font-mono">{icon}</div>
                <div className="text-white text-[11px] font-semibold mb-0.5">{label}</div>
                <div className="text-zinc-600 text-[10px]">{sub}</div>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
