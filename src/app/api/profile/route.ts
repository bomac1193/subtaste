import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeConstellationProfile } from '@/lib/scoring';
import { exportAestheticProfile } from '@/lib/profile-export';

/**
 * GET /api/profile?userId=xxx
 *
 * Fetch user's complete profile including all layers.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const format = searchParams.get('format'); // 'full' | 'export' | 'summary'

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch all profile data in parallel
    const [psychometric, aesthetic, constellation] = await Promise.all([
      prisma.psychometricProfile.findUnique({
        where: { userId },
      }),
      prisma.aestheticPreference.findUnique({
        where: { userId },
      }),
      prisma.constellationProfile.findUnique({
        where: { userId },
      }),
    ]);

    // RepresentationProfile not yet implemented
    const representation = null;

    // Return based on format
    if (format === 'summary') {
      return NextResponse.json({
        userId: user.id,
        constellation: constellation?.primaryConstellationId,
        subtasteIndex: constellation?.subtasteIndex,
        explorerScore: constellation?.explorerScore,
        earlyAdopterScore: constellation?.earlyAdopterScore,
      });
    }

    if (format === 'export' && psychometric && aesthetic && constellation) {
      // Generate machine-readable export
      const psychometricInput = {
        openness: psychometric.openness,
        conscientiousness: psychometric.conscientiousness,
        extraversion: psychometric.extraversion,
        agreeableness: psychometric.agreeableness,
        neuroticism: psychometric.neuroticism,
        noveltySeeking: psychometric.noveltySeeking,
        aestheticSensitivity: psychometric.aestheticSensitivity,
        riskTolerance: psychometric.riskTolerance,
      };

      const aestheticInput = {
        colorPaletteVector: aesthetic.colorPaletteVector ?? [],
        darknessPreference: aesthetic.darknessPreference,
        complexityPreference: aesthetic.complexityPreference,
        symmetryPreference: aesthetic.symmetryPreference,
        organicVsSynthetic: aesthetic.organicVsSynthetic,
        minimalVsMaximal: aesthetic.minimalVsMaximal,
        tempoRangeMin: aesthetic.tempoRangeMin,
        tempoRangeMax: aesthetic.tempoRangeMax,
        energyRangeMin: aesthetic.energyRangeMin,
        energyRangeMax: aesthetic.energyRangeMax,
        harmonicDissonanceTolerance: aesthetic.harmonicDissonanceTolerance,
        rhythmPreference: aesthetic.rhythmPreference,
        acousticVsDigital: aesthetic.acousticVsDigital,
      };

      // Recompute for export
      const computed = computeConstellationProfile(psychometricInput, aestheticInput);
      const exported = exportAestheticProfile(
        computed,
        psychometricInput,
        aestheticInput,
        representation ? {
          energy: representation.energy,
          complexity: representation.complexity,
          temporalStyle: representation.temporalStyle,
          sensoryDensity: representation.sensoryDensity,
          identityProjection: representation.identityProjection,
          ambiguityTolerance: representation.ambiguityTolerance,
          version: representation.version,
        } : undefined
      );

      return NextResponse.json(exported);
    }

    // Full profile (default)
    return NextResponse.json({
      user,
      psychometric,
      aesthetic,
      constellation,
      representation,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile
 *
 * Recompute constellation profile with latest data.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch current profiles
    const [psychometric, aesthetic] = await Promise.all([
      prisma.psychometricProfile.findUnique({
        where: { userId },
      }),
      prisma.aestheticPreference.findUnique({
        where: { userId },
      }),
    ]);

    if (!psychometric || !aesthetic) {
      return NextResponse.json(
        { error: 'User profile incomplete' },
        { status: 400 }
      );
    }

    // Convert to input format
    const psychometricInput = {
      openness: psychometric.openness,
      conscientiousness: psychometric.conscientiousness,
      extraversion: psychometric.extraversion,
      agreeableness: psychometric.agreeableness,
      neuroticism: psychometric.neuroticism,
      noveltySeeking: psychometric.noveltySeeking,
      aestheticSensitivity: psychometric.aestheticSensitivity,
      riskTolerance: psychometric.riskTolerance,
    };

    const aestheticInput = {
      colorPaletteVector: aesthetic.colorPaletteVector,
      darknessPreference: aesthetic.darknessPreference,
      complexityPreference: aesthetic.complexityPreference,
      symmetryPreference: aesthetic.symmetryPreference,
      organicVsSynthetic: aesthetic.organicVsSynthetic,
      minimalVsMaximal: aesthetic.minimalVsMaximal,
      tempoRangeMin: aesthetic.tempoRangeMin,
      tempoRangeMax: aesthetic.tempoRangeMax,
      energyRangeMin: aesthetic.energyRangeMin,
      energyRangeMax: aesthetic.energyRangeMax,
      harmonicDissonanceTolerance: aesthetic.harmonicDissonanceTolerance,
      rhythmPreference: aesthetic.rhythmPreference,
      acousticVsDigital: aesthetic.acousticVsDigital,
    };

    // Aggregate interactions for behavioral input
    const interactions = await prisma.userContentInteraction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const interactionsSummary = aggregateInteractions(interactions);

    // Recompute profile
    const { profile, result, enhanced } = computeConstellationProfile(
      psychometricInput,
      aestheticInput,
      interactionsSummary
    );

    // Update constellation profile
    await prisma.constellationProfile.upsert({
      where: { userId },
      create: {
        userId,
        primaryConstellationId: profile.primaryConstellationId,
        blendWeights: profile.blendWeights,
        subtasteIndex: profile.subtasteIndex,
        explorerScore: profile.explorerScore,
        earlyAdopterScore: profile.earlyAdopterScore,
        enhancedInterpretation: enhanced ?? null,
      },
      update: {
        primaryConstellationId: profile.primaryConstellationId,
        blendWeights: profile.blendWeights,
        subtasteIndex: profile.subtasteIndex,
        explorerScore: profile.explorerScore,
        earlyAdopterScore: profile.earlyAdopterScore,
        enhancedInterpretation: enhanced ?? null,
      },
    });

    // Save to history
    await prisma.profileHistory.create({
      data: {
        userId,
        profileType: 'constellation',
        profileData: { constellation: profile },
        trigger: 'manual_update',
      },
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Profile recomputation error:', error);
    return NextResponse.json(
      { error: 'Failed to recompute profile' },
      { status: 500 }
    );
  }
}

/**
 * Aggregate interactions into summary stats
 */
