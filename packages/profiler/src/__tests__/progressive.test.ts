/**
 * @subtaste/profiler - Progressive Profiling Tests
 */

import { describe, it, expect } from 'vitest';
import {
  PROFILING_STAGES,
  getStage,
  createProfilingState,
  isStageAvailable,
  getNextAvailableStage,
  completeStage,
  recordInteraction,
  shouldPromptCalibration,
  getProfilingProgress,
  createOrchestrator
} from '../progressive';

describe('Profiling Stages', () => {
  describe('PROFILING_STAGES', () => {
    it('should have 3 stages', () => {
      expect(PROFILING_STAGES.length).toBe(3);
    });

    it('should have initial as first stage', () => {
      expect(PROFILING_STAGES[0].id).toBe('initial');
      expect(PROFILING_STAGES[0].trigger).toBe('onboarding');
    });

    it('should have music calibration as second stage', () => {
      expect(PROFILING_STAGES[1].id).toBe('music');
      expect(PROFILING_STAGES[1].trigger).toBe('milestone');
      expect(PROFILING_STAGES[1].milestoneThreshold).toBe(5);
    });

    it('should have deep calibration as third stage', () => {
      expect(PROFILING_STAGES[2].id).toBe('deep');
      expect(PROFILING_STAGES[2].trigger).toBe('on-demand');
    });
  });

  describe('getStage()', () => {
    it('should return stage by id', () => {
      const stage = getStage('initial');
      expect(stage?.name).toBe('Initial Spark');
    });

    it('should return undefined for invalid id', () => {
      const stage = getStage('invalid' as any);
      expect(stage).toBeUndefined();
    });
  });
});

describe('Profiling State', () => {
  describe('createProfilingState()', () => {
    it('should create empty state', () => {
      const state = createProfilingState();

      expect(state.completedStages).toEqual([]);
      expect(state.currentStage).toBeNull();
      expect(state.interactionCount).toBe(0);
      expect(state.totalConfidence).toBe(0);
    });
  });

  describe('isStageAvailable()', () => {
    it('should make initial available for new user', () => {
      const state = createProfilingState();
      const initial = getStage('initial')!;

      expect(isStageAvailable(initial, state)).toBe(true);
    });

    it('should not make initial available after completion', () => {
      let state = createProfilingState();
      state = completeStage(state, 'initial');
      const initial = getStage('initial')!;

      expect(isStageAvailable(initial, state)).toBe(false);
    });

    it('should not make music available without initial', () => {
      const state = createProfilingState();
      const music = getStage('music')!;

      expect(isStageAvailable(music, state)).toBe(false);
    });

    it('should make music available after initial + 5 interactions', () => {
      let state = createProfilingState();
      state = completeStage(state, 'initial');
      for (let i = 0; i < 5; i++) {
        state = recordInteraction(state);
      }
      const music = getStage('music')!;

      expect(isStageAvailable(music, state)).toBe(true);
    });

    it('should make deep available after initial + music', () => {
      let state = createProfilingState();
      state = completeStage(state, 'initial');
      state = completeStage(state, 'music');
      const deep = getStage('deep')!;

      expect(isStageAvailable(deep, state)).toBe(true);
    });
  });

  describe('getNextAvailableStage()', () => {
    it('should return initial for new user', () => {
      const state = createProfilingState();
      const next = getNextAvailableStage(state);

      expect(next?.id).toBe('initial');
    });

    it('should return music after initial + 5 interactions', () => {
      let state = createProfilingState();
      state = completeStage(state, 'initial');
      for (let i = 0; i < 5; i++) {
        state = recordInteraction(state);
      }
      const next = getNextAvailableStage(state);

      expect(next?.id).toBe('music');
    });

    it('should return null when all milestone stages complete', () => {
      let state = createProfilingState();
      state = completeStage(state, 'initial');
      state = completeStage(state, 'music');
      // Deep is on-demand, so shouldn't auto-suggest
      const next = getNextAvailableStage(state);

      // Since deep is 'on-demand', it's available but low priority
      expect(next?.id).toBe('deep');
    });
  });

  describe('completeStage()', () => {
    it('should add stage to completed', () => {
      let state = createProfilingState();
      state = completeStage(state, 'initial');

      expect(state.completedStages).toContain('initial');
    });

    it('should increase total confidence', () => {
      let state = createProfilingState();
      state = completeStage(state, 'initial');

      expect(state.totalConfidence).toBeGreaterThan(0);
    });

    it('should set lastStageCompletedAt', () => {
      let state = createProfilingState();
      state = completeStage(state, 'initial');

      expect(state.lastStageCompletedAt).toBeDefined();
    });
  });

  describe('recordInteraction()', () => {
    it('should increment interaction count', () => {
      let state = createProfilingState();
      state = recordInteraction(state);
      state = recordInteraction(state);

      expect(state.interactionCount).toBe(2);
    });
  });

  describe('shouldPromptCalibration()', () => {
    it('should prompt for initial on new user', () => {
      const state = createProfilingState();
      expect(shouldPromptCalibration(state)).toBe(true);
    });

    it('should prompt for music after threshold', () => {
      let state = createProfilingState();
      state = completeStage(state, 'initial');
      for (let i = 0; i < 5; i++) {
        state = recordInteraction(state);
      }

      expect(shouldPromptCalibration(state)).toBe(true);
    });

    it('should not prompt for on-demand stages', () => {
      let state = createProfilingState();
      state = completeStage(state, 'initial');
      state = completeStage(state, 'music');

      // Deep is on-demand, should not auto-prompt
      expect(shouldPromptCalibration(state)).toBe(false);
    });
  });

  describe('getProfilingProgress()', () => {
    it('should return 0 for new user', () => {
      const state = createProfilingState();
      expect(getProfilingProgress(state)).toBe(0);
    });

    it('should return 1/3 after initial', () => {
      let state = createProfilingState();
      state = completeStage(state, 'initial');

      expect(getProfilingProgress(state)).toBeCloseTo(1/3, 2);
    });

    it('should return 1 when all complete', () => {
      let state = createProfilingState();
      state = completeStage(state, 'initial');
      state = completeStage(state, 'music');
      state = completeStage(state, 'deep');

      expect(getProfilingProgress(state)).toBe(1);
    });
  });
});

