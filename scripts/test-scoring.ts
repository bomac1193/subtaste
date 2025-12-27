/**
 * Test script to verify quiz scoring accuracy
 * Run with: npx tsx scripts/test-scoring.ts
 */

import { itemBank, getAnswerById, ALL_TRAITS, TraitId } from '../src/lib/quiz/item-bank';
import { scoreTraits, Answer } from '../src/lib/quiz/scoring';

// Helper to create an answer
function makeAnswer(questionId: string, answerId: string): Answer | null {
  const question = itemBank.find(q => q.id === questionId);
  const answer = getAnswerById(questionId, answerId);
  if (!question || !answer) {
    console.log(`Warning: Could not find question ${questionId} or answer ${answerId}`);
    return null;
  }
  return {
    questionId,
    answerId,
    question,
    answer,
  };
}

// Test Case 1: All "high openness" answers
function testHighOpenness() {
  console.log('\n=== TEST: High Openness Profile ===');

  const answers: Answer[] = [
    makeAnswer('open_1_exploration', 'open_1_a'),  // Explore somewhere new
    makeAnswer('open_2_ideas', 'open_2_a'),        // Get excited about unconventional
    makeAnswer('open_3_art', 'open_3_c'),          // Novelty and breaking conventions
    makeAnswer('open_4_change', 'open_4_a'),       // Excited about new possibilities
    makeAnswer('open_5_philosophy', 'open_5_a'),   // Fascinating without practical use
  ].filter(Boolean) as Answer[];

  const result = scoreTraits(answers);
  console.log('Openness score:', result.traits.openness.score.toFixed(3), '(expected: high, >0.7)');
  console.log('Confidence:', result.traits.openness.confidence.toFixed(3));
  return result.traits.openness.score > 0.7;
}

// Test Case 2: All "low extraversion" (introvert) answers
function testLowExtraversion() {
  console.log('\n=== TEST: Low Extraversion (Introvert) Profile ===');

  const answers: Answer[] = [
    makeAnswer('extr_1_recharge', 'extr_1_b'),     // Solitude or one close person
    makeAnswer('extr_2_parties', 'extr_2_b'),      // Find quiet corner
    makeAnswer('extr_3_attention', 'extr_3_b'),    // Uncomfortable, prefer to blend in
    makeAnswer('extr_4_weekend', 'extr_4_d'),      // Complete solitude
    makeAnswer('extr_5_thinking', 'extr_5_b'),     // Need quiet time to think
  ].filter(Boolean) as Answer[];

  const result = scoreTraits(answers);
  console.log('Extraversion score:', result.traits.extraversion.score.toFixed(3), '(expected: low, <0.4)');
  console.log('Confidence:', result.traits.extraversion.confidence.toFixed(3));
  return result.traits.extraversion.score < 0.4;
}

// Test Case 3: High risk tolerance answers
function testHighRiskTolerance() {
  console.log('\n=== TEST: High Risk Tolerance Profile ===');

  const answers: Answer[] = [
    makeAnswer('risk_1_security', 'risk_1_a'),     // Take risky opportunity
    makeAnswer('risk_2_uncertainty', 'risk_2_a'),  // Excited by possibilities
    makeAnswer('risk_3_failure', 'risk_3_a'),      // Worth it for chance of greatness
    makeAnswer('risk_4_comfort', 'risk_4_a'),      // Growth requires discomfort
  ].filter(Boolean) as Answer[];

  const result = scoreTraits(answers);
  console.log('Risk Tolerance score:', result.traits.riskTolerance.score.toFixed(3), '(expected: high, >0.7)');
  console.log('Confidence:', result.traits.riskTolerance.confidence.toFixed(3));
  return result.traits.riskTolerance.score > 0.7;
}

// Test Case 4: Mixed/neutral profile
function testMixedProfile() {
  console.log('\n=== TEST: Mixed Profile (alternating answers) ===');

  const answers: Answer[] = [
    makeAnswer('open_1_exploration', 'open_1_a'),  // High openness
    makeAnswer('open_2_ideas', 'open_2_b'),        // Low openness
    makeAnswer('cons_1_planning', 'cons_1_b'),     // High conscientiousness
    makeAnswer('cons_2_deadlines', 'cons_2_b'),    // Low conscientiousness
    makeAnswer('extr_1_recharge', 'extr_1_a'),     // High extraversion
    makeAnswer('extr_2_parties', 'extr_2_b'),      // Low extraversion
  ].filter(Boolean) as Answer[];

  const result = scoreTraits(answers);
  console.log('\nAll trait scores (should be near 0.5 for mixed answers):');
  for (const trait of ALL_TRAITS) {
    const score = result.traits[trait];
    console.log(`  ${trait}: ${score.score.toFixed(3)} (confidence: ${score.confidence.toFixed(3)}, items: ${score.itemCount})`);
  }

  // Check if openness and extraversion are near middle
  const openNearMiddle = result.traits.openness.score > 0.4 && result.traits.openness.score < 0.6;
  const extrNearMiddle = result.traits.extraversion.score > 0.4 && result.traits.extraversion.score < 0.6;
  return openNearMiddle && extrNearMiddle;
}

