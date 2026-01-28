/**
 * @subtaste/core
 *
 * Unified taste genome infrastructure for the VIOLET SPHINX ecosystem.
 *
 * THE TWELVE carry three registers of identity:
 * - Designation: Alphanumeric (internal, classified, power users)
 * - Glyph: The spoken name (public, identity, what users claim)
 * - Sigil: Formal notation (revealed on request, adds mystique)
 */

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Archetype types
  Designation,
  Glyph,
  Sigil,
  CreativeMode,
  ArchetypePublic,
  ArchetypeClassification,
  SigilReveal,

  // Genome types
  OpennessFacets,
  MusicPreferences,
  Psychometrics,
  ContextProfile,
  Domain,
  TasteGenome,
  TasteGenomePublic,
  GenomeCreateInput,
  GenomeUpdateInput,

  // Signal types
  SignalType,
  SignalSource,
  ExplicitKind,
  ImplicitKind,
  ExplicitSignal,
  ImplicitSignal,
  Signal,
  SignalEvent,
  SignalBatch
} from './types';

export {
  ALL_DESIGNATIONS,
  GLYPH_TO_DESIGNATION,
  DESIGNATION_TO_GLYPH,
  isExplicitSignal,
  isImplicitSignal,
  SIGNAL_WEIGHTS
} from './types';

// ============================================================================
// PANTHEON
// ============================================================================

export {
  PANTHEON,
  getArchetype,
  getArchetypeByGlyph,
  getArchetypeBySigil,
  toGlyph,
  toDesignation,
  toSigil,
  getAllDesignations,
  getAllGlyphs,
  ARCHETYPE_DESCRIPTIONS,
  getDescription,
  generateIdentityStatement
} from './pantheon';

export type {
  ArchetypeDefinition,
  ArchetypeDescription
} from './pantheon';

// ============================================================================
// ENGINE
// ============================================================================

export {
  classify,
  classifySignals,
  reclassify,
  getDefaultPsychometrics,
  applyTraitDeltas,
  extractTraitDeltas,
  calculatePsychometricSimilarity,
  calculateAllSimilarities,
  DEFAULT_SCORING_CONFIG,
  CONTEXT_WEIGHTS,
  mergeConfig,
  getContextConfig
} from './engine';

export type {
  ClassificationInput,
  ClassificationResult,
  TraitDelta,
  ScoringConfig
} from './engine';

// ============================================================================
// GENOME
// ============================================================================

export {
  generateGenomeId,
  createGenome,
  toPublicGenome,
  revealSigil,
  getPrimarySigil,
  incrementVersion,
  validateGenome,
  serializeGenome,
  deserializeGenome,
  encodeSignalsToGenome,
  updateGenomeWithSignals,
  mergeGenomes,
  calculateGenomeSimilarity,
  needsRecalibration,
  applyTemporalDecay,
  detectPreferenceDrift,
  calculateHistoricalConfidence,
  pruneSignalHistory,
  calculateTasteStability,
  evolveGenome,
  DEFAULT_EVOLUTION_CONFIG
} from './genome';

export type { EvolutionConfig } from './genome';

// ============================================================================
// CONTEXT
// ============================================================================

export {
  createContextProfile,
  getOrCreateContext,
  updateContext,
  getContextualDistribution,
  getContextualPrimary,
  detectContext,
  getActiveContexts
} from './context';

export type { StandardContext, ContextDetection } from './context';
