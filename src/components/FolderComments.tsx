import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Send, User, MessageSquare, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { FolderComment } from '../lib/types';
import toast from 'react-hot-toast';

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
    // Select comments and join with profiles to get first_name, last_name, avatar_url
    const { data, error } = await supabase
      .from('folder_comments')
      .select(`
        *,
        profiles!inner (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('folder_id', folderId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading comments:', error);
    } else {
      // Map data to include profile fields at top level for easier use
      const mapped = (data || []).map(c => ({
        ...c,
        first_name: c.profiles?.first_name,
        last_name: c.profiles?.last_name,
        avatar_url: c.profiles?.avatar_url,
      }));
      setComments(mapped);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('folder_comments').insert({
        folder_id: folderId,
        user_id: user.id,
        content: newComment.trim()
      });

      if (error) throw error;

      setNewComment('');
      await loadComments(); // Recarrega a lista para mostrar o novo comentário
      toast.success('Comentário enviado!');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Erro ao enviar comentário');
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('folder_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comentário removido');
    } catch (error) {
      toast.error('Erro ao remover comentário');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-bold text-gray-700">Comentários e Dicas</h3>
      </div>

      <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4">Nenhum comentário ainda. Seja o primeiro!</p>
        ) : (
          comments.map((comment) => {
            const displayName = `${comment.first_name || ''} ${comment.last_name || ''}`.trim() || 'Estudante';
            return (
              <div key={comment.id} className="flex gap-3 group">
                {comment.avatar_url ? (
                  <img
                    src={comment.avatar_url}
                    alt={displayName}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-900 truncate">
                      {comment.user_id === user?.id ? 'Você' : displayName}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5 break-words">{comment.content}</p>
                </div>
                {comment.user_id === user?.id && (
                  <button 
                    onClick={() => deleteComment(comment.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escreva um comentário ou dica..."
            className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}