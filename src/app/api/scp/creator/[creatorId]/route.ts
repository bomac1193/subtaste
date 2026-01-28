import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCreatorDashboardStats, getOrCalculateSCP } from '@/lib/scp';

interface RouteContext {
  params: Promise<{ creatorId: string }>;
}

/**
 * GET /api/scp/creator/[creatorId]
 *
 * Get creator dashboard stats including superfan distribution,
 * top signal types, and aggregate metrics.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { creatorId } = await context.params;

    // Verify creator exists
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        name: true,
        slug: true,
        avatarUrl: true,
        totalListeners: true,
        superfanCount: true,
        avgSCP: true,
      },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Get detailed dashboard stats
    const stats = await getCreatorDashboardStats(creatorId);

    return NextResponse.json({
      creator: {
        id: creator.id,
        name: creator.name,
        slug: creator.slug,
        avatarUrl: creator.avatarUrl,
      },
      stats,
    });
  } catch (error) {
    console.error('Creator dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creator dashboard' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scp/creator/[creatorId]/listeners
 *
 * Get list of listeners with their SCP scores for the creator.
 * Supports pagination and filtering.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { creatorId } = await context.params;
    const body = await request.json();
    const {
      page = 1,
      limit = 20,
      classification, // Filter by classification
      sortBy = 'scpScore',
      sortOrder = 'desc',
    } = body;

    // Build where clause
    const where: Record<string, unknown> = { creatorId };

    if (classification) {
      // Map classification to score range
      const ranges: Record<string, { gte?: number; lt?: number }> = {
        superfan: { gte: 75 },
        high_potential: { gte: 50, lt: 75 },
        moderate: { gte: 25, lt: 50 },
        low: { lt: 25 },
      };

      if (ranges[classification]) {
        where.scpScore = ranges[classification];
      }
    }

    // Get total count
    const total = await prisma.superfanScore.count({ where });

    // Get paginated results
    const scores = await prisma.superfanScore.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Map to response format
    const listeners = scores.map((score) => ({
      userId: score.userId,
      displayName: score.user.displayName,
      avatarUrl: score.user.avatarUrl,
      scpScore: score.scpScore,
      tasteCoherence: score.tasteCoherence,
      depthSignalScore: score.depthSignalScore,
      returnPatternScore: score.returnPatternScore,
      signalCount: score.signalCount,
      lastSignalAt: score.lastSignalAt,
      classification:
        score.scpScore >= 75
          ? 'superfan'
          : score.scpScore >= 50
          ? 'high_potential'
          : score.scpScore >= 25
          ? 'moderate'
          : 'low',
    }));

    return NextResponse.json({
      listeners,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Creator listeners error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creator listeners' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/scp/creator/[creatorId]
 *
 * Recalculate SCP scores for all listeners of a creator.
 * Useful for batch refresh after creator profile update.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { creatorId } = await context.params;

    // Get all user-creator pairs that need recalculation
    const existingScores = await prisma.superfanScore.findMany({
      where: { creatorId },
      select: { userId: true },
    });

    // Recalculate each score (in batches to avoid overload)
    const batchSize = 10;
    let recalculated = 0;

    for (let i = 0; i < existingScores.length; i += batchSize) {
      const batch = existingScores.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async ({ userId }) => {
          await getOrCalculateSCP(userId, creatorId, true);
          recalculated++;
        })
      );
    }

    // Update creator aggregate stats
    const stats = await getCreatorDashboardStats(creatorId);

    await prisma.creator.update({
      where: { id: creatorId },
      data: {
        totalListeners: stats.totalListeners,
        superfanCount: stats.superfanCount,
        avgSCP: stats.avgSCP,
      },
    });

    return NextResponse.json({
      success: true,
      recalculated,
      stats,
    });
  } catch (error) {
    console.error('Creator recalculation error:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate SCP scores' },
      { status: 500 }
    );
  }
}
