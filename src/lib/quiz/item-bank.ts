/**
 * Expanded Item Bank for Subtaste Quiz
 *
 * Contains 3-5 questions per trait across all dimensions:
 * - Big Five: openness, conscientiousness, extraversion, agreeableness, neuroticism
 * - Extended: noveltySeeking, aestheticSensitivity, riskTolerance
 *
 * Each question has:
 * - Trait mappings with loading factors
 * - Difficulty parameter (IRT-style, -3 to +3)
 * - Discrimination parameter (how well it differentiates)
 * - Anchor flag for returning users
 */

import { TraitDeltas } from '../types/models';
import { AestheticAdjustment } from './questions';

export type TraitId =
  | 'openness'
  | 'conscientiousness'
  | 'extraversion'
  | 'agreeableness'
  | 'neuroticism'
  | 'noveltySeeking'
  | 'aestheticSensitivity'
  | 'riskTolerance';

export const ALL_TRAITS: TraitId[] = [
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism',
  'noveltySeeking',
  'aestheticSensitivity',
  'riskTolerance',
];

export type QuestionType = 'ab' | 'multiple' | 'image' | 'slider';

export interface ItemAnswer {
  id: string;
  text: string;
  imageUrl?: string;
  traitDeltas: TraitDeltas;
  aestheticAdjustment?: AestheticAdjustment;
  /** Raw score value for this answer (used in IRT scoring) */
  value: number; // -1 to 1 for binary, 0-1 for multiple
}

export interface ItemBankQuestion {
  id: string;
  type: QuestionType;
  text: string;
  subtext?: string;
  answers: ItemAnswer[];

  /** Primary trait this question measures */
  primaryTrait: TraitId;

  /** Secondary traits with loading factors */
  secondaryTraits?: Partial<Record<TraitId, number>>;

  /** IRT difficulty parameter (-3 to +3, 0 = average) */
  difficulty: number;

  /** IRT discrimination parameter (0.5-2.5, higher = more discriminating) */
  discrimination: number;

  /** Is this an anchor question (always included for returning users)? */
  isAnchor: boolean;

  /** Category for grouping (personality, aesthetic, identity) */
  category: 'personality' | 'aesthetic' | 'identity';
}

/**
 * Complete Item Bank
 * Organized by primary trait for easy lookup
 */
