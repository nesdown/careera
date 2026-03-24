import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Rocket, Check, ArrowRight, Copy, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";

// ── Promo codes shown floating — must match server-side PROMO_CODE_MAP ────────
const FLOATING_CODES = [
  'CAREERA01','CAREERA02','CAREERA03','CAREERA04','CAREERA05',
  'CAREERA06','CAREERA07','CAREERA08','CAREERA09','CAREERA10',
  'LAUNCH2026','EARLYBIRD','PIONEER01','PIONEER02','PIONEER03',
];

// ── Floating promo interceptor — appears every 5-7 minutes, flows across ──────
function FloatingPromo() {
  const [active, setActive] = useState(null); // { code, y, key }
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);
  const hideRef  = useRef(null);
  const codeIdxRef = useRef(0);

  const show = useCallback(() => {
    const code = FLOATING_CODES[codeIdxRef.current % FLOATING_CODES.length];
    codeIdxRef.current++;
    // Random vertical position — keep away from top/bottom bars
    const y = 18 + Math.random() * 58; // 18%–76% of viewport height
    setActive({ code, y, key: Date.now() });
    setCopied(false);

    // Auto-hide after 9 seconds
    hideRef.current = setTimeout(() => {
      setActive(null);
      scheduleNext();
    }, 9000);
  }, []);

  const scheduleNext = useCallback(() => {
    const delay = (5 + Math.random() * 2) * 60 * 1000; // 5–7 min
    timerRef.current = setTimeout(show, delay);
  }, [show]);

  useEffect(() => {
    scheduleNext();
    return () => { clearTimeout(timerRef.current); clearTimeout(hideRef.current); };
  }, [scheduleNext]);

  const handleCopy = useCallback(() => {
    if (!active?.code) return;
    navigator.clipboard.writeText(active.code).catch(() => {});
    setCopied(true);
    // Keep it visible a bit longer after copy so they can see confirmation
    clearTimeout(hideRef.current);
    hideRef.current = setTimeout(() => { setActive(null); scheduleNext(); }, 4000);
  }, [active, scheduleNext]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={active.key}
          initial={{ x: "-18%", opacity: 0 }}
          animate={{ x: ["−18%", "110%"], opacity: [0, 1, 1, 1, 0] }}
          transition={{ duration: 11, ease: "linear", times: [0, 0.06, 0.6, 0.88, 1] }}
          style={{ top: `${active.y}%` }}
          className="fixed left-0 z-50 pointer-events-none"
          aria-hidden
        >
          {/* The card itself is clickable */}
          <motion.button
            onClick={handleCopy}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl
                       bg-black/90 border border-white/20 backdrop-blur-md shadow-2xl
                       text-left cursor-pointer group hover:border-white/40 transition-colors"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Left accent */}
            <div className="w-0.5 h-8 bg-white/60 rounded-full shrink-0" />

            <div className="min-w-0">
              <div className="text-[9px] font-mono text-white/40 tracking-[0.3em] uppercase mb-0.5">
                Promo Code · Limited Use
              </div>
              <div className="text-base sm:text-lg font-mono font-bold text-white tracking-widest">
                {active.code}
              </div>
              <div className="text-[9px] font-mono text-white/30 mt-0.5">
                {copied ? "Copied to clipboard ✓" : "Click to copy · Use at checkout"}
              </div>
            </div>

            <div className="shrink-0 w-7 h-7 rounded-full border border-white/20 flex items-center justify-center
                            group-hover:border-white/40 transition-colors">
              {copied
                ? <CheckCheck className="w-3.5 h-3.5 text-white" />
                : <Copy className="w-3.5 h-3.5 text-white/50 group-hover:text-white transition-colors" />}
            </div>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Static star field (deterministic, no Math.random to avoid re-renders) ───
const STARS = Array.from({ length: 110 }, (_, i) => ({
  id: i,
  left: `${((i * 7919 + 31) % 1000) / 10}%`,
  top:  `${((i * 6271 + 47) % 1000) / 10}%`,
  size: i % 9 === 0 ? 2 : i % 4 === 0 ? 1.5 : 0.8,
  op:   0.06 + (i % 6) * 0.05,
}));

// ── Slide data ────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    num: 1, type: "poll",
    eyebrow: "OPENING POLL · 01",
    title: "Let's start with a quick guess",
    question: "What % of professionals are at risk due to AI in the next 2–3 years?",
    options: ["A  ·  10 – 20%", "B  ·  20 – 40%", "C  ·  40 – 60%", "D  ·  60%+"],
    revealHeadline: "30 – 50%+",
    revealBody: "The disruption is already here. The question is whether you're positioned to benefit — or to be replaced.",
  },
  {
    num: 2, type: "poll",
    eyebrow: "POLL · 02",
    title: "What actually drives success today?",
    question: "What is the single biggest career differentiator right now?",
    options: ["A  ·  Experience", "B  ·  Skills", "C  ·  Network", "D  ·  Positioning"],
    correctIndex: 3,
    revealHeadline: "Positioning wins.",
    revealBody: "You can have all three and still be invisible. Positioning is what makes everything else work.",
  },
  {
    num: 3, type: "statement",
    eyebrow: "REALITY CHECK · 03",
    title: "Here's the uncomfortable truth",
    lead: "Most people are not stuck because they lack skills.",
    lead2: "They are stuck because:",
    bullets: ["They are not visible", "They are not differentiated", "They are not packaged"],
  },
  {
    num: 4, type: "content",
    eyebrow: "OUR STORY · 04",
    title: "Why Careera exists",
    intro: "We saw too many:",
    bullets: ["Great engineers → no opportunities", "Strong specialists → low income", "Smart people → no direction"],
    closing: ["This is not a talent problem.", "This is a system problem."],
  },
  {
    num: 5, type: "big",
    eyebrow: "THE SHIFT · 05",
    title: "The old model is dead",
    formula: "Degree → Job → Promotion → Stability",
    sub: "This path is no longer reliable. It's slowing people down.",
  },
  {
    num: 6, type: "big",
    eyebrow: "THE NEW REALITY · 06",
    title: "What replaced it",
    formula: "Skills → Visibility → Demand → Income",
    sub: "You don't get paid for what you know. You get paid for how clearly you show value.",
    accent: true,
  },
  {
    num: 7, type: "split",
    eyebrow: "THE BIG SHIFT · 07",
    title: "From services → to productized value",
    left:  { label: "Old", items: ["Custom work", "Selling time", "Endless explanations"] },
    right: { label: "New", items: ["Clear offers", "Defined outcomes", "Fast decisions"] },
  },
  {
    num: 8, type: "content",
    eyebrow: "THE PROBLEM · 08",
    title: "Why most professionals stay stuck",
    bullets: ['"I can do anything" → unclear', '"Let\'s discuss" → friction', '"Hourly rate" → capped growth'],
    closing: ["People don't buy effort.", "They buy outcomes."],
  },
  {
    num: 9, type: "content",
    eyebrow: "THE PLAYBOOK · 09",
    title: "What top professionals do differently",
    bullets: ["Package their expertise", "Build clear offers", "Show proof", "Move fast"],
    closing: ["They don't chase jobs.", "They attract demand."],
  },
  {
    num: 10, type: "content",
    eyebrow: "RESEARCH · 10",
    title: "What we analyzed",
    intro: "We looked at:",
    bullets: ["Layoffs", "Hiring trends", "Startup ecosystems", "Freelance platforms"],
    closing: ["Pattern: the market rewards clarity and speed."],
  },
  {
    num: 11, type: "insight",
    eyebrow: "INSIGHT 01 · 11",
    title: "Layoffs are predictable",
    stat: "01",
    intro: "The first to go:",
    bullets: ["Replaceable roles", "Low-visibility contributors", "Generalists without positioning"],
  },
  {
    num: 12, type: "insight",
    eyebrow: "INSIGHT 02 · 12",
    title: "AI changes the rules",
    stat: "02",
    intro: "AI replaces:",
    bullets: ["Repetitive work", "Generic execution", "Slow output"],
    closing: ["It amplifies people who already stand out."],
  },
  {
    num: 13, type: "visibility",
    eyebrow: "INSIGHT 03 · 13",
    title: "Visibility = leverage",
    stat: "03",
    pairs: [{ bad: "Invisible", good: "Visible" }, { bad: "Replaceable", good: "Valuable" }],
    closing: "The difference is not skill. It's positioning.",
  },
  {
    num: 14, type: "content",
    eyebrow: "THE GAP · 14",
    title: "The real problem",
    intro: "People don't know:",
    bullets: ["What to focus on", "What the market wants", "How to package themselves", "What to do next"],
    closing: ["So they guess.", "And lose time."],
  },
  {
    num: 15, type: "product",
    eyebrow: "SOLUTION · 15",
    title: "So we built Careera",
    intro: "A system that helps you:",
    bullets: ["Understand your market value", "Build clear offerings", "Identify demand", "Move with confidence"],
  },
  {
    num: 16, type: "product",
    eyebrow: "PRODUCT INFRASTRUCTURE · 16",
    title: "How it works",
    bullets: ["Market insights engine", "Skill → offer transformation", "Career path builder", "Opportunity signals"],
    closing: ["Not content.", "A system."],
  },
  {
    num: 17, type: "big",
    eyebrow: "URGENCY · 17",
    title: "Why this matters now",
    formula: "The market is moving faster than ever.",
    sub: "If you don't adapt: you fall behind quietly.",
  },
  {
    num: 18, type: "cta",
    eyebrow: "EARLY ACCESS · 18",
    title: "You're early",
    code: "[YOUR CODE]",
    perks: ["Early access", "Better pricing", "Direct connection with us"],
  },
  {
    num: 19, type: "vision",
    eyebrow: "VISION · 19",
    title: "What we're building",
    items: ["Careers are dynamic", "Decisions are data-driven", "Growth is intentional"],
  },
  {
    num: 20, type: "closing",
    eyebrow: "FINAL · 20",
    title: "Let's build this together",
    sub: "This is just the beginning.",
  },
];

