/**
 * @subtaste/profiler - Progressive Profiling Stages
 *
 * Defines the profiling journey from onboarding to deep calibration.
 */

import type { TasteGenome } from '@subtaste/core';

/**
 * Stage identifiers
 */
export type StageId = 'initial' | 'music' | 'deep';

/**
 * Stage trigger types
 */
export type StageTrigger = 'onboarding' | 'milestone' | 'periodic' | 'on-demand';

/**
 * Stage definition
 */
export interface ProfilingStage {
  id: StageId;
  name: string;
  description: string;
  trigger: StageTrigger;
  milestoneThreshold?: number;
  questionCount: number;
  estimatedSeconds: number;
  confidenceGain: number;
  prerequisites: StageId[];
}

/**
 * Profiling stage definitions
 */
export const PROFILING_STAGES: ProfilingStage[] = [
  {
    id: 'initial',
    name: 'Initial Spark',
    description: 'Three questions to discover your primary Glyph.',
    trigger: 'onboarding',
    questionCount: 3,
    estimatedSeconds: 30,
    confidenceGain: 0.3,
    prerequisites: []
  },
  {
    id: 'music',
    name: 'Music Calibration',
    description: 'Refine your taste profile with music-specific questions.',
    trigger: 'milestone',
    milestoneThreshold: 5,
    questionCount: 3,
    estimatedSeconds: 45,
    confidenceGain: 0.15,
    prerequisites: ['initial']
  },
  {
    id: 'deep',
    name: 'Deep Calibration',
    description: 'Unlock your full taste genome with an extended assessment.',
    trigger: 'on-demand',
    questionCount: 5,
    estimatedSeconds: 120,
    confidenceGain: 0.2,
    prerequisites: ['initial', 'music']
  }
];

/**
 * Get stage by ID
 */
export function getStage(id: StageId): ProfilingStage | undefined {
  return PROFILING_STAGES.find(s => s.id === id);
}

/**
 * Get all stages in order
 */
export function getAllStages(): ProfilingStage[] {
  return PROFILING_STAGES;
}

/**
 * User profiling state
 */
export interface ProfilingState {
  completedStages: StageId[];
  currentStage: StageId | null;
  interactionCount: number;
  lastStageCompletedAt: Date | null;
  totalConfidence: number;
}

/**
 * Create initial profiling state
 */
export function createProfilingState(): ProfilingState {
  return {
    completedStages: [],
    currentStage: null,
    interactionCount: 0,
    lastStageCompletedAt: null,
    totalConfidence: 0
  };
}

/**
 * Check if a stage is available
 */
export function isStageAvailable(
  stage: ProfilingStage,
  state: ProfilingState
): boolean {
  // Already completed
  if (state.completedStages.includes(stage.id)) {
    return false;
  }

  // Check prerequisites
  for (const prereq of stage.prerequisites) {
    if (!state.completedStages.includes(prereq)) {
      return false;
    }
  }

  // Check trigger conditions
  switch (stage.trigger) {
    case 'onboarding':
      return state.completedStages.length === 0;

    case 'milestone':
      return stage.milestoneThreshold !== undefined &&
             state.interactionCount >= stage.milestoneThreshold;

    case 'on-demand':
      return true;

    case 'periodic':
      if (!state.lastStageCompletedAt) return true;
      const daysSince = (Date.now() - state.lastStageCompletedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince >= 30;

    default:
      return false;
  }
}

/**
 * Get next available stage
 */
export function getNextAvailableStage(state: ProfilingState): ProfilingStage | null {
  // Prioritise by trigger type
  const priorityOrder: StageTrigger[] = ['onboarding', 'milestone', 'periodic', 'on-demand'];

  for (const trigger of priorityOrder) {
    const stage = PROFILING_STAGES.find(
      s => s.trigger === trigger && isStageAvailable(s, state)
    );
    if (stage) return stage;
  }

  return null;
}

/**
 * Mark a stage as complete
 */
export function completeStage(
  state: ProfilingState,
  stageId: StageId
): ProfilingState {
  const stage = getStage(stageId);
  if (!stage) return state;

  return {
    ...state,
    completedStages: [...state.completedStages, stageId],
    currentStage: null,
    lastStageCompletedAt: new Date(),
    totalConfidence: Math.min(0.95, state.totalConfidence + stage.confidenceGain)
  };
}

/**
 * Increment interaction count
 */
export function recordInteraction(state: ProfilingState): ProfilingState {
  return {
    ...state,
    interactionCount: state.interactionCount + 1
  };
}

/**
 * Check if should prompt for calibration
 */
export function shouldPromptCalibration(state: ProfilingState): boolean {
  const nextStage = getNextAvailableStage(state);

  if (!nextStage) return false;

  // Don't prompt for on-demand stages automatically
  if (nextStage.trigger === 'on-demand') return false;

  return true;
}

/**
 * Get profiling progress (0-1)
 */
export function getProfilingProgress(state: ProfilingState): number {
  return state.completedStages.length / PROFILING_STAGES.length;
}

/**
 * Estimate total confidence after completing all stages
 */
export function estimateFinalConfidence(): number {
  return PROFILING_STAGES.reduce((acc, stage) => acc + stage.confidenceGain, 0);
}
