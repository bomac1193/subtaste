/**
 * POST /api/v2/signals/[userId]
 *
 * Submit behavioural signals for genome refinement.
 * Accepts both explicit and implicit signals.
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateGenomeFromSignals, getPublicGenome } from '@/lib/genome-service';
import type { Signal, Designation } from '@subtaste/core';
import { prisma } from '@/lib/prisma';

interface SignalSubmission {
  signals: Array<{
    type: 'explicit' | 'intentional_implicit' | 'unintentional_implicit';
    itemId: string;
    kind?: string;
    value?: string | number;
    archetypeWeights?: Partial<Record<Designation, number>>;
    timestamp?: string;
    metadata?: Record<string, unknown>;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json() as SignalSubmission;
    const { signals } = body;

    if (!signals || signals.length === 0) {
      return NextResponse.json(
        { error: 'No signals provided' },
        { status: 400 }
      );
    }

    // Convert to Signal format
    const normalisedSignals: Signal[] = signals.map(s => ({
      type: s.type,
      timestamp: s.timestamp ? new Date(s.timestamp) : new Date(),
      source: 'api',
      data: s.type === 'explicit' ? {
        kind: (s.kind || 'preference') as 'preference' | 'rating' | 'ranking' | 'comparison' | 'selection',
        itemId: s.itemId,
        value: s.value ?? 1,
        archetypeWeights: s.archetypeWeights,
        metadata: s.metadata
      } : {
        kind: (s.kind || 'dwell') as 'dwell' | 'skip' | 'repeat' | 'save' | 'share' | 'click',
        itemId: s.itemId,
        duration: typeof s.value === 'number' ? s.value : undefined,
        metadata: s.metadata
      }
    }));

    // Update genome with new signals
    await updateGenomeFromSignals(userId, normalisedSignals);

    // Get updated public genome
    const genome = await getPublicGenome(userId);

    return NextResponse.json({
      success: true,
      signalsProcessed: normalisedSignals.length,
      genome
    });
  } catch (error) {
    console.error('Signal submission error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to process signals', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/signals/[userId]
 *
 * Get signal stats for a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get genome to retrieve signal history stats
    const genome = await getPublicGenome(userId);

    if (!genome) {
      return NextResponse.json({
        userId,
        signalCount: 0,
        hasGenome: false
      });
    }

    return NextResponse.json({
      userId,
      hasGenome: true,
      version: genome.version,
      confidence: genome.confidence
    });
  } catch (error) {
    console.error('Signal stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signal stats' },
      { status: 500 }
    );
  }
}
