import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
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

  // Lógica para fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching notifications:', error);
    else {
      setNotifications(data || []);
      const unread = data?.filter((n: any) => !n.is_read).length || 0;
      setUnreadCount(unread);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id);
    if (error) console.error('Error marking notifications as read:', error);
    else fetchNotifications();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'folder_request_rejection':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'new_content':
        return <AlertTriangle size={16} className="text-blue-500" />;
      case 'announcement':
        return <AlertTriangle size={16} className="text-purple-500" />;
      default:
        return <AlertTriangle size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
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
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">Nenhuma notificação</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer flex items-start space-x-3"
                  onClick={() => {
                    if (!n.is_read) {
                      supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
                    }
                    if (n.link) window.open(n.link, '_blank');
                  }}
                >
                  <div className="flex-shrink-0">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{n.title}</p>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {n.content}
                    </p>
                    {n.link && (
                      <p className="text-xs text-blue-600 mt-1">
                        Abrir no site
                      </p>
                    )}
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