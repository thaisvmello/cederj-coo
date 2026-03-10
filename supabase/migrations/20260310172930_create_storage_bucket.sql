/*
  # Create Storage Bucket for Course Materials

  1. Storage
    - Create `course-materials` bucket for file uploads
    - Enable public access for PDF viewing
    - Set up access policies for authenticated users only
*/

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('course-materials', 'course-materials', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'course-materials' AND
    (auth.role() = 'authenticated')
  );

CREATE POLICY "Authenticated users can read files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'course-materials' AND
    (auth.role() = 'authenticated')
  );
