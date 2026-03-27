import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, AlertCircle, Send, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface FileActionModalProps {
  fileId: string;
  fileName: string;
  actionType: 'rename' | 'delete';
  onClose: () => void;
  onSuccess: () => void;
}

export function FileActionModal({ fileId, fileName, actionType, onClose, onSuccess }: FileActionModalProps) {
  const { user } = useAuth();
  const [newName, setNewName] = useState(fileName);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Por favor, informe o motivo');
      return;
    }
    if (actionType === 'rename' && !newName.trim()) {
      toast.error('Por favor, informe o novo nome');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('file_actions').insert({
        file_id: fileId,
        requested_by: user?.id,
        action_type: actionType,
        new_name: actionType === 'rename' ? newName.trim() : null,
        reason: reason.trim(),
        status: 'pending'
      });

      if (error) throw error;

      toast.success('Solicitação enviada para análise do administrador!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao solicitar ação:', error);
      toast.error('Erro ao enviar solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${actionType === 'delete' ? 'bg-red-50' : 'bg-blue-50'}`}>
              <AlertCircle className={`w-5 h-5 ${actionType === 'delete' ? 'text-red-600' : 'text-blue-600'}`} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {actionType === 'delete' ? 'Solicitar Exclusão' : 'Solicitar Renomeação'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-500 font-medium uppercase mb-1">Arquivo Atual:</p>
            <p className="text-sm font-bold text-gray-900 truncate">{fileName}</p>
          </div>

          {actionType === 'rename' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Novo nome do arquivo *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Justificativa *
            </label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explique por que esta ação é necessária..."
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
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
              className={`flex-1 px-6 py-3 text-white rounded-xl font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 ${
                actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
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