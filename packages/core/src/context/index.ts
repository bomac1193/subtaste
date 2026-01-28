/**
 * @subtaste/core/context - Multi-Context Profile Exports
 */

export {
  createContextProfile,
  getOrCreateContext,
  updateContext,
  getContextualDistribution,
  getContextualPrimary,
  detectContext,
  getActiveContexts
} from './multi';

export type { StandardContext, ContextDetection } from './multi';
