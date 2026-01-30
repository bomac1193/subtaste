/**
 * @subtaste/core - Psychometric Scoring
 *
 * Computes psychometric profiles from signals.
 * Uses Big Five Openness sub-facets and MUSIC model.
 */

import type {
  Designation,
  OpennessFacets,
  MusicPreferences,
  Psychometrics,
  Signal,
  ExplicitSignal
} from '../types';
import { isExplicitSignal, ALL_DESIGNATIONS } from '../types';
import { INTERNAL_MAPPINGS, normalizePsychometricWeights } from '../pantheon/internal';

/**
 * Default psychometric profile (neutral starting point)
 */
export function getDefaultPsychometrics(): Psychometrics {
  return {
    openness: {
      fantasy: 0.5,
      aesthetics: 0.5,
      feelings: 0.5,
      actions: 0.5,
      ideas: 0.5,
      values: 0.5
    },
    intellect: 0.5,
    musicPreferences: {
      mellow: 0.5,
      unpretentious: 0.5,
      sophisticated: 0.5,
      intense: 0.5,
      contemporary: 0.5
    }
  };
}

/**
 * Trait adjustments from quiz responses
 * Maps question responses to psychometric deltas
 */
export interface TraitDelta {
  openness?: Partial<OpennessFacets>;
  intellect?: number;
  musicPreferences?: Partial<MusicPreferences>;
}

/**
 * Apply trait deltas to a psychometric profile
 */
export function applyTraitDeltas(
  base: Psychometrics,
  deltas: TraitDelta[]
): Psychometrics {
  const result = structuredClone(base);

  for (const delta of deltas) {
    // Apply openness facet deltas
    if (delta.openness) {
      for (const [facet, value] of Object.entries(delta.openness)) {
        const key = facet as keyof OpennessFacets;
        result.openness[key] = clamp(result.openness[key] + value, 0, 1);
      }
    }

    // Apply intellect delta
    if (delta.intellect !== undefined) {
      result.intellect = clamp(result.intellect + delta.intellect, 0, 1);
    }

    // Apply music preference deltas
    if (delta.musicPreferences) {
      for (const [pref, value] of Object.entries(delta.musicPreferences)) {
        const key = pref as keyof MusicPreferences;
        result.musicPreferences[key] = clamp(result.musicPreferences[key] + value, 0, 1);
      }
    }
  }

  return result;
}

/**
 * Extract trait deltas from explicit signals (quiz answers)
 */
export function extractTraitDeltas(signals: Signal[]): TraitDelta[] {
  const deltas: TraitDelta[] = [];

  for (const signal of signals) {
    if (signal.type !== 'explicit' || !isExplicitSignal(signal.data)) {
      continue;
    }

    const explicit = signal.data as ExplicitSignal;

    // If the signal has archetype weights, convert to psychometric deltas
    if (explicit.archetypeWeights) {
      const delta = archetypeWeightsToPsychometricDelta(explicit.archetypeWeights);
      deltas.push(delta);
    }
  }

  return deltas;
}

/**
 * Convert archetype weights from a question to psychometric deltas
 * Uses internal mappings to determine which traits to adjust
 */
