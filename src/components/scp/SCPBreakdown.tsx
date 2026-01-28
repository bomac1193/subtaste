'use client';

import { motion } from 'framer-motion';
import { Sparkles, Activity, RotateCcw, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SCPBreakdown as SCPBreakdownType, SignalType } from '@/lib/scp/types';

interface SCPBreakdownProps {
  breakdown: SCPBreakdownType;
  className?: string;
}

const SIGNAL_TYPE_LABELS: Record<SignalType, string> = {
  SAVE: 'Saves',
  REPLAY: 'Replays',
  CATALOG_DEEP_DIVE: 'Deep Dives',
  UNPROMPTED_RETURN: 'Organic Returns',
  SHARE: 'Shares',
  PLAYLIST_ADD: 'Playlist Adds',
  PROFILE_VISIT: 'Profile Visits',
  MERCH_CLICK: 'Merch Clicks',
  CONCERT_INTEREST: 'Concert Interest',
};

export function SCPBreakdown({ breakdown, className }: SCPBreakdownProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Taste Coherence */}
      <ComponentCard
        icon={<Sparkles className="w-4 h-4" />}
        title="Taste Coherence"
        score={breakdown.tasteCoherence.score}
        color="violet"
        delay={0}
      >
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-neutral-400">
            <span>Constellation Overlap</span>
            <span className="text-white">{breakdown.tasteCoherence.overlapPercentage}%</span>
          </div>
          {breakdown.tasteCoherence.matchingConstellations.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {breakdown.tasteCoherence.matchingConstellations.slice(0, 3).map((id) => (
                <span
                  key={id}
                  className="px-2 py-0.5 text-xs bg-violet-500/20 text-violet-400 rounded"
                >
                  {id}
                </span>
              ))}
              {breakdown.tasteCoherence.matchingConstellations.length > 3 && (
                <span className="px-2 py-0.5 text-xs text-neutral-500">
                  +{breakdown.tasteCoherence.matchingConstellations.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </ComponentCard>

      {/* Depth Signals */}
      <ComponentCard
        icon={<Activity className="w-4 h-4" />}
        title="Depth Signals"
        score={breakdown.depthSignals.score}
        color="fuchsia"
        delay={0.1}
      >
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between text-neutral-400">
              <span>Total</span>
              <span className="text-white">{breakdown.depthSignals.totalSignals}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Strong</span>
              <span className="text-fuchsia-400">{breakdown.depthSignals.strongSignals}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Recent (7d)</span>
              <span className="text-white">{breakdown.depthSignals.recentSignals}</span>
            </div>
          </div>

          {Object.keys(breakdown.depthSignals.signalsByType).length > 0 && (
            <div className="pt-2 border-t border-neutral-800">
              <p className="text-xs text-neutral-500 mb-2">Signal Types</p>
              <div className="space-y-1">
                {Object.entries(breakdown.depthSignals.signalsByType)
                  .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
                  .slice(0, 3)
                  .map(([type, count]) => (
                    <div key={type} className="flex justify-between text-xs">
                      <span className="text-neutral-400">
                        {SIGNAL_TYPE_LABELS[type as SignalType] ?? type}
                      </span>
                      <span className="text-neutral-300">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </ComponentCard>

      {/* Return Pattern */}
      <ComponentCard
        icon={<RotateCcw className="w-4 h-4" />}
        title="Return Pattern"
        score={breakdown.returnPattern.score}
        color="pink"
        delay={0.2}
      >
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-neutral-400">
            <span>Organic Ratio</span>
            <span className="text-white">
              {Math.round(breakdown.returnPattern.organicRatio * 100)}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between text-neutral-400">
              <span>Organic</span>
              <span className="text-pink-400">{breakdown.returnPattern.organicReturns}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Algorithmic</span>
              <span className="text-neutral-300">{breakdown.returnPattern.algorithmicReturns}</span>
            </div>
          </div>
          {breakdown.returnPattern.avgDaysBetweenReturns !== null && (
            <div className="flex justify-between text-neutral-400">
              <span>Avg Days Between</span>
              <span className="text-white">{breakdown.returnPattern.avgDaysBetweenReturns}</span>
            </div>
          )}
        </div>
      </ComponentCard>
    </div>
  );
}

interface ComponentCardProps {
  icon: React.ReactNode;
  title: string;
  score: number;
  color: 'violet' | 'fuchsia' | 'pink';
  delay: number;
  children: React.ReactNode;
}

function ComponentCard({ icon, title, score, color, delay, children }: ComponentCardProps) {
  const colorClasses = {
    violet: {
      icon: 'text-violet-400',
      bar: 'bg-violet-500',
      glow: 'shadow-violet-500/20',
    },
    fuchsia: {
      icon: 'text-fuchsia-400',
      bar: 'bg-fuchsia-500',
      glow: 'shadow-fuchsia-500/20',
    },
    pink: {
      icon: 'text-pink-400',
      bar: 'bg-pink-500',
      glow: 'shadow-pink-500/20',
    },
  };

  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        'bg-neutral-900/50 border border-neutral-800 rounded-xl p-4',
        'shadow-lg',
        colors.glow
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={colors.icon}>{icon}</div>
          <span className="text-sm font-medium text-neutral-200">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">{score}</span>
          <span className="text-xs text-neutral-500">/100</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-3">
        <motion.div
          className={cn('h-full rounded-full', colors.bar)}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ delay: delay + 0.2, duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Content */}
      {children}
    </motion.div>
  );
}

export default SCPBreakdown;
