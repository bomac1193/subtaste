/**
 * @subtaste/core - Multi-Context Profile Management
 *
 * Spotify-style contextual vectors: different taste profiles
 * for Creating, Consuming, Curating modes.
 */

import type {
  TasteGenome,
  ContextProfile,
  Designation,
  Signal
} from '../types';
import { classify } from '../engine/classifier';
import { getContextConfig } from '../engine/weights';

/**
 * Standard context labels
 */
export type StandardContext = 'Creating' | 'Consuming' | 'Curating';

/**
 * Context detection result
 */
export interface ContextDetection {
  context: string;
  confidence: number;
  signals: string[];
}

/**
 * Create a new context profile
 */
export function createContextProfile(
  label: string,
  baseGenome: TasteGenome
): ContextProfile {
  return {
    id: `context_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    label,
    archetypeShift: {},
    lastActive: new Date()
  };
}

/**
 * Get or create a context profile
 */
export function getOrCreateContext(
  genome: TasteGenome,
  label: string
): { genome: TasteGenome; context: ContextProfile } {
  const existing = genome.behaviour.contexts[label];

  if (existing) {
    return {
      genome,
      context: {
        ...existing,
        lastActive: new Date()
      }
    };
  }

  const newContext = createContextProfile(label, genome);

  return {
    genome: {
      ...genome,
      behaviour: {
        ...genome.behaviour,
        contexts: {
          ...genome.behaviour.contexts,
          [label]: newContext
        }
      },
      updatedAt: new Date()
    },
    context: newContext
  };
}

/**
 * Update a context profile with new signals
 */
export function updateContext(
  genome: TasteGenome,
  contextLabel: string,
  signals: Signal[]
): TasteGenome {
  const config = getContextConfig(contextLabel);
  const result = classify({ signals, config });

  // Calculate shift from base distribution
  const shift: Partial<Record<Designation, number>> = {};

  for (const [designation, weight] of Object.entries(result.classification.distribution)) {
    const d = designation as Designation;
    const baseWeight = genome.archetype.distribution[d] || 0;
    const delta = weight - baseWeight;

    if (Math.abs(delta) > 0.05) {
      shift[d] = delta;
    }
  }

  const updatedContext: ContextProfile = {
    ...(genome.behaviour.contexts[contextLabel] || createContextProfile(contextLabel, genome)),
    archetypeShift: shift,
    lastActive: new Date()
  };

  return {
    ...genome,
    behaviour: {
      ...genome.behaviour,
      contexts: {
        ...genome.behaviour.contexts,
        [contextLabel]: updatedContext
      }
    },
    updatedAt: new Date()
  };
}

/**
 * Get effective distribution for a specific context
 */
export function getContextualDistribution(
  genome: TasteGenome,
  contextLabel: string
): Record<Designation, number> {
  const context = genome.behaviour.contexts[contextLabel];

  if (!context) {
    return genome.archetype.distribution;
  }

  // Apply shift to base distribution
  const result: Record<Designation, number> = { ...genome.archetype.distribution };

  for (const [designation, delta] of Object.entries(context.archetypeShift)) {
    const d = designation as Designation;
    result[d] = Math.max(0, Math.min(1, (result[d] || 0) + (delta || 0)));
  }

  // Renormalise
  const total = Object.values(result).reduce((a, b) => a + b, 0);
  for (const d of Object.keys(result)) {
    result[d as Designation] = result[d as Designation] / total;
  }

  return result;
}

/**
 * Get primary archetype for a specific context
 */
export function getContextualPrimary(
  genome: TasteGenome,
  contextLabel: string
): { designation: Designation; confidence: number } {
  const distribution = getContextualDistribution(genome, contextLabel);

  const sorted = Object.entries(distribution)
    .sort(([, a], [, b]) => b - a);

  return {
    designation: sorted[0][0] as Designation,
    confidence: sorted[0][1]
  };
}

/**
 * Detect likely context from signals
 */
export function detectContext(signals: Signal[]): ContextDetection {
  const indicators = {
    Creating: 0,
    Consuming: 0,
    Curating: 0
  };

  const detectedSignals: string[] = [];

  for (const signal of signals) {
    // Check source
    if (signal.source === 'refyn') {
      indicators.Creating += 2;
      detectedSignals.push('refyn-source');
    }

    // Check signal type
    if (signal.type === 'explicit') {
      indicators.Curating += 1;
    } else if (signal.type === 'unintentional_implicit') {
      indicators.Consuming += 1;
    }

    // Check data if available
    if ('kind' in signal.data) {
      if (signal.data.kind === 'save' || signal.data.kind === 'rating') {
        indicators.Curating += 1;
        detectedSignals.push('curation-action');
      } else if (signal.data.kind === 'dwell' || signal.data.kind === 'repeat') {
        indicators.Consuming += 1;
        detectedSignals.push('consumption-action');
      }
    }
  }

  // Find highest indicator
  const sorted = Object.entries(indicators)
    .sort(([, a], [, b]) => b - a);

  const total = Object.values(indicators).reduce((a, b) => a + b, 1);

  return {
    context: sorted[0][0],
    confidence: sorted[0][1] / total,
    signals: detectedSignals
  };
}

/**
 * Get all active contexts for a genome
 */
export function getActiveContexts(genome: TasteGenome): ContextProfile[] {
  return Object.values(genome.behaviour.contexts)
    .filter(c => {
      const daysSinceActive = (Date.now() - new Date(c.lastActive).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceActive < 30;
    })
    .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
}
