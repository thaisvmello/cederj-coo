import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

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
      const { data, error } = await supabase        .from('notifications')
        .select('*')
        .eq('type', 'announcement')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching announcements:', error);
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
      // Get all user IDs from profiles
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
      await fetchAnnouncements(); // refresh list
    } catch (e) {
      console.error('Error sending announcement:', e);
      toast.error('Erro ao enviar anúncio.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Delete announcement ----------
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este anúncio?')) return;
    setLoading(true);
    try {
      console.log('[AdminAnnouncements] Attempting to delete announcement with id:', id);
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) {
        console.error('Error deleting announcement:', error);
        toast.error('Erro ao excluir anúncio. Verifique permissões.');
        return;
      }
      toast.success('Anúncio excluído.');
      // Refresh from DB to guarantee consistency
      await fetchAnnouncements();
    } catch (e) {
      console.error('Unexpected error deleting announcement:', e);
      toast.error('Erro inesperado ao excluir anúncio.');
    } finally {
      setLoading(false);
    }
  };
  // -------------------------------------------

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Anúncios</h2>
        <button          onClick={() => setShowCreate(true)}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Novo Anúncio        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Novo Anúncio</h3>
            <div className="mb-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Título"
              />
            </div>
            <div className="mb-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-2 border rounded"
                rows={4}
                placeholder="Conteúdo"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-gray-100 rounded"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={sendAnnouncement}
                disabled={!title.trim() || !content.trim() || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      <table className="w-full border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 text-left">Título</th>
            <th className="p-2 text-left">Conteúdo</th>
            <th className="p-2 text-left">Data</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {announcements.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">
                Nenhum anúncio enviado
              </td>
            </tr>
          ) : (
            announcements.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-2 font-medium">{a.title}</td>
                <td className="p-2">{a.content}</td>
                <td className="p-2 text-sm text-gray-500">
                  {new Date(a.created_at).toLocaleString('pt-BR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="p-2">
                  <span                    className={`px-2 py-1 rounded text-xs ${
                      a.is_read ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {a.is_read ? 'Lido' : 'Não lido'}
                  </span>
                </td>
                {/* Delete button */}
                <td className="p-2">
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={loading}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition"
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
  );
};