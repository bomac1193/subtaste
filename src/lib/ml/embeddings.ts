/**
 * Cross-Modal Embedding System
 *
 * Provides hooks for ML-based embeddings:
 * - Images → CLIP / Vision Transformer
 * - Music/audio → Wav2Vec / OpenL3
 * - Text/symbolic → Hugging Face embeddings
 *
 * Combines psychometric + interaction data into latent taste vectors
 * for constellation assignment and subculture scoring.
 */

import { TraitId, ALL_TRAITS } from '../quiz/item-bank';
import { TraitScore } from '../quiz/scoring';
import { ConstellationId, CONSTELLATION_IDS } from '../constellations/types';

// =============================================================================
// Types
// =============================================================================

export interface EmbeddingVector {
  vector: number[];
  dimension: number;
  source: 'clip' | 'wav2vec' | 'openl3' | 'huggingface' | 'psychometric' | 'composite';
  timestamp: Date;
}

export interface TasteVector {
  /** Psychometric embedding (from quiz responses) */
  psychometric: number[];
  /** Visual aesthetic embedding */
  visual?: number[];
  /** Music/audio aesthetic embedding */
  audio?: number[];
  /** Combined latent representation */
  composite: number[];
  /** Confidence in each component */
  componentConfidence: {
    psychometric: number;
    visual: number;
    audio: number;
  };
}

export interface ContentEmbedding {
  contentId: string;
  contentType: 'image' | 'track' | 'ai_artifact';
  embedding: number[];
  tags: string[];
  subcultureHints?: ConstellationId[];
}

export interface SubcultureFit {
  subcultureId: string;
  affinityScore: number;
  earlyAdopterScore: number;
  confidence: number;
}

// =============================================================================
// Psychometric Embedding (Local Implementation)
// =============================================================================

/**
 * Convert trait scores to psychometric embedding vector
 * This is a deterministic mapping that preserves trait relationships
 */
export function createPsychometricEmbedding(
  traits: Record<TraitId, TraitScore>
): EmbeddingVector {
  const dimension = 64; // Embedding dimension
  const vector: number[] = new Array(dimension).fill(0);

  // Map each trait to a portion of the embedding
  const traitsPerSlice = Math.floor(dimension / ALL_TRAITS.length);

  ALL_TRAITS.forEach((trait, traitIndex) => {
    const score = traits[trait]?.score ?? 0.5;
    const confidence = traits[trait]?.confidence ?? 0;
    const startIdx = traitIndex * traitsPerSlice;

    // Primary trait value
    vector[startIdx] = score;

    // Confidence-weighted variations
    vector[startIdx + 1] = score * confidence;
    vector[startIdx + 2] = (score - 0.5) * 2; // Centered
    vector[startIdx + 3] = Math.abs(score - 0.5) * 2; // Extremity

    // Interaction terms with adjacent traits (if space allows)
    if (traitsPerSlice > 4) {
      const nextTrait = ALL_TRAITS[(traitIndex + 1) % ALL_TRAITS.length];
      const nextScore = traits[nextTrait]?.score ?? 0.5;
      vector[startIdx + 4] = score * nextScore;
      vector[startIdx + 5] = score - nextScore;
    }
  });

  // Normalize to unit vector
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= norm;
    }
  }

  return {
    vector,
    dimension,
    source: 'psychometric',
    timestamp: new Date(),
  };
}

/**
 * Combine multiple embeddings into composite taste vector
 */
