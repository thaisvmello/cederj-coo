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
        const userData = await fetchProfile(session.user.id, session.user.email || '');
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const userData = await fetchProfile(session.user.id, session.user.email || '');
        setUser(userData);
        
        // Se for o primeiro login (especialmente Google), o trigger do banco cuida,
        // mas garantimos aqui que o estado local reflita os metadados se o perfil ainda não existir
        if (!userData.first_name && session.user.user_metadata?.full_name) {
          const fullName = session.user.user_metadata.full_name;
          setUser(prev => prev ? {
            ...prev,
            first_name: fullName.split(' ')[0],
            last_name: fullName.split(' ').slice(1).join(' '),
            avatar_url: session.user.user_metadata.avatar_url
          } : null);
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
      // O trigger handle_new_user no banco já deve criar o perfil,
      // mas fazemos um upsert aqui por segurança e redundância
      await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          first_name,
          last_name,
          updated_at: new Date().toISOString(),
        });
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
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