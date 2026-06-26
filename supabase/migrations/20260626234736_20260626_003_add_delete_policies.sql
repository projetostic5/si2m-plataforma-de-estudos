
-- Add DELETE policies for admin to fix delete buttons

CREATE POLICY "Admins can delete disciplines"
  ON disciplines FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete dimensions"
  ON dimensions FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete themes"
  ON themes FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete topics"
  ON topics FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete questions"
  ON questions FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete exams"
  ON exams FOR DELETE
  TO authenticated
  USING (is_admin());
