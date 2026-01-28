/**
 * @subtaste/profiler - Progressive Profiling Orchestrator
 *
 * Manages the flow of profiling stages and signal collection.
 */

import type { Signal, TasteGenome } from '@subtaste/core';
import { encodeSignalsToGenome, updateGenomeWithSignals } from '@subtaste/core';
import {
  type StageId,
  type ProfilingState,
  createProfilingState,
  getNextAvailableStage,
  completeStage,
  recordInteraction,
  shouldPromptCalibration,
  getProfilingProgress
} from './stages';
import {
  createInitialAssessment,
  completeAssessment,
  type InitialAssessmentState,
  type InitialAssessmentResult
} from '../instruments/initial';
import {
  createMusicCalibration,
  createDeepCalibration,
  completeCalibration,
  type CalibrationState,
  type CalibrationResult
} from '../instruments/calibration';
import { behaviourBatchToSignals, type BehaviouralEvent } from '../instruments/implicit';

/**
 * Orchestrator state
 */
export interface OrchestratorState {
  profiling: ProfilingState;
  genome: TasteGenome | null;
  pendingSignals: Signal[];
  activeAssessment: InitialAssessmentState | CalibrationState | null;
}

/**
 * Orchestrator events
 */
export type OrchestratorEvent =
  | { type: 'PROFILE_CREATED'; genome: TasteGenome }
  | { type: 'PROFILE_UPDATED'; genome: TasteGenome }
  | { type: 'STAGE_COMPLETED'; stageId: StageId }
  | { type: 'CALIBRATION_AVAILABLE'; stageId: StageId }
  | { type: 'CONFIDENCE_INCREASED'; newConfidence: number };

/**
 * Event handler type
 */
export type EventHandler = (event: OrchestratorEvent) => void;

/**
 * Profiling orchestrator
 */
export class ProfilingOrchestrator {
  private state: OrchestratorState;
  private eventHandlers: EventHandler[] = [];
  private userId: string;

  constructor(userId: string, existingGenome?: TasteGenome) {
    this.userId = userId;
    this.state = {
      profiling: createProfilingState(),
      genome: existingGenome || null,
      pendingSignals: [],
      activeAssessment: null
    };

    // If existing genome, infer profiling state
    if (existingGenome) {
      this.inferProfilingState(existingGenome);
    }
  }

  /**
   * Subscribe to orchestrator events
   */
  subscribe(handler: EventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
    };
  }

  /**
   * Emit an event to all handlers
   */
  private emit(event: OrchestratorEvent): void {
    for (const handler of this.eventHandlers) {
      handler(event);
    }
  }

  /**
   * Get current state
   */
  getState(): OrchestratorState {
    return this.state;
  }

  /**
   * Get current genome
   */
  getGenome(): TasteGenome | null {
    return this.state.genome;
  }

  /**
   * Get profiling progress
   */
  getProgress(): number {
    return getProfilingProgress(this.state.profiling);
  }

  /**
   * Start initial assessment
   */
  startInitialAssessment(): InitialAssessmentState {
    const assessment = createInitialAssessment();
    this.state.activeAssessment = assessment;
    return assessment;
  }

  /**
   * Start music calibration
   */
  startMusicCalibration(): CalibrationState {
    const calibration = createMusicCalibration();
    this.state.activeAssessment = calibration;
    return calibration;
  }

  /**
   * Start deep calibration
   */
  startDeepCalibration(): CalibrationState {
    const calibration = createDeepCalibration();
    this.state.activeAssessment = calibration;
    return calibration;
  }

  /**
   * Complete the active assessment
   */
  completeActiveAssessment(): TasteGenome | null {
    if (!this.state.activeAssessment) {
      return null;
    }

    const assessment = this.state.activeAssessment;

    // Check if it's initial assessment
    if ('questions' in assessment && assessment.questions[0]?.id.startsWith('init-')) {
      const result = completeAssessment(assessment as InitialAssessmentState);
      if (!result) return null;

      // Create genome from initial assessment
      const genome = encodeSignalsToGenome(this.userId, result.signals);

      this.state.genome = genome;
      this.state.profiling = completeStage(this.state.profiling, 'initial');
      this.state.activeAssessment = null;

      this.emit({ type: 'PROFILE_CREATED', genome });
      this.emit({ type: 'STAGE_COMPLETED', stageId: 'initial' });

      return genome;
    }

    // It's a calibration
    const calibrationState = assessment as CalibrationState;
    const result = completeCalibration(calibrationState, this.state.genome || undefined);
    if (!result) return null;

    // Update genome with calibration signals
    if (this.state.genome) {
      const updatedGenome = updateGenomeWithSignals(this.state.genome, result.signals);
      this.state.genome = updatedGenome;

      this.state.profiling = completeStage(this.state.profiling, result.type);
      this.state.activeAssessment = null;

      this.emit({ type: 'PROFILE_UPDATED', genome: updatedGenome });
      this.emit({ type: 'STAGE_COMPLETED', stageId: result.type });
      this.emit({ type: 'CONFIDENCE_INCREASED', newConfidence: updatedGenome.behaviour.confidence });

      return updatedGenome;
    }

    return null;
  }

  /**
   * Record a behavioural interaction
   */
  recordBehaviour(events: BehaviouralEvent[]): void {
    const signals = behaviourBatchToSignals(events);
    this.state.pendingSignals.push(...signals);

    // Update interaction count
    this.state.profiling = recordInteraction(this.state.profiling);

    // Check if we should prompt for calibration
    if (shouldPromptCalibration(this.state.profiling)) {
      const nextStage = getNextAvailableStage(this.state.profiling);
      if (nextStage) {
        this.emit({ type: 'CALIBRATION_AVAILABLE', stageId: nextStage.id });
      }
    }
  }

  /**
   * Process pending signals and update genome
   */
  processPendingSignals(): TasteGenome | null {
    if (this.state.pendingSignals.length === 0 || !this.state.genome) {
      return null;
    }

    const updatedGenome = updateGenomeWithSignals(
      this.state.genome,
      this.state.pendingSignals
    );

    this.state.genome = updatedGenome;
    this.state.pendingSignals = [];

    this.emit({ type: 'PROFILE_UPDATED', genome: updatedGenome });

    return updatedGenome;
  }

  /**
   * Infer profiling state from existing genome
   */
  private inferProfilingState(genome: TasteGenome): void {
    // If genome exists with reasonable confidence, assume initial is done
    if (genome.behaviour.confidence >= 0.3) {
      this.state.profiling.completedStages.push('initial');
    }

    // Check for calibration indicators
    if (genome.behaviour.confidence >= 0.5 && genome.behaviour.signalHistory.length > 10) {
      this.state.profiling.completedStages.push('music');
    }

    if (genome.behaviour.confidence >= 0.7) {
      this.state.profiling.completedStages.push('deep');
    }

    this.state.profiling.interactionCount = genome.behaviour.signalHistory.length;
    this.state.profiling.totalConfidence = genome.behaviour.confidence;
  }
}

/**
 * Create a new orchestrator
 */
export function createOrchestrator(
  userId: string,
  existingGenome?: TasteGenome
): ProfilingOrchestrator {
  return new ProfilingOrchestrator(userId, existingGenome);
}
