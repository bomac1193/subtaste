/**
 * @subtaste/profiler/questions - Question Bank Exports
 */

export {
  INITIAL_QUESTIONS,
  MUSIC_CALIBRATION_QUESTIONS,
  DEEP_CALIBRATION_QUESTIONS,
  getQuestionsForStage,
  getQuestionById
} from './bank';

export type {
  QuestionType,
  Question,
  BinaryQuestion,
  LikertQuestion,
  RankingQuestion
} from './bank';

export {
  mapBinaryResponse,
  mapLikertResponse,
  mapRankingResponse,
  responseToSignal,
  responsesToSignals,
  calculateConfidenceGain
} from './mapping';

export type {
  BinaryResponse,
  LikertResponse,
  RankingResponse,
  QuestionResponse
} from './mapping';
