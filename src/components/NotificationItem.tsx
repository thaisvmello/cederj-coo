import { supabase } from '../lib/supabase';
import { AlertTriangle, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRead,
}) => {
  const { user } = useAuth();

  const handleRead = async () => {
    if (!user || notification.is_read) return;
    const { error } = await (supabase as any)
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification.id);
    if (error) console.error('Error marking notification as read:', error);
    else onRead();
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
    <div
      className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => {
        handleRead();
        if (notification.link) window.open(notification.link, '_blank');
      }}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">{getIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900">{notification.title}</p>
          <p className="text-sm text-gray-600 line-clamp-2">{notification.content}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(notification.created_at).toLocaleString('pt-BR', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  );
};