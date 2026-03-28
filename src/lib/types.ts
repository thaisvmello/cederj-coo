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
  parent_id: string | null; // Adicionado para respostas
  content: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
  folder_name?: string;
}

export interface FileAction {
  id: string;
  file_id: string;
  requested_by: string;
  action_type: 'rename' | 'delete';
  new_name?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  file_name?: string;
  requester_name?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: 'folder_request' | 'new_content' | 'announcement' | 'file_action' | 'folder_request_rejection';
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface AuthState {
  session: AuthSession | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthError {
  code: string;
  message: string;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

export interface AuthContextType {
  authState: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (code: string, password: string) => Promise<void>;
  setError: (error: AuthError | null) => void;
  clearError: () => void;
}

export interface AuthProviderState {
  authState: AuthState;
  error: AuthError | null;
}