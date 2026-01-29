"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-exports';
import { Bell, CheckCircle, Info, AlertCircle, AlertTriangle, X, Check } from 'lucide-react';
import Link from 'next/link';
import { useNotifications, Notification } from '@/lib/context/notification-context';
import { formatDistanceToNow } from 'date-fns';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    dismissNotification 
  } = useNotifications();

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // When opening, automatically mark as read after a delay
      setTimeout(() => {
        markAllAsRead();
      }, 3000);
    }
  };

  const handleLinkClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return <Info size={16} className="text-blue-400" />;
      case 'success':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-amber-400" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-400" />;
      default:
        return <Info size={16} className="text-blue-400" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };

  return (
    <div className="relative">
      {/* Bell icon with notification indicator */}
      <button
        className="relative p-1.5 rounded-full hover:bg-mali-blue/20 transition-colors focus:outline-none"
        onClick={toggleDropdown}
      >
        <Bell size={20} className="text-mali-text-secondary hover:text-white transition-colors" />
        
        {/* Notification counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-mali-card border border-mali-blue/30 rounded-lg shadow-xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-3 border-b border-mali-blue/20 flex justify-between items-center bg-mali-sidebar">
              <h3 className="text-white font-medium">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-mali-blue-accent hover:underline flex items-center gap-1"
                >
                  <Check size={12} />
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div className="max-h-[60vh] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-mali-text-secondary">
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-mali-blue/10">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-3 hover:bg-mali-blue/10 relative ${notification.read ? 'opacity-75' : ''}`}
                    >
                      {/* Notification content */}
                      {notification.link ? (
                        <Link 
                          href={notification.link}
                          onClick={() => handleLinkClick(notification)}
                          className="block"
                        >
                          <div className="notification-content">
                            {renderNotificationContent(notification)}
                          </div>
                        </Link>
                      ) : (
                        <div className="notification-content">
                          {renderNotificationContent(notification)}
                        </div>
                      )}
                      
                      {/* Dismiss button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(notification.id);
                        }}
                        className="absolute top-3 right-3 p-1 text-mali-text-secondary hover:text-white rounded-full hover:bg-mali-blue/20"
                      >
                        <X size={14} />
                      </button>
                      
                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-mali-blue-accent"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-mali-blue/20 bg-mali-sidebar">
              <Link 
                href="/notifications"
                className="block w-full text-center text-xs text-mali-text-secondary hover:text-white py-1 hover:bg-mali-blue/20 rounded-md"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Helper function to render notification content
  function renderNotificationContent(notification: Notification) {
    return (
      <>
        <div className="flex gap-3 pr-6">
          <div className="flex-shrink-0 mt-0.5">
            {getNotificationIcon(notification.type)}
          </div>
          <div>
            <h4 className="text-sm font-medium text-white mb-1">{notification.title}</h4>
            <p className="text-xs text-mali-text-secondary mb-1">{notification.message}</p>
            <p className="text-[10px] text-mali-text-secondary/70">
              {formatTimeAgo(notification.createdAt)}
            </p>
          </div>
        </div>
      </>
    );
  }
} 