"use client";

import React, { useState, useEffect } from 'react';
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

      if (profilesError) throw profilesError;

      const commentsWithProfiles = commentsData.map(comment => {
        const profile = profilesData?.find((p: any) => p.id === comment.user_id);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('folder_comments').insert({
        folder_id: folderId,
        user_id: user.id,
        content: newComment.trim()
      });

      if (error) throw error;
      setNewComment('');
      loadComments();
      toast.success('Comentário enviado!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Erro ao enviar comentário');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('folder_comments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== id));
      toast.success('Comentário removido');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Erro ao remover comentário');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 flex flex-col h-full max-h-[500px]">
      <div className="p-4 border-b border-gray-50 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-bold text-gray-900">Comentários e Dicas</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400">Nenhum comentário ainda. Seja o primeiro!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <AvatarFallback 
                avatarUrl={comment.avatar_url} 
                name={`${comment.first_name} ${comment.last_name}`}
                size="sm"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-900">
                    {comment.first_name} {comment.last_name}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="relative">
                  <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-2 rounded-lg rounded-tl-none">
                    {comment.content}
                  </p>
                  {user?.id === comment.user_id && (
                    <button 
                      onClick={() => handleDelete(comment.id)}
                      className="absolute -right-2 -top-2 p-1 bg-white border border-gray-100 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-50">
        <div className="relative">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escreva uma dica ou dúvida..."
            className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}