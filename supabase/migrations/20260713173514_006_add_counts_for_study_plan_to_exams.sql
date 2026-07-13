ALTER TABLE exams
  ADD COLUMN IF NOT EXISTS counts_for_study_plan boolean DEFAULT false;

-- Mark existing Simulado A and B
UPDATE exams
SET counts_for_study_plan = true
WHERE name IN ('SIMULADO A', 'SIMULADO B');
