/**
 * @subtaste/core - Genome Encoder
 *
 * Transforms signals into TasteGenome updates.
 */

import type {
  TasteGenome,
  Signal,
  SignalEvent,
  Psychometrics
} from '../types';
import { classify, type ClassificationResult } from '../engine/classifier';
import { createGenome, incrementVersion } from './schema';

/**
 * Encode signals into a new TasteGenome
 */
export function encodeSignalsToGenome(
  userId: string,
  signals: Signal[]
): TasteGenome {
  const result = classify({ signals });

  return createGenome({
    userId,
    classification: {
      primary: {
        designation: result.classification.primary.designation,
        confidence: result.classification.primary.confidence
      },
      secondary: result.classification.secondary ? {
        designation: result.classification.secondary.designation,
        confidence: result.classification.secondary.confidence
      } : null,
      distribution: result.classification.distribution
    },
    psychometrics: result.psychometrics,
    sephiroticBalance: result.sephiroticBalance,
    orishaResonance: result.orishaResonance
  });
}

/**
 * Update an existing genome with new signals
 */
export function updateGenomeWithSignals(
  genome: TasteGenome,
  newSignals: Signal[]
): TasteGenome {
  // Combine existing psychometrics with new signals
  const result = classify({
    signals: newSignals,
    existingPsychometrics: genome._engine.psychometrics
  });

  const now = new Date();

  // Convert signals to signal events
  const signalEvents: SignalEvent[] = newSignals.map((signal, index) => ({
    ...signal,
    id: `signal_${Date.now()}_${index}`,
    userId: genome.userId,
    processed: true,
    processedAt: now
  }));

  return {
    ...genome,
    version: genome.version + 1,
    updatedAt: now,

    archetype: result.classification,

    _engine: {
      ...genome._engine,
      psychometrics: result.psychometrics,
      sephiroticBalance: result.sephiroticBalance,
      orishaResonance: result.orishaResonance
    },

    behaviour: {
      ...genome.behaviour,
      signalHistory: [...genome.behaviour.signalHistory, ...signalEvents].slice(-1000), // Keep last 1000
      confidence: result.classification.primary.confidence,
      lastCalibration: now
    }
  };
}

/**
 * Merge two genomes (for combining profiles from different sources)
 */
export function mergeGenomes(
  primary: TasteGenome,
  secondary: TasteGenome,
  weight = 0.5
): TasteGenome {
  // Combine distributions
  const mergedDistribution: Record<string, number> = {};

  for (const [key, value] of Object.entries(primary.archetype.distribution)) {
    mergedDistribution[key] = value * (1 - weight);
  }

  for (const [key, value] of Object.entries(secondary.archetype.distribution)) {
    mergedDistribution[key] = (mergedDistribution[key] || 0) + value * weight;
  }

  // Normalise
  const total = Object.values(mergedDistribution).reduce((a, b) => a + b, 0);
  for (const key of Object.keys(mergedDistribution)) {
    mergedDistribution[key] /= total;
  }

  // Merge psychometrics
  const mergedPsycho = mergePsychometrics(
    primary._engine.psychometrics,
    secondary._engine.psychometrics,
    weight
  );

  // Re-classify with merged data
  const result = classify({
    signals: [],
    existingPsychometrics: mergedPsycho
  });

  return {
    ...primary,
    version: primary.version + 1,
    updatedAt: new Date(),
    archetype: result.classification,
    _engine: {
      ...primary._engine,
      psychometrics: mergedPsycho,
      sephiroticBalance: result.sephiroticBalance,
      orishaResonance: result.orishaResonance
    },
    behaviour: {
      ...primary.behaviour,
      signalHistory: [
        ...primary.behaviour.signalHistory,
        ...secondary.behaviour.signalHistory
      ].slice(-1000),
      lastCalibration: new Date()
    }
  };
}

/**
 * Merge two psychometric profiles
 */
function mergePsychometrics(
  a: Psychometrics,
  b: Psychometrics,
  weight: number
): Psychometrics {
  const w1 = 1 - weight;
  const w2 = weight;

  return {
    openness: {
      fantasy: a.openness.fantasy * w1 + b.openness.fantasy * w2,
      aesthetics: a.openness.aesthetics * w1 + b.openness.aesthetics * w2,
      feelings: a.openness.feelings * w1 + b.openness.feelings * w2,
      actions: a.openness.actions * w1 + b.openness.actions * w2,
      ideas: a.openness.ideas * w1 + b.openness.ideas * w2,
      values: a.openness.values * w1 + b.openness.values * w2
    },
    intellect: a.intellect * w1 + b.intellect * w2,
    musicPreferences: {
      mellow: a.musicPreferences.mellow * w1 + b.musicPreferences.mellow * w2,
      unpretentious: a.musicPreferences.unpretentious * w1 + b.musicPreferences.unpretentious * w2,
      sophisticated: a.musicPreferences.sophisticated * w1 + b.musicPreferences.sophisticated * w2,
      intense: a.musicPreferences.intense * w1 + b.musicPreferences.intense * w2,
      contemporary: a.musicPreferences.contemporary * w1 + b.musicPreferences.contemporary * w2
    }
  };
}

/**
 * Calculate genome similarity between two profiles
 * Returns 0-1 score
 */
export function calculateGenomeSimilarity(
  a: TasteGenome,
  b: TasteGenome
): number {
  // Compare distributions using cosine similarity
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const key of Object.keys(a.archetype.distribution)) {
    const valA = a.archetype.distribution[key as keyof typeof a.archetype.distribution] || 0;
    const valB = b.archetype.distribution[key as keyof typeof b.archetype.distribution] || 0;

    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
