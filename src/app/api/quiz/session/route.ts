import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { selectAdaptiveQuestions } from '@/lib/quiz/adaptive-selection';
import { itemBank } from '@/lib/quiz/item-bank';

interface QuizAnswer {
  questionId: string;
  answer: number;
  responseTimeMs?: number;
  answeredAt: string;
}

/**
 * POST /api/quiz/session
 *
 * Create a new quiz session.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, isReturningUser } = body as {
      userId?: string;
      isReturningUser?: boolean;
    };

    // Select initial questions using adaptive engine
    const { questions: selectedQuestions } = selectAdaptiveQuestions(
      userId,
      isReturningUser ? { sessionCount: 1 } : undefined,
      { targetTotal: 15 }
    );

    // Create session
    const session = await prisma.quizSession.create({
      data: {
        userId: userId ?? null,
        status: 'in_progress',
        selectedQuestions: selectedQuestions.map((q) => q.id),
        answers: [],
        currentQuestionIndex: 0,
        totalQuestions: selectedQuestions.length,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      questions: selectedQuestions,
      totalQuestions: selectedQuestions.length,
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/quiz/session?id=xxx
 *
 * Get quiz session with current question.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get current question
    const questionIds = session.selectedQuestions as string[];
    const currentIndex = session.currentQuestionIndex;
    const currentQuestionId = questionIds[currentIndex];
    const currentQuestion = itemBank.find((q) => q.id === currentQuestionId);

    return NextResponse.json({
      session: {
        id: session.id,
        status: session.status,
        currentIndex,
        totalQuestions: questionIds.length,
        answeredCount: (session.answers as unknown[]).length,
      },
      currentQuestion,
      isComplete: currentIndex >= questionIds.length,
    });
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/quiz/session
 *
 * Submit answer and advance session.
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, questionId, answer, responseTimeMs } = body as {
      sessionId: string;
      questionId: string;
      answer: number; // 1-5 scale
      responseTimeMs?: number;
    };

    if (!sessionId || !questionId || answer === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current session
    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Session already completed' },
        { status: 400 }
      );
    }

    // Add answer
    const answers = (session.answers as QuizAnswer[]) ?? [];

    answers.push({
      questionId,
      answer,
      responseTimeMs,
      answeredAt: new Date().toISOString(),
    });

    const questionIds = session.selectedQuestions as string[];
    const nextIndex = session.currentQuestionIndex + 1;
    const isComplete = nextIndex >= questionIds.length;

    // Update session
    await prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        answers,
        currentQuestionIndex: nextIndex,
        status: isComplete ? 'completed' : 'in_progress',
      },
    });

    // Get next question if not complete
    let nextQuestion = null;
    if (!isComplete) {
      const nextQuestionId = questionIds[nextIndex];
      nextQuestion = itemBank.find((q) => q.id === nextQuestionId);
    }

    return NextResponse.json({
      success: true,
      isComplete,
      progress: {
        currentIndex: nextIndex,
        totalQuestions: questionIds.length,
        answeredCount: answers.length,
      },
      nextQuestion,
    });
  } catch (error) {
    console.error('Answer submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quiz/session?id=xxx
 *
 * Abandon a quiz session.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    await prisma.quizSession.update({
      where: { id: sessionId },
      data: { status: 'abandoned' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session abandonment error:', error);
    return NextResponse.json(
      { error: 'Failed to abandon session' },
      { status: 500 }
    );
  }
}