// ── Slide transition helpers (inline props, avoids function-variant edge cases) ─

const stagger = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function Eyebrow({ text }) {
  return (
    <motion.span
      variants={item}
      className="block text-[10px] sm:text-xs font-mono text-zinc-600 tracking-[0.3em] uppercase mb-4 sm:mb-6"
    >
      {text}
    </motion.span>
  );
}

function BulletItem({ text, accent = false }) {
  return (
    <motion.li variants={item} className="flex items-start gap-3">
      <span className={`mt-1 shrink-0 w-1 h-1 rounded-full ${accent ? "bg-white" : "bg-zinc-600"}`} />
      <span className={`text-base sm:text-lg leading-snug ${accent ? "text-zinc-200" : "text-zinc-400"}`}>{text}</span>
    </motion.li>
  );
}

function PollSlide({ s, selected, onSelect, revealed, onReveal }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 sm:space-y-8">
      <Eyebrow text={s.eyebrow} />
      <motion.h1 variants={item} className="text-3xl sm:text-5xl font-bold text-white leading-tight">
        {s.title}
      </motion.h1>
      <motion.p variants={item} className="text-base sm:text-xl text-zinc-400 leading-relaxed">
        {s.question}
      </motion.p>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {s.options.map((opt, i) => {
          const isSel = selected === i;
          const isCorrect = s.correctIndex === i && revealed;
          const isWrong = isSel && revealed && s.correctIndex !== undefined && i !== s.correctIndex;
          return (
            <motion.button
              key={i}
              onClick={() => !revealed && onSelect(i)}
              whileHover={!revealed ? { scale: 1.02 } : {}}
              whileTap={!revealed ? { scale: 0.98 } : {}}
              className={`relative p-4 sm:p-5 rounded-xl border text-left transition-all text-sm sm:text-base font-medium overflow-hidden
                ${isCorrect  ? "border-green-500/70 bg-green-500/10 text-white" :
                  isWrong    ? "border-zinc-700 bg-zinc-900/40 text-zinc-600" :
                  isSel      ? "border-white/60 bg-white/8 text-white" :
                  revealed   ? "border-zinc-800/60 bg-transparent text-zinc-600 cursor-default" :
                               "border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-500 hover:text-white cursor-pointer"}`}
            >
              {isCorrect && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-3 right-3 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-black" />
                </motion.span>
              )}
              {opt}
            </motion.button>
          );
        })}
      </motion.div>

      <motion.div variants={item}>
        <AnimatePresence mode="wait">
          {!revealed ? (
            <motion.button
              key="reveal-btn"
              onClick={onReveal}
              disabled={selected === undefined}
              whileHover={selected !== undefined ? { scale: 1.04 } : {}}
              whileTap={selected !== undefined ? { scale: 0.97 } : {}}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-400 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
            >
              Reveal Answer <ArrowRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.div
              key="reveal-box"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="p-5 sm:p-6 rounded-2xl border border-white/12 bg-white/[0.05]"
            >
              <div className="text-2xl sm:text-3xl font-bold text-white mb-2">{s.revealHeadline}</div>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">{s.revealBody}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function StatementSlide({ s }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 sm:space-y-8 max-w-3xl">
      <Eyebrow text={s.eyebrow} />
      <motion.h1 variants={item} className="text-3xl sm:text-5xl font-bold text-white leading-tight">
        {s.title}
      </motion.h1>
      <motion.p variants={item} className="text-lg sm:text-2xl text-zinc-300 leading-relaxed">
        {s.lead}
      </motion.p>
      <motion.p variants={item} className="text-base sm:text-lg text-zinc-500">
        {s.lead2}
      </motion.p>
      <motion.ul variants={stagger} className="space-y-3">
        {s.bullets.map((b, i) => <BulletItem key={i} text={b} accent />)}
      </motion.ul>
    </motion.div>
  );
}

