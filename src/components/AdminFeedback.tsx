import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Flag,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  FileText,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { useAdmin } from '../hooks/useAdmin';
import type { FeedbackReport, FeedbackComment } from '../lib/types';
import toast from 'react-hot-toast';

export function AdminFeedback() {
  const { isAdmin } = useAdmin();
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [commentsMap, setCommentsMap] = useState<Record<string, FeedbackComment[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) loadReports();
  }, [isAdmin]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data: reportsData, error: reportsError } = await supabase
        .from('feedback_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      if (!reportsData || reportsData.length === 0) {
        setReports([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(reportsData.map(r => r.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      const formatted = reportsData.map(report => {
        const profile = profilesData?.find(p => p.id === report.user_id);
        return {
          ...report,
          first_name: profile?.first_name || 'Estudante',
          last_name: profile?.last_name || '',
          email: profile?.id || '',
        };
      });

      setReports(formatted);

      const reportIds = reportsData.map(r => r.id);
      const { data: commentsData } = await supabase
        .from('feedback_comments')
        .select('*')
        .in('report_id', reportIds)
        .order('created_at', { ascending: true });

      if (commentsData) {
        const grouped: Record<string, FeedbackComment[]> = {};
        commentsData.forEach(comment => {
          if (!grouped[comment.report_id]) grouped[comment.report_id] = [];
          const profile = profilesData?.find(p => p.id === comment.user_id);
          grouped[comment.report_id].push({
            ...comment,
            first_name: profile?.first_name || 'Estudante',
            last_name: profile?.last_name || '',
          });
        });
        setCommentsMap(grouped);
      }
    } catch (error) {
      console.error('Erro ao carregar feedback:', error);
      toast.error('Erro ao carregar feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: FeedbackReport['status']) => {
    try {
      const { error } = await supabase
        .from('feedback_reports')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast.success('Status atualizado');
      loadReports();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return null;
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-purple-600" />
                        <h3 className="font-bold text-gray-800">Feedback & Sugestões</h3>
                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          {reports.length}
                        </span>
                      </div>
                      <button onClick={loadReports} className="p-2 hover:bg-gray-200 rounded-lg transition text-gray-600">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

      <div className="divide-y divide-gray-100 max-h-[700px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Carregando feedback...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center">
            <Flag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum feedback para avaliar.</p>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="p-5 hover:bg-gray-50/50 transition">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{report.title}</span>
                      {getStatusIcon(report.status)}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        report.type === 'bug'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {report.type === 'bug' ? 'Bug' : 'Sugestão'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(report.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-500">
                      Enviado por <strong>{report.first_name} {report.last_name}</strong>
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">
                    {report.description}
                  </p>

                  {/* Attachments */}
                  {report.attachments && report.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {report.attachments.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs hover:bg-blue-100 transition"
                        >
                          <ImageIcon className="w-3 h-3" />
                          Anexo {i + 1}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mb-2">
                    <select
                      value={report.status}
                      onChange={(e) => handleStatusChange(report.id, e.target.value as FeedbackReport['status'])}
                      className="text-xs p-1 border rounded bg-white"
                    >
                      <option value="open">Aberto</option>
                      <option value="in_progress">Em Progresso</option>
                      <option value="resolved">Resolvido</option>
                      <option value="closed">Fechado</option>
                    </select>
                  </div>

                  {/* Comments toggle */}
                  {commentsMap[report.id] && commentsMap[report.id].length > 0 && (
                    <>
                      <button
                        onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-2"
                      >
                        {expandedId === report.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        {commentsMap[report.id].length} comentário{commentsMap[report.id].length > 1 ? 's' : ''}
                      </button>

                      {expandedId === report.id && (
                        <div className="space-y-3 mt-2 ml-4 pl-3 border-l-2 border-gray-200">
                          {commentsMap[report.id].map((comment) => (
                            <div key={comment.id} className="bg-white border border-gray-100 p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-gray-900">
                                  {comment.first_name} {comment.last_name}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(comment.created_at).toLocaleString('pt-BR')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                              {comment.attachments && comment.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {comment.attachments.map((url, i) => (
                                    <a
                                      key={i}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs hover:bg-blue-100 transition"
                                    >
                                      <ImageIcon className="w-3 h-3" />
                                      Imagem {i + 1}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
