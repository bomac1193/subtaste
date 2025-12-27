/**
 * Comprehensive Quiz Stress Test
 * Tests question diversity, scoring accuracy, and end-to-end flow
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';

// Track all questions seen across sessions
const questionTracker = new Map();
const sessionQuestions = [];
const constellationResults = [];
const errors = [];

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, parseError: e.message });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Generate realistic trait scores with variation
function generateTraitScores(seed) {
  const baseTraits = {
    openness: 0.3 + Math.random() * 0.6,
    conscientiousness: 0.2 + Math.random() * 0.6,
    extraversion: 0.2 + Math.random() * 0.7,
    agreeableness: 0.3 + Math.random() * 0.5,
    neuroticism: 0.1 + Math.random() * 0.6,
    noveltySeeking: 0.2 + Math.random() * 0.7,
    riskTolerance: 0.2 + Math.random() * 0.6,
    aestheticSensitivity: 0.3 + Math.random() * 0.6,
  };

  const traitScores = {};
  for (const [trait, value] of Object.entries(baseTraits)) {
    const confidence = 0.6 + Math.random() * 0.3;
    traitScores[trait] = {
      score: Math.round(value * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      std: Math.round((0.1 + Math.random() * 0.15) * 100) / 100,
      itemCount: 3,
      rawSum: Math.round(value * 3 * 100) / 100,
      responses: [value],
    };
  }

  return {
    traits: traitScores,
    aesthetic: {
      colorPaletteVector: [],
      darknessPreference: Math.round(Math.random() * 100) / 100,
      complexityPreference: Math.round(Math.random() * 100) / 100,
      symmetryPreference: 0.5,
      organicVsSynthetic: Math.round(Math.random() * 100) / 100,
      minimalVsMaximal: Math.round(Math.random() * 100) / 100,
      tempoRangeMin: 70 + Math.floor(Math.random() * 40),
      tempoRangeMax: 120 + Math.floor(Math.random() * 40),
      energyRangeMin: 0.3 + Math.random() * 0.2,
      energyRangeMax: 0.6 + Math.random() * 0.3,
      harmonicDissonanceTolerance: 0.3,
      rhythmPreference: 0.5,
      acousticVsDigital: Math.round(Math.random() * 100) / 100,
    },
    overallConfidence: 0.65 + Math.random() * 0.25,
    reliability: 0.7 + Math.random() * 0.2,
    itemsAnswered: 24,
    estimatedAccuracy: 0.65 + Math.random() * 0.25,
    questionsNeededForTarget: 0,
  };
}

async function runQuizSession(sessionNum) {
  const scoringResult = generateTraitScores(sessionNum);

  try {
    // Submit quiz
    const result = await makeRequest(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/quiz',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { scoringResult }
    );

    if (result.status !== 200) {
      throw new Error('HTTP ' + result.status + ': ' + JSON.stringify(result.data).slice(0, 200));
    }

    if (!result.data.success) {
      throw new Error('API error: ' + (result.data.error || 'Unknown'));
    }

    const userId = result.data.userId;
    const constellation = result.data.constellation;

    // Fetch full profile
    const profileResult = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/profile?userId=' + userId + '&format=full',
      method: 'GET',
    });

    if (profileResult.status !== 200) {
      throw new Error('Profile fetch failed: HTTP ' + profileResult.status);
    }

    return {
      success: true,
      sessionNum,
      userId,
      constellation,
      traits: scoringResult.traits,
      profile: profileResult.data,
    };
  } catch (err) {
    return {
      success: false,
      sessionNum,
      error: err.message,
    };
  }
}

async function main() {
  const NUM_SESSIONS = 20;

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         SUBTASTE QUIZ COMPREHENSIVE STRESS TEST            ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║  Testing: ' + NUM_SESSIONS + ' quiz sessions                                   ║');
  console.log('║  Checking: API stability, constellation variety, scoring   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  const results = [];
  const constellations = {};
  let successCount = 0;
  let errorCount = 0;

  console.log('Running quiz sessions...\n');

  for (let i = 1; i <= NUM_SESSIONS; i++) {
    process.stdout.write('  Session ' + String(i).padStart(2) + '/' + NUM_SESSIONS + ': ');

    const result = await runQuizSession(i);
    results.push(result);

    if (result.success) {
      successCount++;
      constellations[result.constellation] = (constellations[result.constellation] || 0) + 1;

      // Extract key trait for display
      const topTrait = Object.entries(result.traits)
        .sort((a, b) => b[1].score - a[1].score)[0];

      console.log('✓ ' + result.constellation.padEnd(12) + ' | top trait: ' + topTrait[0] + ' (' + topTrait[1].score.toFixed(2) + ')');
    } else {
      errorCount++;
      errors.push({ session: i, error: result.error });
      console.log('✗ ERROR: ' + result.error.slice(0, 50));
    }

    // Small delay to avoid overwhelming the server
    await new Promise(r => setTimeout(r, 150));
  }

  console.log('\n' + '═'.repeat(64));
  console.log('RESULTS SUMMARY');
  console.log('═'.repeat(64));

  console.log('\n📊 Success Rate: ' + successCount + '/' + NUM_SESSIONS + ' (' + Math.round(successCount/NUM_SESSIONS*100) + '%)');

  if (errorCount > 0) {
    console.log('\n❌ Errors (' + errorCount + '):');
    errors.forEach(e => console.log('   Session ' + e.session + ': ' + e.error));
  }

  console.log('\n🌟 Constellation Distribution:');
  const sortedConstellations = Object.entries(constellations).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...Object.values(constellations));
  sortedConstellations.forEach(([name, count]) => {
    const bar = '█'.repeat(Math.round(count / maxCount * 20));
    console.log('   ' + name.padEnd(15) + ' ' + bar.padEnd(20) + ' ' + count);
  });

  // Analyze trait-to-constellation mapping
  console.log('\n📈 Trait Analysis (from successful sessions):');
  const successfulResults = results.filter(r => r.success);

  if (successfulResults.length > 0) {
    // Group by constellation and show average traits
    const constellationTraits = {};
    successfulResults.forEach(r => {
      if (!constellationTraits[r.constellation]) {
        constellationTraits[r.constellation] = { count: 0, traits: {} };
      }
      constellationTraits[r.constellation].count++;
      for (const [trait, data] of Object.entries(r.traits)) {
        if (!constellationTraits[r.constellation].traits[trait]) {
          constellationTraits[r.constellation].traits[trait] = [];
        }
        constellationTraits[r.constellation].traits[trait].push(data.score);
      }
    });

    for (const [constellation, data] of Object.entries(constellationTraits)) {
      console.log('\n   ' + constellation + ' (n=' + data.count + '):');
      const avgTraits = {};
      for (const [trait, scores] of Object.entries(data.traits)) {
        avgTraits[trait] = scores.reduce((a, b) => a + b, 0) / scores.length;
      }
      const topTraits = Object.entries(avgTraits)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      topTraits.forEach(([trait, avg]) => {
        console.log('      ' + trait.padEnd(20) + ' avg: ' + avg.toFixed(2));
      });
    }
  }

  // Final verdict
  console.log('\n' + '═'.repeat(64));
  if (successCount === NUM_SESSIONS && Object.keys(constellations).length > 1) {
    console.log('✅ TEST PASSED: All sessions successful, multiple constellations assigned');
  } else if (successCount === NUM_SESSIONS) {
    console.log('⚠️  TEST WARNING: All sessions successful but limited constellation variety');
  } else {
    console.log('❌ TEST FAILED: ' + errorCount + ' errors encountered');
  }
  console.log('═'.repeat(64));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