// Test Case 5: Full quiz simulation
function testFullQuiz() {
  console.log('\n=== TEST: Full Quiz (24 questions) ===');

  // Simulate a user who is:
  // - High openness, high novelty seeking
  // - Low conscientiousness
  // - High extraversion
  // - Medium agreeableness
  // - Low neuroticism
  // - High risk tolerance
  // - High aesthetic sensitivity

  const answers: Answer[] = [
    // Openness - all high
    makeAnswer('open_1_exploration', 'open_1_a'),
    makeAnswer('open_2_ideas', 'open_2_a'),
    makeAnswer('open_3_art', 'open_3_c'),

    // Conscientiousness - all low
    makeAnswer('cons_1_planning', 'cons_1_a'),  // Trust gut
    makeAnswer('cons_2_deadlines', 'cons_2_b'), // Last minute
    makeAnswer('cons_3_organization', 'cons_3_d'), // Mess

    // Extraversion - all high
    makeAnswer('extr_1_recharge', 'extr_1_a'),
    makeAnswer('extr_2_parties', 'extr_2_a'),
    makeAnswer('extr_3_attention', 'extr_3_a'),

    // Agreeableness - mixed
    makeAnswer('agre_1_conflict', 'agre_1_a'),
    makeAnswer('agre_2_help', 'agre_2_b'),

    // Neuroticism - low
    makeAnswer('neur_1_emotions', 'neur_1_b'),
    makeAnswer('neur_2_worry', 'neur_2_b'),

    // Novelty seeking - high
    makeAnswer('novl_1_routine', 'novl_1_a'),
    makeAnswer('novl_2_music', 'novl_2_a'),
    makeAnswer('novl_3_travel', 'novl_3_a'),

    // Aesthetic sensitivity - high
    makeAnswer('aest_1_space', 'aest_1_c'),
    makeAnswer('aest_2_beauty', 'aest_2_a'),
    makeAnswer('aest_3_details', 'aest_3_a'),

    // Risk tolerance - high
    makeAnswer('risk_1_security', 'risk_1_a'),
    makeAnswer('risk_2_uncertainty', 'risk_2_a'),
    makeAnswer('risk_3_failure', 'risk_3_a'),

    // Identity
    makeAnswer('iden_1_role', 'iden_1_a'),  // Explorer
  ].filter(Boolean) as Answer[];

  console.log(`Processing ${answers.length} answers...`);

  const result = scoreTraits(answers);

  console.log('\nExpected profile: Explorer type (high open, high novelty, high risk, low consc)');
  console.log('\nActual scores:');
  console.log(`  Openness:            ${result.traits.openness.score.toFixed(3)} (expected: >0.7) ${result.traits.openness.score > 0.7 ? '✓' : '✗'}`);
  console.log(`  Conscientiousness:   ${result.traits.conscientiousness.score.toFixed(3)} (expected: <0.4) ${result.traits.conscientiousness.score < 0.4 ? '✓' : '✗'}`);
  console.log(`  Extraversion:        ${result.traits.extraversion.score.toFixed(3)} (expected: >0.7) ${result.traits.extraversion.score > 0.7 ? '✓' : '✗'}`);
  console.log(`  Agreeableness:       ${result.traits.agreeableness.score.toFixed(3)} (expected: ~0.5)`);
  console.log(`  Neuroticism:         ${result.traits.neuroticism.score.toFixed(3)} (expected: <0.4) ${result.traits.neuroticism.score < 0.4 ? '✓' : '✗'}`);
  console.log(`  Novelty Seeking:     ${result.traits.noveltySeeking.score.toFixed(3)} (expected: >0.7) ${result.traits.noveltySeeking.score > 0.7 ? '✓' : '✗'}`);
  console.log(`  Aesthetic Sens.:     ${result.traits.aestheticSensitivity.score.toFixed(3)} (expected: >0.7) ${result.traits.aestheticSensitivity.score > 0.7 ? '✓' : '✗'}`);
  console.log(`  Risk Tolerance:      ${result.traits.riskTolerance.score.toFixed(3)} (expected: >0.7) ${result.traits.riskTolerance.score > 0.7 ? '✓' : '✗'}`);

  console.log(`\nOverall confidence: ${result.overallConfidence.toFixed(3)}`);
  console.log(`Reliability: ${result.reliability.toFixed(3)}`);
  console.log(`Estimated accuracy: ${(result.estimatedAccuracy * 100).toFixed(1)}%`);

  return result;
}

// Run all tests
console.log('🧪 SUBTASTE SCORING VERIFICATION\n');
console.log('=' .repeat(50));

const results = {
  highOpenness: testHighOpenness(),
  lowExtraversion: testLowExtraversion(),
  highRisk: testHighRiskTolerance(),
  mixed: testMixedProfile(),
};

testFullQuiz();

console.log('\n' + '='.repeat(50));
console.log('SUMMARY:');
console.log(`  High Openness Test: ${results.highOpenness ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  Low Extraversion Test: ${results.lowExtraversion ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  High Risk Test: ${results.highRisk ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  Mixed Profile Test: ${results.mixed ? '✅ PASS' : '❌ FAIL'}`);
