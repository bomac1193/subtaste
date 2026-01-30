/**
 * @subtaste/profiler - Question Sampling
 *
 * Provides simple random sampling of questions per stage.
 */

import { getQuestionsForStage, type Question } from './bank';

export type StageId = 'initial' | 'music' | 'deep';

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function sampleQuestions(stage: StageId, count: number): Question[] {
  const questions = getQuestionsForStage(stage);
  if (!questions.length) return [];
  const safeCount = Math.max(1, Math.min(count, questions.length));
  return shuffle(questions).slice(0, safeCount);
}
