/**
 * Supabase Module
 *
 * Exports Supabase clients and database types.
 */

export { supabase, createClient } from './client';
export { createServerClient, createAdminClient } from './server';
export type { Database, Json } from './types';
export type {
  User,
  PsychometricProfile,
  AestheticPreference,
  ConstellationProfile,
  RepresentationProfile,
  QuizSession,
  ProfileHistory,
  ContentItem,
  UserContentInteraction,
  SubcultureCluster,
  UserSubcultureFit,
} from './types';
