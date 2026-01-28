/**
 * @subtaste/core - Genome Evolution
 *
 * Handles preference drift, temporal decay, and Bayesian updating.
 */

import type {
  TasteGenome,
  SignalEvent,
  Designation
} from '../types';
import { classify } from '../engine/classifier';
import { DEFAULT_SCORING_CONFIG } from '../engine/weights';

/**
 * Evolution configuration
 */
export interface EvolutionConfig {
  // Days after which to trigger recalibration
  recalibrationThreshold: number;

  // Weight decay per day for old signals
  dailyDecay: number;

  // Minimum signals for reliable classification
  minimumSignals: number;

  // Maximum signal history to retain
  maxHistorySize: number;
}

/**
 * Default evolution configuration
 */
export const DEFAULT_EVOLUTION_CONFIG: EvolutionConfig = {
  recalibrationThreshold: 30,
  dailyDecay: 0.99,
  minimumSignals: 3,
  maxHistorySize: 1000
};

/**
 * Check if genome needs recalibration
 */
export function needsRecalibration(
  genome: TasteGenome,
  config: EvolutionConfig = DEFAULT_EVOLUTION_CONFIG
): boolean {
  const daysSinceCalibration = getDaysSince(genome.behaviour.lastCalibration);
  return daysSinceCalibration >= config.recalibrationThreshold;
}

/**
 * Decay weight for a signal
 */
export interface DecayedSignal extends SignalEvent {
  _temporalWeight?: number;
}

/**
 * Apply temporal decay to signal history
 * Older signals have less weight
 * Accepts both Signal[] and SignalEvent[]
 */
export function applyTemporalDecay<T extends { timestamp: Date }>(
  signals: T[],
  config: Partial<EvolutionConfig> = DEFAULT_EVOLUTION_CONFIG
): T[] {
  const dailyDecay = config.dailyDecay ?? DEFAULT_EVOLUTION_CONFIG.dailyDecay;

  return signals.map(signal => {
    const daysOld = getDaysSince(signal.timestamp);
    const decay = Math.pow(dailyDecay, daysOld);

    // Store decay factor as extended property
    const decayed = signal as T & { _temporalWeight?: number };
    decayed._temporalWeight = decay;

    return decayed;
  });
}

/**
 * Detect significant preference drift
 * Returns true if the genome has shifted meaningfully
 */
export function detectPreferenceDrift(
  currentGenome: TasteGenome,
  historicalDistribution: Record<Designation, number>,
  threshold = 0.2
): boolean {
  let totalDrift = 0;

  for (const [designation, weight] of Object.entries(currentGenome.archetype.distribution)) {
    const d = designation as Designation;
    const historicalWeight = historicalDistribution[d] || 0;
    totalDrift += Math.abs(weight - historicalWeight);
  }

  // Normalise by 2 (max possible drift)
  return (totalDrift / 2) >= threshold;
}

/**
 * Calculate confidence based on signal history
 */
export function calculateHistoricalConfidence(
  signals: SignalEvent[],
  config: EvolutionConfig = DEFAULT_EVOLUTION_CONFIG
): number {
  if (signals.length < config.minimumSignals) {
    return 0.3; // Low confidence with insufficient data
  }

  // Base confidence from signal count
  const countConfidence = Math.min(signals.length / 50, 1);

  // Recency confidence (more recent signals = higher confidence)
  const recentSignals = signals.filter(s => getDaysSince(s.timestamp) < 30);
  const recencyConfidence = Math.min(recentSignals.length / 20, 1);

  // Diversity confidence (signals from multiple sources)
  const sources = new Set(signals.map(s => s.source));
  const diversityConfidence = Math.min(sources.size / 3, 1);

  return (countConfidence * 0.4 + recencyConfidence * 0.4 + diversityConfidence * 0.2);
}

/**
 * Prune old signals beyond retention limit
 */
export function pruneSignalHistory(
  signals: SignalEvent[],
  config: EvolutionConfig = DEFAULT_EVOLUTION_CONFIG
): SignalEvent[] {
  if (signals.length <= config.maxHistorySize) {
    return signals;
  }

  // Keep most recent signals
  const sorted = [...signals].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return sorted.slice(0, config.maxHistorySize);
}

/**
 * Calculate taste stability over time
 * Higher = more consistent preferences
 */
export function calculateTasteStability(
  genome: TasteGenome
): number {
  const signals = genome.behaviour.signalHistory;

  if (signals.length < 10) {
    return 0.5; // Insufficient data
  }

  // Split signals into time windows
  const now = new Date();
  const recentWindow = signals.filter(s => getDaysSince(s.timestamp) < 30);
  const olderWindow = signals.filter(s => getDaysSince(s.timestamp) >= 30 && getDaysSince(s.timestamp) < 90);

  if (olderWindow.length < 5) {
    return 0.5; // Insufficient historical data
  }

  // Classify each window
  const recentResult = classify({ signals: recentWindow });
  const olderResult = classify({ signals: olderWindow });

  // Compare distributions
  let similarity = 0;
  for (const d of Object.keys(recentResult.classification.distribution)) {
    const designation = d as Designation;
    const recentWeight = recentResult.classification.distribution[designation] || 0;
    const olderWeight = olderResult.classification.distribution[designation] || 0;
    similarity += Math.min(recentWeight, olderWeight);
  }

  return similarity;
}

/**
 * Evolve genome based on new signals and time
 */
export function evolveGenome(
  genome: TasteGenome,
  newSignals: SignalEvent[],
  config: EvolutionConfig = DEFAULT_EVOLUTION_CONFIG
): TasteGenome {
  // Apply temporal decay to existing history
  const decayedHistory = applyTemporalDecay(genome.behaviour.signalHistory, config);

  // Add new signals
  const allSignals = [...decayedHistory, ...newSignals];

  // Prune if necessary
  const prunedSignals = pruneSignalHistory(allSignals, config);

  // Reclassify
  const result = classify({
    signals: prunedSignals,
    existingPsychometrics: genome._engine.psychometrics
  });

  // Calculate new confidence
  const confidence = calculateHistoricalConfidence(prunedSignals, config);

  return {
    ...genome,
    version: genome.version + 1,
    updatedAt: new Date(),
    archetype: result.classification,
    _engine: {
      ...genome._engine,
      psychometrics: result.psychometrics,
      sephiroticBalance: result.sephiroticBalance,
      orishaResonance: result.orishaResonance
    },
    behaviour: {
      ...genome.behaviour,
      signalHistory: prunedSignals,
      confidence,
      lastCalibration: new Date()
    }
  };
}

/**
 * Helper: get days since a date
 */
function getDaysSince(date: Date): number {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  return diff / (1000 * 60 * 60 * 24);
}
