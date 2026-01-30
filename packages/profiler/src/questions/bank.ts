/**
 * @subtaste/profiler - Question Bank
 *
 * Assessment questions with archetype weight mappings.
 * Uses binary and Likert formats as specified.
 */

import type { Designation } from '@subtaste/core';

/**
 * Question types
 */
export type QuestionType = 'binary' | 'likert' | 'ranking';

/**
 * Base question interface
 */
export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  category: 'core' | 'music' | 'creative' | 'social';
  archetypeWeights: Partial<Record<Designation, number>>;
}

/**
 * Binary question (A vs B)
 */
export interface BinaryQuestion extends Question {
  type: 'binary';
  options: [string, string];
  optionWeights: [Partial<Record<Designation, number>>, Partial<Record<Designation, number>>];
}

/**
 * Likert scale question
 */
export interface LikertQuestion extends Question {
  type: 'likert';
  scale: 5 | 7;
  lowLabel: string;
  highLabel: string;
}

/**
 * Ranking question
 */
export interface RankingQuestion extends Question {
  type: 'ranking';
  items: string[];
  itemWeights: Partial<Record<Designation, number>>[];
}

/**
 * INITIAL SPARK - question bank for onboarding
 * Sample 4-6 per session
 */
export const INITIAL_QUESTIONS: BinaryQuestion[] = [
  {
    id: 'init-1-approach',
    type: 'binary',
    prompt: 'When you find something good, you...',
    category: 'social',
    options: ['Keep it close', 'Spread the word'],
    archetypeWeights: {},
    optionWeights: [
      // Keep it close
      {
        'Ø': 0.7,      // VOID - receptive
        'P-7': 0.5,    // VAULT - archival
        'D-8': 0.3,    // WICK - channelling
        'L-3': 0.3,    // SILT - patient
        'H-6': -0.5    // TOLL - advocacy (opposite)
      },
      // Spread the word
      {
        'H-6': 0.8,    // TOLL - advocacy
        'R-10': 0.4,   // SCHISM - contrarian sharing
        'F-9': 0.3,    // ANVIL - manifestation
        'Ø': -0.5,     // VOID (opposite)
        'P-7': -0.3    // VAULT (opposite)
      }
    ]
  },
  {
    id: 'init-2-timing',
    type: 'binary',
    prompt: 'Your taste tends to be...',
    category: 'core',
    options: ['Ahead of its time', 'Refined within tradition'],
    archetypeWeights: {},
    optionWeights: [
      // Ahead of its time
      {
        'V-2': 0.8,    // OMEN - prophetic
        'R-10': 0.5,   // SCHISM - contrarian
        'S-0': 0.4,    // KETH - standard-setting
        'D-8': 0.3,    // WICK - channelling
        'P-7': -0.4    // VAULT (opposite)
      },
      // Refined within tradition
      {
        'P-7': 0.7,    // VAULT - archival
        'L-3': 0.5,    // SILT - patient cultivation
        'T-1': 0.4,    // STRATA - architectural
        'V-2': -0.3    // OMEN (opposite)
      }
    ]
  },
  {
    id: 'init-3-creation',
    type: 'binary',
    prompt: 'When creating, you prefer to...',
    category: 'creative',
    options: ['Build the structure first', 'Discover through doing'],
    archetypeWeights: {},
    optionWeights: [
      // Build the structure first
      {
        'T-1': 0.8,    // STRATA - architectural
        'F-9': 0.5,    // ANVIL - manifestation
        'C-4': 0.4,    // CULL - editorial
        'S-0': 0.3,    // KETH - visionary
        'D-8': -0.4    // WICK (opposite)
      },
      // Discover through doing
      {
        'D-8': 0.7,    // WICK - channelling
        'N-5': 0.5,    // LIMN - integrative
        'Ø': 0.4,      // VOID - receptive
        'V-2': 0.3,    // OMEN - prophetic
        'T-1': -0.3    // STRATA (opposite)
      }
    ]
  },
  {
    id: 'init-4-precision',
    type: 'binary',
    prompt: 'When shaping a piece, you prioritise...',
    category: 'creative',
    options: ['Exact wording and structure', 'Mood and resonance'],
    archetypeWeights: {},
    optionWeights: [
      // Exact wording and structure
      {
        'T-1': 0.7,    // STRATA - architectural
        'S-0': 0.6,    // KETH - standard-setting
        'C-4': 0.4,    // CULL - editorial
        'P-7': 0.2,    // VAULT - archival
        'D-8': -0.3    // WICK (opposite)
      },
      // Mood and resonance
      {
        'D-8': 0.6,    // WICK - channelling
        'N-5': 0.5,    // LIMN - integrative
        'Ø': 0.4,      // VOID - receptive
        'V-2': 0.3,    // OMEN - prophetic
        'T-1': -0.3    // STRATA (opposite)
      }
    ]
  },
  {
    id: 'init-5-lineage',
    type: 'binary',
    prompt: 'When building a collection, you care most about...',
    category: 'core',
    options: ['Lineage and provenance', 'Novelty and rupture'],
    archetypeWeights: {},
    optionWeights: [
      // Lineage and provenance
      {
        'P-7': 0.7,    // VAULT - archival
        'L-3': 0.5,    // SILT - developmental
        'T-1': 0.4,    // STRATA - architectural
        'S-0': 0.3,    // KETH - standard-setting
        'V-2': -0.3    // OMEN (opposite)
      },
      // Novelty and rupture
      {
        'V-2': 0.7,    // OMEN - prophetic
        'R-10': 0.5,   // SCHISM - contrarian
        'D-8': 0.4,    // WICK - channelling
        'F-9': 0.2,    // ANVIL - manifestation
        'P-7': -0.3    // VAULT (opposite)
      }
    ]
  },
  {
    id: 'init-6-delivery',
    type: 'binary',
    prompt: 'Your instinct is to...',
    category: 'creative',
    options: ['Ship something tangible quickly', 'Hold until it feels inevitable'],
    archetypeWeights: {},
    optionWeights: [
      // Ship quickly
      {
        'F-9': 0.7,    // ANVIL - manifestation
        'H-6': 0.4,    // TOLL - advocacy
        'R-10': 0.3,   // SCHISM - contrarian
        'T-1': 0.2,    // STRATA - architectural
        'L-3': -0.3    // SILT (opposite)
      },
      // Hold until inevitable
      {
        'S-0': 0.6,    // KETH - standard-setting
        'L-3': 0.5,    // SILT - developmental
        'C-4': 0.4,    // CULL - editorial
        'P-7': 0.3,    // VAULT - archival
        'F-9': -0.3    // ANVIL (opposite)
      }
    ]
  },
  {
    id: 'init-7-signal',
    type: 'binary',
    prompt: 'A strong signal should be...',
    category: 'social',
    options: ['Coded for insiders', 'Direct and widely legible'],
    archetypeWeights: {},
    optionWeights: [
      // Coded for insiders
      {
        'P-7': 0.6,    // VAULT - archival
        'C-4': 0.4,    // CULL - editorial
        'Ø': 0.3,      // VOID - receptive
        'D-8': 0.3,    // WICK - channelling
        'H-6': -0.3    // TOLL (opposite)
      },
      // Direct and widely legible
      {
        'H-6': 0.7,    // TOLL - advocacy
        'F-9': 0.4,    // ANVIL - manifestation
        'N-5': 0.3,    // LIMN - integrative
        'P-7': -0.3    // VAULT (opposite)
      }
    ]
  },
  {
    id: 'init-8-proof',
    type: 'binary',
    prompt: 'You trust...',
    category: 'core',
    options: ['Systems and proof', 'Intuition and pattern sense'],
    archetypeWeights: {},
    optionWeights: [
      // Systems and proof
      {
        'T-1': 0.7,    // STRATA - architectural
        'S-0': 0.4,    // KETH - standard-setting
        'P-7': 0.4,    // VAULT - archival
        'C-4': 0.3,    // CULL - editorial
        'D-8': -0.3    // WICK (opposite)
      },
      // Intuition and pattern sense
      {
        'D-8': 0.6,    // WICK - channelling
        'N-5': 0.5,    // LIMN - integrative
        'V-2': 0.4,    // OMEN - prophetic
        'Ø': 0.3,      // VOID - receptive
        'T-1': -0.3    // STRATA (opposite)
      }
    ]
  },
  {
    id: 'init-9-audience',
    type: 'binary',
    prompt: 'When you speak, you aim to...',
    category: 'social',
    options: ['Bridge outsiders in', 'Speak to the initiated'],
    archetypeWeights: {},
    optionWeights: [
      // Bridge outsiders
      {
        'L-3': 0.5,    // SILT - developmental
        'N-5': 0.5,    // LIMN - integrative
        'H-6': 0.4,    // TOLL - advocacy
        'S-0': 0.2,    // KETH - standard-setting
        'P-7': -0.3    // VAULT (opposite)
      },
      // Speak to the initiated
      {
        'P-7': 0.6,    // VAULT - archival
        'C-4': 0.4,    // CULL - editorial
        'S-0': 0.3,    // KETH - standard-setting
        'D-8': 0.2,    // WICK - channelling
        'H-6': -0.3    // TOLL (opposite)
      }
    ]
  },
  {
    id: 'init-10-surface',
    type: 'binary',
    prompt: 'You are drawn to...',
    category: 'creative',
    options: ['Clean, precise surfaces', 'Textured, imperfect surfaces'],
    archetypeWeights: {},
    optionWeights: [
      // Clean, precise
      {
        'S-0': 0.5,    // KETH - standard-setting
        'T-1': 0.5,    // STRATA - architectural
        'C-4': 0.3,    // CULL - editorial
        'P-7': 0.2,    // VAULT - archival
        'D-8': -0.3    // WICK (opposite)
      },
      // Textured, imperfect
      {
        'P-7': 0.5,    // VAULT - archival
        'D-8': 0.5,    // WICK - channelling
        'L-3': 0.4,    // SILT - developmental
        'N-5': 0.3,    // LIMN - integrative
        'S-0': -0.3    // KETH (opposite)
      }
    ]
  }
];

