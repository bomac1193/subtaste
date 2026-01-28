/**
 * @subtaste/profiler/progressive - Progressive Profiling Exports
 */

export {
  PROFILING_STAGES,
  getStage,
  getAllStages,
  createProfilingState,
  isStageAvailable,
  getNextAvailableStage,
  completeStage,
  recordInteraction,
  shouldPromptCalibration,
  getProfilingProgress,
  estimateFinalConfidence
} from './stages';

export type {
  StageId,
  StageTrigger,
  ProfilingStage,
  ProfilingState
} from './stages';

export {
  ProfilingOrchestrator,
  createOrchestrator
} from './orchestrator';

export type {
  OrchestratorState,
  OrchestratorEvent,
  EventHandler
} from './orchestrator';
