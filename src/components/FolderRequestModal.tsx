import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, FolderPlus, Send, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface FolderRequestModalProps {
  courseId: string;
  courseName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function FolderRequestModal({ courseId, courseName, onClose, onSuccess }: FolderRequestModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Por favor, informe o nome da pasta');
      return;
    }
    if (!user) {
      toast.error('Você precisa estar logado para solicitar uma pasta');
      return;
    }

    setLoading(true);
    try {
      console.log('Enviando solicitação:', {
        course_id: courseId,
        requested_by: user.id,
        folder_name: name.trim(),
        reason: reason.trim() || null,
        status: 'pending'
      });

      const { data, error } = await supabase.from('folder_requests').insert({
        course_id: courseId,
        requested_by: user.id,
        folder_name: name.trim(),
        reason: reason.trim() || null,
        status: 'pending'
      }).select();

      if (error) {
        console.error('Erro do Supabase:', error);
        throw error;
      }

      console.log('Solicitação criada:', data);
      toast.success('Solicitação enviada! Aguarde a aprovação do administrador.');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao solicitar pasta:', error);
      
      // Mensagens de erro mais específicas
      if (error?.code === '42P01') {
        toast.error('Tabela de solicitações não encontrada. Contate o administrador.');
      } else if (error?.code === '23503') {
        toast.error('Disciplina não encontrada. Tente novamente.');
      } else if (error?.code === '42501' || error?.message?.includes('policy')) {
        toast.error('Sem permissão para criar solicitação. Verifique se está logado.');
      } else {
        toast.error(`Erro ao enviar solicitação: ${error?.message || 'Tente novamente'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <FolderPlus className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Solicitar Nova Pasta</h2>
              <p className="text-xs text-gray-500">{courseName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs text-amber-800">
              <strong>Atenção:</strong> A criação de novas pastas requer aprovação do administrador. 
              Sua solicitação será analisada em breve.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Nome da pasta *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Provas 2025.1"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Motivo (opcional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Por que esta pasta é necessária?"
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Enviando...' : 'Enviar Solicitação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}