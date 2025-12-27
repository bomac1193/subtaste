'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { SubtasteQuiz } from '@/components/quiz';
import { ScoringResult } from '@/lib/quiz/scoring';
import { UserPriorData } from '@/lib/quiz/adaptive-selection';

export default function QuizPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | undefined>();
  const [priorData, setPriorData] = useState<UserPriorData | undefined>();

  // Load existing user data if returning user
  useEffect(() => {
    const storedUserId = localStorage.getItem('subtaste_user_id');
    if (storedUserId) {
      setUserId(storedUserId);
      // Could fetch prior data from API here for returning users
      // For now, just set session count
      const sessionCount = parseInt(localStorage.getItem('subtaste_session_count') || '0', 10);
      setPriorData({ sessionCount });
    }
  }, []);

  const handleComplete = async (scoringResult: ScoringResult) => {
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

        // Increment session count
        const currentCount = parseInt(localStorage.getItem('subtaste_session_count') || '0', 10);
        localStorage.setItem('subtaste_session_count', String(currentCount + 1));

        // Navigate to swipe interface with teaser
        router.push(`/swipe?teaser=${data.preliminaryConstellation}`);
      } else {
        console.error('Quiz submission failed:', data.error);
      }
    } catch (error) {
      console.error('Quiz submission error:', error);
    }
  };

  const handlePreliminaryResult = (constellation: string, confidence: number) => {
    // Could show a preliminary result notification here
    console.log(`Preliminary: ${constellation} at ${Math.round(confidence * 100)}% confidence`);
  };

  return (
    <SubtasteQuiz
      onComplete={handleComplete}
      onPreliminaryResult={handlePreliminaryResult}
      userId={userId}
      priorData={priorData}
    />
  );
}
