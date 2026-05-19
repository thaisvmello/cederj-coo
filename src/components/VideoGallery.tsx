"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Play, Loader, Video, Plus, X, ExternalLink } from 'lucide-react';
import type { VideoLesson } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import toast from 'react-hot-toast';

export function VideoGallery({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, [courseId]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('video_lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Erro ao buscar vídeos:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertToEmbedUrl = (url: string): string => {
    let convertedUrl = url.trim();

    // YouTube Patterns
    const ytMatch = convertedUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/);
    if (ytMatch) {
      if (convertedUrl.includes('watch?v=')) {
        const id = new URL(convertedUrl).searchParams.get('v');
        return `https://www.youtube.com/embed/${id}`;
      }
      if (convertedUrl.includes('youtu.be/')) {
        const id = convertedUrl.split('/').pop()?.split('?')[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      if (convertedUrl.includes('/shorts/')) {
        const id = convertedUrl.split('/shorts/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${id}`;
      }
    }
    return convertedUrl;
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;
    if (!user) {
      toast.error('Você precisa estar logado para adicionar vídeos');
      return;
    }

    setSubmitting(true);
    try {
      const embedUrl = convertToEmbedUrl(newUrl);
      const { error } = await supabase.from('video_lessons').insert({
        course_id: courseId,
        title: newTitle.trim(),
        url: embedUrl
      });

      if (error) throw error;

      toast.success('Vídeo adicionado à galeria!');
      setNewTitle('');
      setNewUrl('');
      setShowAddModal(false);
      fetchVideos();
    } catch (error) {
      console.error('Erro ao adicionar vídeo:', error);
      toast.error('Erro ao salvar vídeo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('Deseja remover este vídeo da galeria?')) return;

    try {
      const { error } = await supabase.from('video_lessons').delete().eq('id', id);
      if (error) throw error;
      setVideos(prev => prev.filter(v => v.id !== id));
      toast.success('Vídeo removido');
    } catch (error) {
      toast.error('Erro ao remover vídeo');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Carregando galeria...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-blue-500" />
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">GALERIA DE VIDEOAULAS</h3>
        </div>
        {/* Botão de adição liberado para todos os usuários logados */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-md shadow-blue-100"
        >
          <Plus className="w-3.5 h-3.5" />
          Colar Link de Vídeo
        </button>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-16 bg-white border-2 border-dashed border-gray-200 rounded-2xl">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Nenhuma videoaula enviada ainda.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 text-xs text-blue-600 font-bold hover:underline"
          >
            Seja o primeiro a compartilhar um link!
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
              <div className="relative w-full pt-[56.25%] bg-black">
                <iframe
                  src={video.url}
                  title={video.title}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <h4 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {video.title}
                </h4>
                <div className="flex items-center justify-between mt-auto">
                  <a 
                    href={video.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-gray-400 hover:text-blue-500 flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> Ver Original
                  </a>
                  {/* Botão de exclusão visível apenas para Admins */}
                  {isAdmin && (
                    <button 
                      onClick={() => handleDeleteVideo(video.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Excluir vídeo (Apenas Admin)"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Plus className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Adicionar Vídeo</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddVideo} className="p-6 space-y-5">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong>Dica:</strong> Você pode colar links do YouTube (comum ou Shorts) e nós converteremos automaticamente para o formato de exibição.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Título da Aula</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Revisão para AP1 - Parte 1"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Link do Vídeo</label>
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="Cole aqui a URL do YouTube ou ScreenApp"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newUrl.trim()}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Adicionar à Galeria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}