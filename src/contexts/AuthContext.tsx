import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, first_name: string, last_name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função para sincronizar perfil via Edge Function
const syncUserProfile = async (token: string) => {
  try {
    const response = await fetch('https://tlcdhwjkdbrmrwueeokj.supabase.co/functions/v1/sync-user-profile', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao sincronizar perfil:', errorData);
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Erro na sincronização do perfil:', error);
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, email: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url')
      .eq('id', userId)
      .single();

    return {
      id: userId,
      email: email || '',
      first_name: profile?.first_name,
      last_name: profile?.last_name,
      avatar_url: profile?.avatar_url,
    };
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Tentar sincronizar perfil primeiro
        const syncedUser = await syncUserProfile(session.access_token);
        
        if (syncedUser) {
          setUser(syncedUser);
        } else {
          // Fallback para busca direta
          const userData = await fetchProfile(session.user.id, session.user.email || '');
          setUser(userData);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Sincronizar perfil após login
        const syncedUser = await syncUserProfile(session.access_token);
        
        if (syncedUser) {
          setUser(syncedUser);
        } else {
          // Fallback
          const userData = await fetchProfile(session.user.id, session.user.email || '');
          setUser(userData);
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, first_name: string, last_name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
        }
      }
    });
    
    if (error) throw error;

    if (data.user) {
      // Aguardar um momento para o trigger do banco processar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sincronizar perfil
      if (data.session?.access_token) {
        await syncUserProfile(data.session.access_token);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;

    // Sincronizar perfil após login
    if (data.session?.access_token) {
      await syncUserProfile(data.session.access_token);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}