export function createTasteVector(
  psychometric: Record<TraitId, TraitScore>,
  visual?: EmbeddingVector,
  audio?: EmbeddingVector
): TasteVector {
  const psychoEmbed = createPsychometricEmbedding(psychometric);

  // Calculate component confidence
  const psychoConfidence =
    Object.values(psychometric).reduce((sum, t) => sum + t.confidence, 0) /
    ALL_TRAITS.length;

  const componentConfidence = {
    psychometric: psychoConfidence,
    visual: visual ? 0.8 : 0, // Placeholder confidence for ML components
    audio: audio ? 0.8 : 0,
  };

  // Create composite embedding
  const compositeDim = 128;
  const composite: number[] = new Array(compositeDim).fill(0);

  // Psychometric contribution (weighted by confidence)
  const psychoWeight = 0.5;
  for (let i = 0; i < Math.min(psychoEmbed.dimension, compositeDim / 2); i++) {
    composite[i] = psychoEmbed.vector[i] * psychoWeight * psychoConfidence;
  }

  // Visual contribution (if available)
  if (visual) {
    const visualWeight = 0.25;
    const offset = compositeDim / 4;
    for (let i = 0; i < Math.min(visual.dimension, compositeDim / 4); i++) {
      composite[offset + i] += visual.vector[i] * visualWeight * componentConfidence.visual;
    }
  }

  // Audio contribution (if available)
  if (audio) {
    const audioWeight = 0.25;
    const offset = compositeDim / 2;
    for (let i = 0; i < Math.min(audio.dimension, compositeDim / 4); i++) {
      composite[offset + i] += audio.vector[i] * audioWeight * componentConfidence.audio;
    }
  }

  // Normalize composite
  const norm = Math.sqrt(composite.reduce((sum, v) => sum + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < composite.length; i++) {
      composite[i] /= norm;
    }
  }

  return {
    psychometric: psychoEmbed.vector,
    visual: visual?.vector,
    audio: audio?.vector,
    composite,
    componentConfidence,
  };
}

// =============================================================================
// ML Backend Hooks (Placeholders for external services)
// =============================================================================

export interface MLBackendConfig {
  clipEndpoint?: string;
  wav2vecEndpoint?: string;
  embeddingEndpoint?: string;
  apiKey?: string;
}

/**
 * ML Backend client for cross-modal embeddings
 * In production, this would call external ML services
 */
export class MLEmbeddingClient {
  private config: MLBackendConfig;

  constructor(config: MLBackendConfig = {}) {
    this.config = config;
  }

  /**
   * Get image embedding using CLIP/ViT
   * TODO: Implement actual CLIP API call
   */
  async getImageEmbedding(imageUrl: string): Promise<EmbeddingVector> {
    // Placeholder: In production, call CLIP API
    console.log(`[ML] Would fetch CLIP embedding for: ${imageUrl}`);

    // Return mock embedding
    const dimension = 512;
    const vector = new Array(dimension).fill(0).map(() => Math.random() * 2 - 1);
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    vector.forEach((_, i) => (vector[i] /= norm));

    return {
      vector,
      dimension,
      source: 'clip',
      timestamp: new Date(),
    };
  }

  /**
   * Get audio embedding using Wav2Vec/OpenL3
   * TODO: Implement actual audio embedding API call
   */
  async getAudioEmbedding(audioUrl: string): Promise<EmbeddingVector> {
    // Placeholder: In production, call audio embedding API
    console.log(`[ML] Would fetch audio embedding for: ${audioUrl}`);

    const dimension = 512;
    const vector = new Array(dimension).fill(0).map(() => Math.random() * 2 - 1);
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    vector.forEach((_, i) => (vector[i] /= norm));

    return {
      vector,
      dimension,
      source: 'wav2vec',
      timestamp: new Date(),
    };
  }

  /**
   * Get text embedding using Hugging Face
   * TODO: Implement actual HF API call
   */
  async getTextEmbedding(text: string): Promise<EmbeddingVector> {
    // Placeholder: In production, call HF API
    console.log(`[ML] Would fetch text embedding for: ${text.substring(0, 50)}...`);

    const dimension = 384;
    const vector = new Array(dimension).fill(0).map(() => Math.random() * 2 - 1);
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    vector.forEach((_, i) => (vector[i] /= norm));

    return {
      vector,
      dimension,
      source: 'huggingface',
      timestamp: new Date(),
    };
  }

