/**
 * @subtaste/sdk
 *
 * SDK for integrating subtaste taste profiling into applications.
 */

// Client
export { SubtasteClient, createClient } from './client';
export type {
  SubtasteClientConfig,
  PublicProfile,
  QuizSubmission,
  QuizResult,
  SignalSubmission
} from './client';

// Refyn Adapter
export {
  derivePromptModifiers,
  getRefynContext,
  fetchRefynContext,
  adaptPromptForUser,
  generateTasteSystemPrompt,
  assessContentAffinity
} from './adapters/refyn';

export type {
  ComplexityLevel,
  PacingStyle,
  PromptModifiers,
  RefynTasteContext
} from './adapters/refyn';

// React Hooks (conditionally available)
export { useGenome, useProfiler } from './hooks';
export type {
  UseGenomeState,
  UseGenomeActions,
  UseGenomeReturn,
  UseProfilerState,
  UseProfilerActions,
  UseProfilerReturn,
  DisplayQuestion
} from './hooks';
