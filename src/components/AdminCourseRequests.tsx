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
    if (isAdmin) loadRequests();
  }, [isAdmin]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data: requestsData, error: requestsError } = await supabase
        .from('course_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (requestsError) {
        if (requestsError.code === '42P01') {
          console.warn('Tabela course_requests não encontrada');
        } else {
          throw requestsError;
        }
        setRequests([]);
        return;
      }

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        return;
      }

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

      setRequests(formattedRequests);
    } catch (error) {
      console.error('Erro ao carregar solicitações de disciplinas:', error);
      toast.error('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: CourseRequest) => {
    setProcessingId(request.id);
    try {
      const { error: courseError } = await supabase.from('courses').insert({
        name: request.name,
        code: request.code,
        period: request.period,
        subject_type: request.subject_type,
        is_mandatory: request.is_mandatory
      });

      if (courseError) throw courseError;

      await supabase.from('course_requests').update({ 
        status: 'approved', 
        reviewed_by: user?.id,
        updated_at: new Date().toISOString()
      }).eq('id', request.id);

      toast.success(`Disciplina "${request.name}" criada!`);
      loadRequests();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast.error('Erro ao aprovar disciplina');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await supabase.from('course_requests').update({ 
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
      <div className="p-4 border-b border-gray-100 bg-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-purple-800">Solicitações de Disciplinas</h3>
            <span className="bg-purple-200 text-purple-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {requests.length}
            </span>
          </div>
          <button onClick={loadRequests} className="p-2 hover:bg-purple-100 rounded-lg transition text-purple-600">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="p-8 text-center text-gray-500">Nenhuma solicitação de disciplina pendente</div>
      ) : (
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
                    {request.code && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">{request.code}</span>}
                    {request.period && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">{request.period}º Período</span>}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    <span className="font-medium">Solicitado por:</span> {request.requester_name}
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