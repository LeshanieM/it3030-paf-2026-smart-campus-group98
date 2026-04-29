import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationDropdown from './NotificationDropdown';
import { useNotifications } from '../context/NotificationContext';
import { LogOut, Bell, Search, Menu as MenuIcon, Calendar, Ticket, MessageSquare, X } from 'lucide-react';
import logo from '../assets/logo.jpeg';

const Layout = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { toasts, removeToast } = useNotifications();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'BOOKING': return <Calendar size={18} className="text-blue-500" />;
      case 'TICKET': return <Ticket size={18} className="text-amber-500" />;
      case 'COMMENT': return <MessageSquare size={18} className="text-emerald-500" />;
      default: return <Bell size={18} className="text-primary" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans selection:bg-primary/20 relative overflow-x-hidden">
      {/* Floating Toasts */}
      <div className="fixed top-20 right-8 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.toastId} 
            className="pointer-events-auto bg-white/90 backdrop-blur-xl border-l-4 border-primary rounded-2xl shadow-2xl shadow-primary/20 p-4 animate-in slide-in-from-right duration-500 flex gap-4 cursor-pointer hover:scale-105 transition-transform"
            style={{ 
              borderColor: toast.type === 'BOOKING' ? '#3b82f6' : 
                          toast.type === 'TICKET' ? '#f59e0b' : 
                          toast.type === 'COMMENT' ? '#10b981' : '#4169E1'
            }}
            onClick={() => {
              removeToast(toast.toastId);
              navigate('/notifications');
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
              {getToastIcon(toast.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-800 truncate">{toast.title}</h4>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1">{toast.message}</p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.toastId);
              }}
              className="p-1 hover:bg-slate-100 rounded-lg self-start transition-colors"
            >
              <X size={14} className="text-slate-400" />
            </button>
          </div>
        ))}
      </div>

      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm border border-white/20">
                <img src={logo} alt="Facility Flow Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-xl font-black hidden md:block tracking-tight font-['Playfair_Display',serif] uppercase">
                <span style={{ color: '#243a8a' }}>Facility </span>
                <span style={{ color: '#6687eb' }}>Flow</span>
              </h1>
            </Link>
            
            <div className="relative group w-64 md:w-80">
              <Search 
                size={18} 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" 
              />
              <input 
                type="text" 
                placeholder="Search facilities or tasks..." 
                className="w-full pl-11 pr-4 py-2 bg-slate-100/50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationDropdown />
            
            <div className="w-px h-6 bg-slate-200 mx-2"></div>

            <Link 
              to="/profile" 
              className="flex items-center gap-3 p-1.5 pr-4 hover:bg-slate-100 rounded-2xl transition-all border border-transparent hover:border-slate-200 group"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary overflow-hidden shadow-sm">
                {user?.picture ? (
                  <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (user?.email || user?.sub)?.[0].toUpperCase()
                )}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-none group-hover:text-primary transition-colors">
                  {user?.name || (user?.email || user?.sub)?.split('@')[0]}
                </div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                  View Profile
                </div>
              </div>
            </Link>

            <div className="w-px h-6 bg-slate-200 mx-2"></div>
            
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8 animate-fade-in">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>

        <footer className="py-6 px-8 bg-white border-t border-slate-100 text-center">
            <p className="text-sm text-slate-400 font-medium italic">
                Facility Flow © 2026 • Optimized for University Operations
            </p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