/**
 * MUSIC CALIBRATION - question bank triggered after 5 interactions
 * Sample 4-6 per session, refines MUSIC dimensions
 */
export const MUSIC_CALIBRATION_QUESTIONS: LikertQuestion[] = [
  {
    id: 'music-1-complexity',
    type: 'likert',
    prompt: 'I gravitate toward music that rewards close listening.',
    category: 'music',
    scale: 5,
    lowLabel: 'Strongly disagree',
    highLabel: 'Strongly agree',
    archetypeWeights: {
      // High agreement
      'S-0': 0.6,    // KETH - visionary
      'T-1': 0.7,    // STRATA - architectural
      'P-7': 0.8,    // VAULT - archival
      // Low agreement (negative weights applied to inverted score)
      'F-9': -0.4,   // ANVIL - manifestation
      'H-6': -0.2    // TOLL - advocacy
    }
  },
  {
    id: 'music-2-intensity',
    type: 'likert',
    prompt: 'I prefer music with aggressive energy.',
    category: 'music',
    scale: 5,
    lowLabel: 'Strongly disagree',
    highLabel: 'Strongly agree',
    archetypeWeights: {
      // High agreement
      'C-4': 0.7,    // CULL - editorial
      'H-6': 0.6,    // TOLL - advocacy
      'R-10': 0.8,   // SCHISM - contrarian
      // Low agreement
      'L-3': -0.5,   // SILT - patient
      'Ø': -0.4      // VOID - receptive
    }
  },
  {
    id: 'music-3-obscurity',
    type: 'likert',
    prompt: 'I lose interest once something becomes popular.',
    category: 'music',
    scale: 5,
    lowLabel: 'Strongly disagree',
    highLabel: 'Strongly agree',
    archetypeWeights: {
      // High agreement
      'V-2': 0.8,    // OMEN - prophetic
      'R-10': 0.6,   // SCHISM - contrarian
      'S-0': 0.5,    // KETH - standard-setting
      // Low agreement
      'H-6': -0.4,   // TOLL - advocacy
      'N-5': -0.2    // LIMN - integrative
    }
  },
  {
    id: 'music-4-handcrafted',
    type: 'likert',
    prompt: 'I prefer music that feels handcrafted rather than engineered.',
    category: 'music',
    scale: 5,
    lowLabel: 'Strongly disagree',
    highLabel: 'Strongly agree',
    archetypeWeights: {
      'L-3': 0.6,    // SILT - developmental
      'P-7': 0.5,    // VAULT - archival
      'Ø': 0.4,      // VOID - receptive
      'T-1': -0.3,   // STRATA (opposite)
      'S-0': -0.2    // KETH (opposite)
    }
  },
  {
    id: 'music-5-atmosphere',
    type: 'likert',
    prompt: 'Atmosphere matters more to me than lyrics.',
    category: 'music',
    scale: 5,
    lowLabel: 'Strongly disagree',
    highLabel: 'Strongly agree',
    archetypeWeights: {
      'D-8': 0.6,    // WICK - channelling
      'Ø': 0.5,      // VOID - receptive
      'L-3': 0.3,    // SILT - developmental
      'H-6': -0.2,   // TOLL (opposite)
      'T-1': -0.2    // STRATA (opposite)
    }
  },
  {
    id: 'music-6-genre',
    type: 'likert',
    prompt: 'I like music that blends genres rather than staying pure.',
    category: 'music',
    scale: 5,
    lowLabel: 'Strongly disagree',
    highLabel: 'Strongly agree',
    archetypeWeights: {
      'N-5': 0.7,    // LIMN - integrative
      'D-8': 0.5,    // WICK - channelling
      'V-2': 0.4,    // OMEN - prophetic
      'C-4': -0.2,   // CULL (opposite)
      'T-1': -0.2    // STRATA (opposite)
    }
  },
  {
    id: 'music-7-length',
    type: 'likert',
    prompt: 'I favour concise tracks over long-form compositions.',
    category: 'music',
    scale: 5,
    lowLabel: 'Strongly disagree',
    highLabel: 'Strongly agree',
    archetypeWeights: {
      'F-9': 0.5,    // ANVIL - manifestation
      'H-6': 0.3,    // TOLL - advocacy
      'S-0': 0.2,    // KETH - standard-setting
      'T-1': -0.3,   // STRATA (opposite)
      'P-7': -0.2    // VAULT (opposite)
    }
  },
  {
    id: 'music-8-return',
    type: 'likert',
    prompt: 'I return to the same tracks for years.',
    category: 'music',
    scale: 5,
    lowLabel: 'Strongly disagree',
    highLabel: 'Strongly agree',
    archetypeWeights: {
      'L-3': 0.6,    // SILT - developmental
      'P-7': 0.6,    // VAULT - archival
      'S-0': 0.3,    // KETH - standard-setting
      'V-2': -0.3    // OMEN (opposite)
    }
  },
  {
    id: 'music-9-polish',
    type: 'likert',
    prompt: 'Production polish is essential.',
    category: 'music',
    scale: 5,
    lowLabel: 'Strongly disagree',
    highLabel: 'Strongly agree',
    archetypeWeights: {
      'S-0': 0.6,    // KETH - standard-setting
      'T-1': 0.6,    // STRATA - architectural
      'C-4': 0.3,    // CULL - editorial
      'D-8': -0.2    // WICK (opposite)
    }
  },
  {
    id: 'music-10-challenge',
    type: 'likert',
    prompt: 'I like music that feels like a challenge.',
    category: 'music',
    scale: 5,
    lowLabel: 'Strongly disagree',
    highLabel: 'Strongly agree',
    archetypeWeights: {
      'C-4': 0.6,    // CULL - editorial
      'R-10': 0.6,   // SCHISM - contrarian
      'T-1': 0.4,    // STRATA - architectural
      'L-3': -0.3,   // SILT (opposite)
      'Ø': -0.2      // VOID (opposite)
    }
  }
];

