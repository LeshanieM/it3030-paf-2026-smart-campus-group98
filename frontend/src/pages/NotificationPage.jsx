import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Calendar, Ticket, MessageSquare, Info, Filter, ArrowLeft, Search, Settings, Trash2, Clock, ChevronRight, X, MoreHorizontal } from 'lucide-react';
import notificationService from '../services/notificationService';
import NotificationPreferences from '../components/NotificationPreferences';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';

const NotificationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('ALL'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState([
    { category: 'BOOKING', label: 'Booking', enabled: true },
    { category: 'TICKET', label: 'Ticket', enabled: true },
    { category: 'COMMENT', label: 'Comment', enabled: true },
    { category: 'SYSTEM', label: 'System', enabled: true },
  ]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrefs = async () => {
    try {
      const response = await axiosInstance.get(`/notifications/preferences`);
      if (response.data && response.data.length > 0) {
        const merged = prefs.map(p => {
          const remote = response.data.find(r => r.category === p.category);
          return remote ? { ...p, enabled: remote.inAppEnabled } : p;
        });
        setPrefs(merged);
      }
    } catch (err) {
      console.error('Failed to fetch preferences', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    if (user) fetchPrefs();
  }, [user]);

  const togglePref = async (index) => {
    const prevPrefs = prefs;
    const newPrefs = [...prefs];
    newPrefs[index].enabled = !newPrefs[index].enabled;
    setPrefs(newPrefs);
    
    try {
      await axiosInstance.put(`/notifications/preferences`, null, {
        params: {
          category: newPrefs[index].category,
          emailEnabled: true, // Keep email on for now or fetch existing
          inAppEnabled: newPrefs[index].enabled
        }
      });
    } catch (err) {
      setPrefs(prevPrefs);
      console.error('Failed to update preference', err);
    }
  };

  const handleMarkAsRead = async (id) => {
    const previous = notifications;
    try {
      // Optimistic UI: immediately mark as read to keep UX snappy
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      await notificationService.markAsRead(id);
    } catch (error) {
      setNotifications(previous);
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchesFilter = filter === 'ALL' ? true : filter === 'UNREAD' ? !n.read : n.type === filter;
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           n.message.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [notifications, filter, searchQuery]);

  const formatFullDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe]">
      {/* Header Container */}
      <div className="max-w-[1400px] mx-auto px-10 py-8">
        <div className="flex items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100 shadow-sm">
              <ArrowLeft size={18} className="text-slate-500" />
            </button>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Notifications
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black border border-emerald-100 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </h1>
          </div>

          <div className="flex-1 max-w-lg mx-12 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input 
              type="text"
              placeholder="SEARCH..."
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all placeholder:text-slate-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            {[
              { label: 'ALL', value: 'ALL' },
              { label: 'UNREAD', value: 'UNREAD' },
              { label: 'BOOKINGS', value: 'BOOKING' },
              { label: 'TICKETS', value: 'TICKET' },
              { label: 'COMMENTS', value: 'COMMENT' }
            ].map(btn => (
              <button
                key={btn.value}
                onClick={() => setFilter(btn.value)}
                className={`px-5 py-2 rounded-full text-[9px] font-black tracking-[0.1em] transition-all border ${
                  filter === btn.value
                    ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-lg shadow-slate-200'
                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
            <button 
              onClick={handleMarkAllRead}
              aria-label="Mark all as read"
              className="p-2.5 ml-3 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100 text-slate-400 shadow-sm"
            >
              <Check size={18} />
            </button>
          </div>
        </div>

        {/* Alerts Preference Bar */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between mb-10 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50/50 flex items-center justify-center text-blue-600">
              <Bell size={18} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Real-Time Alerts</span>
          </div>

          <div className="flex items-center gap-10">
            {prefs.map((p, idx) => (
              <div key={p.category} className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.label}</span>
                <button 
                  onClick={() => togglePref(idx)}
                  className={`w-10 h-5 rounded-full relative transition-all duration-300 ${p.enabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-300 ${p.enabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notification List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-32 text-center">
              <div className="animate-spin w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full mx-auto" />
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((n) => (
              <div 
                key={n.id}
                className={`flex gap-8 p-8 border rounded-[2rem] transition-all group relative ${
                  !n.read 
                    ? 'bg-[#fffbeb] border-amber-100/50 shadow-[0_10px_40px_rgba(251,191,36,0.05)]' 
                    : 'bg-white border-slate-100 opacity-90'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all shadow-inner ${
                  !n.read ? 'bg-white border-amber-200 text-amber-500' : 'bg-slate-50 border-slate-100 text-slate-300'
                }`}>
                  <Info size={24} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      n.type === 'BOOKING' ? 'bg-emerald-500 text-white' :
                      n.type === 'TICKET' ? 'bg-[#ff7e33] text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {n.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold ml-auto uppercase tracking-tighter">
                      {formatFullDate(n.createdAt)}
                    </span>
                  </div>
                  
                  <h3 className={`text-base font-black mb-1.5 tracking-tight ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>
                    {n.title}
                  </h3>
                  <p className={`text-xs font-medium leading-relaxed mb-4 ${!n.read ? 'text-slate-600' : 'text-slate-500'}`}>
                    {n.message}
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${!n.read ? 'bg-amber-400' : 'bg-slate-200'}`} />
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${!n.read ? 'text-amber-600' : 'text-slate-400'}`}>
                        {n.read ? 'READ' : 'NEW ALERT'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                   {!n.read && (
                    <button 
                      onClick={() => handleMarkAsRead(n.id)}
                      aria-label="Mark as read"
                      className="p-3 text-emerald-500 hover:bg-emerald-50 rounded-2xl border border-emerald-100 transition-all shadow-sm bg-white"
                    >
                      <Check size={20} />
                    </button>
                   )}
                   <button 
                    onClick={() => handleDelete(n.id)}
                    aria-label="Delete notification"
                    className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border border-slate-100 shadow-sm bg-white"
                   >
                    <Trash2 size={20} />
                   </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-40 text-center">
               <div className="w-24 h-24 bg-white border border-slate-100 shadow-xl rounded-[3rem] flex items-center justify-center mx-auto mb-8 rotate-12">
                 <Bell size={40} className="text-slate-200" />
               </div>
               <h3 className="text-xl font-black text-slate-300 uppercase tracking-[0.3em]">No New Activity</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;



