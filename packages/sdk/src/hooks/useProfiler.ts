/**
 * @subtaste/sdk - React Hook: useProfiler
 *
 * Hook for managing the profiling flow in React applications.
 */

import { useState, useCallback, useMemo } from 'react';
import type { Glyph } from '@subtaste/core';
import type { SubtasteClient, QuizResult } from '../client';

/**
 * Question for display
 */
export interface DisplayQuestion {
  id: string;
  prompt: string;
  options: [string, string];
  type: 'binary';
}

/**
 * Profiler hook state
 */
export interface UseProfilerState {
  isActive: boolean;
  currentQuestion: DisplayQuestion | null;
  questionIndex: number;
  totalQuestions: number;
  progress: number;
  isComplete: boolean;
  result: QuizResult | null;
  error: Error | null;
  submitting: boolean;
}

/**
 * Profiler hook actions
 */
export interface UseProfilerActions {
  start: () => void;
  answer: (response: 0 | 1) => void;
  reset: () => void;
}

/**
 * Profiler hook return type
 */
export type UseProfilerReturn = UseProfilerState & UseProfilerActions;

/**
 * Initial questions for onboarding
 * These match the INITIAL_QUESTIONS from @subtaste/profiler
 */
const INITIAL_QUESTIONS: DisplayQuestion[] = [
  {
    id: 'init-1-approach',
    prompt: 'When you find something good, you...',
    options: ['Keep it close', 'Spread the word'],
    type: 'binary'
  },
  {
    id: 'init-2-timing',
    prompt: 'Your taste tends to be...',
    options: ['Ahead of its time', 'Refined within tradition'],
    type: 'binary'
  },
  {
    id: 'init-3-creation',
    prompt: 'When creating, you prefer to...',
    options: ['Build the structure first', 'Discover through doing'],
    type: 'binary'
  }
];

/**
 * Hook for managing the profiling assessment flow
 *
 * @param client - Subtaste API client
 * @param userId - User ID (optional for anonymous profiling)
 * @param onComplete - Callback when profiling completes
 */
export function useProfiler(
  client: SubtasteClient,
  userId?: string,
  onComplete?: (result: QuizResult) => void
): UseProfilerReturn {
  const [isActive, setIsActive] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Array<{ questionId: string; response: number }>>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const questions = INITIAL_QUESTIONS;
  const totalQuestions = questions.length;
  const isComplete = questionIndex >= totalQuestions;

  const currentQuestion = useMemo(() => {
    if (!isActive || isComplete) return null;
    return questions[questionIndex];
  }, [isActive, isComplete, questionIndex, questions]);

  const progress = useMemo(() => {
    return questionIndex / totalQuestions;
  }, [questionIndex, totalQuestions]);

  const start = useCallback(() => {
    setIsActive(true);
    setQuestionIndex(0);
    setResponses([]);
    setResult(null);
    setError(null);
  }, []);

  const answer = useCallback(async (response: 0 | 1) => {
    if (!isActive || !currentQuestion) return;

    const newResponses = [
      ...responses,
      { questionId: currentQuestion.id, response }
    ];
    setResponses(newResponses);

    const nextIndex = questionIndex + 1;
    setQuestionIndex(nextIndex);

    // If complete, submit to API
    if (nextIndex >= totalQuestions) {
      setSubmitting(true);

      try {
        const quizResult = await client.submitQuiz({
          userId,
          responses: newResponses
        });

        setResult(quizResult);
        onComplete?.(quizResult);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to submit quiz'));
      } finally {
        setSubmitting(false);
      }
    }
  }, [isActive, currentQuestion, responses, questionIndex, totalQuestions, client, userId, onComplete]);

  const reset = useCallback(() => {
    setIsActive(false);
    setQuestionIndex(0);
    setResponses([]);
    setResult(null);
    setError(null);
    setSubmitting(false);
  }, []);

  return {
    isActive,
    currentQuestion,
    questionIndex,
    totalQuestions,
    progress,
    isComplete,
    result,
    error,
    submitting,
    start,
    answer,
    reset
  };
}
