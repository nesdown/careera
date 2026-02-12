import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  Sparkles,
  ArrowRight,
  Users,
  Award,
  Trophy,
  Compass,
  Map,
  Rocket,
  Clock,
  Calendar,
  DollarSign,
  ShieldCheck,
  Target,
  CheckCircle,
  TrendingUp,
  Zap,
  Star,
  BarChart3,
  LineChart,
  ChevronRight,
  Quote,
} from "lucide-react";
import Navbar from "../components/Navbar";
import QuestionnaireWidget from "../components/QuestionnaireWidget";
import Logo from "../components/Logo";
import LiveActivity from "../components/LiveActivity";
import CountdownTimer from "../components/CountdownTimer";
import CostOfWaiting from "../components/CostOfWaiting";

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const childFade = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

// Animated Counter Component
function AnimatedCounter({ end, duration = 2, suffix = "", prefix = "" }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;
    
    const startTime = Date.now();
    const endTime = startTime + duration * 1000;

    const updateCount = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const easeOutQuad = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOutQuad * end));

      if (now < endTime) {
        requestAnimationFrame(updateCount);
      } else {
        setCount(end);
        setHasAnimated(true);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          updateCount();
        }
      },
      { threshold: 0.5 }
    );

    const element = document.getElementById(`counter-${end}`);
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return (
    <span id={`counter-${end}`}>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}

// Circular Progress Chart
function CircularProgress({ percentage, label, value }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="flex flex-col items-center"
    >
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-zinc-800"
          />
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
            className="text-white"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-white">{value}</div>
          <div className="text-xs text-zinc-400 mt-1">{label}</div>
        </div>
      </div>
    </motion.div>
  );
}

