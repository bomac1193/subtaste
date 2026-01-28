import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCalculateSCP,
  getClassificationColor,
  getClassificationLabel,
} from '@/lib/scp';

/**
 * GET /api/scp?userId=xxx&creatorId=yyy
 *
 * Get SCP score for a user-creator pair.
 * Returns cached score if available and fresh, otherwise calculates new score.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const creatorId = searchParams.get('creatorId');
    const forceRecalculate = searchParams.get('refresh') === 'true';

    if (!userId || !creatorId) {
      return NextResponse.json(
        { error: 'Both userId and creatorId are required' },
        { status: 400 }
      );
    }

    const result = await getOrCalculateSCP(userId, creatorId, forceRecalculate);

    // Determine classification
    let classification: 'superfan' | 'high_potential' | 'moderate' | 'low';
    if (result.scpScore >= 75) classification = 'superfan';
    else if (result.scpScore >= 50) classification = 'high_potential';
    else if (result.scpScore >= 25) classification = 'moderate';
    else classification = 'low';

    return NextResponse.json({
      userId,
      creatorId,
      scpScore: result.scpScore,
      components: {
        tasteCoherence: result.tasteCoherence,
        depthSignalScore: result.depthSignalScore,
        returnPatternScore: result.returnPatternScore,
      },
      signalCount: result.signalCount,
      lastSignalAt: result.lastSignalAt,
      classification,
      classificationLabel: getClassificationLabel(classification),
      classificationColor: getClassificationColor(classification),
      cached: result.cached,
      breakdown: 'breakdown' in result ? result.breakdown : undefined,
    });
  } catch (error) {
    console.error('SCP fetch error:', error);

    if (error instanceof Error && error.message === 'User or creator not found') {
      return NextResponse.json(
        { error: 'User or creator not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch SCP score' },
      { status: 500 }
    );
  }
}
