ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS hours_per_day integer CHECK (hours_per_day BETWEEN 2 AND 6),
  ADD COLUMN IF NOT EXISTS knowledge_level text CHECK (knowledge_level IN ('basic', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS preferred_study_model text,
  ADD COLUMN IF NOT EXISTS is_working boolean,
  ADD COLUMN IF NOT EXISTS sleep_hours integer,
  ADD COLUMN IF NOT EXISTS has_limitations boolean,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
