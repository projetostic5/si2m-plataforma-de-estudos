/*
# Study Materials System

## Summary
Adds a study materials table and Supabase Storage bucket for the "Materiais de Apoio" feature.
Admin users can upload files organized by discipline → dimension → theme. Students can browse
and download these files.

## New Tables
- `study_materials`: Stores metadata for uploaded files
  - `id` (uuid, PK)
  - `discipline_id` (uuid, FK → disciplines): The discipline this material belongs to
  - `dimension_id` (uuid, FK → dimensions): The dimension (topic) folder
  - `theme_id` (uuid, nullable FK → themes): The theme (subtopic) subfolder, or NULL for dimension-level
  - `name` (text): Human-readable display name
  - `file_path` (text): Path inside the study-materials storage bucket
  - `file_name` (text): Original filename shown to students
  - `file_size` (bigint): File size in bytes
  - `file_type` (text): MIME type
  - `uploaded_by` (uuid, FK → auth.users): The admin who uploaded it
  - `created_at` (timestamptz)

## Security
- RLS enabled on `study_materials`
- SELECT: all authenticated users (admins + students)
- INSERT: only users with role = 'admin' in profiles table
- UPDATE: only admins
- DELETE: only admins
- Storage bucket `study-materials` (private, 50 MB limit)
- Storage SELECT: all authenticated users
- Storage INSERT: admins only
- Storage DELETE: admins only
*/

CREATE TABLE IF NOT EXISTS study_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_id uuid NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  dimension_id uuid NOT NULL REFERENCES dimensions(id) ON DELETE CASCADE,
  theme_id uuid REFERENCES themes(id) ON DELETE SET NULL,
  name text NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  file_type text,
  uploaded_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_study_materials" ON study_materials;
CREATE POLICY "select_study_materials" ON study_materials FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_study_materials" ON study_materials;
CREATE POLICY "insert_study_materials" ON study_materials FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "update_study_materials" ON study_materials;
CREATE POLICY "update_study_materials" ON study_materials FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "delete_study_materials" ON study_materials;
CREATE POLICY "delete_study_materials" ON study_materials FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Create storage bucket (private, 50 MB limit per file)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('study-materials', 'study-materials', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
DROP POLICY IF EXISTS "select_study_materials_storage" ON storage.objects;
CREATE POLICY "select_study_materials_storage" ON storage.objects FOR SELECT
TO authenticated USING (bucket_id = 'study-materials');

DROP POLICY IF EXISTS "insert_study_materials_storage" ON storage.objects;
CREATE POLICY "insert_study_materials_storage" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (
  bucket_id = 'study-materials' AND
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "update_study_materials_storage" ON storage.objects;
CREATE POLICY "update_study_materials_storage" ON storage.objects FOR UPDATE
TO authenticated USING (
  bucket_id = 'study-materials' AND
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "delete_study_materials_storage" ON storage.objects;
CREATE POLICY "delete_study_materials_storage" ON storage.objects FOR DELETE
TO authenticated USING (
  bucket_id = 'study-materials' AND
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
