/**
 * POST /api/v2/quiz
 *
 * Submit quiz responses and generate initial taste genome.
 * Uses THE TWELVE classification system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processQuizSubmission, getProfilingProgress } from '@/lib/genome-service';
import {
  getQuestionById,
  type Question,
  type LikertQuestion,
  type RankingQuestion
} from '@subtaste/profiler';
import { prisma } from '@/lib/prisma';

interface QuizSubmission {
  userId?: string;
  sessionId?: string;
  stageId?: 'initial' | 'music' | 'deep';
  responses: Array<{
    questionId: string;
    response: number | number[];
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as QuizSubmission;
    const { userId, sessionId, responses } = body;

    if (!Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        { error: 'No responses provided' },
        { status: 400 }
      );
    }

    // Validate responses against question definitions
    const validationErrors: Array<{ questionId: string; error: string }> = [];
    for (const r of responses) {
      if (!r || typeof r.questionId !== 'string' || r.questionId.length === 0) {
        validationErrors.push({ questionId: String(r?.questionId || ''), error: 'Missing questionId' });
        continue;
      }

      const question = getQuestionById(r.questionId);
      if (!question) {
        validationErrors.push({ questionId: r.questionId, error: 'Unknown questionId' });
        continue;
      }

      const error = validateResponse(question, r.response);
      if (error) {
        validationErrors.push({ questionId: r.questionId, error });
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid response format', details: validationErrors },
        { status: 400 }
      );
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

function validateResponse(question: Question, response: number | number[]): string | null {
  if (question.type === 'binary') {
    if (typeof response !== 'number' || !Number.isInteger(response) || (response !== 0 && response !== 1)) {
      return 'Binary response must be 0 or 1';
    }
    return null;
  }

  if (question.type === 'likert') {
    const likert = question as LikertQuestion;
    if (typeof response !== 'number' || !Number.isInteger(response)) {
      return 'Likert response must be an integer';
    }
    if (response < 1 || response > likert.scale) {
      return `Likert response must be between 1 and ${likert.scale}`;
    }
    return null;
  }

  if (question.type === 'ranking') {
    const ranking = question as RankingQuestion;
    if (!Array.isArray(response)) {
      return 'Ranking response must be an array of indices';
    }
    const itemsLength = ranking.items?.length || 0;
    if (itemsLength === 0) {
      return 'Ranking question has no items';
    }
    if (response.length !== itemsLength) {
      return `Ranking response must include ${itemsLength} items`;
    }
    const seen = new Set<number>();
    for (const entry of response) {
      if (typeof entry !== 'number' || !Number.isInteger(entry)) {
        return 'Ranking response must be an array of integer indices';
      }
      if (entry < 0 || entry >= itemsLength) {
        return `Ranking index out of range (0-${itemsLength - 1})`;
      }
      if (seen.has(entry)) {
        return 'Ranking response must not contain duplicates';
      }
      seen.add(entry);
    }
    return null;
  }

  return 'Unsupported question type';
}
