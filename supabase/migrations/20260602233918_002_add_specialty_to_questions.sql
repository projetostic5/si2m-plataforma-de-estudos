/*
  # Add specialty field to questions

  1. Changes
    - Add `specialty` column to questions table for medical specialty info
    - Add index for specialty queries
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'specialty'
  ) THEN
    ALTER TABLE questions ADD COLUMN specialty text;
    CREATE INDEX idx_questions_specialty ON questions(specialty);
  END IF;
END $$;
