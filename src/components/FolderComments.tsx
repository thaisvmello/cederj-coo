import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Send, MessageSquare, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { FolderComment } from '../lib/types';
import toast from 'react-hot-toast';
import { AvatarFallback } from './AvatarFallback';

interface FolderCommentsProps {
  folderId: string;
}

export function FolderComments({ folderId }: FolderCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<FolderComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [folderId]);

  const loadComments = async () => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('folder_comments')
        .select('*')
        .eq('folder_id', folderId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      const userIds = Array.from(new Set(commentsData.map(comment => comment.user_id)));
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', userIds);

      // Garantir que todos os usuários tenham perfil
      const allUserIds = new Set(userIds.concat([user?.id]));
      const missingProfiles = Array.from(allUserIds).filter(id => 
        !profilesData?.some(p => p.id === id)
      );

      if (missingProfiles.length > 0) {
        console.warn(`Perfis faltando para usuários: ${missingProfiles.join(', ')}`);
        // Criar perfis vazios para usuários faltantes
        const missingProfilesData = missingProfiles.map(id => ({
          id,
          first_name: 'Estudante',
          last_name: '',
          avatar_url: null
        }));
        await supabase.from('profiles').insert(missingProfilesData);
      }

      const commentsWithProfiles = commentsData.map(comment => {
        const profile = profilesData?.find(p => p.id === comment.user_id) || 
                        missingProfilesData.find(p => p.id === comment.user_id);
        return {
          ...comment,
          first_name: profile?.first_name || 'Estudante',
          last_name: profile?.last_name || '',
          avatar_url: profile?.avatar_url || null,
        };
      });

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error in loadComments:', error);
    }
  };

  // ... (resto do componente permanece o mesmo)
}