export interface Course {
  id: string;
  name: string;
  code: string | null;
  period: string | null;
  is_mandatory: boolean;
  subject_type: string | null;
  created_at: string;
}

export interface Folder {
  id: string;
  course_id: string;
  parent_folder_id: string | null;
  name: string;
  created_at: string;
}

export interface File {
  id: string;
  folder_id: string;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  description: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
}

export interface FolderComment {
  id: string;
  folder_id: string;
  user_id: string;
  content: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
}