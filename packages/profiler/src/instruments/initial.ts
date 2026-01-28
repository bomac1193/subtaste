/**
 * @subtaste/profiler - Initial Spark Instrument
 *
 * 3-question onboarding assessment.
 * ~30 seconds, sufficient for primary Glyph assignment.
 */

import type { Signal, ArchetypeClassification } from '@subtaste/core';
import { classifySignals } from '@subtaste/core';
import {
  INITIAL_QUESTIONS,
  type BinaryQuestion,
  type QuestionResponse,
  responsesToSignals
} from '../questions';

/**
 * Initial assessment state
 */
export interface InitialAssessmentState {
  questions: BinaryQuestion[];
  currentIndex: number;
  responses: QuestionResponse[];
  startedAt: Date;
  completedAt: Date | null;
}

/**
 * Initial assessment result
 */
export interface InitialAssessmentResult {
  classification: ArchetypeClassification;
  signals: Signal[];
  duration: number;
  confidence: number;
}

/**
 * Create a new initial assessment
 */
export function createInitialAssessment(): InitialAssessmentState {
  return {
    questions: INITIAL_QUESTIONS,
    currentIndex: 0,
    responses: [],
    startedAt: new Date(),
    completedAt: null
  };
}

/**
 * Get the current question
 */
export function getCurrentQuestion(state: InitialAssessmentState): BinaryQuestion | null {
  if (state.currentIndex >= state.questions.length) {
    return null;
  }
  return state.questions[state.currentIndex];
}

/**
 * Submit a response and advance
 */
export function submitResponse(
  state: InitialAssessmentState,
  response: 0 | 1
): InitialAssessmentState {
  const question = getCurrentQuestion(state);

  if (!question) {
    return state;
  }

  const questionResponse: QuestionResponse = {
    questionId: question.id,
    response,
    timestamp: new Date()
  };

  const newState: InitialAssessmentState = {
    ...state,
    responses: [...state.responses, questionResponse],
    currentIndex: state.currentIndex + 1
  };

  // Check if complete
  if (newState.currentIndex >= newState.questions.length) {
    newState.completedAt = new Date();
  }

  return newState;
}

/**
 * Check if assessment is complete
 */
export function isComplete(state: InitialAssessmentState): boolean {
  return state.completedAt !== null;
}

/**
 * Get progress (0-1)
 */
export function getProgress(state: InitialAssessmentState): number {
  return state.currentIndex / state.questions.length;
}

/**
 * Complete the assessment and get results
 */
export function completeAssessment(
  state: InitialAssessmentState
): InitialAssessmentResult | null {
  if (!isComplete(state)) {
    return null;
  }

  const signals = responsesToSignals(state.responses, 'quiz');
  const classification = classifySignals(signals);

  const duration = state.completedAt!.getTime() - state.startedAt.getTime();

  return {
    classification,
    signals,
    duration,
    confidence: classification.primary.confidence
  };
}

/**
 * Estimate time remaining in seconds
 */
export function estimateTimeRemaining(state: InitialAssessmentState): number {
  const questionsRemaining = state.questions.length - state.currentIndex;
  const secondsPerQuestion = 10; // Average
  return questionsRemaining * secondsPerQuestion;
}