  /**
   * Batch embed multiple content items
   */
  async batchEmbed(
    items: { id: string; type: 'image' | 'audio' | 'text'; url: string }[]
  ): Promise<Map<string, EmbeddingVector>> {
    const results = new Map<string, EmbeddingVector>();

    // In production, this would batch API calls
    for (const item of items) {
      let embedding: EmbeddingVector;

      switch (item.type) {
        case 'image':
          embedding = await this.getImageEmbedding(item.url);
          break;
        case 'audio':
          embedding = await this.getAudioEmbedding(item.url);
          break;
        case 'text':
          embedding = await this.getTextEmbedding(item.url);
          break;
      }

      results.set(item.id, embedding);
    }

    return results;
  }
}

// =============================================================================
// Similarity & Scoring Functions
// =============================================================================

/**
 * Cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Calculate content affinity score based on taste vector
 */
export function calculateContentAffinity(
  tasteVector: TasteVector,
  contentEmbedding: ContentEmbedding
): number {
  // Use composite vector for similarity
  const similarity = cosineSimilarity(tasteVector.composite, contentEmbedding.embedding);

  // Normalize to 0-100 score
  return Math.round((similarity + 1) * 50);
}

/**
 * Calculate subculture fit scores
 */
export function calculateSubcultureFits(
  tasteVector: TasteVector,
  subcultureEmbeddings: Map<string, number[]>
): SubcultureFit[] {
  const fits: SubcultureFit[] = [];

  for (const [subcultureId, embedding] of subcultureEmbeddings) {
    const similarity = cosineSimilarity(tasteVector.composite, embedding);

    fits.push({
      subcultureId,
      affinityScore: Math.round((similarity + 1) * 50),
      earlyAdopterScore: 50, // Would be calculated from timing data
      confidence: tasteVector.componentConfidence.psychometric,
    });
  }

  // Sort by affinity
  fits.sort((a, b) => b.affinityScore - a.affinityScore);

  return fits;
}

// =============================================================================
// Adaptive Learning Hooks
// =============================================================================

/**
 * Update taste vector based on new interaction
 * This enables long-term adaptation as users interact with content
 */
export function updateTasteVectorFromInteraction(
  currentVector: TasteVector,
  contentEmbedding: ContentEmbedding,
  interactionType: 'like' | 'dislike' | 'save' | 'skip',
  interactionStrength: number = 1 // 0-1, based on rating/dwell time
): TasteVector {
  const learningRate = 0.05 * interactionStrength;

  // Direction of update based on interaction type
  const direction = interactionType === 'like' || interactionType === 'save' ? 1 : -1;

  // Update composite vector
  const newComposite = [...currentVector.composite];
  for (let i = 0; i < newComposite.length && i < contentEmbedding.embedding.length; i++) {
    newComposite[i] += direction * learningRate * contentEmbedding.embedding[i];
  }

  // Renormalize
  const norm = Math.sqrt(newComposite.reduce((sum, v) => sum + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < newComposite.length; i++) {
      newComposite[i] /= norm;
    }
  }

  return {
    ...currentVector,
    composite: newComposite,
  };
}

/**
 * Calculate information gain for a potential question
 * Used for adaptive question selection
 */
export function calculateInformationGain(
  currentVariances: Record<TraitId, number>,
  question: { primaryTrait: TraitId; discrimination: number }
): number {
  const traitVariance = currentVariances[question.primaryTrait] ?? 0.25;

  // Higher variance + higher discrimination = more information gain
  const expectedVarianceReduction = traitVariance * question.discrimination * 0.1;

  return expectedVarianceReduction;
}

export default {
  createPsychometricEmbedding,
  createTasteVector,
  MLEmbeddingClient,
  cosineSimilarity,
  calculateContentAffinity,
  calculateSubcultureFits,
  updateTasteVectorFromInteraction,
  calculateInformationGain,
};
