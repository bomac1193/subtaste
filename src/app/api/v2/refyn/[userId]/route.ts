/**
 * GET /api/v2/refyn/[userId]
 *
 * Get Refyn taste context for prompt adaptation.
 * Returns prompt modifiers and context for AI personalisation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPublicGenome } from '@/lib/genome-service';
import {
  getRefynContext,
  generateTasteSystemPrompt,
  assessContentAffinity
} from '@subtaste/sdk';
import type { ComplexityLevel } from '@subtaste/sdk';

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

    // Get Refyn context from genome
    const context = getRefynContext(genome);

    // Generate system prompt section
    const systemPrompt = generateTasteSystemPrompt(context);

    return NextResponse.json({
      context,
      systemPrompt,
      glyph: genome.archetype.primary.glyph,
      creativeMode: context.creativeMode
    });
  } catch (error) {
    console.error('Refyn context fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Refyn context' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/refyn/[userId]/affinity
 *
 * Assess content affinity for a user.
 * Returns compatibility score and reasoning.
 */
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

    const body = await request.json();
    const { contentAttributes } = body as {
      contentAttributes: {
        complexity?: ComplexityLevel;
        isExperimental?: boolean;
        isNostalgic?: boolean;
        isMinimal?: boolean;
        isMaximal?: boolean;
      };
    };

    if (!contentAttributes) {
      return NextResponse.json(
        { error: 'Content attributes required' },
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

    const context = getRefynContext(genome);
    const affinity = assessContentAffinity(context, contentAttributes);

    return NextResponse.json({
      userId,
      glyph: genome.archetype.primary.glyph,
      affinity
    });
  } catch (error) {
    console.error('Affinity assessment error:', error);
    return NextResponse.json(
      { error: 'Failed to assess affinity' },
      { status: 500 }
    );
  }
}
