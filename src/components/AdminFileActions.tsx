import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, Clock, Loader, AlertCircle, RefreshCw, Trash2, Pencil } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { useAuth } from '../contexts/AuthContext';
import type { FileAction } from '../lib/types';
import toast from 'react-hot-toast';

export function AdminFileActions() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [requests, setRequests] = useState<FileAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) loadRequests();
  }, [isAdmin]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data: requestsData, error: requestsError } = await supabase
        .from('file_actions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (requestsError) {
        if (requestsError.code === '42P01' || requestsError.code === 'PGRST205') {
          console.warn('[Admin] Tabela file_actions não encontrada ou cache pendente');
          setRequests([]);
          return;
        }
        throw requestsError;
      }

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        return;
      }

      const fileIds = requestsData.map(r => r.file_id);
      const userIds = requestsData.map(r => r.requested_by);

      const [{ data: filesData }, { data: profilesData }] = await Promise.all([
        supabase.from('files').select('id, name').in('id', fileIds),
        supabase.from('profiles').select('id, first_name, last_name').in('id', userIds)
      ]);

      const formatted = requestsData.map(req => {
        const file = filesData?.find(f => f.id === req.file_id);
        const profile = profilesData?.find(p => p.id === req.requested_by);
        
        return {
          ...req,
          file_name: file?.name || 'Arquivo não encontrado',
          requester_name: profile
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuário'
            : 'Usuário desconhecido'
        };
      });

      setRequests(formatted);
    } catch (error) {
      console.error('Erro ao carregar ações de arquivos:', error);
      toast.error('Erro ao carregar solicitações de arquivos');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: FileAction) => {
    setProcessingId(request.id);
    try {
      if (request.action_type === 'delete') {
        const { error } = await supabase.from('files').delete().eq('id', request.file_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('files').update({ name: request.new_name }).eq('id', request.file_id);
        if (error) throw error;
      }

      await supabase.from('file_actions').update({ 
        status: 'approved', 
        reviewed_by: user?.id,
        updated_at: new Date().toISOString()
      }).eq('id', request.id);

      toast.success('Solicitação aprovada!');
      loadRequests();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast.error('Erro ao processar solicitação');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await supabase.from('file_actions').update({ 
        status: 'rejected', 
        reviewed_by: user?.id,
        updated_at: new Date().toISOString()
      }).eq('id', requestId);

      toast.success('Solicitação rejeitada');
      loadRequests();
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      toast.error('Erro ao rejeitar solicitação');
    } finally {
      setProcessingId(null);
    }
  };

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-blue-800">Solicitações de Arquivos</h3>
            <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {requests.length}
            </span>
          </div>
          <button onClick={loadRequests} className="p-2 hover:bg-blue-100 rounded-lg transition text-blue-600">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="p-8 text-center text-gray-500">Nenhuma solicitação de arquivo pendente</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {requests.map((request) => (
            <div key={request.id} className="p-4 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {request.action_type === 'delete' ? (
                      <Trash2 className="w-4 h-4 text-red-500" />
                    ) : (
                      <Pencil className="w-4 h-4 text-blue-500" />
                    )}
                    <span className="font-bold text-gray-900">{request.file_name}</span>
                  </div>
                  {request.action_type === 'rename' && (
                    <p className="text-xs text-blue-600 font-bold mb-2">
                      Novo nome: {request.new_name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mb-1">
                    <span className="font-medium">Solicitado por:</span> {request.requester_name}
                  </p>
                  <p className="text-xs text-gray-400 italic mt-2 bg-gray-50 p-2 rounded">
                    "{request.reason}"
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
                    <Clock className="w-3 h-3" />
                    {new Date(request.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(request)}
                    disabled={processingId === request.id}
                    className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition disabled:opacity-50"
                  >
                    {processingId === request.id ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    disabled={processingId === request.id}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}