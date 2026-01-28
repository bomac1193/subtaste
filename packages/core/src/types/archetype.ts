/**
 * @subtaste/core - Archetype Type Definitions
 *
 * THE TWELVE carry three registers of identity:
 * - Designation: Alphanumeric (internal, classified, power users)
 * - Glyph: The spoken name (public, identity, what users claim)
 * - Sigil: Formal notation (revealed on request, adds mystique)
 */

export type Designation =
  | 'S-0' | 'T-1' | 'V-2' | 'L-3' | 'C-4' | 'N-5'
  | 'H-6' | 'P-7' | 'D-8' | 'F-9' | 'R-10' | 'Ø';

export type Glyph =
  | 'KETH' | 'STRATA' | 'OMEN' | 'SILT' | 'CULL' | 'LIMN'
  | 'TOLL' | 'VAULT' | 'WICK' | 'ANVIL' | 'SCHISM' | 'VOID';

export type Sigil =
  | 'Aethonis' | 'Tectris' | 'Vatis' | 'Seris' | 'Severis' | 'Nexilis'
  | 'Voxis' | 'Palimpsest' | 'Siphis' | 'Crucis' | 'Apostis' | 'Lacuna';

export type CreativeMode =
  | 'Visionary' | 'Architectural' | 'Prophetic' | 'Developmental'
  | 'Editorial' | 'Integrative' | 'Advocacy' | 'Archival'
  | 'Channelling' | 'Manifestation' | 'Contrarian' | 'Receptive';

/**
 * PUBLIC - Safe to expose to clients
 * This is what users see after classification
 */
export interface ArchetypePublic {
  designation: Designation;
  glyph: Glyph;
  sigil: Sigil;
  essence: string;
  creativeMode: CreativeMode;
  shadow: string;
  recogniseBy: string;
}

/**
 * Archetype classification result for a user
 */
export interface ArchetypeClassification {
  primary: {
    designation: Designation;
    glyph: Glyph;
    confidence: number;
  };
  secondary: {
    designation: Designation;
    glyph: Glyph;
    confidence: number;
  } | null;
  distribution: Record<Designation, number>;
}

/**
 * Sigil reveal status tracking
 */
export interface SigilReveal {
  revealed: boolean;
  revealedAt: Date | null;
  sigil: Sigil | null;
}

/**
 * All 12 designations for iteration
 */
export const ALL_DESIGNATIONS: readonly Designation[] = [
  'S-0', 'T-1', 'V-2', 'L-3', 'C-4', 'N-5',
  'H-6', 'P-7', 'D-8', 'F-9', 'R-10', 'Ø'
] as const;

/**
 * Mapping from Glyph to Designation
 */
export const GLYPH_TO_DESIGNATION: Record<Glyph, Designation> = {
  'KETH': 'S-0',
  'STRATA': 'T-1',
  'OMEN': 'V-2',
  'SILT': 'L-3',
  'CULL': 'C-4',
  'LIMN': 'N-5',
  'TOLL': 'H-6',
  'VAULT': 'P-7',
  'WICK': 'D-8',
  'ANVIL': 'F-9',
  'SCHISM': 'R-10',
  'VOID': 'Ø'
} as const;

/**
 * Mapping from Designation to Glyph
 */
export const DESIGNATION_TO_GLYPH: Record<Designation, Glyph> = {
  'S-0': 'KETH',
  'T-1': 'STRATA',
  'V-2': 'OMEN',
  'L-3': 'SILT',
  'C-4': 'CULL',
  'N-5': 'LIMN',
  'H-6': 'TOLL',
  'P-7': 'VAULT',
  'D-8': 'WICK',
  'F-9': 'ANVIL',
  'R-10': 'SCHISM',
  'Ø': 'VOID'
} as const;
