/**
 * @subtaste/sdk - API Client
 *
 * Client for interacting with subtaste REST API.
 */

import type {
  TasteGenome,
  TasteGenomePublic,
  Signal,
  Glyph,
  Sigil,
  Designation
} from '@subtaste/core';

/**
 * Client configuration
 */
export interface SubtasteClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

/**
 * Public profile response
 */
export interface PublicProfile {
  glyph: Glyph;
  essence: string;
  creativeMode: string;
  confidence: number;
  secondary?: {
    glyph: Glyph;
    confidence: number;
  };
}

/**
 * Quiz submission input
 */
export interface QuizSubmission {
  userId?: string;
  sessionId?: string;
  responses: Array<{
    questionId: string;
    response: number | number[];
  }>;
}

/**
 * Quiz result response
 */
export interface QuizResult {
  success: boolean;
  userId: string;
  glyph: Glyph;
  confidence: number;
  genome?: TasteGenomePublic;
}

/**
 * Signal submission input
 */
export interface SignalSubmission {
  type: 'behaviour' | 'feedback';
  events: Array<{
    type: string;
    itemId: string;
    timestamp?: string;
    metadata?: Record<string, unknown>;
  }>;
}

/**
 * Subtaste API client
 */
export class SubtasteClient {
  private config: SubtasteClientConfig;

  constructor(config: SubtasteClientConfig) {
    this.config = {
      timeout: 10000,
      ...config
    };
  }

  /**
   * Get headers for requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  /**
   * Make a request
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get full genome (server-side only)
   */
  async getGenome(userId: string): Promise<TasteGenome> {
    return this.request<TasteGenome>(`/api/genome/${userId}`);
  }

  /**
   * Get public profile (client-safe)
   */
  async getPublicProfile(userId: string): Promise<PublicProfile> {
    return this.request<PublicProfile>(`/api/profile/${userId}/public`);
  }

  /**
   * Get public genome
   */
  async getPublicGenome(userId: string): Promise<TasteGenomePublic> {
    return this.request<TasteGenomePublic>(`/api/profile/${userId}`);
  }

  /**
   * Submit quiz responses
   */
  async submitQuiz(submission: QuizSubmission): Promise<QuizResult> {
    return this.request<QuizResult>('/api/quiz', {
      method: 'POST',
      body: JSON.stringify(submission)
    });
  }

  /**
   * Submit signals
   */
  async submitSignals(userId: string, submission: SignalSubmission): Promise<void> {
    await this.request(`/api/signals/${userId}`, {
      method: 'POST',
      body: JSON.stringify(submission)
    });
  }

  /**
   * Request sigil reveal
   */
  async revealSigil(userId: string): Promise<{ sigil: Sigil }> {
    return this.request<{ sigil: Sigil }>(`/api/profile/${userId}/sigil`, {
      method: 'POST'
    });
  }

  /**
   * Check if user has a profile
   */
  async hasProfile(userId: string): Promise<boolean> {
    try {
      await this.getPublicProfile(userId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get archetype distribution
   */
  async getDistribution(userId: string): Promise<Record<Designation, number>> {
    const genome = await this.getPublicGenome(userId);
    return genome.archetype.distribution;
  }
}

/**
 * Create a new client
 */
export function createClient(config: SubtasteClientConfig): SubtasteClient {
  return new SubtasteClient(config);
}
