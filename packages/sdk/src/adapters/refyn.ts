/**
 * @subtaste/sdk - Refyn Adapter
 *
 * Integrates subtaste taste profiling with Refyn prompt optimisation.
 * Adapts user taste genome to prompt modification context.
 */

import type {
  TasteGenome,
  TasteGenomePublic,
  Glyph,
  CreativeMode,
  Designation
} from '@subtaste/core';
import {
  PANTHEON,
  getArchetype,
  generateIdentityStatement
} from '@subtaste/core';
import type { SubtasteClient } from '../client';

/**
 * Complexity level for content
 */
export type ComplexityLevel = 'accessible' | 'moderate' | 'sophisticated';

/**
 * Pacing style for responses
 */
export type PacingStyle = 'direct' | 'exploratory' | 'methodical';

/**
 * Prompt modifiers derived from taste profile
 */
export interface PromptModifiers {
  tone: string;
  complexity: ComplexityLevel;
  exampleStyle: string;
  pacing: PacingStyle;
  aestheticKeywords: string[];
  avoidKeywords: string[];
}

/**
 * Complete taste context for Refyn
 */
export interface RefynTasteContext {
  glyph: Glyph;
  creativeMode: CreativeMode;
  confidence: number;
  promptModifiers: PromptModifiers;
  identityStatement: string;
  secondary?: {
    glyph: Glyph;
    creativeMode: CreativeMode;
  };
}

/**
 * Tone mapping by archetype
 */
const TONE_MAP: Record<Designation, string> = {
  'S-0': 'authoritative and precise',
  'T-1': 'systematic and analytical',
  'V-2': 'intuitive and forward-looking',
  'L-3': 'patient and nurturing',
  'C-4': 'direct and economical',
  'N-5': 'balanced and synthesising',
  'H-6': 'energetic and persuasive',
  'P-7': 'thorough and referential',
  'D-8': 'fluid and adaptive',
  'F-9': 'practical and action-oriented',
  'R-10': 'provocative and questioning',
  'Ø': 'open and reflective'
};

/**
 * Pacing mapping by creative mode
 */
const PACING_MAP: Partial<Record<CreativeMode, PacingStyle>> = {
  'Editorial': 'direct',
  'Manifestation': 'direct',
  'Visionary': 'direct',
  'Prophetic': 'exploratory',
  'Channelling': 'exploratory',
  'Integrative': 'exploratory',
  'Receptive': 'exploratory',
  'Archival': 'methodical',
  'Architectural': 'methodical',
  'Developmental': 'methodical'
};

/**
 * Aesthetic keywords by archetype
 */
const AESTHETIC_KEYWORDS: Partial<Record<Designation, string[]>> = {
  'S-0': ['refined', 'elevated', 'distinctive', 'curated'],
  'T-1': ['structured', 'layered', 'systematic', 'precise'],
  'V-2': ['emergent', 'prescient', 'forward', 'nascent'],
  'L-3': ['patient', 'gradual', 'accumulative', 'deep'],
  'C-4': ['essential', 'minimal', 'sparse', 'edited'],
  'N-5': ['balanced', 'bridging', 'connecting', 'harmonious'],
  'H-6': ['bold', 'compelling', 'urgent', 'resonant'],
  'P-7': ['archival', 'historical', 'referenced', 'contextual'],
  'D-8': ['intuitive', 'channelled', 'flowing', 'sensitive'],
  'F-9': ['concrete', 'tangible', 'real', 'built'],
  'R-10': ['disruptive', 'contrarian', 'challenging', 'fractured'],
  'Ø': ['spacious', 'receptive', 'open', 'mirrored']
};

/**
 * Keywords to avoid by archetype (based on shadow)
 */
const AVOID_KEYWORDS: Partial<Record<Designation, string[]>> = {
  'S-0': ['mediocre', 'ordinary', 'mainstream'],
  'T-1': ['chaotic', 'unstructured', 'random'],
  'V-2': ['dated', 'nostalgic', 'retrospective'],
  'L-3': ['rushed', 'hasty', 'impatient'],
  'C-4': ['excessive', 'cluttered', 'maximal'],
  'N-5': ['extreme', 'polarised', 'one-sided'],
  'H-6': ['quiet', 'subtle', 'understated'],
  'P-7': ['forgettable', 'disposable', 'ephemeral'],
  'D-8': ['rigid', 'fixed', 'analytical'],
  'F-9': ['theoretical', 'abstract', 'conceptual'],
  'R-10': ['conventional', 'agreed', 'consensus'],
  'Ø': ['assertive', 'definitive', 'prescribed']
};

/**
 * Derive prompt modifiers from a taste genome
 */
export function derivePromptModifiers(
  genome: TasteGenome | TasteGenomePublic
): PromptModifiers {
  const designation = genome.archetype.primary.designation;
  const archetype = getArchetype(designation);

  // Derive complexity from confidence and archetype
  let complexity: ComplexityLevel = 'moderate';
  if (designation === 'T-1' || designation === 'P-7' || designation === 'S-0') {
    complexity = 'sophisticated';
  } else if (designation === 'F-9' || designation === 'H-6') {
    complexity = 'accessible';
  }

  // Derive pacing from creative mode
  const pacing = PACING_MAP[archetype.creativeMode] || 'exploratory';

  // Get tone
  const tone = TONE_MAP[designation] || 'balanced and clear';

  // Derive example style based on archetype tendencies
  let exampleStyle = 'use concrete and relatable examples';
  if (designation === 'T-1' || designation === 'S-0') {
    exampleStyle = 'use conceptual and abstract examples';
  } else if (designation === 'P-7' || designation === 'V-2') {
    exampleStyle = 'use historical and referential examples';
  } else if (designation === 'D-8' || designation === 'Ø') {
    exampleStyle = 'use sensory and experiential examples';
  }

  return {
    tone,
    complexity,
    exampleStyle,
    pacing,
    aestheticKeywords: AESTHETIC_KEYWORDS[designation] || [],
    avoidKeywords: AVOID_KEYWORDS[designation] || []
  };
}

