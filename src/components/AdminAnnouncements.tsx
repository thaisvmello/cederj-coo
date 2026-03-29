import { supabase } from '../lib/supabase';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Loader, Plus, X, Megaphone, Users } from 'lucide-react';

export const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'announcement')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('[AdminAnnouncements] Error fetching:', error);
      toast.error('Erro ao carregar anúncios.');
    } finally {
      setLoading(false);
    }
  };

  // Agrupa os anúncios por título e conteúdo para não repetir na tabela
  const groupedAnnouncements = useMemo(() => {
    const groups: Record<string, any> = {};
    announcements.forEach(a => {
      const key = `${a.title}-${a.content}`;
      if (!groups[key]) {
        groups[key] = {
          ...a,
          recipientCount: 1,
          readCount: a.is_read ? 1 : 0
        };
      } else {
        groups[key].recipientCount++;
        if (a.is_read) groups[key].readCount++;
      }
    });
    return Object.values(groups);
  }, [announcements]);

  const sendAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Preencha título e conteúdo.');
      return;
    }
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id');

      if (profilesError) throw profilesError;

      const notifications = (profiles || []).map((p: any) => ({
        user_id: p.id,
        title: title.trim(),
        content: content.trim(),
        type: 'announcement',
        is_read: false,
      }));

      const { error: insertError } = await supabase.from('notifications').insert(notifications);
      if (insertError) throw insertError;

      toast.success('Anúncio enviado para todos os usuários!');
      setTitle('');
      setContent('');
      setShowCreate(false);
      await fetchAnnouncements();
    } catch (e: any) {
      console.error('[AdminAnnouncements] Error sending:', e);
      toast.error('Erro ao enviar anúncio.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (announcement: any) => {
    if (!confirm(`Tem certeza que deseja excluir o anúncio "${announcement.title}" para TODOS os usuários?`)) return;
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const response = await fetch('https://tlcdhwjkdbrmrwueeokj.supabase.co/functions/v1/admin-delete-announcement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: announcement.title,
          content: announcement.content
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir anúncio');
      }

      toast.success(`Anúncio removido de ${result.deletedCount} usuários.`);
      await fetchAnnouncements();
    } catch (e: any) {
      console.error('[AdminAnnouncements] Delete error:', e);
      toast.error(e.message || 'Erro ao excluir anúncio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Anúncios Globais</h2>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Novo Anúncio
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Criar Novo Anúncio</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Título</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Ex: Manutenção no Sistema"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Conteúdo</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                  rows={4}
                  placeholder="Descreva o anúncio aqui..."
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={sendAnnouncement}
                  disabled={!title.trim() || !content.trim() || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader className="w-4 h-4 animate-spin" />}
                  Enviar para Todos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Anúncio</th>
              <th className="p-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Alcance</th>
              <th className="p-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data</th>
              <th className="p-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && groupedAnnouncements.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center">
                  <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-bold uppercase">Carregando...</p>
                </td>
              </tr>
            ) : groupedAnnouncements.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-gray-500">
                  Nenhum anúncio enviado ainda.
                </td>
              </tr>
            ) : (
              groupedAnnouncements.map((a, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition group">
                  <td className="p-4">
                    <p className="font-bold text-gray-900 text-sm">{a.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{a.content}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span>{a.recipientCount} usuários</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-emerald-600">{a.readCount} lidos</span>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-gray-400">
                    {new Date(a.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDelete(a)}
                      disabled={loading}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                      title="Excluir para todos"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};