-- Add shuffled question order storage to attempts
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS question_order jsonb;

-- Versioned study plan snapshots
CREATE TABLE study_plan_versions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_id   uuid        NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL,
  plan_data    jsonb       NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE study_plan_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_study_plan_versions" ON study_plan_versions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_study_plan_versions" ON study_plan_versions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_study_plan_versions" ON study_plan_versions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_study_plan_versions" ON study_plan_versions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
