export interface Course {
  id: string;
  name: string;
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
}
