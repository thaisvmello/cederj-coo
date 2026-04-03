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

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
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

        <div className="flex h-full">
          {/* Sidebar Navigation */}
          <div className="w-32 bg-gray-50 border-r border-gray-200">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                  activeTab === 'notifications' ? 'bg-white text-blue-600' : 'text-gray-600'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span className="font-medium">Notificações</span>
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                  activeTab === 'messages' ? 'bg-white text-blue-600' : 'text-gray-600'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span className="font-medium">Mensagens</span>
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">
                    {activeTab === 'notifications' ? 'Notificações' : 'Mensagens'}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {notifications.filter(n => activeTab === 'notifications' || n.type === 'message').length} itens
                  </span>
                </div>
              </div>

              {/* Content */}
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
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onRead={fetchNotifications}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}