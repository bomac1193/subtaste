'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { SubtasteQuiz } from '@/components/quiz';
import { AuthModal, useAuth } from '@/components/auth';
import { ScoringResult } from '@/lib/quiz/scoring';
import { UserPriorData } from '@/lib/quiz/adaptive-selection';

export default function QuizPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [priorData, setPriorData] = useState<UserPriorData | undefined>();
  const [submittedUserId, setSubmittedUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load prior data for returning users
  useEffect(() => {
    if (user) {
      const sessionCount = parseInt(localStorage.getItem('subtaste_session_count') || '0', 10);
      setPriorData({ sessionCount });
    }
  }, [user]);

  // After auth success, navigate to results (profile already saved)
  useEffect(() => {
    if (user && submittedUserId && !showAuthModal) {
      // User just signed in after quiz - go to results
      router.push('/results');
    }
  }, [user, submittedUserId, showAuthModal, router]);

  const submitQuiz = useCallback(async (scoringResult: ScoringResult, userId?: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          scoringResult,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store user ID in localStorage for subsequent requests
        localStorage.setItem('subtaste_user_id', data.userId);
        setSubmittedUserId(data.userId);

        // Increment session count
        const currentCount = parseInt(localStorage.getItem('subtaste_session_count') || '0', 10);
        localStorage.setItem('subtaste_session_count', String(currentCount + 1));

        return data.userId;
      } else {
        console.error('Quiz submission failed:', data.error);
        return null;
      }
    } catch (error) {
      console.error('Quiz submission error:', error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handleComplete = async (scoringResult: ScoringResult) => {
    if (user) {
      // User is already authenticated, submit and go to results
      const userId = await submitQuiz(scoringResult, user.id);
      if (userId) {
        router.push('/results');
      }
    } else {
      // Anonymous user - submit first, then offer sign-in
      const userId = await submitQuiz(scoringResult);
      if (userId) {
        // Show auth modal - user can sign in or skip to results
        setShowAuthModal(true);
      }
    }
  };

  const handleAuthSuccess = () => {
    // Close modal - the useEffect will handle navigation after user state updates
    setShowAuthModal(false);
    // Navigate to results immediately since profile is already saved
    router.push('/results');
  };

  const handleSkipAuth = () => {
    setShowAuthModal(false);
    // Profile already saved, just go to results
    router.push('/results');
  };

  const handlePreliminaryResult = (constellation: string, confidence: number) => {
    console.log(`Preliminary: ${constellation} at ${Math.round(confidence * 100)}% confidence`);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-600 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Show loading while submitting
  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-600 border-t-violet-500 rounded-full animate-spin" />
        <p className="mt-4 text-neutral-400">Saving your constellation...</p>
      </div>
    );
  }

  return (
    <>
      <SubtasteQuiz
        onComplete={handleComplete}
        onPreliminaryResult={handlePreliminaryResult}
        userId={user?.id}
        priorData={priorData}
      />

      {/* Auth modal - shown after quiz completion for anonymous users */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleSkipAuth}
        onSuccess={handleAuthSuccess}
        initialMode="signup"
      />

      {/* Skip auth option */}
      {showAuthModal && (
        <div className="fixed bottom-8 left-0 right-0 text-center z-50">
          <button
            onClick={handleSkipAuth}
            className="text-neutral-400 hover:text-white transition-colors underline"
          >
            Continue without account
          </button>
        </div>
      )}
    </>
  );
}
