"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Play, Loader, Video, Plus, X } from 'lucide-react';
import type { VideoLesson } from '../lib/types';
import { useAdmin } from '../hooks/useAdmin';
import toast from 'react-hot-toast';

export function VideoGallery({ courseId }: { courseId: string }) {
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
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Erro ao buscar vídeos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    setSubmitting(true);
    try {
      // Converter URL do YouTube para formato embed se necessário
      let embedUrl = newUrl.trim();
      if (embedUrl.includes('youtube.com/watch?v=')) {
        embedUrl = embedUrl.replace('watch?v=', 'embed/');
      } else if (embedUrl.includes('youtu.be/')) {
        embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
      }

      const { error } = await supabase.from('video_lessons').insert({
        course_id: courseId,
        title: newTitle.trim(),
        url: embedUrl
      });

      if (error) throw error;

      toast.success('Vídeo adicionado com sucesso!');
      setNewTitle('');
      setNewUrl('');
      setShowAddModal(false);
      fetchVideos();
    } catch (error) {
      console.error('Erro ao adicionar vídeo:', error);
      toast.error('Erro ao adicionar vídeo');
    } finally {
      setSubmitting(false);
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
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Galeria de Videoaulas</h3>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Vídeo
          </button>
        )}
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-16 bg-white border-2 border-dashed border-gray-200 rounded-2xl">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Nenhuma videoaula disponível para esta disciplina.</p>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-xs text-blue-600 font-bold hover:underline"
            >
              Clique aqui para adicionar o primeiro vídeo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <div className="relative aspect-video w-full bg-black">
                <iframe
                  src={video.url}
                  title={video.title}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-4">
                <h4 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {video.title}
                </h4>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Video className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Adicionar Videoaula</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddVideo} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Título do Vídeo</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Aula 01 - Introdução à Economia"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">URL do Vídeo (YouTube/Vimeo)</label>
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
                <p className="text-[10px] text-gray-400 mt-1.5">Dica: Use o link direto do navegador ou o link de compartilhamento.</p>
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
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Salvar Vídeo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}