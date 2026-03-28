Pasta) e permitir navegação">
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, MessageSquare, Loader, RefreshCw, Folder, BookOpen, ExternalLink } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import type { FolderComment } from '../lib/types';
import toast from 'react-hot-toast';
import { AvatarFallback } from './AvatarFallback';

interface ExtendedComment extends FolderComment {
  course_name?: string;
  course_id?: string;
}

export function AdminCommentsManager() {
  const { isAdmin } = useAdmin();
  const [comments, setComments] = useState<ExtendedComment[]>([]);
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
        supabase.from('folders').select('id, name, course_id').in('id', folderIds)
      ]);

      const courseIds = Array.from(new Set(foldersData?.map(f => f.course_id) || []));
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, name')
        .in('id', courseIds);

      const formatted = commentsData.map(comment => {
        const profile = profilesData?.find(p => p.id === comment.user_id);
        const folder = foldersData?.find(f => f.id === comment.folder_id);
        const course = coursesData?.find(c => c.id === folder?.course_id);
        
        return {
          ...comment,
          first_name: profile?.first_name || 'Estudante',
          last_name: profile?.last_name || '',
          avatar_url: profile?.avatar_url || null,
          folder_name: folder?.name || 'Pasta não encontrada',
          course_name: course?.name || 'Disciplina não encontrada',
          course_id: course?.id
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
    if (!confirm('Tem certeza que deseja excluir este comentário?')) return;
    
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

  const handleNavigateToFolder = (courseId?: string) => {
    // Como o app usa navegação por estado, redirecionamos para a home
    // O admin pode então buscar a disciplina rapidamente
    window.location.href = '/';
  };

  if (!isAdmin) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-800">Moderação de Comentários</h3>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {comments.length}
            </span>
          </div>
          <button 
            onClick={loadComments} 
            className="p-2 hover:bg-gray-200 rounded-lg transition text-gray-600"
            title="Atualizar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-100 max-h-[700px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Carregando discussões...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum comentário para moderar.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="p-5 hover:bg-gray-50/50 transition group">
              <div className="flex gap-4">
                <AvatarFallback 
                  avatarUrl={comment.avatar_url} 
                  name={`${comment.first_name} ${comment.last_name}`} 
                  size="md" 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-bold text-gray-900">{comment.first_name} {comment.last_name}</span>
                      <p className="text-[10px] text-gray-400 font-medium">
                        {new Date(comment.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleNavigateToFolder(comment.course_id)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Ver no Acervo"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Excluir comentário"
                      >
                        {deletingId === comment.id ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Caminho do Comentário */}
                  <div className="flex items-center flex-wrap gap-1.5 mb-3">
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-md">
                      <BookOpen className="w-3 h-3 text-blue-500" />
                      <span className="text-[10px] font-bold text-blue-700 uppercase truncate max-w-[150px]">
                        {comment.course_name}
                      </span>
                    </div>
                    <span className="text-gray-300 text-xs">/</span>
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md">
                      <Folder className="w-3 h-3 text-gray-500" />
                      <span className="text-[10px] font-bold text-gray-600 uppercase truncate max-w-[150px]">
                        {comment.folder_name}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                    <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}