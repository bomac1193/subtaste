/**
 * Superfan Conversion Probability (SCP) System
 *
 * Predicts which listeners will become superfans based on:
 * - Taste coherence (constellation alignment)
 * - Depth signals (engagement behaviors)
 * - Return patterns (organic vs algorithmic visits)
 */

// Types
export * from './types';

// Calculator
export {
  calculateSCP,
  isScoreStale,
  getClassificationColor,
  getClassificationLabel,
} from './calculator';

// Tracker
export {
  trackDepthSignal,
  trackDepthSignalBatch,
  checkCatalogDeepDive,
  trackSession,
  endSession,
  getOrCalculateSCP,
  getCreatorDashboardStats,
  updateCreatorStats,
} from './tracker';
