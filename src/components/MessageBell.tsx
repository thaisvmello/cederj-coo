import { useState } from 'react';
import { Mail, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MessageSidebar } from './MessageSidebar';

export const MessageBell = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) return;
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
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id);
    
    if (!error) {
      fetchNotifications();
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <button
        onClick={() => setShowSidebar(true)}
        className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
        title="Mensagens e notificações"
      >
        <Mail className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <MessageSidebar 
        isOpen={showSidebar} 
        onClose={() => setShowSidebar(false)} 
      />
    </>
  );
};