/**
 * Depth Signal Tracker
 *
 * Functions for tracking depth signals and sessions that feed into
 * the SCP calculation. Also handles cache invalidation when new
 * signals are received.
 */

import { prisma } from '../prisma';
import {
  SignalType,
  SessionSource,
  SIGNAL_WEIGHTS,
  TrackSignalPayload,
  TrackSessionPayload,
} from './types';
import { calculateSCP } from './calculator';

// =============================================================================
// Signal Tracking
// =============================================================================

/**
 * Track a depth signal for a user-creator pair.
 *
 * This creates a new depth signal record and invalidates the cached
 * SCP score so it will be recalculated on next request.
 *
 * @param payload - Signal tracking data
 * @returns The created depth signal
 */
export async function trackDepthSignal(payload: TrackSignalPayload) {
  const { userId, creatorId, type, contentId, metadata } = payload;

  // Get the weight for this signal type
  const weight = SIGNAL_WEIGHTS[type];

  // Create the depth signal
  const signal = await prisma.depthSignal.create({
    data: {
      userId,
      creatorId,
      type,
      weight,
      contentId,
      metadata: metadata ?? undefined,
    },
  });

  // Invalidate cached SCP score by updating the lastCalculatedAt to a past date
  // This ensures the score will be recalculated on next fetch
  await prisma.superfanScore.updateMany({
    where: {
      userId,
      creatorId,
    },
    data: {
      lastCalculatedAt: new Date(0), // Set to epoch to force recalculation
    },
  });

  return signal;
}

/**
 * Track multiple depth signals in a batch.
 *
 * @param signals - Array of signal payloads
 * @returns Count of created signals
 */
export async function trackDepthSignalBatch(signals: TrackSignalPayload[]) {
  if (signals.length === 0) return { count: 0 };

  // Create all signals
  const result = await prisma.depthSignal.createMany({
    data: signals.map((s) => ({
      userId: s.userId,
      creatorId: s.creatorId,
      type: s.type,
      weight: SIGNAL_WEIGHTS[s.type],
      contentId: s.contentId,
      metadata: s.metadata ?? undefined,
    })),
  });

  // Invalidate cached scores for all affected user-creator pairs
  const uniquePairs = [...new Set(signals.map((s) => `${s.userId}:${s.creatorId}`))];

  for (const pair of uniquePairs) {
    const [userId, creatorId] = pair.split(':');
    await prisma.superfanScore.updateMany({
      where: { userId, creatorId },
      data: { lastCalculatedAt: new Date(0) },
    });
  }

  return { count: result.count };
}

// =============================================================================
// Catalog Deep Dive Detection
// =============================================================================

/**
 * Check if a user has done a catalog deep dive.
 *
 * A catalog deep dive is when a user explores 5+ tracks from the same
 * creator within a 24-hour window. This is a strong signal of interest.
 *
 * @param userId - User ID
 * @param creatorId - Creator ID
 * @returns Whether a catalog deep dive occurred
 */
export async function checkCatalogDeepDive(
  userId: string,
  creatorId: string
): Promise<boolean> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Count unique content interactions with this creator in last 24 hours
  const interactions = await prisma.userContentInteraction.findMany({
    where: {
      userId,
      content: {
        creatorId,
      },
      createdAt: {
        gte: twentyFourHoursAgo,
      },
      interactionType: {
        in: ['view', 'like', 'save'],
      },
    },
    select: {
      contentId: true,
    },
    distinct: ['contentId'],
  });

  const uniqueContentCount = interactions.length;

  // 5+ unique content items = catalog deep dive
  if (uniqueContentCount >= 5) {
    // Check if we already tracked this signal today
    const existingSignal = await prisma.depthSignal.findFirst({
      where: {
        userId,
        creatorId,
        type: 'CATALOG_DEEP_DIVE',
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
    });

    if (!existingSignal) {
      // Track the catalog deep dive signal
      await trackDepthSignal({
        userId,
        creatorId,
        type: 'CATALOG_DEEP_DIVE',
        metadata: { uniqueContentCount },
      });
      return true;
    }
  }

  return false;
}

// =============================================================================
// Session Tracking
// =============================================================================

/**
 * Track a session start.
 *
 * @param payload - Session tracking data
 * @returns The created session
 */
export async function trackSession(payload: TrackSessionPayload) {
  const { userId, creatorId, source, startedAt } = payload;

  const session = await prisma.session.create({
    data: {
      userId,
      creatorId,
      source,
      startedAt: startedAt ?? new Date(),
    },
  });

  // If this is an organic return, also track it as a depth signal
  if (source === 'ORGANIC' && creatorId) {
    await trackDepthSignal({
      userId,
      creatorId,
      type: 'UNPROMPTED_RETURN',
    });
  }

  return session;
}

/**
 * End a session and update its duration.
 *
 * @param sessionId - Session ID
 * @returns Updated session
 */
export async function endSession(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!session) return null;

  const endedAt = new Date();
  const durationMs = endedAt.getTime() - session.startedAt.getTime();

  return prisma.session.update({
    where: { id: sessionId },
    data: {
      endedAt,
      durationMs,
    },
  });
}

// =============================================================================
// SCP Score Management
// =============================================================================

