import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { QuizSession } from '@/lib/supabase';
import { selectAdaptiveQuestions } from '@/lib/quiz/adaptive-selection';
import { itemBank } from '@/lib/quiz/item-bank';

/**
 * POST /api/quiz/session
 *
 * Create a new quiz session.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, isReturningUser, previousProfileId } = body as {
      userId?: string;
      isReturningUser?: boolean;
      previousProfileId?: string;
    };

    const supabase = createAdminClient();

    // Select initial questions using adaptive engine
    const { questions: selectedQuestions } = selectAdaptiveQuestions(
      userId,
      isReturningUser ? { sessionCount: 1 } : undefined,
      { targetTotal: 15 }
    );

    // Create session
    const { data: session, error } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id: userId ?? null,
        status: 'in_progress' as const,
        selected_questions: selectedQuestions.map((q) => q.id),
        answers: [],
        current_question_index: 0,
        is_returning_user: isReturningUser ?? false,
        previous_profile_id: previousProfileId ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    const typedSession = session as QuizSession;

    return NextResponse.json({
      sessionId: typedSession.id,
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

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const session = data as QuizSession;

    // Get current question
    const questionIds = session.selected_questions as string[];
    const currentIndex = session.current_question_index;
    const currentQuestionId = questionIds[currentIndex];
    const currentQuestion = itemBank.find((q) => q.id === currentQuestionId);

    return NextResponse.json({
      session: {
        id: session.id,
        status: session.status,
        currentIndex,
        totalQuestions: questionIds.length,
        answeredCount: (session.answers as unknown[]).length,
        estimatedConfidence: session.estimated_confidence,
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

    const supabase = createAdminClient();

    // Get current session
    const { data, error: fetchError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError || !data) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const session = data as QuizSession;

    if (session.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Session already completed' },
        { status: 400 }
      );
    }

    // Add answer
    const answers = (session.answers as Array<{
      questionId: string;
      answer: number;
      responseTimeMs?: number;
      answeredAt: string;
    }>) ?? [];

    answers.push({
      questionId,
      answer,
      responseTimeMs,
      answeredAt: new Date().toISOString(),
    });

    const questionIds = session.selected_questions as string[];
    const nextIndex = session.current_question_index + 1;
    const isComplete = nextIndex >= questionIds.length;

    // Update session
    const { error: updateError } = await supabase
      .from('quiz_sessions')
      .update({
        answers,
        current_question_index: nextIndex,
        status: isComplete ? 'completed' as const : 'in_progress' as const,
        completed_at: isComplete ? new Date().toISOString() : null,
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

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

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('quiz_sessions')
      .update({ status: 'abandoned' as const })
      .eq('id', sessionId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session abandonment error:', error);
    return NextResponse.json(
      { error: 'Failed to abandon session' },
      { status: 500 }
    );
  }
}
