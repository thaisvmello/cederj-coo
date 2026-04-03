import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, CheckCircle, AlertTriangle, Mail, Clock, ArrowLeft } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl transform transition-transform duration-300">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold">Mensagem</h3>
          <div className="w-5" />
        </div>

        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            {getIcon(notification.type)}
            <div>
              <h4 className="font-bold text-gray-900">{notification.title}</h4>
              <p className="text-sm text-gray-500">
                {new Date(notification.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {notification.content}
            </p>
          </div>

          {notification.link && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <a 
                href={notification.link} 
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Abrir no site
              </a>
            </div>
          )}

          {!isRead && (
            <button
              onClick={markAsRead}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar como lida
            </button>
          )}
        </div>
      </div>
    </div>
  );
}