/**
 * @subtaste/profiler - Question to Archetype Mapping
 *
 * Converts question responses to archetype weight signals.
 */

import type { Designation, Signal, ExplicitSignal } from '@subtaste/core';
import type { Question, BinaryQuestion, LikertQuestion, RankingQuestion } from './bank';
import { getQuestionById, INITIAL_QUESTIONS, MUSIC_CALIBRATION_QUESTIONS, DEEP_CALIBRATION_QUESTIONS } from './bank';

/**
 * Response types
 */
export type BinaryResponse = 0 | 1;
export type LikertResponse = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type RankingResponse = number[]; // Indices in order of preference

/**
 * Generic question response
 */
export interface QuestionResponse {
  questionId: string;
  response: BinaryResponse | LikertResponse | RankingResponse;
  timestamp: Date;
}

/**
 * Convert a binary response to archetype weights
 */
export function mapBinaryResponse(
  question: BinaryQuestion,
  response: BinaryResponse
): Partial<Record<Designation, number>> {
  return question.optionWeights[response];
}

/**
 * Convert a Likert response to archetype weights
 * Normalises to -1 to +1 range, then applies question weights
 */
export function mapLikertResponse(
  question: LikertQuestion,
  response: LikertResponse
): Partial<Record<Designation, number>> {
  // Normalise response to -1 to +1
  const midpoint = (question.scale + 1) / 2;
  const normalised = (response - midpoint) / (midpoint - 1);

  const result: Partial<Record<Designation, number>> = {};

  for (const [designation, weight] of Object.entries(question.archetypeWeights)) {
    const d = designation as Designation;
    // Positive weights become stronger with high agreement
    // Negative weights become stronger with low agreement
    result[d] = weight * normalised;
  }

  return result;
}

/**
 * Convert a ranking response to archetype weights
 * Higher rank = higher weight
 */
export function mapRankingResponse(
  question: RankingQuestion,
  response: RankingResponse
): Partial<Record<Designation, number>> {
  const result: Partial<Record<Designation, number>> = {};
  const numItems = question.items.length;

  // response is indices in order of preference (first = highest)
  for (let rank = 0; rank < response.length; rank++) {
    const itemIndex = response[rank];
    const weights = question.itemWeights[itemIndex];

    // Scale by rank (first = 1.0, last = 0.2)
    const rankScale = 1 - (rank * 0.8 / (numItems - 1));

    for (const [designation, weight] of Object.entries(weights)) {
      const d = designation as Designation;
      result[d] = (result[d] || 0) + weight * rankScale;
    }
  }

  return result;
}

/**
 * Convert a question response to a Signal
 */
export function responseToSignal(
  response: QuestionResponse,
  source: 'quiz' | 'calibration' = 'quiz'
): Signal | null {
  const question = getQuestionById(response.questionId);

  if (!question) {
    return null;
  }

  let archetypeWeights: Partial<Record<Designation, number>>;

  switch (question.type) {
    case 'binary':
      archetypeWeights = mapBinaryResponse(
        question as BinaryQuestion,
        response.response as BinaryResponse
      );
      break;

    case 'likert':
      archetypeWeights = mapLikertResponse(
        question as LikertQuestion,
        response.response as LikertResponse
      );
      break;

    case 'ranking':
      archetypeWeights = mapRankingResponse(
        question as RankingQuestion,
        response.response as RankingResponse
      );
      break;

    default:
      return null;
  }

  const explicitSignal: ExplicitSignal = {
    kind: question.type === 'binary' ? 'choice' :
          question.type === 'likert' ? 'likert' : 'ranking',
    questionId: response.questionId,
    value: response.response,
    archetypeWeights
  };

  return {
    type: 'explicit',
    source,
    timestamp: response.timestamp,
    data: explicitSignal
  };
}

/**
 * Convert multiple responses to signals
 */
export function responsesToSignals(
  responses: QuestionResponse[],
  source: 'quiz' | 'calibration' = 'quiz'
): Signal[] {
  return responses
    .map(r => responseToSignal(r, source))
    .filter((s): s is Signal => s !== null);
}

/**
 * Calculate expected confidence gain from a stage
 */
export function calculateConfidenceGain(
  stage: 'initial' | 'music' | 'deep',
  currentConfidence: number
): number {
  const gains: Record<string, number> = {
    initial: 0.3,  // Base confidence from 3 questions
    music: 0.15,   // Moderate boost from calibration
    deep: 0.2      // Significant boost from deep assessment
  };

  const maxConfidence = 0.95;
  const gain = gains[stage] || 0;

  // Diminishing returns as confidence increases
  const effectiveGain = gain * (1 - currentConfidence / maxConfidence);

  return Math.min(maxConfidence - currentConfidence, effectiveGain);
}
