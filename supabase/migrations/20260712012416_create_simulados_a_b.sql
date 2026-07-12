DO $$
DECLARE
  exam_a_id uuid;
  exam_b_id uuid;
  admin_id uuid := 'd3f43101-e5f2-408d-bdca-330d7eafb5ac';
  infectologia_id uuid := '320d46ab-fdaa-4f85-b406-9379c3227968';
  q record;
  ord integer;
BEGIN
  -- SIMULADO A
  INSERT INTO exams (name, description, discipline_id, duration_minutes, total_questions, passing_score, is_active, is_public, created_by)
  VALUES ('SIMULADO A', 'Simulado de Infectologia - Questões série 1', infectologia_id, 120, 35, 70.0, true, true, admin_id)
  RETURNING id INTO exam_a_id;

  ord := 0;
  FOR q IN
    SELECT id FROM questions
    WHERE question_text ~ '^\(1'
    ORDER BY RANDOM()
    LIMIT 35
  LOOP
    ord := ord + 1;
    INSERT INTO exam_questions (exam_id, question_id, question_order)
    VALUES (exam_a_id, q.id, ord);
  END LOOP;

  -- SIMULADO B
  INSERT INTO exams (name, description, discipline_id, duration_minutes, total_questions, passing_score, is_active, is_public, created_by)
  VALUES ('SIMULADO B', 'Simulado de Infectologia - Questões série 2', infectologia_id, 120, 30, 70.0, true, true, admin_id)
  RETURNING id INTO exam_b_id;

  ord := 0;
  FOR q IN
    SELECT id FROM questions
    WHERE question_text ~ '^\(2'
    ORDER BY question_text
    LIMIT 35
  LOOP
    ord := ord + 1;
    INSERT INTO exam_questions (exam_id, question_id, question_order)
    VALUES (exam_b_id, q.id, ord);
  END LOOP;
END $$;