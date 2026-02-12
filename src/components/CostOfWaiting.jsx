import { motion } from "framer-motion";
import { TrendingDown, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function CostOfWaiting() {
  const [months, setMonths] = useState(0);
  const monthlyLoss = 5420; // Average monthly opportunity cost
  const totalLoss = months * monthlyLoss;

  useEffect(() => {
    const interval = setInterval(() => {
      setMonths((prev) => (prev >= 12 ? 0 : prev + 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-zinc-900 to-black border-2 border-zinc-800 rounded-3xl p-10 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">The Cost of Waiting</h3>
            <p className="text-sm text-zinc-500">Real-time opportunity cost calculator</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="mb-4">
              <div className="text-sm text-zinc-500 mb-2">Months waiting</div>
              <div className="flex items-baseline gap-2">
                <motion.span
                  key={months}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl font-bold text-white tabular-nums"
                >
                  {months}
                </motion.span>
                <span className="text-2xl text-zinc-600">months</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                <span className="text-sm text-zinc-400">Missed salary increase</span>
                <span className="text-white font-semibold tabular-nums">
                  ${(totalLoss).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                <span className="text-sm text-zinc-400">Opportunities passed</span>
                <span className="text-white font-semibold tabular-nums">
                  {Math.floor(months * 2.3)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                <span className="text-sm text-zinc-400">Time to next level</span>
                <span className="text-white font-semibold">
                  +{months} months
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="mb-6">
              <TrendingDown className="w-8 h-8 text-zinc-400 mb-3" />
              <p className="text-zinc-400 leading-relaxed mb-4">
                Every month you delay is <span className="text-white font-semibold">${monthlyLoss.toLocaleString()} in lost potential earnings</span>, missed networking opportunities, and delayed career progression.
              </p>
              <p className="text-zinc-500 text-sm">
                Meanwhile, <span className="text-white font-semibold">328 professionals</span> started their transformation this week. The gap widens every day.
              </p>
            </div>

            <div className="pt-6 border-t border-zinc-800">
              <div className="text-xs text-zinc-500 mb-2">Average time saved with Careera</div>
              <div className="text-3xl font-bold text-white">18 months</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
