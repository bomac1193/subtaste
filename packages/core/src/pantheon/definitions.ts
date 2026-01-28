/**
 * @subtaste/core - THE TWELVE Archetype Definitions
 *
 * The Pantheon: twelve archetypal patterns of creative taste.
 * Each carries three registers: Designation, Glyph, Sigil.
 */

import type { Designation, Glyph, Sigil, CreativeMode, ArchetypePublic } from '../types';

/**
 * Full archetype definition including user-facing copy
 */
export interface ArchetypeDefinition extends ArchetypePublic {
  recogniseBy: string;
}

/**
 * THE TWELVE - Complete Pantheon
 */
export const PANTHEON: Record<Designation, ArchetypeDefinition> = {
  'S-0': {
    designation: 'S-0',
    glyph: 'KETH',
    sigil: 'Aethonis',
    essence: 'The unmarked throne. First without announcement.',
    creativeMode: 'Visionary',
    shadow: 'Paralysis by standard. Nothing meets the mark.',
    recogniseBy: 'Others unconsciously defer to their judgment. They rarely explain themselves. When they speak, rooms reorganise.'
  },

  'T-1': {
    designation: 'T-1',
    glyph: 'STRATA',
    sigil: 'Tectris',
    essence: 'The hidden architecture. Layers beneath surfaces.',
    creativeMode: 'Architectural',
    shadow: 'Over-engineering. The system becomes the end.',
    recogniseBy: 'They explain systems you did not know existed. They build frameworks before building anything else.'
  },

  'V-2': {
    designation: 'V-2',
    glyph: 'OMEN',
    sigil: 'Vatis',
    essence: 'What arrives before itself. The shape of the unformed.',
    creativeMode: 'Prophetic',
    shadow: 'Cassandra syndrome. Right too soon.',
    recogniseBy: 'Their recommendations age well. Years later, you remember what they said.'
  },

  'L-3': {
    designation: 'L-3',
    glyph: 'SILT',
    sigil: 'Seris',
    essence: 'Patient sediment. What accumulates in darkness.',
    creativeMode: 'Developmental',
    shadow: 'Endless patience becomes enabling.',
    recogniseBy: 'Long memory. They remember what you showed them three years ago. They are still watching.'
  },

  'C-4': {
    designation: 'C-4',
    glyph: 'CULL',
    sigil: 'Severis',
    essence: 'The necessary cut. What must be removed, removed.',
    creativeMode: 'Editorial',
    shadow: 'Nihilistic rejection. Nothing survives.',
    recogniseBy: 'Sparse playlists. Brutal honesty. They will tell you what is wrong before what is right.'
  },

  'N-5': {
    designation: 'N-5',
    glyph: 'LIMN',
    sigil: 'Nexilis',
    essence: 'To illuminate by edge. The binding outline.',
    creativeMode: 'Integrative',
    shadow: 'Pathological balance. Refuses to choose.',
    recogniseBy: 'Unexpected pairings that work. Playlists that should not cohere but do.'
  },

  'H-6': {
    designation: 'H-6',
    glyph: 'TOLL',
    sigil: 'Voxis',
    essence: 'The bell that cannot be unheard. The summons.',
    creativeMode: 'Advocacy',
    shadow: 'Missionary zeal. Sharing becomes shoving.',
    recogniseBy: 'Relentless enthusiasm. They have sent you the same link three times. They are right, and they know it.'
  },

  'P-7': {
    designation: 'P-7',
    glyph: 'VAULT',
    sigil: 'Palimpsest',
    essence: 'What is kept. Writing over writing.',
    creativeMode: 'Archival',
    shadow: 'Hoarding. Knowledge that never circulates.',
    recogniseBy: 'They cite sources you have never heard of. They own formats you cannot play.'
  },

  'D-8': {
    designation: 'D-8',
    glyph: 'WICK',
    sigil: 'Siphis',
    essence: 'Draws flame upward without burning. The hollow channel.',
    creativeMode: 'Channelling',
    shadow: 'Dissolution. The channel consumes the self.',
    recogniseBy: 'Uncanny recommendations. They cannot always explain why. They just knew.'
  },

  'F-9': {
    designation: 'F-9',
    glyph: 'ANVIL',
    sigil: 'Crucis',
    essence: 'Where pressure becomes form. The manifestation point.',
    creativeMode: 'Manifestation',
    shadow: 'Crude materialism. Only what ships matters.',
    recogniseBy: 'They have built something. While others talked, they shipped.'
  },

  'R-10': {
    designation: 'R-10',
    glyph: 'SCHISM',
    sigil: 'Apostis',
    essence: 'The productive fracture. What breaks to reveal grain.',
    creativeMode: 'Contrarian',
    shadow: 'Reflexive opposition. Disagreement as identity.',
    recogniseBy: 'Their takes age strangely. What seemed wrong becomes obvious. Or does not.'
  },

  'Ø': {
    designation: 'Ø',
    glyph: 'VOID',
    sigil: 'Lacuna',
    essence: 'The deliberate absence. What receives by containing nothing.',
    creativeMode: 'Receptive',
    shadow: 'Passivity. Reception without response.',
    recogniseBy: 'They listen longer than anyone. Their recommendations feel like mirrors.'
  }
} as const;

/**
 * Get public archetype definition by designation
 */
export function getArchetype(designation: Designation): ArchetypeDefinition {
  return PANTHEON[designation];
}

/**
 * Get archetype by glyph
 */
export function getArchetypeByGlyph(glyph: Glyph): ArchetypeDefinition {
  const entry = Object.values(PANTHEON).find(a => a.glyph === glyph);
  if (!entry) throw new Error(`Unknown glyph: ${glyph}`);
  return entry;
}

/**
 * Get archetype by sigil
 */
export function getArchetypeBySigil(sigil: Sigil): ArchetypeDefinition {
  const entry = Object.values(PANTHEON).find(a => a.sigil === sigil);
  if (!entry) throw new Error(`Unknown sigil: ${sigil}`);
  return entry;
}

/**
 * Convert designation to glyph
 */
export function toGlyph(designation: Designation): Glyph {
  return PANTHEON[designation].glyph;
}

/**
 * Convert glyph to designation
 */
export function toDesignation(glyph: Glyph): Designation {
  const entry = Object.entries(PANTHEON).find(([, v]) => v.glyph === glyph);
  if (!entry) throw new Error(`Unknown glyph: ${glyph}`);
  return entry[0] as Designation;
}

/**
 * Convert designation to sigil
 */
export function toSigil(designation: Designation): Sigil {
  return PANTHEON[designation].sigil;
}

/**
 * Get all designations
 */
export function getAllDesignations(): Designation[] {
  return Object.keys(PANTHEON) as Designation[];
}

/**
 * Get all glyphs
 */
export function getAllGlyphs(): Glyph[] {
  return Object.values(PANTHEON).map(a => a.glyph);
}
