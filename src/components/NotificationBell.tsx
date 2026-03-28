import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { NotificationList } from './NotificationList';
import { useAuth } from '../contexts/AuthContext';

export const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = (supabase as any)
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload: any) => {
          if (payload?.new?.user_id === user.id) {
            fetchNotifications();
          }
        }
      )
      .subscribe();

    fetchNotifications();

    return () => {
      channel?.unsubscribe?.();
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data, error } = await (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching notifications:', error);
    else {
      const unread = data?.filter((n: any) => !n.is_read).length || 0;
      setUnreadCount(unread);
      setNotifications(data || []);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const { error } = await (supabase as any)
      .from('notifications')
      .eq('user_id', user.id)
      .update({ is_read: true });
    if (error) console.error('Error marking notifications as read:', error);
    else fetchNotifications();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'folder_request_rejection':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'new_content':
        return <Bell size={16} className="text-blue-500" />;
      case 'announcement':
        return <Bell size={16} className="text-purple-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notificações</h3>
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Marcar todas como lidas
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">Nenhuma notificação</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer flex items-start space-x-3"
                  onClick={() => {
                    if (!n.is_read) {
                      (supabase as any)
                        .from('notifications')
                        .update({ is_read: true })
                        .eq('id', n.id);
                    }
                    if (n.link) window.open(n.link, '_blank');
                  }}
                >
                  <div className="flex-shrink-0">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{n.title}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{n.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(n.created_at).toLocaleString('pt-BR', {
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
            {notifications.length} notificações
          </div>
        </div>
      )}
    </div>
  );
};