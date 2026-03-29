import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const MessageBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`messages:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload: any) => {
          if (payload?.new?.user_id === user.id) {
            fetchMessages();
          }
        }
      )
      .subscribe();

    fetchMessages();

    return () => {
      channel?.unsubscribe?.();
    };
  }, [user]);

  const fetchMessages = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .match({ user_id: user.id, type: ['announcement', 'message'] })
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching messages:', error);
    else {
      setMessages(data || []);
      const unread = data?.filter((m: any) => !m.is_read).length || 0;
      setUnreadCount(unread);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .match({ user_id: user.id, type: ['announcement', 'message'] })
      .update({ is_read: true });
    if (error) console.error('Error marking messages as read:', error);
    else fetchMessages();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <AlertTriangle size={16} className="text-purple-500" />;
      case 'message':
        return <Mail size={16} className="text-blue-500" />;
      default:
        return <AlertTriangle size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
        title="Mensagens e novidades"
      >
        <Mail className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Mensagens</h3>
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Marcar todas como lidas
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">Nenhuma mensagem</div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer flex items-start space-x-3"
                  onClick={() => {
                    if (!m.is_read) {
                      supabase.from('notifications').update({ is_read: true }).eq('id', m.id);
                    }
                    if (m.link) window.open(m.link, '_blank');
                  }}
                >
                  <div className="flex-shrink-0">{getIcon(m.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{m.title}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{m.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(m.created_at).toLocaleString('pt-BR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-gray-200 text-sm text-gray-500">
            {messages.length} mensagens
          </div>
        </div>
      )}
    </div>
  );
};