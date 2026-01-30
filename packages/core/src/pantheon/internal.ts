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

import type { Designation, OpennessFacets, MusicPreferences } from '../types';

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
  openness: OpennessFacets | number; // number is legacy compatibility
  intellect: number;

  // MUSIC model dimensions
  music?: MusicPreferences;

  // Legacy flat fields (deprecated, kept for compatibility)
  mellow?: number;
  unpretentious?: number;
  sophisticated?: number;
  intense?: number;
  contemporary?: number;
}

export interface NormalizedPsychometricWeights {
  openness: OpennessFacets;
  intellect: number;
  music: MusicPreferences;
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

function coerceOpennessFacets(value: OpennessFacets | number): OpennessFacets {
  if (typeof value === 'number') {
    return {
      aesthetics: value,
      fantasy: value,
      feelings: value,
      actions: value,
      ideas: value,
      values: value
    };
  }

  return {
    aesthetics: value.aesthetics ?? 0.5,
    fantasy: value.fantasy ?? 0.5,
    feelings: value.feelings ?? 0.5,
    actions: value.actions ?? 0.5,
    ideas: value.ideas ?? 0.5,
    values: value.values ?? 0.5
  };
}

export function normalizePsychometricWeights(weights: PsychometricWeights): NormalizedPsychometricWeights {
  const openness = coerceOpennessFacets(weights.openness);

  const music = weights.music ?? {
    mellow: weights.mellow ?? 0.5,
    unpretentious: weights.unpretentious ?? 0.5,
    sophisticated: weights.sophisticated ?? 0.5,
    intense: weights.intense ?? 0.5,
    contemporary: weights.contemporary ?? 0.5
  };

  return {
    openness,
    intellect: weights.intellect,
    music
  };
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
      openness: {
        aesthetics: 0.9,
        fantasy: 0.6,
        feelings: 0.5,
        actions: 0.4,
        ideas: 0.8,
        values: 0.7
      },
      intellect: 0.7,
      music: {
        mellow: 0.3,
        unpretentious: 0.1,
        sophisticated: 0.9,
        intense: 0.4,
        contemporary: 0.5
      }
    }
  },

  'T-1': {
    // STRATA - The hidden architecture
    sephirah: 'Chokmah',
    orisha: 'Ogun',
    shadowOrisha: 'Obatala',
    psychometricWeights: {
      openness: {
        aesthetics: 0.6,
        fantasy: 0.5,
        feelings: 0.3,
        actions: 0.6,
        ideas: 0.95,
        values: 0.5
      },
      intellect: 0.95,
      music: {
        mellow: 0.2,
        unpretentious: 0.3,
        sophisticated: 0.8,
        intense: 0.5,
        contemporary: 0.6
      }
    }
  },

  'V-2': {
    // OMEN - What arrives before itself
    sephirah: 'Binah',
    orisha: 'Orunmila',
    shadowOrisha: 'Elegua',
    psychometricWeights: {
      openness: {
        aesthetics: 0.8,
        fantasy: 0.9,
        feelings: 0.7,
        actions: 0.8,
        ideas: 0.7,
        values: 0.6
      },
      intellect: 0.6,
      music: {
        mellow: 0.4,
        unpretentious: 0.2,
        sophisticated: 0.85,
        intense: 0.5,
        contemporary: 0.8
      }
    }
  },

  'L-3': {
    // SILT - Patient sediment
    sephirah: 'Chesed',
    orisha: 'Yemoja',
    shadowOrisha: 'Ogun',
    psychometricWeights: {
      openness: {
        aesthetics: 0.6,
        fantasy: 0.5,
        feelings: 0.8,
        actions: 0.4,
        ideas: 0.5,
        values: 0.7
      },
      intellect: 0.5,
      music: {
        mellow: 0.8,
        unpretentious: 0.6,
        sophisticated: 0.5,
        intense: 0.2,
        contemporary: 0.4
      }
    }
  },

  'C-4': {
    // CULL - The necessary cut
    sephirah: 'Geburah',
    orisha: 'Ogun',
    shadowOrisha: 'Yemoja',
    psychometricWeights: {
      openness: {
        aesthetics: 0.7,
        fantasy: 0.3,
        feelings: 0.4,
        actions: 0.5,
        ideas: 0.8,
        values: 0.6
      },
      intellect: 0.8,
      music: {
        mellow: 0.1,
        unpretentious: 0.2,
        sophisticated: 0.7,
        intense: 0.8,
        contemporary: 0.5
      }
    }
  },

  'N-5': {
    // LIMN - To illuminate by edge
    sephirah: 'Tiferet',
    orisha: 'Oshun',
    shadowOrisha: 'Shango',
    psychometricWeights: {
      openness: {
        aesthetics: 0.8,
        fantasy: 0.6,
        feelings: 0.7,
        actions: 0.6,
        ideas: 0.6,
        values: 0.8
      },
      intellect: 0.6,
      music: {
        mellow: 0.5,
        unpretentious: 0.5,
        sophisticated: 0.7,
        intense: 0.5,
        contemporary: 0.5
      }
    }
  },

  'H-6': {
    // TOLL - The bell that cannot be unheard
    sephirah: 'Netzach',
    orisha: 'Shango',
    shadowOrisha: 'Oshun',
    psychometricWeights: {
      openness: {
        aesthetics: 0.7,
        fantasy: 0.6,
        feelings: 0.9,
        actions: 0.8,
        ideas: 0.4,
        values: 0.5
      },
      intellect: 0.4,
      music: {
        mellow: 0.2,
        unpretentious: 0.4,
        sophisticated: 0.5,
        intense: 0.9,
        contemporary: 0.7
      }
    }
  },

  'P-7': {
    // VAULT - What is kept
    sephirah: 'Hod',
    orisha: 'Orunmila',
    shadowOrisha: 'Elegua',
    psychometricWeights: {
      openness: {
        aesthetics: 0.8,
        fantasy: 0.4,
        feelings: 0.5,
        actions: 0.3,
        ideas: 0.9,
        values: 0.6
      },
      intellect: 0.9,
      music: {
        mellow: 0.6,
        unpretentious: 0.3,
        sophisticated: 0.9,
        intense: 0.3,
        contemporary: 0.3
      }
    }
  },

  'D-8': {
    // WICK - Draws flame upward without burning
    sephirah: 'Yesod',
    orisha: 'Elegua',
    shadowOrisha: 'Orunmila',
    psychometricWeights: {
      openness: {
        aesthetics: 0.7,
        fantasy: 0.9,
        feelings: 0.8,
        actions: 0.7,
        ideas: 0.5,
        values: 0.5
      },
      intellect: 0.4,
      music: {
        mellow: 0.5,
        unpretentious: 0.5,
        sophisticated: 0.6,
        intense: 0.6,
        contemporary: 0.7
      }
    }
  },

  'F-9': {
    // ANVIL - Where pressure becomes form
    sephirah: 'Malkuth',
    orisha: 'Ogun',
    shadowOrisha: 'Obatala',
    psychometricWeights: {
      openness: {
        aesthetics: 0.4,
        fantasy: 0.3,
        feelings: 0.4,
        actions: 0.9,
        ideas: 0.6,
        values: 0.5
      },
      intellect: 0.7,
      music: {
        mellow: 0.3,
        unpretentious: 0.7,
        sophisticated: 0.4,
        intense: 0.6,
        contemporary: 0.6
      }
    }
  },

  'R-10': {
    // SCHISM - The productive fracture
    sephirah: 'Daat',
    orisha: 'Eshu',
    shadowOrisha: 'Obatala',
    psychometricWeights: {
      openness: {
        aesthetics: 0.6,
        fantasy: 0.7,
        feelings: 0.6,
        actions: 0.9,
        ideas: 0.7,
        values: 0.8
      },
      intellect: 0.7,
      music: {
        mellow: 0.1,
        unpretentious: 0.3,
        sophisticated: 0.6,
        intense: 0.9,
        contemporary: 0.8
      }
    }
  },

  'Ø': {
    // VOID - The deliberate absence
    sephirah: 'AinSoph',
    orisha: 'Obatala',
    shadowOrisha: 'Eshu',
    psychometricWeights: {
      openness: {
        aesthetics: 0.8,
        fantasy: 0.7,
        feelings: 0.9,
        actions: 0.4,
        ideas: 0.6,
        values: 0.7
      },
      intellect: 0.5,
      music: {
        mellow: 0.7,
        unpretentious: 0.6,
        sophisticated: 0.6,
        intense: 0.3,
        contemporary: 0.4
      }
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
export function getPsychometricWeights(designation: Designation): NormalizedPsychometricWeights {
  return normalizePsychometricWeights(INTERNAL_MAPPINGS[designation].psychometricWeights);
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
