-- Stored procedure to recalculate scores for a question after gabarito change
-- Recalculates: is_correct on answers, total_score/percentage/passed on attempts,
-- and cleans up stale study_recommendations and study_plan_versions
CREATE OR REPLACE FUNCTION recalculate_question_scores(p_question_id UUID)
RETURNS TABLE(updated_answers INT, updated_attempts INT, deleted_recommendations INT, deleted_plan_versions INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_answers INT := 0;
  v_updated_attempts INT := 0;
  v_deleted_recs INT := 0;
  v_deleted_plans INT := 0;
  v_affected_attempt_ids UUID[];
BEGIN
  -- 1. Recalculate is_correct for all answers to this question
  UPDATE exam_answers ea
  SET is_correct = (ea.selected_answer = q.correct_answer)
  FROM questions q
  WHERE ea.question_id = q.id
    AND q.id = p_question_id;

  GET DIAGNOSTICS v_updated_answers = ROW_COUNT;

  -- Collect affected attempt IDs
  SELECT ARRAY_AGG(DISTINCT attempt_id) INTO v_affected_attempt_ids
  FROM exam_answers
  WHERE question_id = p_question_id;

  -- 2. Recalculate exam_attempts (total_score, percentage, passed)
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
    WHERE ea.attempt_id = ANY(v_affected_attempt_ids)
    GROUP BY ea.attempt_id, e.total_questions, e.passing_score
  ) sub
  WHERE att.id = sub.attempt_id;

  GET DIAGNOSTICS v_updated_attempts = ROW_COUNT;

  -- 3. Delete stale study_recommendations (auto-regenerated on next view)
  DELETE FROM study_recommendations
  WHERE attempt_id = ANY(v_affected_attempt_ids);

  GET DIAGNOSTICS v_deleted_recs = ROW_COUNT;

  -- 4. Delete stale study_plan_versions (rebuilt live from current answers)
  DELETE FROM study_plan_versions
  WHERE attempt_id = ANY(v_affected_attempt_ids);

  GET DIAGNOSTICS v_deleted_plans = ROW_COUNT;

  RETURN QUERY SELECT v_updated_answers, v_updated_attempts, v_deleted_recs, v_deleted_plans;
END;
$$;
