/*
  # Medical Exam SaaS - Initial Schema

  1. New Tables
    - `profiles`: User profiles with role distinction (admin/student)
    - `disciplines`: Medical disciplines (e.g., Infectologia)
    - `dimensions`: Knowledge areas within disciplines
    - `themes`: Themes within dimensions
    - `topics`: Topics within themes
    - `questions`: Exam questions with multiple choice options
    - `student_profiles`: Student lifestyle and study preferences
    - `exams`: Simulated exams
    - `exam_questions`: Questions assigned to exams
    - `exam_attempts`: Student exam attempt records
    - `exam_answers`: Individual question answers
    - `study_recommendations`: AI-generated study recommendations

  2. Security
    - RLS enabled on all tables
    - Admin can manage all content
    - Students can only access their own data and active exams
    - Public registration allowed
*/

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Medical disciplines
CREATE TABLE IF NOT EXISTS disciplines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  color text DEFAULT '#3b82f6',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Knowledge areas (dimensions)
CREATE TABLE IF NOT EXISTS dimensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_id uuid NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(discipline_id, name)
);

-- Themes within dimensions
CREATE TABLE IF NOT EXISTS themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id uuid NOT NULL REFERENCES dimensions(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(dimension_id, name)
);

-- Topics within themes
CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id uuid NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(theme_id, name)
);

-- Exam questions
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_id uuid NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  dimension_id uuid NOT NULL REFERENCES dimensions(id) ON DELETE CASCADE,
  theme_id uuid NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES topics(id) ON DELETE SET NULL,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  option_e text,
  correct_answer text NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd', 'e')),
  explanation text,
  difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Student lifestyle profiles
CREATE TABLE IF NOT EXISTS student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  available_hours_per_week integer DEFAULT 20,
  preferred_study_times text[],
  next_exam_date date,
  study_style text DEFAULT 'balanced' CHECK (study_style IN ('intensive', 'balanced', 'relaxed')),
  learning_preferences text[],
  additional_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Simulated exams
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  discipline_id uuid NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  duration_minutes integer NOT NULL DEFAULT 60,
  total_questions integer DEFAULT 0,
  passing_score numeric DEFAULT 70.0,
  is_active boolean DEFAULT true,
  is_public boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Questions assigned to exams
CREATE TABLE IF NOT EXISTS exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  question_order integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(exam_id, question_id),
  UNIQUE(exam_id, question_order)
);

-- Student exam attempts
CREATE TABLE IF NOT EXISTS exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  time_spent_seconds integer,
  total_score integer DEFAULT 0,
  percentage numeric DEFAULT 0,
  passed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(exam_id, user_id, started_at)
);

-- Individual question answers
CREATE TABLE IF NOT EXISTS exam_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer text CHECK (selected_answer IN ('a', 'b', 'c', 'd', 'e')),
  is_correct boolean,
  time_spent_seconds integer,
  created_at timestamptz DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

-- Study recommendations
CREATE TABLE IF NOT EXISTS study_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  dimension_id uuid NOT NULL REFERENCES dimensions(id) ON DELETE CASCADE,
  theme_id uuid REFERENCES themes(id) ON DELETE CASCADE,
  incorrect_count integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  priority text NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  recommended_hours numeric NOT NULL DEFAULT 0,
  study_notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_recommendations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Admin role check helper function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disciplines policies (public read for active, admin manages)
CREATE POLICY "Anyone can view active disciplines"
  ON disciplines FOR SELECT
  TO authenticated
  USING (is_active = true OR is_admin());

CREATE POLICY "Admins can insert disciplines"
  ON disciplines FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update disciplines"
  ON disciplines FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Dimensions policies
CREATE POLICY "Users can view dimensions"
  ON dimensions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM disciplines 
      WHERE disciplines.id = dimensions.discipline_id 
      AND (disciplines.is_active = true OR is_admin())
    )
  );

CREATE POLICY "Admins can insert dimensions"
  ON dimensions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update dimensions"
  ON dimensions FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Themes policies
CREATE POLICY "Users can view themes"
  ON themes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dimensions
      JOIN disciplines ON disciplines.id = dimensions.discipline_id
      WHERE dimensions.id = themes.dimension_id
      AND (disciplines.is_active = true OR is_admin())
    )
  );

CREATE POLICY "Admins can insert themes"
  ON themes FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update themes"
  ON themes FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Topics policies
CREATE POLICY "Users can view topics"
  ON topics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM themes
      JOIN dimensions ON dimensions.id = themes.dimension_id
      JOIN disciplines ON disciplines.id = dimensions.discipline_id
      WHERE themes.id = topics.theme_id
      AND (disciplines.is_active = true OR is_admin())
    )
  );

CREATE POLICY "Admins can insert topics"
  ON topics FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update topics"
  ON topics FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Questions policies
CREATE POLICY "Admins can view all questions"
  ON questions FOR SELECT
  TO authenticated
  USING (is_admin() OR is_active = true);

CREATE POLICY "Admins can insert questions"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update questions"
  ON questions FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Student profiles policies
CREATE POLICY "Students can view own profile"
  ON student_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Students can insert own profile"
  ON student_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can update own profile"
  ON student_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Exams policies
CREATE POLICY "Users can view active exams"
  ON exams FOR SELECT
  TO authenticated
  USING ((is_active = true AND is_public = true) OR is_admin() OR created_by = auth.uid());

CREATE POLICY "Admins can insert exams"
  ON exams FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update exams"
  ON exams FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Exam questions policies
CREATE POLICY "Users can view exam questions"
  ON exam_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_questions.exam_id
      AND (exams.is_active = true OR is_admin())
    )
  );

CREATE POLICY "Admins can insert exam questions"
  ON exam_questions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete exam questions"
  ON exam_questions FOR DELETE
  TO authenticated
  USING (is_admin());

-- Exam attempts policies
CREATE POLICY "Students can view own attempts"
  ON exam_attempts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Students can insert own attempts"
  ON exam_attempts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can update own attempts"
  ON exam_attempts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Exam answers policies
CREATE POLICY "Students can view own answers"
  ON exam_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_attempts
      WHERE exam_attempts.id = exam_answers.attempt_id
      AND (exam_attempts.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Students can insert own answers"
  ON exam_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exam_attempts
      WHERE exam_attempts.id = exam_answers.attempt_id
      AND exam_attempts.user_id = auth.uid()
    )
  );

-- Study recommendations policies
CREATE POLICY "Students can view own recommendations"
  ON study_recommendations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_attempts
      WHERE exam_attempts.id = study_recommendations.attempt_id
      AND (exam_attempts.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "System can insert recommendations"
  ON study_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exam_attempts
      WHERE exam_attempts.id = study_recommendations.attempt_id
      AND (exam_attempts.user_id = auth.uid() OR is_admin())
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_discipline ON questions(discipline_id);
CREATE INDEX IF NOT EXISTS idx_questions_dimension ON questions(dimension_id);
CREATE INDEX IF NOT EXISTS idx_questions_theme ON questions(theme_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user ON exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_attempt ON exam_answers(attempt_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at
    BEFORE UPDATE ON student_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exams_updated_at
    BEFORE UPDATE ON exams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
