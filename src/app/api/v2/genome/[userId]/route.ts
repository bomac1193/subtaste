/**
 * GET /api/v2/genome/[userId]
 *
 * Get full taste genome for a user (server-side only).
 * This endpoint returns the complete genome including hidden layers.
 * Should only be called from server-side code.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGenome, migrateToTwelve } from '@/lib/genome-service';

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

    // Check for migration flag
    const { searchParams } = new URL(request.url);
    const migrate = searchParams.get('migrate') === 'true';

    let genome = await getGenome(userId);

    // If no genome and migration requested, try to migrate
    if (!genome && migrate) {
      genome = await migrateToTwelve(userId);
    }

    if (!genome) {
      return NextResponse.json(
        { error: 'Genome not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(genome);
  } catch (error) {
    console.error('Genome fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch genome' },
      { status: 500 }
    );
  }
}
