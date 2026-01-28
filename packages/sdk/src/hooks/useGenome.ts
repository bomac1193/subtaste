/**
 * @subtaste/sdk - React Hook: useGenome
 *
 * Hook for accessing user taste genome in React applications.
 */

import { useState, useEffect, useCallback } from 'react';
import type { TasteGenomePublic, Glyph, Designation } from '@subtaste/core';
import type { SubtasteClient } from '../client';

/**
 * Genome hook state
 */
export interface UseGenomeState {
  genome: TasteGenomePublic | null;
  loading: boolean;
  error: Error | null;
  glyph: Glyph | null;
  confidence: number;
  hasProfile: boolean;
}

/**
 * Genome hook actions
 */
export interface UseGenomeActions {
  refresh: () => Promise<void>;
  revealSigil: () => Promise<void>;
}

/**
 * Genome hook return type
 */
export type UseGenomeReturn = UseGenomeState & UseGenomeActions;

/**
 * Hook for accessing user taste genome
 *
 * @param client - Subtaste API client
 * @param userId - User ID to fetch genome for
 */
export function useGenome(
  client: SubtasteClient,
  userId: string | null
): UseGenomeReturn {
  const [genome, setGenome] = useState<TasteGenomePublic | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchGenome = useCallback(async () => {
    if (!userId) {
      setGenome(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await client.getPublicGenome(userId);
      setGenome(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch genome'));
      setGenome(null);
    } finally {
      setLoading(false);
    }
  }, [client, userId]);

  const revealSigil = useCallback(async () => {
    if (!userId || !genome) return;

    try {
      await client.revealSigil(userId);
      await fetchGenome(); // Refresh to get updated reveal status
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to reveal sigil'));
    }
  }, [client, userId, genome, fetchGenome]);

  useEffect(() => {
    fetchGenome();
  }, [fetchGenome]);

  return {
    genome,
    loading,
    error,
    glyph: genome?.archetype.primary.glyph ?? null,
    confidence: genome?.archetype.primary.confidence ?? 0,
    hasProfile: genome !== null,
    refresh: fetchGenome,
    revealSigil
  };
}
