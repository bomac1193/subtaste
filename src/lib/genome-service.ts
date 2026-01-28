/**
 * Genome Service
 *
 * Bridge between @subtaste/core packages and Prisma database.
 * Handles genome storage, retrieval, and updates for THE TWELVE system.
 *
 * Note: Until the database migration is applied, this service stores
 * genome data in the existing ConstellationProfile JSON fields.
 */

import { prisma } from './prisma';
import type {
  TasteGenome,
  TasteGenomePublic,
  Designation,
  Signal,
  Psychometrics
} from '@subtaste/core';
import {
  createGenome,
  toPublicGenome,
  classify,
  generateIdentityStatement,
  getDefaultPsychometrics,
  applyTemporalDecay,
  serializeGenome,
  deserializeGenome
} from '@subtaste/core';

/**
 * Get full genome for a user (server-side only)
 */
export async function getGenome(userId: string): Promise<TasteGenome | null> {
  const profile = await prisma.constellationProfile.findUnique({
    where: { userId }
  });

  if (!profile) {
    return null;
  }

  // Check if we have a stored genome in blendWeights (repurposed for THE TWELVE)
  const storedGenome = profile.blendWeights as { _genomeData?: string } | null;

  if (storedGenome && typeof storedGenome._genomeData === 'string') {
    try {
      return deserializeGenome(storedGenome._genomeData);
    } catch {
      // Fall through to reconstruction
    }
  }

  // No stored genome - user hasn't been migrated to THE TWELVE yet
  return null;
}

/**
 * Get public genome for a user (safe for client)
 */
export async function getPublicGenome(userId: string): Promise<TasteGenomePublic | null> {
  const genome = await getGenome(userId);

  if (!genome) {
    return null;
  }

  return toPublicGenome(genome);
}

/**
 * Store a genome in the database
 */
async function storeGenome(userId: string, genome: TasteGenome): Promise<void> {
  const serialized = serializeGenome(genome);

  await prisma.constellationProfile.upsert({
    where: { userId },
    create: {
      userId,
      primaryConstellationId: genome.archetype.primary.designation,
      blendWeights: {
        _genomeData: serialized,
        // Also store distribution for backwards compatibility
        ...genome.archetype.distribution
      },
      // Legacy archetype field for migration tracking
      primaryArchetypeId: genome.archetype.primary.glyph,
      archetypeBlendWeights: genome.archetype.distribution,
      migratedToArchetypes: true,
      identityStatement: generateIdentityStatement(
        genome.archetype.primary.designation,
        genome.archetype.secondary?.designation || null
      ),
      subtasteIndex: genome.behaviour.confidence * 100,
      explorerScore: 50, // Default
      earlyAdopterScore: 50 // Default
    },
    update: {
      primaryConstellationId: genome.archetype.primary.designation,
      blendWeights: {
        _genomeData: serialized,
        ...genome.archetype.distribution
      },
      primaryArchetypeId: genome.archetype.primary.glyph,
      archetypeBlendWeights: genome.archetype.distribution,
      migratedToArchetypes: true,
      identityStatement: generateIdentityStatement(
        genome.archetype.primary.designation,
        genome.archetype.secondary?.designation || null
      ),
      subtasteIndex: genome.behaviour.confidence * 100
    }
  });
}

/**
 * Create or update genome from signals
 */
export async function updateGenomeFromSignals(
  userId: string,
  newSignals: Signal[]
): Promise<TasteGenome> {
  // Get existing genome if any
  const existingGenome = await getGenome(userId);

  // Get existing psychometrics or use defaults
  const existingPsychometrics = existingGenome?._engine?.psychometrics
    || await fetchPsychometricsFromProfile(userId)
    || getDefaultPsychometrics();

  // Merge with existing signal history
  const allSignals: Signal[] = existingGenome?.behaviour?.signalHistory
    ? [...existingGenome.behaviour.signalHistory, ...newSignals]
    : newSignals;

  // Apply temporal decay to signals
  const decayedSignals = applyTemporalDecay(allSignals, {
    dailyDecay: 0.97 // ~30 day half-life
  });

  // Classify using all signals
  const classificationResult = classify({
    signals: decayedSignals,
    existingPsychometrics
  });

  // Create genome from classification
  const genome = createGenome({
    userId,
    classification: {
      primary: {
        designation: classificationResult.classification.primary.designation,
        confidence: classificationResult.classification.primary.confidence
      },
      secondary: classificationResult.classification.secondary ? {
        designation: classificationResult.classification.secondary.designation,
        confidence: classificationResult.classification.secondary.confidence
      } : null,
      distribution: classificationResult.classification.distribution
    },
    psychometrics: classificationResult.psychometrics,
    sephiroticBalance: classificationResult.sephiroticBalance,
    orishaResonance: classificationResult.orishaResonance
  });

  // Update with signal history (convert Signal to SignalEvent format)
  genome.behaviour.signalHistory = decayedSignals.slice(-1000).map((s, i) => ({
    ...s,
    id: `signal_${Date.now()}_${i}`,
    userId,
    processed: true
  }));
  genome.behaviour.confidence = classificationResult.classification.primary.confidence;
  genome.behaviour.lastCalibration = new Date();

  // Store the genome
  await storeGenome(userId, genome);

  return genome;
}

