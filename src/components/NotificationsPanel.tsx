'use client';

import React, { useState } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

/**
 * A component that displays user notifications in a dropdown panel
 */
const NotificationsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New message',
      message: 'You have received a new message from Sarah',
      time: '5 minutes ago',
      read: false
    },
    {
      id: '2',
      title: 'Account update',
      message: 'Your account settings have been updated',
      time: '1 hour ago',
      read: false
    },
    {
      id: '3',
      title: 'New follower',
      message: 'John started following your moods',
      time: '3 hours ago',
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const togglePanel = () => {
    setIsOpen(!isOpen);
    
    // Mark notifications as read when opened
    if (!isOpen && unreadCount > 0) {
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      <button
        onClick={togglePanel}
        className="p-2 rounded-md hover:bg-muted relative"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-background rounded-md shadow-lg border z-10">
          <div className="p-3 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={() => setNotifications([])}
                  className="text-xs text-primary hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <p>No notifications</p>
              </div>
            ) : (
              <ul>
                {notifications.map(notification => (
                  <li key={notification.id} className={`border-b last:border-0 ${notification.read ? 'bg-background' : 'bg-muted/20'}`}>
                    <div className="p-3 relative">
                      <button
                        onClick={() => dismissNotification(notification.id)}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                        aria-label="Dismiss notification"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                      <h4 className="text-sm font-medium">{notification.title}</h4>
                      <p className="text-xs mt-1 text-muted-foreground">{notification.message}</p>
                      <span className="text-xs mt-2 text-muted-foreground block">{notification.time}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPanel; 