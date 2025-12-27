import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type {
  User,
  PsychometricProfile,
  AestheticPreference,
  ConstellationProfile,
  RepresentationProfile,
} from '@/lib/supabase';
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

    const supabase = createAdminClient();

    // Fetch user with all profiles
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userData as User;

    // Fetch all profile data in parallel
    const [psychResult, aestheticResult, constResult, repResult] = await Promise.all([
      supabase
        .from('psychometric_profiles')
        .select('*')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('aesthetic_preferences')
        .select('*')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('constellation_profiles')
        .select('*')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('representation_profiles')
        .select('*')
        .eq('user_id', userId)
        .single(),
    ]);

    const psychometric = psychResult.data as PsychometricProfile | null;
    const aesthetic = aestheticResult.data as AestheticPreference | null;
    const constellation = constResult.data as ConstellationProfile | null;
    const representation = repResult.data as RepresentationProfile | null;

    // Return based on format
    if (format === 'summary') {
      return NextResponse.json({
        userId: user.id,
        constellation: constellation?.primary_constellation_id,
        subtasteIndex: constellation?.subtaste_index,
        explorerScore: constellation?.explorer_score,
        earlyAdopterScore: constellation?.early_adopter_score,
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
        noveltySeeking: psychometric.novelty_seeking,
        aestheticSensitivity: psychometric.aesthetic_sensitivity,
        riskTolerance: psychometric.risk_tolerance,
      };

      const aestheticInput = {
        colorPaletteVector: aesthetic.color_palette_vector ?? [],
        darknessPreference: aesthetic.darkness_preference,
        complexityPreference: aesthetic.complexity_preference,
        symmetryPreference: aesthetic.symmetry_preference,
        organicVsSynthetic: aesthetic.organic_vs_synthetic,
        minimalVsMaximal: aesthetic.minimal_vs_maximal,
        tempoRangeMin: aesthetic.tempo_range_min,
        tempoRangeMax: aesthetic.tempo_range_max,
        energyRangeMin: aesthetic.energy_range_min,
        energyRangeMax: aesthetic.energy_range_max,
        harmonicDissonanceTolerance: aesthetic.harmonic_dissonance_tolerance,
        rhythmPreference: aesthetic.rhythm_preference,
        acousticVsDigital: aesthetic.acoustic_vs_digital,
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
          temporalStyle: representation.temporal_style,
          sensoryDensity: representation.sensory_density,
          identityProjection: representation.identity_projection,
          ambiguityTolerance: representation.ambiguity_tolerance,
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

    const supabase = createAdminClient();

    // Fetch current profiles
    const [psychResult, aestheticResult] = await Promise.all([
      supabase
        .from('psychometric_profiles')
        .select('*')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('aesthetic_preferences')
        .select('*')
        .eq('user_id', userId)
        .single(),
    ]);

    const psychometric = psychResult.data as PsychometricProfile | null;
    const aesthetic = aestheticResult.data as AestheticPreference | null;

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
      noveltySeeking: psychometric.novelty_seeking,
      aestheticSensitivity: psychometric.aesthetic_sensitivity,
      riskTolerance: psychometric.risk_tolerance,
    };

    const aestheticInput = {
      colorPaletteVector: aesthetic.color_palette_vector,
      darknessPreference: aesthetic.darkness_preference,
      complexityPreference: aesthetic.complexity_preference,
      symmetryPreference: aesthetic.symmetry_preference,
      organicVsSynthetic: aesthetic.organic_vs_synthetic,
      minimalVsMaximal: aesthetic.minimal_vs_maximal,
      tempoRangeMin: aesthetic.tempo_range_min,
      tempoRangeMax: aesthetic.tempo_range_max,
      energyRangeMin: aesthetic.energy_range_min,
      energyRangeMax: aesthetic.energy_range_max,
      harmonicDissonanceTolerance: aesthetic.harmonic_dissonance_tolerance,
      rhythmPreference: aesthetic.rhythm_preference,
      acousticVsDigital: aesthetic.acoustic_vs_digital,
    };

    // Aggregate interactions for behavioral input
    const { data: interactions } = await supabase
      .from('user_content_interactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    const interactionsSummary = aggregateInteractions(interactions ?? []);

    // Recompute profile
    const { profile, result, enhanced } = computeConstellationProfile(
      psychometricInput,
      aestheticInput,
      interactionsSummary
    );

    // Update constellation profile
    const { error: updateError } = await supabase
      .from('constellation_profiles')
      .upsert(
        {
          user_id: userId,
          primary_constellation_id: profile.primaryConstellationId,
          blend_weights: profile.blendWeights,
          subtaste_index: profile.subtasteIndex,
          explorer_score: profile.explorerScore,
          early_adopter_score: profile.earlyAdopterScore,
          enhanced_interpretation: enhanced ?? null,
        },
        { onConflict: 'user_id' }
      );

    if (updateError) throw updateError;

    // Save to history
    await supabase.from('profile_history').insert({
      user_id: userId,
      profile_type: 'constellation',
      profile_data: { constellation: profile },
      trigger: 'manual_update',
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
  interaction_type: string;
  dwell_time_ms: number | null;
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
    ['like', 'save', 'share'].includes(i.interaction_type)
  ).length;

  const dwellTimes = interactions
    .map((i) => i.dwell_time_ms)
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
