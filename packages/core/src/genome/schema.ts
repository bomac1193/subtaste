/**
 * @subtaste/core - TasteGenome Schema Operations
 *
 * Functions for creating, validating, and transforming TasteGenome objects.
 */

import type {
  TasteGenome,
  TasteGenomePublic,
  Designation,
  Glyph,
  Sigil,
  Psychometrics,
  ContextProfile,
  Domain
} from '../types';
import { toSigil, toGlyph } from '../pantheon/definitions';

/**
 * Generate a unique genome ID
 */
export function generateGenomeId(): string {
  return `genome_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new TasteGenome from classification results
 */
export function createGenome(params: {
  userId: string;
  classification: {
    primary: { designation: Designation; confidence: number };
    secondary: { designation: Designation; confidence: number } | null;
    distribution: Record<Designation, number>;
  };
  psychometrics: Psychometrics;
  sephiroticBalance: Record<string, number>;
  orishaResonance: { primary: string; shadow: string };
}): TasteGenome {
  const now = new Date();

  return {
    id: generateGenomeId(),
    userId: params.userId,
    version: 1,
    createdAt: now,
    updatedAt: now,

    archetype: {
      primary: {
        designation: params.classification.primary.designation,
        glyph: toGlyph(params.classification.primary.designation),
        confidence: params.classification.primary.confidence
      },
      secondary: params.classification.secondary ? {
        designation: params.classification.secondary.designation,
        glyph: toGlyph(params.classification.secondary.designation),
        confidence: params.classification.secondary.confidence
      } : null,
      distribution: params.classification.distribution
    },

    formal: {
      primarySigil: toSigil(params.classification.primary.designation),
      secondarySigil: params.classification.secondary
        ? toSigil(params.classification.secondary.designation)
        : null,
      revealed: false,
      revealedAt: null
    },

    _engine: {
      psychometrics: params.psychometrics,
      sephiroticBalance: params.sephiroticBalance,
      orishaResonance: params.orishaResonance
    },

    behaviour: {
      contexts: {},
      signalHistory: [],
      confidence: params.classification.primary.confidence,
      lastCalibration: now
    },

    crossModal: {
      tasteTypicality: 0.5, // Default, will be computed with more data
      domainStrengths: {
        music: 0.5,
        visual: 0.5,
        textual: 0.5,
        spatial: 0.5
      }
    }
  };
}

/**
 * Convert a TasteGenome to its public representation
 * Strips all _engine data
 */
export function toPublicGenome(genome: TasteGenome): TasteGenomePublic {
  return {
    id: genome.id,
    userId: genome.userId,
    version: genome.version,
    createdAt: genome.createdAt,
    updatedAt: genome.updatedAt,
    archetype: genome.archetype,
    formal: {
      // Only include sigil if revealed
      primarySigil: genome.formal.revealed ? genome.formal.primarySigil : null,
      secondarySigil: genome.formal.revealed ? genome.formal.secondarySigil : null,
      revealed: genome.formal.revealed
    },
    confidence: genome.behaviour.confidence,
    tasteTypicality: genome.crossModal.tasteTypicality
  };
}

/**
 * Mark sigil as revealed
 */
export function revealSigil(genome: TasteGenome): TasteGenome {
  return {
    ...genome,
    formal: {
      ...genome.formal,
      revealed: true,
      revealedAt: new Date()
    },
    updatedAt: new Date()
  };
}

/**
 * Get the primary sigil (revealed or not based on state)
 */
export function getPrimarySigil(genome: TasteGenome, forceReveal = false): Sigil | null {
  if (forceReveal || genome.formal.revealed) {
    return genome.formal.primarySigil;
  }
  return null;
}

/**
 * Update genome version
 */
export function incrementVersion(genome: TasteGenome): TasteGenome {
  return {
    ...genome,
    version: genome.version + 1,
    updatedAt: new Date()
  };
}

/**
 * Validate a TasteGenome structure
 */
export function validateGenome(genome: unknown): genome is TasteGenome {
  if (typeof genome !== 'object' || genome === null) {
    return false;
  }

  const g = genome as Record<string, unknown>;

  return (
    typeof g.id === 'string' &&
    typeof g.userId === 'string' &&
    typeof g.version === 'number' &&
    g.archetype !== undefined &&
    g.formal !== undefined &&
    g._engine !== undefined &&
    g.behaviour !== undefined &&
    g.crossModal !== undefined
  );
}

/**
 * Serialize genome for storage (removes Date objects)
 */
export function serializeGenome(genome: TasteGenome): string {
  return JSON.stringify(genome, (_, value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  });
}

/**
 * Deserialize genome from storage
 */
export function deserializeGenome(json: string): TasteGenome {
  return JSON.parse(json, (key, value) => {
    if (key === 'createdAt' || key === 'updatedAt' || key === 'lastCalibration' || key === 'revealedAt' || key === 'lastActive') {
      return value ? new Date(value) : null;
    }
    return value;
  });
}

