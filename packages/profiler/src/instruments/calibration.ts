/**
 * @subtaste/profiler - Calibration Instruments
 *
 * Follow-up assessments for deeper profiling.
 * Music calibration (~45s) and deep calibration (~2min).
 */

import type { Signal, ArchetypeClassification, TasteGenome } from '@subtaste/core';
import { classify } from '@subtaste/core';
import {
  MUSIC_CALIBRATION_QUESTIONS,
  DEEP_CALIBRATION_QUESTIONS,
  type Question,
  type LikertQuestion,
  type QuestionResponse,
  responsesToSignals
} from '../questions';

/**
 * Calibration type
 */
export type CalibrationType = 'music' | 'deep';

/**
 * Calibration state
 */
export interface CalibrationState {
  type: CalibrationType;
  questions: Question[];
  currentIndex: number;
  responses: QuestionResponse[];
  startedAt: Date;
  completedAt: Date | null;
}

/**
 * Calibration result
 */
export interface CalibrationResult {
  type: CalibrationType;
  classification: ArchetypeClassification;
  signals: Signal[];
  duration: number;
  confidenceGain: number;
}

/**
 * Create a music calibration session
 */
export function createMusicCalibration(): CalibrationState {
  return {
    type: 'music',
    questions: MUSIC_CALIBRATION_QUESTIONS,
    currentIndex: 0,
    responses: [],
    startedAt: new Date(),
    completedAt: null
  };
}

/**
 * Create a deep calibration session
 */
export function createDeepCalibration(): CalibrationState {
  return {
    type: 'deep',
    questions: DEEP_CALIBRATION_QUESTIONS,
    currentIndex: 0,
    responses: [],
    startedAt: new Date(),
    completedAt: null
  };
}

/**
 * Get the current question
 */
export function getCurrentCalibrationQuestion(state: CalibrationState): Question | null {
  if (state.currentIndex >= state.questions.length) {
    return null;
  }
  return state.questions[state.currentIndex];
}

/**
 * Submit a calibration response
 */
export function submitCalibrationResponse(
  state: CalibrationState,
  response: number | number[]
): CalibrationState {
  const question = getCurrentCalibrationQuestion(state);

  if (!question) {
    return state;
  }

  const questionResponse: QuestionResponse = {
    questionId: question.id,
    response: response as any,
    timestamp: new Date()
  };

  const newState: CalibrationState = {
    ...state,
    responses: [...state.responses, questionResponse],
    currentIndex: state.currentIndex + 1
  };

  if (newState.currentIndex >= newState.questions.length) {
    newState.completedAt = new Date();
  }

  return newState;
}

/**
 * Check if calibration is complete
 */
export function isCalibrationComplete(state: CalibrationState): boolean {
  return state.completedAt !== null;
}

/**
 * Get calibration progress
 */
export function getCalibrationProgress(state: CalibrationState): number {
  return state.currentIndex / state.questions.length;
}

/**
 * Complete calibration and get results
 */
export function completeCalibration(
  state: CalibrationState,
  existingGenome?: TasteGenome
): CalibrationResult | null {
  if (!isCalibrationComplete(state)) {
    return null;
  }

  const signals = responsesToSignals(state.responses, 'calibration');

  const result = classify({
    signals,
    existingPsychometrics: existingGenome?._engine.psychometrics
  });

  const duration = state.completedAt!.getTime() - state.startedAt.getTime();

  // Calculate confidence gain
  const baseConfidence = existingGenome?.behaviour.confidence || 0.3;
  const confidenceGain = state.type === 'music' ? 0.15 : 0.2;
  const effectiveGain = confidenceGain * (1 - baseConfidence / 0.95);

  return {
    type: state.type,
    classification: result.classification,
    signals,
    duration,
    confidenceGain: effectiveGain
  };
}

/**
 * Check if user qualifies for music calibration
 */
export function qualifiesForMusicCalibration(
  interactionCount: number,
  hasCompletedMusic: boolean
): boolean {
  return interactionCount >= 5 && !hasCompletedMusic;
}

/**
 * Check if user qualifies for deep calibration
 */
export function qualifiesForDeepCalibration(
  hasCompletedInitial: boolean,
  hasCompletedMusic: boolean,
  hasCompletedDeep: boolean
): boolean {
  return hasCompletedInitial && hasCompletedMusic && !hasCompletedDeep;
}

/**
 * Get estimated time for calibration type
 */
export function getEstimatedTime(type: CalibrationType): number {
  return type === 'music' ? 45 : 120; // seconds
}
