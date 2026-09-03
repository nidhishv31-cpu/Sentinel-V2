import React from 'react';
import { motion } from 'framer-motion';

interface ThreatDial3DProps {
  score: number; // 0 to 100
  label?: string;
  size?: number;
}

export const ThreatDial3D: React.FC<ThreatDial3DProps> = ({
  score = 88,
  label = 'Security Posture Index',
  size = 180,
}) => {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getStatusColor = (val: number) => {
    if (val >= 80) return 'var(--color-primary)';
    if (val >= 60) return 'var(--sev-medium)';
    return 'var(--sev-critical)';
  };

  const currentColor = getStatusColor(score);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        className="relative flex items-center justify-center threed-perspective"
        style={{ width: size, height: size }}
      >
        {/* Ambient 3D background glow */}
        <div
          className="absolute inset-2 rounded-full animate-pulse-glow"
          style={{
            background: `radial-gradient(circle, ${currentColor}40 0%, transparent 70%)`,
          }}
        />

        <svg
          width={size + 40}
          height={size + 40}
          className="absolute transform -rotate-90"
          style={{ top: -20, left: -20 }}
        >
          {/* Track ring */}
          <circle
            cx={size / 2 + 20}
            cy={size / 2 + 20}
            r={radius}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Animated Progress ring */}
          <motion.circle
            cx={size / 2 + 20}
            cy={size / 2 + 20}
            r={radius}
            stroke={currentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            strokeLinecap="round"
            fill="transparent"
            style={{
              filter: `drop-shadow(0 0 12px ${currentColor})`,
            }}
          />
        </svg>

        {/* Center Score Counter */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-4xl font-extrabold font-display tracking-tight text-[var(--color-text-primary)]"
          >
            {score}
          </motion.span>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mt-0.5">
            / 100 Grade A+
          </span>
        </div>
      </div>

      <div className="mt-3 text-center">
        <p className="text-xs font-semibold text-[var(--color-text-secondary)]">{label}</p>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-ping" />
          <span className="text-xs text-[var(--color-text-muted)]">Real-time Defense Shield Active</span>
        </div>
      </div>
    </div>
  );
};