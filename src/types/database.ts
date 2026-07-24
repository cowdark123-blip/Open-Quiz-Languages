export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Profile {
  id: string
  display_name: string
  avatar_url?: string | null
  streak_count: number
  target_band?: string
  last_active_date?: string | null
  created_at: string
}

export interface VocabSet {
  id: string
  user_id: string
  title: string
  description?: string | null
  target_language: string
  category: string
  is_public: boolean
  created_at: string
  item_count?: number
}

export interface VocabItem {
  id: string
  set_id: string
  term: string
  definition: string
  ipa?: string | null
  example_sentence?: string | null
  vietnamese_translation?: string | null
  synonyms?: string[] | null
  audio_url?: string | null
  created_at: string
  is_starred?: boolean
  srsProgress?: UserSRSProgress
}

export interface UserSRSProgress {
  id: string
  user_id: string
  item_id: string
  interval: number
  repetition: number
  ease_factor: number
  next_review_date: string
  last_reviewed_at?: string | null
}

export interface SpeakingSession {
  id: string
  user_id: string
  target_word_ids: string[]
  scenario_prompt: string
  audio_url?: string | null
  transcript?: string | null
  ai_feedback?: Json | null
  pronunciation_scores?: {
    accuracy_score: number
    fluency_score: number
    completeness_score: number
    prosody_score: number
    words?: Array<{
      word: string
      accuracy: number
      status: 'good' | 'average' | 'poor'
    }>
  } | null
  created_at: string
}

export interface QuizResult {
  id: string
  user_id: string
  set_id: string
  score: number
  total_questions: number
  correct_answers: number
  wrong_answers: number
  created_at: string
}
