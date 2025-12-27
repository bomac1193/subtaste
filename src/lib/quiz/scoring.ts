/**
 * Confidence-Based Scoring System
 *
 * Implements IRT (Item Response Theory) and Bayesian scoring:
 * - Trait estimates with confidence intervals
 * - Answer consistency analysis
 * - Dynamic score updates during quiz
 * - Reliability metrics (Cronbach's alpha approximation)
 */

import {
  ItemBankQuestion,
  ItemAnswer,
  TraitId,
  ALL_TRAITS,
} from './item-bank';
import { TraitDeltas, AestheticPreference } from '../types/models';
import { AestheticAdjustment } from './questions';
import { clamp } from '../utils';

// =============================================================================
// Types
// =============================================================================

export interface TraitScore {
  /** Normalized trait value (0-1) */
  score: number;
  /** Confidence in estimate (0-1) */
  confidence: number;
  /** Standard deviation of responses */
  std: number;
  /** Number of questions answered for this trait */
  itemCount: number;
  /** Raw sum of response values */
  rawSum: number;
  /** Response history for consistency analysis */
  responses: number[];
}

export interface Answer {
  questionId: string;
  answerId: string;
  question: ItemBankQuestion;
  answer: ItemAnswer;
  responseTimeMs?: number;
}

export interface ScoringResult {
  traits: Record<TraitId, TraitScore>;
  aesthetic: Omit<AestheticPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  overallConfidence: number;
  reliability: number;
  itemsAnswered: number;
  estimatedAccuracy: number;
  questionsNeededForTarget: number;
}

export interface ProgressUpdate {
  currentConfidence: number;
  estimatedAccuracy: number;
  questionsRemaining: number;
  traitProgress: Record<TraitId, { confidence: number; itemCount: number }>;
  message: string;
}

// =============================================================================
// Scoring Functions
// =============================================================================

/**
 * Score all traits from quiz answers
 * Uses IRT-inspired scoring with Bayesian confidence estimation
 */
