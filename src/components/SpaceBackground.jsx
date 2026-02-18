import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Floating stars background
export function SpaceBackground() {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    // Generate random stars
    const newStars = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    }));
    setStars(newStars);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute bg-white rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
          }}
        />
      ))}
    </div>
  );
}

// Orbiting elements (like planets/moons)
export function OrbitingElements() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
      {/* Large orbit */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <div className="relative w-full h-full">
          <motion.div
            className="absolute top-0 left-1/2 w-4 h-4 bg-white rounded-full -ml-2"
            animate={{
              boxShadow: [
                "0 0 10px rgba(255,255,255,0.5)",
                "0 0 20px rgba(255,255,255,0.8)",
                "0 0 10px rgba(255,255,255,0.5)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* Medium orbit */}
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-64 h-64"
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <div className="relative w-full h-full">
          <motion.div
            className="absolute top-0 left-1/2 w-3 h-3 bg-white rounded-full -ml-1.5"
            animate={{
              boxShadow: [
                "0 0 8px rgba(255,255,255,0.4)",
                "0 0 16px rgba(255,255,255,0.7)",
                "0 0 8px rgba(255,255,255,0.4)",
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* Small orbit */}
      <motion.div
        className="absolute top-2/3 left-1/2 w-48 h-48"
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        <div className="relative w-full h-full">
          <motion.div className="absolute top-0 left-1/2 w-2 h-2 bg-white rounded-full -ml-1" />
        </div>
      </motion.div>
    </div>
  );
}

// Shooting stars
export function ShootingStars() {
  const [shootingStars, setShootingStars] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newStar = {
        id: Date.now(),
        x: Math.random() * 100,
        y: Math.random() * 50,
        rotation: Math.random() * 60 - 30,
      };

      setShootingStars((prev) => [...prev, newStar]);

      setTimeout(() => {
        setShootingStars((prev) => prev.filter((s) => s.id !== newStar.id));
      }, 2000);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {shootingStars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            rotate: `${star.rotation}deg`,
          }}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            x: [0, 200],
            y: [0, 100],
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <div className="w-1 h-1 bg-white rounded-full">
            <div className="w-20 h-[1px] bg-gradient-to-r from-white to-transparent -ml-20" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Gradient orbs (nebula-like)
export function GradientOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Top right orb */}
      <motion.div
        className="absolute -top-48 -right-48 w-96 h-96 rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      {/* Bottom left orb */}
      <motion.div
        className="absolute -bottom-48 -left-48 w-96 h-96 rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity, delay: 1 }}
      />

      {/* Center orb */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.05, 0.1, 0.05],
        }}
        transition={{ duration: 12, repeat: Infinity, delay: 2 }}
      />
    </div>
  );
}
