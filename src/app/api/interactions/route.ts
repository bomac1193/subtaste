import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InteractionType, InteractionSource } from '@/lib/types/models';
import { trackDepthSignal, checkCatalogDeepDive, SignalType } from '@/lib/scp';

interface InteractionPayload {
  userId: string;
  contentId: string;
  interactionType: InteractionType;
  rating?: 1 | 2 | 3 | 4 | 5;
  dwellTimeMs?: number;
  source: InteractionSource;
}

// Map interaction types to SCP signal types
const INTERACTION_TO_SIGNAL: Partial<Record<InteractionType, SignalType>> = {
  save: 'SAVE',
  share: 'SHARE',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      contentId,
      interactionType,
      rating,
      dwellTimeMs,
      source,
    } = body as InteractionPayload;

    if (!userId || !contentId || !interactionType || !source) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the interaction
    const interaction = await prisma.userContentInteraction.create({
      data: {
        userId,
        contentId,
        interactionType,
        rating,
        dwellTimeMs,
        source,
      },
    });

    // Track SCP depth signals based on interaction type
    const content = await prisma.contentItem.findUnique({
      where: { id: contentId },
      select: { creatorId: true },
    });

    if (content?.creatorId) {
      // Track direct signal if applicable
      const signalType = INTERACTION_TO_SIGNAL[interactionType];
      if (signalType) {
        await trackDepthSignal({
          userId,
          creatorId: content.creatorId,
          type: signalType,
          contentId,
        });
      }

      // Check for catalog deep dive (5+ tracks from same creator in 24h)
      if (['view', 'like', 'save'].includes(interactionType)) {
        await checkCatalogDeepDive(userId, content.creatorId);
      }
    }

    return NextResponse.json({
      success: true,
      interactionId: interaction.id,
    });
  } catch (error) {
    console.error('Interaction logging error:', error);
    return NextResponse.json(
      { error: 'Failed to log interaction' },
      { status: 500 }
    );
  }
}

// Batch interaction logging
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { interactions } = body as { interactions: InteractionPayload[] };

    if (!interactions || !Array.isArray(interactions) || interactions.length === 0) {
      return NextResponse.json(
        { error: 'No interactions provided' },
        { status: 400 }
      );
    }

    // Create all interactions in a batch
    const created = await prisma.userContentInteraction.createMany({
      data: interactions.map((i) => ({
        userId: i.userId,
        contentId: i.contentId,
        interactionType: i.interactionType,
        rating: i.rating,
        dwellTimeMs: i.dwellTimeMs,
        source: i.source,
      })),
    });

    return NextResponse.json({
      success: true,
      count: created.count,
    });
  } catch (error) {
    console.error('Batch interaction logging error:', error);
    return NextResponse.json(
      { error: 'Failed to log interactions' },
      { status: 500 }
    );
  }
}
