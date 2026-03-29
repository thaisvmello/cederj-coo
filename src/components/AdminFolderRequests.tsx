import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, Clock, FolderPlus, Loader, RefreshCw } from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { RejectRequestModal } from './RejectRequestModal';
import { FolderRequest } from '../lib/types';

export function AdminFolderRequests() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  const [requests, setRequests] = useState<FolderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [requestToReject, setRequestToReject] = useState<FolderRequest | null>(null);

  useEffect(() => {
    if (isAdmin) loadRequests();
  }, [isAdmin]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('folder_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading folder requests:', error);
        setRequests([]);
        return;
      }

      setRequests(data || []);
    } catch (e) {
      console.error('Unexpected error loading folder requests:', e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (req: FolderRequest) => {
    setProcessingId(req.id);
    try {
      const { error: folderError } = await supabase
        .from('folders')
        .insert({
          name: req.folder_name,
          course_id: req.course_id,
          parent_folder_id: null,
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

  const handleReject = (req: FolderRequest) => {
    setRequestToReject(req);
    setShowRejectModal(true);
  };

  const submitRejection = async (requestId: string, message: string, link?: string) => {
    if (!user) return;
    const { error: updateError } = await supabase
      .from('folder_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (updateError) throw updateError;

    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: requestToReject?.requested_by,
      title: 'Solicitação de pasta rejeitada',
      content: message,
      type: 'folder_request_rejection',
      link: link || null,
      is_read: false,
    });

    if (notifError) throw notifError;

    toast.success('Rejeição enviada ao solicitante');
    setShowRejectModal(false);
    setRequestToReject(null);
    loadRequests();
  };

  if (!isAdmin) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-indigo-800">Solicitações de Pastas</h3>
            <span className="bg-indigo-200 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {requests.length}
            </span>
          </div>
          <button
            onClick={loadRequests}
            className="p-2 hover:bg-indigo-100 rounded-lg transition text-indigo-600"
            title="Atualizar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 flex justify-center">
          <Loader className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : requests.length === 0 ? (
        <div className="p-8 text-center text-gray-500">Nenhuma solicitação pendente</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {requests.map((req) => (
            <div key={req.id} className="p-4 hover:bg-gray-50 transition flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{req.folder_name}</p>
                <p className="text-sm text-gray-600">
                  <strong>Curso ID:</strong> {req.course_id}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  <Clock className="inline w-3 h-3 mr-1" />
                  {new Date(req.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleApprove(req)}
                  disabled={processingId === req.id}
                  className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition disabled:opacity-50"
                >
                  {processingId === req.id ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleReject(req)}
                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showRejectModal && requestToReject && (
        <RejectRequestModal
          isOpen={showRejectModal}
          onRequestId={requestToReject.id}
          onRequesterName={requestToReject.requested_by}
          onRequestTitle={requestToReject.folder_name}
          onClose={() => setShowRejectModal(false)}
          onReject={submitRejection}
        />
      )}
    </div>
  );
}