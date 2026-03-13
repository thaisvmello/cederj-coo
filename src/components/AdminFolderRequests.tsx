import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, Clock, FolderPlus, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface FolderRequest {
  id: string;
  course_id: string;
  requested_by: string;
  folder_name: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  course_name?: string;
  requester_name?: string;
}

export function AdminFolderRequests() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [requests, setRequests] = useState<FolderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      loadRequests();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      console.log('[Admin] Carregando solicitações...');
      
      // Primeiro, buscar as solicitações pendentes
      const { data: requestsData, error: requestsError } = await supabase
        .from('folder_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (requestsError) {
        console.error('[Admin] Erro ao carregar solicitações:', requestsError);
        toast.error('Erro ao carregar solicitações');
        setRequests([]);
        setLoading(false);
        return;
      }

      console.log('[Admin] Solicitações encontradas:', requestsData?.length || 0);

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      // Buscar informações dos cursos
      const courseIds = [...new Set(requestsData.map(r => r.course_id))];
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, name')
        .in('id', courseIds);

      // Buscar informações dos solicitantes
      const userIds = [...new Set(requestsData.map(r => r.requested_by))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      // Combinar os dados
      const formattedRequests: FolderRequest[] = requestsData.map(request => {
        const course = coursesData?.find(c => c.id === request.course_id);
        const profile = profilesData?.find(p => p.id === request.requested_by);
        
        return {
          ...request,
          course_name: course?.name || 'Disciplina não encontrada',
          requester_name: profile 
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuário'
            : 'Usuário desconhecido'
        };
      });

      console.log('[Admin] Solicitações formatadas:', formattedRequests);
      setRequests(formattedRequests);
    } catch (error) {
      console.error('[Admin] Erro geral:', error);
      toast.error('Erro ao carregar solicitações');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: FolderRequest) => {
    setProcessingId(request.id);
    try {
      console.log('[Admin] Aprovando solicitação:', request.id);
      
      // Criar a pasta
      const { error: folderError } = await supabase.from('folders').insert({
        name: request.folder_name,
        course_id: request.course_id,
        parent_folder_id: null
      });

      if (folderError) {
        console.error('[Admin] Erro ao criar pasta:', folderError);
        throw folderError;
      }

      // Atualizar status da solicitação
      const { error: updateError } = await supabase
        .from('folder_requests')
        .update({ 
          status: 'approved', 
          reviewed_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) {
        console.error('[Admin] Erro ao atualizar solicitação:', updateError);
        throw updateError;
      }

      toast.success(`Pasta "${request.folder_name}" criada com sucesso!`);
      loadRequests();
    } catch (error) {
      console.error('[Admin] Erro ao aprovar:', error);
      toast.error('Erro ao aprovar solicitação');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      console.log('[Admin] Rejeitando solicitação:', requestId);
      
      const { error } = await supabase
        .from('folder_requests')
        .update({ 
          status: 'rejected', 
          reviewed_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Solicitação rejeitada');
      loadRequests();
    } catch (error) {
      console.error('[Admin] Erro ao rejeitar:', error);
      toast.error('Erro ao rejeitar solicitação');
    } finally {
      setProcessingId(null);
    }
  };

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-amber-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-amber-800">Solicitações de Pastas Pendentes</h3>
            {requests.length > 0 && (
              <span className="bg-amber-200 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {requests.length}
              </span>
            )}
          </div>
          <button
            onClick={loadRequests}
            className="p-2 hover:bg-amber-100 rounded-lg transition text-amber-600"
            title="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="p-8 text-center">
          <FolderPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Nenhuma solicitação pendente</p>
          <p className="text-gray-400 text-xs mt-1">As solicitações de novas pastas aparecerão aqui</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {requests.map((request) => (
            <div key={request.id} className="p-4 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FolderPlus className="w-4 h-4 text-blue-500" />
                    <span className="font-bold text-gray-900">{request.folder_name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    <span className="font-medium">Disciplina:</span> {request.course_name}
                  </p>
                  <p className="text-xs text-gray-500 mb-1">
                    <span className="font-medium">Solicitado por:</span> {request.requester_name}
                  </p>
                  {request.reason && (
                    <p className="text-xs text-gray-400 italic mt-2 bg-gray-50 p-2 rounded">
                      "{request.reason}"
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
                    <Clock className="w-3 h-3" />
                    {new Date(request.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(request)}
                    disabled={processingId === request.id}
                    className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition disabled:opacity-50"
                    title="Aprovar e criar pasta"
                  >
                    {processingId === request.id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    disabled={processingId === request.id}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                    title="Rejeitar solicitação"
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