/**
 * Fetch psychometrics from existing psychometric profile
 */
async function fetchPsychometricsFromProfile(userId: string): Promise<Psychometrics | null> {
  const profile = await prisma.psychometricProfile.findUnique({
    where: { userId }
  });

  if (!profile) {
    return null;
  }

  // Map existing profile to THE TWELVE psychometrics format
  return {
    openness: {
      fantasy: profile.openness * 0.8 + profile.noveltySeeking * 0.2,
      aesthetics: profile.aestheticSensitivity,
      feelings: profile.neuroticism > 0.5 ? 0.6 : 0.4, // Inverse relationship
      actions: profile.noveltySeeking * 0.7 + profile.riskTolerance * 0.3,
      ideas: profile.openness * 0.5 + 0.5 * (1 - profile.conscientiousness * 0.3),
      values: profile.openness * 0.6 + profile.agreeableness * 0.4
    },
    intellect: profile.openness * 0.7 + 0.3,
    musicPreferences: {
      mellow: 1 - profile.extraversion * 0.5,
      unpretentious: 0.5, // Default
      sophisticated: profile.openness * 0.7 + profile.aestheticSensitivity * 0.3,
      intense: profile.extraversion * 0.5 + profile.riskTolerance * 0.5,
      contemporary: profile.noveltySeeking * 0.6 + 0.4
    }
  };
}

/**
 * Reveal sigil for a user
 */
export async function revealSigil(userId: string): Promise<boolean> {
  const genome = await getGenome(userId);

  if (!genome) {
    return false;
  }

  // Update genome to reveal sigil
  genome.formal.revealed = true;
  genome.formal.revealedAt = new Date();
  genome.updatedAt = new Date();

  await storeGenome(userId, genome);

  return true;
}

/**
 * Process quiz submission and create initial genome
 */
export async function processQuizSubmission(
  userId: string | undefined,
  responses: Array<{ questionId: string; response: number }>
): Promise<{ userId: string; genome: TasteGenomePublic }> {
  // Create user if needed
  let finalUserId = userId;
  if (!finalUserId) {
    const newUser = await prisma.user.create({
      data: {},
      select: { id: true }
    });
    finalUserId = newUser.id;
  }

  // Convert quiz responses to signals
  const signals: Signal[] = responses.map(r => ({
    type: 'explicit' as const,
    timestamp: new Date(),
    source: 'quiz' as const,
    data: {
      kind: 'preference' as const,
      itemId: r.questionId,
      value: r.response === 0 ? 'A' : 'B',
      archetypeWeights: inferArchetypeWeights(r.questionId, r.response)
    }
  }));

  // Update genome from signals
  const genome = await updateGenomeFromSignals(finalUserId, signals);

  // Get public genome
  const publicGenome = toPublicGenome(genome);

  return {
    userId: finalUserId,
    genome: publicGenome
  };
}

/**
 * Infer archetype weights from quiz question
 * This maps question responses to archetype affinities
 */
function inferArchetypeWeights(
  questionId: string,
  response: number
): Partial<Record<Designation, number>> {
  // Question-to-archetype mapping based on INITIAL_QUESTIONS
  const mappings: Record<string, [Partial<Record<Designation, number>>, Partial<Record<Designation, number>>]> = {
    'init-1-approach': [
      // Option A: "Keep it close" - private, selective
      { 'S-0': 0.3, 'C-4': 0.3, 'P-7': 0.2 },
      // Option B: "Spread the word" - public, evangelical
      { 'H-6': 0.4, 'N-5': 0.2, 'F-9': 0.2 }
    ],
    'init-2-timing': [
      // Option A: "Ahead of its time" - early adopter
      { 'V-2': 0.4, 'R-10': 0.3, 'D-8': 0.15 },
      // Option B: "Refined within tradition" - patient, archival
      { 'L-3': 0.3, 'P-7': 0.3, 'T-1': 0.2 }
    ],
    'init-3-creation': [
      // Option A: "Build the structure first" - systematic
      { 'T-1': 0.4, 'F-9': 0.3, 'S-0': 0.15 },
      // Option B: "Discover through doing" - intuitive
      { 'D-8': 0.4, 'Ø': 0.25, 'V-2': 0.2 }
    ]
  };

  const mapping = mappings[questionId];
  if (!mapping) {
    return {}; // Unknown question
  }

  return mapping[response] || {};
}

