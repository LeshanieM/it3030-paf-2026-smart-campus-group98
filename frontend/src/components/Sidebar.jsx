import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.jpeg';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  ShieldCheck, 
  Hammer, 
  CircleUser,
  History,
  Map,
  BellRing,
  ChevronLeft,
  ChevronRight,
  Building2,
  BookOpen,
  ClipboardList
} from 'lucide-react';

const colors = {
  DEFAULT: "#4169E1",
  dark: "#314fb3",
  light: "#6687eb",
  darker: "#243a8a",
  gold: "#f5c842",
};

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
    const { user } = useAuth();
    const location = useLocation();

    const menuItems = {
        ADMIN: [
            { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
            { name: 'Users', icon: <Users size={18} />, path: '/admin' },
            { name: 'Incidents', icon: <BellRing size={18} />, path: '/admin/incidents' },
            { name: 'Facilities', icon: <Building2 size={18} />, path: '/admin/facilities' },
            { name: 'Bookings', icon: <ClipboardList size={18} />, path: '/admin/bookings' },
          
        ],
        USER: [
            { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
            { name: 'Facilities', icon: <Building2 size={18} />, path: '/facilities' },
            { name: 'Incident Ticketing', icon: <BellRing size={18} />, path: '/maintenance' },
            { name: 'New Booking', icon: <BookOpen size={18} />, path: '/bookings/new' },
            { name: 'My Bookings', icon: <Calendar size={18} />, path: '/bookings/my' },
            { name: 'Profile', icon: <CircleUser size={18} />, path: '/profile' },
        ],
        TECHNICIAN: [
            { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
            { name: 'Facilities', icon: <Building2 size={18} />, path: '/facilities' },
            { name: 'Tasks', icon: <Hammer size={18} />, path: '/tech/tasks' },
            { name: 'Profile', icon: <CircleUser size={18} />, path: '/profile' },
        ]
    };

    const currentMenu = menuItems[user?.role] || menuItems.USER;
    const displayName = user?.name || (user?.email || user?.sub)?.split('@')[0];
    const initial = (user?.email || user?.sub)?.[0]?.toUpperCase();

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');
                .sidebar-root {
                    font-family: 'Sora', sans-serif;
                }
                .nav-link {
                    transition: background 0.15s, color 0.15s;
                }
                .nav-link:hover .nav-icon {
                    color: ${colors.DEFAULT};
                }
                .nav-link.active {
                    background: ${colors.DEFAULT};
                    color: #ffffff;
                }
                .nav-link.active .nav-icon {
                    color: #ffffff;
                }
                .nav-link:not(.active):hover {
                    background: #f0f0f5;
                    color: ${colors.dark};
                }
                .collapse-btn {
                    transition: transform 0.15s, box-shadow 0.15s;
                }
                .collapse-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 4px 14px rgba(0,0,0,0.12);
                }
            `}</style>

            <aside
                className="sidebar-root fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300"
                style={{
                    width: isCollapsed ? '72px' : '240px',
                    background: '#fafafa',
                    borderRight: '1px solid #e8e8ec',
                }}
            >
                {/* Brand */}
                <Link
                    to="/"
                    className="flex items-center gap-3 px-5 py-5 hover:opacity-90 transition-opacity"
                    style={{ borderBottom: '1px solid #e8e8ec' }}
                >
                    <div
                        className="shrink-0 w-9 h-9 rounded-lg overflow-hidden border border-white/20 shadow-md"
                    >
                        <img src={logo} alt="Facility Flow Logo" className="w-full h-full object-cover" />
                    </div>
                    {!isCollapsed && (
                        <div>
                            <div className="font-black text-sm leading-none tracking-tight font-['Playfair_Display',serif] uppercase">
                                <span style={{ color: colors.darker }}>Facility </span>
                                <span style={{ color: colors.light }}>Flow</span>
                            </div>
                            <div
                                className="text-[10px] mt-1 font-medium"
                                style={{ color: '#a0a0b0', letterSpacing: '0.04em' }}
                            >
                                Smart Campus Hub
                            </div>
                        </div>
                    )}
                </Link>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
                    {currentMenu.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                title={isCollapsed ? item.name : ''}
                                className={`nav-link flex items-center gap-3 rounded-lg text-sm font-medium ${isActive ? 'active' : ''}`}
                                style={{
                                    padding: isCollapsed ? '10px 0' : '9px 12px',
                                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                                    color: isActive ? '#ffffff' : '#6b6b80',
                                }}
                            >
                                <span
                                    className="nav-icon shrink-0"
                                    style={{ color: isActive ? '#ffffff' : '#9090a8' }}
                                >
                                    {item.icon}
                                </span>
                                {!isCollapsed && <span>{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Role badge */}
                {!isCollapsed && (
                    <div className="px-4 py-2">
                        <div
                            className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded"
                            style={{
                                background: colors.light + '20',
                                color: colors.DEFAULT,
                                display: 'inline-block'
                            }}
                        >
                            {user?.role}
                        </div>
                    </div>
                )}

                {/* User */}
                <div
                    className="px-3 py-4"
                    style={{ borderTop: '1px solid #e8e8ec' }}
                >
                    <div
                        className="flex items-center gap-3"
                        style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
                    >
                        <div
                            className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm relative"
                            style={{
                                background: colors.light + '20',
                                color: colors.DEFAULT,
                            }}
                        >
                            {initial}
                            <span
                                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                                style={{
                                    background: '#34d399',
                                    borderColor: '#fafafa',
                                    transform: 'translate(1px, 1px)'
                                }}
                            />
                        </div>
                        {!isCollapsed && (
                            <div className="min-w-0">
                                <div
                                    className="text-sm font-semibold truncate leading-none"
                                    style={{ color: colors.darker }}
                                >
                                    {displayName}
                                </div>
                                <div
                                    className="text-xs mt-1 truncate"
                                    style={{ color: '#a0a0b0' }}
                                >
                                    {user?.email}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Collapse button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="collapse-btn absolute -right-3.5 top-[72px] w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                        background: '#ffffff',
                        border: '1px solid #e8e8ec',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        color: colors.DEFAULT,
                    }}
                >
                    {isCollapsed
                        ? <ChevronRight size={12} strokeWidth={2.5} />
                        : <ChevronLeft size={12} strokeWidth={2.5} />
                    }
                </button>
            </aside>
        </>
    );
};

export default Sidebar;