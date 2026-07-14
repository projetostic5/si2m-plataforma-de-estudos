/*
# Add max_attempts to exams + enforce single-attempt limit

## Purpose
Each student may only take SIMULADO A and SIMULADO B once. Other exams can
still be retaken freely. The limit is configurable per-exam via a new
`max_attempts` column (NULL = unlimited).

## Changes

### 1. New column on `exams`
- `max_attempts` (integer, nullable, default NULL)
  - NULL means unlimited attempts allowed.
  - A positive integer means a student can complete the exam at most that
    many times.

### 2. Data update
- Set `max_attempts = 1` for SIMULADO A and SIMULADO B.

### 3. Trigger: enforce attempt limit at insert time
- Before a new row is inserted into `exam_attempts`, the trigger checks
  whether the student already has `max_attempts` completed attempts for
  that exam. If so, the insert is rejected with a clear error message.
- Only fires when `exams.max_attempts IS NOT NULL`.
- Uses SECURITY INVOKER and locked search_path for security.

### 4. RLS
- No policy changes. Existing CRUD policies on `exams` and
  `exam_attempts` remain unchanged.
*/

-- 1. Add column (idempotent)
ALTER TABLE exams
  ADD COLUMN IF NOT EXISTS max_attempts integer;

-- 2. Set SIMULADO A and B to single attempt
UPDATE exams SET max_attempts = 1
  WHERE name IN ('SIMULADO A', 'SIMULADO B');

-- 3. Trigger function to enforce max_attempts on insert
CREATE OR REPLACE FUNCTION public.enforce_exam_max_attempts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  max_attempts integer;
  completed_count integer;
BEGIN
  SELECT e.max_attempts INTO max_attempts
    FROM public.exams e
    WHERE e.id = NEW.exam_id;

  -- Only enforce if a limit is set
  IF max_attempts IS NOT NULL THEN
    SELECT count(*) INTO completed_count
      FROM public.exam_attempts ea
      WHERE ea.exam_id = NEW.exam_id
        AND ea.user_id = NEW.user_id
        AND ea.completed_at IS NOT NULL;

    IF completed_count >= max_attempts THEN
      RAISE EXCEPTION 'Você já atingiu o limite máximo de tentativas para este simulado.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Drop and recreate trigger (idempotent)
DROP TRIGGER IF EXISTS trg_enforce_exam_max_attempts ON public.exam_attempts;

CREATE TRIGGER trg_enforce_exam_max_attempts
  BEFORE INSERT ON public.exam_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_exam_max_attempts();
