/**
 * GET /api/v2/genome/[userId]/public
 *
 * Get public taste genome for a user.
 * Safe for client-side use - excludes hidden layers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPublicGenome } from '@/lib/genome-service';

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

    const genome = await getPublicGenome(userId);

    if (!genome) {
      return NextResponse.json(
        { error: 'Genome not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(genome);
  } catch (error) {
    console.error('Public genome fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch genome' },
      { status: 500 }
    );
  }
}
