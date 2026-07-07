import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Notification = Database['public']['Tables']['notifications']['Row'];

interface NotificationPanelProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ userId, isOpen, onClose }: NotificationPanelProps) {
  const { t, i18n } = useTranslation('common');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) setNotifications(data);
  };

  const handleDismiss = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const handleMarkAsRead = async (id: string) => {
    await supabase.from('notifications').update({ unread: false }).eq('id', id);
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInMinutes < 60) return t('notifications.minutesAgo', { count: diffInMinutes });
    if (diffInHours < 24) return t('notifications.hoursAgo', { count: diffInHours });
    return date.toLocaleDateString(i18n.language === 'es' ? 'es-US' : 'en-US', { month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 w-[260px] bg-white z-50 shadow-2xl transition-transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--color-navy)]">{t('notifications.title')}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-16 h-16 bg-[var(--color-teal)]/10 rounded-full flex items-center justify-center mb-3">
                  <Check className="w-8 h-8 text-[var(--color-teal)]" />
                </div>
                <p className="text-gray-500 font-medium">{t('notifications.allCaughtUp')}</p>
                <p className="text-sm text-gray-400 mt-1">{t('notifications.noNew')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 relative ${
                      notification.unread
                        ? 'bg-white border-l-2 border-[var(--color-orange)]'
                        : 'bg-gray-50'
                    }`}
                    onClick={() => notification.unread && handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-[var(--color-navy)]">
                            {notification.from_name}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismiss(notification.id);
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
