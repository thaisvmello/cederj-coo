"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link as LinkIcon, Plus, X, ExternalLink as OpenIcon, Loader, Trash2, Image as ImageIcon, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import type { ExternalLink } from '../lib/types';
import toast from 'react-hot-toast';

interface ExternalLinksListProps {
  courseId: string;
  folderId: string | null;
}

export function ExternalLinksList({ courseId, folderId }: ExternalLinksListProps) {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [links, setLinks] = useState<ExternalLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, [courseId, folderId]);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('external_links')
        .select('*')
        .eq('course_id', courseId);
      
      if (folderId) {
        query = query.eq('folder_id', folderId);
      } else {
        query = query.is('folder_id', null);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Erro ao buscar links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim() || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('external_links').insert({
        course_id: courseId,
        folder_id: folderId,
        title: title.trim(),
        url: url.trim(),
        description: description.trim() || null,
        uploaded_by: user.id
      });

      if (error) throw error;

      toast.success('Link adicionado com sucesso!');
      setTitle('');
      setUrl('');
      setDescription('');
      setShowAdd(false);
      fetchLinks();
    } catch (error) {
      console.error('Erro ao adicionar link:', error);
      toast.error('Erro ao salvar link.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja remover este link?')) return;
    try {
      const { error } = await supabase.from('external_links').delete().eq('id', id);
      if (error) throw error;
      setLinks(prev => prev.filter(l => l.id !== id));
      toast.success('Link removido');
    } catch (error) {
      toast.error('Erro ao remover link');
    }
  };

  const isImageUrl = (url: string) => {
    return /\.(jpeg|jpg|gif|png|webp|jfif)$/i.test(url);
  };

  const isEmbeddable = (url: string) => {
    return url.includes('notion.so') || url.includes('miro.com') || url.includes('lucid.app') || url.includes('canva.com');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-blue-500" />
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Links e Referências Externas</h3>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition"
        >
          {showAdd ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showAdd ? 'Cancelar' : 'Anexar Link'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddLink} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Título (ex: Mapa Mental de Ativos)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="url"
              required
              placeholder="URL (Notion, Miro, Imagem...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <input
            type="text"
            placeholder="Descrição curta (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : 'Adicionar Link'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {links.map((link) => (
          <div key={link.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition group flex flex-col">
            {isImageUrl(link.url) ? (
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                <img src={link.url} alt={link.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <ImageIcon className="text-white w-8 h-8" />
                </div>
              </div>
            ) : isEmbeddable(link.url) ? (
              <div className="aspect-video bg-gray-50">
                <iframe src={link.url} title={link.title} className="w-full h-full border-0" />
              </div>
            ) : (
              <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-center aspect-[21/9]">
                <Globe className="w-8 h-8 text-gray-300" />
              </div>
            )}

            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{link.title}</h4>
                {(isAdmin || user?.id === link.uploaded_by) && (
                  <button onClick={() => handleDelete(link.id)} className="text-gray-400 hover:text-red-500 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {link.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{link.description}</p>}
              
              <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]">{new URL(link.url).hostname}</span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition"
                >
                  <OpenIcon className="w-3 h-3" />
                  Abrir Link
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {links.length === 0 && !showAdd && (
        <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
          <p className="text-xs text-gray-400">Nenhum link externo anexado.</p>
        </div>
      )}
    </div>
  );
}