/**
 * Superfan Conversion Probability (SCP) Calculator
 *
 * Core algorithm that predicts which listeners will become superfans
 * based on three key factors:
 * 1. Taste Coherence - How well user's constellation aligns with creator's
 * 2. Depth Signals - Time-weighted aggregation of engagement signals
 * 3. Return Pattern - Organic return ratio and consistency
 *
 * Formula: SCP = (TasteCoherence × DepthSignals × ReturnPattern)^(1/3) × 100
 */

import { CONSTELLATION_IDS, ConstellationId } from '../constellations/types';
import { clamp } from '../utils';
import {
  SCPCalculationInput,
  SCPCalculationOutput,
  SCPBreakdown,
  ConstellationWeights,
  DepthSignalInput,
  SessionInput,
  SignalType,
  SIGNAL_WEIGHTS,
  TIME_DECAY,
  SCP_THRESHOLDS,
} from './types';

// =============================================================================
// Main SCP Calculation
// =============================================================================

/**
 * Calculate the Superfan Conversion Probability for a user-creator pair.
 *
 * @param input - Calculation inputs including constellation weights, signals, and sessions
 * @returns SCP score and detailed breakdown
 */
export function calculateSCP(input: SCPCalculationInput): SCPCalculationOutput {
  const { userConstellationWeights, creatorConstellationWeights, depthSignals, sessions } = input;

  // Calculate component scores (0-1 scale)
  const tasteCoherenceResult = calculateTasteCoherence(
    userConstellationWeights,
    creatorConstellationWeights
  );

  const depthSignalResult = calculateDepthSignalScore(depthSignals);

  const returnPatternResult = calculateReturnPattern(sessions);

  // Combine using geometric mean (rewards balance across all factors)
  // This ensures a low score in any component significantly impacts overall SCP
  const geometricMean = Math.pow(
    tasteCoherenceResult.normalized *
    depthSignalResult.normalized *
    returnPatternResult.normalized,
    1 / 3
  );

  // Convert to 0-100 scale
  const scpScore = Math.round(clamp(geometricMean * 100, 0, 100));

  // Determine classification
  const classification = classifyScore(scpScore);

  // Find last signal date
  const lastSignalAt = depthSignals.length > 0
    ? depthSignals.reduce((latest, s) =>
        s.createdAt > latest ? s.createdAt : latest, depthSignals[0].createdAt)
    : null;

  // Build breakdown for UI
  const breakdown: SCPBreakdown = {
    tasteCoherence: {
      score: Math.round(tasteCoherenceResult.normalized * 100),
      matchingConstellations: tasteCoherenceResult.matchingConstellations,
      overlapPercentage: Math.round(tasteCoherenceResult.overlapPercentage * 100),
    },
    depthSignals: {
      score: Math.round(depthSignalResult.normalized * 100),
      totalSignals: depthSignals.length,
      strongSignals: depthSignalResult.strongSignals,
      recentSignals: depthSignalResult.recentSignals,
      signalsByType: depthSignalResult.signalsByType,
    },
    returnPattern: {
      score: Math.round(returnPatternResult.normalized * 100),
      organicReturns: returnPatternResult.organicReturns,
      algorithmicReturns: returnPatternResult.algorithmicReturns,
      organicRatio: Math.round(returnPatternResult.organicRatio * 100) / 100,
      avgDaysBetweenReturns: returnPatternResult.avgDaysBetweenReturns,
    },
  };

  return {
    tasteCoherence: breakdown.tasteCoherence.score,
    depthSignalScore: breakdown.depthSignals.score,
    returnPatternScore: breakdown.returnPattern.score,
    scpScore,
    signalCount: depthSignals.length,
    lastSignalAt,
    classification,
    breakdown,
  };
}

// =============================================================================
// Taste Coherence Calculation
// =============================================================================

interface TasteCoherenceResult {
  normalized: number; // 0-1
  matchingConstellations: ConstellationId[];
  overlapPercentage: number; // 0-1
}

/**
 * Calculate taste coherence using cosine similarity of constellation weights.
 *
 * Higher similarity means the user's taste profile aligns well with the
 * creator's content profile, indicating natural affinity.
 *
 * @param userWeights - User's constellation blend weights
 * @param creatorWeights - Creator's constellation weights
 * @returns Taste coherence score and details
 */