export const itemBank: ItemBankQuestion[] = [
  // =============================================================================
  // OPENNESS (5 questions)
  // =============================================================================
  {
    id: 'open_1_exploration',
    type: 'ab',
    text: 'On a free evening, you prefer to...',
    primaryTrait: 'openness',
    secondaryTraits: { noveltySeeking: 0.6, riskTolerance: 0.3 },
    difficulty: 0,
    discrimination: 1.5,
    isAnchor: true,
    category: 'personality',
    answers: [
      {
        id: 'open_1_a',
        text: 'Explore somewhere new, even if it might disappoint',
        traitDeltas: { openness: 0.15, noveltySeeking: 0.2, riskTolerance: 0.1 },
        value: 1,
      },
      {
        id: 'open_1_b',
        text: 'Return to a place you know and love',
        traitDeltas: { openness: -0.1, noveltySeeking: -0.15, conscientiousness: 0.1 },
        value: -1,
      },
    ],
  },
  {
    id: 'open_2_ideas',
    type: 'ab',
    text: 'When someone shares an unconventional idea, you...',
    primaryTrait: 'openness',
    secondaryTraits: { agreeableness: 0.3 },
    difficulty: -0.5,
    discrimination: 1.3,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'open_2_a',
        text: 'Get excited to explore it, even if it seems impractical',
        traitDeltas: { openness: 0.2, noveltySeeking: 0.1 },
        value: 1,
      },
      {
        id: 'open_2_b',
        text: 'Prefer to focus on proven approaches',
        traitDeltas: { openness: -0.15, conscientiousness: 0.15 },
        value: -1,
      },
    ],
  },
  {
    id: 'open_3_art',
    type: 'multiple',
    text: 'When experiencing art or music, you most value...',
    primaryTrait: 'openness',
    secondaryTraits: { aestheticSensitivity: 0.7 },
    difficulty: 0.5,
    discrimination: 1.6,
    isAnchor: false,
    category: 'aesthetic',
    answers: [
      {
        id: 'open_3_a',
        text: 'Emotional impact and personal meaning',
        traitDeltas: { openness: 0.1, aestheticSensitivity: 0.15, neuroticism: 0.05 },
        value: 0.5,
      },
      {
        id: 'open_3_b',
        text: 'Technical skill and craftsmanship',
        traitDeltas: { conscientiousness: 0.1, aestheticSensitivity: 0.1 },
        value: 0.25,
      },
      {
        id: 'open_3_c',
        text: 'Novelty and breaking conventions',
        traitDeltas: { openness: 0.2, noveltySeeking: 0.15 },
        value: 1,
      },
      {
        id: 'open_3_d',
        text: 'Familiarity and comfort',
        traitDeltas: { openness: -0.1, neuroticism: -0.05 },
        value: 0,
      },
    ],
  },
  {
    id: 'open_4_change',
    type: 'ab',
    text: 'Major life changes make you feel...',
    primaryTrait: 'openness',
    secondaryTraits: { neuroticism: -0.4, riskTolerance: 0.5 },
    difficulty: 0.3,
    discrimination: 1.4,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'open_4_a',
        text: 'Excited about new possibilities',
        traitDeltas: { openness: 0.15, riskTolerance: 0.1, neuroticism: -0.1 },
        value: 1,
      },
      {
        id: 'open_4_b',
        text: 'Anxious about losing stability',
        traitDeltas: { openness: -0.1, neuroticism: 0.15, riskTolerance: -0.1 },
        value: -1,
      },
    ],
  },
  {
    id: 'open_5_philosophy',
    type: 'ab',
    text: 'Abstract philosophical discussions are...',
    primaryTrait: 'openness',
    difficulty: 1.0,
    discrimination: 1.8,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'open_5_a',
        text: 'Fascinating, even without practical application',
        traitDeltas: { openness: 0.2 },
        value: 1,
      },
      {
        id: 'open_5_b',
        text: 'Interesting only if they lead somewhere useful',
        traitDeltas: { openness: -0.05, conscientiousness: 0.1 },
        value: -1,
      },
    ],
  },

  // =============================================================================
  // CONSCIENTIOUSNESS (5 questions)
  // =============================================================================
  {
    id: 'cons_1_planning',
    type: 'ab',
    text: 'When making big decisions, you...',
    primaryTrait: 'conscientiousness',
    secondaryTraits: { riskTolerance: -0.5, openness: -0.2 },
    difficulty: 0,
    discrimination: 1.5,
    isAnchor: true,
    category: 'personality',
    answers: [
      {
        id: 'cons_1_a',
        text: 'Trust your gut and adapt as you go',
        traitDeltas: { riskTolerance: 0.2, openness: 0.1, conscientiousness: -0.15 },
        value: -1,
      },
      {
        id: 'cons_1_b',
        text: 'Research thoroughly before committing',
        traitDeltas: { conscientiousness: 0.2, riskTolerance: -0.15, neuroticism: 0.05 },
        value: 1,
      },
    ],
  },
  {
    id: 'cons_2_deadlines',
    type: 'ab',
    text: 'With a deadline approaching, you typically...',
    primaryTrait: 'conscientiousness',
    difficulty: -0.3,
    discrimination: 1.6,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'cons_2_a',
        text: 'Have already finished well ahead of time',
        traitDeltas: { conscientiousness: 0.2, neuroticism: -0.05 },
        value: 1,
      },
      {
        id: 'cons_2_b',
        text: 'Work best under last-minute pressure',
        traitDeltas: { conscientiousness: -0.15, openness: 0.05 },
        value: -1,
      },
    ],
  },
  {
    id: 'cons_3_organization',
    type: 'multiple',
    text: 'Your living/working space is usually...',
    primaryTrait: 'conscientiousness',
    difficulty: -0.5,
    discrimination: 1.4,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'cons_3_a',
        text: 'Meticulously organized with a place for everything',
        traitDeltas: { conscientiousness: 0.2 },
        value: 1,
      },
      {
        id: 'cons_3_b',
        text: 'Tidy but flexible',
        traitDeltas: { conscientiousness: 0.05 },
        value: 0.5,
      },
      {
        id: 'cons_3_c',
        text: 'Creatively chaotic but I know where things are',
        traitDeltas: { conscientiousness: -0.1, openness: 0.1 },
        value: 0.25,
      },
      {
        id: 'cons_3_d',
        text: 'Honestly a bit of a mess',
        traitDeltas: { conscientiousness: -0.2 },
        value: 0,
      },
    ],
  },
  {
    id: 'cons_4_details',
    type: 'ab',
    text: 'When working on a project, small details...',
    primaryTrait: 'conscientiousness',
    secondaryTraits: { aestheticSensitivity: 0.3 },
    difficulty: 0.5,
    discrimination: 1.5,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'cons_4_a',
        text: 'Matter deeply – they make or break the result',
        traitDeltas: { conscientiousness: 0.15, aestheticSensitivity: 0.1 },
        value: 1,
      },
      {
        id: 'cons_4_b',
        text: 'Are less important than the big picture',
        traitDeltas: { conscientiousness: -0.1, openness: 0.05 },
        value: -1,
      },
    ],
  },
  {
    id: 'cons_5_promises',
    type: 'ab',
    text: 'When you make a commitment to someone...',
    primaryTrait: 'conscientiousness',
    secondaryTraits: { agreeableness: 0.4 },
    difficulty: 0.2,
    discrimination: 1.3,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'cons_5_a',
        text: 'You follow through no matter what',
        traitDeltas: { conscientiousness: 0.15, agreeableness: 0.1 },
        value: 1,
      },
      {
        id: 'cons_5_b',
        text: 'You stay flexible if circumstances change',
        traitDeltas: { conscientiousness: -0.1, openness: 0.1 },
        value: -1,
      },
    ],
  },

  // =============================================================================
  // EXTRAVERSION (5 questions)
  // =============================================================================
  {
    id: 'extr_1_recharge',
    type: 'ab',
    text: 'After a long day, you recharge by...',
    primaryTrait: 'extraversion',
    secondaryTraits: { agreeableness: 0.3 },
    difficulty: 0,
    discrimination: 1.7,
    isAnchor: true,
    category: 'personality',
    answers: [
      {
        id: 'extr_1_a',
        text: 'Being around people, even strangers',
        traitDeltas: { extraversion: 0.2, agreeableness: 0.1 },
        value: 1,
      },
      {
        id: 'extr_1_b',
        text: 'Solitude or one close person',
        traitDeltas: { extraversion: -0.2, neuroticism: 0.05 },
        value: -1,
      },
    ],
  },
  {
    id: 'extr_2_parties',
    type: 'ab',
    text: 'At a party where you know few people, you...',
    primaryTrait: 'extraversion',
    difficulty: 0.3,
    discrimination: 1.6,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'extr_2_a',
        text: 'Introduce yourself to strangers enthusiastically',
        traitDeltas: { extraversion: 0.2, riskTolerance: 0.1 },
        value: 1,
      },
      {
        id: 'extr_2_b',
        text: 'Find a quiet corner or stick with who you know',
        traitDeltas: { extraversion: -0.15, neuroticism: 0.05 },
        value: -1,
      },
    ],
  },
  {
    id: 'extr_3_attention',
    type: 'ab',
    text: 'Being the center of attention feels...',
    primaryTrait: 'extraversion',
    difficulty: 0.5,
    discrimination: 1.8,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'extr_3_a',
        text: 'Energizing and natural',
        traitDeltas: { extraversion: 0.2 },
        value: 1,
      },
      {
        id: 'extr_3_b',
        text: 'Uncomfortable, I prefer to blend in',
        traitDeltas: { extraversion: -0.2, neuroticism: 0.1 },
        value: -1,
      },
    ],
  },
  {
    id: 'extr_4_weekend',
    type: 'multiple',
    text: 'Your ideal weekend involves...',
    primaryTrait: 'extraversion',
    secondaryTraits: { openness: 0.2 },
    difficulty: -0.3,
    discrimination: 1.4,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'extr_4_a',
        text: 'A packed social calendar with multiple events',
        traitDeltas: { extraversion: 0.2 },
        value: 1,
      },
      {
        id: 'extr_4_b',
        text: 'Quality time with a small group of close friends',
        traitDeltas: { extraversion: 0.05, agreeableness: 0.1 },
        value: 0.5,
      },
      {
        id: 'extr_4_c',
        text: 'Solo activities with optional social time',
        traitDeltas: { extraversion: -0.1 },
        value: 0.25,
      },
      {
        id: 'extr_4_d',
        text: 'Complete solitude and personal projects',
        traitDeltas: { extraversion: -0.2, openness: 0.1 },
        value: 0,
      },
    ],
  },
  {
    id: 'extr_5_thinking',
    type: 'ab',
    text: 'When processing thoughts or problems, you...',
    primaryTrait: 'extraversion',
    difficulty: 0.2,
    discrimination: 1.5,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'extr_5_a',
        text: 'Think out loud or talk it through with others',
        traitDeltas: { extraversion: 0.15 },
        value: 1,
      },
      {
        id: 'extr_5_b',
        text: 'Need quiet time to think internally first',
        traitDeltas: { extraversion: -0.15 },
        value: -1,
      },
    ],
  },

  // =============================================================================
  // AGREEABLENESS (4 questions)
  // =============================================================================
  {
    id: 'agre_1_conflict',
    type: 'ab',
    text: 'In a disagreement, you tend to...',
    primaryTrait: 'agreeableness',
    secondaryTraits: { neuroticism: 0.2 },
    difficulty: 0,
    discrimination: 1.5,
    isAnchor: true,
    category: 'personality',
    answers: [
      {
        id: 'agre_1_a',
        text: 'Prioritize harmony, find middle ground',
        traitDeltas: { agreeableness: 0.2, neuroticism: 0.05 },
        value: 1,
      },
      {
        id: 'agre_1_b',
        text: "Stand your ground if you believe you're right",
        traitDeltas: { agreeableness: -0.15, conscientiousness: 0.1, extraversion: 0.1 },
        value: -1,
      },
    ],
  },
  {
    id: 'agre_2_help',
    type: 'ab',
    text: "When someone asks for help at an inconvenient time...",
    primaryTrait: 'agreeableness',
    difficulty: 0.4,
    discrimination: 1.4,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'agre_2_a',
        text: "You usually drop what you're doing to help",
        traitDeltas: { agreeableness: 0.2, conscientiousness: -0.05 },
        value: 1,
      },
      {
        id: 'agre_2_b',
        text: 'You set boundaries and offer help later',
        traitDeltas: { agreeableness: -0.1, conscientiousness: 0.1 },
        value: -1,
      },
    ],
  },
  {
    id: 'agre_3_trust',
    type: 'ab',
    text: 'When meeting new people, you...',
    primaryTrait: 'agreeableness',
    secondaryTraits: { openness: 0.3 },
    difficulty: 0.2,
    discrimination: 1.3,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'agre_3_a',
        text: 'Trust them until given reason not to',
        traitDeltas: { agreeableness: 0.15, openness: 0.1 },
        value: 1,
      },
      {
        id: 'agre_3_b',
        text: 'Stay cautious until they prove trustworthy',
        traitDeltas: { agreeableness: -0.1, neuroticism: 0.05 },
        value: -1,
      },
    ],
  },
  {
    id: 'agre_4_criticism',
    type: 'ab',
    text: 'When you need to give critical feedback...',
    primaryTrait: 'agreeableness',
    difficulty: 0.6,
    discrimination: 1.5,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'agre_4_a',
        text: 'You soften it to protect feelings',
        traitDeltas: { agreeableness: 0.15, neuroticism: 0.05 },
        value: 1,
      },
      {
        id: 'agre_4_b',
        text: "You're direct – honesty is more helpful",
        traitDeltas: { agreeableness: -0.1, conscientiousness: 0.1 },
        value: -1,
      },
    ],
  },

  // =============================================================================
  // NEUROTICISM (4 questions)
  // =============================================================================
  {
    id: 'neur_1_emotions',
    type: 'ab',
    text: 'When experiencing strong emotions...',
    primaryTrait: 'neuroticism',
    secondaryTraits: { aestheticSensitivity: 0.4, openness: 0.3 },
    difficulty: 0,
    discrimination: 1.5,
    isAnchor: true,
    category: 'personality',
    answers: [
      {
        id: 'neur_1_a',
        text: 'You process through art, music, expression',
        traitDeltas: { aestheticSensitivity: 0.2, openness: 0.1, neuroticism: 0.1 },
        value: 0.5,
      },
      {
        id: 'neur_1_b',
        text: 'You prefer action, problem-solving, moving forward',
        traitDeltas: { conscientiousness: 0.15, extraversion: 0.1, neuroticism: -0.1 },
        value: -0.5,
      },
    ],
  },
  {
    id: 'neur_2_worry',
    type: 'ab',
    text: 'Before important events, you typically...',
    primaryTrait: 'neuroticism',
    difficulty: -0.2,
    discrimination: 1.6,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'neur_2_a',
        text: 'Feel anxious and run through worst-case scenarios',
        traitDeltas: { neuroticism: 0.2 },
        value: 1,
      },
      {
        id: 'neur_2_b',
        text: 'Stay calm and trust things will work out',
        traitDeltas: { neuroticism: -0.15 },
        value: -1,
      },
    ],
  },
  {
    id: 'neur_3_setbacks',
    type: 'ab',
    text: 'After a setback or failure, you...',
    primaryTrait: 'neuroticism',
    difficulty: 0.3,
    discrimination: 1.5,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'neur_3_a',
        text: 'Dwell on it and feel it deeply for a while',
        traitDeltas: { neuroticism: 0.15, aestheticSensitivity: 0.05 },
        value: 1,
      },
      {
        id: 'neur_3_b',
        text: 'Bounce back quickly and move on',
        traitDeltas: { neuroticism: -0.15, riskTolerance: 0.05 },
        value: -1,
      },
    ],
  },
  {
    id: 'neur_4_mood',
    type: 'multiple',
    text: 'Your emotional baseline is usually...',
    primaryTrait: 'neuroticism',
    difficulty: 0,
    discrimination: 1.4,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'neur_4_a',
        text: 'Steady and calm',
        traitDeltas: { neuroticism: -0.2 },
        value: 0,
      },
      {
        id: 'neur_4_b',
        text: 'Generally positive with occasional dips',
        traitDeltas: { neuroticism: -0.05, extraversion: 0.1 },
        value: 0.25,
      },
      {
        id: 'neur_4_c',
        text: 'Variable – I feel things intensely',
        traitDeltas: { neuroticism: 0.1, aestheticSensitivity: 0.1 },
        value: 0.75,
      },
      {
        id: 'neur_4_d',
        text: 'Often anxious or on edge',
        traitDeltas: { neuroticism: 0.2 },
        value: 1,
      },
    ],
  },

  // =============================================================================
  // NOVELTY SEEKING (4 questions)
  // =============================================================================
  {
    id: 'novl_1_routine',
    type: 'ab',
    text: 'When it comes to daily routines...',
    primaryTrait: 'noveltySeeking',
    secondaryTraits: { openness: 0.6, conscientiousness: -0.4 },
    difficulty: 0,
    discrimination: 1.6,
    isAnchor: true,
    category: 'personality',
    answers: [
      {
        id: 'novl_1_a',
        text: 'I crave variety and get bored with sameness',
        traitDeltas: { noveltySeeking: 0.2, openness: 0.1, conscientiousness: -0.1 },
        value: 1,
      },
      {
        id: 'novl_1_b',
        text: 'I find comfort and efficiency in routines',
        traitDeltas: { noveltySeeking: -0.15, conscientiousness: 0.15 },
        value: -1,
      },
    ],
  },
  {
    id: 'novl_2_music',
    type: 'ab',
    text: 'With music, you prefer to...',
    primaryTrait: 'noveltySeeking',
    secondaryTraits: { aestheticSensitivity: 0.3 },
    difficulty: 0.2,
    discrimination: 1.4,
    isAnchor: false,
    category: 'aesthetic',
    answers: [
      {
        id: 'novl_2_a',
        text: 'Constantly discover new artists and genres',
        traitDeltas: { noveltySeeking: 0.2, openness: 0.1 },
        value: 1,
      },
      {
        id: 'novl_2_b',
        text: 'Deepen your connection with favorites',
        traitDeltas: { noveltySeeking: -0.1, aestheticSensitivity: 0.1 },
        value: -1,
      },
    ],
  },
  {
    id: 'novl_3_travel',
    type: 'multiple',
    text: 'When traveling, you prefer...',
    primaryTrait: 'noveltySeeking',
    secondaryTraits: { riskTolerance: 0.4 },
    difficulty: 0.3,
    discrimination: 1.5,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'novl_3_a',
        text: 'Unexplored destinations with no itinerary',
        traitDeltas: { noveltySeeking: 0.2, riskTolerance: 0.15 },
        value: 1,
      },
      {
        id: 'novl_3_b',
        text: 'New places with a flexible plan',
        traitDeltas: { noveltySeeking: 0.1, openness: 0.1 },
        value: 0.66,
      },
      {
        id: 'novl_3_c',
        text: 'New places with a detailed itinerary',
        traitDeltas: { noveltySeeking: 0.05, conscientiousness: 0.1 },
        value: 0.33,
      },
      {
        id: 'novl_3_d',
        text: 'Returning to beloved destinations',
        traitDeltas: { noveltySeeking: -0.15 },
        value: 0,
      },
    ],
  },
  {
    id: 'novl_4_food',
    type: 'ab',
    text: 'At a restaurant, you typically...',
    primaryTrait: 'noveltySeeking',
    difficulty: -0.3,
    discrimination: 1.3,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'novl_4_a',
        text: 'Order something new every time',
        traitDeltas: { noveltySeeking: 0.15, openness: 0.1 },
        value: 1,
      },
      {
        id: 'novl_4_b',
        text: 'Stick with your go-to favorite',
        traitDeltas: { noveltySeeking: -0.15 },
        value: -1,
      },
    ],
  },

  // =============================================================================
  // AESTHETIC SENSITIVITY (5 questions)
  // =============================================================================
  {
    id: 'aest_1_space',
    type: 'multiple',
    text: 'Which space feels most like home?',
    primaryTrait: 'aestheticSensitivity',
    secondaryTraits: { openness: 0.3 },
    difficulty: 0,
    discrimination: 1.5,
    isAnchor: true,
    category: 'aesthetic',
    answers: [
      {
        id: 'aest_1_a',
        text: 'Warm, golden light with natural materials',
        traitDeltas: { agreeableness: 0.1, aestheticSensitivity: 0.15 },
        aestheticAdjustment: { darknessPreference: -0.2, organicVsSynthetic: -0.3 },
        value: 0.5,
      },
      {
        id: 'aest_1_b',
        text: 'Cool, minimal space with clean lines',
        traitDeltas: { conscientiousness: 0.15, aestheticSensitivity: 0.1 },
        aestheticAdjustment: { complexityPreference: -0.2, minimalVsMaximal: -0.3 },
        value: 0.5,
      },
      {
        id: 'aest_1_c',
        text: 'Moody, layered with collected objects',
        traitDeltas: { openness: 0.15, aestheticSensitivity: 0.2 },
        aestheticAdjustment: { darknessPreference: 0.2, complexityPreference: 0.2 },
        value: 0.75,
      },
      {
        id: 'aest_1_d',
        text: 'High-tech, futuristic, neon accents',
        traitDeltas: { noveltySeeking: 0.15, openness: 0.1 },
        aestheticAdjustment: { organicVsSynthetic: 0.3, darknessPreference: 0.1 },
        value: 0.75,
      },
    ],
  },
  {
    id: 'aest_2_beauty',
    type: 'ab',
    text: 'When you encounter something beautiful...',
    primaryTrait: 'aestheticSensitivity',
    difficulty: 0.3,
    discrimination: 1.7,
    isAnchor: false,
    category: 'aesthetic',
    answers: [
      {
        id: 'aest_2_a',
        text: 'You feel it physically – chills, tears, wonder',
        traitDeltas: { aestheticSensitivity: 0.2, openness: 0.1 },
        value: 1,
      },
      {
        id: 'aest_2_b',
        text: 'You appreciate it intellectually but stay composed',
        traitDeltas: { aestheticSensitivity: -0.1, conscientiousness: 0.05 },
        value: -1,
      },
    ],
  },
  {
    id: 'aest_3_details',
    type: 'ab',
    text: 'In visual design, you notice...',
    primaryTrait: 'aestheticSensitivity',
    difficulty: 0.5,
    discrimination: 1.6,
    isAnchor: false,
    category: 'aesthetic',
    answers: [
      {
        id: 'aest_3_a',
        text: 'Subtle details others miss – spacing, color harmony',
        traitDeltas: { aestheticSensitivity: 0.2, conscientiousness: 0.1 },
        value: 1,
      },
      {
        id: 'aest_3_b',
        text: 'The overall vibe more than specifics',
        traitDeltas: { aestheticSensitivity: -0.05, openness: 0.05 },
        value: -1,
      },
    ],
  },
  {
    id: 'aest_4_music_energy',
    type: 'multiple',
    text: 'What energy do you seek in music?',
    primaryTrait: 'aestheticSensitivity',
    secondaryTraits: { extraversion: 0.3, noveltySeeking: 0.2 },
    difficulty: 0,
    discrimination: 1.4,
    isAnchor: false,
    category: 'aesthetic',
    answers: [
      {
        id: 'aest_4_a',
        text: 'Calm, ambient, floating',
        traitDeltas: { neuroticism: 0.1, openness: 0.1 },
        aestheticAdjustment: { tempoCenter: -30, energyCenter: -0.3 },
        value: 0.5,
      },
      {
        id: 'aest_4_b',
        text: 'Rhythmic, groovy, makes me move',
        traitDeltas: { extraversion: 0.15, agreeableness: 0.05 },
        aestheticAdjustment: { tempoCenter: 10, energyCenter: 0.1 },
        value: 0.5,
      },
      {
        id: 'aest_4_c',
        text: 'Intense, driving, adrenaline',
        traitDeltas: { riskTolerance: 0.15, noveltySeeking: 0.1, extraversion: 0.1 },
        aestheticAdjustment: { tempoCenter: 40, energyCenter: 0.3 },
        value: 0.75,
      },
      {
        id: 'aest_4_d',
        text: 'Eclectic, unpredictable, experimental',
        traitDeltas: { openness: 0.2, noveltySeeking: 0.2, aestheticSensitivity: 0.15 },
        aestheticAdjustment: { tempoCenter: 0, energyCenter: 0 },
        value: 1,
      },
    ],
  },
  {
    id: 'aest_5_ugliness',
    type: 'ab',
    text: 'Environments that are ugly or poorly designed...',
    primaryTrait: 'aestheticSensitivity',
    difficulty: 0.6,
    discrimination: 1.8,
    isAnchor: false,
    category: 'aesthetic',
    answers: [
      {
        id: 'aest_5_a',
        text: 'Genuinely affect my mood and wellbeing',
        traitDeltas: { aestheticSensitivity: 0.2, neuroticism: 0.1 },
        value: 1,
      },
      {
        id: 'aest_5_b',
        text: "Don't bother me much if they're functional",
        traitDeltas: { aestheticSensitivity: -0.15, conscientiousness: 0.05 },
        value: -1,
      },
    ],
  },

  // =============================================================================
  // RISK TOLERANCE (4 questions)
  // =============================================================================
  {
    id: 'risk_1_security',
    type: 'ab',
    text: 'Given the choice between security and opportunity...',
    primaryTrait: 'riskTolerance',
    secondaryTraits: { noveltySeeking: 0.4, conscientiousness: -0.3 },
    difficulty: 0,
    discrimination: 1.6,
    isAnchor: true,
    category: 'personality',
    answers: [
      {
        id: 'risk_1_a',
        text: "I'd take the risky opportunity with higher upside",
        traitDeltas: { riskTolerance: 0.2, noveltySeeking: 0.1 },
        value: 1,
      },
      {
        id: 'risk_1_b',
        text: "I'd take the safe path with guaranteed outcomes",
        traitDeltas: { riskTolerance: -0.15, conscientiousness: 0.1 },
        value: -1,
      },
    ],
  },
  {
    id: 'risk_2_uncertainty',
    type: 'ab',
    text: 'When facing major uncertainty, you feel...',
    primaryTrait: 'riskTolerance',
    secondaryTraits: { neuroticism: -0.5 },
    difficulty: 0.3,
    discrimination: 1.5,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'risk_2_a',
        text: 'Excited by the possibilities',
        traitDeltas: { riskTolerance: 0.15, openness: 0.1, neuroticism: -0.1 },
        value: 1,
      },
      {
        id: 'risk_2_b',
        text: 'Anxious until things are clearer',
        traitDeltas: { riskTolerance: -0.15, neuroticism: 0.15 },
        value: -1,
      },
    ],
  },
  {
    id: 'risk_3_failure',
    type: 'ab',
    text: 'The possibility of failure...',
    primaryTrait: 'riskTolerance',
    difficulty: 0.4,
    discrimination: 1.5,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'risk_3_a',
        text: 'Is worth it for the chance of something great',
        traitDeltas: { riskTolerance: 0.2, noveltySeeking: 0.1 },
        value: 1,
      },
      {
        id: 'risk_3_b',
        text: 'Makes me carefully evaluate before acting',
        traitDeltas: { riskTolerance: -0.1, conscientiousness: 0.15 },
        value: -1,
      },
    ],
  },
  {
    id: 'risk_4_comfort',
    type: 'ab',
    text: 'Staying in your comfort zone...',
    primaryTrait: 'riskTolerance',
    secondaryTraits: { noveltySeeking: -0.4 },
    difficulty: 0.2,
    discrimination: 1.4,
    isAnchor: false,
    category: 'personality',
    answers: [
      {
        id: 'risk_4_a',
        text: 'Feels limiting – growth requires discomfort',
        traitDeltas: { riskTolerance: 0.15, noveltySeeking: 0.1, openness: 0.1 },
        value: 1,
      },
      {
        id: 'risk_4_b',
        text: "Feels wise – why fix what isn't broken?",
        traitDeltas: { riskTolerance: -0.15, conscientiousness: 0.1 },
        value: -1,
      },
    ],
  },

  // =============================================================================
  // IMAGE QUESTIONS (Visual Aesthetic Seeding)
  // =============================================================================
  {
    id: 'img_1_visual',
    type: 'image',
    text: 'Which image draws you in?',
    subtext: 'Trust your first instinct.',
    primaryTrait: 'aestheticSensitivity',
    secondaryTraits: { openness: 0.5 },
    difficulty: 0,
    discrimination: 1.3,
    isAnchor: true,
    category: 'aesthetic',
    answers: [
      {
        id: 'img_1_a',
        text: 'Misty forest at dawn',
        imageUrl: '/images/quiz/forest-mist.jpg',
        traitDeltas: { openness: 0.1, agreeableness: 0.1 },
        aestheticAdjustment: { darknessPreference: 0.1, organicVsSynthetic: -0.3 },
        value: 0.5,
      },
      {
        id: 'img_1_b',
        text: 'Neon-lit city at night',
        imageUrl: '/images/quiz/neon-city.jpg',
        traitDeltas: { noveltySeeking: 0.15, extraversion: 0.1 },
        aestheticAdjustment: { darknessPreference: 0.3, organicVsSynthetic: 0.2 },
        value: 0.75,
      },
      {
        id: 'img_1_c',
        text: 'Abstract geometric patterns',
        imageUrl: '/images/quiz/geometric.jpg',
        traitDeltas: { conscientiousness: 0.1, aestheticSensitivity: 0.15 },
        aestheticAdjustment: { organicVsSynthetic: 0.1, complexityPreference: 0.1 },
        value: 0.5,
      },
      {
        id: 'img_1_d',
        text: 'Cosmic nebula in deep space',
        imageUrl: '/images/quiz/nebula.jpg',
        traitDeltas: { openness: 0.2, aestheticSensitivity: 0.2 },
        aestheticAdjustment: { darknessPreference: 0.2, complexityPreference: 0.2 },
        value: 1,
      },
    ],
  },
  {
    id: 'img_2_visual',
    type: 'image',
    text: 'And this set?',
    subtext: 'Go with your feeling.',
    primaryTrait: 'aestheticSensitivity',
    secondaryTraits: { openness: 0.4 },
    difficulty: 0.2,
    discrimination: 1.4,
    isAnchor: true,
    category: 'aesthetic',
    answers: [
      {
        id: 'img_2_a',
        text: 'Candlelit ritual space',
        imageUrl: '/images/quiz/ritual.jpg',
        traitDeltas: { openness: 0.15, aestheticSensitivity: 0.2 },
        aestheticAdjustment: { darknessPreference: 0.25, organicVsSynthetic: -0.1 },
        value: 0.75,
      },
      {
        id: 'img_2_b',
        text: 'Brutalist concrete architecture',
        imageUrl: '/images/quiz/brutalist.jpg',
        traitDeltas: { conscientiousness: 0.1, riskTolerance: 0.1 },
        aestheticAdjustment: { minimalVsMaximal: -0.2, organicVsSynthetic: 0.2 },
        value: 0.5,
      },
      {
        id: 'img_2_c',
        text: 'Iridescent bubble textures',
        imageUrl: '/images/quiz/iridescent.jpg',
        traitDeltas: { noveltySeeking: 0.15, openness: 0.15 },
        aestheticAdjustment: { complexityPreference: 0.1, organicVsSynthetic: 0.1 },
        value: 0.75,
      },
      {
        id: 'img_2_d',
        text: 'Golden hour landscape',
        imageUrl: '/images/quiz/golden-hour.jpg',
        traitDeltas: { agreeableness: 0.15, neuroticism: -0.1 },
        aestheticAdjustment: { darknessPreference: -0.2, organicVsSynthetic: -0.2 },
        value: 0.5,
      },
    ],
  },

  // =============================================================================
  // IDENTITY QUESTIONS (Constellation Hints)
  // =============================================================================
  {
    id: 'iden_1_role',
    type: 'multiple',
    text: 'Which role resonates most?',
    subtext: 'Not what you do, but who you are.',
    primaryTrait: 'openness',
    secondaryTraits: {
      noveltySeeking: 0.5,
      aestheticSensitivity: 0.4,
      extraversion: 0.3,
    },
    difficulty: 0.5,
    discrimination: 1.5,
    isAnchor: true,
    category: 'identity',
    answers: [
      {
        id: 'iden_1_a',
        text: 'The Explorer: always seeking the new',
        traitDeltas: { noveltySeeking: 0.2, openness: 0.15, riskTolerance: 0.15 },
        value: 0.8,
      },
      {
        id: 'iden_1_b',
        text: 'The Curator: discerning, selective, refined',
        traitDeltas: { aestheticSensitivity: 0.2, conscientiousness: 0.1, openness: 0.1 },
        value: 0.6,
      },
      {
        id: 'iden_1_c',
        text: 'The Connector: bridging people and ideas',
        traitDeltas: { extraversion: 0.15, agreeableness: 0.2, openness: 0.1 },
        value: 0.5,
      },
      {
        id: 'iden_1_d',
        text: 'The Dreamer: inner world rich and vast',
        traitDeltas: { openness: 0.2, neuroticism: 0.1, aestheticSensitivity: 0.15 },
        value: 0.7,
      },
    ],
  },
  {
    id: 'iden_2_complexity',
    type: 'ab',
    text: 'In design and art, you prefer...',
    primaryTrait: 'aestheticSensitivity',
    secondaryTraits: { openness: 0.3 },
    difficulty: 0,
    discrimination: 1.4,
    isAnchor: false,
    category: 'aesthetic',
    answers: [
      {
        id: 'iden_2_a',
        text: 'Clean, minimal, breathing room',
        traitDeltas: { conscientiousness: 0.1, neuroticism: -0.1 },
        aestheticAdjustment: { minimalVsMaximal: -0.3, complexityPreference: -0.2 },
        value: 0,
      },
      {
        id: 'iden_2_b',
        text: 'Rich, layered, maximalist',
        traitDeltas: { openness: 0.15, aestheticSensitivity: 0.15 },
        aestheticAdjustment: { minimalVsMaximal: 0.3, complexityPreference: 0.2 },
        value: 1,
      },
    ],
  },
  {
    id: 'iden_3_sound',
    type: 'ab',
    text: 'Sound textures you gravitate toward...',
    primaryTrait: 'aestheticSensitivity',
    difficulty: 0.2,
    discrimination: 1.3,
    isAnchor: false,
    category: 'aesthetic',
    answers: [
      {
        id: 'iden_3_a',
        text: 'Organic: strings, wood, voice, breath',
        traitDeltas: { agreeableness: 0.1, aestheticSensitivity: 0.1 },
        aestheticAdjustment: { acousticVsDigital: -0.3, organicVsSynthetic: -0.2 },
        value: 0,
      },
      {
        id: 'iden_3_b',
        text: 'Synthetic: synths, processed, electronic',
        traitDeltas: { noveltySeeking: 0.1, openness: 0.1 },
        aestheticAdjustment: { acousticVsDigital: 0.3, organicVsSynthetic: 0.2 },
        value: 1,
      },
    ],
  },

  // === ADDITIONAL QUESTIONS FOR VARIETY ===

  // Openness - Additional
  {
    id: 'open_add_1',
    text: 'When you encounter art you don\'t understand, you typically:',
    category: 'personality',
    primaryTrait: 'openness',
    difficulty: 0.5,
    informationValue: 0.7,
    answers: [
      {
        id: 'open_add_1_a',
        text: 'Try to figure out what the artist meant',
        traitDeltas: { openness: 0.15, aestheticSensitivity: 0.1 },
        value: 1,
      },
      {
        id: 'open_add_1_b',
        text: 'Move on to something more accessible',
        traitDeltas: { openness: -0.1, conscientiousness: 0.05 },
        value: 0,
      },
    ],
  },
  {
    id: 'open_add_2',
    text: 'How do you feel about abstract concepts in music or visuals?',
    category: 'aesthetic',
    primaryTrait: 'openness',
    difficulty: 0.6,
    informationValue: 0.7,
    answers: [
      {
        id: 'open_add_2_a',
        text: 'I find them fascinating and thought-provoking',
        traitDeltas: { openness: 0.15, aestheticSensitivity: 0.1 },
        value: 1,
      },
      {
        id: 'open_add_2_b',
        text: 'I prefer things with clear meaning',
        traitDeltas: { openness: -0.1, conscientiousness: 0.1 },
        value: 0,
      },
    ],
  },
  {
    id: 'open_add_3',
    text: 'When traveling, you prefer:',
    category: 'behavioral',
    primaryTrait: 'openness',
    difficulty: 0.4,
    informationValue: 0.6,
    answers: [
      {
        id: 'open_add_3_a',
        text: 'Exploring unfamiliar neighborhoods and local spots',
        traitDeltas: { openness: 0.15, noveltySeeking: 0.1 },
        value: 1,
      },
      {
        id: 'open_add_3_b',
        text: 'Visiting well-known landmarks and tourist areas',
        traitDeltas: { openness: -0.1, conscientiousness: 0.1 },
        value: 0,
      },
    ],
  },
  {
    id: 'open_add_4',
    text: 'Your ideal reading material is:',
    category: 'personality',
    primaryTrait: 'openness',
    difficulty: 0.5,
    informationValue: 0.65,
    answers: [
      {
        id: 'open_add_4_a',
        text: 'Something that challenges my worldview',
        traitDeltas: { openness: 0.15, noveltySeeking: 0.1 },
        value: 1,
      },
      {
        id: 'open_add_4_b',
        text: 'Something familiar and comforting',
        traitDeltas: { openness: -0.1, agreeableness: 0.05 },
        value: 0,
      },
    ],
  },

  // Conscientiousness - Additional
  {
    id: 'cons_add_1',
    text: 'When starting a creative project, you:',
    category: 'behavioral',
    primaryTrait: 'conscientiousness',
    difficulty: 0.5,
    informationValue: 0.7,
    answers: [
      {
        id: 'cons_add_1_a',
        text: 'Plan everything before beginning',
        traitDeltas: { conscientiousness: 0.15, openness: -0.05 },
        value: 1,
      },
      {
        id: 'cons_add_1_b',
        text: 'Dive in and figure it out as you go',
        traitDeltas: { conscientiousness: -0.1, openness: 0.1 },
        value: 0,
      },
    ],
  },
  {
    id: 'cons_add_2',
    text: 'Your workspace is usually:',
    category: 'behavioral',
    primaryTrait: 'conscientiousness',
    difficulty: 0.4,
    informationValue: 0.65,
    answers: [
      {
        id: 'cons_add_2_a',
        text: 'Organized with everything in its place',
        traitDeltas: { conscientiousness: 0.15 },
        value: 1,
      },
      {
        id: 'cons_add_2_b',
        text: 'Creative chaos that works for me',
        traitDeltas: { conscientiousness: -0.1, openness: 0.1 },
        value: 0,
      },
    ],
  },
  {
    id: 'cons_add_3',
    text: 'When curating a playlist or collection, you:',
    category: 'aesthetic',
    primaryTrait: 'conscientiousness',
    difficulty: 0.5,
    informationValue: 0.7,
    answers: [
      {
        id: 'cons_add_3_a',
        text: 'Carefully organize by mood, genre, or theme',
        traitDeltas: { conscientiousness: 0.15, aestheticSensitivity: 0.05 },
        value: 1,
      },
      {
        id: 'cons_add_3_b',
        text: 'Just add things you like without much order',
        traitDeltas: { conscientiousness: -0.1, openness: 0.05 },
        value: 0,
      },
    ],
  },
  {
    id: 'cons_add_4',
    text: 'How do you approach deadlines?',
    category: 'behavioral',
    primaryTrait: 'conscientiousness',
    difficulty: 0.4,
    informationValue: 0.65,
    answers: [
      {
        id: 'cons_add_4_a',
        text: 'Finish well ahead of time',
        traitDeltas: { conscientiousness: 0.15 },
        value: 1,
      },
      {
        id: 'cons_add_4_b',
        text: 'Work best under last-minute pressure',
        traitDeltas: { conscientiousness: -0.1, riskTolerance: 0.1 },
        value: 0,
      },
    ],
  },

  // Extraversion - Additional
  {
    id: 'extr_add_1',
    text: 'At a gallery opening or concert, you:',
    category: 'behavioral',
    primaryTrait: 'extraversion',
    difficulty: 0.5,
    informationValue: 0.7,
    answers: [
      {
        id: 'extr_add_1_a',
        text: 'Strike up conversations with strangers',
        traitDeltas: { extraversion: 0.15, openness: 0.05 },
        value: 1,
      },
      {
        id: 'extr_add_1_b',
        text: 'Focus on the art/music and observe quietly',
        traitDeltas: { extraversion: -0.1, aestheticSensitivity: 0.1 },
        value: 0,
      },
    ],
  },
  {
    id: 'extr_add_2',
    text: 'Your ideal weekend involves:',
    category: 'behavioral',
    primaryTrait: 'extraversion',
    difficulty: 0.4,
    informationValue: 0.65,
    answers: [
      {
        id: 'extr_add_2_a',
        text: 'Social events and being around people',
        traitDeltas: { extraversion: 0.15 },
        value: 1,
      },
      {
        id: 'extr_add_2_b',
        text: 'Quiet time alone or with one close friend',
        traitDeltas: { extraversion: -0.15, aestheticSensitivity: 0.05 },
        value: 0,
      },
    ],
  },
  {
    id: 'extr_add_3',
    text: 'When discovering new music, you prefer:',
    category: 'aesthetic',
    primaryTrait: 'extraversion',
    difficulty: 0.5,
    informationValue: 0.65,
    answers: [
      {
        id: 'extr_add_3_a',
        text: 'Sharing and discussing it with friends immediately',
        traitDeltas: { extraversion: 0.15, agreeableness: 0.05 },
        value: 1,
      },
      {
        id: 'extr_add_3_b',
        text: 'Keeping it to yourself for a while first',
        traitDeltas: { extraversion: -0.1, aestheticSensitivity: 0.1 },
        value: 0,
      },
    ],
  },
  {
    id: 'extr_add_4',
    text: 'After a long day, you recharge by:',
    category: 'behavioral',
    primaryTrait: 'extraversion',
    difficulty: 0.4,
    informationValue: 0.7,
    answers: [
      {
        id: 'extr_add_4_a',
        text: 'Going out and socializing',
        traitDeltas: { extraversion: 0.15 },
        value: 1,
      },
      {
        id: 'extr_add_4_b',
        text: 'Being alone in a quiet space',
        traitDeltas: { extraversion: -0.15 },
        value: 0,
      },
    ],
  },

  // Agreeableness - Additional
  {
    id: 'agree_add_1',
    text: 'When someone shares art you dislike, you:',
    category: 'behavioral',
    primaryTrait: 'agreeableness',
    difficulty: 0.5,
    informationValue: 0.7,
    answers: [
      {
        id: 'agree_add_1_a',
        text: 'Find something positive to say about it',
        traitDeltas: { agreeableness: 0.15 },
        value: 1,
      },
      {
        id: 'agree_add_1_b',
        text: 'Share your honest critique',
        traitDeltas: { agreeableness: -0.1, openness: 0.1 },
        value: 0,
      },
    ],
  },
  {
    id: 'agree_add_2',
    text: 'In collaborative creative projects, you tend to:',
    category: 'behavioral',
    primaryTrait: 'agreeableness',
    difficulty: 0.5,
    informationValue: 0.7,
    answers: [
      {
        id: 'agree_add_2_a',
        text: 'Compromise to keep harmony',
        traitDeltas: { agreeableness: 0.15 },
        value: 1,
      },
      {
        id: 'agree_add_2_b',
        text: 'Push for your vision even if it causes friction',
        traitDeltas: { agreeableness: -0.1, riskTolerance: 0.1 },
        value: 0,
      },
    ],
  },
  {
    id: 'agree_add_3',
    text: 'How do you feel about confrontational art?',
    category: 'aesthetic',
    primaryTrait: 'agreeableness',
    difficulty: 0.6,
    informationValue: 0.7,
    answers: [
      {
        id: 'agree_add_3_a',
        text: 'It makes me uncomfortable',
        traitDeltas: { agreeableness: 0.15 },
        aestheticAdjustment: { darknessPreference: -0.1 },
        value: 1,
      },
      {
        id: 'agree_add_3_b',
        text: 'I appreciate its power and honesty',
        traitDeltas: { agreeableness: -0.1, openness: 0.15 },
        aestheticAdjustment: { darknessPreference: 0.1 },
        value: 0,
      },
    ],
  },
  {
    id: 'agree_add_4',
    text: 'Your approach to giving feedback on creative work:',
    category: 'behavioral',
    primaryTrait: 'agreeableness',
    difficulty: 0.5,
    informationValue: 0.65,
    answers: [
      {
        id: 'agree_add_4_a',
        text: 'Gentle and encouraging, focusing on positives',
        traitDeltas: { agreeableness: 0.15 },
        value: 1,
      },
      {
        id: 'agree_add_4_b',
        text: 'Direct and honest, even if critical',
        traitDeltas: { agreeableness: -0.1, conscientiousness: 0.1 },
        value: 0,
      },
    ],
  },

  // Neuroticism - Additional
  {
    id: 'neur_add_1',
    text: 'When your favorite artist releases something unexpected, you:',
    category: 'personality',
    primaryTrait: 'neuroticism',
    difficulty: 0.5,
    informationValue: 0.7,
    answers: [
      {
        id: 'neur_add_1_a',
        text: 'Feel anxious it might disappoint you',
        traitDeltas: { neuroticism: 0.15 },
        value: 1,
      },
      {
        id: 'neur_add_1_b',
        text: 'Excitedly embrace the surprise',
        traitDeltas: { neuroticism: -0.15, openness: 0.1 },
        value: 0,
      },
    ],
  },
  {
    id: 'neur_add_2',
    text: 'How do you handle criticism of your taste?',
    category: 'personality',
    primaryTrait: 'neuroticism',
    difficulty: 0.5,
    informationValue: 0.7,
    answers: [
      {
        id: 'neur_add_2_a',
        text: 'It bothers me more than I\'d like to admit',
        traitDeltas: { neuroticism: 0.15 },
        value: 1,
      },
      {
        id: 'neur_add_2_b',
        text: 'I\'m confident in what I like',
        traitDeltas: { neuroticism: -0.15, riskTolerance: 0.1 },
        value: 0,
      },
    ],
  },
  {
    id: 'neur_add_3',
    text: 'Before a big event or performance, you feel:',
    category: 'personality',
    primaryTrait: 'neuroticism',
    difficulty: 0.4,
    informationValue: 0.65,
    answers: [
      {
        id: 'neur_add_3_a',
        text: 'Nervous and overthink what could go wrong',
        traitDeltas: { neuroticism: 0.15 },
        value: 1,
      },
      {
        id: 'neur_add_3_b',
        text: 'Calm and ready to enjoy it',
        traitDeltas: { neuroticism: -0.15, extraversion: 0.05 },
        value: 0,
      },
    ],
  },
  {
    id: 'neur_add_4',
    text: 'When things don\'t go as planned creatively:',
    category: 'personality',
    primaryTrait: 'neuroticism',
    difficulty: 0.5,
    informationValue: 0.7,
    answers: [
      {
        id: 'neur_add_4_a',
        text: 'I get frustrated and stressed',
        traitDeltas: { neuroticism: 0.15 },
        value: 1,
      },
      {
        id: 'neur_add_4_b',
        text: 'I adapt and see where it leads',
        traitDeltas: { neuroticism: -0.15, openness: 0.1 },
        value: 0,
      },
    ],
  },

  // Novelty Seeking - Additional
  {
    id: 'novel_add_1',
    text: 'Your music library is mostly:',
    category: 'aesthetic',
    primaryTrait: 'noveltySeeking',
    difficulty: 0.4,
    informationValue: 0.7,
    answers: [
      {
        id: 'novel_add_1_a',
        text: 'Recent discoveries and new releases',
        traitDeltas: { noveltySeeking: 0.15, openness: 0.1 },
        value: 1,
      },
      {
        id: 'novel_add_1_b',
        text: 'Familiar favorites I return to',
        traitDeltas: { noveltySeeking: -0.15 },
        value: 0,
      },
    ],
  },
  {
    id: 'novel_add_2',
    text: 'When a new social platform emerges:',
    category: 'behavioral',
    primaryTrait: 'noveltySeeking',
    difficulty: 0.5,
    informationValue: 0.7,
    answers: [
      {
        id: 'novel_add_2_a',
        text: 'I\'m among the first to try it',
        traitDeltas: { noveltySeeking: 0.15, riskTolerance: 0.1 },
        value: 1,
      },
      {
        id: 'novel_add_2_b',
        text: 'I wait to see if it\'s worth it',
        traitDeltas: { noveltySeeking: -0.15, conscientiousness: 0.1 },
        value: 0,
      },
    ],
  },
  {
    id: 'novel_add_3',
    text: 'At a restaurant, you typically order:',
    category: 'behavioral',
    primaryTrait: 'noveltySeeking',
    difficulty: 0.4,
    informationValue: 0.65,
    answers: [
      {
        id: 'novel_add_3_a',
        text: 'Something you\'ve never tried before',
        traitDeltas: { noveltySeeking: 0.15, openness: 0.1 },
        value: 1,
      },
      {
        id: 'novel_add_3_b',
        text: 'Your reliable favorite',
        traitDeltas: { noveltySeeking: -0.15, conscientiousness: 0.05 },
        value: 0,
      },
    ],
  },
  {
    id: 'novel_add_4',
    text: 'How do you feel about experimental art forms?',
    category: 'aesthetic',
    primaryTrait: 'noveltySeeking',
    difficulty: 0.5,
    informationValue: 0.7,
    answers: [
      {
        id: 'novel_add_4_a',
        text: 'They excite me - I love seeing boundaries pushed',
        traitDeltas: { noveltySeeking: 0.15, openness: 0.1 },
        aestheticAdjustment: { complexityPreference: 0.1 },
        value: 1,
      },
      {
        id: 'novel_add_4_b',
        text: 'I prefer art with proven appeal',
        traitDeltas: { noveltySeeking: -0.15 },
        value: 0,
      },
    ],
  },

  // Risk Tolerance - Additional
  {
    id: 'risk_add_1',
    text: 'Your approach to trying new creative software or tools:',
    category: 'behavioral',
    primaryTrait: 'riskTolerance',
    difficulty: 0.5,
    informationValue: 0.7,
    answers: [
      {
        id: 'risk_add_1_a',
        text: 'Jump in and learn by experimenting',
        traitDeltas: { riskTolerance: 0.15, noveltySeeking: 0.1 },
        value: 1,
      },
      {
        id: 'risk_add_1_b',
        text: 'Read tutorials and learn properly first',
        traitDeltas: { riskTolerance: -0.15, conscientiousness: 0.1 },
        value: 0,
      },
    ],
  },
  {
    id: 'risk_add_2',
    text: 'When investing time in a new hobby or skill:',
    category: 'behavioral',
    primaryTrait: 'riskTolerance',
    difficulty: 0.5,
    informationValue: 0.7,
    answers: [
      {
        id: 'risk_add_2_a',
        text: 'Willing to fail publicly while learning',
        traitDeltas: { riskTolerance: 0.15, openness: 0.1 },
        value: 1,
      },
      {
        id: 'risk_add_2_b',
        text: 'Practice privately until I\'m competent',
        traitDeltas: { riskTolerance: -0.15, neuroticism: 0.1 },
        value: 0,
      },
    ],
  },
  {
    id: 'risk_add_3',
    text: 'Your financial approach to supporting artists:',
    category: 'behavioral',
    primaryTrait: 'riskTolerance',
    difficulty: 0.5,
    informationValue: 0.65,
    answers: [
      {
        id: 'risk_add_3_a',
        text: 'Back unknown artists on potential alone',
        traitDeltas: { riskTolerance: 0.15, noveltySeeking: 0.1 },
        value: 1,
      },
      {
        id: 'risk_add_3_b',
        text: 'Support established artists with track records',
        traitDeltas: { riskTolerance: -0.15, conscientiousness: 0.1 },
        value: 0,
      },
    ],
  },
  {
    id: 'risk_add_4',
    text: 'When sharing your creative work publicly:',
    category: 'behavioral',
    primaryTrait: 'riskTolerance',
    difficulty: 0.5,
    informationValue: 0.7,
    answers: [
      {
        id: 'risk_add_4_a',
        text: 'I post without overthinking reactions',
        traitDeltas: { riskTolerance: 0.15, extraversion: 0.1 },
        value: 1,
      },
      {
        id: 'risk_add_4_b',
        text: 'I carefully curate and often hesitate',
        traitDeltas: { riskTolerance: -0.15, neuroticism: 0.1 },
        value: 0,
      },
    ],
  },

  // Aesthetic Sensitivity - Additional
  {
    id: 'aesth_add_1',
    text: 'How important is the visual design of album artwork to you?',
    category: 'aesthetic',
    primaryTrait: 'aestheticSensitivity',
    difficulty: 0.4,
    informationValue: 0.7,
    answers: [
      {
        id: 'aesth_add_1_a',
        text: 'Very - it shapes how I experience the music',
        traitDeltas: { aestheticSensitivity: 0.15 },
        value: 1,
      },
      {
        id: 'aesth_add_1_b',
        text: 'Not much - I focus on the sound',
        traitDeltas: { aestheticSensitivity: -0.1 },
        value: 0,
      },
    ],
  },
  {
    id: 'aesth_add_2',
    text: 'Do you notice small design details in everyday objects?',
    category: 'personality',
    primaryTrait: 'aestheticSensitivity',
    difficulty: 0.4,
    informationValue: 0.7,
    answers: [
      {
        id: 'aesth_add_2_a',
        text: 'Yes, constantly - good and bad design stands out',
        traitDeltas: { aestheticSensitivity: 0.15 },
        value: 1,
      },
      {
        id: 'aesth_add_2_b',
        text: 'Not really - if it works, it works',
        traitDeltas: { aestheticSensitivity: -0.1, conscientiousness: 0.1 },
        value: 0,
      },
    ],
  },
  {
    id: 'aesth_add_3',
    text: 'When choosing where to spend time:',
    category: 'behavioral',
    primaryTrait: 'aestheticSensitivity',
    difficulty: 0.5,
    informationValue: 0.7,
    answers: [
      {
        id: 'aesth_add_3_a',
        text: 'The atmosphere and aesthetics matter a lot',
        traitDeltas: { aestheticSensitivity: 0.15 },
        value: 1,
      },
      {
        id: 'aesth_add_3_b',
        text: 'Functionality and convenience come first',
        traitDeltas: { aestheticSensitivity: -0.1, conscientiousness: 0.1 },
        value: 0,
      },
    ],
  },
  {
    id: 'aesth_add_4',
    text: 'Your reaction to a beautifully shot but slow film:',
    category: 'aesthetic',
    primaryTrait: 'aestheticSensitivity',
    difficulty: 0.6,
    informationValue: 0.7,
    answers: [
      {
        id: 'aesth_add_4_a',
        text: 'I can appreciate it purely for the visuals',
        traitDeltas: { aestheticSensitivity: 0.15, openness: 0.1 },
        value: 1,
      },
      {
        id: 'aesth_add_4_b',
        text: 'I need a compelling story to stay engaged',
        traitDeltas: { aestheticSensitivity: -0.1 },
        value: 0,
      },
    ],
  },
];

/**
 * Get questions by trait
 */
export function getQuestionsByTrait(trait: TraitId): ItemBankQuestion[] {
  return itemBank.filter((q) => q.primaryTrait === trait);
}

/**
 * Get all anchor questions
 */
export function getAnchorQuestions(): ItemBankQuestion[] {
  return itemBank.filter((q) => q.isAnchor);
}

/**
 * Get questions by category
 */
export function getQuestionsByCategory(
  category: 'personality' | 'aesthetic' | 'identity'
): ItemBankQuestion[] {
  return itemBank.filter((q) => q.category === category);
}

/**
 * Get a question by ID
 */
export function getQuestionById(questionId: string): ItemBankQuestion | undefined {
  return itemBank.find((q) => q.id === questionId);
}

/**
 * Get a specific answer by question ID and answer ID
 */
export function getAnswerById(questionId: string, answerId: string): ItemAnswer | undefined {
  const question = getQuestionById(questionId);
  if (!question) return undefined;
  return question.answers.find((a) => a.id === answerId);
}

export default itemBank;
