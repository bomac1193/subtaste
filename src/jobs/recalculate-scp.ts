/**
 * SCP Recalculation Job
 *
 * Background job for nightly recalculation of stale SCP scores
 * and updating creator aggregate statistics.
 *
 * This job should be run via cron or a job scheduler.
 * Example cron: 0 2 * * * (daily at 2 AM)
 *
 * Usage:
 *   npx ts-node src/jobs/recalculate-scp.ts
 *   or
 *   node --import tsx src/jobs/recalculate-scp.ts
 */

import { prisma } from '../lib/prisma';
import { getOrCalculateSCP, updateCreatorStats, SCP_REQUIREMENTS } from '../lib/scp';

interface RecalculationStats {
  totalScores: number;
  staleScores: number;
  recalculated: number;
  errors: number;
  creatorsUpdated: number;
  duration: number;
}

/**
 * Main recalculation function.
 *
 * @param options - Configuration options
 * @returns Statistics about the recalculation run
 */
export async function recalculateStaleSCPScores(options: {
  batchSize?: number;
  staleDays?: number;
  dryRun?: boolean;
  verbose?: boolean;
} = {}): Promise<RecalculationStats> {
  const {
    batchSize = 50,
    staleDays = SCP_REQUIREMENTS.STALE_DAYS,
    dryRun = false,
    verbose = true,
  } = options;

  const startTime = Date.now();

  if (verbose) {
    console.log('='.repeat(60));
    console.log('SCP Recalculation Job Started');
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`Stale threshold: ${staleDays} days`);
    console.log(`Batch size: ${batchSize}`);
    console.log(`Dry run: ${dryRun}`);
    console.log('='.repeat(60));
  }

  // Calculate the cutoff date for stale scores
  const staleCutoff = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000);

  // Get total count of scores
  const totalScores = await prisma.superfanScore.count();

  // Get stale scores
  const staleScores = await prisma.superfanScore.findMany({
    where: {
      lastCalculatedAt: {
        lt: staleCutoff,
      },
    },
    select: {
      id: true,
      userId: true,
      creatorId: true,
      scpScore: true,
      lastCalculatedAt: true,
    },
    orderBy: {
      lastCalculatedAt: 'asc', // Process oldest first
    },
  });

  if (verbose) {
    console.log(`Total scores in database: ${totalScores}`);
    console.log(`Stale scores to recalculate: ${staleScores.length}`);
  }

  let recalculated = 0;
  let errors = 0;
  const affectedCreators = new Set<string>();

  // Process in batches
  for (let i = 0; i < staleScores.length; i += batchSize) {
    const batch = staleScores.slice(i, i + batchSize);

    if (verbose) {
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(staleScores.length / batchSize)}`);
    }

    // Process batch in parallel
    const results = await Promise.allSettled(
      batch.map(async (score) => {
        if (dryRun) {
          if (verbose) {
            console.log(`  [DRY RUN] Would recalculate: user=${score.userId}, creator=${score.creatorId}`);
          }
          return;
        }

        try {
          const result = await getOrCalculateSCP(score.userId, score.creatorId, true);
          affectedCreators.add(score.creatorId);

          if (verbose && Math.abs(result.scpScore - score.scpScore) >= 5) {
            console.log(`  Score changed: ${score.scpScore} -> ${result.scpScore} (user=${score.userId})`);
          }
        } catch (error) {
          throw new Error(`Failed to recalculate for user=${score.userId}, creator=${score.creatorId}: ${error}`);
        }
      })
    );

    // Count successes and failures
    for (const result of results) {
      if (result.status === 'fulfilled') {
        recalculated++;
      } else {
        errors++;
        if (verbose) {
          console.error(`  Error: ${result.reason}`);
        }
      }
    }

    // Small delay between batches to avoid overwhelming the database
    if (i + batchSize < staleScores.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Update creator aggregate stats
  if (verbose) {
    console.log(`\nUpdating ${affectedCreators.size} creator stats...`);
  }

  let creatorsUpdated = 0;
  for (const creatorId of affectedCreators) {
    if (dryRun) {
      if (verbose) {
        console.log(`  [DRY RUN] Would update stats for creator=${creatorId}`);
      }
      creatorsUpdated++;
      continue;
    }

    try {
      await updateCreatorStats(creatorId);
      creatorsUpdated++;
    } catch (error) {
      if (verbose) {
        console.error(`  Failed to update stats for creator=${creatorId}: ${error}`);
      }
    }
  }

  const duration = Date.now() - startTime;

  if (verbose) {
    console.log('\n' + '='.repeat(60));
    console.log('SCP Recalculation Job Completed');
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`Recalculated: ${recalculated}/${staleScores.length}`);
    console.log(`Errors: ${errors}`);
    console.log(`Creators updated: ${creatorsUpdated}`);
    console.log('='.repeat(60));
  }

  return {
    totalScores,
    staleScores: staleScores.length,
    recalculated,
    errors,
    creatorsUpdated,
    duration,
  };
}

/**
 * Recalculate all scores for a specific creator.
 * Useful when a creator updates their profile.
 */
export async function recalculateCreatorScores(
  creatorId: string,
  options: { verbose?: boolean } = {}
): Promise<{ recalculated: number; errors: number }> {
  const { verbose = true } = options;

  if (verbose) {
    console.log(`Recalculating all scores for creator: ${creatorId}`);
  }

  const scores = await prisma.superfanScore.findMany({
    where: { creatorId },
    select: { userId: true },
  });

  let recalculated = 0;
  let errors = 0;

  for (const { userId } of scores) {
    try {
      await getOrCalculateSCP(userId, creatorId, true);
      recalculated++;
    } catch (error) {
      errors++;
      if (verbose) {
        console.error(`  Error for user ${userId}: ${error}`);
      }
    }
  }

  // Update creator stats
  await updateCreatorStats(creatorId);

  if (verbose) {
    console.log(`Completed: ${recalculated} recalculated, ${errors} errors`);
  }

  return { recalculated, errors };
}

/**
 * Find users who might become superfans soon (high potential trending up).
 * This can be used for targeted engagement campaigns.
 */
export async function findEmergingSuperfans(
  creatorId: string,
  options: { minScore?: number; maxScore?: number; limit?: number } = {}
): Promise<Array<{
  userId: string;
  scpScore: number;
  signalCount: number;
  lastSignalAt: Date | null;
}>> {
  const { minScore = 50, maxScore = 74, limit = 100 } = options;

  const candidates = await prisma.superfanScore.findMany({
    where: {
      creatorId,
      scpScore: {
        gte: minScore,
        lte: maxScore,
      },
    },
    select: {
      userId: true,
      scpScore: true,
      signalCount: true,
      lastSignalAt: true,
    },
    orderBy: {
      scpScore: 'desc',
    },
    take: limit,
  });

  return candidates;
}

// Run as standalone script
if (require.main === module) {
  recalculateStaleSCPScores({
    verbose: true,
    dryRun: process.argv.includes('--dry-run'),
  })
    .then((stats) => {
      console.log('\nFinal stats:', JSON.stringify(stats, null, 2));
      process.exit(stats.errors > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Job failed:', error);
      process.exit(1);
    });
}
