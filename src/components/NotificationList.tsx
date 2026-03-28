import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { NotificationItem } from './NotificationItem';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export const NotificationList: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching notifications:', error);
    else setNotifications(data || []);
    setLoading(false);
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

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-center text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white rounded-lg shadow-lg border border-gray-200">
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
          <div className="p-4 text-gray-500 text-center">
            Nenhuma notificação
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onRead={fetchNotifications} />
          ))
        )}
      </div>
      <div className="p-4 border-t border-gray-200 text-sm text-gray-500">
        {notifications.length} notificações
      </div>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="w-full text-sm text-gray-600 hover:text-gray-900"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};