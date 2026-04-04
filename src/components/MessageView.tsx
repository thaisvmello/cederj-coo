import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, AlertTriangle, Mail, ArrowLeft } from 'lucide-react';

interface MessageViewProps {
  notification: any;
  onClose: () => void;
}

export function MessageView({ notification, onClose }: MessageViewProps) {
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
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center gap-3">
        <button 
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          {getIcon(notification.type)}
          <h3 className="text-lg font-semibold text-gray-900">Mensagem</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-start gap-3 mb-4">
          {getIcon(notification.type)}
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-lg mb-2">{notification.title}</h4>
            <p className="text-sm text-gray-500 mb-4">
              {new Date(notification.created_at).toLocaleString('pt-BR', { 
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                {notification.content}
              </p>
            </div>

            {!isRead && (
              <button
                onClick={markAsRead}
                className="mt-6 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <CheckCircle className="w-4 h-4 mr-2 inline" />
                Marcar como lida
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}