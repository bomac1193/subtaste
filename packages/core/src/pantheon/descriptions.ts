/**
 * @subtaste/core - User-Facing Archetype Descriptions
 *
 * Extended prose for result pages and deep dives.
 * UK English. No emojis. Would The Row write this? test.
 */

import type { Designation, Glyph } from '../types';

/**
 * Extended description for archetype result pages
 */
export interface ArchetypeDescription {
  glyph: Glyph;
  title: string;
  shortDescription: string;
  longDescription: string;
  strengthsText: string;
  shadowText: string;
  compatibleWith: Glyph[];
  tensionWith: Glyph[];
}

/**
 * Full descriptions for THE TWELVE
 */
export const ARCHETYPE_DESCRIPTIONS: Record<Designation, ArchetypeDescription> = {
  'S-0': {
    glyph: 'KETH',
    title: 'The Standard-Bearer',
    shortDescription: 'The KETH sets the terms others adopt without knowing the source.',
    longDescription: `The KETH does not chase trends. They emit them. Their taste operates at a frequency others eventually tune to, though the source remains unmarked. They are the first to find what matters, and by the time others arrive, they have already moved.

Their danger is altitude sickness: so far above the field that they lose contact with what is actually being made. The healthiest KETH learns to descend, to engage with work that does not yet meet their standard, knowing that standards themselves must evolve.`,
    strengthsText: 'Unerring instinct for quality. Ability to recognise greatness before consensus forms. Natural authority that requires no announcement.',
    shadowText: 'Paralysis by standard. Nothing meets the mark. Isolation from the creative community they could elevate.',
    compatibleWith: ['STRATA', 'VAULT', 'CULL'],
    tensionWith: ['TOLL', 'ANVIL', 'VOID']
  },

  'T-1': {
    glyph: 'STRATA',
    title: 'The System-Seer',
    shortDescription: 'The STRATA sees the scaffolding beneath every surface.',
    longDescription: `Where others hear a song, the STRATA hears production choices, arrangement logic, the business model behind the release. Where others see an image, they see the grid, the references, the decisions that shaped each element. Their gift is making the invisible visible.

Their trap is forgetting that some things work precisely because they remain unseen. Not every system benefits from exposure. The mature STRATA knows when to reveal structure and when to preserve mystery.`,
    strengthsText: 'Ability to reverse-engineer excellence. Creates frameworks that compound creative output. Sees connections across domains.',
    shadowText: 'Over-engineering. The system becomes the end. Analysis that cannot yield to intuition.',
    compatibleWith: ['KETH', 'OMEN', 'ANVIL'],
    tensionWith: ['WICK', 'VOID', 'SILT']
  },

  'V-2': {
    glyph: 'OMEN',
    title: 'The Early Witness',
    shortDescription: 'The OMEN arrives early. They found the artist before the artist found themselves.',
    longDescription: `The OMEN possesses temporal vision. They see what something will become, not just what it is. They were listening to the artist at 500 plays who will have 50 million. They spotted the movement before it had a name.

Their curse is temporal loneliness. Being right too soon is indistinguishable from being wrong. The mature OMEN learns to plant seeds rather than announce harvests, to create conditions for emergence rather than demanding recognition.`,
    strengthsText: 'Predictive accuracy that compounds over time. Ability to nurture potential before it is obvious. Patience that is rewarded.',
    shadowText: 'Cassandra syndrome. Right too soon, unheard. Frustration with those who cannot see what is coming.',
    compatibleWith: ['SILT', 'WICK', 'STRATA'],
    tensionWith: ['ANVIL', 'TOLL', 'CULL']
  },

  'L-3': {
    glyph: 'SILT',
    title: 'The Patient Cultivator',
    shortDescription: 'The SILT accumulates. They nurture potential across years, not quarters.',
    longDescription: `The SILT operates on a different timescale. They see the artist at 1,000 listeners and invest attention that compounds. They understand that some things cannot be rushed, that depth requires time, that the richest sediment settles slowly.

Their danger is confusing patience with passivity. Some things need acceleration, not more time. The healthy SILT knows when to wait and when to push, when patience is wisdom and when it is avoidance.`,
    strengthsText: 'Long memory that catches what others forget. Investment in potential that pays decades later. Stability in a culture of churn.',
    shadowText: 'Endless patience becomes enabling. Waiting when action is required. Accumulation without release.',
    compatibleWith: ['OMEN', 'VAULT', 'LIMN'],
    tensionWith: ['TOLL', 'SCHISM', 'CULL']
  },

  'C-4': {
    glyph: 'CULL',
    title: 'The Essential Editor',
    shortDescription: 'The CULL removes. Their gift is knowing what does not belong.',
    longDescription: `The CULL understands subtraction. In a mix, they hear what should be absent. In a setlist, they know which song breaks the arc. In a catalogue, they identify what dilutes the whole. They make things better by removal.

Their shadow emerges when cutting becomes compulsive, when the knife cannot stop, when nothing is ever good enough to remain. The healthy CULL knows that editing serves the work, not the editor.`,
    strengthsText: 'Clarity through elimination. Ability to identify the essential. Courage to cut what others cannot.',
    shadowText: 'Nihilistic rejection. Nothing survives scrutiny. Editing as destruction rather than refinement.',
    compatibleWith: ['KETH', 'ANVIL', 'STRATA'],
    tensionWith: ['SILT', 'LIMN', 'VOID']
  },

  'N-5': {
    glyph: 'LIMN',
    title: 'The Border Illuminator',
    shortDescription: 'The LIMN illuminates by drawing edges. They see how opposites connect.',
    longDescription: `The LIMN finds the through-line between drill and devotional music, the shared DNA in clashing aesthetics. They do not blur distinctions but sharpen them, revealing how difference creates relationship. Their playlists should not cohere, yet they do.

Their danger is becoming merely diplomatic, finding false equivalence where real distinctions matter. The mature LIMN knows when synthesis serves understanding and when it obscures truth.`,
    strengthsText: 'Creates unexpected connections that work. Bridges communities that do not know they share roots. Reveals hidden unity.',
    shadowText: 'Pathological balance. Refuses to choose. Synthesis that avoids necessary conflict.',
    compatibleWith: ['TOLL', 'WICK', 'SILT'],
    tensionWith: ['CULL', 'SCHISM', 'KETH']
  },

  'H-6': {
    glyph: 'TOLL',
    title: 'The Relentless Advocate',
    shortDescription: 'The TOLL summons. They do not just share. They insist.',
    longDescription: `The TOLL's energy puts artists on maps, fills rooms, changes trajectories. Their enthusiasm is not passive appreciation but active force. When they believe in something, they become its bell, its summons, its tireless champion.

The shadow emerges when passion curdles into pressure, when sharing becomes shoving, when the gift of discovery becomes a burden on others. The healthy TOLL knows when to ring and when to let silence speak.`,
    strengthsText: 'Converts sceptics into believers. Energy that can change an artist career. Passion that is genuinely contagious.',
    shadowText: 'Missionary zeal. Sharing becomes shoving. Cannot accept when others do not hear what they hear.',
    compatibleWith: ['LIMN', 'WICK', 'ANVIL'],
    tensionWith: ['KETH', 'SILT', 'OMEN']
  },

  'P-7': {
    glyph: 'VAULT',
    title: 'The Living Archive',
    shortDescription: 'The VAULT preserves. They know the lineage.',
    longDescription: `The VAULT knows who sampled whom, which B-side predicted which movement, where the bodies are buried. They are the living memory of culture, the repository of context that gives meaning to the present. They own formats you cannot play.

Their danger is becoming a closed system, a museum rather than a living library. The healthiest VAULT shares generously, understanding that preservation serves the future, not the past.`,
    strengthsText: 'Deep knowledge that contextualises the present. Ability to trace influence and precedent. Memory that serves creation.',
    shadowText: 'Hoarding. Knowledge that never circulates. Preservation that becomes imprisonment.',
    compatibleWith: ['KETH', 'SILT', 'STRATA'],
    tensionWith: ['SCHISM', 'WICK', 'VOID']
  },

  'D-8': {
    glyph: 'WICK',
    title: 'The Hollow Channel',
    shortDescription: 'The WICK draws flame upward without burning. Taste moves through them.',
    longDescription: `The WICK is sensitive to currents others miss. They cannot always explain their recommendations because the knowing does not come from analysis. Taste moves through them rather than from them. They are porous to quality in ways that defy articulation.

Their danger is losing themselves in the flow, becoming so porous that no stable identity remains. The healthy WICK maintains a centre while remaining open to transmission.`,
    strengthsText: 'Uncanny accuracy that defies explanation. Sensitivity to quality before it is legible. Transmission without distortion.',
    shadowText: 'Dissolution. The channel consumes the self. No stable position from which to speak.',
    compatibleWith: ['OMEN', 'TOLL', 'LIMN'],
    tensionWith: ['STRATA', 'VAULT', 'ANVIL']
  },

  'F-9': {
    glyph: 'ANVIL',
    title: 'The Manifestor',
    shortDescription: 'The ANVIL makes real. Where others discuss, they deliver.',
    longDescription: `The ANVIL turns taste into tangible forms. Playlists, events, releases, platforms. While others debate quality, they are building. Their gift is manifestation. The point of contact where pressure becomes form.

Their shadow is reducing everything to output, losing the ineffable in the executable. The healthy ANVIL knows that not everything valuable can be shipped, that some truths resist materialisation.`,
    strengthsText: 'Transforms vision into reality. Bias toward action that produces results. Creates infrastructure for taste.',
    shadowText: 'Crude materialism. Only what ships matters. Loses the intangible in pursuit of the concrete.',
    compatibleWith: ['STRATA', 'TOLL', 'CULL'],
    tensionWith: ['OMEN', 'WICK', 'VOID']
  },

  'R-10': {
    glyph: 'SCHISM',
    title: 'The Productive Fracture',
    shortDescription: 'The SCHISM breaks. They find value precisely where consensus says there is none.',
    longDescription: `The SCHISM reveals assumptions by breaking them, tests boundaries by crossing them, makes space for what could not exist before. Their takes age strangely. What seemed wrong becomes obvious. Or remains wrong. The productive fracture is not about being right but about revealing.

Their shadow is contrarianism for its own sake, breaking things that worked, opposition as identity rather than insight.`,
    strengthsText: 'Reveals hidden assumptions. Creates space for the genuinely new. Courage to dissent.',
    shadowText: 'Reflexive opposition. Disagreement as identity. Breaking what does not need to break.',
    compatibleWith: ['OMEN', 'TOLL', 'WICK'],
    tensionWith: ['SILT', 'VAULT', 'LIMN']
  },

  'Ø': {
    glyph: 'VOID',
    title: 'The Receptive Presence',
    shortDescription: 'The VOID receives. They contain multitudes by containing nothing fixed.',
    longDescription: `The VOID absorbs without distortion. Where others project taste, they receive. Their recommendations feel like mirrors because they are not imposing but reflecting what you already needed. They listen longer than anyone.

Their danger is becoming an empty vessel that never speaks. Pure intake with no output. Infinite patience that never resolves into position.`,
    strengthsText: 'Reception without distortion. Ability to hear what is actually being said. Presence that creates space for others.',
    shadowText: 'Passivity. Reception without response. Emptiness that cannot fill.',
    compatibleWith: ['SILT', 'WICK', 'LIMN'],
    tensionWith: ['KETH', 'CULL', 'ANVIL']
  }
};

/**
 * Get extended description for a designation
 */
export function getDescription(designation: Designation): ArchetypeDescription {
  return ARCHETYPE_DESCRIPTIONS[designation];
}

/**
 * Get identity statement for a user
 */
export function generateIdentityStatement(
  primary: Designation,
  secondary: Designation | null
): string {
  const { glyph: primaryGlyph, title } = ARCHETYPE_DESCRIPTIONS[primary];
  const essence = ARCHETYPE_DESCRIPTIONS[primary].shortDescription;

  let statement = `You are ${primaryGlyph}, ${title}. ${essence}`;

  if (secondary) {
    const { glyph: secondaryGlyph } = ARCHETYPE_DESCRIPTIONS[secondary];
    statement += ` With undertones of ${secondaryGlyph}.`;
  }

  return statement;
}
