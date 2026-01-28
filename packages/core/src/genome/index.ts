/**
 * @subtaste/core/genome - Genome Operations Exports
 */

// Schema operations
export {
  generateGenomeId,
  createGenome,
  toPublicGenome,
  revealSigil,
  getPrimarySigil,
  incrementVersion,
  validateGenome,
  serializeGenome,
  deserializeGenome
} from './schema';

// Encoding
export {
  encodeSignalsToGenome,
  updateGenomeWithSignals,
  mergeGenomes,
  calculateGenomeSimilarity
} from './encoder';

// Evolution
export {
  needsRecalibration,
  applyTemporalDecay,
  detectPreferenceDrift,
  calculateHistoricalConfidence,
  pruneSignalHistory,
  calculateTasteStability,
  evolveGenome,
  DEFAULT_EVOLUTION_CONFIG
} from './evolution';

export type { EvolutionConfig } from './evolution';