/**
 * Get or calculate SCP score for a user-creator pair.
 *
 * If a cached score exists and is fresh, returns it.
 * Otherwise, calculates a new score and caches it.
 *
 * @param userId - User ID
 * @param creatorId - Creator ID
 * @param forceRecalculate - Force recalculation even if cache is fresh
 * @returns SCP calculation output
 */
export async function getOrCalculateSCP(
  userId: string,
  creatorId: string,
  forceRecalculate: boolean = false
) {
  // Check for existing score
  const existingScore = await prisma.superfanScore.findUnique({
    where: {
      userId_creatorId: {
        userId,
        creatorId,
      },
    },
  });

  // Use cached score if fresh (less than 7 days old) and not forcing recalculation
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (
    existingScore &&
    !forceRecalculate &&
    existingScore.lastCalculatedAt > sevenDaysAgo
  ) {
    return {
      scpScore: existingScore.scpScore,
      tasteCoherence: existingScore.tasteCoherence,
      depthSignalScore: existingScore.depthSignalScore,
      returnPatternScore: existingScore.returnPatternScore,
      signalCount: existingScore.signalCount,
      lastSignalAt: existingScore.lastSignalAt,
      cached: true,
    };
  }

  // Fetch data for calculation
  const [user, creator, depthSignals, sessions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { constellationProfile: true },
    }),
    prisma.creator.findUnique({
      where: { id: creatorId },
    }),
    prisma.depthSignal.findMany({
      where: { userId, creatorId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.session.findMany({
      where: { userId, creatorId },
      orderBy: { startedAt: 'desc' },
    }),
  ]);

  if (!user || !creator) {
    throw new Error('User or creator not found');
  }

  // Get constellation weights
  const userConstellationWeights = (user.constellationProfile?.blendWeights ?? {}) as Record<string, number>;
  const creatorConstellationWeights = (creator.constellationWeights ?? {}) as Record<string, number>;

  // Calculate SCP
  const result = calculateSCP({
    userId,
    creatorId,
    userConstellationWeights,
    creatorConstellationWeights,
    depthSignals: depthSignals.map((s) => ({
      type: s.type as SignalType,
      weight: s.weight,
      createdAt: s.createdAt,
      contentId: s.contentId ?? undefined,
    })),
    sessions: sessions.map((s) => ({
      source: s.source as SessionSource,
      startedAt: s.startedAt,
      durationMs: s.durationMs ?? undefined,
    })),
  });

  // Cache the result
  await prisma.superfanScore.upsert({
    where: {
      userId_creatorId: {
        userId,
        creatorId,
      },
    },
    create: {
      userId,
      creatorId,
      tasteCoherence: result.tasteCoherence,
      depthSignalScore: result.depthSignalScore,
      returnPatternScore: result.returnPatternScore,
      scpScore: result.scpScore,
      signalCount: result.signalCount,
      lastSignalAt: result.lastSignalAt,
      lastCalculatedAt: new Date(),
    },
    update: {
      tasteCoherence: result.tasteCoherence,
      depthSignalScore: result.depthSignalScore,
      returnPatternScore: result.returnPatternScore,
      scpScore: result.scpScore,
      signalCount: result.signalCount,
      lastSignalAt: result.lastSignalAt,
      lastCalculatedAt: new Date(),
    },
  });

  return {
    ...result,
    cached: false,
  };
}

// =============================================================================
// Creator Stats
// =============================================================================

/**
 * Get creator dashboard stats.
 *
 * @param creatorId - Creator ID
 * @returns Dashboard stats
 */
export async function getCreatorDashboardStats(creatorId: string) {
  // Get all superfan scores for this creator
  const scores = await prisma.superfanScore.findMany({
    where: { creatorId },
    orderBy: { scpScore: 'desc' },
  });

  // Calculate distribution
  const distribution = {
    superfan: 0,
    highPotential: 0,
    moderate: 0,
    low: 0,
  };

  for (const score of scores) {
    if (score.scpScore >= 75) distribution.superfan++;
    else if (score.scpScore >= 50) distribution.highPotential++;
    else if (score.scpScore >= 25) distribution.moderate++;
    else distribution.low++;
  }

  // Get signal type distribution
  const signalCounts = await prisma.depthSignal.groupBy({
    by: ['type'],
    where: { creatorId },
    _count: { type: true },
    orderBy: { _count: { type: 'desc' } },
  });

  const totalSignals = signalCounts.reduce((sum, s) => sum + s._count.type, 0);

  const topSignalTypes = signalCounts.slice(0, 5).map((s) => ({
    type: s.type as SignalType,
    count: s._count.type,
    percentage: Math.round((s._count.type / totalSignals) * 100),
  }));

  // Calculate averages
  const avgSCP =
    scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.scpScore, 0) / scores.length)
      : 0;

  return {
    creatorId,
    totalListeners: scores.length,
    superfanCount: distribution.superfan,
    avgSCP,
    distribution,
    topSignalTypes,
    trendingUp: 0, // Would require historical data to calculate
    trendingDown: 0,
  };
}

/**
 * Update creator aggregate stats.
 *
 * Called after SCP recalculation to keep creator stats in sync.
 *
 * @param creatorId - Creator ID
 */
export async function updateCreatorStats(creatorId: string) {
  const stats = await getCreatorDashboardStats(creatorId);

  await prisma.creator.update({
    where: { id: creatorId },
    data: {
      totalListeners: stats.totalListeners,
      superfanCount: stats.superfanCount,
      avgSCP: stats.avgSCP,
    },
  });
}