// Success Story Card
function SuccessStory({ quote, name, role, achievement, beforeSalary, afterSalary, image, timeAgo }) {
  return (
    <motion.div
      variants={childFade}
      whileHover={{ y: -8, boxShadow: "0 20px 60px rgba(255,255,255,0.1)" }}
      className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-8 relative overflow-hidden group"
    >
      <div className="absolute top-3 right-3">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="px-2 py-1 bg-white/10 border border-white/20 rounded-full text-xs text-white font-medium"
        >
          {timeAgo}
        </motion.div>
      </div>
      <div className="absolute top-16 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Quote className="w-16 h-16 text-white" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <img 
            src={image}
            alt={name}
            className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700"
          />
          <div>
            <div className="font-semibold text-white">{name}</div>
            <div className="text-sm text-zinc-400">{role}</div>
          </div>
        </div>

        <p className="text-zinc-300 mb-4 leading-relaxed italic">"{quote}"</p>

        <div className="flex items-center gap-4 pt-4 border-t border-zinc-800">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-white" />
            <span className="text-zinc-400">
              <span className="text-zinc-600 line-through">${beforeSalary}</span>
              <ArrowRight className="w-3 h-3 inline mx-1" />
              <span className="text-white font-semibold">${afterSalary}</span>
            </span>
          </div>
          <div className="text-xs text-zinc-400 px-3 py-1 bg-zinc-800 rounded-full">
            {achievement}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Old Way Card - Painful & FOMO-inducing
function OldWayCard() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      variants={childFade}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3 }}
      className="relative bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-zinc-800 rounded-3xl p-8 overflow-hidden"
    >
      {/* Subtle darkening overlay on hover */}
      <motion.div
        animate={{ opacity: isHovered ? 0.2 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black pointer-events-none z-0"
      />

      <div className="relative z-10">
        <div className="absolute top-4 right-4 px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-400 font-semibold">
          Old Way
        </div>

        <div className="mb-6">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6 text-zinc-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Still Waiting & Watching</h3>
          <p className="text-sm text-zinc-500">While opportunities pass you by...</p>
        </div>

        {/* Pain Points */}
        <ul className="space-y-3 mb-6">
          {[
            "Sending 50+ applications with no responses",
            "Watching less qualified people get promoted",
            "Stuck at the same salary for 3+ years",
            "No mentor, no plan, no progress",
            "Another year saying 'maybe next year'",
          ].map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-zinc-400"
            >
              <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-zinc-600 rounded-full" />
              </div>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* Live "wasted time" counters */}
        <div className="mt-6 pt-6 border-t border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Average time stuck</span>
            <div className="text-2xl font-bold tabular-nums text-zinc-500">
              30+ months
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Opportunities you'll miss</span>
            <div className="text-2xl font-bold tabular-nums text-zinc-500">
              47+
            </div>
          </div>
          <div className="pt-3 border-t border-zinc-800">
            <div className="text-zinc-600 text-xs mb-1">Time to breakthrough</div>
            <div className="text-3xl font-bold text-zinc-500">2.5+ years</div>
            <motion.p
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-xs text-zinc-600 mt-2"
            >
              If you even make it...
            </motion.p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// New Way Card - Attractive & Urgency-driven
function NewWayCard() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      variants={childFade}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.3 }}
      animate={{
        boxShadow: isHovered
          ? "0 30px 80px rgba(255,255,255,0.12)"
          : "0 20px 60px rgba(255,255,255,0.05)",
      }}
      className="relative bg-gradient-to-br from-white/5 to-zinc-900 border-2 border-white/20 rounded-3xl p-8 overflow-hidden"
    >
      {/* Animated glow on hover */}
      <motion.div
        animate={{
          opacity: isHovered ? 0.15 : 0,
          scale: isHovered ? 1 : 0.8,
        }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 bg-white rounded-3xl blur-3xl pointer-events-none"
      />

      <div className="relative z-10">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs text-white font-semibold flex items-center gap-1"
          >
            <Zap className="w-3 h-3" />
            New Way
          </motion.div>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="px-2 py-1 bg-white text-black rounded-full text-xs font-bold"
          >
            POPULAR
          </motion.div>
        </div>

        <div className="mb-6">
          <motion.div
            animate={{ 
              scale: isHovered ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 0.5 }}
            className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-4"
          >
            <Rocket className="w-6 h-6 text-white" />
          </motion.div>
          <h3 className="text-2xl font-bold text-white mb-2">Your Clear Path Forward</h3>
          <p className="text-sm text-zinc-400">Join the winners getting results</p>
        </div>

        {/* Benefits */}
        <ul className="space-y-3 mb-6">
          {[
            "Personalized roadmap to YOUR exact dream role",
            "1-on-1 mentorship from people who've made it",
            "Weekly wins & accountability to stay on track",
            "Proven framework used by 5,247 professionals",
            "Land your goal in 6 months, not 2.5 years",
          ].map((item, i) => (
            <motion.li
              key={i}
              animate={{
                x: isHovered ? 3 : 0,
              }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
              className="flex items-start gap-3 text-zinc-200"
            >
              <CheckCircle className="w-5 h-5 text-white shrink-0 mt-0.5" />
              <span className="font-medium">{item}</span>
            </motion.li>
          ))}
        </ul>

        {/* Live stats and urgency */}
        <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
          {/* Member counter */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Success stories</span>
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-white"
              />
              <div className="text-xl font-bold tabular-nums text-white">
                5,247+
              </div>
            </div>
          </div>

          {/* Urgency: spots left */}
          <motion.div
            animate={{
              borderColor: isHovered
                ? ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.4)", "rgba(255,255,255,0.2)"]
                : "rgba(255,255,255,0.2)",
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-3 bg-white/5 border-2 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Spots left this month</span>
              <div className="text-2xl font-bold text-white tabular-nums">
                12
              </div>
            </div>
            <motion.div
              animate={{ opacity: isHovered ? 1 : 0.7 }}
              transition={{ duration: 0.3 }}
              className="mt-2 text-xs text-zinc-500"
            >
              ⚡ Filling fast - don't miss your chance
            </motion.div>
          </motion.div>

          {/* Time to breakthrough */}
          <div className="pt-3">
            <div className="text-zinc-400 text-xs mb-1">Average time to breakthrough</div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-white">6 months</div>
              <motion.div
                animate={{ scale: isHovered ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 0.8, repeat: isHovered ? Infinity : 0 }}
                className="px-2 py-1 bg-white/10 rounded-full text-sm text-white font-semibold"
              >
                -75% time
              </motion.div>
            </div>
            <motion.p
              animate={{ opacity: isHovered ? 1 : 0 }}
              className="text-xs text-zinc-400 mt-2"
            >
              Start today, celebrate by summer
            </motion.p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Timeline Item
function TimelineItem({ week, title, description, isActive }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      variants={childFade}
      className="flex gap-4 group relative"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Hover glow effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: isHovered ? 0.15 : 0,
          scale: isHovered ? 1.5 : 0.8,
        }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-white rounded-2xl blur-2xl pointer-events-none -z-10"
      />

      <div className="flex flex-col items-center">
        <motion.div
          whileHover={{ scale: 1.2, rotate: 360 }}
          animate={{
            boxShadow: isHovered
              ? "0 0 30px rgba(255,255,255,0.3)"
              : "0 0 0px rgba(255,255,255,0)",
          }}
          transition={{ duration: 0.5 }}
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all relative overflow-hidden ${
            isActive
              ? "bg-white border-white text-black"
              : "bg-zinc-900 border-zinc-700 text-zinc-400 group-hover:border-white group-hover:text-white"
          }`}
        >
          {/* Animated background on hover */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: isHovered ? 2 : 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-white/10 rounded-full"
          />
          <span className="relative z-10">{week}</span>
        </motion.div>
        {week !== "6m" && (
          <motion.div
            animate={{
              height: isHovered ? "80px" : "64px",
              background: isHovered
                ? "linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)"
                : "linear-gradient(to bottom, rgba(113,113,122,1), transparent)",
            }}
            transition={{ duration: 0.3 }}
            className="w-0.5"
          />
        )}
      </div>
      
      <motion.div
        className="flex-1 pb-8 relative"
        animate={{
          x: isHovered ? 8 : 0,
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated border on hover */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="absolute left-0 top-0 h-0.5 bg-gradient-to-r from-white to-transparent origin-left"
          style={{ width: "100%" }}
        />

        <motion.h4
          animate={{
            color: isHovered ? "#ffffff" : "#fafafa",
            scale: isHovered ? 1.02 : 1,
          }}
          transition={{ duration: 0.3 }}
          className="text-lg font-semibold mb-1 origin-left"
        >
          {title}
        </motion.h4>
        
        <motion.p
          animate={{
            color: isHovered ? "#d4d4d8" : "#a1a1aa",
          }}
          transition={{ duration: 0.3 }}
          className="text-sm"
        >
          {description}
        </motion.p>

        {/* Progress indicator on hover */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            y: isHovered ? 0 : 10,
          }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-3 flex items-center gap-2"
        >
          <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: isHovered ? "100%" : "0%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-white rounded-full"
            />
          </div>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="text-xs text-white font-semibold whitespace-nowrap"
          >
            Learn more →
          </motion.span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  const successStories = [
    {
      quote: "I was stuck at the same level for 3 years. After Careera, I got promoted in 4 months and doubled my salary. Wish I'd started sooner.",
      name: "Sarah Chen",
      role: "Senior Product Manager",
      achievement: "+74% salary",
      beforeSalary: "95K",
      afterSalary: "165K",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
      timeAgo: "3 weeks ago",
    },
    {
      quote: "Every year I told myself 'next year I'll make the move.' Finally did it with Careera. Now I'm living the career I only dreamed about.",
      name: "Marcus Johnson",
      role: "Engineering Director",
      achievement: "+100% salary",
      beforeSalary: "140K",
      afterSalary: "280K",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
      timeAgo: "1 month ago",
    },
    {
      quote: "I watched my peers switch to tech for years while I stayed 'safe' in consulting. Biggest regret: not starting sooner. Careera made the impossible happen in 6 months.",
      name: "Priya Patel",
      role: "Tech Lead @ FAANG",
      achievement: "+123% salary",
      beforeSalary: "110K",
      afterSalary: "245K",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces",
      timeAgo: "2 months ago",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.05, 0.03],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-white to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.02, 0.04, 0.02],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-white to-transparent blur-3xl"
        />
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <Navbar />
      <LiveActivity />

      {/* Hero Section - Enhanced */}
      <motion.section
        ref={heroRef}
        style={{ opacity, scale }}
        className="pt-32 pb-20 px-6 relative"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.div
                variants={childFade}
                className="flex flex-wrap items-center gap-3 mb-8"
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-white/10 to-transparent border border-white/20 rounded-full px-4 py-2"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span className="text-sm bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent font-semibold">
                    5,247 Careers Transformed
                  </span>
                </motion.div>
                <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-white"
                  />
                  <span className="text-xs text-zinc-400 font-medium">
                    328 active this week
                  </span>
                </div>
              </motion.div>

              <motion.h1
                variants={childFade}
                className="text-5xl md:text-7xl font-bold leading-[1.1] mb-6"
              >
                <span className="bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
                  Your Next Career Leap
                </span>
                <br />
                <span className="text-white">
                  Starts in 5 Minutes
                </span>
              </motion.h1>

              <motion.p
                variants={childFade}
                className="text-xl text-zinc-400 max-w-xl leading-relaxed mb-6"
              >
                While others spend years stuck at the same level, you could be <span className="text-white font-semibold">promoted in 6 months</span>. Get the exact roadmap top performers use—backed by <span className="text-white font-semibold">5,000+ success stories</span>.
              </motion.p>

              <motion.div
                variants={childFade}
                className="inline-flex items-center gap-2 text-sm text-zinc-500 mb-8"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Avg. $167K salary increase • 94% success rate • 6-month timeline</span>
              </motion.div>

              <motion.div
                variants={childFade}
                className="flex flex-wrap gap-6 mb-8"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-white" />
                  <span className="text-zinc-300 text-sm">No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-white" />
                  <span className="text-zinc-300 text-sm">5-minute assessment</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-white" />
                  <span className="text-zinc-300 text-sm">Instant results</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column - Questionnaire Widget */}
            <div className="lg:sticky lg:top-24">
              <QuestionnaireWidget />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Live Stats Banner */}
      <section className="py-12 px-6 border-y border-zinc-800/50 bg-gradient-to-r from-zinc-900/50 to-transparent backdrop-blur-sm">
        <motion.div
          className="max-w-7xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 5247, label: "Careers Transformed", suffix: "+" },
              { value: 328, label: "Active This Week", suffix: "" },
              { value: 94, label: "Success Rate", suffix: "%" },
              { value: 167, label: "Avg. Salary Increase", suffix: "K" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={childFade}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} prefix={stat.value > 100 && stat.suffix === "K" ? "$" : ""} />
                </div>
                <div className="text-sm text-zinc-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* The Problem (Visual Comparison) */}
      <section className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-6"
            >
              <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-zinc-400">
                <span className="text-white font-semibold">73%</span> of professionals feel stuck in their career
              </div>
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Stop Watching Others Get{" "}
              <span className="italic">
                Your Dream Job
              </span>
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              While you're waiting for "the right time," <span className="text-white font-semibold">328 professionals started their transformation this week</span>. The gap between you and your goals is growing every day you delay.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {/* Without Careera - PAINFUL */}
            <OldWayCard />

            {/* With Careera - ATTRACTIVE */}
            <NewWayCard />
          </motion.div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-32 px-6 bg-gradient-to-b from-transparent via-zinc-900/30 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6"
            >
              <Star className="w-4 h-4 text-white fill-white" />
              <span className="text-sm text-white font-semibold">Real Results from Real People</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              They Were Exactly Where You Are Now
            </h2>
            <p className="text-xl text-zinc-400">
              <span className="text-white font-semibold">6 months ago</span>, they felt stuck. Today, they're living your dream career.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            {successStories.map((story, i) => (
              <SuccessStory key={i} {...story} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Results Visualization */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div className="inline-block mb-6 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm">
              <span className="text-zinc-400">What happens when </span>
              <span className="text-white font-semibold">5,247 professionals</span>
              <span className="text-zinc-400"> use Careera</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              You're One Decision Away From This
            </h2>
            <p className="text-xl text-zinc-400">
              Real results. Real timeline. Real people who took action.
            </p>
          </motion.div>

          {/* Circular Progress Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
            <CircularProgress percentage={94} value="94%" label="Success Rate" />
            <CircularProgress percentage={85} value="3.2x" label="Salary Growth" />
            <CircularProgress percentage={78} value="6mo" label="Avg. Timeline" />
          </div>

          {/* Detailed Results Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            {[
              {
                icon: DollarSign,
                value: "3.2x",
                label: "Average Salary Increase",
                detail: "85% above market average",
                bars: [85, 70, 92],
              },
              {
                icon: Target,
                value: "94%",
                label: "Achieve Career Goals",
                detail: "Within 12 months",
                bars: [94, 88, 96],
              },
              {
                icon: Trophy,
                value: "6mo",
                label: "Time to Promotion",
                detail: "2x faster than industry avg",
                bars: [78, 82, 75],
              },
            ].map((result, i) => (
              <motion.div
                key={result.label}
                variants={childFade}
                whileHover={{ y: -8 }}
                className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-all group"
              >
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-600 rounded-2xl mb-6 shadow-lg group-hover:shadow-white/10"
                >
                  <result.icon className="w-8 h-8 text-white" />
                </motion.div>

                <div className="text-5xl font-bold mb-2 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                  {result.value}
                </div>
                <div className="text-white font-semibold mb-2">{result.label}</div>
                <div className="text-sm text-zinc-500 mb-6">{result.detail}</div>

                {/* Mini Bar Chart */}
                <div className="space-y-2">
                  {result.bars.map((percentage, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-white to-zinc-400 rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${percentage}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.2 + idx * 0.1 }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500 w-8">{percentage}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Your Journey Timeline */}
      <section className="py-32 px-6 bg-gradient-to-b from-zinc-900/30 to-transparent">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div className="inline-block mb-6 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm">
              <span className="text-zinc-400">The exact </span>
              <span className="text-white font-semibold">6-month blueprint</span>
              <span className="text-zinc-400"> proven by 5,247 success stories</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              From Stuck to Success
            </h2>
            <p className="text-xl text-zinc-400">
              This is how <span className="text-white font-semibold">94% of our members</span> go from feeling lost to achieving their dream role
            </p>
          </motion.div>

          <motion.div
            className="relative"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <TimelineItem
              week="W1"
              title="Foundation & Discovery"
              description="Complete career assessment, identify gaps, and define your dream role"
              isActive={true}
            />
            <TimelineItem
              week="W3"
              title="Strategic Planning"
              description="Receive personalized roadmap with clear milestones and action items"
            />
            <TimelineItem
              week="M2"
              title="Skill Development"
              description="Build critical competencies with curated resources and practice"
            />
            <TimelineItem
              week="M3"
              title="Network Expansion"
              description="Connect with industry leaders and expand your professional circle"
            />
            <TimelineItem
              week="M5"
              title="Personal Branding"
              description="Establish your authority and visibility in your target field"
            />
            <TimelineItem
              week="6m"
              title="Achievement Unlocked"
              description="Land your dream role, get promoted, or launch your venture"
            />
          </motion.div>

          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-3 bg-white text-black px-10 py-5 rounded-full text-lg font-semibold shadow-2xl shadow-white/10 hover:shadow-white/20 hover:bg-zinc-100 transition-all group"
            >
              Start Your Journey Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Cost of Waiting */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <CostOfWaiting />
        </div>
      </section>

      {/* Why Our Methodology Works */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Science-Backed Career Acceleration
            </h2>
            <p className="text-xl text-zinc-400">
              Our methodology is built on research and proven by results
            </p>
          </motion.div>

          <motion.div
            className="space-y-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            {[
              {
                icon: DollarSign,
                title: "Data-Driven Insights",
                description:
                  "Built on years of career development research and analysis of 50,000+ successful career transitions to identify exact patterns that lead to breakthrough success.",
              },
              {
                icon: Compass,
                title: "Hyper-Personalized Strategy",
                description:
                  "Every roadmap is uniquely crafted using AI and expert review based on your industry, experience level, goals, and learning style. No generic advice—ever.",
              },
              {
                icon: Award,
                title: "Verified Mentor Network",
                description:
                  "Each mentor has achieved significant career success (director+ level, $200K+ comp) and has a proven track record of helping others reach their goals.",
              },
              {
                icon: ShieldCheck,
                title: "Accountability System",
                description:
                  "Weekly check-ins, milestone tracking, and real-time strategy adjustments ensure you don't just have a plan—you execute it with consistent support.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                variants={childFade}
                whileHover={{ x: 8 }}
                className="flex items-start gap-6 bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-2xl p-8 hover:border-zinc-600 transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="flex-shrink-0 flex items-center justify-center w-16 h-16 bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-600 rounded-2xl shadow-lg relative z-10"
                >
                  <item.icon className="w-8 h-8 text-white" />
                </motion.div>
                <div className="relative z-10 flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    {item.title}
                    <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  </h3>
                  <p className="text-zinc-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-40 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent" />
        
        <motion.div
          className="max-w-4xl mx-auto text-center relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.div variants={childFade} className="mb-8 flex flex-col items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center gap-3 px-5 py-2 bg-white/5 border border-white/10 rounded-full"
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-white"
              />
              <span className="text-sm text-white font-semibold">Only 12 spots left this month</span>
            </motion.div>
            <CountdownTimer />
          </motion.div>

          <motion.h2
            variants={childFade}
            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.1]"
          >
            Don't Let Another Month
            <br />
            <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Pass You By
            </span>
          </motion.h2>
          
          <motion.p
            variants={childFade}
            className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Right now, <span className="text-white font-semibold">328 people</span> are taking action this week. Your colleagues are moving ahead. Your dream role is being filled. <span className="text-white font-semibold">How much longer will you wait?</span>
          </motion.p>

          <motion.div
            variants={childFade}
            className="flex flex-wrap items-center justify-center gap-4 text-sm mb-12"
          >
            <div className="px-3 py-1 bg-white/5 rounded-full text-zinc-400">
              ⚡ <span className="text-white font-semibold">Sarah</span> booked 2 min ago
            </div>
            <div className="px-3 py-1 bg-white/5 rounded-full text-zinc-400">
              ⚡ <span className="text-white font-semibold">Marcus</span> just completed assessment
            </div>
            <div className="px-3 py-1 bg-white/5 rounded-full text-zinc-400">
              ⚡ <span className="text-white font-semibold">Jennifer</span> unlocked roadmap
            </div>
          </motion.div>

          <motion.div variants={childFade} className="flex flex-col items-center gap-6">
            <motion.button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  "0 20px 60px rgba(255,255,255,0.1)",
                  "0 20px 80px rgba(255,255,255,0.2)",
                  "0 20px 60px rgba(255,255,255,0.1)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center gap-3 bg-white text-black px-12 py-6 rounded-full text-lg font-semibold shadow-2xl hover:bg-zinc-100 transition-all group cursor-pointer"
            >
              Claim Your Spot Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-white" />
                Free assessment
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-white" />
                No credit card
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-white" />
                Instant results
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={childFade}
            className="mt-12 flex items-center justify-center gap-8 text-sm text-zinc-600"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[
                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=faces",
                ].map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] object-cover"
                  />
                ))}
              </div>
              <span>328 started this week</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-12 px-6 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="mb-3">
                <Logo size="default" className="justify-center md:justify-start" />
              </div>
              <p className="text-sm text-zinc-500">
                Transforming careers, one roadmap at a time.
              </p>
            </div>
            <div className="text-sm text-zinc-500">
              &copy; 2026 Careera. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