function aggregateInteractions(interactions: Array<{
  interactionType: string;
  dwellTimeMs: number | null;
}>) {
  if (interactions.length === 0) {
    return {
      dominantColors: [],
      preferredDarkness: 0.5,
      preferredComplexity: 0.5,
      preferredTempoRange: [80, 140] as [number, number],
      preferredEnergyRange: [0.3, 0.7] as [number, number],
      dominantMoods: [],
      favoriteTags: [],
      favoriteScenes: [],
      totalInteractions: 0,
      likeRatio: 0.5,
      avgDwellTimeMs: 0,
      contentDiversity: 0.5,
    };
  }

  const likes = interactions.filter((i) =>
    ['like', 'save', 'share'].includes(i.interactionType)
  ).length;

  const dwellTimes = interactions
    .map((i) => i.dwellTimeMs)
    .filter((t): t is number => t !== null);

  return {
    dominantColors: [],
    preferredDarkness: 0.5,
    preferredComplexity: 0.5,
    preferredTempoRange: [80, 140] as [number, number],
    preferredEnergyRange: [0.3, 0.7] as [number, number],
    dominantMoods: [],
    favoriteTags: [],
    favoriteScenes: [],
    totalInteractions: interactions.length,
    likeRatio: likes / interactions.length,
    avgDwellTimeMs: dwellTimes.length > 0
      ? dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length
      : 0,
    contentDiversity: 0.5,
  };
}
