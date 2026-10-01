import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, Clock, FolderPlus, Folder, Loader, RefreshCw, CheckCheck } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { RejectRequestModal } from './RejectRequestModal';
import { FolderRequest } from '../lib/types';

interface ExtendedFolderRequest extends FolderRequest {
  requester_name?: string;
  course_name?: string;
  parent_folder_name?: string;
}

export function AdminFolderRequests() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  const [requests, setRequests] = useState<ExtendedFolderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [requestToReject, setRequestToReject] = useState<ExtendedFolderRequest | null>(null);

  useEffect(() => {
    if (isAdmin) loadRequests();
  }, [isAdmin]);

  const loadRequests = async () => {
    setLoading(true);
    setSelected([]);
    try {
      const { data, error } = await supabase
        .from('folder_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.requested_by).filter(Boolean))];
        const courseIds = [...new Set(data.map(r => r.course_id).filter(Boolean))];
        const parentFolderIds = [...new Set(data.map(r => r.parent_folder_id).filter(Boolean))];

        const [profilesRes, coursesRes, parentFoldersRes] = await Promise.all([
          userIds.length > 0 
            ? supabase.from('profiles').select('id, first_name, last_name').in('id', userIds)
            : Promise.resolve({ data: [] }),
          courseIds.length > 0 
            ? supabase.from('courses').select('id, name').in('id', courseIds)
            : Promise.resolve({ data: [] }),
          parentFolderIds.length > 0
            ? supabase.from('folders').select('id, name').in('id', parentFolderIds)
            : Promise.resolve({ data: [] }),
        ]);

        const profiles = profilesRes.data || [];
        const courses = coursesRes.data || [];
        const parentFolders = parentFoldersRes.data || [];

        const formatted: ExtendedFolderRequest[] = data.map(req => {
          const profile = profiles.find(p => p.id === req.requested_by);
          const course = courses.find(c => c.id === req.course_id);
          const parentFolder = parentFolders.find(f => f.id === req.parent_folder_id);

          return {
            ...req,
            requester_name: profile 
              ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuário'
              : 'Usuário desconhecido',
            course_name: course?.name || 'Disciplina não identificada',
            parent_folder_name: parentFolder?.name || undefined,
          };
        });
        setRequests(formatted);
      } else {
        setRequests([]);
      }
    } catch (e) {
      console.error('Error loading folder requests:', e);
      setRequests([]);
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

  const handleApprove = async (req: ExtendedFolderRequest) => {
    setProcessingId(req.id);
    try {
      const { error: folderError } = await supabase
        .from('folders')
        .insert({
          name: req.folder_name,
          course_id: req.course_id,
          parent_folder_id: req.parent_folder_id || null,
        });

      if (folderError) throw folderError;

      const { error: updateError } = await supabase
        .from('folder_requests')
        .update({ status: 'approved' })
        .eq('id', req.id);

      if (updateError) throw updateError;

      toast.success('Pasta criada e solicitação aprovada!');
      loadRequests();
    } catch (e: any) {
      console.error('Error approving folder request:', e);
      toast.error(e.message || 'Erro ao aprovar solicitação');
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

    for (const req of targets) {
      try {
        const { error: folderError } = await supabase
          .from('folders')
          .insert({
            name: req.folder_name,
            course_id: req.course_id,
            parent_folder_id: req.parent_folder_id || null,
          });

        if (folderError) throw folderError;

        const { error: updateError } = await supabase
          .from('folder_requests')
          .update({ status: 'approved' })
          .eq('id', req.id);

        if (updateError) throw updateError;
        approved++;
      } catch (e) {
        console.error('Error approving folder request in bulk:', e);
        failed.push(req.folder_name);
      }
    }

    setBulkProcessing(false);

    if (approved > 0) toast.success(`${approved} pasta(s) criada(s) com sucesso!`);
    if (failed.length > 0) toast.error(`Falha em ${failed.length}: ${failed.join(', ')}`);

    loadRequests();
  };

  const handleReject = (req: ExtendedFolderRequest) => {
    setRequestToReject(req);
    setShowRejectModal(true);
  };

  const submitRejection = async (requestId: string, message: string, link?: string) => {
    if (!user || !requestToReject) return;
    
    setProcessingId(requestId);
    try {
      const { error: updateError } = await supabase
        .from('folder_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: requestToReject.requested_by,
        title: 'Solicitação de pasta recusada',
        content: `Sua solicitação para a pasta "${requestToReject.folder_name}" foi recusada. Motivo: ${message}`,
        type: 'folder_request_rejection',
        link: link || null,
        is_read: false,
      });

      if (notifError) throw notifError;

      toast.success('Rejeição enviada ao solicitante');
      setShowRejectModal(false);
      setRequestToReject(null);
      loadRequests();
    } catch (e) {
      console.error('Error rejecting:', e);
      toast.error('Erro ao processar recusa');
    } finally {
      setProcessingId(null);
    }
  };

  const submitBulkRejection = async (requestIds: string[], message: string, link?: string) => {
    if (!user) return;

    setBulkProcessing(true);
    try {
      const targets = requests.filter(r => requestIds.includes(r.id));
      let rejected = 0;
      const failed: string[] = [];

      for (const req of targets) {
        try {
          const { error: updateError } = await supabase
            .from('folder_requests')
            .update({ status: 'rejected' })
            .eq('id', req.id);

          if (updateError) throw updateError;

          const { error: notifError } = await supabase.from('notifications').insert({
            user_id: req.requested_by,
            title: 'Solicitação de pasta recusada',
            content: `Sua solicitação para a pasta "${req.folder_name}" foi recusada. Motivo: ${message}`,
            type: 'folder_request_rejection',
            link: link || null,
            is_read: false,
          });

          if (notifError) throw notifError;
          rejected++;
        } catch (e) {
          console.error('Error rejecting folder request in bulk:', e);
          failed.push(req.folder_name);
        }
      }

      if (rejected > 0) toast.success(`${rejected} solicitação(ões) recusada(s)!`);
      if (failed.length > 0) toast.error(`Falha em ${failed.length}: ${failed.join(', ')}`);
    } finally {
      setBulkProcessing(false);
      setShowRejectModal(false);
      setSelected([]);
      loadRequests();
    }
  };

  if (!isAdmin) return null;

  const allSelected = requests.length > 0 && selected.length === requests.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-indigo-50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <FolderPlus className="w-5 h-5 text-indigo-600 shrink-0" />
            <h3 className="font-bold text-indigo-800 truncate">Solicitações de Pastas</h3>
            <span className="bg-indigo-200 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
              {requests.length}
            </span>
          </div>
          <button
            onClick={loadRequests}
            className="p-2 hover:bg-indigo-100 rounded-lg transition text-indigo-600 shrink-0"
            title="Atualizar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {requests.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80 flex flex-wrap items-center gap-2">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs font-bold text-indigo-700 hover:text-indigo-900"
          >
            <span
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                allSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-indigo-300'
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
      )}

      {loading ? (
        <div className="p-8 flex justify-center">
          <Loader className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : requests.length === 0 ? (
        <div className="p-8 text-center text-gray-500">Nenhuma solicitação pendente</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {requests.map((req) => {
            const isSelected = selected.includes(req.id);
            return (
              <div
                key={req.id}
                onClick={() => toggleSelect(req.id)}
                className={`p-4 transition flex items-start gap-3 cursor-pointer ${
                  isSelected ? 'bg-indigo-50/70' : 'hover:bg-gray-50'
                }`}
              >
                <span
                  className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                    isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </span>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900 text-sm">{req.folder_name}</p>
                    {req.parent_folder_id ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-[11px] font-medium">
                        <Folder className="w-3 h-3 text-amber-600 shrink-0" />
                        Subpasta de: <strong className="font-semibold">{req.parent_folder_name || 'Pasta Superior'}</strong>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-md text-[11px] font-medium">
                        <Folder className="w-3 h-3 text-blue-500 shrink-0" />
                        Pasta Principal (Raiz)
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500">
                    Disciplina: <strong className="text-gray-700">{req.course_name}</strong>
                  </p>

                  {req.reason && (
                    <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-2 italic">
                      <span className="font-semibold not-italic text-gray-700">Motivo:</span> "{req.reason}"
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-gray-400 pt-0.5 flex-wrap">
                    <span>Solicitado por: <strong className="text-gray-600">{req.requester_name}</strong></span>
                    <span>•</span>
                    <span className="inline-flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(req.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleApprove(req); }}
                    disabled={processingId === req.id || bulkProcessing}
                    title="Aprovar criação"
                    className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition disabled:opacity-50"
                  >
                    {processingId === req.id ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReject(req); }}
                    disabled={processingId === req.id || bulkProcessing}
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
      )}

      {showRejectModal && requestToReject && (
        <RejectRequestModal
          isOpen={showRejectModal}
          onRequestId={requestToReject.id}
          onRequesterName={requestToReject.requester_name || 'Usuário'}
          onRequestTitle={`Pasta: ${requestToReject.folder_name}${requestToReject.parent_folder_name ? ` (Subpasta de ${requestToReject.parent_folder_name})` : ''}`}
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
          bulkLabel={requests.filter(r => selected.includes(r.id)).map(r => r.folder_name).join(', ')}
          onClose={() => setShowRejectModal(false)}
          onRejectBulk={submitBulkRejection}
        />
      )}
    </div>
  );
}
