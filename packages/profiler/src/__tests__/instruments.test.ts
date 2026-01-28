/**
 * @subtaste/profiler - Assessment Instruments Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createInitialAssessment,
  getCurrentQuestion,
  submitResponse,
  isComplete,
  getProgress,
  completeAssessment,
  createMusicCalibration,
  createDeepCalibration,
  isCalibrationComplete,
  behaviourToSignal,
  behaviourBatchToSignals
} from '../instruments';
import { INITIAL_QUESTIONS } from '../questions';

describe('Initial Assessment', () => {
  describe('createInitialAssessment()', () => {
    it('should create assessment with 3 questions', () => {
      const assessment = createInitialAssessment();

      expect(assessment.questions.length).toBe(3);
      expect(assessment.currentIndex).toBe(0);
      expect(assessment.responses).toEqual([]);
    });

    it('should start with first question', () => {
      const assessment = createInitialAssessment();
      const question = getCurrentQuestion(assessment);

      expect(question).toBeDefined();
      expect(question?.id).toBe(INITIAL_QUESTIONS[0].id);
    });
  });

  describe('submitResponse()', () => {
    it('should advance to next question', () => {
      let assessment = createInitialAssessment();
      assessment = submitResponse(assessment, 0);

      expect(assessment.currentIndex).toBe(1);
      expect(assessment.responses.length).toBe(1);
    });

    it('should record response', () => {
      let assessment = createInitialAssessment();
      assessment = submitResponse(assessment, 1);

      expect(assessment.responses[0].response).toBe(1);
      expect(assessment.responses[0].questionId).toBe(INITIAL_QUESTIONS[0].id);
    });

    it('should mark complete after all questions', () => {
      let assessment = createInitialAssessment();
      assessment = submitResponse(assessment, 0);
      assessment = submitResponse(assessment, 1);
      assessment = submitResponse(assessment, 0);

      expect(isComplete(assessment)).toBe(true);
      expect(assessment.completedAt).toBeDefined();
    });
  });

  describe('getProgress()', () => {
    it('should return 0 at start', () => {
      const assessment = createInitialAssessment();
      expect(getProgress(assessment)).toBe(0);
    });

    it('should return 1/3 after first question', () => {
      let assessment = createInitialAssessment();
      assessment = submitResponse(assessment, 0);

      expect(getProgress(assessment)).toBeCloseTo(1/3, 2);
    });

    it('should return 1 when complete', () => {
      let assessment = createInitialAssessment();
      assessment = submitResponse(assessment, 0);
      assessment = submitResponse(assessment, 1);
      assessment = submitResponse(assessment, 0);

      expect(getProgress(assessment)).toBe(1);
    });
  });

  describe('completeAssessment()', () => {
    it('should return null if not complete', () => {
      const assessment = createInitialAssessment();
      const result = completeAssessment(assessment);

      expect(result).toBeNull();
    });

    it('should return result with classification', () => {
      let assessment = createInitialAssessment();
      assessment = submitResponse(assessment, 0);
      assessment = submitResponse(assessment, 1);
      assessment = submitResponse(assessment, 0);

      const result = completeAssessment(assessment);

      expect(result).toBeDefined();
      expect(result?.classification).toBeDefined();
      expect(result?.classification.primary.glyph).toBeDefined();
    });

    it('should return signals', () => {
      let assessment = createInitialAssessment();
      assessment = submitResponse(assessment, 0);
      assessment = submitResponse(assessment, 1);
      assessment = submitResponse(assessment, 0);

      const result = completeAssessment(assessment);

      expect(result?.signals.length).toBe(3);
    });

    it('should calculate duration', () => {
      let assessment = createInitialAssessment();
      assessment = submitResponse(assessment, 0);
      assessment = submitResponse(assessment, 1);
      assessment = submitResponse(assessment, 0);

      const result = completeAssessment(assessment);

      expect(result?.duration).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Calibration Instruments', () => {
  describe('createMusicCalibration()', () => {
    it('should create music calibration with 3 questions', () => {
      const calibration = createMusicCalibration();

      expect(calibration.type).toBe('music');
      expect(calibration.questions.length).toBe(3);
    });
  });

  describe('createDeepCalibration()', () => {
    it('should create deep calibration with 5 questions', () => {
      const calibration = createDeepCalibration();

      expect(calibration.type).toBe('deep');
      expect(calibration.questions.length).toBe(5);
    });
  });
});

describe('Implicit Signal Processing', () => {
  describe('behaviourToSignal()', () => {
    it('should convert save action to signal', () => {
      const event = {
        type: 'save' as const,
        itemId: 'track-123',
        timestamp: new Date()
      };

      const signal = behaviourToSignal(event);

      expect(signal.type).toBe('intentional_implicit');
      expect(signal.data.kind).toBe('save');
    });

    it('should convert skip action to signal', () => {
      const event = {
        type: 'skip' as const,
        itemId: 'track-456',
        timestamp: new Date()
      };

      const signal = behaviourToSignal(event);

      expect(signal.type).toBe('unintentional_implicit');
      expect(signal.data.kind).toBe('skip');
    });

    it('should include archetype weights based on metadata', () => {
      const event = {
        type: 'save' as const,
        itemId: 'track-789',
        itemMetadata: {
          isObscure: true,
          isComplex: true
        },
        timestamp: new Date()
      };

      const signal = behaviourToSignal(event);

      // Signal should have archetype weights inferred from metadata
      expect((signal.data as any).archetypeWeights).toBeDefined();
    });
  });

  describe('behaviourBatchToSignals()', () => {
    it('should convert multiple events', () => {
      const events = [
        { type: 'save' as const, itemId: 'track-1', timestamp: new Date() },
        { type: 'skip' as const, itemId: 'track-2', timestamp: new Date() },
        { type: 'share' as const, itemId: 'track-3', timestamp: new Date() }
      ];

      const signals = behaviourBatchToSignals(events);

      expect(signals.length).toBe(3);
    });
  });
});
