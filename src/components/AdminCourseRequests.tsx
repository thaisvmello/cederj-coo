import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, Clock, BookOpen, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface CourseRequest {
  id: string;
  requested_by: string;
  name: string;
  code: string | null;
  period: string | null;
  subject_type: string;
  is_mandatory: boolean;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  requester_name?: string;
}

export function AdminCourseRequests() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [requests, setRequests] = useState<CourseRequest[]>([]);
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
      console.log('[Admin] Carregando solicitações de disciplinas...');
      
      const { data: requestsData, error: requestsError } = await supabase
        .from('course_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (requestsError) {
        console.error('[Admin] Erro ao carregar solicitações:', requestsError);
        if (requestsError.code !== '42P01') {
          toast.error('Erro ao carregar solicitações de disciplinas');
        }
        setRequests([]);
        setLoading(false);
        return;
      }

      console.log('[Admin] Solicitações de disciplinas encontradas:', requestsData?.length || 0);

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      // Buscar informações dos solicitantes
      const userIds = [...new Set(requestsData.map(r => r.requested_by))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      const formattedRequests: CourseRequest[] = requestsData.map(request => {
        const profile = profilesData?.find(p => p.id === request.requested_by);
        
        return {
          ...request,
          requester_name: profile 
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuário'
            : 'Usuário desconhecido'
        };
      });

      console.log('[Admin] Solicitações de disciplinas formatadas:', formattedRequests);
      setRequests(formattedRequests);
    } catch (error) {
      console.error('[Admin] Erro geral:', error);
      toast.error('Erro ao carregar solicitações');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: CourseRequest) => {
    setProcessingId(request.id);
    try {
      console.log('[Admin] Aprovando solicitação de disciplina:', request.id);
      
      // Criar a disciplina
      const { error: courseError } = await supabase.from('courses').insert({
        name: request.name,
        code: request.code,
        period: request.period,
        subject_type: request.subject_type,
        is_mandatory: request.is_mandatory
      });

      if (courseError) {
        console.error('[Admin] Erro ao criar disciplina:', courseError);
        throw courseError;
      }

      // Atualizar status da solicitação
      const { error: updateError } = await supabase
        .from('course_requests')
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

      toast.success(`Disciplina "${request.name}" criada com sucesso!`);
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
      console.log('[Admin] Rejeitando solicitação de disciplina:', requestId);
      
      const { error } = await supabase
        .from('course_requests')
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

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-purple-800">Solicitações de Disciplinas Pendentes</h3>
            <span className="bg-purple-200 text-purple-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {requests.length}
            </span>
          </div>
          <button
            onClick={loadRequests}
            className="p-2 hover:bg-purple-100 rounded-lg transition text-purple-600"
            title="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {requests.map((request) => (
          <div key={request.id} className="p-4 hover:bg-gray-50 transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <span className="font-bold text-gray-900">{request.name}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {request.code && (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                      {request.code}
                    </span>
                  )}
                  {request.period && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">
                      {request.period}º Período
                    </span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                    request.is_mandatory 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'bg-purple-50 text-purple-600'
                  }`}>
                    {request.subject_type}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">
                  <span className="font-medium">Solicitado por:</span> {request.requester_name}
                </p>
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
                  title="Aprovar e criar disciplina"
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
    </div>
  );
}