export function scoreTraits(answers: Answer[]): ScoringResult {
  // Initialize trait accumulators
  const traitAccumulators: Record<
    TraitId,
    {
      values: number[];
      weights: number[];
      difficulties: number[];
      discriminations: number[];
    }
  > = {} as Record<TraitId, {
    values: number[];
    weights: number[];
    difficulties: number[];
    discriminations: number[];
  }>;

  ALL_TRAITS.forEach((trait) => {
    traitAccumulators[trait] = {
      values: [],
      weights: [],
      difficulties: [],
      discriminations: [],
    };
  });

  // Aesthetic accumulators
  const aestheticAcc = {
    darknessPreference: { sum: 0, count: 0 },
    complexityPreference: { sum: 0, count: 0 },
    organicVsSynthetic: { sum: 0, count: 0 },
    minimalVsMaximal: { sum: 0, count: 0 },
    tempoCenter: { sum: 0, count: 0 },
    energyCenter: { sum: 0, count: 0 },
    acousticVsDigital: { sum: 0, count: 0 },
  };

  // Process each answer
  for (const answer of answers) {
    const { question, answer: selectedAnswer } = answer;

    // Primary trait contribution
    const primaryValue = selectedAnswer.value;
    traitAccumulators[question.primaryTrait].values.push(primaryValue);
    traitAccumulators[question.primaryTrait].weights.push(question.discrimination);
    traitAccumulators[question.primaryTrait].difficulties.push(question.difficulty);
    traitAccumulators[question.primaryTrait].discriminations.push(question.discrimination);

    // Secondary trait contributions
    if (question.secondaryTraits) {
      for (const [trait, loading] of Object.entries(question.secondaryTraits)) {
        const traitId = trait as TraitId;
        const adjustedValue = primaryValue * loading;
        traitAccumulators[traitId].values.push(adjustedValue);
        traitAccumulators[traitId].weights.push(question.discrimination * loading);
        traitAccumulators[traitId].difficulties.push(question.difficulty);
        traitAccumulators[traitId].discriminations.push(question.discrimination * loading);
      }
    }

    // Apply trait deltas (legacy support)
    for (const [trait, delta] of Object.entries(selectedAnswer.traitDeltas)) {
      if (delta !== undefined && ALL_TRAITS.includes(trait as TraitId)) {
        // Convert delta to value contribution
        const deltaValue = delta > 0 ? 0.5 + delta : 0.5 + delta;
        traitAccumulators[trait as TraitId].values.push(deltaValue);
        traitAccumulators[trait as TraitId].weights.push(0.5); // Lower weight for deltas
      }
    }

    // Aesthetic adjustments
    if (selectedAnswer.aestheticAdjustment) {
      const adj = selectedAnswer.aestheticAdjustment;
      if (adj.darknessPreference !== undefined) {
        aestheticAcc.darknessPreference.sum += adj.darknessPreference;
        aestheticAcc.darknessPreference.count++;
      }
      if (adj.complexityPreference !== undefined) {
        aestheticAcc.complexityPreference.sum += adj.complexityPreference;
        aestheticAcc.complexityPreference.count++;
      }
      if (adj.organicVsSynthetic !== undefined) {
        aestheticAcc.organicVsSynthetic.sum += adj.organicVsSynthetic;
        aestheticAcc.organicVsSynthetic.count++;
      }
      if (adj.minimalVsMaximal !== undefined) {
        aestheticAcc.minimalVsMaximal.sum += adj.minimalVsMaximal;
        aestheticAcc.minimalVsMaximal.count++;
      }
      if (adj.tempoCenter !== undefined) {
        aestheticAcc.tempoCenter.sum += adj.tempoCenter;
        aestheticAcc.tempoCenter.count++;
      }
      if (adj.energyCenter !== undefined) {
        aestheticAcc.energyCenter.sum += adj.energyCenter;
        aestheticAcc.energyCenter.count++;
      }
      if (adj.acousticVsDigital !== undefined) {
        aestheticAcc.acousticVsDigital.sum += adj.acousticVsDigital;
        aestheticAcc.acousticVsDigital.count++;
      }
    }
  }

  // Calculate trait scores
  const traits: Record<TraitId, TraitScore> = {} as Record<TraitId, TraitScore>;

  for (const trait of ALL_TRAITS) {
    const acc = traitAccumulators[trait];
    traits[trait] = calculateTraitScore(acc);
  }

  // Calculate aesthetic preferences
  const aesthetic = calculateAestheticPreferences(aestheticAcc);

  // Calculate overall metrics
  const traitScores = Object.values(traits);
  const overallConfidence =
    traitScores.reduce((sum, t) => sum + t.confidence, 0) / traitScores.length;

  const reliability = calculateReliability(traitAccumulators);
  const estimatedAccuracy = calculateEstimatedAccuracy(
    overallConfidence,
    reliability,
    answers.length
  );

  const questionsNeededForTarget = estimateQuestionsForTarget(
    overallConfidence,
    0.85, // Target 85% accuracy
    answers.length
  );

  return {
    traits,
    aesthetic,
    overallConfidence,
    reliability,
    itemsAnswered: answers.length,
    estimatedAccuracy,
    questionsNeededForTarget,
  };
}

/**
 * Calculate trait score using IRT-inspired weighted averaging with Bayesian confidence
 */
function calculateTraitScore(acc: {
  values: number[];
  weights: number[];
  difficulties: number[];
  discriminations: number[];
}): TraitScore {
  const { values, weights, difficulties, discriminations } = acc;
  const n = values.length;

  if (n === 0) {
    return {
      score: 0.5, // Prior (neutral)
      confidence: 0,
      std: 0.25,
      itemCount: 0,
      rawSum: 0,
      responses: [],
    };
  }

  // Normalize all values to 0-1 range first
  // Binary questions use -1/1, multiple choice uses 0-1
  const normalizedValues = values.map(v => {
    if (v < 0) {
      // Binary question: -1 -> 0, 1 -> 1
      return (v + 1) / 2;
    }
    // Already in 0-1 range
    return v;
  });

  // Weighted average (IRT-style)
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weightedSum = normalizedValues.reduce((sum, v, i) => sum + v * weights[i], 0);
  const rawScore = weightedSum / totalWeight;

  // Score is now directly in 0-1 range
  const score = clamp(rawScore, 0, 1);

  // Calculate standard deviation
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  const std = Math.sqrt(variance);

  // Bayesian confidence estimation
  // Higher with more items, higher discrimination, and lower variance
  const avgDiscrimination =
    discriminations.reduce((a, b) => a + b, 0) / discriminations.length;

  // Base confidence from sample size (diminishing returns)
  const sampleConfidence = 1 - 1 / (1 + n * 0.5);

  // Consistency bonus (lower variance = higher confidence)
  const consistencyBonus = Math.max(0, 0.3 - std * 0.5);

  // Discrimination bonus (better questions = higher confidence)
  const discriminationBonus = (avgDiscrimination - 1) * 0.1;

  const confidence = clamp(
    sampleConfidence + consistencyBonus + discriminationBonus,
    0,
    0.95
  );

  return {
    score,
    confidence,
    std,
    itemCount: n,
    rawSum: values.reduce((a, b) => a + b, 0),
    responses: values,
  };
}