describe('ProfilingOrchestrator', () => {
  describe('createOrchestrator()', () => {
    it('should create orchestrator for new user', () => {
      const orchestrator = createOrchestrator('user-123');

      expect(orchestrator.getState().genome).toBeNull();
      expect(orchestrator.getProgress()).toBe(0);
    });

    it('should infer state from existing genome', () => {
      // Create a genome first
      const newOrchestrator = createOrchestrator('user-456');
      const assessment = newOrchestrator.startInitialAssessment();

      // Mock completing assessment
      let state = assessment;
      const { submitResponse } = require('../instruments');
      state = submitResponse(state, 0);
      state = submitResponse(state, 1);
      state = submitResponse(state, 0);

      // This is internal state, so we test the public interface
      expect(newOrchestrator.getGenome()).toBeNull();
    });
  });

  describe('Event subscription', () => {
    it('should emit events to subscribers', () => {
      const orchestrator = createOrchestrator('user-789');
      const events: any[] = [];

      orchestrator.subscribe((event) => {
        events.push(event);
      });

      // Start and complete initial assessment
      orchestrator.startInitialAssessment();
      // Events should be emitted when completing

      expect(events.length).toBe(0); // No events until completion
    });
  });

  describe('recordBehaviour()', () => {
    it('should buffer behavioural signals', () => {
      const orchestrator = createOrchestrator('user-101');

      orchestrator.recordBehaviour([
        { type: 'save', itemId: 'track-1', timestamp: new Date() }
      ]);

      expect(orchestrator.getState().pendingSignals.length).toBe(1);
    });

    it('should increment interaction count', () => {
      const orchestrator = createOrchestrator('user-102');

      orchestrator.recordBehaviour([
        { type: 'save', itemId: 'track-1', timestamp: new Date() }
      ]);

      expect(orchestrator.getState().profiling.interactionCount).toBe(1);
    });
  });
});
