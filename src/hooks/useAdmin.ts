import { useAuth } from '../contexts/AuthContext';

const ADMIN_EMAIL = 'thaisverissimomello@gmail.com';

export function useAdmin() {
  const { user } = useAuth();
  
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  
  return { isAdmin };
}