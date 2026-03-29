import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Loader, Plus, X, AlertTriangle } from 'lucide-react';

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
      
      if (error) {
        console.error('[AdminAnnouncements] Error fetching:', error);
        toast.error('Erro ao carregar anúncios.');
      } else {
        setAnnouncements(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

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
        title,
        content,
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
      toast.error('Erro ao enviar anúncio: ' + (e.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este anúncio?')) return;
    
    setLoading(true);
    try {
      console.log('[AdminAnnouncements] Attempting to delete id:', id);
      
      const { error, status, statusText } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[AdminAnnouncements] Delete error details:', { error, status, statusText });
        toast.error(`Erro ao excluir: ${error.message} (Status: ${status})`);
        return;
      }

      console.log('[AdminAnnouncements] Delete response status:', status);
      toast.success('Anúncio excluído com sucesso.');
      await fetchAnnouncements();
    } catch (e: any) {
      console.error('[AdminAnnouncements] Unexpected error during delete:', e);
      toast.error('Erro inesperado: ' + (e.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Anúncios Globais</h2>
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
              <th className="p-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Título</th>
              <th className="p-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Conteúdo</th>
              <th className="p-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data</th>
              <th className="p-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && announcements.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center">
                  <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-bold uppercase">Carregando...</p>
                </td>
              </tr>
            ) : announcements.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-gray-500">
                  Nenhum anúncio enviado ainda.
                </td>
              </tr>
            ) : (
              announcements.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50/50 transition group">
                  <td className="p-4 font-bold text-gray-900 text-sm">{a.title}</td>
                  <td className="p-4 text-gray-600 text-sm max-w-xs truncate">{a.content}</td>
                  <td className="p-4 text-xs text-gray-400">
                    {new Date(a.created_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={loading}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                      title="Excluir anúncio"
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