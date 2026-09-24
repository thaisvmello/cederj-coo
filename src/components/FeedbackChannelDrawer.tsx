import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import type { FeedbackReport, FeedbackComment, Notification } from '../lib/types';
import { X, Send, Loader, ChevronRight, MessageSquare, Clock, CheckCircle, AlertCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialReportId?: string | null;
}

export function FeedbackChannelDrawer({ isOpen, onClose, initialReportId }: Props) {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedReport, setSelectedReport] = useState<FeedbackReport | null>(null);
  const [comments, setComments] = useState<FeedbackComment[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching notifications:', error);
    else setNotifications(data || []);
  }, [user]);

  useEffect(() => {
    if (!isOpen || !user) return;
    setDrawerLoading(true);
    fetchNotifications().finally(() => setDrawerLoading(false));
  }, [isOpen, user, fetchNotifications]);

  useEffect(() => {
    if (isOpen && initialReportId) {
      loadReportDetail(initialReportId);
    }
  }, [isOpen, initialReportId]);

  const loadReportDetail = async (reportId: string) => {
    setLoading(true);
    try {
      const { data: reportData } = await supabase
        .from('feedback_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (reportData) {
        setSelectedReport(reportData as FeedbackReport);
        const { data: commentsData } = await supabase
          .from('feedback_comments')
          .select('*')
          .eq('report_id', reportId)
          .order('created_at', { ascending: true });

        if (commentsData) {
          const userIds = [...new Set(commentsData.map(c => c.user_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', userIds);

          const formatted = commentsData.map(comment => {
            const profile = profilesData?.find(p => p.id === comment.user_id);
            return {
              ...comment,
              first_name: profile?.first_name || 'Estudante',
              last_name: profile?.last_name || '',
            };
          });
          setComments(formatted);
        } else {
          setComments([]);
        }
      }
    } catch (error) {
      console.error('Error loading report detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNotification = async (notification: Notification) => {
    setSelectedNotification(notification);
    if (notification.feedback_report_id) {
      await loadReportDetail(notification.feedback_report_id);
    } else {
      setSelectedReport(null);
      setComments([]);
    }
    
    if (!notification.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    fetchNotifications();
  };

  const handleReply = async () => {
    if (!selectedReport || !replyText.trim() || !user) return;
    setSendingReply(true);
    try {
      const { error } = await supabase.rpc('create_feedback_response', {
        p_report_id: selectedReport.id,
        p_content: replyText.trim(),
      });
      if (error) throw error;
      setReplyText('');
      toast.success('Resposta enviada!');
      await loadReportDetail(selectedReport.id);
      await fetchNotifications();
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast.error(error.message || 'Erro ao enviar resposta');
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'open': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <AlertTriangle className="w-4 h-4 text-gray-500" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Novo';
      case 'open': return 'Aberto';
      case 'in_progress': return 'Em andamento';
      case 'resolved': return 'Resolvido';
      case 'closed': return 'Fechado';
      default: return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return 'bg-rose-100 text-rose-700';
      case 'open': return 'bg-red-100 text-red-700';
      case 'in_progress': return 'bg-amber-100 text-amber-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const canReply = selectedReport && (isAdmin || user?.id === selectedReport.user_id) && selectedReport.status !== 'closed';

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-2">
            {(selectedNotification || selectedReport) && (
              <button
                onClick={handleBackToList}
                className="md:hidden p-1 -ml-1 hover:bg-gray-200 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
            )}
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-800 text-sm sm:text-base">Canal de Feedback</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] sm:text-xs rounded-full px-2 py-0.5 font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleMarkAllRead} className="text-[10px] sm:text-sm text-blue-600 hover:text-blue-700 font-medium">
              Marcar lidas
            </button>
            <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className={`w-full md:w-80 border-r border-gray-200 overflow-y-auto custom-scrollbar ${selectedNotification ? 'hidden md:block' : 'block'}`}>
            {drawerLoading ? (
              <div className="p-8 flex flex-col items-center gap-2">
                <Loader className="w-6 h-6 animate-spin text-purple-600" />
                <p className="text-xs text-gray-400">Carregando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">Nenhuma notificação</div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleSelectNotification(n)}
                  className={`w-full text-left p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 transition ${
                    selectedNotification?.id === n.id ? 'bg-purple-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{n.content}</p>
                      <p className="text-[10px] text-gray-400 mt-2">
                        {new Date(n.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className={`flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 bg-gray-50/30 ${!selectedNotification ? 'hidden md:flex flex-col items-center justify-center' : 'block'}`}>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader className="w-8 h-8 animate-spin text-purple-600" />
                <p className="text-xs text-gray-400">Carregando...</p>
              </div>
            ) : selectedReport ? (
              <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base sm:text-lg font-bold text-gray-900">{selectedReport.title}</h4>
                      {getStatusIcon(selectedReport.status)}
                    </div>
                    <span className={`self-start sm:self-center text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusBadge(selectedReport.status)}`}>
                      {getStatusLabel(selectedReport.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 italic">
                    Enviado por <strong className="text-gray-700 not-italic">{selectedReport.first_name} {selectedReport.last_name}</strong>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedReport.description}</p>
                  {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                      {selectedReport.attachments.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition shadow-sm">
                          <ChevronRight className="w-3 h-3" /> Anexo {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-widest px-1">
                    <MessageSquare className="w-4 h-4" />
                    Histórico
                  </h4>
                  {comments.length === 0 ? (
                    <div className="bg-white border border-gray-200 p-8 rounded-2xl text-center">
                      <p className="text-sm text-gray-400">Nenhuma resposta ainda. Aguarde o retorno da moderação.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <div key={comment.id} className={`p-4 rounded-2xl shadow-sm border ${comment.user_id === user?.id ? 'bg-white border-gray-200 ml-4' : 'bg-purple-50 border-purple-100 mr-4'}`}>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-bold text-gray-900">{comment.first_name} {comment.last_name}</span>
                            <span className="text-[10px] text-gray-400">{new Date(comment.created_at).toLocaleString('pt-BR')}</span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {canReply && (
                  <div className="sticky bottom-0 bg-gray-50/80 backdrop-blur-sm pt-4 pb-2">
                    <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-lg border border-gray-200">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Responder ao chamado..."
                        className="flex-1 px-4 py-2 text-sm focus:outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                      />
                      <button
                        onClick={handleReply}
                        disabled={sendingReply || !replyText.trim()}
                        className="p-2 sm:px-4 sm:py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-50 transition flex items-center gap-2 shadow-md"
                      >
                        {sendingReply ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span className="hidden sm:inline">Enviar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : selectedNotification ? (
              <div className="max-w-xl mx-auto h-full flex flex-col justify-center">
                <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-purple-600" />
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-4 leading-tight">{selectedNotification.title}</h3>
                  <div className="w-12 h-1 bg-gray-100 mb-6 rounded-full" />
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedNotification.content}</p>
                  <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {new Date(selectedNotification.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-300">
                <div className="p-6 bg-gray-100 rounded-full mb-4">
                  <MessageSquare className="w-12 h-12" />
                </div>
                <p className="text-sm font-medium">Selecione uma notificação na lista ao lado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

