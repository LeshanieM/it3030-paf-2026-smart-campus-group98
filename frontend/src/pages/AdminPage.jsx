import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Trash2, Shield, User as UserIcon, Hammer, Search, AlertCircle, Loader2 } from 'lucide-react';

const AdminPage = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/admin/users');
            if (Array.isArray(response.data)) {
                setUsers(response.data);
            } else {
                console.error('Data received is not an array:', response.data);
                setUsers([]);
            }
        } catch (error) {
            console.error('Error fetching users', error);
            
            if (!error.response) {
                setError('Network Error: Could not connect to the security server. Ensure the backend is running on port 8092.');
                return;
            }

            if (error.response.status === 401) {
                logout();
                navigate('/login');
                return;
            }

            if (error.response.status === 403) {
                setError('Access Denied: Your account role is not registered as an Admin. Try Logging Out and Logging in again to refresh your credentials.');
            } else {
                setError(`Server Error (${error.response.status}): Failed to load user records.`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            await api.put(`/admin/users/${userId}/role`, `"${newRole}"`, {
                headers: { 'Content-Type': 'application/json' }
            });
            fetchUsers();
        } catch (error) {
            console.error('Error updating role', error);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Confirm permanent deletion of this campus record?')) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user', error);
        }
    };

    const filteredUsers = users.filter(user => 
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Identity Management</h1>
                        <p className="text-slate-500 font-medium">Configure roles and access permissions for all campus members.</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
                        <Shield size={14} /> SECURITY ENFORCED
                    </div>
                </div>

                {/* Main Table Card */}
                <div className="glass-card overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 border-slate-200/60">
                    {/* Toolbar */}
                    <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/30">
                        <div className="relative w-full sm:w-96 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search by name or email identity..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary/40 outline-none transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                             <button onClick={fetchUsers} className="btn btn-secondary py-2 text-xs">Refresh Data</button>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-4">
                                <Loader2 className="animate-spin text-primary" size={32} />
                                <p className="font-semibold text-sm">Syncing with secure vault...</p>
                            </div>
                        ) : error ? (
                            <div className="py-20 flex flex-col items-center justify-center text-rose-500 space-y-3">
                                <AlertCircle size={40} />
                                <p className="font-bold">{error}</p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
                                <Users size={40} className="opacity-20" />
                                <p className="font-bold text-lg">No identities found</p>
                                <p className="text-sm">Try adjusting your search or check the database sync.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/80 text-slate-500">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">User Identity</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">Authorization Level</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors font-bold">
                                                        {user.name?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 leading-none mb-1">{user.name || 'Anonymous Member'}</div>
                                                        <div className="text-sm text-slate-500 font-medium">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <RoleBadge 
                                                        active={user.role === 'USER'} 
                                                        label="Member" 
                                                        icon={UserIcon} 
                                                        onClick={() => handleUpdateRole(user.id, 'USER')}
                                                    />
                                                    <RoleBadge 
                                                        active={user.role === 'TECHNICIAN'} 
                                                        label="Staff" 
                                                        icon={Hammer} 
                                                        onClick={() => handleUpdateRole(user.id, 'TECHNICIAN')}
                                                        color="emerald"
                                                    />
                                                    <RoleBadge 
                                                        active={user.role === 'ADMIN'} 
                                                        label="Admin" 
                                                        icon={Shield} 
                                                        onClick={() => handleUpdateRole(user.id, 'ADMIN')}
                                                        color="indigo"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button 
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

const RoleBadge = ({ active, label, icon: Icon, onClick, color = 'primary' }) => {
    const activeStyles = {
        primary: 'bg-primary text-white shadow-lg shadow-primary/20 scale-105',
        emerald: 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105',
        indigo: 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105',
    };

    const inactiveStyles = 'bg-white text-slate-400 border border-slate-200 hover:border-primary/40 hover:text-primary';

    return (
        <button 
            onClick={onClick}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 transition-all duration-300 transform ${active ? activeStyles[color] : inactiveStyles}`}
        >
            <Icon size={12} strokeWidth={3} />
            {label}
        </button>
    );
};

export default AdminPage;
