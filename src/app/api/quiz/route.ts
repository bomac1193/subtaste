import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ScoringResult, TraitScore } from '@/lib/quiz/scoring';
import { TraitId, ALL_TRAITS } from '@/lib/quiz/item-bank';
import { computeConstellationProfile } from '@/lib/scoring';
import { PsychometricProfile, AestheticPreference } from '@/lib/types/models';

/**
 * Convert ScoringResult traits to PsychometricProfile format
 */
function convertToPsychometricProfile(
  traits: Record<TraitId, TraitScore>
): Omit<PsychometricProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  return {
    openness: traits.openness?.score ?? 0.5,
    conscientiousness: traits.conscientiousness?.score ?? 0.5,
    extraversion: traits.extraversion?.score ?? 0.5,
    agreeableness: traits.agreeableness?.score ?? 0.5,
    neuroticism: traits.neuroticism?.score ?? 0.5,
    noveltySeeking: traits.noveltySeeking?.score ?? 0.5,
    aestheticSensitivity: traits.aestheticSensitivity?.score ?? 0.5,
    riskTolerance: traits.riskTolerance?.score ?? 0.5,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, scoringResult } = body as {
      userId?: string;
      scoringResult: ScoringResult;
    };

    if (!scoringResult || !scoringResult.traits) {
      return NextResponse.json(
        { error: 'No scoring result provided' },
        { status: 400 }
      );
    }

    // Convert scoring result to psychometric and aesthetic profiles
    const psychometric = convertToPsychometricProfile(scoringResult.traits);
    const aesthetic = scoringResult.aesthetic;

    // Create or update user with profile data
    let user;
    if (userId) {
      // Try to find existing user
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (existingUser) {
        user = await prisma.user.update({
          where: { id: userId },
          data: {
            updatedAt: new Date(),
          },
        });
      } else {
        // User ID provided but not found - create new user
        user = await prisma.user.create({
          data: {},
        });
      }
    } else {
      // Create new anonymous user
      user = await prisma.user.create({
        data: {},
      });
    }

    // Upsert psychometric profile
    await prisma.psychometricProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...psychometric,
      },
      update: psychometric,
    });

    // Upsert aesthetic preference
    await prisma.aestheticPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...aesthetic,
      },
      update: aesthetic,
    });

    // Compute constellation profile
    const { profile, result } = computeConstellationProfile(psychometric, aesthetic);

    // Upsert constellation profile
    await prisma.constellationProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        primaryConstellationId: profile.primaryConstellationId,
        blendWeights: profile.blendWeights,
        subtasteIndex: profile.subtasteIndex,
        explorerScore: profile.explorerScore,
        earlyAdopterScore: profile.earlyAdopterScore,
      },
      update: {
        primaryConstellationId: profile.primaryConstellationId,
        blendWeights: profile.blendWeights,
        subtasteIndex: profile.subtasteIndex,
        explorerScore: profile.explorerScore,
        earlyAdopterScore: profile.earlyAdopterScore,
      },
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      preliminaryConstellation: profile.primaryConstellationId,
      confidence: scoringResult.overallConfidence,
      reliability: scoringResult.reliability,
      result,
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process quiz' },
      { status: 500 }
    );
  }
}
