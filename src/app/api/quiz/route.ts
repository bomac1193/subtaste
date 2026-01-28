import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ScoringResult, TraitScore } from '@/lib/quiz/scoring';
import { TraitId } from '@/lib/quiz/item-bank';
import { computeConstellationProfile } from '@/lib/scoring';

/**
 * Convert ScoringResult traits to psychometric profile format
 */
function convertToPsychometricProfile(traits: Record<TraitId, TraitScore>) {
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

/**
 * Convert aesthetic to DB format
 */
function convertToAestheticPreference(aesthetic: ScoringResult['aesthetic']) {
  return {
    colorPaletteVector: aesthetic.colorPaletteVector ?? [],
    darknessPreference: aesthetic.darknessPreference,
    complexityPreference: aesthetic.complexityPreference,
    symmetryPreference: aesthetic.symmetryPreference,
    organicVsSynthetic: aesthetic.organicVsSynthetic,
    minimalVsMaximal: aesthetic.minimalVsMaximal,
    tempoRangeMin: Math.round(aesthetic.tempoRangeMin),
    tempoRangeMax: Math.round(aesthetic.tempoRangeMax),
    energyRangeMin: aesthetic.energyRangeMin,
    energyRangeMax: aesthetic.energyRangeMax,
    harmonicDissonanceTolerance: aesthetic.harmonicDissonanceTolerance,
    rhythmPreference: aesthetic.rhythmPreference,
    acousticVsDigital: aesthetic.acousticVsDigital,
  };
}

/**
 * POST /api/quiz
 *
 * Submit quiz results and compute constellation profile.
 * Creates or updates user profile using Prisma.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, scoringResult, sessionId } = body as {
      userId?: string;
      sessionId?: string;
      scoringResult: ScoringResult;
    };

    if (!scoringResult || !scoringResult.traits) {
      return NextResponse.json(
        { error: 'No scoring result provided' },
        { status: 400 }
      );
    }

    // Convert scoring result to DB formats
    const psychometric = convertToPsychometricProfile(scoringResult.traits);
    const aesthetic = convertToAestheticPreference(scoringResult.aesthetic);

    // Create or get user
    let finalUserId = userId;

    if (finalUserId) {
      // Verify user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: finalUserId },
        select: { id: true },
      });

      if (!existingUser) {
        console.log('User ID not found, creating new user');
        finalUserId = undefined;
      }
    }

    if (!finalUserId) {
      // Create new anonymous user
      const newUser = await prisma.user.create({
        data: {},
        select: { id: true },
      });
      finalUserId = newUser.id;
      console.log('Created new user:', finalUserId);
    }

    // Upsert psychometric profile
    await prisma.psychometricProfile.upsert({
      where: { userId: finalUserId },
      create: {
        userId: finalUserId,
        ...psychometric,
        traitConfidence: Object.fromEntries(
          Object.entries(scoringResult.traits).map(([k, v]) => [k, v.confidence])
        ),
      },
      update: {
        ...psychometric,
        traitConfidence: Object.fromEntries(
          Object.entries(scoringResult.traits).map(([k, v]) => [k, v.confidence])
        ),
      },
    });

    // Upsert aesthetic preferences
    await prisma.aestheticPreference.upsert({
      where: { userId: finalUserId },
      create: {
        userId: finalUserId,
        ...aesthetic,
      },
      update: aesthetic,
    });

    // Compute constellation profile
    const { profile, result, enhanced } = computeConstellationProfile(
      psychometric,
      aesthetic
    );

    // Upsert constellation profile
    await prisma.constellationProfile.upsert({
      where: { userId: finalUserId },
      create: {
        userId: finalUserId,
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

    // Update quiz session if provided
    if (sessionId) {
      await prisma.quizSession.update({
        where: { id: sessionId },
        data: {
          userId: finalUserId,
          status: 'completed',
          scoringResult: {
            psychometric,
            aesthetic,
            constellation: profile,
          },
        },
      }).catch(() => {
        // Session might not exist, ignore error
        console.log('Quiz session not found:', sessionId);
      });
    }

    // Save to profile history
    await prisma.profileHistory.create({
      data: {
        userId: finalUserId,
        profileType: 'constellation',
        profileData: {
          psychometric,
          aesthetic,
          constellation: profile,
        },
        trigger: 'quiz_complete',
      },
    });

    console.log('Quiz results saved successfully for user:', finalUserId);

    return NextResponse.json({
      success: true,
      userId: finalUserId,
      constellation: profile.primaryConstellationId,
      confidence: scoringResult.overallConfidence,
      reliability: scoringResult.reliability,
      result,
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', errorMessage, errorStack);
    return NextResponse.json(
      { error: 'Failed to process quiz', details: errorMessage, stack: errorStack },
      { status: 500 }
    );
  }
}

/**
 * GET /api/quiz?sessionId=xxx
 *
 * Get quiz session status and progress
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Quiz session fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
