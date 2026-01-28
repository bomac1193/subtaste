/**
 * @subtaste/core - Genome Operations Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createGenome,
  toPublicGenome,
  revealSigil,
  getPrimarySigil,
  validateGenome,
  serializeGenome,
  deserializeGenome,
  encodeSignalsToGenome,
  updateGenomeWithSignals,
  calculateGenomeSimilarity
} from '../genome';
import { classify } from '../engine';
import type { Signal, TasteGenome, Designation } from '../types';

describe('Genome Schema', () => {
  const mockClassification = {
    primary: { designation: 'C-4' as Designation, confidence: 0.75 },
    secondary: { designation: 'S-0' as Designation, confidence: 0.15 },
    distribution: {
      'S-0': 0.15, 'T-1': 0.05, 'V-2': 0.05, 'L-3': 0.05,
      'C-4': 0.45, 'N-5': 0.05, 'H-6': 0.05, 'P-7': 0.05,
      'D-8': 0.05, 'F-9': 0.03, 'R-10': 0.02, 'Ø': 0.00
    } as Record<Designation, number>
  };

  const mockPsychometrics = {
    openness: {
      fantasy: 0.6, aesthetics: 0.7, feelings: 0.5,
      actions: 0.4, ideas: 0.8, values: 0.5
    },
    intellect: 0.75,
    musicPreferences: {
      mellow: 0.3, unpretentious: 0.2, sophisticated: 0.8,
      intense: 0.7, contemporary: 0.5
    }
  };

  describe('createGenome()', () => {
    it('should create a valid genome', () => {
      const genome = createGenome({
        userId: 'user-123',
        classification: mockClassification,
        psychometrics: mockPsychometrics,
        sephiroticBalance: { Geburah: 0.45 },
        orishaResonance: { primary: 'Ogun', shadow: 'Yemoja' }
      });

      expect(genome.id).toBeDefined();
      expect(genome.userId).toBe('user-123');
      expect(genome.version).toBe(1);
      expect(genome.archetype.primary.designation).toBe('C-4');
      expect(genome.archetype.primary.glyph).toBe('CULL');
    });

    it('should set correct sigils', () => {
      const genome = createGenome({
        userId: 'user-123',
        classification: mockClassification,
        psychometrics: mockPsychometrics,
        sephiroticBalance: {},
        orishaResonance: { primary: 'Ogun', shadow: 'Yemoja' }
      });

      expect(genome.formal.primarySigil).toBe('Severis');
      expect(genome.formal.secondarySigil).toBe('Aethonis');
      expect(genome.formal.revealed).toBe(false);
    });

    it('should initialise behaviour layer', () => {
      const genome = createGenome({
        userId: 'user-123',
        classification: mockClassification,
        psychometrics: mockPsychometrics,
        sephiroticBalance: {},
        orishaResonance: { primary: 'Ogun', shadow: 'Yemoja' }
      });

      expect(genome.behaviour.contexts).toEqual({});
      expect(genome.behaviour.signalHistory).toEqual([]);
      expect(genome.behaviour.confidence).toBe(0.75);
    });
  });

  describe('toPublicGenome()', () => {
    it('should strip engine data', () => {
      const genome = createGenome({
        userId: 'user-123',
        classification: mockClassification,
        psychometrics: mockPsychometrics,
        sephiroticBalance: {},
        orishaResonance: { primary: 'Ogun', shadow: 'Yemoja' }
      });

      const publicGenome = toPublicGenome(genome);

      expect((publicGenome as any)._engine).toBeUndefined();
      expect(publicGenome.archetype).toBeDefined();
    });

    it('should hide sigil when not revealed', () => {
      const genome = createGenome({
        userId: 'user-123',
        classification: mockClassification,
        psychometrics: mockPsychometrics,
        sephiroticBalance: {},
        orishaResonance: { primary: 'Ogun', shadow: 'Yemoja' }
      });

      const publicGenome = toPublicGenome(genome);

      expect(publicGenome.formal.primarySigil).toBeNull();
      expect(publicGenome.formal.revealed).toBe(false);
    });

    it('should show sigil when revealed', () => {
      let genome = createGenome({
        userId: 'user-123',
        classification: mockClassification,
        psychometrics: mockPsychometrics,
        sephiroticBalance: {},
        orishaResonance: { primary: 'Ogun', shadow: 'Yemoja' }
      });

      genome = revealSigil(genome);
      const publicGenome = toPublicGenome(genome);

      expect(publicGenome.formal.primarySigil).toBe('Severis');
      expect(publicGenome.formal.revealed).toBe(true);
    });
  });

  describe('revealSigil()', () => {
    it('should set revealed to true', () => {
      let genome = createGenome({
        userId: 'user-123',
        classification: mockClassification,
        psychometrics: mockPsychometrics,
        sephiroticBalance: {},
        orishaResonance: { primary: 'Ogun', shadow: 'Yemoja' }
      });

      expect(genome.formal.revealed).toBe(false);

      genome = revealSigil(genome);

      expect(genome.formal.revealed).toBe(true);
      expect(genome.formal.revealedAt).toBeDefined();
    });
  });

  describe('getPrimarySigil()', () => {
    it('should return null when not revealed', () => {
      const genome = createGenome({
        userId: 'user-123',
        classification: mockClassification,
        psychometrics: mockPsychometrics,
        sephiroticBalance: {},
        orishaResonance: { primary: 'Ogun', shadow: 'Yemoja' }
      });

      expect(getPrimarySigil(genome)).toBeNull();
    });

    it('should return sigil when revealed', () => {
      let genome = createGenome({
        userId: 'user-123',
        classification: mockClassification,
        psychometrics: mockPsychometrics,
        sephiroticBalance: {},
        orishaResonance: { primary: 'Ogun', shadow: 'Yemoja' }
      });

      genome = revealSigil(genome);

      expect(getPrimarySigil(genome)).toBe('Severis');
    });

    it('should return sigil when forced', () => {
      const genome = createGenome({
        userId: 'user-123',
        classification: mockClassification,
        psychometrics: mockPsychometrics,
        sephiroticBalance: {},
        orishaResonance: { primary: 'Ogun', shadow: 'Yemoja' }
      });

      expect(getPrimarySigil(genome, true)).toBe('Severis');
    });
  });

  describe('validateGenome()', () => {
    it('should validate a valid genome', () => {
      const genome = createGenome({
        userId: 'user-123',
        classification: mockClassification,
        psychometrics: mockPsychometrics,
        sephiroticBalance: {},
        orishaResonance: { primary: 'Ogun', shadow: 'Yemoja' }
      });

      expect(validateGenome(genome)).toBe(true);
    });

    it('should reject invalid objects', () => {
      expect(validateGenome(null)).toBe(false);
      expect(validateGenome({})).toBe(false);
      expect(validateGenome({ id: 'test' })).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize correctly', () => {
      const genome = createGenome({
        userId: 'user-123',
        classification: mockClassification,
        psychometrics: mockPsychometrics,
        sephiroticBalance: {},
        orishaResonance: { primary: 'Ogun', shadow: 'Yemoja' }
      });

      const json = serializeGenome(genome);
      const restored = deserializeGenome(json);

      expect(restored.id).toBe(genome.id);
      expect(restored.userId).toBe(genome.userId);
      expect(restored.archetype.primary.designation).toBe(genome.archetype.primary.designation);
      expect(restored.createdAt).toBeInstanceOf(Date);
    });
  });
});

describe('Genome Encoding', () => {
  describe('encodeSignalsToGenome()', () => {
    it('should create genome from signals', () => {
      const signals: Signal[] = [
        {
          type: 'explicit',
          source: 'quiz',
          timestamp: new Date(),
          data: {
            kind: 'choice',
            questionId: 'test-1',
            value: 0,
            archetypeWeights: { 'V-2': 0.8 }
          }
        }
      ];

      const genome = encodeSignalsToGenome('user-456', signals);

      expect(genome.userId).toBe('user-456');
      expect(genome.archetype.primary).toBeDefined();
    });
  });

  describe('updateGenomeWithSignals()', () => {
    it('should increment version', () => {
      const genome = encodeSignalsToGenome('user-789', []);
      const updated = updateGenomeWithSignals(genome, []);

      expect(updated.version).toBe(genome.version + 1);
    });

    it('should preserve userId', () => {
      const genome = encodeSignalsToGenome('user-789', []);
      const updated = updateGenomeWithSignals(genome, []);

      expect(updated.userId).toBe('user-789');
    });
  });

  describe('calculateGenomeSimilarity()', () => {
    it('should return 1 for identical genomes', () => {
      const genome = encodeSignalsToGenome('user-1', []);
      const similarity = calculateGenomeSimilarity(genome, genome);

      expect(similarity).toBeCloseTo(1, 2);
    });

    it('should return value between 0 and 1', () => {
      const genome1 = encodeSignalsToGenome('user-1', []);
      const genome2 = encodeSignalsToGenome('user-2', [
        {
          type: 'explicit',
          source: 'quiz',
          timestamp: new Date(),
          data: {
            kind: 'choice',
            questionId: 'test',
            value: 1,
            archetypeWeights: { 'R-10': 1.0, 'Ø': -1.0 }
          }
        }
      ]);

      const similarity = calculateGenomeSimilarity(genome1, genome2);

      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });
  });
});