/**
 * DEEP CALIBRATION - on-demand extended assessment
 * Sample 4-6 per session, unlocks confidence boost
 */
export const DEEP_CALIBRATION_QUESTIONS: (BinaryQuestion | LikertQuestion | RankingQuestion)[] = [
  {
    id: 'deep-1-role',
    type: 'ranking',
    prompt: 'Rank these roles by how naturally they fit you:',
    category: 'creative',
    items: [
      'The one who sets the standard',
      'The one who finds it first',
      'The one who shares it loudest',
      'The one who builds the collection',
      'The one who makes it real'
    ],
    archetypeWeights: {},
    itemWeights: [
      { 'S-0': 0.9 },   // sets standard → KETH
      { 'V-2': 0.9 },   // finds first → OMEN
      { 'H-6': 0.9 },   // shares loudest → TOLL
      { 'P-7': 0.9 },   // builds collection → VAULT
      { 'F-9': 0.9 }    // makes real → ANVIL
    ]
  } as RankingQuestion,
  {
    id: 'deep-2-curation',
    type: 'likert',
    prompt: 'When curating a playlist, less is more.',
    category: 'creative',
    scale: 5,
    lowLabel: 'Strongly disagree',
    highLabel: 'Strongly agree',
    archetypeWeights: {
      'C-4': 0.8,    // CULL - editorial
      'S-0': 0.5,    // KETH - standard-setting
      'P-7': -0.5,   // VAULT (opposite)
      'N-5': -0.3    // LIMN (opposite)
    }
  } as LikertQuestion,
  {
    id: 'deep-3-influence',
    type: 'binary',
    prompt: 'You would rather...',
    category: 'social',
    options: ['Shape culture quietly from the margins', 'Lead movements from the centre'],
    archetypeWeights: {},
    optionWeights: [
      // Margins
      {
        'D-8': 0.7,    // WICK
        'Ø': 0.6,      // VOID
        'L-3': 0.5,    // SILT
        'V-2': 0.4,    // OMEN
        'H-6': -0.5    // TOLL (opposite)
      },
      // Centre
      {
        'S-0': 0.7,    // KETH
        'H-6': 0.6,    // TOLL
        'F-9': 0.5,    // ANVIL
        'Ø': -0.5      // VOID (opposite)
      }
    ]
  } as BinaryQuestion,
  {
    id: 'deep-4-disagreement',
    type: 'likert',
    prompt: 'I enjoy having unpopular opinions about art.',
    category: 'core',
    scale: 5,
    lowLabel: 'Strongly disagree',
    highLabel: 'Strongly agree',
    archetypeWeights: {
      'R-10': 0.9,   // SCHISM
      'S-0': 0.5,    // KETH
      'C-4': 0.4,    // CULL
      'N-5': -0.5,   // LIMN (opposite)
      'L-3': -0.3    // SILT (opposite)
    }
  } as LikertQuestion,
  {
    id: 'deep-5-process',
    type: 'binary',
    prompt: 'The process of discovering matters more than what you find.',
    category: 'core',
    options: ['Agree', 'Disagree'],
    archetypeWeights: {},
    optionWeights: [
      // Agree (process)
      {
        'D-8': 0.7,    // WICK
        'V-2': 0.5,    // OMEN
        'Ø': 0.5,      // VOID
        'F-9': -0.4    // ANVIL (opposite)
      },
      // Disagree (outcome)
      {
        'F-9': 0.7,    // ANVIL
        'C-4': 0.5,    // CULL
        'S-0': 0.4,    // KETH
        'D-8': -0.3    // WICK (opposite)
      }
    ]
  } as BinaryQuestion,
  {
    id: 'deep-6-method',
    type: 'likert',
    prompt: 'I trust creators who show their method, not just the result.',
    category: 'creative',
    scale: 5,
    lowLabel: 'Strongly disagree',
    highLabel: 'Strongly agree',
    archetypeWeights: {
      'T-1': 0.6,    // STRATA - architectural
      'C-4': 0.5,    // CULL - editorial
      'P-7': 0.4,    // VAULT - archival
      'F-9': -0.2    // ANVIL (opposite)
    }
  } as LikertQuestion,
  {
    id: 'deep-7-finality',
    type: 'binary',
    prompt: 'A work should feel...',
    category: 'core',
    options: ['Precise and final', 'Open and alive'],
    archetypeWeights: {},
    optionWeights: [
      // Precise and final
      {
        'C-4': 0.6,    // CULL - editorial
        'S-0': 0.5,    // KETH - standard-setting
        'T-1': 0.4,    // STRATA - architectural
        'P-7': 0.2,    // VAULT - archival
        'D-8': -0.3    // WICK (opposite)
      },
      // Open and alive
      {
        'D-8': 0.6,    // WICK - channelling
        'N-5': 0.5,    // LIMN - integrative
        'Ø': 0.4,      // VOID - receptive
        'V-2': 0.3,    // OMEN - prophetic
        'C-4': -0.3    // CULL (opposite)
      }
    ]
  } as BinaryQuestion,
  {
    id: 'deep-8-explain',
    type: 'likert',
    prompt: 'I want to be moved even if I cannot explain why.',
    category: 'core',
    scale: 5,
    lowLabel: 'Strongly disagree',
    highLabel: 'Strongly agree',
    archetypeWeights: {
      'D-8': 0.7,    // WICK - channelling
      'Ø': 0.5,      // VOID - receptive
      'L-3': 0.4,    // SILT - developmental
      'T-1': -0.3    // STRATA (opposite)
    }
  } as LikertQuestion,
  {
    id: 'deep-9-edit',
    type: 'binary',
    prompt: 'In a collection, you prefer...',
    category: 'creative',
    options: ['A tight edit', 'A wide range of perspectives'],
    archetypeWeights: {},
    optionWeights: [
      // A tight edit
      {
        'C-4': 0.6,    // CULL - editorial
        'S-0': 0.4,    // KETH - standard-setting
        'T-1': 0.3,    // STRATA - architectural
        'P-7': 0.2,    // VAULT - archival
        'N-5': -0.3    // LIMN (opposite)
      },
      // A wide range
      {
        'N-5': 0.6,    // LIMN - integrative
        'P-7': 0.4,    // VAULT - archival
        'H-6': 0.3,    // TOLL - advocacy
        'D-8': 0.3,    // WICK - channelling
        'C-4': -0.3    // CULL (opposite)
      }
    ]
  } as BinaryQuestion,
  {
    id: 'deep-10-originality',
    type: 'likert',
    prompt: 'I would trade popularity for originality.',
    category: 'core',
    scale: 5,
    lowLabel: 'Strongly disagree',
    highLabel: 'Strongly agree',
    archetypeWeights: {
      'V-2': 0.7,    // OMEN - prophetic
      'R-10': 0.6,   // SCHISM - contrarian
      'S-0': 0.4,    // KETH - standard-setting
      'H-6': -0.3,   // TOLL (opposite)
      'L-3': -0.2    // SILT (opposite)
    }
  } as LikertQuestion
];

/**
 * Get all questions for a stage
 */
export function getQuestionsForStage(stage: 'initial' | 'music' | 'deep'): Question[] {
  switch (stage) {
    case 'initial':
      return INITIAL_QUESTIONS;
    case 'music':
      return MUSIC_CALIBRATION_QUESTIONS;
    case 'deep':
      return DEEP_CALIBRATION_QUESTIONS;
    default:
      return [];
  }
}

/**
 * Get a question by ID
 */
export function getQuestionById(id: string): Question | undefined {
  const allQuestions = [
    ...INITIAL_QUESTIONS,
    ...MUSIC_CALIBRATION_QUESTIONS,
    ...DEEP_CALIBRATION_QUESTIONS
  ];

  return allQuestions.find(q => q.id === id);
}
