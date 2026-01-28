'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SCPGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  classification?: 'superfan' | 'high_potential' | 'moderate' | 'low';
  animate?: boolean;
}

const SIZE_CONFIG = {
  sm: { width: 80, strokeWidth: 6, fontSize: 'text-lg' },
  md: { width: 120, strokeWidth: 8, fontSize: 'text-2xl' },
  lg: { width: 160, strokeWidth: 10, fontSize: 'text-4xl' },
};

const CLASSIFICATION_COLORS = {
  superfan: {
    gradient: ['#8b5cf6', '#d946ef'], // violet to fuchsia
    glow: 'rgba(139, 92, 246, 0.4)',
  },
  high_potential: {
    gradient: ['#d946ef', '#f472b6'], // fuchsia to pink
    glow: 'rgba(217, 70, 239, 0.4)',
  },
  moderate: {
    gradient: ['#f59e0b', '#fbbf24'], // amber
    glow: 'rgba(245, 158, 11, 0.4)',
  },
  low: {
    gradient: ['#6b7280', '#9ca3af'], // gray
    glow: 'rgba(107, 114, 128, 0.3)',
  },
};

const CLASSIFICATION_LABELS = {
  superfan: 'Superfan',
  high_potential: 'High Potential',
  moderate: 'Moderate',
  low: 'Casual',
};

export function SCPGauge({
  score,
  size = 'md',
  showLabel = true,
  classification,
  animate = true,
}: SCPGaugeProps) {
  const config = SIZE_CONFIG[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Determine classification if not provided
  const classificationKey =
    classification ??
    (score >= 75
      ? 'superfan'
      : score >= 50
      ? 'high_potential'
      : score >= 25
      ? 'moderate'
      : 'low');

  const colors = CLASSIFICATION_COLORS[classificationKey];
  const gradientId = `scp-gradient-${Math.random().toString(36).substr(2, 9)}`;

  // Calculate stroke offset (0 = full, circumference = empty)
  const progress = Math.min(Math.max(score, 0), 100) / 100;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative"
        style={{
          width: config.width,
          height: config.width,
          filter: `drop-shadow(0 0 ${size === 'lg' ? '20px' : '12px'} ${colors.glow})`,
        }}
      >
        <svg
          width={config.width}
          height={config.width}
          viewBox={`0 0 ${config.width} ${config.width}`}
          className="transform -rotate-90"
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.gradient[0]} />
              <stop offset="100%" stopColor={colors.gradient[1]} />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-neutral-800/50"
          />

          {/* Progress circle */}
          <motion.circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={animate ? { strokeDashoffset: circumference } : { strokeDashoffset }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>

        {/* Score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={cn(config.fontSize, 'font-bold text-white')}
            initial={animate ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            {score}
          </motion.span>
          {size !== 'sm' && (
            <span className="text-xs text-neutral-500 uppercase tracking-wider">SCP</span>
          )}
        </div>
      </div>

      {showLabel && (
        <motion.div
          initial={animate ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <span
            className={cn(
              'text-sm font-medium px-3 py-1 rounded-full',
              classificationKey === 'superfan' && 'bg-violet-500/20 text-violet-400',
              classificationKey === 'high_potential' && 'bg-fuchsia-500/20 text-fuchsia-400',
              classificationKey === 'moderate' && 'bg-amber-500/20 text-amber-400',
              classificationKey === 'low' && 'bg-neutral-500/20 text-neutral-400'
            )}
          >
            {CLASSIFICATION_LABELS[classificationKey]}
          </span>
        </motion.div>
      )}
    </div>
  );
}

export default SCPGauge;
