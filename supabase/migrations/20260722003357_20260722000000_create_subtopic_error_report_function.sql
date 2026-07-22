/*
# Create get_subtopic_error_report function

1. Purpose
   Returns a report of error percentages per subtopic (topic), based on
   completed exam attempts from Simulado A and B.

2. New Functions
   - get_subtopic_error_report(): returns table with columns:
     topico (text), subtopico (text), percentual_erros (numeric)

3. Security
   - Function is accessible to authenticated users.
   - Uses SECURITY DEFINER to allow joining across tables.
*/

CREATE OR REPLACE FUNCTION get_subtopic_error_report()
RETURNS TABLE (
  topico text,
  subtopico text,
  percentual_erros numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    d.name AS topico,
    t.name AS subtopico,
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE ea.is_correct = false) / NULLIF(COUNT(ea.id), 0),
      1
    ) AS percentual_erros
  FROM exam_answers ea
  JOIN exam_attempts att ON att.id = ea.attempt_id
  JOIN exams e ON e.id = att.exam_id
  JOIN questions q ON q.id = ea.question_id
  JOIN topics t ON t.id = q.topic_id
  JOIN themes th ON th.id = t.theme_id
  JOIN dimensions d ON d.id = q.dimension_id
  WHERE att.completed_at IS NOT NULL
    AND e.name IN ('SIMULADO A', 'SIMULADO B')
    AND ea.is_correct IS NOT NULL
  GROUP BY d.name, t.name
  ORDER BY percentual_erros DESC NULLS LAST, d.name, t.name;
$$;

GRANT EXECUTE ON FUNCTION get_subtopic_error_report() TO authenticated;
