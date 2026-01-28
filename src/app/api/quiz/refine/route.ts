import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ArchetypeId, ARCHETYPE_IDS } from '@/lib/archetypes/types';
import { EnneagramType, ENNEAGRAM_TYPES } from '@/lib/enneagram/types';

/**
 * Refinement adjustments from the RefinementQuiz component
 */
interface RefinementResult {
  archetypeAdjustments: Partial<Record<ArchetypeId, number>>;
  enneagramAdjustments: Partial<Record<EnneagramType, number>>;
  traitAdjustments: Partial<Record<string, number>>;
  confidence: number;
}

/**
 * POST /api/quiz/refine
 *
 * Apply refinement adjustments to user's profile based on
 * targeted disambiguation questions.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, refinementResult } = body as {
      userId: string;
      refinementResult: RefinementResult;
    };

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    if (!refinementResult) {
      return NextResponse.json(
        { error: 'Refinement result required' },
        { status: 400 }
      );
    }

    // Fetch current profiles
    const [psychProfile, constProfile] = await Promise.all([
      prisma.psychometricProfile.findUnique({
        where: { userId },
      }),
      prisma.constellationProfile.findUnique({
        where: { userId },
      }),
    ]);

    if (!psychProfile) {
      return NextResponse.json(
        { error: 'Psychometric profile not found' },
        { status: 404 }
      );
    }

    if (!constProfile) {
      return NextResponse.json(
        { error: 'Constellation profile not found' },
        { status: 404 }
      );
    }

    // Apply trait adjustments to psychometric profile
    const traitUpdates: Record<string, number> = {};
    const traitMapping: Record<string, keyof typeof psychProfile> = {
      openness: 'openness',
      conscientiousness: 'conscientiousness',
      extraversion: 'extraversion',
      agreeableness: 'agreeableness',
      neuroticism: 'neuroticism',
      noveltySeeking: 'noveltySeeking',
      aestheticSensitivity: 'aestheticSensitivity',
      riskTolerance: 'riskTolerance',
    };

    for (const [trait, adjustment] of Object.entries(refinementResult.traitAdjustments)) {
      const dbField = traitMapping[trait];
      if (dbField && psychProfile[dbField] !== undefined) {
        // Apply adjustment with clamping to 0-1
        const currentValue = psychProfile[dbField] as number;
        traitUpdates[dbField] = Math.max(0, Math.min(1, currentValue + (adjustment || 0)));
      }
    }

    // Update psychometric profile if there are trait adjustments
    if (Object.keys(traitUpdates).length > 0) {
      await prisma.psychometricProfile.update({
        where: { userId },
        data: {
          ...traitUpdates,
          overallConfidence: refinementResult.confidence,
        },
      });
    }

    // Apply archetype adjustments to constellation profile
    const currentBlendWeights = (constProfile.archetypeBlendWeights || {}) as Record<string, number>;
    const updatedBlendWeights = { ...currentBlendWeights };

    for (const [archetype, adjustment] of Object.entries(refinementResult.archetypeAdjustments)) {
      if (ARCHETYPE_IDS.includes(archetype as ArchetypeId)) {
        const current = updatedBlendWeights[archetype] || 0;
        updatedBlendWeights[archetype] = Math.max(0, Math.min(1, current + (adjustment || 0)));
      }
    }

    // Normalize blend weights to sum to 1
    const totalWeight = Object.values(updatedBlendWeights).reduce((sum, w) => sum + w, 0);
    if (totalWeight > 0) {
      for (const key of Object.keys(updatedBlendWeights)) {
        updatedBlendWeights[key] /= totalWeight;
      }
    }

    // Determine new primary archetype if weights changed significantly
    let newPrimaryArchetype = constProfile.primaryArchetypeId;
    if (Object.keys(refinementResult.archetypeAdjustments).length > 0) {
      const maxEntry = Object.entries(updatedBlendWeights).reduce(
        (max, [k, v]) => (v > max[1] ? [k, v] : max),
        ['', 0] as [string, number]
      );
      if (maxEntry[0] && ARCHETYPE_IDS.includes(maxEntry[0] as ArchetypeId)) {
        newPrimaryArchetype = maxEntry[0];
      }
    }

    // Apply Enneagram adjustments (stored in psychometric profile)
    const currentEnneagramScores = (psychProfile.enneagramTypeScores || {}) as Record<string, number>;
    const updatedEnneagramScores = { ...currentEnneagramScores };

    for (const [type, adjustment] of Object.entries(refinementResult.enneagramAdjustments)) {
      const typeNum = parseInt(type);
      if (ENNEAGRAM_TYPES.includes(typeNum as EnneagramType)) {
        const typeKey = type.toString();
        const current = updatedEnneagramScores[typeKey] || 0.5;
        updatedEnneagramScores[typeKey] = Math.max(0, Math.min(1, current + (adjustment || 0)));
      }
    }

    // Determine new primary Enneagram
    let newPrimaryEnneagram = psychProfile.enneagramPrimary;
    if (Object.keys(refinementResult.enneagramAdjustments).length > 0) {
      const maxEntry = Object.entries(updatedEnneagramScores).reduce(
        (max, [k, v]) => (v > max[1] ? [k, v] : max),
        ['', 0] as [string, number]
      );
      if (maxEntry[0]) {
        newPrimaryEnneagram = parseInt(maxEntry[0]);
      }
    }

    // Update constellation profile with archetype changes
    await prisma.constellationProfile.update({
      where: { userId },
      data: {
        primaryArchetypeId: newPrimaryArchetype,
        archetypeBlendWeights: updatedBlendWeights,
      },
    });

    // Update psychometric profile with Enneagram changes
    if (Object.keys(refinementResult.enneagramAdjustments).length > 0) {
      await prisma.psychometricProfile.update({
        where: { userId },
        data: {
          enneagramPrimary: newPrimaryEnneagram,
          enneagramTypeScores: updatedEnneagramScores,
          enneagramConfidence: refinementResult.confidence,
        },
      });
    }

    // Save to profile history
    await prisma.profileHistory.create({
      data: {
        userId,
        profileType: 'refinement',
        profileData: {
          refinementResult,
          appliedAt: new Date().toISOString(),
          previousArchetype: constProfile.primaryArchetypeId,
          newArchetype: newPrimaryArchetype,
          previousEnneagram: psychProfile.enneagramPrimary,
          newEnneagram: newPrimaryEnneagram,
        },
        trigger: 'refinement_quiz',
      },
    });

    return NextResponse.json({
      success: true,
      userId,
      archetype: newPrimaryArchetype,
      archetypeBlend: updatedBlendWeights,
      enneagram: newPrimaryEnneagram,
      enneagramScores: updatedEnneagramScores,
      confidence: refinementResult.confidence,
    });
  } catch (error) {
    console.error('Refinement submission error:', error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { error: 'Failed to apply refinement', details: errorMessage },
      { status: 500 }
    );
  }
}
