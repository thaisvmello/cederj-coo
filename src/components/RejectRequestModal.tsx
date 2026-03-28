import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, Button, Input, Textarea, Label, FormControl, FormHelperText } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';

interface RejectRequestModalProps {
  isOpen: boolean;
  onRequestId: string;
  onRequesterName: string;
  onRequesterEmail: string;
  onRequesterId: string;
  onRequestTitle: string;
  onClose: () => void;
  onReject: (requestId: string, message: string, link?: string) => void;
}

export const RejectRequestModal: React.FC<RejectRequestModalProps> = ({
  isOpen,
  onRequestId,
  onRequesterName,
  onRequesterEmail,
  onRequesterId,
  onRequestTitle,
  onClose,
  onReject
}) => {
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      alert('Por favor, forneça um motivo para a rejeição.');
      return;
    }

    setLoading(true);
    try {
      await onReject(onRequestId, message, link);
      onClose();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Erro ao rejeitar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <div className="flex items-center justify-between mb-4">
          <DialogTitle>Recusar Solicitação</DialogTitle>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        
        <DialogDescription>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Forneça um motivo para a recusa e uma mensagem opcional para o solicitante.
            </p>
          </div>
          
          <div className="mb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle size={16} className="text-red-500" />
                <span className="font-medium text-red-700">Atenção</span>
              </div>
              <p className="text-sm text-red-600">
                Esta ação rejeitará a solicitação e enviará uma notificação ao solicitante.
              </p>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Solicitação:</p>
            <p className="text-sm text-gray-600">{onRequestTitle}</p>
          </div>
          
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Solicitante:</p>
            <p className="text-sm text-gray-600">{onRequesterName} ({onRequesterEmail})</p>
          </div>
          
          <FormControl className="mb-4">
            <Label htmlFor="message" className="text-sm font-medium text-gray-700 mb-1">
              Motivo da Recusa
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite o motivo da recusa..."
              required
              className="min-h-[100px]"
            />
            <FormHelperText className="text-sm text-gray-500">
              Esta mensagem será enviada ao solicitante.
            </FormHelperText>
          </FormControl>
          
          <FormControl className="mb-4">
            <Label htmlFor="link" className="text-sm font-medium text-gray-700 mb-1">
              Link (Opcional)
            </Label>
            <Input
              id="link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              type="url"
            />
            <FormHelperText className="text-sm text-gray-500">
              Link para um folder existente ou recurso relacionado.
            </FormHelperText>
          </FormControl>
        </DialogDescription>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="mr-2"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || loading}
            loading={loading}
          >
            Enviar Recusa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};