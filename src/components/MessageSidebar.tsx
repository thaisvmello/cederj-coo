import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { NotificationItem } from './NotificationItem';
import { MessageView } from './MessageView';
import { X, Bell, Mail, ChevronRight, ChevronLeft } from 'lucide-react';

interface MessageSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export function MessageSidebar({ isOpen, onClose }: MessageSidebarProps) {
  const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !isOpen) return;
    fetchNotifications();
  }, [user, isOpen]);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching notifications:', error);
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error marking notifications as read:', error);
    } else {
      fetchNotifications();
    }
  };

  const handleSelectNotification = async (notification: Notification) => {
    // Marcar como lida se ainda não estiver
    if (!notification.is_read && user) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
      // Atualizar o estado local
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
    }
    setSelectedNotification(notification);
  };

  const handleBackToList = () => {
    setSelectedNotification(null);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Mensagens</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{unreadCount} não lidas</span>
            <button 
              onClick={markAllAsRead}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Marcar todas como lidas
            </button>
          </div>
        </div>

        {/* Navegação por abas */}
        {!selectedNotification && (
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                activeTab === 'notifications' 
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Notificações
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                activeTab === 'messages' 
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Mensagens
            </button>
          </div>
        )}

        {/* Conteúdo */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedNotification ? (
            // Visualização de mensagem completa
            <div className="flex-1 overflow-y-auto">
              <MessageView 
                notification={selectedNotification} 
                onClose={handleBackToList}
              />
            </div>
          ) : (
            // Lista de notificações/mensagens
            <>
              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>Nenhuma {activeTab === 'notifications' ? 'notificação' : 'mensagem'} encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications
                      .filter(n => activeTab === 'notifications' || n.type === 'message')
                      .map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleSelectNotification(notification)}
                          className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 ${
                            !notification.is_read ? 'border-blue-500 bg-blue-50/30' : 'border-transparent'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {notification.type === 'folder_request_rejection' ? (
                                <span className="text-red-500">⚠️</span>
                              ) : notification.type === 'new_content' ? (
                                <span className="text-blue-500">📬</span>
                              ) : notification.type === 'announcement' ? (
                                <span className="text-purple-500">📢</span>
                              ) : notification.type === 'message' ? (
                                <span className="text-green-500">💬</span>
                              ) : (
                                <span className="text-gray-500">🔔</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                                <p className="text-xs text-gray-400">
                                  {new Date(notification.created_at).toLocaleString('pt-BR')}
                                </p>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {notification.content}
                              </p>
                              {notification.link && (
                                <p className="text-xs text-blue-600 mt-1">
                                  → Abrir no site
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}