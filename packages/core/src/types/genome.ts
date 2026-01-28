/**
 * @subtaste/core - TasteGenome Type Definitions
 *
 * The TasteGenome is the complete taste profile for a user.
 * It contains public, semi-private, and engine-only layers.
 */

import type { Designation, Glyph, Sigil, ArchetypeClassification } from './archetype';
import type { SignalEvent } from './signals';

/**
 * Big Five Openness sub-facets
 * These are the strongest predictors of creative preferences
 */
export interface OpennessFacets {
  fantasy: number;      // Imagination and daydreaming
  aesthetics: number;   // Appreciation of art and beauty
  feelings: number;     // Receptiveness to inner feelings
  actions: number;      // Willingness to try new activities
  ideas: number;        // Intellectual curiosity
  values: number;       // Readiness to re-examine values
}

/**
 * MUSIC model dimensions
 * Music preference dimensions from research
 */
export interface MusicPreferences {
  mellow: number;        // Slow, quiet, romantic
  unpretentious: number; // Percussive, conventional
  sophisticated: number; // Complex, instrumental
  intense: number;       // Distorted, loud, aggressive
  contemporary: number;  // Rhythmic, electronic, urban
}

/**
 * Psychometric profile - hidden engine layer
 */
export interface Psychometrics {
  openness: OpennessFacets;
  intellect: number;
  musicPreferences: MusicPreferences;
}

/**
 * Context-specific profile (Spotify-style vectors)
 */
export interface ContextProfile {
  id: string;
  label: 'Creating' | 'Consuming' | 'Curating' | string;
  archetypeShift: Partial<Record<Designation, number>>;
  lastActive: Date;
}

/**
 * Domain for cross-modal scoring
 */
export type Domain = 'music' | 'visual' | 'textual' | 'spatial';

/**
 * Full TasteGenome structure
 */
export interface TasteGenome {
  // Identity
  id: string;
  userId: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;

  // PUBLIC LAYER - visible to user
  archetype: ArchetypeClassification;

  // SIGIL LAYER - revealed on request
  formal: {
    primarySigil: Sigil;
    secondarySigil: Sigil | null;
    revealed: boolean;
    revealedAt: Date | null;
  };

  // HIDDEN LAYER - powers the engine, never exposed to client
  _engine: {
    psychometrics: Psychometrics;
    sephiroticBalance: Record<string, number>;
    orishaResonance: {
      primary: string;
      shadow: string;
    };
  };

  // BEHAVIOURAL LAYER - evolves over time
  behaviour: {
    contexts: Record<string, ContextProfile>;
    signalHistory: SignalEvent[];
    confidence: number;
    lastCalibration: Date;
  };

  // CROSS-MODAL
  crossModal: {
    tasteTypicality: number;
    domainStrengths: Record<Domain, number>;
  };
}

/**
 * Public-safe genome representation
 * This is what gets sent to the client
 */
export interface TasteGenomePublic {
  id: string;
  userId: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  archetype: ArchetypeClassification;
  formal: {
    primarySigil: Sigil | null;
    secondarySigil: Sigil | null;
    revealed: boolean;
  };
  confidence: number;
  tasteTypicality: number;
}

/**
 * Genome creation input
 */
export interface GenomeCreateInput {
  userId: string;
  signals: SignalEvent[];
}

/**
 * Genome update input
 */
export interface GenomeUpdateInput {
  genomeId: string;
  signals: SignalEvent[];
  recalculate?: boolean;
}
