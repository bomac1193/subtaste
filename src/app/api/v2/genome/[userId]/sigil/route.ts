/**
 * POST /api/v2/genome/[userId]/sigil
 *
 * Reveal the user's sigil (esoteric name).
 * This is a progressive reveal mechanism for engaged users.
 */

import { NextRequest, NextResponse } from 'next/server';
import { revealSigil, getPublicGenome } from '@/lib/genome-service';

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

    // Reveal the sigil
    const revealed = await revealSigil(userId);

    if (!revealed) {
      return NextResponse.json(
        { error: 'Genome not found' },
        { status: 404 }
      );
    }

    // Return updated public genome
    const genome = await getPublicGenome(userId);

    if (!genome) {
      return NextResponse.json(
        { error: 'Genome not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      sigil: genome.formal.primarySigil,
      genome
    });
  } catch (error) {
    console.error('Sigil reveal error:', error);
    return NextResponse.json(
      { error: 'Failed to reveal sigil' },
      { status: 500 }
    );
  }
}
