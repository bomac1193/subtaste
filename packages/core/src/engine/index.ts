/**
 * @subtaste/core/engine - Classification Engine Exports
 */

// Main classifier
export {
  classify,
  classifySignals,
  reclassify
} from './classifier';

export type {
  ClassificationInput,
  ClassificationResult
} from './classifier';

// Psychometrics
export {
  getDefaultPsychometrics,
  applyTraitDeltas,
  extractTraitDeltas,
  calculatePsychometricSimilarity,
  calculateAllSimilarities
} from './psychometrics';

export type { TraitDelta } from './psychometrics';

// Weights configuration
export {
  DEFAULT_SCORING_CONFIG,
  CONTEXT_WEIGHTS,
  mergeConfig,
  getContextConfig
} from './weights';

export type { ScoringConfig } from './weights';
