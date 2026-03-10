import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";

// Dense 3-layer star field (far/mid/near)
export function SpaceBackground() {
  const stars = useMemo(() =>
    Array.from({ length: 180 }, (_, i) => {
      const layer = i < 110 ? 0 : i < 155 ? 1 : 2; // 0=far,1=mid,2=near
      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: layer === 0 ? 1 : layer === 1 ? 1.5 : 2.5,
        duration: layer === 0 ? 4 + Math.random() * 5 : layer === 1 ? 2.5 + Math.random() * 3 : 1.5 + Math.random() * 2,
        delay: Math.random() * 9,
        baseOpacity: layer === 0 ? 0.12 + Math.random() * 0.18 : layer === 1 ? 0.3 + Math.random() * 0.25 : 0.55 + Math.random() * 0.35,
        layer,
      };
    }), []
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
          animate={{
            opacity: [star.baseOpacity * 0.3, star.baseOpacity, star.baseOpacity * 0.3],
            scale: star.layer === 2 ? [1, 1.5, 1] : star.layer === 1 ? [1, 1.2, 1] : [1, 1.05, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Orbiting elements — slow graceful arcs
export function OrbitingElements() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Large slow orbit — upper area */}
      <motion.div
        className="absolute top-[15%] left-[20%] w-[520px] h-[520px] opacity-[0.15]"
        animate={{ rotate: 360 }}
        transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
      >
        <div className="relative w-full h-full rounded-full border border-white/5">
          <motion.div
            className="absolute top-0 left-1/2 w-3 h-3 rounded-full bg-white -ml-1.5 -mt-1.5"
            animate={{
              boxShadow: [
                "0 0 6px 1px rgba(255,255,255,0.4)",
                "0 0 16px 3px rgba(255,255,255,0.8)",
                "0 0 6px 1px rgba(255,255,255,0.4)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* Medium counter-orbit — lower right */}
      <motion.div
        className="absolute bottom-[20%] right-[15%] w-80 h-80 opacity-[0.12]"
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      >
        <div className="relative w-full h-full rounded-full border border-white/[0.04]">
          <motion.div
            className="absolute top-0 left-1/2 w-2 h-2 rounded-full bg-white -ml-1 -mt-1"
            animate={{
              boxShadow: [
                "0 0 4px 1px rgba(255,255,255,0.3)",
                "0 0 12px 2px rgba(255,255,255,0.7)",
                "0 0 4px 1px rgba(255,255,255,0.3)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* Small fast orbit — center left */}
      <motion.div
        className="absolute top-[55%] left-[38%] w-48 h-48 opacity-10"
        animate={{ rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        <div className="relative w-full h-full rounded-full border border-white/[0.03]">
          <div className="absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full bg-white -ml-[3px] -mt-[3px]" />
        </div>
      </motion.div>
    </div>
  );
}

// Shooting stars — more frequent, directional
export function ShootingStars() {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const timeouts = [];

    const spawnStar = () => {
      const id = Date.now() + Math.random();
      const length = 70 + Math.random() * 130;
      const dur = 0.7 + Math.random() * 0.7;
      setStars((prev) => [
        ...prev,
        {
          id,
          x: Math.random() * 85,
          y: Math.random() * 55,
          rotation: 20 + Math.random() * 35,
          length,
          dur,
        },
      ]);
      timeouts.push(
        setTimeout(() => setStars((prev) => prev.filter((s) => s.id !== id)), (dur + 0.3) * 1000)
      );
    };

    // First one appears quickly
    timeouts.push(setTimeout(spawnStar, 1200));
    const interval = setInterval(spawnStar, 3000 + Math.random() * 2000);

    return () => {
      clearInterval(interval);
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute"
          style={{ left: `${star.x}%`, top: `${star.y}%`, rotate: `${star.rotation}deg` }}
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: [0, 0.9, 0.6, 0], x: star.length * 2.5 }}
          transition={{ duration: star.dur, ease: "easeOut" }}
        >
          <div className="flex items-center">
            <div
              className="h-px bg-gradient-to-r from-transparent to-white"
              style={{ width: star.length }}
            />
            <div
              className="w-1.5 h-1.5 rounded-full bg-white"
              style={{ boxShadow: "0 0 6px 1px rgba(255,255,255,0.9)", marginLeft: "-3px" }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Gradient nebula orbs — richer, deeper
export function GradientOrbs() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Top-right large nebula */}
      <motion.div
        className="absolute -top-48 -right-48 w-[700px] h-[700px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.015) 40%, transparent 68%)",
        }}
        animate={reducedMotion ? {} : { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Bottom-left nebula */}
      <motion.div
        className="absolute -bottom-48 -left-48 w-[580px] h-[580px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.01) 40%, transparent 68%)",
        }}
        animate={reducedMotion ? {} : { scale: [1, 1.18, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 14, repeat: Infinity, delay: 2.5, ease: "easeInOut" }}
      />

      {/* Deep center nebula */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.018) 0%, transparent 55%)",
        }}
        animate={reducedMotion ? {} : { scale: [1, 1.06, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 18, repeat: Infinity, delay: 5, ease: "easeInOut" }}
      />

      {/* Mid-page accent nebula — hidden on mobile to reduce GPU load */}
      <motion.div
        className="absolute top-[40%] left-[10%] w-[400px] h-[400px] rounded-full hidden sm:block"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 60%)",
        }}
        animate={reducedMotion ? {} : { scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 20, repeat: Infinity, delay: 7, ease: "easeInOut" }}
      />
    </div>
  );
}
