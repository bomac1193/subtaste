/**
 * @subtaste/core - INTERNAL ENGINE MAPPINGS
 *
 * THIS FILE MUST NEVER BE BUNDLED FOR CLIENT
 * ONLY IMPORT IN SERVER-SIDE CODE
 *
 * Contains:
 * - Sephirotic correspondences
 * - Orisha resonances
 * - Psychometric weight profiles
 *
 * These power the classification engine but are never exposed to users.
 */

import type { Designation } from '../types';

/**
 * Sephirotic positions on the Tree of Life
 */
export type Sephirah =
  | 'Keter'     // Crown - divine will
  | 'Chokmah'   // Wisdom - creative force
  | 'Binah'     // Understanding - receptive intelligence
  | 'Chesed'    // Mercy - loving kindness
  | 'Geburah'   // Severity - strength and judgment
  | 'Tiferet'   // Beauty - harmony and balance
  | 'Netzach'   // Victory - endurance and desire
  | 'Hod'       // Splendour - intellect and form
  | 'Yesod'     // Foundation - connection and transmission
  | 'Malkuth'   // Kingdom - manifestation
  | 'Daat'      // Knowledge - hidden sephirah
  | 'AinSoph';  // Limitless - beyond the tree

/**
 * Orisha correspondences
 */
export type Orisha =
  | 'Obatala'   // Creator, wisdom, purity
  | 'Ogun'      // Iron, war, labour, sacrifice
  | 'Orunmila'  // Wisdom, divination, destiny
  | 'Yemoja'    // Ocean, motherhood, fertility
  | 'Oshun'     // River, love, beauty, diplomacy
  | 'Shango'    // Thunder, justice, dance
  | 'Elegua'    // Crossroads, beginnings, communication
  | 'Eshu';     // Trickster, chaos, transformation

/**
 * Psychometric weight profile per archetype
 * These determine how traits map to archetype affinity
 */
export interface PsychometricWeights {
  // Big Five Openness facets
  openness: number;      // General openness to experience
  intellect: number;     // Intellectual curiosity

  // MUSIC model dimensions
  mellow: number;
  unpretentious: number;
  sophisticated: number;
  intense: number;
  contemporary: number;
}

/**
 * Complete internal mapping for an archetype
 */
export interface InternalMapping {
  sephirah: Sephirah;
  orisha: Orisha;
  shadowOrisha: Orisha;
  psychometricWeights: PsychometricWeights;
}

/**
 * INTERNAL MAPPINGS - THE HIDDEN LAYER
 *
 * These correspondences inform the classification engine:
 * - Sephirotic position determines structural relationships
 * - Orisha resonance provides energetic signature
 * - Shadow Orisha indicates the archetype's danger zone
 * - Psychometric weights map traits to archetype affinity
 */
