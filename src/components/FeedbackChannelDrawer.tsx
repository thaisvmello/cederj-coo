import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import type { FeedbackReport, FeedbackComment, Notification as BaseNotification } from '../lib/types';
import { 
  X, Send, Loader, ChevronRight, MessageSquare, Clock, 
  CheckCircle, AlertCircle, AlertTriangle, ArrowLeft, 
  Trash2, Megaphone, MessageCircle, Bell 
} from 'lucide-react';
import toast from 'react-hot-toast';

// Estendemos o tipo base para garantir que o TypeScript conheça o campo 'type'
interface Notification extends BaseNotification {
  type?: 'feedback' | 'news' | 'reply' | 'update';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialReportId?: string | null;
}

type FilterType = 'all' | 'feedback' | 'news' | 'reply' | 'update';

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
  
  // Novo estado para o filtro ativo
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const loadReportDetail = async (reportId: string) => {
    setLoading(true);
    try {
      const { data: reportData, error: reportError } = await supabase
        .from('feedback_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (reportError) throw reportError;

      if (reportData) {
        setSelectedReport(reportData as FeedbackReport);
        const { data: commentsData } = await supabase
          .from('feedback_comments')
          .select('*')
          .eq('report_id', reportId)
          .order('created_at', { ascending: true });

        if (commentsData && commentsData.length > 0) {
          const userIds = [...new Set(commentsData.map(c => c.user_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', userIds);

          const formatted = commentsData.map(comment => {
            const profile = profilesData?.find(p => p.id === comment.user_id);
            return {
              ...comment,
              first_name: profile?.first_name || 'Usuário',
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
      toast.error('Erro ao carregar detalhes');
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

  const handleBackToList = () => {
    setSelectedNotification(null);
    setSelectedReport(null);
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    fetchNotifications();
  };

  // NOVA FUNÇÃO: Excluir notificação
  const handleDeleteNotification = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Evita que clique no card abra os detalhes
    
    // Atualização otimista (remove da tela imediatamente)
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    // Se a notificação excluída for a que está aberta, volta pra lista
    if (selectedNotification?.id === id) {
      handleBackToList();
    }

    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      toast.success('Mensagem excluída');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir mensagem');
      fetchNotifications(); // Reverte a atualização otimista em caso de erro
    }
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
      toast.error(error?.message || 'Erro ao enviar resposta');
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
  const hasActiveDetail = Boolean(selectedNotification || selectedReport);

  // Lógica de filtro baseada no tipo (fallback para feedback caso tenha report_id)
  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    
    // Se o backend ainda não tiver a coluna type mas você quiser testar,
    // usamos o feedback_report_id como inferência provisória para "feedback"
    const resolvedType = n.type || (n.feedback_report_id ? 'feedback' : 'update');
    return resolvedType === activeFilter;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative ml-auto w-full md:w-3/4 max-w-5xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-2 overflow-hidden">
            {hasActiveDetail && (
              <button
                onClick={handleBackToList}
                className="md:hidden p-2 -ml-2 mr-1 hover:bg-gray-200 rounded-full flex-shrink-0 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
            )}
            <Bell className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <h3 className="font-bold text-gray-800 text-sm sm:text-base truncate">Central de Notificações</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] sm:text-xs rounded-full px-2 py-0.5 font-bold flex-shrink-0">
                {unreadCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={handleMarkAllRead} className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">
              Marcar lidas
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LISTA DE NOTIFICAÇÕES */}
          <div className={`w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-white ${hasActiveDetail ? 'hidden md:flex' : 'flex'}`}>
            
            {/* ABAS DE FILTRO */}
            <div className="flex overflow-x-auto custom-scrollbar p-2 gap-2 border-b border-gray-100 bg-gray-50">
              <button 
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
              >
                Todas
              </button>
              <button 
                onClick={() => setActiveFilter('feedback')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeFilter === 'feedback' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
              >
                <MessageSquare className="w-3 h-3" /> Feedback
              </button>
              <button 
                onClick={() => setActiveFilter('news')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeFilter === 'news' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
              >
                <Megaphone className="w-3 h-3" /> Notícias
              </button>
              <button 
                onClick={() => setActiveFilter('reply')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeFilter === 'reply' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
              >
                <MessageCircle className="w-3 h-3" /> Respostas
              </button>
              <button 
                onClick={() => setActiveFilter('update')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeFilter === 'update' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
              >
                <Bell className="w-3 h-3" /> Atualizações
              </button>
            </div>

            {/* CONTEÚDO DA LISTA */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {drawerLoading ? (
                <div className="p-8 flex flex-col items-center gap-2">
                  <Loader className="w-6 h-6 animate-spin text-purple-600" />
                  <p className="text-xs text-gray-400">Carregando...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
                  <Bell className="w-8 h-8 text-gray-300" />
                  <p>Nenhuma mensagem nesta categoria</p>
                </div>
              ) : (
                filteredNotifications.map((n) => (
                  <div 
                    key={n.id}
                    className={`group relative flex border-b border-gray-100 transition-colors ${
                      selectedNotification?.id === n.id ? 'bg-purple-50 border-l-4 border-l-purple-600' : 'border-l-4 border-l-transparent hover:bg-gray-50'
                    }`}
                  >
                    <button
                      onClick={() => handleSelectNotification(n)}
                      className="flex-1 text-left p-4 pr-12"
                    >
                      <div className="flex items-start gap-3">
                        {!n.is_read && <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0 shadow-sm" />}
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm truncate pr-2 ${n.is_read ? 'text-gray-700 font-medium' : 'text-gray-900 font-bold'}`}>{n.title}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{n.content}</p>
                          <p className="text-[10px] text-gray-400 mt-2 font-medium">
                            {new Date(n.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </button>
                    
                    {/* Botão de Excluir */}
                    <button
                      onClick={(e) => handleDeleteNotification(n.id, e)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                      title="Excluir notificação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ÁREA DE DETALHES/LEITURA */}
          <div className={`flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30 flex-col ${!hasActiveDetail ? 'hidden md:flex md:items-center md:justify-center' : 'flex'}`}>
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <Loader className="w-8 h-8 animate-spin text-purple-600" />
                <p className="text-xs text-gray-400">Carregando detalhes...</p>
              </div>
            ) : selectedReport ? (
              <div className="flex-1 flex flex-col p-3 sm:p-6 max-w-3xl mx-auto w-full">
                
                {/* CABEÇALHO DO REPORT */}
                <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm mb-4 flex-shrink-0 relative">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pr-8">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">{selectedReport.title}</h4>
                      {getStatusIcon(selectedReport.status)}
                    </div>
                    <span className={`self-start sm:self-center text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap ${getStatusBadge(selectedReport.status)}`}>
                      {getStatusLabel(selectedReport.status)}
                    </span>
                  </div>
                  
                  {/* Botão Excluir no Header do Detalhe (se atrelado a uma notificação na tela) */}
                  {selectedNotification && (
                    <button 
                      onClick={() => handleDeleteNotification(selectedNotification.id)}
                      className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 italic">
                    Enviado por <strong className="text-gray-700 not-italic">{selectedReport.first_name} {selectedReport.last_name}</strong>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedReport.description}</p>
                </div>

                {/* HISTÓRICO DE MENSAGENS */}
                <div className="flex-1 pb-4">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-widest px-1 mb-4">
                    <MessageSquare className="w-4 h-4" /> Histórico
                  </h4>
                  
                  {comments.length === 0 ? (
                    <div className="bg-white border border-gray-200 p-8 rounded-2xl text-center">
                      <p className="text-sm text-gray-400">Nenhuma resposta ainda. Aguarde o retorno.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => {
                        const isMine = comment.user_id === user?.id;
                        return (
                          <div key={comment.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-4 rounded-2xl shadow-sm border max-w-[85%] sm:max-w-[75%] ${isMine ? 'bg-white border-gray-200 rounded-tr-sm' : 'bg-purple-50 border-purple-100 rounded-tl-sm'}`}>
                              <div className="flex items-center justify-between gap-4 mb-2">
                                <span className="text-xs font-bold text-gray-900 truncate">{comment.first_name} {comment.last_name}</span>
                                <span className="text-[10px] text-gray-400 flex-shrink-0">{new Date(comment.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed break-words">{comment.content}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* INPUT DE RESPOSTA */}
                {canReply && (
                  <div className="sticky bottom-0 bg-gray-50/90 backdrop-blur-md pt-2 pb-4 sm:pb-2 z-10 border-t border-gray-200/50 mt-auto">
                    <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-md border border-gray-200 focus-within:border-purple-400 transition-colors">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escreva sua resposta..."
                        className="flex-1 px-3 py-2 text-sm focus:outline-none bg-transparent"
                        onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                      />
                      <button
                        onClick={handleReply}
                        disabled={sendingReply || !replyText.trim()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2"
                      >
                        {sendingReply ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span className="hidden sm:inline">Enviar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : selectedNotification ? (
              <div className="max-w-xl mx-auto flex-1 flex flex-col justify-center p-4">
                <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500" />
                  
                  {/* Botão de Excluir dentro da leitura da notificação simples */}
                  <button 
                    onClick={() => handleDeleteNotification(selectedNotification.id)}
                    className="absolute top-6 right-6 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Excluir notificação"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-4 leading-tight pr-10">{selectedNotification.title}</h3>
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
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="p-6 bg-gray-100 rounded-full mb-4">
                  <Bell className="w-12 h-12 text-gray-300" />
                </div>
                <p className="text-sm font-medium">Selecione uma notificação na lista</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}