function calculateTasteCoherence(
  userWeights: ConstellationWeights,
  creatorWeights: ConstellationWeights
): TasteCoherenceResult {
  // Handle empty weights
  if (
    Object.keys(userWeights).length === 0 ||
    Object.keys(creatorWeights).length === 0
  ) {
    return {
      normalized: 0.5, // Neutral score when data is missing
      matchingConstellations: [],
      overlapPercentage: 0,
    };
  }

  // Build full vectors for all constellations
  const userVector: number[] = [];
  const creatorVector: number[] = [];

  for (const id of CONSTELLATION_IDS) {
    userVector.push(userWeights[id] ?? 0);
    creatorVector.push(creatorWeights[id] ?? 0);
  }

  // Calculate cosine similarity
  const cosineSim = cosineSimilarity(userVector, creatorVector);

  // Find matching constellations (both have significant weight)
  const matchingConstellations: ConstellationId[] = [];
  const threshold = 0.1; // 10% weight threshold

  for (const id of CONSTELLATION_IDS) {
    const userWeight = userWeights[id] ?? 0;
    const creatorWeight = creatorWeights[id] ?? 0;

    if (userWeight >= threshold && creatorWeight >= threshold) {
      matchingConstellations.push(id);
    }
  }

  // Calculate overlap percentage (Jaccard-like measure)
  const userActive = Object.entries(userWeights).filter(([, w]) => w >= threshold);
  const creatorActive = Object.entries(creatorWeights).filter(([, w]) => w >= threshold);
  const unionCount = new Set([
    ...userActive.map(([k]) => k),
    ...creatorActive.map(([k]) => k),
  ]).size;
  const overlapPercentage = unionCount > 0 ? matchingConstellations.length / unionCount : 0;

  // Normalize cosine similarity from [-1, 1] to [0, 1]
  // Since weights are non-negative, similarity is typically [0, 1]
  const normalized = clamp((cosineSim + 1) / 2, 0, 1);

  return {
    normalized,
    matchingConstellations,
    overlapPercentage,
  };
}

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

// =============================================================================
// Depth Signal Score Calculation
// =============================================================================

interface DepthSignalResult {
  normalized: number; // 0-1
  strongSignals: number;
  recentSignals: number;
  signalsByType: Partial<Record<SignalType, number>>;
}

/**
 * Calculate time-weighted depth signal score.
 *
 * Signals are weighted by their type (some actions indicate stronger
 * superfan potential) and by recency (recent signals matter more).
 *
 * @param signals - Array of depth signals
 * @returns Depth signal score and details
 */
