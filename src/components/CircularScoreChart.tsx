import React from 'react';
import { motion } from 'motion/react';

interface CircularScoreChartProps {
  score: number;
}

export function CircularScoreChart({ score }: CircularScoreChartProps) {
  const size = 260;
  const strokeWidth = 20;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate percentage (0 to 1) based on score (0 to 1000)
  const percentage = Math.min(Math.max(score, 0), 1000) / 1000;
  const strokeDashoffset = circumference - percentage * circumference;

  // Determine color based on score
  const colorClass = score >= 800 ? "text-[#17A34A]" : 
                     score >= 500 ? "text-[#2563EB]" : "text-[#DC2626]";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          className="text-[#F1F3F5] stroke-current"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress ring */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          className={colorClass + " stroke-current drop-shadow-sm"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#6B7280] mb-1">Nota Final</span>
        <motion.span 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className={"text-6xl font-black font-mono tracking-tighter " + colorClass}
        >
          {score}
        </motion.span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#D1D5DB] mt-1">/ 1000</span>
      </div>
    </div>
  );
}
