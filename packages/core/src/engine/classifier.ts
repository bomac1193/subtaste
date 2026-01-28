/**
 * @subtaste/core - Classification Engine
 *
 * The core algorithm that maps signals to archetype classifications.
 * This is the heart of the taste genome system.
 */

import type {
  Designation,
  ArchetypeClassification,
  Signal,
  SignalEvent,
  Psychometrics
} from '../types';
import { ALL_DESIGNATIONS, isExplicitSignal, SIGNAL_WEIGHTS } from '../types';
import {
  getDefaultPsychometrics,
  extractTraitDeltas,
  applyTraitDeltas,
  calculateAllSimilarities
} from './psychometrics';
import { DEFAULT_SCORING_CONFIG, type ScoringConfig, mergeConfig } from './weights';
import { INTERNAL_MAPPINGS, calculateSephiroticBalance } from '../pantheon/internal';
import { toGlyph } from '../pantheon/definitions';

/**
 * Classification input
 */
export interface ClassificationInput {
  signals: Signal[];
  existingPsychometrics?: Psychometrics;
  config?: Partial<ScoringConfig>;
}

/**
 * Classification result with internal details
 */
export interface ClassificationResult {
  classification: ArchetypeClassification;
  psychometrics: Psychometrics;
  sephiroticBalance: Record<string, number>;
  orishaResonance: { primary: string; shadow: string };
  rawScores: Record<Designation, number>;
}

/**
 * Classify signals into an archetype assignment
 */
export function classify(input: ClassificationInput): ClassificationResult {
  const config = mergeConfig(DEFAULT_SCORING_CONFIG, input.config || {});
  const basePsychometrics = input.existingPsychometrics || getDefaultPsychometrics();

  // Extract trait deltas from explicit signals
  const deltas = extractTraitDeltas(input.signals);
  const psychometrics = applyTraitDeltas(basePsychometrics, deltas);

  // Calculate psychometric similarity scores
  const psychoScores = calculateAllSimilarities(psychometrics);

  // Calculate raw signal scores
  const signalScores = calculateSignalScores(input.signals, config);

  // Combine psychometric and signal scores
  const rawScores: Record<Designation, number> = {} as Record<Designation, number>;
  for (const d of ALL_DESIGNATIONS) {
    const psychoScore = psychoScores[d] * config.psychometricWeight;
    const signalScore = (signalScores[d] || 0) * (1 - config.psychometricWeight);
    rawScores[d] = psychoScore + signalScore;
  }

  // Apply softmax to get probability distribution
  const distribution = softmax(rawScores, config.temperature);

  // Filter to significant weights
  const filtered = filterDistribution(distribution, config.distributionThreshold);

  // Find primary and secondary
  const sorted = Object.entries(filtered)
    .sort(([, a], [, b]) => b - a);

  const primary = sorted[0][0] as Designation;
  const primaryConfidence = sorted[0][1];

  let secondary: Designation | null = null;
  let secondaryConfidence = 0;
  if (sorted.length > 1 && sorted[1][1] >= config.secondaryThreshold) {
    secondary = sorted[1][0] as Designation;
    secondaryConfidence = sorted[1][1];
  }

  // Calculate entropy-based confidence
  const entropy = calculateEntropy(distribution);
  const maxEntropy = Math.log(12);
  const overallConfidence = 1 - (entropy / maxEntropy);

  // Calculate sephirotic balance
  const sephiroticBalance = calculateSephiroticBalance(distribution);

  // Determine orisha resonance from primary
  const primaryMapping = INTERNAL_MAPPINGS[primary];
  const orishaResonance = {
    primary: primaryMapping.orisha,
    shadow: primaryMapping.shadowOrisha
  };

  const classification: ArchetypeClassification = {
    primary: {
      designation: primary,
      glyph: toGlyph(primary),
      confidence: primaryConfidence * overallConfidence
    },
    secondary: secondary ? {
      designation: secondary,
      glyph: toGlyph(secondary),
      confidence: secondaryConfidence * overallConfidence
    } : null,
    distribution: filtered
  };

  return {
    classification,
    psychometrics,
    sephiroticBalance,
    orishaResonance,
    rawScores
  };
}

/**
 * Calculate scores from signals directly (beyond psychometrics)
 */
function calculateSignalScores(
  signals: Signal[],
  config: ScoringConfig
): Record<Designation, number> {
  const scores: Record<Designation, number> = {} as Record<Designation, number>;

  for (const d of ALL_DESIGNATIONS) {
    scores[d] = 0;
  }

  for (const signal of signals) {
    // Get base weight for this signal type
    const typeWeight = config.signalWeights[
      signal.type === 'explicit' ? 'explicit' :
      signal.type === 'intentional_implicit' ? 'intentionalImplicit' :
      'unintentionalImplicit'
    ];

    // If explicit signal with archetype weights, apply them
    if (isExplicitSignal(signal.data)) {
      const explicit = signal.data;
      if (explicit.archetypeWeights) {
        for (const [designation, weight] of Object.entries(explicit.archetypeWeights)) {
          const d = designation as Designation;
          scores[d] += weight * typeWeight;
        }
      }

      // Get signal kind weight
      const kindWeight = SIGNAL_WEIGHTS[explicit.kind] || 1;
      // This would be applied if we had item-archetype mappings
    }
  }

  // Normalise to 0-1 range
  const max = Math.max(...Object.values(scores), 1);
  for (const d of ALL_DESIGNATIONS) {
    scores[d] = scores[d] / max;
  }

  return scores;
}

/**
 * Apply softmax to convert scores to probability distribution
 */
function softmax(
  scores: Record<Designation, number>,
  temperature: number
): Record<Designation, number> {
  const result: Record<Designation, number> = {} as Record<Designation, number>;

  // Calculate exp(score / temperature) for each
  const exps: number[] = [];
  for (const d of ALL_DESIGNATIONS) {
    exps.push(Math.exp(scores[d] * temperature));
  }

  const sum = exps.reduce((a, b) => a + b, 0);

  ALL_DESIGNATIONS.forEach((d, i) => {
    result[d] = exps[i] / sum;
  });

  return result;
}

/**
 * Filter distribution to significant weights only
 */
function filterDistribution(
  distribution: Record<Designation, number>,
  threshold: number
): Record<Designation, number> {
  const filtered: Record<Designation, number> = {} as Record<Designation, number>;

  for (const [d, weight] of Object.entries(distribution)) {
    if (weight >= threshold) {
      filtered[d as Designation] = weight;
    }
  }

  // Renormalise
  const sum = Object.values(filtered).reduce((a, b) => a + b, 0);
  for (const d of Object.keys(filtered)) {
    filtered[d as Designation] = filtered[d as Designation] / sum;
  }

  return filtered;
}

/**
 * Calculate Shannon entropy of a distribution
 */
function calculateEntropy(distribution: Record<Designation, number>): number {
  let entropy = 0;
  for (const p of Object.values(distribution)) {
    if (p > 0) {
      entropy -= p * Math.log(p);
    }
  }
  return entropy;
}

/**
 * Quick classification from just signals (convenience function)
 */
export function classifySignals(signals: Signal[]): ArchetypeClassification {
  const result = classify({ signals });
  return result.classification;
}

/**
 * Reclassify with existing psychometrics
 */
export function reclassify(
  signals: Signal[],
  existingPsychometrics: Psychometrics
): ClassificationResult {
  return classify({ signals, existingPsychometrics });
}