function archetypeWeightsToPsychometricDelta(
  weights: Partial<Record<Designation, number>>
): TraitDelta {
  const delta: TraitDelta = {
    openness: {},
    intellect: 0,
    musicPreferences: {}
  };

  for (const [designation, weight] of Object.entries(weights)) {
    const d = designation as Designation;
    const rawWeights = INTERNAL_MAPPINGS[d].psychometricWeights;
    const psycho = normalizePsychometricWeights(rawWeights);
    const isLegacyScalar = typeof rawWeights.openness === 'number';

    // Scale by the question weight
    const scale = weight * 0.1; // Small increments per question

    // Adjust openness (general openness affects all facets slightly)
    if (isLegacyScalar) {
      const opennessAdjust = (psycho.openness.aesthetics - 0.5) * scale;
      delta.openness!.fantasy = (delta.openness!.fantasy || 0) + opennessAdjust * 0.8;
      delta.openness!.aesthetics = (delta.openness!.aesthetics || 0) + opennessAdjust;
      delta.openness!.feelings = (delta.openness!.feelings || 0) + opennessAdjust * 0.6;
      delta.openness!.actions = (delta.openness!.actions || 0) + opennessAdjust * 0.4;
      delta.openness!.ideas = (delta.openness!.ideas || 0) + opennessAdjust * 0.7;
      delta.openness!.values = (delta.openness!.values || 0) + opennessAdjust * 0.5;
    } else {
      delta.openness!.fantasy = (delta.openness!.fantasy || 0) + (psycho.openness.fantasy - 0.5) * scale;
      delta.openness!.aesthetics = (delta.openness!.aesthetics || 0) + (psycho.openness.aesthetics - 0.5) * scale;
      delta.openness!.feelings = (delta.openness!.feelings || 0) + (psycho.openness.feelings - 0.5) * scale;
      delta.openness!.actions = (delta.openness!.actions || 0) + (psycho.openness.actions - 0.5) * scale;
      delta.openness!.ideas = (delta.openness!.ideas || 0) + (psycho.openness.ideas - 0.5) * scale;
      delta.openness!.values = (delta.openness!.values || 0) + (psycho.openness.values - 0.5) * scale;
    }

    // Adjust intellect
    delta.intellect = (delta.intellect || 0) + (psycho.intellect - 0.5) * scale;

    // Adjust music preferences
    delta.musicPreferences!.mellow = (delta.musicPreferences!.mellow || 0) + (psycho.music.mellow - 0.5) * scale;
    delta.musicPreferences!.unpretentious = (delta.musicPreferences!.unpretentious || 0) + (psycho.music.unpretentious - 0.5) * scale;
    delta.musicPreferences!.sophisticated = (delta.musicPreferences!.sophisticated || 0) + (psycho.music.sophisticated - 0.5) * scale;
    delta.musicPreferences!.intense = (delta.musicPreferences!.intense || 0) + (psycho.music.intense - 0.5) * scale;
    delta.musicPreferences!.contemporary = (delta.musicPreferences!.contemporary || 0) + (psycho.music.contemporary - 0.5) * scale;
  }

  return delta;
}

/**
 * Calculate psychometric similarity to an archetype
 * Returns 0-1 score of how well a profile matches the archetype
 */
export function calculatePsychometricSimilarity(
  profile: Psychometrics,
  designation: Designation
): number {
  const rawWeights = INTERNAL_MAPPINGS[designation].psychometricWeights;
  const target = normalizePsychometricWeights(rawWeights);

  // Calculate distance for each dimension
  const distances: number[] = [];

  if (typeof rawWeights.openness === 'number') {
    const avgOpenness = Object.values(profile.openness).reduce((a, b) => a + b, 0) / 6;
    distances.push(Math.abs(avgOpenness - target.openness.aesthetics));
  } else {
    distances.push(Math.abs(profile.openness.fantasy - target.openness.fantasy));
    distances.push(Math.abs(profile.openness.aesthetics - target.openness.aesthetics));
    distances.push(Math.abs(profile.openness.feelings - target.openness.feelings));
    distances.push(Math.abs(profile.openness.actions - target.openness.actions));
    distances.push(Math.abs(profile.openness.ideas - target.openness.ideas));
    distances.push(Math.abs(profile.openness.values - target.openness.values));
  }

  // Intellect
  distances.push(Math.abs(profile.intellect - target.intellect));

  // Music preferences
  distances.push(Math.abs(profile.musicPreferences.mellow - target.music.mellow));
  distances.push(Math.abs(profile.musicPreferences.unpretentious - target.music.unpretentious));
  distances.push(Math.abs(profile.musicPreferences.sophisticated - target.music.sophisticated));
  distances.push(Math.abs(profile.musicPreferences.intense - target.music.intense));
  distances.push(Math.abs(profile.musicPreferences.contemporary - target.music.contemporary));

  // Average distance, inverted to similarity
  const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
  return 1 - avgDistance;
}

/**
 * Calculate similarity scores for all archetypes
 */
export function calculateAllSimilarities(
  profile: Psychometrics
): Record<Designation, number> {
  const scores: Record<Designation, number> = {} as Record<Designation, number>;

  for (const designation of ALL_DESIGNATIONS) {
    scores[designation] = calculatePsychometricSimilarity(profile, designation);
  }

  return scores;
}

/**
 * Utility: clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
