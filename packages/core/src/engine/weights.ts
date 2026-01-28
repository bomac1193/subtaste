/**
 * @subtaste/core - Scoring Weight Configuration
 *
 * Configurable weights for the classification algorithm.
 * These can be tuned based on empirical performance.
 */

/**
 * Scoring configuration
 */
export interface ScoringConfig {
  // Softmax temperature (higher = more even distribution)
  temperature: number;

  // Minimum confidence threshold for secondary archetype
  secondaryThreshold: number;

  // Minimum weight to include in distribution
  distributionThreshold: number;

  // Weight multipliers for different signal types
  signalWeights: {
    explicit: number;
    intentionalImplicit: number;
    unintentionalImplicit: number;
  };

  // Weight for psychometric similarity vs raw signal scores
  psychometricWeight: number;

  // Decay factor for older signals (per day)
  temporalDecay: number;
}

/**
 * Default scoring configuration
 */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  temperature: 5,
  secondaryThreshold: 0.15,
  distributionThreshold: 0.01,
  signalWeights: {
    explicit: 1.0,
    intentionalImplicit: 0.6,
    unintentionalImplicit: 0.3
  },
  psychometricWeight: 0.7,
  temporalDecay: 0.99
};

/**
 * Scoring weights by context
 * Different contexts may weight signals differently
 */
export const CONTEXT_WEIGHTS: Record<string, Partial<ScoringConfig>> = {
  Creating: {
    psychometricWeight: 0.8,
    signalWeights: {
      explicit: 1.0,
      intentionalImplicit: 0.4,
      unintentionalImplicit: 0.2
    }
  },
  Consuming: {
    psychometricWeight: 0.5,
    signalWeights: {
      explicit: 0.8,
      intentionalImplicit: 0.8,
      unintentionalImplicit: 0.5
    }
  },
  Curating: {
    psychometricWeight: 0.6,
    signalWeights: {
      explicit: 1.0,
      intentionalImplicit: 0.7,
      unintentionalImplicit: 0.3
    }
  }
};

/**
 * Merge scoring config with overrides
 */
export function mergeConfig(
  base: ScoringConfig,
  overrides: Partial<ScoringConfig>
): ScoringConfig {
  return {
    ...base,
    ...overrides,
    signalWeights: {
      ...base.signalWeights,
      ...overrides.signalWeights
    }
  };
}

/**
 * Get scoring config for a context
 */
export function getContextConfig(context: string): ScoringConfig {
  const overrides = CONTEXT_WEIGHTS[context] || {};
  return mergeConfig(DEFAULT_SCORING_CONFIG, overrides);
}
