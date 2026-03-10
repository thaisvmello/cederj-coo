/*
  # File Storage System for Accounting Course Materials

  1. New Tables
    - `courses` - Accounting course disciplines (e.g., "Contabilidade Básica I")
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
    
    - `folders` - Main course folders and subfolders
      - `id` (uuid, primary key)
      - `course_id` (uuid, FK to courses)
      - `parent_folder_id` (uuid, nullable, self-referential for subfolders)
      - `name` (text) - folder name
      - `created_at` (timestamp)
    
    - `files` - Uploaded study materials
      - `id` (uuid, primary key)
      - `folder_id` (uuid, FK to folders)
      - `name` (text) - original filename
      - `file_path` (text) - storage path in Supabase
      - `file_size` (integer) - file size in bytes
      - `file_type` (text) - MIME type
      - `description` (text) - user-provided description
      - `uploaded_by` (uuid, FK to auth.users)
      - `created_at` (timestamp)
    
    - `file_access_logs` - Track file access for audit trail
      - `id` (uuid, primary key)
      - `file_id` (uuid, FK to files)
      - `accessed_by` (uuid, FK to auth.users)
      - `accessed_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Users can only upload/download files, never delete
    - Users can create subfolders within course folders
    - Course folders are shared among all authenticated users (read-only for file browsing)
    - File uploads are tracked by user but accessible to all authenticated users

  3. Initial Data
    - Create base courses with subdiscipline folders (AD1, AD2, AP1, AP2, AP3)
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create folders table for nested folder structure
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  parent_folder_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(parent_folder_id, name)
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  file_type text NOT NULL,
  description text,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create file access logs table
CREATE TABLE IF NOT EXISTS file_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  accessed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accessed_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_access_logs ENABLE ROW LEVEL SECURITY;

-- Courses policies (public read-only for authenticated users)
CREATE POLICY "Authenticated users can view all courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

-- Folders policies (authenticated users can view all folders and create subfolders)
CREATE POLICY "Authenticated users can view all folders"
  ON folders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create subfolders"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    parent_folder_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM folders WHERE id = folders.parent_folder_id
    )
  );

-- Files policies (authenticated users can upload and view, never delete)
CREATE POLICY "Authenticated users can view all files"
  ON files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can upload files"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM folders WHERE id = folder_id
    )
  );

-- File access logs policies
CREATE POLICY "Users can view their own access logs"
  ON file_access_logs FOR SELECT
  TO authenticated
  USING (accessed_by = auth.uid());

CREATE POLICY "Users can create access logs for their downloads"
  ON file_access_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    accessed_by = auth.uid()
  );

-- Insert base accounting courses
INSERT INTO courses (name) VALUES
  ('Contabilidade Básica I'),
  ('Contabilidade Básica II'),
  ('Contabilidade Intermediária'),
  ('Contabilidade Avançada'),
  ('Direito Tributário'),
  ('Auditoria'),
  ('Perícia Contábil'),
  ('Contabilidade Gerencial'),
  ('Análise das Demonstrações Contábeis'),
  ('Teoria da Contabilidade')
ON CONFLICT (name) DO NOTHING;

-- Create subfolders for each course
DO $$
DECLARE
  course_row RECORD;
  subfolder_names TEXT[] := ARRAY['AD1', 'AD2', 'AP1', 'AP2', 'AP3'];
  subfolder_name TEXT;
BEGIN
  FOR course_row IN SELECT id, name FROM courses LOOP
    FOREACH subfolder_name IN ARRAY subfolder_names LOOP
      INSERT INTO folders (course_id, name)
      VALUES (course_row.id, subfolder_name)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
