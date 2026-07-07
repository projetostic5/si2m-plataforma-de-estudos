-- Delete duplicate incomplete exam_attempts, keeping only the most recent one per (exam_id, user_id)
-- First, identify attempts to keep (most recent per exam/user pair)
DELETE FROM exam_attempts a1
WHERE a1.completed_at IS NULL
AND EXISTS (
  SELECT 1 FROM exam_attempts a2
  WHERE a2.exam_id = a1.exam_id
    AND a2.user_id = a1.user_id
    AND a2.completed_at IS NULL
    AND a2.started_at > a1.started_at
);
