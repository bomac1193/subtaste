/**
 * @subtaste/profiler - Implicit Signal Processing
 *
 * Converts behavioural signals into archetype-weighted signals.
 */

import type { Signal, ImplicitSignal, Designation } from '@subtaste/core';

/**
 * Raw behavioural event
 */
export interface BehaviouralEvent {
  type: 'like' | 'dislike' | 'save' | 'skip' | 'dwell' | 'share' | 'repeat';
  itemId: string;
  itemMetadata?: ItemMetadata;
  duration?: number;
  context?: string;
  timestamp: Date;
}

/**
 * Item metadata for smarter signal interpretation
 */
export interface ItemMetadata {
  isObscure?: boolean;       // Low play count / niche
  isComplex?: boolean;       // High musical complexity
  isAggressive?: boolean;    // High energy / intensity
  isNostalgic?: boolean;     // Old / retro
  isExperimental?: boolean;  // Non-traditional
  source?: string;           // Where item came from
}

/**
 * Convert a behavioural event to a signal
 */
export function behaviourToSignal(event: BehaviouralEvent): Signal {
  const archetypeWeights = inferArchetypeWeights(event);

  const implicitSignal: ImplicitSignal = {
    kind: mapEventType(event.type),
    itemId: event.itemId,
    duration: event.duration,
    context: event.context,
    metadata: event.itemMetadata as Record<string, unknown> | undefined
  };

  return {
    type: event.type === 'skip' || event.type === 'dwell'
      ? 'unintentional_implicit'
      : 'intentional_implicit',
    source: 'content',
    timestamp: event.timestamp,
    data: {
      ...implicitSignal,
      archetypeWeights
    } as any
  };
}

/**
 * Map event type to signal kind
 */
function mapEventType(
  type: BehaviouralEvent['type']
): 'dwell' | 'skip' | 'repeat' | 'save' | 'share' | 'click' {
  switch (type) {
    case 'like': return 'click';
    case 'dislike': return 'skip';
    case 'save': return 'save';
    case 'skip': return 'skip';
    case 'dwell': return 'dwell';
    case 'share': return 'share';
    case 'repeat': return 'repeat';
  }
}

/**
 * Infer archetype weights from behavioural event
 */
function inferArchetypeWeights(
  event: BehaviouralEvent
): Partial<Record<Designation, number>> {
  const weights: Partial<Record<Designation, number>> = {};
  const meta = event.itemMetadata || {};
  const isPositive = ['like', 'save', 'share', 'repeat'].includes(event.type);
  const multiplier = isPositive ? 1 : -0.5;

  // Base weights from action type
  switch (event.type) {
    case 'save':
      weights['P-7'] = 0.3 * multiplier;  // VAULT - archival
      weights['L-3'] = 0.2 * multiplier;  // SILT - patient
      break;

    case 'share':
      weights['H-6'] = 0.4 * multiplier;  // TOLL - advocacy
      weights['F-9'] = 0.2 * multiplier;  // ANVIL - manifestation
      break;

    case 'repeat':
      weights['D-8'] = 0.3 * multiplier;  // WICK - channelling
      weights['L-3'] = 0.2 * multiplier;  // SILT - patient
      break;

    case 'skip':
      weights['C-4'] = 0.2;  // CULL - editorial (skipping = filtering)
      break;
  }

  // Metadata-based weights
  if (meta.isObscure && isPositive) {
    weights['V-2'] = (weights['V-2'] || 0) + 0.3;  // OMEN - early finder
    weights['S-0'] = (weights['S-0'] || 0) + 0.2;  // KETH - standard-setter
  }

  if (meta.isComplex && isPositive) {
    weights['T-1'] = (weights['T-1'] || 0) + 0.3;  // STRATA - architectural
    weights['P-7'] = (weights['P-7'] || 0) + 0.2;  // VAULT - archival
  }

  if (meta.isAggressive && isPositive) {
    weights['R-10'] = (weights['R-10'] || 0) + 0.3;  // SCHISM - contrarian
    weights['C-4'] = (weights['C-4'] || 0) + 0.2;   // CULL - editorial
    weights['H-6'] = (weights['H-6'] || 0) + 0.2;   // TOLL - advocacy
  }

  if (meta.isExperimental && isPositive) {
    weights['V-2'] = (weights['V-2'] || 0) + 0.2;   // OMEN
    weights['D-8'] = (weights['D-8'] || 0) + 0.2;   // WICK
    weights['R-10'] = (weights['R-10'] || 0) + 0.2; // SCHISM
  }

  if (meta.isNostalgic && isPositive) {
    weights['P-7'] = (weights['P-7'] || 0) + 0.3;  // VAULT
    weights['L-3'] = (weights['L-3'] || 0) + 0.2;  // SILT
  }

  // Dwell time interpretation
  if (event.type === 'dwell' && event.duration) {
    const seconds = event.duration / 1000;
    if (seconds > 180) {
      // Long dwell = patient, receptive
      weights['Ø'] = (weights['Ø'] || 0) + 0.2;    // VOID
      weights['L-3'] = (weights['L-3'] || 0) + 0.2; // SILT
    } else if (seconds < 10) {
      // Very short = editorial
      weights['C-4'] = (weights['C-4'] || 0) + 0.1; // CULL
    }
  }

  return weights;
}

/**
 * Batch convert behavioural events
 */
export function behaviourBatchToSignals(events: BehaviouralEvent[]): Signal[] {
  return events.map(behaviourToSignal);
}

/**
 * Calculate behavioural signal strength
 * Used to weight implicit signals relative to explicit ones
 */
export function calculateBehaviouralStrength(events: BehaviouralEvent[]): number {
  if (events.length === 0) return 0;

  const weights: Record<BehaviouralEvent['type'], number> = {
    repeat: 1.0,
    save: 0.9,
    share: 0.85,
    like: 0.7,
    dwell: 0.4,
    dislike: 0.5,
    skip: 0.3
  };

  let totalWeight = 0;
  for (const event of events) {
    totalWeight += weights[event.type];
  }

  // Normalise to 0-1 (assuming 50 strong signals = max)
  return Math.min(totalWeight / 50, 1);
}
