"use client";

import { useState } from 'react';
import { useNotifications } from '@/lib/context/notification-context';
import { 
  Bell, Info, CheckCircle, AlertTriangle, AlertCircle, 
  Check, Trash2, ChevronDown, ChevronUp, X 
} from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/framer-exports';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    dismissNotification
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [sortExpanded, setSortExpanded] = useState(false);

  // Filter notifications based on read status
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce<Record<string, typeof notifications>>(
    (groups, notification) => {
      const date = new Date(notification.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let groupKey: string;
      
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = format(date, 'MMM d, yyyy');
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      
      groups[groupKey].push(notification);
      return groups;
    },
    {}
  );

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info size={18} className="text-blue-400" />;
      case 'success':
        return <CheckCircle size={18} className="text-green-400" />;
      case 'warning':
        return <AlertTriangle size={18} className="text-amber-400" />;
      case 'error':
        return <AlertCircle size={18} className="text-red-400" />;
      default:
        return <Info size={18} className="text-blue-400" />;
    }
  };

  // Format time for notification
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'h:mm a');
    } catch (error) {
      return '';
    }
  };

  // Format time ago for notification
  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bell className="text-mali-blue-accent" /> Notifications
            {unreadCount > 0 && (
              <span className="text-sm bg-mali-blue/30 text-mali-blue-accent px-2 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-mali-text-secondary mt-1">
            Stay updated with the latest news and activity
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-mali-blue/20 hover:bg-mali-blue/30 text-mali-blue-accent rounded-md text-sm"
            >
              <Check size={16} />
              <span>Mark all as read</span>
            </button>
          )}
          
          {notifications.length > 0 && (
            <button
              onClick={clearNotifications}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/20 hover:bg-red-900/30 text-red-400 rounded-md text-sm"
            >
              <Trash2 size={16} />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-mali-card border border-mali-blue/20 rounded-lg mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                filter === 'all'
                  ? 'bg-mali-blue text-white'
                  : 'bg-mali-blue/20 text-mali-text-secondary hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                filter === 'unread'
                  ? 'bg-mali-blue text-white'
                  : 'bg-mali-blue/20 text-mali-text-secondary hover:text-white'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                filter === 'read'
                  ? 'bg-mali-blue text-white'
                  : 'bg-mali-blue/20 text-mali-text-secondary hover:text-white'
              }`}
            >
              Read
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setSortExpanded(!sortExpanded)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-mali-blue/20 text-mali-text-secondary hover:text-white rounded-md"
            >
              <span>Sort by: Newest first</span>
              {sortExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            <AnimatePresence>
              {sortExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-1 w-48 bg-mali-card border border-mali-blue/30 rounded-md shadow-lg overflow-hidden z-10"
                >
                  <button className="w-full px-3 py-2 text-left text-sm text-white bg-mali-blue/20">
                    Newest first
                  </button>
                  <button className="w-full px-3 py-2 text-left text-sm text-mali-text-secondary hover:bg-mali-blue/20 hover:text-white">
                    Oldest first
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Notification list */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-mali-card border border-mali-blue/20 rounded-lg p-10 text-center">
          <div className="flex justify-center mb-4">
            <Bell size={48} className="text-mali-text-secondary/50" />
          </div>
          <h2 className="text-xl font-medium text-white mb-2">No notifications</h2>
          <p className="text-mali-text-secondary">
            {filter !== 'all'
              ? `You don't have any ${filter} notifications`
              : "You don't have any notifications yet"}
          </p>
        </div>
      ) : (
        <div className="bg-mali-card border border-mali-blue/20 rounded-lg divide-y divide-mali-blue/20">
          {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
            <div key={date}>
              <h3 className="px-6 py-3 text-sm font-medium text-mali-text-secondary bg-mali-blue/10">
                {date}
              </h3>
              
              <div className="divide-y divide-mali-blue/10">
                {dateNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`px-6 py-4 hover:bg-mali-blue/5 transition-colors relative ${
                      notification.read ? 'opacity-80' : ''
                    }`}
                  >
                    {!notification.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-mali-blue-accent"></div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="text-white font-medium">
                            {notification.title}
                          </h4>
                          <div className="flex-shrink-0 flex items-center gap-2">
                            <span className="text-xs text-mali-text-secondary whitespace-nowrap">
                              {formatTime(notification.createdAt)}
                            </span>
                            
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-mali-text-secondary hover:text-mali-blue-accent rounded-full hover:bg-mali-blue/10"
                                title="Mark as read"
                              >
                                <Check size={16} />
                              </button>
                            )}
                            
                            <button
                              onClick={() => dismissNotification(notification.id)}
                              className="p-1 text-mali-text-secondary hover:text-red-400 rounded-full hover:bg-red-900/10"
                              title="Remove notification"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-mali-text-secondary mt-1">
                          {notification.message}
                        </p>
                        
                        {notification.link && (
                          <div className="mt-3">
                            <Link
                              href={notification.link}
                              onClick={() => !notification.read && markAsRead(notification.id)}
                              className="inline-flex items-center gap-1 text-sm text-mali-blue-accent hover:underline"
                            >
                              View details
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
