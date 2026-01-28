/**
 * @subtaste/core - Signal Type Definitions
 *
 * Signals are the inputs that shape a TasteGenome.
 * Three types: explicit feedback, intentional implicit, unintentional implicit.
 */

import type { Designation } from './archetype';

/**
 * Signal classification
 */
export type SignalType = 'explicit' | 'intentional_implicit' | 'unintentional_implicit';

/**
 * Sources of signals
 */
export type SignalSource =
  | 'quiz'           // Initial profiling quiz
  | 'calibration'    // Follow-up calibration
  | 'swipe'          // Swipe interactions
  | 'feed'           // Feed engagement
  | 'content'        // Content interaction
  | 'refyn'          // Refyn extension
  | 'selectr'        // SELECTR app
  | 'dropr'          // DROPR app
  | 'canora'         // CANORA app
  | 'external'       // External API
  | 'api'            // Direct API submission
  | 'migration';     // Migration from legacy system

/**
 * Explicit signal types
 */
export type ExplicitKind = 'rating' | 'choice' | 'likert' | 'block' | 'ranking' | 'preference' | 'comparison' | 'selection';

/**
 * Implicit signal types
 */
export type ImplicitKind = 'dwell' | 'skip' | 'repeat' | 'save' | 'share' | 'click';

/**
 * Explicit feedback signal
 */
export interface ExplicitSignal {
  kind: ExplicitKind;
  questionId?: string;
  itemId?: string;
  value: number | string | boolean | string[] | number[];
  archetypeWeights?: Partial<Record<Designation, number>>;
  metadata?: Record<string, unknown>;
}

/**
 * Implicit behavioural signal
 */
export interface ImplicitSignal {
  kind: ImplicitKind;
  itemId: string;
  duration?: number;
  context?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Base signal structure
 */
export interface Signal {
  type: SignalType;
  source: SignalSource;
  timestamp: Date;
  data: ExplicitSignal | ImplicitSignal;
}

/**
 * Signal event with ID for storage
 */
export interface SignalEvent extends Signal {
  id: string;
  userId: string;
  processed: boolean;
  processedAt?: Date;
}

/**
 * Signal batch for bulk processing
 */
export interface SignalBatch {
  userId: string;
  signals: Signal[];
  source: SignalSource;
  batchId: string;
}

/**
 * Type guard for explicit signals
 */
export function isExplicitSignal(data: ExplicitSignal | ImplicitSignal): data is ExplicitSignal {
  return 'kind' in data && ['rating', 'choice', 'likert', 'block', 'ranking', 'preference', 'comparison', 'selection'].includes(data.kind as string);
}

/**
 * Type guard for implicit signals
 */
export function isImplicitSignal(data: ExplicitSignal | ImplicitSignal): data is ImplicitSignal {
  return 'kind' in data && ['dwell', 'skip', 'repeat', 'save', 'share', 'click'].includes(data.kind as string);
}

/**
 * Signal weights for scoring
 */
export const SIGNAL_WEIGHTS: Record<ExplicitKind | ImplicitKind, number> = {
  // Explicit signals - higher weight
  rating: 1.0,
  choice: 1.0,
  likert: 0.8,
  block: 1.5,     // Negative signal, strong weight
  ranking: 1.2,
  preference: 1.0,
  comparison: 0.9,
  selection: 0.8,

  // Implicit signals - lower weight, accumulates
  dwell: 0.3,
  skip: 0.4,      // Negative signal
  repeat: 0.5,
  save: 0.6,
  share: 0.7,
  click: 0.2
} as const;
