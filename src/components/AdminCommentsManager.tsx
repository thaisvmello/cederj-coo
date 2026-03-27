import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, MessageSquare, Loader, RefreshCw, Folder } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import type { FolderComment } from '../lib/types';
import toast from 'react-hot-toast';
import { AvatarFallback } from './AvatarFallback';

export function AdminCommentsManager() {
  const { isAdmin } = useAdmin();
  const [comments, setComments] = useState<FolderComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) loadComments();
  }, [isAdmin]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('folder_comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      const userIds = Array.from(new Set(commentsData.map(c => c.user_id)));
      const folderIds = Array.from(new Set(commentsData.map(c => c.folder_id)));

      const [{ data: profilesData }, { data: foldersData }] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name, avatar_url').in('id', userIds),
        supabase.from('folders').select('id, name').in('id', folderIds)
      ]);

      const formatted = commentsData.map(comment => {
        const profile = profilesData?.find(p => p.id === comment.user_id);
        const folder = foldersData?.find(f => f.id === comment.folder_id);
        return {
          ...comment,
          first_name: profile?.first_name || 'Estudante',
          last_name: profile?.last_name || '',
          avatar_url: profile?.avatar_url || null,
          folder_name: folder?.name || 'Pasta não encontrada'
        };
      });

      setComments(formatted);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      toast.error('Erro ao carregar comentários');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from('folder_comments').delete().eq('id', id);
      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== id));
      toast.success('Comentário removido');
    } catch (error) {
      console.error('Erro ao remover comentário:', error);
      toast.error('Erro ao remover comentário');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <h3 className="font-bold text-gray-800">Gerenciar Todos os Comentários</h3>
            <span className="bg-gray-200 text-gray-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {comments.length}
            </span>
          </div>
          <button onClick={loadComments} className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhum comentário encontrado</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="p-4 hover:bg-gray-50 transition group">
              <div className="flex gap-3">
                <AvatarFallback avatarUrl={comment.avatar_url} name={`${comment.first_name} ${comment.last_name}`} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-900">{comment.first_name} {comment.last_name}</span>
                    <span className="text-[10px] text-gray-400">{new Date(comment.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Folder className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-600 uppercase">{comment.folder_name}</span>
                  </div>
                  <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">{comment.content}</p>
                </div>
                <button
                  onClick={() => handleDelete(comment.id)}
                  disabled={deletingId === comment.id}
                  className="p-2 text-gray-400 hover:text-red-600 transition opacity-0 group-hover:opacity-100"
                >
                  {deletingId === comment.id ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}