/**
 * Calculate aesthetic preferences from accumulated adjustments
 */
function calculateAestheticPreferences(
  acc: Record<
    string,
    { sum: number; count: number }
  >
): Omit<AestheticPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  const getAdjusted = (key: string, base: number) => {
    if (acc[key].count === 0) return base;
    const adjustment = acc[key].sum / acc[key].count;
    return clamp(base + adjustment, 0, 1);
  };

  const getTempoAdjusted = (base: number) => {
    if (acc.tempoCenter.count === 0) return base;
    return base + acc.tempoCenter.sum / acc.tempoCenter.count;
  };

  return {
    colorPaletteVector: [],
    darknessPreference: getAdjusted('darknessPreference', 0.5),
    complexityPreference: getAdjusted('complexityPreference', 0.5),
    symmetryPreference: 0.5,
    organicVsSynthetic: getAdjusted('organicVsSynthetic', 0.5),
    minimalVsMaximal: getAdjusted('minimalVsMaximal', 0.5),
    tempoRangeMin: clamp(getTempoAdjusted(80), 40, 180),
    tempoRangeMax: clamp(getTempoAdjusted(140), 60, 200),
    energyRangeMin: clamp(0.3 + (acc.energyCenter.count > 0 ? acc.energyCenter.sum / acc.energyCenter.count * 0.3 : 0), 0, 0.8),
    energyRangeMax: clamp(0.7 + (acc.energyCenter.count > 0 ? acc.energyCenter.sum / acc.energyCenter.count * 0.3 : 0), 0.2, 1),
    harmonicDissonanceTolerance: 0.3,
    rhythmPreference: 0.5,
    acousticVsDigital: getAdjusted('acousticVsDigital', 0.5),
  };
}

/**
 * Calculate reliability (Cronbach's alpha approximation)
 */
function calculateReliability(
  accumulators: Record<
    TraitId,
    { values: number[]; weights: number[] }
  >
): number {
  let totalItems = 0;
  let totalVariance = 0;
  let itemVariances = 0;

  for (const trait of ALL_TRAITS) {
    const values = accumulators[trait].values;
    if (values.length === 0) continue;

    totalItems += values.length;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);
    totalVariance += variance;

    // Individual item variance contribution
    itemVariances += values.length * 0.25; // Approximate per-item variance
  }

  if (totalItems < 3) return 0.5;

  // Cronbach's alpha approximation
  const alpha = (totalItems / (totalItems - 1)) * (1 - itemVariances / (totalVariance + 0.01));
  return clamp(alpha, 0, 1);
}

/**
 * Calculate estimated accuracy based on confidence and reliability
 */
function calculateEstimatedAccuracy(
  confidence: number,
  reliability: number,
  itemCount: number
): number {
  // Combined accuracy from multiple factors
  const baseAccuracy = 0.5 + confidence * 0.3 + reliability * 0.15;

  // Sample size bonus
  const sampleBonus = Math.min(itemCount / 40, 0.1);

  return clamp(baseAccuracy + sampleBonus, 0.5, 0.95);
}

/**
 * Estimate questions needed to reach target accuracy
 */
