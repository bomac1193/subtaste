'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  selectAdaptiveQuestions,
  SelectedQuestionSet,
  UserPriorData,
} from '@/lib/quiz/adaptive-selection';
import {
  ItemBankQuestion,
  ItemAnswer,
  getAnswerById,
} from '@/lib/quiz/item-bank';
import {
  scoreTraits,
  getProgressUpdate,
  Answer,
  ScoringResult,
  ProgressUpdate,
} from '@/lib/quiz/scoring';

interface SubtasteQuizProps {
  onComplete: (result: ScoringResult) => Promise<void>;
  onPreliminaryResult?: (constellation: string, confidence: number) => void;
  userId?: string;
  priorData?: UserPriorData;
}

interface QuizState {
  currentIndex: number;
  answers: Answer[];
  questionSet: SelectedQuestionSet | null;
  progress: ProgressUpdate | null;
  direction: 1 | -1;
  isSubmitting: boolean;
  showTeaser: boolean;
  teaserConstellation?: string;
  isInitialized: boolean;
}

export function SubtasteQuiz({
  onComplete,
  onPreliminaryResult,
  userId,
  priorData,
}: SubtasteQuizProps) {
  // Initialize state without question set (will be set client-side)
  const [state, setState] = useState<QuizState>({
    currentIndex: 0,
    answers: [],
    questionSet: null,
    progress: null,
    direction: 1,
    isSubmitting: false,
    showTeaser: false,
    isInitialized: false,
  });

  // Initialize questions on client-side only to avoid hydration mismatch
  useEffect(() => {
    if (!state.isInitialized) {
      const questionSet = selectAdaptiveQuestions(userId, priorData);
      const progress = getProgressUpdate([], questionSet.questions.length);
      setState(prev => ({
        ...prev,
        questionSet,
        progress,
        isInitialized: true,
      }));
    }
  }, [userId, priorData, state.isInitialized]);

  // Handle answer selection
  const handleAnswer = useCallback(
    (answerId: string) => {
      setState((prev) => {
        if (!prev.questionSet) return prev;

        const currentQuestion = prev.questionSet.questions[prev.currentIndex];
        if (!currentQuestion) return prev;

        const selectedAnswer = getAnswerById(currentQuestion.id, answerId);
        if (!selectedAnswer) return prev;

        const newAnswer: Answer = {
          questionId: currentQuestion.id,
          answerId,
          question: currentQuestion,
          answer: selectedAnswer,
          responseTimeMs: Date.now(),
        };

        // Remove existing answer for this question if any
        const filteredAnswers = prev.answers.filter(
          (a) => a.questionId !== currentQuestion.id
        );
        const updatedAnswers = [...filteredAnswers, newAnswer];

        // Update progress
        const newProgress = getProgressUpdate(
          updatedAnswers,
          prev.questionSet.questions.length
        );

        return {
          ...prev,
          answers: updatedAnswers,
          progress: newProgress,
        };
      });
    },
    []
  );

  // Handle next question
  const handleNext = useCallback(async () => {
    const { questionSet, answers, currentIndex } = state;
    if (!questionSet) return;

    const currentQuestion = questionSet.questions[currentIndex];
    const currentAnswer = answers.find((a) => a.questionId === currentQuestion?.id);
    if (!currentAnswer) return;

    const totalQuestions = questionSet.questions.length;

    if (currentIndex < totalQuestions - 1) {
      setState((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        direction: 1,
      }));
    } else {
      // Quiz complete - calculate final results
      setState((prev) => ({ ...prev, isSubmitting: true }));

      try {
        const result = scoreTraits(answers);

        // Show teaser before submitting
        setState((prev) => ({
          ...prev,
          showTeaser: true,
          isSubmitting: false,
        }));

        // Notify about preliminary result
        if (onPreliminaryResult) {
          onPreliminaryResult('computing', result.overallConfidence);
        }

        // Wait for teaser animation then complete
        setTimeout(async () => {
          await onComplete(result);
        }, 2000);
      } catch (error) {
        console.error('Error scoring quiz:', error);
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    }
  }, [state, onComplete, onPreliminaryResult]);

  // Handle previous question
  const handlePrev = useCallback(() => {
    if (state.currentIndex > 0) {
      setState((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex - 1,
        direction: -1,
      }));
    }
  }, [state.currentIndex]);

  // Show loading state until questions are initialized
  if (!state.isInitialized || !state.questionSet || !state.progress) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <p className="mt-4 text-neutral-400">Preparing your questions...</p>
      </div>
    );
  }

  const currentQuestion = state.questionSet.questions[state.currentIndex];
  const totalQuestions = state.questionSet.questions.length;

  // Calculate confidence-based progress (0-100)
  const baseProgress = (state.currentIndex / totalQuestions) * 60;
  const confidenceBonus = state.progress.currentConfidence * 40;
  const confidenceProgress = Math.min(100, baseProgress + confidenceBonus);

  // Get current answer for this question
  const currentAnswer = state.answers.find((a) => a.questionId === currentQuestion?.id);

  // Show teaser screen
  if (state.showTeaser) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.2, 1],
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
              scale: { duration: 1, repeat: Infinity },
            }}
            className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-amber-500 flex items-center justify-center"
          >
            <Sparkles className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-2xl font-light">Mapping your constellation...</h2>
          <p className="text-neutral-400 max-w-md">
            {Math.round(state.progress.estimatedAccuracy * 100)}% profile accuracy
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-sm">
            {Object.entries(state.progress.traitProgress)
              .filter(([, v]) => v.confidence > 0.5)
              .map(([trait, v]) => (
                <span
                  key={trait}
                  className="px-3 py-1 rounded-full bg-neutral-800 text-sm text-neutral-300"
                >
                  {trait}: {Math.round(v.confidence * 100)}%
                </span>
              ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Confidence-based progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-neutral-800">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500"
          initial={{ width: 0 }}
          animate={{ width: `${confidenceProgress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Progress indicator with confidence info */}
      <div className="pt-8 px-6 flex justify-between items-center text-sm">
        <div className="flex items-center gap-4">
          <span className="text-neutral-400">
            {state.currentIndex + 1} / {totalQuestions}
          </span>
          <span className="text-neutral-600">•</span>
          <span className="text-violet-400">
            {Math.round(state.progress.estimatedAccuracy * 100)}% accuracy
          </span>
        </div>
        <span className="text-neutral-600">Subtaste Test</span>
      </div>

      {/* Confidence message */}
      <div className="px-6 pt-2">
        <p className="text-xs text-neutral-500">{state.progress.message}</p>
      </div>

      {/* Question content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <AnimatePresence mode="wait" custom={state.direction}>
          <motion.div
            key={currentQuestion.id}
            custom={state.direction}
            initial={{ opacity: 0, x: state.direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: state.direction * -50 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl"
          >
            <QuestionDisplay
              question={currentQuestion}
              selectedAnswerId={currentAnswer?.answerId}
              onSelect={handleAnswer}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Trait confidence indicators (compact) */}
      <div className="px-6 pb-4">
        <div className="flex flex-wrap justify-center gap-1">
          {Object.entries(state.progress.traitProgress).map(([trait, { confidence }]) => (
            <div
              key={trait}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                confidence > 0.7
                  ? 'bg-emerald-500'
                  : confidence > 0.4
                  ? 'bg-amber-500'
                  : 'bg-neutral-700'
              )}
              title={`${trait}: ${Math.round(confidence * 100)}%`}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-6 flex justify-between items-center border-t border-neutral-800">
        <button
          onClick={handlePrev}
          disabled={state.currentIndex === 0}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
            state.currentIndex === 0
              ? 'text-neutral-600 cursor-not-allowed'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          )}
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={!currentAnswer || state.isSubmitting}
          className={cn(
            'flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all',
            currentAnswer && !state.isSubmitting
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-500 hover:to-fuchsia-400 text-white'
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
          )}
        >
          {state.isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : state.currentIndex === totalQuestions - 1 ? (
            <>
              <Sparkles className="w-5 h-5" />
              Discover
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

interface QuestionDisplayProps {
  question: ItemBankQuestion;
  selectedAnswerId: string | undefined;
  onSelect: (answerId: string) => void;
}

function QuestionDisplay({ question, selectedAnswerId, onSelect }: QuestionDisplayProps) {
  return (
    <div className="space-y-8">
      {/* Question text */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl md:text-3xl font-light leading-relaxed">
          {question.text}
        </h2>
        {question.category && (
          <span className="inline-block px-3 py-1 rounded-full bg-neutral-800 text-xs text-neutral-400 uppercase tracking-wider">
            {question.category}
          </span>
        )}
      </div>

      {/* Answers */}
      <div
        className={cn(
          'grid gap-4',
          question.answers.length === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2'
        )}
      >
        {question.answers.map((answer) => (
          <AnswerOption
            key={answer.id}
            answer={answer}
            isSelected={selectedAnswerId === answer.id}
            onSelect={() => onSelect(answer.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface AnswerOptionProps {
  answer: ItemAnswer;
  isSelected: boolean;
  onSelect: () => void;
}

function AnswerOption({ answer, isSelected, onSelect }: AnswerOptionProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'p-5 rounded-xl border-2 text-left transition-all',
        isSelected
          ? 'border-violet-500 bg-violet-500/10 text-white'
          : 'border-neutral-800 hover:border-neutral-600 text-neutral-300 hover:text-white'
      )}
    >
      <span className="text-lg">{answer.text}</span>
    </button>
  );
}

export default SubtasteQuiz;
