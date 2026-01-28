'use client';

import { motion } from 'framer-motion';
import { Users, Star, TrendingUp, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreatorDashboardStats, SignalType } from '@/lib/scp/types';

interface CreatorDashboardProps {
  creator: {
    id: string;
    name: string;
    slug: string;
    avatarUrl?: string | null;
  };
  stats: CreatorDashboardStats;
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

export function CreatorDashboard({ creator, stats, className }: CreatorDashboardProps) {
  const totalDistribution =
    stats.distribution.superfan +
    stats.distribution.highPotential +
    stats.distribution.moderate +
    stats.distribution.low;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        {creator.avatarUrl ? (
          <img
            src={creator.avatarUrl}
            alt={creator.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-neutral-700"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {creator.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-white">{creator.name}</h2>
          <p className="text-neutral-500">@{creator.slug}</p>
        </div>
      </motion.div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Users className="w-5 h-5" />}
          label="Total Listeners"
          value={stats.totalListeners.toLocaleString()}
          delay={0}
        />
        <MetricCard
          icon={<Star className="w-5 h-5" />}
          label="Superfans"
          value={stats.superfanCount.toLocaleString()}
          highlight
          delay={0.1}
        />
        <MetricCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Avg SCP"
          value={stats.avgSCP.toString()}
          delay={0.2}
        />
        <MetricCard
          icon={<Activity className="w-5 h-5" />}
          label="Conversion Rate"
          value={`${stats.totalListeners > 0 ? Math.round((stats.superfanCount / stats.totalListeners) * 100) : 0}%`}
          delay={0.3}
        />
      </div>

      {/* Audience Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Audience Distribution</h3>

        {/* Stacked bar */}
        <div className="h-8 bg-neutral-800 rounded-full overflow-hidden flex mb-4">
          {stats.distribution.superfan > 0 && (
            <motion.div
              className="bg-violet-500 h-full"
              initial={{ width: 0 }}
              animate={{
                width: `${totalDistribution > 0 ? (stats.distribution.superfan / totalDistribution) * 100 : 0}%`,
              }}
              transition={{ delay: 0.5, duration: 0.5 }}
            />
          )}
          {stats.distribution.highPotential > 0 && (
            <motion.div
              className="bg-fuchsia-500 h-full"
              initial={{ width: 0 }}
              animate={{
                width: `${totalDistribution > 0 ? (stats.distribution.highPotential / totalDistribution) * 100 : 0}%`,
              }}
              transition={{ delay: 0.6, duration: 0.5 }}
            />
          )}
          {stats.distribution.moderate > 0 && (
            <motion.div
              className="bg-amber-500 h-full"
              initial={{ width: 0 }}
              animate={{
                width: `${totalDistribution > 0 ? (stats.distribution.moderate / totalDistribution) * 100 : 0}%`,
              }}
              transition={{ delay: 0.7, duration: 0.5 }}
            />
          )}
          {stats.distribution.low > 0 && (
            <motion.div
              className="bg-neutral-600 h-full"
              initial={{ width: 0 }}
              animate={{
                width: `${totalDistribution > 0 ? (stats.distribution.low / totalDistribution) * 100 : 0}%`,
              }}
              transition={{ delay: 0.8, duration: 0.5 }}
            />
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DistributionLegend
            color="violet"
            label="Superfans"
            count={stats.distribution.superfan}
            percentage={
              totalDistribution > 0
                ? Math.round((stats.distribution.superfan / totalDistribution) * 100)
                : 0
            }
          />
          <DistributionLegend
            color="fuchsia"
            label="High Potential"
            count={stats.distribution.highPotential}
            percentage={
              totalDistribution > 0
                ? Math.round((stats.distribution.highPotential / totalDistribution) * 100)
                : 0
            }
          />
          <DistributionLegend
            color="amber"
            label="Moderate"
            count={stats.distribution.moderate}
            percentage={
              totalDistribution > 0
                ? Math.round((stats.distribution.moderate / totalDistribution) * 100)
                : 0
            }
          />
          <DistributionLegend
            color="gray"
            label="Casual"
            count={stats.distribution.low}
            percentage={
              totalDistribution > 0
                ? Math.round((stats.distribution.low / totalDistribution) * 100)
                : 0
            }
          />
        </div>
      </motion.div>

      {/* Top Signal Types */}
      {stats.topSignalTypes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Top Engagement Signals</h3>

          <div className="space-y-3">
            {stats.topSignalTypes.map((signal, index) => (
              <motion.div
                key={signal.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-neutral-300">
                      {SIGNAL_TYPE_LABELS[signal.type]}
                    </span>
                    <span className="text-sm text-neutral-400">
                      {signal.count} ({signal.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${signal.percentage}%` }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  delay: number;
}

function MetricCard({ icon, label, value, highlight, delay }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className={cn(
        'p-4 rounded-xl border',
        highlight
          ? 'bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/30'
          : 'bg-neutral-900/50 border-neutral-800'
      )}
    >
      <div
        className={cn(
          'mb-2',
          highlight ? 'text-violet-400' : 'text-neutral-400'
        )}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-neutral-500">{label}</p>
    </motion.div>
  );
}

interface DistributionLegendProps {
  color: 'violet' | 'fuchsia' | 'amber' | 'gray';
  label: string;
  count: number;
  percentage: number;
}

function DistributionLegend({ color, label, count, percentage }: DistributionLegendProps) {
  const colorClasses = {
    violet: 'bg-violet-500',
    fuchsia: 'bg-fuchsia-500',
    amber: 'bg-amber-500',
    gray: 'bg-neutral-600',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn('w-3 h-3 rounded-full', colorClasses[color])} />
      <div>
        <p className="text-sm text-neutral-300">{label}</p>
        <p className="text-xs text-neutral-500">
          {count} ({percentage}%)
        </p>
      </div>
    </div>
  );
}

export default CreatorDashboard;
