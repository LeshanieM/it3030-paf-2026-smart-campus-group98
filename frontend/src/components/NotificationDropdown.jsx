import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink, Calendar, Ticket, MessageSquare, Info, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import notificationService from '../services/notificationService';

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const { unreadCount, refreshNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [unreadCount, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, event) => {
    event.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      refreshNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      refreshNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      notificationService.markAsRead(notification.id);
      refreshNotifications();
    }
    setIsOpen(false);
    
    const role = user?.role;
    if (notification.type === 'BOOKING') {
      navigate(role === 'ADMIN' ? '/admin/bookings' : '/bookings/my');
    } else if (notification.type === 'TICKET' || notification.type === 'COMMENT') {
      if (role === 'ADMIN') navigate('/admin/incidents');
      else if (role === 'TECHNICIAN') navigate('/tech/tasks');
      else navigate('/maintenance');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'BOOKING': return <Calendar className="text-blue-400" size={16} />;
      case 'TICKET': return <Ticket className="text-amber-400" size={16} />;
      case 'COMMENT': return <MessageSquare className="text-emerald-400" size={16} />;
      default: return <Info className="text-slate-400" size={16} />;
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2.5 rounded-xl transition-all relative ${
          isOpen ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:text-primary hover:bg-primary/5'
        }`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-white text-[9px] font-black border-2 border-white rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Notifications</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Campus Updates</p>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors"
              >
                <Check size={12} /> Mark all
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-5 hover:bg-slate-50/80 transition-all cursor-pointer relative group ${
                      !notification.read ? 'bg-primary/[0.02]' : 'opacity-60'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center border transition-all ${
                        !notification.read ? 'bg-white border-primary/20 shadow-sm' : 'bg-slate-50 border-transparent'
                      }`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm font-bold truncate pr-4 ${!notification.read ? 'text-slate-900' : 'text-slate-600'}`}>
                            {notification.title}
                          </h4>
                          <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap flex items-center gap-1 mt-0.5">
                            <Clock size={10} /> {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 group-hover:line-clamp-none transition-all">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <button 
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        className="absolute right-4 bottom-4 p-1.5 bg-white text-primary rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-primary/10 shadow-sm hover:scale-110"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-4 rotate-12">
                  <Bell size={28} className="opacity-10" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-300">Clean Slate</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50/50 border-t border-slate-100">
            <button 
              onClick={() => { setIsOpen(false); navigate('/notifications'); }}
              className="w-full py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-primary hover:bg-white rounded-xl transition-all border border-transparent hover:border-primary/10 flex items-center justify-center gap-2"
            >
              Access Portal <ExternalLink size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

