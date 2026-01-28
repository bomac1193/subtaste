/**
 * Superfan Conversion Probability (SCP) Types
 *
 * Defines signal types, weights, and interfaces for the SCP calculation system.
 * SCP predicts which listeners will become superfans based on constellation
 * alignment and depth signals.
 */

import { ConstellationId } from '../constellations/types';

// =============================================================================
// Signal Types
// =============================================================================

/**
 * SignalType enum matches Prisma schema definition.
 * These are the depth signals that indicate superfan potential.
 */
export type SignalType =
  | 'SAVE'
  | 'REPLAY'
  | 'CATALOG_DEEP_DIVE'
  | 'UNPROMPTED_RETURN'
  | 'SHARE'
  | 'PLAYLIST_ADD'
  | 'PROFILE_VISIT'
  | 'MERCH_CLICK'
  | 'CONCERT_INTEREST';

/**
 * SessionSource enum matches Prisma schema definition.
 */
export type SessionSource = 'ORGANIC' | 'ALGORITHMIC' | 'SOCIAL' | 'EXTERNAL';

// =============================================================================
// Signal Weights
// =============================================================================

/**
 * Signal weight constants.
 * Higher weights indicate stronger superfan potential.
 *
 * Weights are based on behavioral research showing which actions
 * most strongly correlate with long-term fan engagement.
 */
export const SIGNAL_WEIGHTS: Record<SignalType, number> = {
  // Highest value signals - direct monetization or attendance intent
  UNPROMPTED_RETURN: 4.0,    // Coming back on their own is the strongest signal
  CONCERT_INTEREST: 4.0,     // Willing to attend in person
  MERCH_CLICK: 3.5,          // Considering financial support

  // High value signals - active curation and sharing
  SAVE: 3.0,                 // Active curation of content
  SHARE: 3.0,                // Social endorsement
  PLAYLIST_ADD: 2.5,         // Integration into personal collection

  // Medium value signals - exploration and engagement
  CATALOG_DEEP_DIVE: 2.0,    // Deep exploration of catalog
  PROFILE_VISIT: 1.5,        // Interest in creator identity
  REPLAY: 1.0,               // Repeated consumption
};

/**
 * Time decay constants for signal weighting.
 * Signals lose value over time; recent signals matter more.
 */
export const TIME_DECAY = {
  HALF_LIFE_DAYS: 30,        // Signal loses half its value after 30 days
  MIN_WEIGHT: 0.1,           // Minimum weight after decay (never fully zero)
};

/**
 * SCP calculation thresholds.
 */
export const SCP_THRESHOLDS = {
  SUPERFAN: 75,              // Score >= 75 is a superfan
  HIGH_POTENTIAL: 50,        // Score 50-74 is high potential
  MODERATE: 25,              // Score 25-49 is moderate potential
  LOW: 0,                    // Score < 25 is low potential
};

/**
 * Minimum requirements for reliable SCP calculation.
 */
export const SCP_REQUIREMENTS = {
  MIN_SIGNALS: 3,            // Need at least 3 signals
  MIN_SESSIONS: 2,           // Need at least 2 sessions
  STALE_DAYS: 7,             // Recalculate if older than 7 days
};

// =============================================================================
// Input/Output Interfaces
// =============================================================================

/**
 * Constellation weights map for a user or creator.
 */
export type ConstellationWeights = { [K in ConstellationId]?: number };

/**
 * Input for SCP calculation.
 */
export interface SCPCalculationInput {
  userId: string;
  creatorId: string;

  // User's constellation blend weights
  userConstellationWeights: ConstellationWeights;

  // Creator's constellation weights
  creatorConstellationWeights: ConstellationWeights;

  // Depth signals for this user-creator pair
  depthSignals: DepthSignalInput[];

  // Sessions for this user-creator pair
  sessions: SessionInput[];
}

/**
 * Depth signal input for calculation.
 */
export interface DepthSignalInput {
  type: SignalType;
  weight: number;
  createdAt: Date;
  contentId?: string;
}

/**
 * Session input for return pattern calculation.
 */
export interface SessionInput {
  source: SessionSource;
  startedAt: Date;
  durationMs?: number;
}

/**
 * Output from SCP calculation.
 */
export interface SCPCalculationOutput {
  // Component scores (0-100)
  tasteCoherence: number;
  depthSignalScore: number;
  returnPatternScore: number;

  // Combined SCP score (0-100)
  scpScore: number;

  // Metadata
  signalCount: number;
  lastSignalAt: Date | null;

  // Classification
  classification: 'superfan' | 'high_potential' | 'moderate' | 'low';

  // Breakdown for UI
  breakdown: SCPBreakdown;
}

/**
 * Detailed breakdown of SCP components for UI display.
 */
export interface SCPBreakdown {
  tasteCoherence: {
    score: number;
    matchingConstellations: ConstellationId[];
    overlapPercentage: number;
  };

  depthSignals: {
    score: number;
    totalSignals: number;
    strongSignals: number; // Signals with weight >= 3.0
    recentSignals: number; // Signals in last 7 days
    signalsByType: Partial<Record<SignalType, number>>;
  };

  returnPattern: {
    score: number;
    organicReturns: number;
    algorithmicReturns: number;
    organicRatio: number;
    avgDaysBetweenReturns: number | null;
  };
}

/**
 * Creator dashboard stats.
 */
export interface CreatorDashboardStats {
  creatorId: string;
  totalListeners: number;
  superfanCount: number;
  avgSCP: number;

  // Distribution of listeners by SCP classification
  distribution: {
    superfan: number;
    highPotential: number;
    moderate: number;
    low: number;
  };

  // Top signals received
  topSignalTypes: Array<{
    type: SignalType;
    count: number;
    percentage: number;
  }>;

  // Trending listeners (SCP increasing)
  trendingUp: number;
  trendingDown: number;
}

/**
 * Signal tracking payload for API.
 */
export interface TrackSignalPayload {
  userId: string;
  creatorId: string;
  type: SignalType;
  contentId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Session tracking payload for API.
 */
export interface TrackSessionPayload {
  userId: string;
  creatorId?: string;
  source: SessionSource;
  startedAt?: Date;
}
