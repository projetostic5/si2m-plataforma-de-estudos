import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string;
  role: 'admin' | 'student';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

export type Discipline = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  is_active: boolean;
  created_at: string;
};

export type Dimension = {
  id: string;
  discipline_id: string;
  name: string;
  description?: string;
  created_at: string;
};

export type Theme = {
  id: string;
  dimension_id: string;
  name: string;
  description?: string;
  created_at: string;
};

export type Topic = {
  id: string;
  theme_id: string;
  name: string;
  created_at: string;
};

export type Question = {
  id: string;
  discipline_id: string;
  dimension_id: string;
  theme_id: string;
  topic_id?: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e?: string;
  correct_answer: 'a' | 'b' | 'c' | 'd' | 'e';
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  specialty?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  discipline?: Discipline;
  dimension?: Dimension;
  theme?: Theme;
  topic?: Topic;
};

export type StudentProfile = {
  id: string;
  user_id: string;
  available_hours_per_week: number;
  preferred_study_times?: string[];
  next_exam_date?: string;
  study_style: 'intensive' | 'balanced' | 'relaxed';
  learning_preferences?: string[];
  additional_notes?: string;
  // onboarding fields
  hours_per_day?: number;
  knowledge_level?: 'basic' | 'intermediate' | 'advanced';
  preferred_study_model?: string;
  is_working?: boolean;
  sleep_hours?: number;
  has_limitations?: boolean;
  onboarding_completed?: boolean;
  created_at: string;
  updated_at: string;
};

export type Exam = {
  id: string;
  name: string;
  description?: string;
  discipline_id: string;
  duration_minutes: number;
  total_questions: number;
  passing_score: number;
  is_active: boolean;
  is_public: boolean;
  counts_for_study_plan: boolean;
  max_attempts?: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  discipline?: Discipline;
};

export type ExamQuestion = {
  id: string;
  exam_id: string;
  question_id: string;
  question_order: number;
  created_at: string;
  question?: Question;
};

export type ExamAttempt = {
  id: string;
  exam_id: string;
  user_id: string;
  started_at: string;
  completed_at?: string;
  time_spent_seconds?: number;
  total_score: number;
  percentage: number;
  passed: boolean;
  question_order?: string[];
  created_at: string;
  exam?: Exam;
};

export type ExamAnswer = {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_answer?: 'a' | 'b' | 'c' | 'd' | 'e';
  is_correct?: boolean;
  time_spent_seconds?: number;
  created_at: string;
  question?: Question;
};

export type StudyMaterial = {
  id: string;
  discipline_id: string;
  dimension_id: string;
  theme_id?: string | null;
  name: string;
  file_path: string;
  file_name: string;
  file_size?: number | null;
  file_type?: string | null;
  uploaded_by: string;
  created_at: string;
  dimension?: { name: string };
  theme?: { name: string } | null;
};

export type StudyPlanVersion = {
  id: string;
  user_id: string;
  attempt_id: string;
  completed_at: string;
  plan_data: import('./studyPlanGenerator').StudyPlanData;
  created_at: string;
};

export type StudyRecommendation = {
  id: string;
  attempt_id: string;
  dimension_id: string;
  theme_id?: string;
  incorrect_count: number;
  total_questions: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  recommended_hours: number;
  study_notes?: string;
  created_at: string;
  dimension?: Dimension;
  theme?: Theme;
};