export const INTERNAL_MAPPINGS: Record<Designation, InternalMapping> = {
  'S-0': {
    // KETH - The unmarked throne
    sephirah: 'Keter',
    orisha: 'Obatala',
    shadowOrisha: 'Eshu',
    psychometricWeights: {
      openness: 0.9,
      intellect: 0.7,
      mellow: 0.3,
      unpretentious: 0.1,
      sophisticated: 0.9,
      intense: 0.4,
      contemporary: 0.5
    }
  },

  'T-1': {
    // STRATA - The hidden architecture
    sephirah: 'Chokmah',
    orisha: 'Ogun',
    shadowOrisha: 'Obatala',
    psychometricWeights: {
      openness: 0.7,
      intellect: 0.95,
      mellow: 0.2,
      unpretentious: 0.3,
      sophisticated: 0.8,
      intense: 0.5,
      contemporary: 0.6
    }
  },

  'V-2': {
    // OMEN - What arrives before itself
    sephirah: 'Binah',
    orisha: 'Orunmila',
    shadowOrisha: 'Elegua',
    psychometricWeights: {
      openness: 0.95,
      intellect: 0.6,
      mellow: 0.4,
      unpretentious: 0.2,
      sophisticated: 0.85,
      intense: 0.5,
      contemporary: 0.8
    }
  },

  'L-3': {
    // SILT - Patient sediment
    sephirah: 'Chesed',
    orisha: 'Yemoja',
    shadowOrisha: 'Ogun',
    psychometricWeights: {
      openness: 0.7,
      intellect: 0.5,
      mellow: 0.8,
      unpretentious: 0.6,
      sophisticated: 0.5,
      intense: 0.2,
      contemporary: 0.4
    }
  },

  'C-4': {
    // CULL - The necessary cut
    sephirah: 'Geburah',
    orisha: 'Ogun',
    shadowOrisha: 'Yemoja',
    psychometricWeights: {
      openness: 0.6,
      intellect: 0.8,
      mellow: 0.1,
      unpretentious: 0.2,
      sophisticated: 0.7,
      intense: 0.8,
      contemporary: 0.5
    }
  },

  'N-5': {
    // LIMN - To illuminate by edge
    sephirah: 'Tiferet',
    orisha: 'Oshun',
    shadowOrisha: 'Shango',
    psychometricWeights: {
      openness: 0.8,
      intellect: 0.6,
      mellow: 0.5,
      unpretentious: 0.5,
      sophisticated: 0.7,
      intense: 0.5,
      contemporary: 0.5
    }
  },

  'H-6': {
    // TOLL - The bell that cannot be unheard
    sephirah: 'Netzach',
    orisha: 'Shango',
    shadowOrisha: 'Oshun',
    psychometricWeights: {
      openness: 0.8,
      intellect: 0.4,
      mellow: 0.2,
      unpretentious: 0.4,
      sophisticated: 0.5,
      intense: 0.9,
      contemporary: 0.7
    }
  },

  'P-7': {
    // VAULT - What is kept
    sephirah: 'Hod',
    orisha: 'Orunmila',
    shadowOrisha: 'Elegua',
    psychometricWeights: {
      openness: 0.75,
      intellect: 0.9,
      mellow: 0.6,
      unpretentious: 0.3,
      sophisticated: 0.9,
      intense: 0.3,
      contemporary: 0.3
    }
  },

  'D-8': {
    // WICK - Draws flame upward without burning
    sephirah: 'Yesod',
    orisha: 'Elegua',
    shadowOrisha: 'Orunmila',
    psychometricWeights: {
      openness: 0.9,
      intellect: 0.4,
      mellow: 0.5,
      unpretentious: 0.5,
      sophisticated: 0.6,
      intense: 0.6,
      contemporary: 0.7
    }
  },

  'F-9': {
    // ANVIL - Where pressure becomes form
    sephirah: 'Malkuth',
    orisha: 'Ogun',
    shadowOrisha: 'Obatala',
    psychometricWeights: {
      openness: 0.5,
      intellect: 0.7,
      mellow: 0.3,
      unpretentious: 0.7,
      sophisticated: 0.4,
      intense: 0.6,
      contemporary: 0.6
    }
  },

  'R-10': {
    // SCHISM - The productive fracture
    sephirah: 'Daat',
    orisha: 'Eshu',
    shadowOrisha: 'Obatala',
    psychometricWeights: {
      openness: 0.85,
      intellect: 0.7,
      mellow: 0.1,
      unpretentious: 0.3,
      sophisticated: 0.6,
      intense: 0.9,
      contemporary: 0.8
    }
  },

  'Ø': {
    // VOID - The deliberate absence
    sephirah: 'AinSoph',
    orisha: 'Obatala',
    shadowOrisha: 'Eshu',
    psychometricWeights: {
      openness: 0.95,
      intellect: 0.5,
      mellow: 0.7,
      unpretentious: 0.6,
      sophisticated: 0.6,
      intense: 0.3,
      contemporary: 0.4
    }
  }
} as const;

/**
 * Get internal mapping for a designation
 * THIS SHOULD ONLY BE CALLED FROM SERVER-SIDE CODE
 */
export function getInternalMapping(designation: Designation): InternalMapping {
  return INTERNAL_MAPPINGS[designation];
}

/**
 * Get psychometric weights for a designation
 */
export function getPsychometricWeights(designation: Designation): PsychometricWeights {
  return INTERNAL_MAPPINGS[designation].psychometricWeights;
}

/**
 * Get sephirah for a designation
 */
export function getSephirah(designation: Designation): Sephirah {
  return INTERNAL_MAPPINGS[designation].sephirah;
}

/**
 * Get orisha correspondences for a designation
 */
export function getOrishaResonance(designation: Designation): { primary: Orisha; shadow: Orisha } {
  const mapping = INTERNAL_MAPPINGS[designation];
  return {
    primary: mapping.orisha,
    shadow: mapping.shadowOrisha
  };
}

/**
 * Calculate sephirotic balance from archetype distribution
 * Returns a map of sephirah to weighted presence
 */
export function calculateSephiroticBalance(
  distribution: Record<Designation, number>
): Record<Sephirah, number> {
  const balance: Record<Sephirah, number> = {
    Keter: 0,
    Chokmah: 0,
    Binah: 0,
    Chesed: 0,
    Geburah: 0,
    Tiferet: 0,
    Netzach: 0,
    Hod: 0,
    Yesod: 0,
    Malkuth: 0,
    Daat: 0,
    AinSoph: 0
  };

  for (const [designation, weight] of Object.entries(distribution)) {
    const sephirah = INTERNAL_MAPPINGS[designation as Designation].sephirah;
    balance[sephirah] += weight;
  }

  return balance;
}