/**
 * Get profiling progress for a user
 */
export async function getProfilingProgress(userId: string) {
  const genome = await getGenome(userId);

  if (!genome) {
    return null;
  }

  const signalCount = genome.behaviour.signalHistory?.length || 0;

  // Determine stage based on signal count
  let currentStage = 'initial';
  const stagesCompleted: string[] = [];

  if (signalCount >= 3) {
    stagesCompleted.push('initial');
    currentStage = 'calibration';
  }
  if (signalCount >= 15) {
    stagesCompleted.push('calibration');
    currentStage = 'deep';
  }
  if (signalCount >= 50) {
    stagesCompleted.push('deep');
    currentStage = 'complete';
  }

  return {
    currentStage,
    stagesCompleted,
    signalCount
  };
}

/**
 * Migrate existing user to THE TWELVE system
 */
export async function migrateToTwelve(userId: string): Promise<TasteGenome | null> {
  // Check if already migrated
  const existingGenome = await getGenome(userId);
  if (existingGenome) {
    return existingGenome;
  }

  // Get existing profiles
  const [psychometric, aesthetic] = await Promise.all([
    prisma.psychometricProfile.findUnique({ where: { userId } }),
    prisma.aestheticPreference.findUnique({ where: { userId } })
  ]);

  if (!psychometric) {
    return null;
  }

  // Convert to signals
  const signals: Signal[] = [];

  // Map psychometric profile to signals
  if (psychometric.openness > 0.6) {
    signals.push({
      type: 'explicit',
      timestamp: new Date(),
      source: 'migration',
      data: {
        kind: 'preference',
        itemId: 'migration-openness-high',
        value: 'high_openness',
        archetypeWeights: { 'V-2': 0.2, 'D-8': 0.2, 'R-10': 0.1 }
      }
    });
  }

  if (psychometric.noveltySeeking > 0.6) {
    signals.push({
      type: 'explicit',
      timestamp: new Date(),
      source: 'migration',
      data: {
        kind: 'preference',
        itemId: 'migration-novelty-high',
        value: 'novelty_seeking',
        archetypeWeights: { 'V-2': 0.3, 'R-10': 0.2 }
      }
    });
  }

  if (psychometric.aestheticSensitivity > 0.6) {
    signals.push({
      type: 'explicit',
      timestamp: new Date(),
      source: 'migration',
      data: {
        kind: 'preference',
        itemId: 'migration-aesthetic-high',
        value: 'aesthetic_sensitivity',
        archetypeWeights: { 'S-0': 0.3, 'D-8': 0.2 }
      }
    });
  }

  // Map aesthetic preferences
  if (aesthetic) {
    if (aesthetic.minimalVsMaximal < 0.4) {
      signals.push({
        type: 'explicit',
        timestamp: new Date(),
        source: 'migration',
        data: {
          kind: 'preference',
          itemId: 'migration-minimal',
          value: 'minimal_aesthetic',
          archetypeWeights: { 'C-4': 0.4, 'Ø': 0.2 }
        }
      });
    } else if (aesthetic.minimalVsMaximal > 0.6) {
      signals.push({
        type: 'explicit',
        timestamp: new Date(),
        source: 'migration',
        data: {
          kind: 'preference',
          itemId: 'migration-maximal',
          value: 'maximal_aesthetic',
          archetypeWeights: { 'H-6': 0.3, 'P-7': 0.2 }
        }
      });
    }
  }

  // If no signals could be derived, create defaults
  if (signals.length === 0) {
    signals.push({
      type: 'explicit',
      timestamp: new Date(),
      source: 'migration',
      data: {
        kind: 'preference',
        itemId: 'migration-default',
        value: 'default',
        archetypeWeights: { 'N-5': 0.3 } // Nexis - the balanced archetype
      }
    });
  }

  // Create genome from signals
  const genome = await updateGenomeFromSignals(userId, signals);

  return genome;
}