/**
 * Get full Refyn taste context from genome
 */
export function getRefynContext(
  genome: TasteGenome | TasteGenomePublic
): RefynTasteContext {
  const designation = genome.archetype.primary.designation;
  const archetype = getArchetype(designation);
  const modifiers = derivePromptModifiers(genome);

  const context: RefynTasteContext = {
    glyph: archetype.glyph,
    creativeMode: archetype.creativeMode,
    confidence: genome.archetype.primary.confidence,
    promptModifiers: modifiers,
    identityStatement: generateIdentityStatement(
      designation,
      genome.archetype.secondary?.designation || null
    )
  };

  if (genome.archetype.secondary) {
    const secondaryArchetype = getArchetype(genome.archetype.secondary.designation);
    context.secondary = {
      glyph: secondaryArchetype.glyph,
      creativeMode: secondaryArchetype.creativeMode
    };
  }

  return context;
}

/**
 * Get Refyn context via API client
 */
export async function fetchRefynContext(
  client: SubtasteClient,
  userId: string
): Promise<RefynTasteContext> {
  const genome = await client.getPublicGenome(userId);
  return getRefynContext(genome);
}

/**
 * Adapt a prompt based on user taste context
 *
 * This injects taste-aware instructions into the prompt
 * that guide the AI's response style without being explicit to the user.
 */
export function adaptPromptForUser(
  basePrompt: string,
  context: RefynTasteContext
): string {
  const { promptModifiers, glyph, creativeMode } = context;

  const adaptationBlock = `
---
ADAPTATION CONTEXT (apply subtly, do not mention explicitly):
- User creative archetype: ${glyph} (${creativeMode})
- Preferred tone: ${promptModifiers.tone}
- Complexity level: ${promptModifiers.complexity}
- Example style: ${promptModifiers.exampleStyle}
- Response pacing: ${promptModifiers.pacing}
${promptModifiers.aestheticKeywords.length > 0 ? `- Aesthetic affinity: ${promptModifiers.aestheticKeywords.join(', ')}` : ''}
${promptModifiers.avoidKeywords.length > 0 ? `- Aesthetic aversion: ${promptModifiers.avoidKeywords.join(', ')}` : ''}
---`;

  return `${basePrompt}${adaptationBlock}`;
}

/**
 * Generate taste-aware system prompt section
 */
export function generateTasteSystemPrompt(context: RefynTasteContext): string {
  const { glyph, creativeMode, promptModifiers, secondary } = context;

  let systemSection = `The user has been identified as ${glyph}, a ${creativeMode} archetype.`;

  if (secondary) {
    systemSection += ` They also carry undertones of ${secondary.glyph} (${secondary.creativeMode}).`;
  }

  systemSection += `

Adapt your responses according to their taste profile:
- Tone: ${promptModifiers.tone}
- Complexity: ${promptModifiers.complexity}
- Examples: ${promptModifiers.exampleStyle}
- Pacing: ${promptModifiers.pacing}

This user appreciates: ${promptModifiers.aestheticKeywords.join(', ') || 'no specific keywords identified'}
This user is less drawn to: ${promptModifiers.avoidKeywords.join(', ') || 'no specific aversions identified'}

Apply these preferences subtly without explicitly referencing them.`;

  return systemSection;
}

/**
 * Check if a user's taste context is suitable for a particular content type
 */
export function assessContentAffinity(
  context: RefynTasteContext,
  contentAttributes: {
    complexity?: ComplexityLevel;
    isExperimental?: boolean;
    isNostalgic?: boolean;
    isMinimal?: boolean;
    isMaximal?: boolean;
  }
): { score: number; reasoning: string } {
  let score = 0.5;
  const reasons: string[] = [];

  const { glyph, promptModifiers } = context;

  // Complexity alignment
  if (contentAttributes.complexity === promptModifiers.complexity) {
    score += 0.1;
    reasons.push('complexity match');
  }

  // Experimental content
  if (contentAttributes.isExperimental) {
    if (['OMEN', 'SCHISM', 'WICK'].includes(glyph)) {
      score += 0.15;
      reasons.push('experimental affinity');
    } else if (['VAULT', 'SILT'].includes(glyph)) {
      score -= 0.1;
      reasons.push('experimental mismatch');
    }
  }

  // Nostalgic content
  if (contentAttributes.isNostalgic) {
    if (['VAULT', 'SILT'].includes(glyph)) {
      score += 0.15;
      reasons.push('nostalgic affinity');
    } else if (['OMEN', 'SCHISM'].includes(glyph)) {
      score -= 0.1;
      reasons.push('nostalgic mismatch');
    }
  }

  // Minimal content
  if (contentAttributes.isMinimal) {
    if (['CULL', 'KETH', 'VOID'].includes(glyph)) {
      score += 0.15;
      reasons.push('minimal affinity');
    } else if (['TOLL', 'LIMN'].includes(glyph)) {
      score -= 0.05;
    }
  }

  // Maximal content
  if (contentAttributes.isMaximal) {
    if (['TOLL', 'LIMN', 'VAULT'].includes(glyph)) {
      score += 0.1;
      reasons.push('maximal affinity');
    } else if (['CULL', 'VOID'].includes(glyph)) {
      score -= 0.15;
      reasons.push('maximal mismatch');
    }
  }

  return {
    score: Math.max(0, Math.min(1, score)),
    reasoning: reasons.join(', ') || 'neutral match'
  };
}
