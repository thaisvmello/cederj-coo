import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, Clock, BookOpen, Loader, AlertCircle, RefreshCw, CheckCheck } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { useAuth } from '../contexts/AuthContext';
import { RejectRequestModal } from './RejectRequestModal';
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
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [requestToReject, setRequestToReject] = useState<CourseRequest | null>(null);

  useEffect(() => {
    if (isAdmin) loadRequests();
  }, [isAdmin]);

  const loadRequests = async () => {
    setLoading(true);
    setSelected([]);
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

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelected(prev => prev.length === requests.length ? [] : requests.map(r => r.id));
  };

  const approveRequest = async (request: CourseRequest) => {
    const { error: courseError } = await supabase.from('courses').insert({
      name: request.name,
      code: request.code,
      period: request.period,
      subject_type: request.subject_type,
      is_mandatory: request.is_mandatory
    });

    if (courseError) throw courseError;

    const { error: updateError } = await supabase.from('course_requests').update({ 
      status: 'approved', 
      reviewed_by: user?.id,
      updated_at: new Date().toISOString()
    }).eq('id', request.id);

    if (updateError) throw updateError;
  };

  const handleApprove = async (request: CourseRequest) => {
    setProcessingId(request.id);
    try {
      await approveRequest(request);
      toast.success(`Disciplina "${request.name}" criada!`);
      loadRequests();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast.error('Erro ao aprovar disciplina');
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkApprove = async () => {
    const targets = requests.filter(r => selected.includes(r.id));
    if (targets.length === 0) return;

    setBulkProcessing(true);
    let approved = 0;
    const failed: string[] = [];

    for (const request of targets) {
      try {
        await approveRequest(request);
        approved++;
      } catch (error) {
        console.error('Erro ao aprovar em lote:', error);
        failed.push(request.name);
      }
    }

    setBulkProcessing(false);

    if (approved > 0) toast.success(`${approved} disciplina(s) criada(s)!`);
    if (failed.length > 0) toast.error(`Falha em ${failed.length}: ${failed.join(', ')}`);

    loadRequests();
  };

  const handleRejectClick = (request: CourseRequest) => {
    setRequestToReject(request);
    setShowRejectModal(true);
  };

  const submitRejection = async (requestId: string, message: string, link?: string) => {
    if (!user || !requestToReject) return;
    
    setProcessingId(requestId);
    try {
      const { error: updateError } = await supabase
        .from('course_requests')
        .update({ 
          status: 'rejected',
          reviewed_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: requestToReject.requested_by,
        title: 'Solicitação de disciplina recusada',
        content: `Sua solicitação para a disciplina "${requestToReject.name}" foi recusada. Motivo: ${message}`,
        type: 'folder_request_rejection',
        link: link || null,
        is_read: false,
      });

      if (notifError) throw notifError;

      toast.success('Solicitação recusada e usuário notificado');
      setShowRejectModal(false);
      setRequestToReject(null);
      loadRequests();
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      toast.error('Erro ao processar recusa');
    } finally {
      setProcessingId(null);
    }
  };

  const submitBulkRejection = async (requestIds: string[], message: string, link?: string) => {
    if (!user) return;

    setBulkProcessing(true);
    let rejected = 0;
    const failed: string[] = [];

    for (const request of requests.filter(r => requestIds.includes(r.id))) {
      try {
        const { error: updateError } = await supabase
          .from('course_requests')
          .update({ 
            status: 'rejected',
            reviewed_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', request.id);

        if (updateError) throw updateError;

        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: request.requested_by,
          title: 'Solicitação de disciplina recusada',
          content: `Sua solicitação para a disciplina "${request.name}" foi recusada. Motivo: ${message}`,
          type: 'folder_request_rejection',
          link: link || null,
          is_read: false,
        });

        if (notifError) throw notifError;
        rejected++;
      } catch (error) {
        console.error('Erro ao rejeitar em lote:', error);
        failed.push(request.name);
      }
    }

    setBulkProcessing(false);

    if (rejected > 0) toast.success(`${rejected} solicitação(ões) recusada(s)!`);
    if (failed.length > 0) toast.error(`Falha em ${failed.length}: ${failed.join(', ')}`);

    setShowRejectModal(false);
    setSelected([]);
    loadRequests();
  };

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const allSelected = requests.length > 0 && selected.length === requests.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-purple-50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-5 h-5 text-purple-600 shrink-0" />
            <h3 className="font-bold text-purple-800 truncate">Solicitações de Disciplinas</h3>
            <span className="bg-purple-200 text-purple-800 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
              {requests.length}
            </span>
          </div>
          <button onClick={loadRequests} className="p-2 hover:bg-purple-100 rounded-lg transition text-purple-600 shrink-0">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="p-8 text-center text-gray-500">Nenhuma solicitação de disciplina pendente</div>
      ) : (
        <>
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80 flex flex-wrap items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-purple-700 hover:text-purple-900"
            >
              <span
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                  allSelected ? 'bg-purple-600 border-purple-600' : 'bg-white border-purple-300'
                }`}
              >
                {allSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </span>
              {allSelected ? 'Desmarcar todas' : 'Selecionar todas'}
            </button>

            {selected.length > 0 && (
              <>
                <span className="text-xs font-bold text-gray-500">
                  {selected.length} selecionada(s)
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={handleBulkApprove}
                    disabled={bulkProcessing}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {bulkProcessing
                      ? <Loader className="w-3.5 h-3.5 animate-spin" />
                      : <CheckCheck className="w-3.5 h-3.5" />}
                    Aprovar
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={bulkProcessing}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    Recusar
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {requests.map((request) => {
              const isSelected = selected.includes(request.id);
              return (
                <div
                  key={request.id}
                  onClick={() => toggleSelect(request.id)}
                  className={`p-4 transition flex items-start gap-3 cursor-pointer ${
                    isSelected ? 'bg-purple-50/70' : 'hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                      isSelected ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4 text-purple-500 shrink-0" />
                      <span className="font-bold text-gray-900 text-sm">{request.name}</span>
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
                      onClick={(e) => { e.stopPropagation(); handleApprove(request); }}
                      disabled={processingId === request.id || bulkProcessing}
                      title="Aprovar solicitação"
                      className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition disabled:opacity-50"
                    >
                      {processingId === request.id ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRejectClick(request); }}
                      disabled={processingId === request.id || bulkProcessing}
                      title="Recusar solicitação"
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showRejectModal && requestToReject && (
        <RejectRequestModal
          isOpen={showRejectModal}
          onRequestId={requestToReject.id}
          onRequesterName={requestToReject.requester_name || 'Usuário'}
          onRequestTitle={`Disciplina: ${requestToReject.name}`}
          onClose={() => {
            setShowRejectModal(false);
            setRequestToReject(null);
          }}
          onReject={submitRejection}
        />
      )}

      {showRejectModal && !requestToReject && selected.length > 0 && (
        <RejectRequestModal
          isOpen={showRejectModal}
          bulkIds={selected}
          bulkLabel={requests.filter(r => selected.includes(r.id)).map(r => r.name).join(', ')}
          onClose={() => setShowRejectModal(false)}
          onRejectBulk={submitBulkRejection}
        />
      )}
    </div>
  );
}