function ContentSlide({ s }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 sm:space-y-7 max-w-3xl">
      <Eyebrow text={s.eyebrow} />
      <motion.h1 variants={item} className="text-3xl sm:text-5xl font-bold text-white leading-tight">
        {s.title}
      </motion.h1>
      {s.intro && (
        <motion.p variants={item} className="text-base sm:text-lg text-zinc-500">{s.intro}</motion.p>
      )}
      <motion.ul variants={stagger} className="space-y-3">
        {s.bullets.map((b, i) => <BulletItem key={i} text={b} />)}
      </motion.ul>
      {s.closing && (
        <motion.div variants={item} className="pt-2 space-y-1">
          {s.closing.map((c, i) => (
            <p key={i} className="text-lg sm:text-xl font-semibold text-white">{c}</p>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

function BigSlide({ s }) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center text-center space-y-6 sm:space-y-10 max-w-3xl mx-auto"
    >
      <Eyebrow text={s.eyebrow} />
      <motion.h1 variants={item} className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05]">
        {s.title}
      </motion.h1>
      <motion.div
        variants={item}
        className={`font-mono text-base sm:text-xl px-6 sm:px-8 py-4 sm:py-5 rounded-2xl border inline-block leading-relaxed
          ${s.accent ? "border-white/20 bg-white/5 text-white" : "border-zinc-800 bg-zinc-900/60 text-zinc-300"}`}
      >
        {s.formula}
      </motion.div>
      <motion.p variants={item} className="text-base sm:text-xl text-zinc-500 max-w-xl leading-relaxed">
        {s.sub}
      </motion.p>
    </motion.div>
  );
}

function SplitSlide({ s }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 sm:space-y-10 max-w-3xl">
      <Eyebrow text={s.eyebrow} />
      <motion.h1 variants={item} className="text-3xl sm:text-5xl font-bold text-white">{s.title}</motion.h1>
      <motion.div variants={item} className="grid grid-cols-2 gap-4 sm:gap-6">
        <div className="p-5 sm:p-7 rounded-2xl border border-zinc-800 bg-zinc-950/80 space-y-4">
          <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-zinc-600">{s.left.label}</div>
          <ul className="space-y-3">
            {s.left.items.map((it, i) => (
              <li key={i} className="flex items-center gap-2 text-sm sm:text-base text-zinc-500">
                <span className="text-zinc-700 shrink-0">×</span>{it}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5 sm:p-7 rounded-2xl border border-white/10 bg-white/[0.04] space-y-4">
          <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-zinc-400">{s.right.label}</div>
          <ul className="space-y-3">
            {s.right.items.map((it, i) => (
              <li key={i} className="flex items-center gap-2 text-sm sm:text-base text-white">
                <span className="text-white shrink-0">→</span>{it}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InsightSlide({ s }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="relative space-y-5 sm:space-y-7 max-w-3xl">
      <div
        className="absolute -top-8 -left-4 sm:-left-8 font-bold text-zinc-900 select-none pointer-events-none leading-none"
        style={{ fontSize: "clamp(80px, 18vw, 160px)" }}
        aria-hidden
      >
        {s.stat}
      </div>
      <Eyebrow text={s.eyebrow} />
      <motion.h1 variants={item} className="relative text-3xl sm:text-5xl font-bold text-white leading-tight z-10">
        {s.title}
      </motion.h1>
      {s.intro && (
        <motion.p variants={item} className="text-base sm:text-lg text-zinc-500">{s.intro}</motion.p>
      )}
      <motion.ul variants={stagger} className="space-y-3">
        {s.bullets.map((b, i) => <BulletItem key={i} text={b} />)}
      </motion.ul>
      {s.closing && (
        <motion.div variants={item} className="pt-2">
          {s.closing.map((c, i) => (
            <p key={i} className="text-lg sm:text-xl font-semibold text-white">{c}</p>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

function VisibilitySlide({ s }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="relative space-y-6 sm:space-y-10 max-w-3xl">
      <div
        className="absolute -top-8 -left-4 sm:-left-8 font-bold text-zinc-900 select-none pointer-events-none leading-none"
        style={{ fontSize: "clamp(80px, 18vw, 160px)" }}
        aria-hidden
      >
        {s.stat}
      </div>
      <Eyebrow text={s.eyebrow} />
      <motion.h1 variants={item} className="relative text-3xl sm:text-5xl font-bold text-white leading-tight z-10">
        {s.title}
      </motion.h1>
      <motion.div variants={item} className="grid grid-cols-2 gap-4">
        {s.pairs.map((p, i) => (
          <div key={i} className="space-y-2">
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <p className="text-sm text-zinc-600 font-mono mb-1">before</p>
              <p className="text-lg sm:text-xl font-bold text-zinc-500 line-through decoration-zinc-700">{p.bad}</p>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.05]">
              <p className="text-sm text-zinc-500 font-mono mb-1">after</p>
              <p className="text-lg sm:text-xl font-bold text-white">{p.good}</p>
            </div>
          </div>
        ))}
      </motion.div>
      <motion.p variants={item} className="text-lg sm:text-xl font-semibold text-white">{s.closing}</motion.p>
    </motion.div>
  );
}

function ProductSlide({ s }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 sm:space-y-8 max-w-3xl">
      <Eyebrow text={s.eyebrow} />
      <motion.h1 variants={item} className="text-3xl sm:text-5xl font-bold text-white leading-tight">
        {s.title}
      </motion.h1>
      {s.intro && (
        <motion.p variants={item} className="text-base sm:text-lg text-zinc-500">{s.intro}</motion.p>
      )}
      <motion.ul variants={stagger} className="space-y-3">
        {s.bullets.map((b, i) => (
          <motion.li key={i} variants={item} className="flex items-start gap-3 p-3 sm:p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/40">
            <div className="mt-1 w-5 h-5 rounded-full border border-zinc-700 flex items-center justify-center shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            <span className="text-base sm:text-lg text-zinc-200">{b}</span>
          </motion.li>
        ))}
      </motion.ul>
      {s.closing && (
        <motion.div variants={item} className="pt-2 space-y-1">
          {s.closing.map((c, i) => (
            <p key={i} className="text-lg sm:text-xl font-bold text-white">{c}</p>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

function CTASlide({ s }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(s.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }, [s.code]);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 sm:space-y-10 max-w-2xl mx-auto text-center">
      <Eyebrow text={s.eyebrow} />
      <motion.h1 variants={item} className="text-3xl sm:text-5xl font-bold text-white leading-tight">
        {s.title}
      </motion.h1>

      <motion.div
        variants={item}
        className="relative p-6 sm:p-8 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-950/80"
      >
        <div className="text-[10px] font-mono text-zinc-600 tracking-widest uppercase mb-3">Promo Code</div>
        <div className="text-2xl sm:text-4xl font-mono font-bold text-white tracking-widest mb-4">{s.code}</div>
        <motion.button
          onClick={handleCopy}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-zinc-700 text-xs font-mono text-zinc-400 hover:text-white hover:border-zinc-400 transition-all"
        >
          {copied ? <><Check className="w-3 h-3 text-green-400" /> Copied!</> : "Copy code"}
        </motion.button>
        {/* Corner ticks decoration */}
        {[["top-2 left-2", "border-t border-l"], ["top-2 right-2", "border-t border-r"], ["bottom-2 left-2", "border-b border-l"], ["bottom-2 right-2", "border-b border-r"]].map(([pos, border], i) => (
          <div key={i} className={`absolute ${pos} w-3 h-3 ${border} border-white/20`} />
        ))}
      </motion.div>

      <motion.ul variants={stagger} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
        {s.perks.map((p, i) => (
          <motion.li key={i} variants={item} className="flex items-center gap-2 text-sm text-zinc-400">
            <Check className="w-4 h-4 text-white shrink-0" />
            {p}
          </motion.li>
        ))}
      </motion.ul>
    </motion.div>
  );
}

function VisionSlide({ s }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 sm:space-y-10 max-w-2xl mx-auto">
      <Eyebrow text={s.eyebrow} />
      <motion.h1 variants={item} className="text-3xl sm:text-5xl font-bold text-white leading-tight">
        {s.title}
      </motion.h1>
      <motion.div variants={stagger} className="space-y-3 sm:space-y-4">
        {s.items.map((it, i) => (
          <motion.div
            key={i}
            variants={item}
            className="flex items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-xl border border-zinc-800/60 bg-zinc-900/40 group"
          >
            <div className="text-2xl sm:text-3xl font-mono font-bold text-zinc-800 shrink-0 w-8 text-right">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="w-px h-8 bg-zinc-800 shrink-0" />
            <p className="text-base sm:text-xl text-zinc-200 font-medium">{it}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function ClosingSlide({ s }) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center text-center space-y-6 sm:space-y-10 max-w-2xl mx-auto"
    >
      <Eyebrow text={s.eyebrow} />
      <motion.div variants={item} className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 border border-white/10">
        <Rocket className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
      </motion.div>
      <motion.h1 variants={item} className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05]">
        {s.title}
      </motion.h1>
      <motion.p variants={item} className="text-xl sm:text-2xl text-zinc-500">{s.sub}</motion.p>
      <motion.div variants={item}>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-400 transition-all mt-4"
        >
          Visit Careera.io <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </motion.div>
  );
}

function renderSlide(slide, pollState) {
  const { selected, onSelect, revealed, onReveal } = pollState;
  switch (slide.type) {
    case "poll":       return <PollSlide s={slide} selected={selected[slide.num]} onSelect={(i) => onSelect(slide.num, i)} revealed={!!revealed[slide.num]} onReveal={() => onReveal(slide.num)} />;
    case "statement":  return <StatementSlide s={slide} />;
    case "content":    return <ContentSlide s={slide} />;
    case "big":        return <BigSlide s={slide} />;
    case "split":      return <SplitSlide s={slide} />;
    case "insight":    return <InsightSlide s={slide} />;
    case "visibility": return <VisibilitySlide s={slide} />;
    case "product":    return <ProductSlide s={slide} />;
    case "cta":        return <CTASlide s={slide} />;
    case "vision":     return <VisionSlide s={slide} />;
    case "closing":    return <ClosingSlide s={slide} />;
    default:           return null;
  }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LaunchParty() {
  const [cur, setCur] = useState(0);
  const [dir, setDir] = useState(1);
  const [pollSelected, setPollSelected] = useState({});
  const [pollRevealed, setPollRevealed] = useState({});

  const goTo = useCallback((idx) => {
    if (idx < 0 || idx >= SLIDES.length) return;
    setDir(idx > cur ? 1 : -1);
    setCur(idx);
  }, [cur]);

  const next = useCallback(() => goTo(cur + 1), [cur, goTo]);
  const prev = useCallback(() => goTo(cur - 1), [cur, goTo]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const pollState = {
    selected: pollSelected,
    onSelect: (num, i) => setPollSelected(p => ({ ...p, [num]: i })),
    revealed: pollRevealed,
    onReveal: (num) => setPollRevealed(p => ({ ...p, [num]: true })),
  };

  const slide = SLIDES[cur];
  const progress = ((cur + 1) / SLIDES.length) * 100;

  return (
    <div className="fixed inset-0 bg-[#050507] overflow-hidden" style={{ userSelect: "none" }}>

      {/* Floating promo codes — appear every 5-7 minutes */}
      <FloatingPromo />

      {/* Star field */}
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{ left: s.left, top: s.top, width: `${s.size}px`, height: `${s.size}px`, opacity: s.op }}
          />
        ))}
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.011) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.011) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      {/* Radial glow at center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,255,255,0.015) 0%, transparent 70%)" }}
      />

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 h-12 sm:h-14 flex items-center justify-between px-5 sm:px-8 z-20 border-b border-white/[0.06]">
        <Link
          to="/"
          className="text-[10px] sm:text-xs font-mono text-zinc-700 hover:text-zinc-400 transition-colors tracking-widest uppercase"
        >
          ← Careera
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-zinc-500">{String(cur + 1).padStart(2, "0")}</span>
          <span className="text-xs font-mono text-zinc-800">/</span>
          <span className="text-xs font-mono text-zinc-700">{String(SLIDES.length).padStart(2, "0")}</span>
        </div>
      </div>

      {/* ── Slide content ──────────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center pt-12 sm:pt-14 pb-16">
        <div className="w-full max-w-4xl px-5 sm:px-10 overflow-y-auto max-h-full py-6 sm:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={cur}
              initial={{ opacity: 0, y: dir > 0 ? 32 : -32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: dir > 0 ? -20 : 20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              {renderSlide(slide, pollState)}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom bar ─────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-14 sm:h-16 flex items-center justify-between px-5 sm:px-8 z-20 border-t border-white/[0.06]">
        {/* Prev button */}
        <motion.button
          onClick={prev}
          disabled={cur === 0}
          whileHover={cur > 0 ? { scale: 1.06 } : {}}
          whileTap={cur > 0 ? { scale: 0.94 } : {}}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-600 hover:text-white hover:border-zinc-600 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>

        {/* Progress dots */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center max-w-[60vw]">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 hover:bg-zinc-400
                ${i === cur ? "w-5 sm:w-6 h-1.5 bg-white" : "w-1.5 h-1.5 bg-zinc-700"}`}
            />
          ))}
        </div>

        {/* Next button */}
        <motion.button
          onClick={next}
          disabled={cur === SLIDES.length - 1}
          whileHover={cur < SLIDES.length - 1 ? { scale: 1.06 } : {}}
          whileTap={cur < SLIDES.length - 1 ? { scale: 0.94 } : {}}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-600 hover:text-white hover:border-zinc-600 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* ── Progress bar (very bottom edge) ───────────────── */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-zinc-900 w-full z-30 pointer-events-none">
        <motion.div
          className="h-full bg-white/30"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* ── Keyboard hint (fades after 3s) ─────────────────── */}
      <KeyboardHint />
    </div>
  );
}

function KeyboardHint() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute bottom-16 sm:bottom-20 right-5 sm:right-8 flex items-center gap-2 text-[10px] font-mono text-zinc-700 pointer-events-none"
        >
          <span className="px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900">←</span>
          <span className="px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900">→</span>
          <span className="text-zinc-800">navigate</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
