import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

// ─── Seeded deterministic pseudo-random ────────────────────────────────────────
function seeded(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

// ─── Star field with constellation lines ───────────────────────────────────────
function StarCanvas() {
  const { stars, lines } = useMemo(() => {
    const r = seeded(0xf1e1d);
    const pts = Array.from({ length: 220 }, (_, i) => ({
      id: i,
      x: r() * 100,
      y: r() * 100,
      s: r() < 0.04 ? 2.4 : r() < 0.18 ? 1.5 : 0.6,
      op: r() < 0.04 ? 0.85 : r() < 0.18 ? 0.5 : 0.18,
      dur: 4 + r() * 8,
      delay: r() * 12,
    }));

    // connect nearby bright stars into constellation segments
    const bright = pts.filter(p => p.s >= 1.5);
    const segs = [];
    for (let i = 0; i < bright.length; i++) {
      for (let j = i + 1; j < bright.length; j++) {
        const dx = bright[i].x - bright[j].x;
        const dy = bright[i].y - bright[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 11 && segs.length < 28) {
          segs.push({ id: `${i}-${j}`, x1: bright[i].x, y1: bright[i].y, x2: bright[j].x, y2: bright[j].y });
        }
      }
    }
    return { stars: pts, lines: segs };
  }, []);

  return (
    <svg className="fixed inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      {/* Constellation lines */}
      {lines.map(l => (
        <line key={l.id} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="white" strokeWidth="0.04" strokeOpacity="0.08" />
      ))}
      {/* Stars */}
      {stars.map(s => (
        <motion.circle key={s.id} cx={s.x} cy={s.y} r={s.s * 0.1} fill="white"
          animate={{ opacity: [s.op * 0.35, s.op, s.op * 0.35] }}
          transition={{ duration: s.dur, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
}

// ─── Orbital rings (very slow, white) ──────────────────────────────────────────
function OrbitalRings() {
  const rings = [
    { r: 220, dur: 180, opacity: 0.055, dash: "2 6" },
    { r: 330, dur: 280, opacity: 0.038, dash: "1 10" },
    { r: 460, dur: 400, opacity: 0.022, dash: "none" },
    { r: 600, dur: 550, opacity: 0.014, dash: "none" },
  ];
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {rings.map(({ r, dur, opacity, dash }, i) => (
        <motion.div key={i} className="absolute rounded-full border border-white"
          style={{
            width: r * 2, height: r * 2,
            opacity,
            borderStyle: dash !== "none" ? "dashed" : "solid",
          }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: dur, repeat: Infinity, ease: "linear" }}
        />
      ))}
      {/* Planet dot on first ring */}
      <motion.div className="absolute"
        style={{ width: 440, height: 440 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-2 h-2 rounded-full bg-white"
          style={{ opacity: 0.5, boxShadow: "0 0 8px 2px rgba(255,255,255,0.4)" }}
        />
      </motion.div>
    </div>
  );
}

// ─── HUD corner brackets ────────────────────────────────────────────────────────
function HudCorners() {
  const size = 28, stroke = 1.5;
  const corners = [
    { pos: "top-6 left-6",    d: `M${size},0 L0,0 L0,${size}` },
    { pos: "top-6 right-6",   d: `M0,0 L${size},0 L${size},${size}` },
    { pos: "bottom-6 left-6", d: `M0,0 L0,${size} L${size},${size}` },
    { pos: "bottom-6 right-6",d: `M${size},0 L${size},${size} L0,${size}` },
  ];
  return (
    <>
      {corners.map(({ pos, d }, i) => (
        <motion.div key={i} className={`fixed ${pos} pointer-events-none`}
          initial={{ opacity: 0 }} animate={{ opacity: 0.22 }} transition={{ delay: 0.8 + i * 0.1 }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
            <path d={d} stroke="white" strokeWidth={stroke} strokeLinecap="square" />
          </svg>
        </motion.div>
      ))}
    </>
  );
}

// ─── Scan line ──────────────────────────────────────────────────────────────────
function ScanLine() {
  return (
    <motion.div className="fixed left-0 right-0 h-px pointer-events-none z-0"
      style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)" }}
      initial={{ top: "-2%" }}
      animate={{ top: "102%" }}
      transition={{ duration: 14, repeat: Infinity, ease: "linear", repeatDelay: 4 }}
    />
  );
}

// ─── Crosshair target (center background) ──────────────────────────────────────
function Crosshair() {
  return (
    <motion.div className="fixed inset-0 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1.2 }}>
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="opacity-[0.07]">
        <circle cx="60" cy="60" r="40" stroke="white" strokeWidth="0.75" />
        <circle cx="60" cy="60" r="20" stroke="white" strokeWidth="0.5" strokeDasharray="2 4" />
        <circle cx="60" cy="60" r="3" stroke="white" strokeWidth="0.75" />
        <line x1="60" y1="0" x2="60" y2="36" stroke="white" strokeWidth="0.5" />
        <line x1="60" y1="84" x2="60" y2="120" stroke="white" strokeWidth="0.5" />
        <line x1="0" y1="60" x2="36" y2="60" stroke="white" strokeWidth="0.5" />
        <line x1="84" y1="60" x2="120" y2="60" stroke="white" strokeWidth="0.5" />
      </svg>
    </motion.div>
  );
}

// ─── Coordinate readout (decorative) ───────────────────────────────────────────
function CoordReadouts() {
  return (
    <>
      <motion.div className="fixed bottom-8 right-8 pointer-events-none"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }}>
        <div className="font-mono text-[9px] text-white/20 text-right space-y-0.5">
          <div>RA 14h 29m 43s</div>
          <div>DEC +02° 10′ 26″</div>
          <div>ALT 482.3 km</div>
        </div>
      </motion.div>
      <motion.div className="fixed bottom-8 left-8 pointer-events-none"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 1 }}>
        <div className="font-mono text-[9px] text-white/20 space-y-0.5">
          <div>MISSION: LEADERSHIP-01</div>
          <div>STATUS: ACCEPTING CREW</div>
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>
            UPLINK ● LIVE
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Grid overlay ───────────────────────────────────────────────────────────────
function GridOverlay() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{
      backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)",
      backgroundSize: "72px 72px",
    }} />
  );
}

// ─── State machine ──────────────────────────────────────────────────────────────
const S = { IDLE: "idle", LOADING: "loading", SUCCESS: "success", DUPLICATE: "duplicate", ERROR: "error" };

// ─── Page ───────────────────────────────────────────────────────────────────────
export default function Waitlist() {
  const [email, setEmail]       = useState("");
  const [state, setState]       = useState(S.IDLE);
  const [position, setPosition] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const validate = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  async function submit(e) {
    e.preventDefault();
    if (!validate(email)) {
      setErrorMsg("Invalid email address.");
      setState(S.ERROR);
      return;
    }
    setState(S.LOADING);
    try {
      const res  = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || "Something went wrong.");
        setState(S.ERROR);
        return;
      }
      setPosition(data.position);
      setState(data.alreadyRegistered ? S.DUPLICATE : S.SUCCESS);
    } catch {
      setErrorMsg("Connection failed. Please try again.");
      setState(S.ERROR);
    }
  }

  const done = state === S.SUCCESS || state === S.DUPLICATE;

  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden px-4 py-12">

      {/* Background layers */}
      <StarCanvas />
      <GridOverlay />
      <OrbitalRings />
      <Crosshair />
      <ScanLine />
      <HudCorners />
      <CoordReadouts />

      {/* Back link */}
      <motion.div className="fixed top-7 left-[42px] z-20"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <Link to="/"
          className="flex items-center gap-1.5 text-white/30 hover:text-white/70 transition-colors text-[10px] font-mono tracking-[0.25em] uppercase group">
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          Careera
        </Link>
      </motion.div>

      {/* Main content */}
      <motion.div className="relative z-10 w-full max-w-[400px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>

        {/* Eyebrow badge */}
        <motion.div className="flex items-center justify-center gap-2.5 mb-10"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="h-px w-8 bg-white/20" />
          <motion.span
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 2.2, repeat: Infinity }}>
            <span className="text-[9px] font-mono text-white/40 tracking-[0.4em] uppercase">
              Early Access · 2026
            </span>
          </motion.span>
          <div className="h-px w-8 bg-white/20" />
        </motion.div>

        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}>

              {/* Headline */}
              <h1 className="text-[42px] sm:text-[52px] font-bold text-white text-center
                             leading-[1.05] tracking-tight mb-5">
                Leadership<br />
                that{" "}
                <span className="relative inline-block">
                  scales.
                  {/* Underline accent */}
                  <motion.span className="absolute bottom-0.5 left-0 right-0 h-px bg-white"
                    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                    transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
                    style={{ originX: 0 }} />
                </span>
              </h1>

              <p className="text-white/40 text-[13.5px] text-center leading-relaxed mb-10 max-w-[320px] mx-auto">
                The first AI-powered leadership growth platform.
                Know exactly what to change and how — at your stage, in your industry.
              </p>

              {/* Form */}
              <form onSubmit={submit} className="flex flex-col gap-2.5">
                <div className="relative group">
                  <input
                    ref={inputRef}
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); if (state === S.ERROR) setState(S.IDLE); }}
                    placeholder="your@email.com"
                    required
                    disabled={state === S.LOADING}
                    className={`w-full bg-white/[0.04] border text-white placeholder-white/20
                                text-sm rounded-xl px-5 py-4 outline-none transition-all
                                backdrop-blur-sm disabled:opacity-50
                                ${state === S.ERROR
                                  ? "border-white/40 ring-1 ring-red-500/40"
                                  : "border-white/14 hover:border-white/28 focus:border-white/50 focus:ring-1 focus:ring-white/20"}`}
                  />
                  {/* Corner ticks on input */}
                  {["top-0 left-0","top-0 right-0","bottom-0 left-0","bottom-0 right-0"].map((pos, i) => (
                    <span key={i} className={`absolute ${pos} w-1.5 h-1.5 border-white/30
                                              transition-opacity opacity-0 group-focus-within:opacity-100
                                              ${i === 0 ? "border-t border-l rounded-tl" :
                                                i === 1 ? "border-t border-r rounded-tr" :
                                                i === 2 ? "border-b border-l rounded-bl" :
                                                          "border-b border-r rounded-br"}`} />
                  ))}
                </div>

                <AnimatePresence>
                  {state === S.ERROR && (
                    <motion.p className="text-white/50 text-[11px] font-mono px-1"
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      ⚠ {errorMsg}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button type="submit"
                  disabled={state === S.LOADING || !email}
                  whileHover={{ scale: 1.012 }}
                  whileTap={{ scale: 0.975 }}
                  className="relative w-full bg-white text-black font-semibold
                             py-[15px] rounded-xl text-[13.5px] tracking-wide
                             hover:bg-white/90 transition-colors
                             disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden">

                  {/* Shimmer sweep on hover */}
                  <motion.span className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(105deg,transparent 35%,rgba(0,0,0,0.06) 50%,transparent 65%)" }}
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.55, ease: "easeInOut" }} />

                  {state === S.LOADING ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span className="inline-block w-3.5 h-3.5 border border-black/20 border-t-black rounded-full"
                        animate={{ rotate: 360 }} transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }} />
                      Transmitting…
                    </span>
                  ) : (
                    "Request Early Access →"
                  )}
                </motion.button>
              </form>

              <p className="text-white/18 text-[10px] text-center mt-4 font-mono tracking-wide">
                No credit card · No spam · Limited spots
              </p>

              {/* Feature strip */}
              <motion.div className="mt-10 grid grid-cols-3 gap-2"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
                {[
                  { glyph: "◎", label: "AI Assessment",  sub: "Personalised to your stage" },
                  { glyph: "◈", label: "PDF Report",     sub: "In-depth growth analysis"   },
                  { glyph: "◇", label: "1:1 Coaching",   sub: "Expert-guided sessions"     },
                ].map(({ glyph, label, sub }) => (
                  <div key={label}
                    className="rounded-xl border border-white/[0.07] bg-white/[0.025]
                               px-2 py-3.5 text-center backdrop-blur-sm">
                    <div className="text-white/50 text-base mb-1.5 font-mono">{glyph}</div>
                    <div className="text-white/70 text-[10.5px] font-semibold mb-0.5">{label}</div>
                    <div className="text-white/25 text-[9.5px]">{sub}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="success" className="text-center"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>

              {/* Animated ring + check */}
              <div className="relative mx-auto mb-8 w-20 h-20">
                {/* Outer rotating dashed ring */}
                <motion.div className="absolute inset-0 rounded-full border border-white/20"
                  style={{ borderStyle: "dashed" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }} />
                {/* Inner ring */}
                <div className="absolute inset-2 rounded-full border border-white/20 flex items-center justify-center"
                  style={{ boxShadow: "0 0 32px rgba(255,255,255,0.06)" }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <motion.path d="M5 14 L11 20 L23 8"
                      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }} />
                  </svg>
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight tracking-tight">
                {state === S.DUPLICATE ? "Already aboard." : "Access granted."}
              </h2>

              <p className="text-white/40 text-[13.5px] leading-relaxed max-w-[280px] mx-auto mb-6">
                {state === S.DUPLICATE
                  ? "Your coordinates are already logged. We'll reach you when the mission opens."
                  : "Your coordinates are logged. We'll reach out when early access launches."}
              </p>

              {position && state === S.SUCCESS && (
                <motion.div className="inline-flex items-center gap-2.5 border border-white/15
                                       rounded-full px-5 py-2 mb-8"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <motion.span className="w-1.5 h-1.5 rounded-full bg-white"
                    animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
                  <span className="text-white/60 text-[11px] font-mono tracking-widest">
                    POSITION #{String(position).padStart(4, "0")}
                  </span>
                </motion.div>
              )}

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                <Link to="/"
                  className="text-white/25 hover:text-white/60 transition-colors
                             text-[10px] font-mono tracking-[0.3em] uppercase">
                  ← Return to base
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
