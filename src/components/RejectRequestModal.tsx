import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface RejectRequestModalProps {
  isOpen: boolean;
  onRequestId: string;
  onRequesterName: string;
  onRequesterEmail: string;
  onRequestTitle: string;
  onClose: () => void;
  onReject: (requestId: string, message: string, link?: string) => void;
}

export const RejectRequestModal: React.FC<RejectRequestModalProps> = ({
  isOpen,
  onRequestId,
  onRequesterName,
  onRequesterEmail,
  onRequestTitle,
  onClose,
  onReject,
}) => {
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      alert('Por favor, forneça um motivo para a recusa.');
      return;
    }
    setLoading(true);
    try {
      await onReject(onRequestId, message, link.trim() || undefined);
      onClose();
    } catch (e) {
      console.error('Error rejecting request:', e);
      alert('Erro ao rejeitar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Recusar Solicitação</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
            <AlertTriangle size={16} className="text-red-500" />
            <span className="font-medium text-red-700">Atenção</span>
          </div>

          <p className="text-sm text-gray-600">
            <strong>Solicitação:</strong> {onRequestTitle}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Solicitante:</strong> {onRequesterName}
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo da Recusa *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite o motivo da recusa..."
              className="w-full p-2 border border-gray-200 rounded"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link opcional (ex.: pasta existente)
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="w-full p-2 border border-gray-200 rounded"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !message.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              {loading ? 'Enviando...' : 'Enviar Recusa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};