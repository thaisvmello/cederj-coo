import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Mail, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NotificationItemProps {
  notification: {
    id: string;
    title: string;
    content: string;
    type: string;
    link?: string;
    is_read: boolean;
    created_at: string;
  };
  onRead: () => void;
  onSelect?: (notification: any) => void;
}

export function NotificationItem({ notification, onRead, onSelect }: NotificationItemProps) {
  const [isRead, setIsRead] = useState(notification.is_read);
  const { user } = useAuth();

  const markAsRead = async () => {
    if (isRead || !user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification.id);

    if (!error) {
      setIsRead(true);
      onRead();
    }
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect(notification);
    } else {
      // Comportamento padrão: marcar como lida e abrir link se houver
      markAsRead();
      if (notification.link) {
        window.open(notification.link, '_blank');
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'folder_request_rejection':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'new_content':
        return <Mail size={16} className="text-blue-500" />;
      case 'announcement':
        return <Mail size={16} className="text-purple-500" />;
      case 'message':
        return <Mail size={16} className="text-green-500" />;
      default:
        return <Mail size={16} className="text-gray-500" />;
    }
  };

  return (
    <div
      className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
        !isRead ? 'border-l-4 border-blue-500' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">{getIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-sm text-gray-900">{notification.title}</p>
            <p className="text-xs text-gray-400">
              {new Date(notification.created_at).toLocaleString('pt-BR')}
            </p>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
            {notification.content}
          </p>
          {notification.link && (
            <p className="text-xs text-blue-600 mt-1">
              <ArrowRight className="w-3 h-3 inline" />
              Abrir no site
            </p>
          )}
        </div>
      </div>
    </div>
  );
}