/**
 * End-to-End Quiz Simulation
 * Simulates a complete quiz flow with realistic answer patterns
 */

const http = require('http');

const PERSONALITY_PROFILES = [
  { name: 'Explorer', openness: 0.85, conscientiousness: 0.4, extraversion: 0.7, agreeableness: 0.6, neuroticism: 0.3, noveltySeeking: 0.9, riskTolerance: 0.75, aestheticSensitivity: 0.8 },
  { name: 'Traditionalist', openness: 0.3, conscientiousness: 0.85, extraversion: 0.5, agreeableness: 0.7, neuroticism: 0.4, noveltySeeking: 0.2, riskTolerance: 0.25, aestheticSensitivity: 0.5 },
  { name: 'Social Butterfly', openness: 0.6, conscientiousness: 0.5, extraversion: 0.95, agreeableness: 0.85, neuroticism: 0.35, noveltySeeking: 0.7, riskTolerance: 0.6, aestheticSensitivity: 0.55 },
  { name: 'Introvert Artist', openness: 0.75, conscientiousness: 0.6, extraversion: 0.2, agreeableness: 0.5, neuroticism: 0.5, noveltySeeking: 0.6, riskTolerance: 0.35, aestheticSensitivity: 0.95 },
  { name: 'Risk Taker', openness: 0.7, conscientiousness: 0.3, extraversion: 0.8, agreeableness: 0.4, neuroticism: 0.25, noveltySeeking: 0.85, riskTolerance: 0.95, aestheticSensitivity: 0.6 },
  { name: 'Anxious Perfectionist', openness: 0.5, conscientiousness: 0.9, extraversion: 0.4, agreeableness: 0.55, neuroticism: 0.85, noveltySeeking: 0.35, riskTolerance: 0.2, aestheticSensitivity: 0.7 },
  { name: 'Balanced Middle', openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.5, noveltySeeking: 0.5, riskTolerance: 0.5, aestheticSensitivity: 0.5 },
  { name: 'Aesthetic Maximalist', openness: 0.9, conscientiousness: 0.45, extraversion: 0.6, agreeableness: 0.5, neuroticism: 0.4, noveltySeeking: 0.8, riskTolerance: 0.55, aestheticSensitivity: 0.98 },
];

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
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function profileToScoringResult(profile) {
  const traitScores = {};
  const traitNames = ['openness', 'conscientiousness', 'extraversion', 'agreeableness',
                      'neuroticism', 'noveltySeeking', 'riskTolerance', 'aestheticSensitivity'];

  for (const trait of traitNames) {
    const score = profile[trait];
    // Add slight noise to simulate real quiz variance
    const noisyScore = Math.max(0, Math.min(1, score + (Math.random() - 0.5) * 0.1));
    traitScores[trait] = {
      score: Math.round(noisyScore * 100) / 100,
      confidence: 0.7 + Math.random() * 0.2,
      std: 0.08 + Math.random() * 0.1,
      itemCount: 3,
      rawSum: noisyScore * 3,
      responses: [noisyScore],
    };
  }

  return {
    traits: traitScores,
    aesthetic: {
      colorPaletteVector: [],
      darknessPreference: 0.3 + Math.random() * 0.4,
      complexityPreference: profile.aestheticSensitivity * 0.8 + Math.random() * 0.2,
      symmetryPreference: 0.5,
      organicVsSynthetic: 0.5 + (profile.openness - 0.5) * 0.4,
      minimalVsMaximal: profile.aestheticSensitivity * 0.7,
      tempoRangeMin: 70 + profile.extraversion * 30,
      tempoRangeMax: 110 + profile.extraversion * 40,
      energyRangeMin: 0.3 + profile.extraversion * 0.2,
      energyRangeMax: 0.6 + profile.extraversion * 0.3,
      harmonicDissonanceTolerance: profile.openness * 0.5,
      rhythmPreference: 0.5,
      acousticVsDigital: 0.5 + (profile.noveltySeeking - 0.5) * 0.4,
    },
    overallConfidence: 0.75,
    reliability: 0.82,
    itemsAnswered: 24,
    estimatedAccuracy: 0.78,
    questionsNeededForTarget: 0,
  };
}

async function runProfileTest(profile, index) {
  const scoringResult = profileToScoringResult(profile);

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

    if (result.status !== 200 || !result.data.success) {
      return { success: false, profile: profile.name, error: 'Submit failed' };
    }

    // Fetch profile summary
    const profileResult = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/profile?userId=' + result.data.userId + '&format=summary',
      method: 'GET',
    });

    return {
      success: true,
      profile: profile.name,
      constellation: result.data.constellation,
      userId: result.data.userId,
      topScenes: profileResult.data?.topScenes || [],
    };
  } catch (err) {
    return { success: false, profile: profile.name, error: err.message };
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         END-TO-END PERSONALITY PROFILE TEST                ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║  Testing distinct personality archetypes for correct       ║');
  console.log('║  constellation mapping and result consistency              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  const results = [];

  for (let i = 0; i < PERSONALITY_PROFILES.length; i++) {
    const profile = PERSONALITY_PROFILES[i];
    process.stdout.write('  Testing "' + profile.name.padEnd(20) + '": ');

    const result = await runProfileTest(profile, i);
    results.push(result);

    if (result.success) {
      console.log('→ ' + result.constellation);
    } else {
      console.log('✗ ' + result.error);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log('');
  console.log('═'.repeat(64));
  console.log('PROFILE → CONSTELLATION MAPPING');
  console.log('═'.repeat(64));
  console.log('');

  const successful = results.filter(r => r.success);
  const constellationMap = {};

  successful.forEach(r => {
    if (!constellationMap[r.constellation]) {
      constellationMap[r.constellation] = [];
    }
    constellationMap[r.constellation].push(r.profile);
  });

  for (const [constellation, profiles] of Object.entries(constellationMap)) {
    console.log('  ' + constellation + ':');
    profiles.forEach(p => console.log('    • ' + p));
  }

  console.log('');
  console.log('═'.repeat(64));

  const uniqueConstellations = Object.keys(constellationMap).length;
  if (successful.length === PERSONALITY_PROFILES.length) {
    console.log('✅ All ' + PERSONALITY_PROFILES.length + ' profiles completed successfully');
    console.log('✅ Mapped to ' + uniqueConstellations + ' unique constellations');
    if (uniqueConstellations >= 4) {
      console.log('✅ Good constellation diversity for distinct personality types');
    } else {
      console.log('⚠️  Limited constellation diversity - may need tuning');
    }
  } else {
    console.log('❌ ' + (PERSONALITY_PROFILES.length - successful.length) + ' profiles failed');
  }
  console.log('═'.repeat(64));
}

main().catch(console.error);
