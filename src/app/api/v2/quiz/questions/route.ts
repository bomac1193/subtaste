import { NextRequest, NextResponse } from 'next/server';
import { getQuestionsForStage, sampleQuestions, type Question, type StageId } from '@subtaste/profiler';

const MIN_SAMPLE = 4;
const MAX_SAMPLE = 6;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stageParam = searchParams.get('stage');
    const countParam = searchParams.get('count');

    if (!stageParam) {
      return NextResponse.json(
        { error: 'Stage is required', details: [{ field: 'stage', error: 'Missing stage' }] },
        { status: 400 }
      );
    }

    if (!isStageId(stageParam)) {
      return NextResponse.json(
        { error: 'Invalid stage', details: [{ field: 'stage', error: 'Stage must be initial, music, or deep' }] },
        { status: 400 }
      );
    }

    const count = parseCount(countParam);
    if (count.error) {
      return NextResponse.json(
        { error: 'Invalid count', details: [{ field: 'count', error: count.error }] },
        { status: 400 }
      );
    }

    const stage = stageParam as StageId;
    const totalAvailable = getQuestionsForStage(stage).length;
    const questions = sampleQuestions(stage, count.value);

    return NextResponse.json({
      stage,
      count: questions.length,
      totalAvailable,
      questions: questions.map(toPublicQuestion)
    });
  } catch (error) {
    console.error('Quiz question fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz questions' },
      { status: 500 }
    );
  }
}

function isStageId(value: string): value is StageId {
  return value === 'initial' || value === 'music' || value === 'deep';
}

function parseCount(value: string | null): { value: number; error?: string } {
  if (!value) {
    return { value: MAX_SAMPLE };
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return { value: 0, error: 'Count must be an integer' };
  }

  if (parsed < MIN_SAMPLE || parsed > MAX_SAMPLE) {
    return { value: 0, error: `Count must be between ${MIN_SAMPLE} and ${MAX_SAMPLE}` };
  }

  return { value: parsed };
}

function toPublicQuestion(question: Question) {
  const base = {
    id: question.id,
    type: question.type,
    prompt: question.prompt,
    category: question.category
  };

  if (question.type === 'binary') {
    return {
      ...base,
      options: question.options
    };
  }

  if (question.type === 'likert') {
    return {
      ...base,
      scale: question.scale,
      lowLabel: question.lowLabel,
      highLabel: question.highLabel
    };
  }

  return {
    ...base,
    items: question.items
  };
}
