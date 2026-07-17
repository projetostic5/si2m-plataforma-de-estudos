-- Recalculate is_correct for all answers to question 239
-- based on the current correct_answer in the questions table
UPDATE exam_answers ea
SET is_correct = (ea.selected_answer = q.correct_answer)
FROM questions q
WHERE ea.question_id = q.id
  AND q.id = '27cde2bf-023b-4139-b9f4-356a362392eb';

-- Recalculate exam_attempts (total_score, percentage, passed) for all affected attempts
UPDATE exam_attempts att
SET
  total_score = sub.correct_count,
  percentage  = (sub.correct_count::numeric / sub.total_questions) * 100,
  passed      = ((sub.correct_count::numeric / sub.total_questions) * 100 >= sub.passing_score::numeric)
FROM (
  SELECT
    ea.attempt_id,
    COUNT(*) FILTER (WHERE ea.is_correct) AS correct_count,
    e.total_questions,
    e.passing_score
  FROM exam_answers ea
  JOIN exam_attempts a ON a.id = ea.attempt_id
  JOIN exams e ON e.id = a.exam_id
  WHERE ea.attempt_id IN (
    SELECT DISTINCT attempt_id
    FROM exam_answers
    WHERE question_id = '27cde2bf-023b-4139-b9f4-356a362392eb'
  )
  GROUP BY ea.attempt_id, e.total_questions, e.passing_score
) sub
WHERE att.id = sub.attempt_id;

-- Delete stale study_recommendations for affected attempts
-- (ExamResults auto-regenerates them on next view with updated data)
DELETE FROM study_recommendations
WHERE attempt_id IN (
  SELECT DISTINCT attempt_id
  FROM exam_answers
  WHERE question_id = '27cde2bf-023b-4139-b9f4-356a362392eb'
);

-- Delete stale study_plan_versions for affected attempts
-- (StudyPlan component builds the live plan from current exam_answers,
--  so it will reflect the corrected scores automatically)
DELETE FROM study_plan_versions
WHERE attempt_id IN (
  SELECT DISTINCT attempt_id
  FROM exam_answers
  WHERE question_id = '27cde2bf-023b-4139-b9f4-356a362392eb'
);
