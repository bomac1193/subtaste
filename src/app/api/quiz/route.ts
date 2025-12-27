import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { User, QuizSession } from '@/lib/supabase';
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
    novelty_seeking: traits.noveltySeeking?.score ?? 0.5,
    aesthetic_sensitivity: traits.aestheticSensitivity?.score ?? 0.5,
    risk_tolerance: traits.riskTolerance?.score ?? 0.5,
  };
}

/**
 * Convert aesthetic to DB format (snake_case)
 */
function convertToAestheticPreference(aesthetic: ScoringResult['aesthetic']) {
  return {
    color_palette_vector: aesthetic.colorPaletteVector ?? [],
    darkness_preference: aesthetic.darknessPreference,
    complexity_preference: aesthetic.complexityPreference,
    symmetry_preference: aesthetic.symmetryPreference,
    organic_vs_synthetic: aesthetic.organicVsSynthetic,
    minimal_vs_maximal: aesthetic.minimalVsMaximal,
    tempo_range_min: aesthetic.tempoRangeMin,
    tempo_range_max: aesthetic.tempoRangeMax,
    energy_range_min: aesthetic.energyRangeMin,
    energy_range_max: aesthetic.energyRangeMax,
    harmonic_dissonance_tolerance: aesthetic.harmonicDissonanceTolerance,
    rhythm_preference: aesthetic.rhythmPreference,
    acoustic_vs_digital: aesthetic.acousticVsDigital,
  };
}

/**
 * POST /api/quiz
 *
 * Submit quiz results and compute constellation profile.
 * Creates or updates user profile in Supabase.
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

    const supabase = createAdminClient();

    // Convert scoring result to DB formats
    const psychometric = convertToPsychometricProfile(scoringResult.traits);
    const aesthetic = convertToAestheticPreference(scoringResult.aesthetic);

    // Create or get user
    let finalUserId = userId;

    if (!finalUserId) {
      // Create new anonymous user
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({})
        .select('id')
        .single();

      if (userError) throw userError;
      finalUserId = (newUser as Pick<User, 'id'>).id;
    }

    // Upsert psychometric profile
    const { error: psychError } = await supabase
      .from('psychometric_profiles')
      .upsert(
        {
          user_id: finalUserId,
          ...psychometric,
          trait_confidence: Object.fromEntries(
            Object.entries(scoringResult.traits).map(([k, v]) => [k, v.confidence])
          ),
          overall_confidence: scoringResult.overallConfidence,
        },
        { onConflict: 'user_id' }
      );

    if (psychError) throw psychError;

    // Upsert aesthetic preferences
    const { error: aestheticError } = await supabase
      .from('aesthetic_preferences')
      .upsert(
        {
          user_id: finalUserId,
          ...aesthetic,
        },
        { onConflict: 'user_id' }
      );

    if (aestheticError) throw aestheticError;

    // Compute constellation profile
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

    const { profile, result, enhanced } = computeConstellationProfile(
      psychometricInput,
      aestheticInput
    );

    // Upsert constellation profile
    const { error: constError } = await supabase
      .from('constellation_profiles')
      .upsert(
        {
          user_id: finalUserId,
          primary_constellation_id: profile.primaryConstellationId,
          blend_weights: profile.blendWeights,
          subtaste_index: profile.subtasteIndex,
          explorer_score: profile.explorerScore,
          early_adopter_score: profile.earlyAdopterScore,
          enhanced_interpretation: enhanced ?? null,
        },
        { onConflict: 'user_id' }
      );

    if (constError) throw constError;

    // Update quiz session if provided
    if (sessionId) {
      await supabase
        .from('quiz_sessions')
        .update({
          user_id: finalUserId,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    }

    // Save to profile history
    await supabase.from('profile_history').insert({
      user_id: finalUserId,
      profile_type: 'constellation',
      profile_data: {
        psychometric: psychometricInput,
        aesthetic: aestheticInput,
        constellation: profile,
      },
      trigger: 'quiz_complete',
    });

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
    return NextResponse.json(
      { error: 'Failed to process quiz', details: String(error) },
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

    const supabase = createAdminClient();

    const { data: session, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
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
