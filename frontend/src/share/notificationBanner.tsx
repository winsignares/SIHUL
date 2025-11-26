import { useState } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  message: string;
  type: NotificationType;
  duration?: number;
}

export function useNotification() {
  const [notification, setNotification] = useState<Notification | null>(null);

  function showNotification(message: string, type: NotificationType = 'info', duration = 3000) {
    setNotification({ message, type, duration });
    setTimeout(() => setNotification(null), duration);
  }

  return { notification, showNotification };
}

export function NotificationBanner({ notification }: { notification: Notification | null }) {
  if (!notification) return null;
  const color = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-yellow-500',
  }[notification.type];
  return (
    <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white shadow-lg ${color}`}
      style={{ minWidth: 250 }}>
      {notification.message}
    </div>
  );
}
