import React from 'react';
import { X, Bell, Calendar, Ticket, MessageSquare, Info } from 'lucide-react';

const NotificationToast = ({ notification, onClose }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'BOOKING': return <Calendar className="text-blue-400" size={18} />;
      case 'TICKET': return <Ticket className="text-amber-400" size={18} />;
      case 'COMMENT': return <MessageSquare className="text-emerald-400" size={18} />;
      default: return <Bell className="text-indigo-400" size={18} />;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-right-8 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 text-white rounded-2xl shadow-2xl p-4 w-80 flex gap-4 ring-1 ring-white/10">
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex-shrink-0 flex items-center justify-center">
          {getIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-sm truncate pr-2">{notification.title}</h4>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {notification.message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
