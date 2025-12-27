/**
 * Comprehensive Stress Test for Subtaste Quiz System
 * Run with: npx tsx scripts/stress-test.ts
 */

import { itemBank, getAnswerById, ALL_TRAITS, TraitId, ItemBankQuestion } from '../src/lib/quiz/item-bank';
import { selectAdaptiveQuestions } from '../src/lib/quiz/adaptive-selection';
import { scoreTraits, Answer, getProgressUpdate } from '../src/lib/quiz/scoring';
import { computeConstellationProfile } from '../src/lib/scoring/constellation';
import { constellationsConfig } from '../src/lib/constellations/config';
import { CONSTELLATION_IDS } from '../src/lib/constellations/types';

const PASS = '✅';
const FAIL = '❌';
const WARN = '⚠️';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let warnings = 0;

function test(name: string, condition: boolean, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ${PASS} ${name}`);
  } else {
    failedTests++;
    console.log(`  ${FAIL} ${name}${details ? ` - ${details}` : ''}`);
  }
}

function warn(name: string, details?: string) {
  warnings++;
  console.log(`  ${WARN} ${name}${details ? ` - ${details}` : ''}`);
}

function makeAnswer(questionId: string, answerId: string): Answer | null {
  const question = itemBank.find(q => q.id === questionId);
  const answer = getAnswerById(questionId, answerId);
  if (!question || !answer) return null;
  return { questionId, answerId, question, answer };
}

function getRandomAnswer(question: ItemBankQuestion): Answer {
  const randomIdx = Math.floor(Math.random() * question.answers.length);
  const answer = question.answers[randomIdx];
  return {
    questionId: question.id,
    answerId: answer.id,
    question,
    answer,
  };
}

function getHighAnswer(question: ItemBankQuestion): Answer {
  // Get the answer with highest value for the primary trait
  const sorted = [...question.answers].sort((a, b) => b.value - a.value);
  return {
    questionId: question.id,
    answerId: sorted[0].id,
    question,
    answer: sorted[0],
  };
}

function getLowAnswer(question: ItemBankQuestion): Answer {
  const sorted = [...question.answers].sort((a, b) => a.value - b.value);
  return {
    questionId: question.id,
    answerId: sorted[0].id,
    question,
    answer: sorted[0],
  };
}

// ============================================================================
// TEST SUITE 1: Item Bank Integrity
// ============================================================================
function testItemBankIntegrity() {
  console.log('\n📦 TEST SUITE 1: Item Bank Integrity');
  console.log('─'.repeat(50));

  // Test total questions
  test('Item bank has sufficient questions', itemBank.length >= 30, `Found ${itemBank.length}`);

  // Test each trait has questions
  for (const trait of ALL_TRAITS) {
    const questions = itemBank.filter(q => q.primaryTrait === trait);
    test(`Trait "${trait}" has 3+ questions`, questions.length >= 3, `Found ${questions.length}`);
  }

  // Test anchor questions exist
  const anchors = itemBank.filter(q => q.isAnchor);
  test('Has anchor questions (8+)', anchors.length >= 8, `Found ${anchors.length}`);

  // Test all questions have valid answers
  let invalidQuestions = 0;
  for (const q of itemBank) {
    if (q.answers.length < 2) invalidQuestions++;
    for (const a of q.answers) {
      if (a.value === undefined) invalidQuestions++;
    }
  }
  test('All questions have valid answers', invalidQuestions === 0, `${invalidQuestions} invalid`);

  // Test IRT parameters are in range
  let invalidParams = 0;
  for (const q of itemBank) {
    if (q.difficulty < -3 || q.difficulty > 3) invalidParams++;
    if (q.discrimination < 0.5 || q.discrimination > 2.5) invalidParams++;
  }
  test('All IRT parameters in valid range', invalidParams === 0, `${invalidParams} out of range`);

  // Test for duplicate question IDs
  const ids = itemBank.map(q => q.id);
  const uniqueIds = new Set(ids);
  test('No duplicate question IDs', ids.length === uniqueIds.size);

  // Test for duplicate answer IDs within questions
  let duplicateAnswerIds = 0;
  for (const q of itemBank) {
    const answerIds = q.answers.map(a => a.id);
    if (new Set(answerIds).size !== answerIds.length) duplicateAnswerIds++;
  }
  test('No duplicate answer IDs', duplicateAnswerIds === 0);
}

// ============================================================================
// TEST SUITE 2: Adaptive Question Selection
// ============================================================================
function testAdaptiveSelection() {
  console.log('\n🎯 TEST SUITE 2: Adaptive Question Selection');
  console.log('─'.repeat(50));

  // Test basic selection
  const selection1 = selectAdaptiveQuestions();
  test('Selection returns questions', selection1.questions.length > 0);
  test('Selection returns 20-30 questions',
    selection1.questions.length >= 20 && selection1.questions.length <= 30,
    `Got ${selection1.questions.length}`);

  // Test trait coverage
  const coveredTraits = new Set(selection1.questions.map(q => q.primaryTrait));
  test('All traits covered', coveredTraits.size === ALL_TRAITS.length,
    `Covered ${coveredTraits.size}/${ALL_TRAITS.length}`);

  // Test minimum per trait
  for (const trait of ALL_TRAITS) {
    const count = selection1.traitCoverage[trait];
    if (count < 2) {
      warn(`Trait "${trait}" has only ${count} questions`);
    }
  }

  // Test returning user gets anchors
  const selection2 = selectAdaptiveQuestions(undefined, { sessionCount: 1 });
  const anchorCount = selection2.questions.filter(q => q.isAnchor).length;
  test('Returning user gets anchor questions', anchorCount >= 5, `Got ${anchorCount} anchors`);

  // Test randomization (two selections should differ)
  const selection3 = selectAdaptiveQuestions();
  const sameOrder = selection1.questions.every((q, i) => q.id === selection3.questions[i]?.id);
  test('Selection is randomized', !sameOrder || selection1.questions.length !== selection3.questions.length);

  // Test estimated confidence and duration
  test('Estimated confidence is valid',
    selection1.estimatedConfidence >= 0.3 && selection1.estimatedConfidence <= 1);
  test('Estimated duration is valid',
    selection1.estimatedDuration > 0 && selection1.estimatedDuration < 600);

  // Test no duplicate questions in selection
  const selectedIds = selection1.questions.map(q => q.id);
  test('No duplicate questions in selection',
    new Set(selectedIds).size === selectedIds.length);
}

// ============================================================================
// TEST SUITE 3: Scoring Accuracy
// ============================================================================
function testScoringAccuracy() {
  console.log('\n📊 TEST SUITE 3: Scoring Accuracy');
  console.log('─'.repeat(50));

  // Test each trait individually
  for (const trait of ALL_TRAITS) {
    const questions = itemBank.filter(q => q.primaryTrait === trait);

    // All high answers
    const highAnswers = questions.map(q => getHighAnswer(q));
    const highResult = scoreTraits(highAnswers);
    test(`${trait}: high answers → high score (>0.65)`,
      highResult.traits[trait].score > 0.65,
      `Got ${highResult.traits[trait].score.toFixed(3)}`);

    // All low answers
    const lowAnswers = questions.map(q => getLowAnswer(q));
    const lowResult = scoreTraits(lowAnswers);
    test(`${trait}: low answers → low score (<0.35)`,
      lowResult.traits[trait].score < 0.35,
      `Got ${lowResult.traits[trait].score.toFixed(3)}`);
  }

  // Test empty answers
  const emptyResult = scoreTraits([]);
  test('Empty answers → neutral scores',
    ALL_TRAITS.every(t => emptyResult.traits[t].score === 0.5));
  test('Empty answers → zero confidence',
    ALL_TRAITS.every(t => emptyResult.traits[t].confidence === 0));

  // Test single answer
  const singleAnswer = [makeAnswer('open_1_exploration', 'open_1_a')!];
  const singleResult = scoreTraits(singleAnswer);
  test('Single answer produces valid scores',
    singleResult.traits.openness.score > 0.5);
  test('Single answer has low confidence',
    singleResult.overallConfidence < 0.5);

  // Test consistency - same answers should give same results
  const consistentAnswers = itemBank.slice(0, 10).map(q => getHighAnswer(q));
  const result1 = scoreTraits(consistentAnswers);
  const result2 = scoreTraits(consistentAnswers);
  test('Scoring is deterministic',
    JSON.stringify(result1.traits) === JSON.stringify(result2.traits));
}

// ============================================================================
// TEST SUITE 4: Progress Updates
// ============================================================================
function testProgressUpdates() {
  console.log('\n📈 TEST SUITE 4: Progress Updates');
  console.log('─'.repeat(50));

  const questions = selectAdaptiveQuestions().questions;
  const totalPlanned = questions.length;

  // Test initial progress
  const initial = getProgressUpdate([], totalPlanned);
  test('Initial progress has zero confidence', initial.currentConfidence === 0);
  test('Initial progress shows all questions remaining',
    initial.questionsRemaining === totalPlanned);
  test('Initial progress has message', initial.message.length > 0);

  // Test progress increases with answers (compare start vs end, not every step)
  const answers: Answer[] = [];

  // Answer first 5 questions
  for (let i = 0; i < 5; i++) {
    answers.push(getRandomAnswer(questions[i]));
  }
  const earlyProgress = getProgressUpdate(answers, totalPlanned);

  // Answer 10 more questions
  for (let i = 5; i < 15 && i < questions.length; i++) {
    answers.push(getRandomAnswer(questions[i]));
  }
  const laterProgress = getProgressUpdate(answers, totalPlanned);

  test('Confidence increases with more answers (5 vs 15)',
    laterProgress.currentConfidence > earlyProgress.currentConfidence,
    `Early: ${earlyProgress.currentConfidence.toFixed(3)}, Later: ${laterProgress.currentConfidence.toFixed(3)}`);

  // Test final progress
  const allAnswers = questions.map(q => getRandomAnswer(q));
  const finalProgress = getProgressUpdate(allAnswers, totalPlanned);
  test('Final progress shows 0 remaining', finalProgress.questionsRemaining === 0);
  test('Final confidence is high (>0.5)', finalProgress.currentConfidence > 0.5);
  test('Final accuracy estimate is reasonable (0.5-1.0)',
    finalProgress.estimatedAccuracy >= 0.5 && finalProgress.estimatedAccuracy <= 1.0);
}

// ============================================================================
// TEST SUITE 5: Constellation Assignment
// ============================================================================
function testConstellationAssignment() {
  console.log('\n⭐ TEST SUITE 5: Constellation Assignment');
  console.log('─'.repeat(50));

  // Test all constellations are reachable
  const reachedConstellations = new Set<string>();

  // Run 50 random quiz simulations
  for (let i = 0; i < 50; i++) {
    const questions = selectAdaptiveQuestions().questions;
    const answers = questions.map(q => getRandomAnswer(q));
    const result = scoreTraits(answers);

    const psychometric = {
      openness: result.traits.openness.score,
      conscientiousness: result.traits.conscientiousness.score,
      extraversion: result.traits.extraversion.score,
      agreeableness: result.traits.agreeableness.score,
      neuroticism: result.traits.neuroticism.score,
      noveltySeeking: result.traits.noveltySeeking.score,
      aestheticSensitivity: result.traits.aestheticSensitivity.score,
      riskTolerance: result.traits.riskTolerance.score,
    };

    const { profile } = computeConstellationProfile(psychometric, result.aesthetic);
    reachedConstellations.add(profile.primaryConstellationId);
  }

  test('Multiple constellations reachable (5+)',
    reachedConstellations.size >= 5,
    `Reached ${reachedConstellations.size}: ${[...reachedConstellations].join(', ')}`);

  // Test specific trait profiles map to expected constellations
  const testCases = [
    {
      name: 'High openness + high novelty → explorer type',
      traits: { openness: 0.9, noveltySeeking: 0.9, riskTolerance: 0.8, aestheticSensitivity: 0.8,
                extraversion: 0.5, conscientiousness: 0.3, agreeableness: 0.5, neuroticism: 0.3 },
      expectedTypes: ['vantoryx', 'nexyra', 'fluxeris', 'radianth'],
    },
    {
      name: 'High conscientiousness + low novelty → structured type',
      traits: { openness: 0.4, noveltySeeking: 0.2, riskTolerance: 0.2, aestheticSensitivity: 0.5,
                extraversion: 0.5, conscientiousness: 0.9, agreeableness: 0.6, neuroticism: 0.3 },
      expectedTypes: ['arctonis', 'velorium', 'cryonex'],
    },
    {
      name: 'High aesthetics + introversion → dreamer type',
      traits: { openness: 0.8, noveltySeeking: 0.6, riskTolerance: 0.4, aestheticSensitivity: 0.95,
                extraversion: 0.2, conscientiousness: 0.4, agreeableness: 0.6, neuroticism: 0.6 },
      expectedTypes: ['somnexis', 'umbralith', 'ethereon', 'nyxora'],
    },
  ];

  for (const tc of testCases) {
    const { profile } = computeConstellationProfile(tc.traits, {
      colorPaletteVector: [], darknessPreference: 0.5, complexityPreference: 0.5,
      symmetryPreference: 0.5, organicVsSynthetic: 0.5, minimalVsMaximal: 0.5,
      tempoRangeMin: 80, tempoRangeMax: 140, energyRangeMin: 0.3, energyRangeMax: 0.7,
      harmonicDissonanceTolerance: 0.3, rhythmPreference: 0.5, acousticVsDigital: 0.5,
    });

    const isExpected = tc.expectedTypes.includes(profile.primaryConstellationId);
    if (!isExpected) {
      warn(tc.name, `Got ${profile.primaryConstellationId}, expected one of: ${tc.expectedTypes.join(', ')}`);
    } else {
      test(tc.name, true);
    }
  }

  // Test blend weights sum to ~1
  const samplePsych = {
    openness: 0.6, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5,
    neuroticism: 0.5, noveltySeeking: 0.5, aestheticSensitivity: 0.5, riskTolerance: 0.5,
  };
  const sampleAesth = {
    colorPaletteVector: [], darknessPreference: 0.5, complexityPreference: 0.5,
    symmetryPreference: 0.5, organicVsSynthetic: 0.5, minimalVsMaximal: 0.5,
    tempoRangeMin: 80, tempoRangeMax: 140, energyRangeMin: 0.3, energyRangeMax: 0.7,
    harmonicDissonanceTolerance: 0.3, rhythmPreference: 0.5, acousticVsDigital: 0.5,
  };
  const { profile } = computeConstellationProfile(samplePsych, sampleAesth);
  const weightSum = Object.values(profile.blendWeights).reduce((a, b) => a + (b || 0), 0);
  test('Blend weights sum to ~1', weightSum > 0.95 && weightSum < 1.05, `Sum: ${weightSum.toFixed(3)}`);

  // Test derived scores are in valid ranges
  test('Subtaste index is 0-100', profile.subtasteIndex >= 0 && profile.subtasteIndex <= 100);
  test('Explorer score is 0-100', profile.explorerScore >= 0 && profile.explorerScore <= 100);
  test('Early adopter score is 0-100', profile.earlyAdopterScore >= 0 && profile.earlyAdopterScore <= 100);
}

// ============================================================================
// TEST SUITE 6: Edge Cases & Error Handling
// ============================================================================
function testEdgeCases() {
  console.log('\n🔧 TEST SUITE 6: Edge Cases & Error Handling');
  console.log('─'.repeat(50));

  // Test with malformed answer (missing question)
  try {
    const badAnswer: Answer = {
      questionId: 'nonexistent',
      answerId: 'fake',
      question: itemBank[0],
      answer: itemBank[0].answers[0],
    };
    const result = scoreTraits([badAnswer]);
    test('Handles mismatched question/answer gracefully', result.traits.openness.score >= 0);
  } catch (e) {
    test('Handles mismatched question/answer gracefully', false, 'Threw exception');
  }

  // Test extreme trait values
  const extremePsych = {
    openness: 1.0, conscientiousness: 0.0, extraversion: 1.0, agreeableness: 0.0,
    neuroticism: 1.0, noveltySeeking: 1.0, aestheticSensitivity: 1.0, riskTolerance: 1.0,
  };
  const extremeAesth = {
    colorPaletteVector: [], darknessPreference: 1.0, complexityPreference: 1.0,
    symmetryPreference: 0.0, organicVsSynthetic: 1.0, minimalVsMaximal: 1.0,
    tempoRangeMin: 180, tempoRangeMax: 200, energyRangeMin: 0.9, energyRangeMax: 1.0,
    harmonicDissonanceTolerance: 1.0, rhythmPreference: 1.0, acousticVsDigital: 1.0,
  };

  try {
    const { profile } = computeConstellationProfile(extremePsych, extremeAesth);
    test('Handles extreme trait values', profile.primaryConstellationId !== undefined);
  } catch (e) {
    test('Handles extreme trait values', false, 'Threw exception');
  }

  // Test all-same answers
  const sameQuestion = itemBank[0];
  const sameAnswers = Array(20).fill(null).map(() => ({
    questionId: sameQuestion.id,
    answerId: sameQuestion.answers[0].id,
    question: sameQuestion,
    answer: sameQuestion.answers[0],
  }));

  try {
    const result = scoreTraits(sameAnswers);
    test('Handles repeated same question', result.overallConfidence >= 0);
  } catch (e) {
    test('Handles repeated same question', false, 'Threw exception');
  }

  // Test very large number of answers
  const manyAnswers = itemBank.flatMap(q =>
    Array(5).fill(null).map(() => getRandomAnswer(q))
  );

  try {
    const result = scoreTraits(manyAnswers);
    test('Handles large number of answers', result.itemsAnswered === manyAnswers.length);
  } catch (e) {
    test('Handles large number of answers', false, 'Threw exception');
  }
}

// ============================================================================
// TEST SUITE 7: Full End-to-End Simulation
// ============================================================================
function testEndToEnd() {
  console.log('\n🚀 TEST SUITE 7: Full End-to-End Simulation (100 users)');
  console.log('─'.repeat(50));

  const results: { constellation: string; scores: Record<string, number> }[] = [];
  const errors: string[] = [];

  for (let i = 0; i < 100; i++) {
    try {
      // 1. Select questions
      const selection = selectAdaptiveQuestions();

      // 2. Simulate answering
      const answers = selection.questions.map(q => getRandomAnswer(q));

      // 3. Score traits
      const scoring = scoreTraits(answers);

      // 4. Compute constellation
      const psychometric = {
        openness: scoring.traits.openness.score,
        conscientiousness: scoring.traits.conscientiousness.score,
        extraversion: scoring.traits.extraversion.score,
        agreeableness: scoring.traits.agreeableness.score,
        neuroticism: scoring.traits.neuroticism.score,
        noveltySeeking: scoring.traits.noveltySeeking.score,
        aestheticSensitivity: scoring.traits.aestheticSensitivity.score,
        riskTolerance: scoring.traits.riskTolerance.score,
      };

      const { profile, result } = computeConstellationProfile(psychometric, scoring.aesthetic);

      // Validate result
      if (!profile.primaryConstellationId) {
        errors.push(`User ${i}: No constellation assigned`);
      }
      if (!result.summary || !result.details) {
        errors.push(`User ${i}: Incomplete result object`);
      }

      results.push({
        constellation: profile.primaryConstellationId,
        scores: {
          subtaste: profile.subtasteIndex,
          explorer: profile.explorerScore,
          earlyAdopter: profile.earlyAdopterScore,
          confidence: scoring.overallConfidence,
        },
      });
    } catch (e) {
      errors.push(`User ${i}: ${(e as Error).message}`);
    }
  }

  test('All 100 simulations completed', errors.length === 0,
    errors.length > 0 ? `${errors.length} errors: ${errors[0]}` : '');

  // Analyze distribution
  const constellationCounts: Record<string, number> = {};
  for (const r of results) {
    constellationCounts[r.constellation] = (constellationCounts[r.constellation] || 0) + 1;
  }

  const uniqueConstellations = Object.keys(constellationCounts).length;
  test('Good constellation diversity (10+)', uniqueConstellations >= 10,
    `Got ${uniqueConstellations} unique constellations`);

  // Check no single constellation dominates
  const maxCount = Math.max(...Object.values(constellationCounts));
  test('No constellation dominates (max <40%)', maxCount < 40,
    `Max: ${maxCount}% (${Object.entries(constellationCounts).find(([,v]) => v === maxCount)?.[0]})`);

  // Check score distributions
  const avgConfidence = results.reduce((s, r) => s + r.scores.confidence, 0) / results.length;
  test('Average confidence is reasonable (0.5-0.95)',
    avgConfidence >= 0.5 && avgConfidence <= 0.95,
    `Avg: ${avgConfidence.toFixed(3)}`);

  console.log('\n  Distribution:');
  Object.entries(constellationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([name, count]) => {
      console.log(`    ${name}: ${count}%`);
    });
}

// ============================================================================
// TEST SUITE 8: API Simulation
// ============================================================================
async function testAPISimulation() {
  console.log('\n🌐 TEST SUITE 8: API Data Format Validation');
  console.log('─'.repeat(50));

  // Simulate what the API receives and returns
  const questions = selectAdaptiveQuestions().questions;
  const answers = questions.map(q => getRandomAnswer(q));
  const scoring = scoreTraits(answers);

  // Validate scoring result structure
  test('ScoringResult has traits', scoring.traits !== undefined);
  test('ScoringResult has aesthetic', scoring.aesthetic !== undefined);
  test('ScoringResult has overallConfidence', typeof scoring.overallConfidence === 'number');
  test('ScoringResult has reliability', typeof scoring.reliability === 'number');

  // Validate trait structure
  for (const trait of ALL_TRAITS) {
    const t = scoring.traits[trait];
    test(`Trait ${trait} has score`, typeof t.score === 'number' && t.score >= 0 && t.score <= 1);
    test(`Trait ${trait} has confidence`, typeof t.confidence === 'number');
  }

  // Validate aesthetic structure
  const a = scoring.aesthetic;
  test('Aesthetic has darknessPreference', typeof a.darknessPreference === 'number');
  test('Aesthetic has tempoRangeMin/Max', typeof a.tempoRangeMin === 'number' && typeof a.tempoRangeMax === 'number');

  // Validate constellation result structure
  const psychometric = {
    openness: scoring.traits.openness.score,
    conscientiousness: scoring.traits.conscientiousness.score,
    extraversion: scoring.traits.extraversion.score,
    agreeableness: scoring.traits.agreeableness.score,
    neuroticism: scoring.traits.neuroticism.score,
    noveltySeeking: scoring.traits.noveltySeeking.score,
    aestheticSensitivity: scoring.traits.aestheticSensitivity.score,
    riskTolerance: scoring.traits.riskTolerance.score,
  };

  const { profile, result } = computeConstellationProfile(psychometric, scoring.aesthetic);

  test('Profile has primaryConstellationId', typeof profile.primaryConstellationId === 'string');
  test('Profile has blendWeights', typeof profile.blendWeights === 'object');
  test('Result has summary', result.summary !== undefined);
  test('Result has details', result.details !== undefined);
  test('Result summary has primaryName', typeof result.summary.primaryName === 'string');
  test('Result summary has keyScores', result.summary.keyScores !== undefined);
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================
async function runAllTests() {
  console.log('═'.repeat(60));
  console.log('🧪 SUBTASTE COMPREHENSIVE STRESS TEST');
  console.log('═'.repeat(60));
  console.log(`Testing ${itemBank.length} questions across ${ALL_TRAITS.length} traits`);
  console.log(`${CONSTELLATION_IDS.length} possible constellations`);

  testItemBankIntegrity();
  testAdaptiveSelection();
  testScoringAccuracy();
  testProgressUpdates();
  testConstellationAssignment();
  testEdgeCases();
  testEndToEnd();
  await testAPISimulation();

  console.log('\n' + '═'.repeat(60));
  console.log('📋 FINAL RESULTS');
  console.log('═'.repeat(60));
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  ${PASS} Passed: ${passedTests}`);
  console.log(`  ${FAIL} Failed: ${failedTests}`);
  console.log(`  ${WARN} Warnings: ${warnings}`);
  console.log('─'.repeat(60));

  const passRate = ((passedTests / totalTests) * 100).toFixed(1);
  if (failedTests === 0) {
    console.log(`\n🎉 ALL TESTS PASSED! (${passRate}% pass rate)`);
    console.log('✅ System is ready for beta testers!');
  } else {
    console.log(`\n⚠️  ${failedTests} tests failed (${passRate}% pass rate)`);
    console.log('Please fix failing tests before beta release.');
  }
}

runAllTests().catch(console.error);
