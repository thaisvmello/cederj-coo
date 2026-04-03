"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Send, MessageSquare, Trash2, Loader, Reply, CornerDownRight, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import type { FolderComment } from '../lib/types';
import toast from 'react-hot-toast';
import { AvatarFallback } from './AvatarFallback';

interface FolderCommentsProps {
  folderId: string;
}

export function FolderComments({ folderId }: FolderCommentsProps) {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [comments, setComments] = useState<FolderComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<FolderComment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [folderId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('folder_comments')
        .select('*')
        .eq('folder_id', folderId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }

      const userIds = Array.from(new Set(commentsData.map((c: any) => c.user_id)));
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', userIds);

      const formattedComments = commentsData.map((comment: any) => {
        const profile = profilesData?.find((p: any) => p.id === comment.user_id);
        return {
          ...comment,
          first_name: profile?.first_name || 'Estudante',
          last_name: profile?.last_name || '',
          avatar_url: profile?.avatar_url || null,
        };
      });

      setComments(formattedComments);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      toast.error('Erro ao carregar discussão');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('folder_comments').insert({
        folder_id: folderId,
        user_id: user.id,
        content: newComment.trim(),
        parent_id: replyTo?.id || null
      });

      if (error) throw error;
      setNewComment('');
      setReplyTo(null);
      await loadComments();
      toast.success(replyTo ? 'Resposta enviada!' : 'Comentário enviado!');
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
      toast.error('Verifique se a coluna parent_id existe no banco de dados.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('folder_comments').delete().eq('id', id);
      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== id));
      toast.success('Comentário removido');
    } catch (error) {
      console.error('Erro ao remover comentário:', error);
      toast.error('Erro ao remover comentário');
    }
  };

  const commentTree = useMemo(() => {
    const roots = comments.filter(c => !c.parent_id);
    const replies = comments.filter(c => c.parent_id);

    return roots.map(root => ({
      ...root,
      replies: replies.filter(r => r.parent_id === root.id)
    }));
  }, [comments]);

  const CommentItem = ({ comment, isReply = false }: { comment: any, isReply?: boolean }) => (
    <div className={`relative ${isReply ? 'ml-10 mt-4' : 'mt-6 first:mt-0'}`}>
      {/* Linha vertical de conexão para respostas */}
      {isReply && (
        <div className="absolute -left-6 top-0 bottom-4 w-0.5 bg-blue-100 rounded-full" />
      )}

      <div className="flex gap-3 group">
        <AvatarFallback
          avatarUrl={comment.avatar_url}
          name={`${comment.first_name} ${comment.last_name}`}
          size="sm"
          className="z-10"
        />
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-900">
                {comment.first_name} {comment.last_name}
              </span>
              {isReply && <CornerDownRight className="w-3 h-3 text-blue-400" />}
            </div>
            <span className="text-[10px] text-gray-400">
              {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="relative">
            <p className={`text-xs text-gray-600 leading-relaxed p-3 rounded-2xl rounded-tl-none shadow-sm ${
              isReply ? 'bg-blue-50/40 border border-blue-100/50' : 'bg-gray-50 border border-gray-100'
            }`}>
              {comment.content}
            </p>

            <div className="flex items-center gap-4 mt-1.5 px-1">
              {!isReply && (
                <button
                  onClick={() => setReplyTo(comment)}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                >
                  <Reply className="w-3 h-3" /> Responder
                </button>
              )}
              {(isAdmin || user?.id === comment.user_id) && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-[10px] font-bold text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Excluir
                </button>
              )}
            </div>
          </div>

          {/* Renderização recursiva das respostas */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-1">
              {comment.replies.map((reply: any) => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 flex flex-col h-full max-h-[600px] shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-gray-900">Discussão e Dicas</h3>
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {comments.length} {comments.length === 1 ? 'comentário' : 'comentários'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Loader className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Carregando...</p>
          </div>
        ) : commentTree.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-xs text-gray-400">Nenhum comentário ainda. Seja o primeiro!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {commentTree.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50/30">
        <form onSubmit={handleSubmit} className="space-y-2">
          {replyTo && (
            <div className="flex items-center justify-between bg-blue-600 text-white px-3 py-1.5 rounded-t-xl animate-in slide-in-from-bottom-2">
              <span className="text-[10px] font-bold flex items-center gap-1.5">
                <Reply className="w-3 h-3" /> Respondendo a {replyTo.first_name}
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="hover:bg-white/20 rounded-full p-0.5 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="relative">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyTo ? "Escreva sua resposta..." : "Escreva uma dica ou dúvida..."}
              className={`w-full pl-4 pr-12 py-3 bg-white border border-gray-200 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition shadow-sm ${
                replyTo ? 'rounded-b-xl border-t-0' : 'rounded-xl'
              }`}
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md shadow-blue-100"
            >
              {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}