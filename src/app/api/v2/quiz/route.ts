/**
 * POST /api/v2/quiz
 *
 * Submit quiz responses and generate initial taste genome.
 * Uses THE TWELVE classification system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processQuizSubmission, getProfilingProgress } from '@/lib/genome-service';
import { prisma } from '@/lib/prisma';

interface QuizSubmission {
  userId?: string;
  sessionId?: string;
  responses: Array<{
    questionId: string;
    response: 0 | 1;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as QuizSubmission;
    const { userId, sessionId, responses } = body;

    if (!responses || responses.length === 0) {
      return NextResponse.json(
        { error: 'No responses provided' },
        { status: 400 }
      );
    }

    // Validate responses
    for (const r of responses) {
      if (!r.questionId || (r.response !== 0 && r.response !== 1)) {
        return NextResponse.json(
          { error: 'Invalid response format' },
          { status: 400 }
        );
      }
    }

    // Process quiz and create genome
    const result = await processQuizSubmission(userId, responses);

    // Update quiz session if provided
    if (sessionId) {
      await prisma.quizSession.update({
        where: { id: sessionId },
        data: {
          userId: result.userId,
          status: 'completed',
          scoringResult: {
            designation: result.genome.archetype.primary.designation,
            glyph: result.genome.archetype.primary.glyph,
            confidence: result.genome.confidence,
            responses
          }
        }
      }).catch(() => {
        // Session might not exist, ignore error
        console.log('Quiz session not found:', sessionId);
      });
    }

    // Save to profile history
    await prisma.profileHistory.create({
      data: {
        userId: result.userId,
        profileType: 'genome',
        profileData: {
          designation: result.genome.archetype.primary.designation,
          glyph: result.genome.archetype.primary.glyph,
          confidence: result.genome.confidence,
          version: result.genome.version
        },
        trigger: 'quiz_complete'
      }
    });

    console.log('Quiz submitted for user:', result.userId);

    return NextResponse.json({
      success: true,
      userId: result.userId,
      genome: result.genome,
      glyph: result.genome.archetype.primary.glyph,
      designation: result.genome.archetype.primary.designation,
      confidence: result.genome.confidence
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to process quiz', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/quiz?userId=xxx
 *
 * Get quiz progress for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const progress = await getProfilingProgress(userId);

    if (!progress) {
      return NextResponse.json({
        hasStarted: false,
        currentStage: null,
        stagesCompleted: [],
        signalCount: 0
      });
    }

    return NextResponse.json({
      hasStarted: true,
      currentStage: progress.currentStage,
      stagesCompleted: progress.stagesCompleted,
      signalCount: progress.signalCount
    });
  } catch (error) {
    console.error('Quiz progress fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}