function calculateDepthSignalScore(signals: DepthSignalInput[]): DepthSignalResult {
  if (signals.length === 0) {
    return {
      normalized: 0,
      strongSignals: 0,
      recentSignals: 0,
      signalsByType: {},
    };
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let totalWeightedScore = 0;
  let strongSignals = 0;
  let recentSignals = 0;
  const signalsByType: Partial<Record<SignalType, number>> = {};

  for (const signal of signals) {
    // Get base weight for signal type
    const baseWeight = SIGNAL_WEIGHTS[signal.type] * signal.weight;

    // Count strong signals
    if (SIGNAL_WEIGHTS[signal.type] >= 3.0) {
      strongSignals++;
    }

    // Count recent signals
    if (signal.createdAt >= sevenDaysAgo) {
      recentSignals++;
    }

    // Apply time decay
    const daysSinceSignal = Math.max(
      0,
      (now.getTime() - signal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const decayFactor = calculateTimeDecay(daysSinceSignal);

    // Add to total weighted score
    totalWeightedScore += baseWeight * decayFactor;

    // Count by type
    signalsByType[signal.type] = (signalsByType[signal.type] ?? 0) + 1;
  }

  // Normalize score to 0-1 range
  // We use a logarithmic scale to handle varying signal counts
  // A score of ~20 weighted points is considered "maxed out" (score = 1)
  const maxExpectedScore = 20;
  const normalized = clamp(
    Math.log1p(totalWeightedScore) / Math.log1p(maxExpectedScore),
    0,
    1
  );

  return {
    normalized,
    strongSignals,
    recentSignals,
    signalsByType,
  };
}

/**
 * Calculate time decay factor for a signal.
 *
 * Uses exponential decay based on half-life.
 *
 * @param daysSinceSignal - Number of days since the signal was created
 * @returns Decay factor between MIN_WEIGHT and 1
 */
function calculateTimeDecay(daysSinceSignal: number): number {
  const halfLife = TIME_DECAY.HALF_LIFE_DAYS;
  const minWeight = TIME_DECAY.MIN_WEIGHT;

  // Exponential decay: weight = e^(-λt) where λ = ln(2)/halfLife
  const lambda = Math.LN2 / halfLife;
  const decayedWeight = Math.exp(-lambda * daysSinceSignal);

  // Ensure minimum weight
  return Math.max(decayedWeight, minWeight);
}

// =============================================================================
// Return Pattern Calculation
// =============================================================================

interface ReturnPatternResult {
  normalized: number; // 0-1
  organicReturns: number;
  algorithmicReturns: number;
  organicRatio: number; // 0-1
  avgDaysBetweenReturns: number | null;
}

/**
 * Calculate return pattern score.
 *
 * This measures both the ratio of organic vs algorithmic returns
 * and the consistency of return visits.
 *
 * Organic returns (user came back on their own) are strong indicators
 * of superfan potential. Algorithmic returns (recommended) are weaker.
 *
 * @param sessions - Array of sessions
 * @returns Return pattern score and details
 */
function calculateReturnPattern(sessions: SessionInput[]): ReturnPatternResult {
  if (sessions.length === 0) {
    return {
      normalized: 0.5, // Neutral when no data
      organicReturns: 0,
      algorithmicReturns: 0,
      organicRatio: 0,
      avgDaysBetweenReturns: null,
    };
  }

  // Count organic vs algorithmic sessions
  let organicReturns = 0;
  let algorithmicReturns = 0;

  for (const session of sessions) {
    if (session.source === 'ORGANIC') {
      organicReturns++;
    } else if (session.source === 'ALGORITHMIC') {
      algorithmicReturns++;
    }
    // SOCIAL and EXTERNAL count as partial organic (they clicked a link)
  }

  const totalReturns = sessions.length;
  const organicRatio = totalReturns > 0 ? organicReturns / totalReturns : 0;

  // Calculate average days between returns (for consistency measure)
  const sortedSessions = [...sessions].sort(
    (a, b) => a.startedAt.getTime() - b.startedAt.getTime()
  );

  let avgDaysBetweenReturns: number | null = null;
  if (sortedSessions.length >= 2) {
    let totalDays = 0;
    for (let i = 1; i < sortedSessions.length; i++) {
      const daysBetween =
        (sortedSessions[i].startedAt.getTime() - sortedSessions[i - 1].startedAt.getTime()) /
        (1000 * 60 * 60 * 24);
      totalDays += daysBetween;
    }
    avgDaysBetweenReturns = Math.round((totalDays / (sortedSessions.length - 1)) * 10) / 10;
  }

  // Calculate normalized score
  // Components:
  // 1. Organic ratio (0-1) - weight 0.5
  // 2. Return frequency (more returns = better) - weight 0.3
  // 3. Consistency (regular returns = better) - weight 0.2

  // Organic ratio component
  const organicComponent = organicRatio;

  // Return frequency component (logarithmic scale)
  // 10+ sessions is considered "maxed out"
  const frequencyComponent = clamp(Math.log1p(totalReturns) / Math.log1p(10), 0, 1);

  // Consistency component (inverse of avg days between returns)
  // Returning every 3 days or less is ideal
  let consistencyComponent = 0.5; // Default for insufficient data
  if (avgDaysBetweenReturns !== null) {
    // Lower days between returns = higher score
    // 3 days = 1.0, 7 days = 0.5, 30 days = 0.1
    consistencyComponent = clamp(Math.exp(-avgDaysBetweenReturns / 10), 0, 1);
  }

  // Combine components
  const normalized =
    organicComponent * 0.5 +
    frequencyComponent * 0.3 +
    consistencyComponent * 0.2;

  return {
    normalized,
    organicReturns,
    algorithmicReturns,
    organicRatio,
    avgDaysBetweenReturns,
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Classify SCP score into a category.
 */
function classifyScore(score: number): 'superfan' | 'high_potential' | 'moderate' | 'low' {
  if (score >= SCP_THRESHOLDS.SUPERFAN) return 'superfan';
  if (score >= SCP_THRESHOLDS.HIGH_POTENTIAL) return 'high_potential';
  if (score >= SCP_THRESHOLDS.MODERATE) return 'moderate';
  return 'low';
}

/**
 * Check if a cached SCP score is stale and needs recalculation.
 *
 * @param lastCalculatedAt - When the score was last calculated
 * @param staleDays - Number of days after which score is considered stale
 * @returns Whether the score is stale
 */
export function isScoreStale(lastCalculatedAt: Date, staleDays: number = 7): boolean {
  const now = new Date();
  const daysSinceCalculation =
    (now.getTime() - lastCalculatedAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceCalculation >= staleDays;
}

/**
 * Get the color associated with an SCP classification.
 * Useful for UI components.
 */
export function getClassificationColor(
  classification: 'superfan' | 'high_potential' | 'moderate' | 'low'
): string {
  switch (classification) {
    case 'superfan':
      return '#8b5cf6'; // violet-500
    case 'high_potential':
      return '#d946ef'; // fuchsia-500
    case 'moderate':
      return '#f59e0b'; // amber-500
    case 'low':
      return '#6b7280'; // gray-500
  }
}

/**
 * Get a human-readable label for an SCP classification.
 */
export function getClassificationLabel(
  classification: 'superfan' | 'high_potential' | 'moderate' | 'low'
): string {
  switch (classification) {
    case 'superfan':
      return 'Superfan';
    case 'high_potential':
      return 'High Potential';
    case 'moderate':
      return 'Moderate';
    case 'low':
      return 'Casual';
  }
}

export default calculateSCP;
