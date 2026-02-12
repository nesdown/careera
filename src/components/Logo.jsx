import { motion } from "framer-motion";

export default function Logo({ className = "", size = "default" }) {
  const sizes = {
    small: { width: 32, height: 32, orbitRadius: 10, moonRadius: 3, moonOffset: 10 },
    default: { width: 40, height: 40, orbitRadius: 13, moonRadius: 4, moonOffset: 13 },
    large: { width: 48, height: 48, orbitRadius: 16, moonRadius: 5, moonOffset: 16 },
  };

  const { width, height, orbitRadius, moonRadius, moonOffset } = sizes[size] || sizes.default;
  const center = width / 2;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <motion.svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {/* Orbit circle */}
        <circle
          cx={center}
          cy={center}
          r={orbitRadius}
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          className="text-white opacity-30"
        />
        
        {/* Moon on orbit */}
        <motion.circle
          cx={center + moonOffset}
          cy={center}
          r={moonRadius}
          fill="currentColor"
          className="text-white"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Glow effect around moon */}
        <motion.circle
          cx={center + moonOffset}
          cy={center}
          r={moonRadius + 2}
          fill="currentColor"
          className="text-white opacity-20"
          initial={{ scale: 1, opacity: 0.2 }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.svg>
      
      <span 
        className="text-xl font-bold text-white tracking-tight"
        style={{ 
          fontFamily: "'Space Grotesk', sans-serif", 
          letterSpacing: '-0.03em',
          fontWeight: 700,
          fontSize: '1.375rem'
        }}
      >
        Careera
      </span>
    </div>
  );
}