function estimateQuestionsForTarget(
  currentConfidence: number,
  targetAccuracy: number,
  currentItems: number
): number {
  if (currentConfidence >= targetAccuracy) return 0;

  // Approximate learning curve
  const gap = targetAccuracy - currentConfidence;
  const itemsPerConfidencePoint = 3 / (1 - currentConfidence + 0.1);
  const needed = Math.ceil(gap * itemsPerConfidencePoint * 10);

  return Math.min(needed, 20); // Cap at 20 more questions
}

// =============================================================================
// Real-time Progress Updates
// =============================================================================

/**
 * Generate progress update during quiz
 */
export function getProgressUpdate(
  answers: Answer[],
  totalPlanned: number
): ProgressUpdate {
  if (answers.length === 0) {
    return {
      currentConfidence: 0,
      estimatedAccuracy: 0,
      questionsRemaining: totalPlanned,
      traitProgress: ALL_TRAITS.reduce(
        (acc, t) => ({ ...acc, [t]: { confidence: 0, itemCount: 0 } }),
        {} as Record<TraitId, { confidence: number; itemCount: number }>
      ),
      message: 'Ready to discover your taste constellation',
    };
  }

  const result = scoreTraits(answers);
  const questionsRemaining = Math.max(0, totalPlanned - answers.length);

  const traitProgress = ALL_TRAITS.reduce(
    (acc, t) => ({
      ...acc,
      [t]: {
        confidence: result.traits[t].confidence,
        itemCount: result.traits[t].itemCount,
      },
    }),
    {} as Record<TraitId, { confidence: number; itemCount: number }>
  );

  const message = generateProgressMessage(
    result.estimatedAccuracy,
    questionsRemaining,
    result.questionsNeededForTarget
  );

  return {
    currentConfidence: result.overallConfidence,
    estimatedAccuracy: result.estimatedAccuracy,
    questionsRemaining,
    traitProgress,
    message,
  };
}

/**
 * Generate encouraging progress message
 */
function generateProgressMessage(
  accuracy: number,
  remaining: number,
  neededForTarget: number
): string {
  const accuracyPercent = Math.round(accuracy * 100);

  if (remaining === 0) {
    return `${accuracyPercent}% accurate – your constellation awaits!`;
  }

  if (accuracy >= 0.85) {
    return `${accuracyPercent}% accurate – excellent precision! ${remaining} more for final touches`;
  }

  if (accuracy >= 0.75) {
    return `${accuracyPercent}% accurate – ${remaining} more questions for clarity`;
  }

  if (accuracy >= 0.65) {
    return `${accuracyPercent}% accurate so far – ${neededForTarget} more for precision`;
  }

  return `Building your profile – ${remaining} questions remaining`;
}

// =============================================================================
// Bayesian Update (for real-time adaptive scoring)
// =============================================================================

export interface BayesianState {
  mean: number;
  variance: number;
  n: number;
}

/**
 * Initialize Bayesian prior for a trait
 */
export function initBayesianPrior(): BayesianState {
  return {
    mean: 0.5, // Neutral prior
    variance: 0.25, // High initial uncertainty
    n: 0,
  };
}

/**
 * Update Bayesian estimate with new observation
 * Uses conjugate prior update for normal distribution
 */
export function updateBayesian(
  prior: BayesianState,
  observation: number,
  observationWeight: number = 1
): BayesianState {
  const priorPrecision = 1 / prior.variance;
  const obsVariance = 0.25 / observationWeight; // Higher weight = lower variance
  const obsPrecision = 1 / obsVariance;

  const newPrecision = priorPrecision + obsPrecision;
  const newMean =
    (prior.mean * priorPrecision + observation * obsPrecision) / newPrecision;
  const newVariance = 1 / newPrecision;

  return {
    mean: newMean,
    variance: newVariance,
    n: prior.n + 1,
  };
}

/**
 * Get confidence interval from Bayesian state
 */
export function getConfidenceInterval(
  state: BayesianState,
  level: number = 0.95
): [number, number] {
  // Z-score for confidence level (approximation)
  const z = level === 0.95 ? 1.96 : level === 0.99 ? 2.576 : 1.645;
  const margin = z * Math.sqrt(state.variance);

  return [
    clamp(state.mean - margin, 0, 1),
    clamp(state.mean + margin, 0, 1),
  ];
}

export default scoreTraits;
