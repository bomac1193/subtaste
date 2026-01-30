/**
 * Validation Harness for THE TWELVE profiling system
 * Run with: npx tsx scripts/validation-harness.ts
 */

import {
  ALL_DESIGNATIONS,
  DEFAULT_SCORING_CONFIG,
  classify,
  type Designation,
  type Signal
} from '@subtaste/core';
import {
  getQuestionsForStage,
  responsesToSignals,
  type Question,
  type BinaryQuestion,
  type LikertQuestion,
  type RankingQuestion
} from '@subtaste/profiler';

type StageId = 'initial' | 'music' | 'deep';

type QuestionResponse = {
  questionId: string;
  response: number | number[];
  timestamp: Date;
};

const STAGES: StageId[] = ['initial', 'music', 'deep'];
const SAMPLE_PER_STAGE: Record<StageId, number> = {
  initial: 4,
  music: 4,
  deep: 4
};

const RETEST_RUNS = 20;
const SPLIT_HALF_RUNS = 20;
const RANDOM_RUNS = 80;
const RESPONSE_NOISE = 0.12;
const ENTROPY_GATE = 0.35;

function createRng(seed: number) {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function sampleStageQuestions(stage: StageId, count: number, rng: () => number): Question[] {
  const questions = getQuestionsForStage(stage);
  if (!questions.length) return [];
  const safeCount = Math.max(1, Math.min(count, questions.length));
  return shuffle(questions, rng).slice(0, safeCount);
}

function bestResponse(question: Question, designation: Designation): number | number[] {
  if (question.type === 'binary') {
    const binary = question as BinaryQuestion;
    const weights = binary.optionWeights.map((entry) => entry[designation] ?? 0);
    return weights[1] > weights[0] ? 1 : 0;
  }

  if (question.type === 'likert') {
    const likert = question as LikertQuestion;
    const weight = likert.archetypeWeights[designation] ?? 0;
    if (weight > 0) return likert.scale;
    if (weight < 0) return 1;
    return Math.round((likert.scale + 1) / 2);
  }

  const ranking = question as RankingQuestion;
  const weighted = ranking.itemWeights.map((entry, index) => ({
    index,
    weight: entry[designation] ?? 0
  }));
  weighted.sort((a, b) => b.weight - a.weight || a.index - b.index);
  return weighted.map((entry) => entry.index);
}

function randomResponse(question: Question, rng: () => number): number | number[] {
  if (question.type === 'binary') {
    return rng() < 0.5 ? 0 : 1;
  }

  if (question.type === 'likert') {
    const likert = question as LikertQuestion;
    return 1 + Math.floor(rng() * likert.scale);
  }

  const ranking = question as RankingQuestion;
  const indices = ranking.items.map((_, index) => index);
  return shuffle(indices, rng);
}

function applyNoise(
  question: Question,
  response: number | number[],
  rng: () => number,
  noiseRate: number
): number | number[] {
  if (rng() >= noiseRate) return response;
  if (question.type === 'binary') {
    return response === 0 ? 1 : 0;
  }
  return randomResponse(question, rng);
}

function buildResponses(
  designation: Designation,
  rng: () => number,
  noiseRate: number
): QuestionResponse[] {
  const responses: QuestionResponse[] = [];
  for (const stage of STAGES) {
    const questions = sampleStageQuestions(stage, SAMPLE_PER_STAGE[stage], rng);
    for (const question of questions) {
      const ideal = bestResponse(question, designation);
      const response = applyNoise(question, ideal, rng, noiseRate);
      responses.push({
        questionId: question.id,
        response,
        timestamp: new Date()
      });
    }
  }
  return responses;
}

function classifyResponses(responses: QuestionResponse[]) {
  const signals: Signal[] = responsesToSignals(responses, 'quiz');
  return classify({ signals });
}

function buildDistribution(rawScores: Record<Designation, number>, temperature: number) {
  const expScores = ALL_DESIGNATIONS.map((d) => Math.exp(rawScores[d] * temperature));
  const sumExp = expScores.reduce((acc, value) => acc + value, 0) || 1;
  const distribution: Record<Designation, number> = {} as Record<Designation, number>;
  ALL_DESIGNATIONS.forEach((d, index) => {
    distribution[d] = expScores[index] / sumExp;
  });
  return distribution;
}

function entropy(distribution: Record<Designation, number>): number {
  let total = 0;
  for (const value of Object.values(distribution)) {
    if (value > 0) {
      total -= value * Math.log(value);
    }
  }
  return total;
}

function confidenceFromDistribution(distribution: Record<Designation, number>): number {
  const maxEntropy = Math.log(ALL_DESIGNATIONS.length);
  return 1 - (entropy(distribution) / maxEntropy);
}

function vectorFromDistribution(distribution: Record<Designation, number>): number[] {
  return ALL_DESIGNATIONS.map((d) => distribution[d] ?? 0);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function logResult(name: string, condition: boolean, details: string) {
  const label = condition ? 'PASS' : 'FAIL';
  console.log(`${label} ${name} - ${details}`);
}

function runRetestStability() {
  let matches = 0;
  let total = 0;
  let similaritySum = 0;

  ALL_DESIGNATIONS.forEach((designation, index) => {
    for (let run = 0; run < RETEST_RUNS; run += 1) {
      const seedBase = 1000 + index * 100 + run * 11;
      const rngA = createRng(seedBase);
      const rngB = createRng(seedBase + 999);

      const responsesA = buildResponses(designation, rngA, RESPONSE_NOISE);
      const responsesB = buildResponses(designation, rngB, RESPONSE_NOISE);

      const resultA = classifyResponses(responsesA);
      const resultB = classifyResponses(responsesB);

      const primaryA = resultA.classification.primary.designation;
      const primaryB = resultB.classification.primary.designation;
      if (primaryA === primaryB) matches += 1;
      total += 1;

      const distA = buildDistribution(resultA.rawScores, DEFAULT_SCORING_CONFIG.temperature);
      const distB = buildDistribution(resultB.rawScores, DEFAULT_SCORING_CONFIG.temperature);
      similaritySum += cosineSimilarity(vectorFromDistribution(distA), vectorFromDistribution(distB));
    }
  });

  const matchRate = matches / total;
  const avgSimilarity = similaritySum / total;

  logResult(
    'Test-retest primary match rate',
    matchRate >= 0.6,
    `rate=${matchRate.toFixed(2)} threshold=0.60`
  );
  logResult(
    'Test-retest distribution similarity',
    avgSimilarity >= 0.55,
    `cosine=${avgSimilarity.toFixed(2)} threshold=0.55`
  );
}

function runSplitHalfReliability() {
  let similaritySum = 0;
  let total = 0;

  ALL_DESIGNATIONS.forEach((designation, index) => {
    for (let run = 0; run < SPLIT_HALF_RUNS; run += 1) {
      const seedBase = 5000 + index * 77 + run * 19;
      const rng = createRng(seedBase);
      const responses = buildResponses(designation, rng, RESPONSE_NOISE);

      const halfA = responses.filter((_, idx) => idx % 2 === 0);
      const halfB = responses.filter((_, idx) => idx % 2 === 1);

      const resultA = classifyResponses(halfA);
      const resultB = classifyResponses(halfB);

      const distA = buildDistribution(resultA.rawScores, DEFAULT_SCORING_CONFIG.temperature);
      const distB = buildDistribution(resultB.rawScores, DEFAULT_SCORING_CONFIG.temperature);
      similaritySum += cosineSimilarity(vectorFromDistribution(distA), vectorFromDistribution(distB));
      total += 1;
    }
  });

  const avgSimilarity = similaritySum / total;
  logResult(
    'Split-half distribution similarity',
    avgSimilarity >= 0.5,
    `cosine=${avgSimilarity.toFixed(2)} threshold=0.50`
  );
}

function runEntropyGating() {
  let belowThreshold = 0;

  for (let run = 0; run < RANDOM_RUNS; run += 1) {
    const rng = createRng(9000 + run * 13);
    const responses: QuestionResponse[] = [];

    for (const stage of STAGES) {
      const questions = sampleStageQuestions(stage, SAMPLE_PER_STAGE[stage], rng);
      for (const question of questions) {
        const response = randomResponse(question, rng);
        responses.push({
          questionId: question.id,
          response,
          timestamp: new Date()
        });
      }
    }

    const result = classifyResponses(responses);
    const dist = buildDistribution(result.rawScores, DEFAULT_SCORING_CONFIG.temperature);
    const confidence = confidenceFromDistribution(dist);
    if (confidence < ENTROPY_GATE) {
      belowThreshold += 1;
    }
  }

  const rate = belowThreshold / RANDOM_RUNS;
  logResult(
    'Entropy gating (random sessions)',
    rate >= 0.7,
    `rate=${rate.toFixed(2)} threshold=0.70 gate=${ENTROPY_GATE.toFixed(2)}`
  );
}

function runHarness() {
  console.log('Running validation harness');
  console.log(`Questions per session: initial=${SAMPLE_PER_STAGE.initial}, music=${SAMPLE_PER_STAGE.music}, deep=${SAMPLE_PER_STAGE.deep}`);
  console.log('');

  runRetestStability();
  runSplitHalfReliability();
  runEntropyGating();
}

runHarness();
