/**
 * Supabase Database Types
 *
 * These types match the schema in supabase/migrations/001_initial_schema.sql
 * Generate with: npx supabase gen types typescript --project-id bxxtnokttllihwbrlswi > src/lib/supabase/types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      psychometric_profiles: {
        Row: {
          id: string;
          user_id: string;
          openness: number;
          conscientiousness: number;
          extraversion: number;
          agreeableness: number;
          neuroticism: number;
          novelty_seeking: number;
          aesthetic_sensitivity: number;
          risk_tolerance: number;
          trait_confidence: Json;
          overall_confidence: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          openness: number;
          conscientiousness: number;
          extraversion: number;
          agreeableness: number;
          neuroticism: number;
          novelty_seeking: number;
          aesthetic_sensitivity: number;
          risk_tolerance: number;
          trait_confidence?: Json;
          overall_confidence?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          openness?: number;
          conscientiousness?: number;
          extraversion?: number;
          agreeableness?: number;
          neuroticism?: number;
          novelty_seeking?: number;
          aesthetic_sensitivity?: number;
          risk_tolerance?: number;
          trait_confidence?: Json;
          overall_confidence?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      aesthetic_preferences: {
        Row: {
          id: string;
          user_id: string;
          color_palette_vector: number[];
          darkness_preference: number;
          complexity_preference: number;
          symmetry_preference: number;
          organic_vs_synthetic: number;
          minimal_vs_maximal: number;
          tempo_range_min: number;
          tempo_range_max: number;
          energy_range_min: number;
          energy_range_max: number;
          harmonic_dissonance_tolerance: number;
          rhythm_preference: number;
          acoustic_vs_digital: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          color_palette_vector?: number[];
          darkness_preference?: number;
          complexity_preference?: number;
          symmetry_preference?: number;
          organic_vs_synthetic?: number;
          minimal_vs_maximal?: number;
          tempo_range_min?: number;
          tempo_range_max?: number;
          energy_range_min?: number;
          energy_range_max?: number;
          harmonic_dissonance_tolerance?: number;
          rhythm_preference?: number;
          acoustic_vs_digital?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          color_palette_vector?: number[];
          darkness_preference?: number;
          complexity_preference?: number;
          symmetry_preference?: number;
          organic_vs_synthetic?: number;
          minimal_vs_maximal?: number;
          tempo_range_min?: number;
          tempo_range_max?: number;
          energy_range_min?: number;
          energy_range_max?: number;
          harmonic_dissonance_tolerance?: number;
          rhythm_preference?: number;
          acoustic_vs_digital?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      constellation_profiles: {
        Row: {
          id: string;
          user_id: string;
          primary_constellation_id: string;
          blend_weights: Json;
          subtaste_index: number;
          explorer_score: number;
          early_adopter_score: number;
          enhanced_interpretation: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          primary_constellation_id: string;
          blend_weights?: Json;
          subtaste_index?: number;
          explorer_score?: number;
          early_adopter_score?: number;
          enhanced_interpretation?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          primary_constellation_id?: string;
          blend_weights?: Json;
          subtaste_index?: number;
          explorer_score?: number;
          early_adopter_score?: number;
          enhanced_interpretation?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      representation_profiles: {
        Row: {
          id: string;
          user_id: string;
          energy: number;
          complexity: number;
          temporal_style: 'looped' | 'evolving' | 'episodic';
          sensory_density: number;
          identity_projection: number;
          ambiguity_tolerance: number;
          constraints: Json;
          version: number;
          input_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          energy: number;
          complexity: number;
          temporal_style: 'looped' | 'evolving' | 'episodic';
          sensory_density: number;
          identity_projection: number;
          ambiguity_tolerance: number;
          constraints?: Json;
          version?: number;
          input_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          energy?: number;
          complexity?: number;
          temporal_style?: 'looped' | 'evolving' | 'episodic';
          sensory_density?: number;
          identity_projection?: number;
          ambiguity_tolerance?: number;
          constraints?: Json;
          version?: number;
          input_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      quiz_sessions: {
        Row: {
          id: string;
          user_id: string | null;
          status: 'in_progress' | 'completed' | 'abandoned';
          selected_questions: Json;
          answers: Json;
          current_question_index: number;
          estimated_confidence: number | null;
          started_at: string;
          completed_at: string | null;
          is_returning_user: boolean;
          previous_profile_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          status?: 'in_progress' | 'completed' | 'abandoned';
          selected_questions?: Json;
          answers?: Json;
          current_question_index?: number;
          estimated_confidence?: number | null;
          started_at?: string;
          completed_at?: string | null;
          is_returning_user?: boolean;
          previous_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          status?: 'in_progress' | 'completed' | 'abandoned';
          selected_questions?: Json;
          answers?: Json;
          current_question_index?: number;
          estimated_confidence?: number | null;
          started_at?: string;
          completed_at?: string | null;
          is_returning_user?: boolean;
          previous_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profile_history: {
        Row: {
          id: string;
          user_id: string;
          profile_type: 'psychometric' | 'aesthetic' | 'constellation' | 'representation';
          profile_data: Json;
          version: number;
          trigger: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          profile_type: 'psychometric' | 'aesthetic' | 'constellation' | 'representation';
          profile_data: Json;
          version?: number;
          trigger?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          profile_type?: 'psychometric' | 'aesthetic' | 'constellation' | 'representation';
          profile_data?: Json;
          version?: number;
          trigger?: string;
          created_at?: string;
        };
      };
      content_items: {
        Row: {
          id: string;
          content_type: 'image' | 'track' | 'ai_artifact';
          title: string | null;
          description: string | null;
          thumbnail_url: string | null;
          content_url: string | null;
          feature_embedding: number[] | null;
          tags: string[];
          subculture_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content_type: 'image' | 'track' | 'ai_artifact';
          title?: string | null;
          description?: string | null;
          thumbnail_url?: string | null;
          content_url?: string | null;
          feature_embedding?: number[] | null;
          tags?: string[];
          subculture_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content_type?: 'image' | 'track' | 'ai_artifact';
          title?: string | null;
          description?: string | null;
          thumbnail_url?: string | null;
          content_url?: string | null;
          feature_embedding?: number[] | null;
          tags?: string[];
          subculture_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_content_interactions: {
        Row: {
          id: string;
          user_id: string;
          content_id: string;
          interaction_type: 'view' | 'like' | 'dislike' | 'save' | 'share' | 'skip';
          rating: number | null;
          dwell_time_ms: number | null;
          source: 'quiz' | 'swipe' | 'feed';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_id: string;
          interaction_type: 'view' | 'like' | 'dislike' | 'save' | 'share' | 'skip';
          rating?: number | null;
          dwell_time_ms?: number | null;
          source: 'quiz' | 'swipe' | 'feed';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_id?: string;
          interaction_type?: 'view' | 'like' | 'dislike' | 'save' | 'share' | 'skip';
          rating?: number | null;
          dwell_time_ms?: number | null;
          source?: 'quiz' | 'swipe' | 'feed';
          created_at?: string;
        };
      };
      subculture_clusters: {
        Row: {
          id: string;
          cluster_id: string;
          name: string | null;
          stage: 'forming' | 'stable' | 'dissolving' | 'mainstreaming';
          coherence: number;
          member_count: number;
          aesthetic_constraints: Json;
          centroid: Json | null;
          tags: string[];
          constellation_hints: string[];
          embedding_vector: number[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cluster_id: string;
          name?: string | null;
          stage?: 'forming' | 'stable' | 'dissolving' | 'mainstreaming';
          coherence?: number;
          member_count?: number;
          aesthetic_constraints?: Json;
          centroid?: Json | null;
          tags?: string[];
          constellation_hints?: string[];
          embedding_vector?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cluster_id?: string;
          name?: string | null;
          stage?: 'forming' | 'stable' | 'dissolving' | 'mainstreaming';
          coherence?: number;
          member_count?: number;
          aesthetic_constraints?: Json;
          centroid?: Json | null;
          tags?: string[];
          constellation_hints?: string[];
          embedding_vector?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_subculture_fits: {
        Row: {
          id: string;
          user_id: string;
          subculture_id: string;
          affinity_score: number;
          early_adopter_score: number;
          adoption_stage: 'early' | 'mid' | 'late';
          first_seen_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subculture_id: string;
          affinity_score: number;
          early_adopter_score: number;
          adoption_stage: 'early' | 'mid' | 'late';
          first_seen_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subculture_id?: string;
          affinity_score?: number;
          early_adopter_score?: number;
          adoption_stage?: 'early' | 'mid' | 'late';
          first_seen_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// Convenience type aliases
export type User = Database['public']['Tables']['users']['Row'];
export type PsychometricProfile = Database['public']['Tables']['psychometric_profiles']['Row'];
export type AestheticPreference = Database['public']['Tables']['aesthetic_preferences']['Row'];
export type ConstellationProfile = Database['public']['Tables']['constellation_profiles']['Row'];
export type RepresentationProfile = Database['public']['Tables']['representation_profiles']['Row'];
export type QuizSession = Database['public']['Tables']['quiz_sessions']['Row'];
export type ProfileHistory = Database['public']['Tables']['profile_history']['Row'];
export type ContentItem = Database['public']['Tables']['content_items']['Row'];
export type UserContentInteraction = Database['public']['Tables']['user_content_interactions']['Row'];
export type SubcultureCluster = Database['public']['Tables']['subculture_clusters']['Row'];
export type UserSubcultureFit = Database['public']['Tables']['user_subculture_fits']['Row'];
