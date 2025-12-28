'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { ModernQuiz } from '@/components/quiz/ModernQuiz';
import { AuthModal, useAuth } from '@/components/auth';
import { LogIn, ArrowRight, Sparkles } from 'lucide-react';
import { computeArchetypeScores } from '@/lib/archetypes/scoring';
import { computeEnneagramProfile } from '@/lib/enneagram/scoring';

export default function QuizPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [showPreQuizAuth, setShowPreQuizAuth] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePreQuizAuthSuccess = () => {
    setShowPreQuizAuth(false);
    setQuizStarted(true);
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  const handleLoginFirst = () => {
    setShowPreQuizAuth(true);
  };

  const handleQuizComplete = useCallback(async (
    answers: Array<{ questionId: string; value: number }>,
    traits: Record<string, number>
  ) => {
    setIsSubmitting(true);

    try {
      // Map traits to the expected format for scoring
      const psychometricInput = {
        openness: traits.openness ?? 0.5,
        conscientiousness: traits.conscientiousness ?? 0.5,
        extraversion: traits.extraversion ?? 0.5,
        agreeableness: traits.agreeableness ?? 0.5,
        neuroticism: traits.neuroticism ?? 0.5,
        noveltySeeking: traits.noveltySeeking ?? 0.5,
        aestheticSensitivity: traits.aestheticSensitivity ?? 0.5,
        riskTolerance: traits.riskTolerance ?? 0.5,
      };

      // Compute archetype scores
      const archetypeResult = computeArchetypeScores({
        psychometric: psychometricInput,
      });

      // Compute enneagram profile
      const enneagramResult = computeEnneagramProfile({
        openness: psychometricInput.openness,
        conscientiousness: psychometricInput.conscientiousness,
        extraversion: psychometricInput.extraversion,
        agreeableness: psychometricInput.agreeableness,
        neuroticism: psychometricInput.neuroticism,
      }, []);

      // Build aesthetic preferences from traits
      const aestheticData = {
        colorPaletteVector: [],
        darknessPreference: traits.darknessPreference ?? 0.5,
        complexityPreference: traits.complexityPreference ?? 0.5,
        symmetryPreference: 0.5,
        organicVsSynthetic: traits.organicVsSynthetic ?? 0.5,
        minimalVsMaximal: traits.minimalVsMaximal ?? 0.5,
        tempoRangeMin: traits.tempoPreference ? Math.round(80 + traits.tempoPreference * 60) : 100,
        tempoRangeMax: traits.tempoPreference ? Math.round(100 + traits.tempoPreference * 60) : 130,
        energyRangeMin: 0.3,
        energyRangeMax: 0.7,
        harmonicDissonanceTolerance: traits.harmonicDissonance ?? 0.3,
        rhythmPreference: traits.rhythmPreference ?? 0.5,
        acousticVsDigital: traits.acousticVsDigital ?? 0.5,
      };

      // Submit to API
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          scoringResult: {
            traits: {
              openness: { score: psychometricInput.openness, confidence: 0.8, std: 0.1, itemCount: 4, rawSum: 0, responses: [] },
              conscientiousness: { score: psychometricInput.conscientiousness, confidence: 0.8, std: 0.1, itemCount: 4, rawSum: 0, responses: [] },
              extraversion: { score: psychometricInput.extraversion, confidence: 0.8, std: 0.1, itemCount: 4, rawSum: 0, responses: [] },
              agreeableness: { score: psychometricInput.agreeableness, confidence: 0.8, std: 0.1, itemCount: 4, rawSum: 0, responses: [] },
              neuroticism: { score: psychometricInput.neuroticism, confidence: 0.8, std: 0.1, itemCount: 4, rawSum: 0, responses: [] },
              noveltySeeking: { score: psychometricInput.noveltySeeking, confidence: 0.8, std: 0.1, itemCount: 4, rawSum: 0, responses: [] },
              aestheticSensitivity: { score: psychometricInput.aestheticSensitivity, confidence: 0.8, std: 0.1, itemCount: 4, rawSum: 0, responses: [] },
              riskTolerance: { score: psychometricInput.riskTolerance, confidence: 0.8, std: 0.1, itemCount: 4, rawSum: 0, responses: [] },
            },
            aesthetic: aestheticData,
            overallConfidence: 0.85,
            reliability: 0.82,
            itemsAnswered: answers.length,
            estimatedAccuracy: 0.78,
            questionsNeededForTarget: 0,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store user ID and results
        localStorage.setItem('subtaste_user_id', data.userId);
        localStorage.setItem('subtaste_archetype', JSON.stringify(archetypeResult));
        localStorage.setItem('subtaste_enneagram', JSON.stringify(enneagramResult));

        // Navigate to results
        router.push('/results');
      } else {
        console.error('Quiz submission failed:', data.error);
        alert('Failed to save results. Please try again.');
      }
    } catch (error) {
      console.error('Quiz submission error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-600 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Pre-quiz screen - show login option before starting (only for non-logged-in users)
  if (!quizStarted && !user) {
    return (
      <>
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6">
          <div className="max-w-md w-full text-center">
            {/* Logo/Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">
              Discover Your Taste DNA
            </h1>
            <p className="text-neutral-400 mb-8">
              28 questions across 7 dimensions to map your unique aesthetic constellation.
            </p>

            {/* Start Quiz Button */}
            <button
              onClick={handleStartQuiz}
              className="w-full group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full font-semibold text-lg hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/25 mb-4"
            >
              Start Quiz
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-neutral-950 text-neutral-500">or</span>
              </div>
            </div>

            {/* Login First Button */}
            <button
              onClick={handleLoginFirst}
              className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-neutral-900 border border-neutral-700 rounded-full font-semibold text-lg hover:bg-neutral-800 hover:border-neutral-600 transition-all"
            >
              <LogIn className="w-5 h-5" />
              Sign in to save your results
            </button>

            <p className="text-neutral-600 text-sm mt-6">
              Takes about 3 minutes. Your data stays private.
            </p>
          </div>
        </div>

        {/* Pre-quiz auth modal */}
        <AuthModal
          isOpen={showPreQuizAuth}
          onClose={() => setShowPreQuizAuth(false)}
          onSuccess={handlePreQuizAuthSuccess}
          initialMode="login"
        />
      </>
    );
  }

  // If logged in user hasn't started, auto-start
  if (!quizStarted && user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back!
          </h1>
          <p className="text-neutral-400 mb-8">
            Ready to discover (or refine) your taste constellation?
          </p>

          <button
            onClick={handleStartQuiz}
            className="w-full group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full font-semibold text-lg hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/25"
          >
            Start Quiz
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-neutral-600 text-sm mt-6">
            28 questions • ~3 minutes
          </p>
        </div>
      </div>
    );
  }

  // Main quiz
  return (
    <ModernQuiz
      onComplete={handleQuizComplete}
    />
  );
}
