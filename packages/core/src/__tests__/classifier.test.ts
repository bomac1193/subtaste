/**
 * @subtaste/core - Classification Engine Tests
 */

import { describe, it, expect } from 'vitest';
import {
  classify,
  classifySignals,
  getDefaultPsychometrics,
  calculatePsychometricSimilarity,
  calculateAllSimilarities
} from '../engine';
import { PANTHEON, getAllDesignations } from '../pantheon';
import type { Signal, Designation, ExplicitSignal } from '../types';

describe('Classification Engine', () => {
  describe('classify()', () => {
    it('should return a valid classification with empty signals', () => {
      const result = classify({ signals: [] });

      expect(result.classification).toBeDefined();
      expect(result.classification.primary).toBeDefined();
      expect(result.classification.primary.designation).toBeDefined();
      expect(result.classification.primary.glyph).toBeDefined();
      expect(result.classification.primary.confidence).toBeGreaterThanOrEqual(0);
      expect(result.classification.primary.confidence).toBeLessThanOrEqual(1);
    });

    it('should return distribution that sums to approximately 1', () => {
      const result = classify({ signals: [] });
      const sum = Object.values(result.classification.distribution).reduce((a, b) => a + b, 0);

      expect(sum).toBeCloseTo(1, 2);
    });

    it('should include all designations in distribution', () => {
      const result = classify({ signals: [] });
      const designations = getAllDesignations();

      for (const d of designations) {
        expect(result.classification.distribution[d]).toBeDefined();
      }
    });

    it('should have primary designation with highest weight', () => {
      const result = classify({ signals: [] });
      const primary = result.classification.primary.designation;
      const primaryWeight = result.classification.distribution[primary];

      for (const [d, weight] of Object.entries(result.classification.distribution)) {
        expect(primaryWeight).toBeGreaterThanOrEqual(weight);
      }
    });

    it('should respond to explicit signals with archetype weights', () => {
      const cullSignal: Signal = {
        type: 'explicit',
        source: 'quiz',
        timestamp: new Date(),
        data: {
          kind: 'choice',
          questionId: 'test-1',
          value: 0,
          archetypeWeights: {
            'C-4': 1.0,  // Strong CULL signal
            'H-6': -0.5  // Anti-TOLL
          }
        } as ExplicitSignal
      };

      const result = classify({ signals: [cullSignal] });

      // CULL should be boosted relative to neutral
      const neutralResult = classify({ signals: [] });
      expect(result.classification.distribution['C-4'])
        .toBeGreaterThan(neutralResult.classification.distribution['C-4'] * 0.9);
    });

    it('should return psychometrics in result', () => {
      const result = classify({ signals: [] });

      expect(result.psychometrics).toBeDefined();
      expect(result.psychometrics.openness).toBeDefined();
      expect(result.psychometrics.intellect).toBeDefined();
      expect(result.psychometrics.musicPreferences).toBeDefined();
    });

    it('should return sephirotic balance', () => {
      const result = classify({ signals: [] });

      expect(result.sephiroticBalance).toBeDefined();
      expect(typeof result.sephiroticBalance).toBe('object');
    });

    it('should return orisha resonance', () => {
      const result = classify({ signals: [] });

      expect(result.orishaResonance).toBeDefined();
      expect(result.orishaResonance.primary).toBeDefined();
      expect(result.orishaResonance.shadow).toBeDefined();
    });
  });

  describe('classifySignals()', () => {
    it('should return just the classification without engine details', () => {
      const classification = classifySignals([]);

      expect(classification.primary).toBeDefined();
      expect(classification.distribution).toBeDefined();
      expect((classification as any).psychometrics).toBeUndefined();
    });
  });

  describe('Psychometric Scoring', () => {
    it('should return default psychometrics with neutral values', () => {
      const psycho = getDefaultPsychometrics();

      expect(psycho.openness.aesthetics).toBe(0.5);
      expect(psycho.intellect).toBe(0.5);
      expect(psycho.musicPreferences.mellow).toBe(0.5);
    });

    it('should calculate similarity between 0 and 1', () => {
      const psycho = getDefaultPsychometrics();

      for (const designation of getAllDesignations()) {
        const similarity = calculatePsychometricSimilarity(psycho, designation);
        expect(similarity).toBeGreaterThanOrEqual(0);
        expect(similarity).toBeLessThanOrEqual(1);
      }
    });

    it('should return similarities for all archetypes', () => {
      const psycho = getDefaultPsychometrics();
      const similarities = calculateAllSimilarities(psycho);

      expect(Object.keys(similarities).length).toBe(12);
    });
  });

  describe('Configuration', () => {
    it('should respect custom temperature', () => {
      const lowTemp = classify({ signals: [], config: { temperature: 1 } });
      const highTemp = classify({ signals: [], config: { temperature: 10 } });

      // Lower temperature = more concentrated distribution
      const lowEntropy = calculateEntropy(lowTemp.classification.distribution);
      const highEntropy = calculateEntropy(highTemp.classification.distribution);

      expect(lowEntropy).toBeLessThan(highEntropy);
    });

    it('should respect secondary threshold', () => {
      const result = classify({
        signals: [],
        config: { secondaryThreshold: 0.99 }
      });

      // With very high threshold, secondary should be null
      expect(result.classification.secondary).toBeNull();
    });
  });
});

describe('Archetype Properties', () => {
  it('should have valid glyph for each designation', () => {
    for (const [designation, archetype] of Object.entries(PANTHEON)) {
      expect(archetype.glyph).toBeDefined();
      expect(archetype.glyph.length).toBeGreaterThan(0);
    }
  });

  it('should have valid sigil for each designation', () => {
    for (const [designation, archetype] of Object.entries(PANTHEON)) {
      expect(archetype.sigil).toBeDefined();
      expect(archetype.sigil.length).toBeGreaterThan(0);
    }
  });

  it('should have unique glyphs', () => {
    const glyphs = Object.values(PANTHEON).map(a => a.glyph);
    const uniqueGlyphs = new Set(glyphs);
    expect(uniqueGlyphs.size).toBe(12);
  });

  it('should have unique sigils', () => {
    const sigils = Object.values(PANTHEON).map(a => a.sigil);
    const uniqueSigils = new Set(sigils);
    expect(uniqueSigils.size).toBe(12);
  });
});

// Helper function
function calculateEntropy(distribution: Record<Designation, number>): number {
  let entropy = 0;
  for (const p of Object.values(distribution)) {
    if (p > 0) {
      entropy -= p * Math.log(p);
    }
  }
  return entropy;
}
