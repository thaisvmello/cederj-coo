import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Bell, Mail, AlertTriangle } from 'lucide-react';

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

export const MessageBell = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Gerenciamento de foco para acessibilidade
  useEffect(() => {
    if (showSidebar) {
      // Focar no botão de fechar quando a sidebar abre
      closeButtonRef.current?.focus();
      
      // Adicionar listener para ESC
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeSidebar();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showSidebar]);

  // Focar no primeiro elemento da lista quando as notificações carregam
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showSidebar && !loading && listRef.current) {
      const firstItem = listRef.current.querySelector('[data-notification-id]');
      (firstItem as HTMLElement)?.focus();
    }
  }, [showSidebar, loading, notifications]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

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

  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };

  const closeSidebar = useCallback(() => {
    setShowSidebar(false);
  }, []);

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

  const markAsRead = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    if (error) {
      console.error('Error marking notification as read:', error);
    } else {
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'folder_request_rejection':
        return <AlertTriangle size={20} className="text-red-500" />;
      case 'new_content':
        return <Mail size={20} className="text-blue-500" />;
      case 'announcement':
        return <Mail size={20} className="text-purple-500" />;
      case 'message':
        return <Mail size={20} className="text-green-500" />;
      default:
        return <Mail size={20} className="text-gray-500" />;
    }
  };

  return (
    <>
      {/* Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity cursor-pointer"
          onClick={closeSidebar}
          onKeyDown={(e) => e.key === 'Escape' && closeSidebar()}
          tabIndex={0}
          aria-hidden="true"
        />
      )}

      {/* Botão de notificação */}
      <button
        onClick={toggleSidebar}
        className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
        aria-label={`${unreadCount} notificações não lidas`}
        aria-expanded={showSidebar}
        aria-haspopup="dialog"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Sidebar */}
      {showSidebar && (
        <div 
          ref={sidebarRef}
          className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out"
          role="dialog"
          aria-modal="true"
          aria-label="Painel de notificações"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Mensagens</h2>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 hover:bg-blue-50 rounded transition"
                >
                  Marcar todas como lidas
                </button>
              )}
              <button
                ref={closeButtonRef}
                onClick={closeSidebar}
                className="p-1 text-gray-400 hover:text-gray-600 transition rounded-full hover:bg-gray-100"
                aria-label="Fechar painel de notificações"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lista de mensagens */}
          <div 
            ref={listRef}
            className="flex-1 overflow-y-auto p-4 custom-scrollbar"
            role="list"
            aria-label="Lista de mensagens"
          >
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium">Nenhuma mensagem</p>
                <p className="text-xs text-gray-400 mt-1">Você não tem mensagens no momento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    data-notification-id={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Mensagem: ${notification.title}`}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !notification.is_read 
                        ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm text-gray-900 line-clamp-1">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
                          {notification.content}
                        </p>
                        {notification.link && (
                          <a 
                            href={notification.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Abrir no site
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                {unreadCount} não lidas de {notifications.length} total
              </span>
              <button
                onClick={fetchNotifications}
                className="text-blue-600 hover:text-blue-700 font-medium text-xs"
              >
                Atualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};