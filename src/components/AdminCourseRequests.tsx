import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, Clock, BookOpen, Loader, AlertCircle } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface CourseRequest {
  id: string;
  requested_by: string;
  course_name: string;
  course_code: string | null;
  period: string | null;
  subject_type: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  requester?: { first_name: string; last_name: string };
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
    const { data, error } = await supabase
      .from('course_requests')
      .select(`
        *,
        requester:profiles(first_name, last_name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao carregar solicitações:', error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const handleApprove = async (request: CourseRequest) => {
    setProcessingId(request.id);
    try {
      // Criar a disciplina
      const { error: courseError } = await supabase.from('courses').insert({
        name: request.course_name,
        code: request.course_code || null,
        period: request.period || null,
        subject_type: request.subject_type,
        is_mandatory: request.subject_type.toLowerCase().includes('obrigatória')
      });

      if (courseError) throw courseError;

      // Atualizar status da solicitação
      const { error: updateError } = await supabase
        .from('course_requests')
        .update({ status: 'approved', reviewed_by: user?.id })
        .eq('id', request.id);

      if (updateError) throw updateError;

      toast.success(`Disciplina "${request.course_name}" criada com sucesso!`);
      loadRequests();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast.error('Erro ao aprovar solicitação');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const { error } = await supabase
        .from('course_requests')
        .update({ status: 'rejected', reviewed_by: user?.id })
        .eq('id', requestId);

      if (error) throw error;

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
      <div className="p-4 border-b border-gray-100 bg-amber-50">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-amber-800">Solicitações de Disciplinas Pendentes</h3>
          <span className="ml-auto bg-amber-200 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
            {requests.length}
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {requests.map((request) => (
          <div key={request.id} className="p-4 hover:bg-gray-50 transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-gray-900">{request.course_name}</span>
                </div>
                {request.course_code && (
                  <p className="text-xs text-gray-500 mb-1">
                    Código: <span className="font-medium">{request.course_code}</span>
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-1">
                  <span>Tipo: <span className="font-medium">{request.subject_type}</span></span>
                  {request.period && (
                    <span>Período: <span className="font-medium">{request.period}º</span></span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-1">
                  Solicitado por: <span className="font-medium">
                    {request.requester?.first_name} {request.requester?.last_name}
                  </span>
                </p>
                {request.reason && (
                  <p className="text-xs text-gray-400 italic mt-2">"{request.reason}"</p>
                )}
                <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
                  <Clock className="w-3 h-3" />
                  {new Date(request.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(request)}
                  disabled={processingId === request.id}
                  className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition disabled:opacity-50"
                  title="Aprovar"
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
                  title="Rejeitar"
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