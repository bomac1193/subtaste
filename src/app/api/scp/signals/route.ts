import { NextRequest, NextResponse } from 'next/server';
import {
  trackDepthSignal,
  trackDepthSignalBatch,
  trackSession,
  endSession,
  SignalType,
  SessionSource,
  TrackSignalPayload,
} from '@/lib/scp';

const VALID_SIGNAL_TYPES: SignalType[] = [
  'SAVE',
  'REPLAY',
  'CATALOG_DEEP_DIVE',
  'UNPROMPTED_RETURN',
  'SHARE',
  'PLAYLIST_ADD',
  'PROFILE_VISIT',
  'MERCH_CLICK',
  'CONCERT_INTEREST',
];

const VALID_SESSION_SOURCES: SessionSource[] = [
  'ORGANIC',
  'ALGORITHMIC',
  'SOCIAL',
  'EXTERNAL',
];

/**
 * POST /api/scp/signals
 *
 * Track a depth signal for a user-creator pair.
 * This invalidates the cached SCP score.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, creatorId, type, contentId, metadata } = body as TrackSignalPayload;

    // Validate required fields
    if (!userId || !creatorId || !type) {
      return NextResponse.json(
        { error: 'userId, creatorId, and type are required' },
        { status: 400 }
      );
    }

    // Validate signal type
    if (!VALID_SIGNAL_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid signal type. Must be one of: ${VALID_SIGNAL_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const signal = await trackDepthSignal({
      userId,
      creatorId,
      type,
      contentId,
      metadata,
    });

    return NextResponse.json({
      success: true,
      signalId: signal.id,
      type: signal.type,
      weight: signal.weight,
      createdAt: signal.createdAt,
    });
  } catch (error) {
    console.error('Signal tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track signal' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/scp/signals
 *
 * Track multiple depth signals in a batch.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { signals } = body as { signals: TrackSignalPayload[] };

    if (!signals || !Array.isArray(signals) || signals.length === 0) {
      return NextResponse.json(
        { error: 'signals array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate all signals
    for (const signal of signals) {
      if (!signal.userId || !signal.creatorId || !signal.type) {
        return NextResponse.json(
          { error: 'Each signal must have userId, creatorId, and type' },
          { status: 400 }
        );
      }

      if (!VALID_SIGNAL_TYPES.includes(signal.type)) {
        return NextResponse.json(
          { error: `Invalid signal type: ${signal.type}` },
          { status: 400 }
        );
      }
    }

    const result = await trackDepthSignalBatch(signals);

    return NextResponse.json({
      success: true,
      count: result.count,
    });
  } catch (error) {
    console.error('Batch signal tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track signals' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/scp/signals
 *
 * Track or end a session.
 * Body: { action: 'start' | 'end', ... }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'start') {
      // Start a new session
      const { userId, creatorId, source } = body;

      if (!userId || !source) {
        return NextResponse.json(
          { error: 'userId and source are required' },
          { status: 400 }
        );
      }

      if (!VALID_SESSION_SOURCES.includes(source)) {
        return NextResponse.json(
          { error: `Invalid source. Must be one of: ${VALID_SESSION_SOURCES.join(', ')}` },
          { status: 400 }
        );
      }

      const session = await trackSession({
        userId,
        creatorId,
        source,
      });

      return NextResponse.json({
        success: true,
        sessionId: session.id,
        source: session.source,
        startedAt: session.startedAt,
      });
    }

    if (action === 'end') {
      // End an existing session
      const { sessionId } = body;

      if (!sessionId) {
        return NextResponse.json(
          { error: 'sessionId is required' },
          { status: 400 }
        );
      }

      const session = await endSession(sessionId);

      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        sessionId: session.id,
        durationMs: session.durationMs,
        endedAt: session.endedAt,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Must be "start" or "end"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Session tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track session' },
      { status: 500 }
    );
  }
}
