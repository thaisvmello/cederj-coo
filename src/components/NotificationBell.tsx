import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FeedbackChannelDrawer } from './FeedbackChannelDrawer';

export const NotificationBell = () => {
  const [showDrawer, setShowDrawer] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <button
        onClick={() => setShowDrawer(true)}
        className="relative p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all border border-transparent hover:border-white/10 shrink-0"
        title="Notificações"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 sm:w-5 sm:h-5"
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
        {user && (
          <UnreadBadge userId={user.id} />
        )}
      </button>

      <FeedbackChannelDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
      />
    </>
  );
};

function UnreadBadge({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('is_read', false);
      if (!error) setCount(data?.length || 0);
    };
    fetchCount();

    const channel = supabase
      .channel(`notifications-badge:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchCount();
      })
      .subscribe();

    return () => {
      channel?.unsubscribe?.();
    };
  }, [userId]);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
      {count > 9 ? '9+' : count}
    </span>
  );
}
