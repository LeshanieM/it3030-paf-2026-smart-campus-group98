import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import axiosInstance from '../api/axiosInstance';
import { ClipboardList, Clock, CheckCircle, MapPin, X, AlertCircle, Edit2, Trash2 } from 'lucide-react';

const TechDashboard = () => {
    const { user } = useAuth();
    const firstName = String(user?.name || user?.email || user?.sub || 'Technician')
        .trim()
        .split(' ')[0]
        .split('@')[0];
    const [tasks, setTasks] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [visibleToRequester, setVisibleToRequester] = useState(true);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [showResolutionModal, setShowResolutionModal] = useState(false);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [resError, setResError] = useState('');
    const styleRef = useRef(null);

    useEffect(() => {
        const styleEl = document.createElement("style");
        styleEl.textContent = `
          @keyframes tech-float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(2deg); }
          }
          @keyframes tech-pulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.15); }
          }
        `;
        document.head.appendChild(styleEl);
        styleRef.current = styleEl;
        return () => document.head.removeChild(styleEl);
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await axiosInstance.get('/technician/tickets');
            const sortedData = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setTasks(sortedData);

            // Update selected task in modal if it's open
            if (selectedTask) {
                const updated = res.data.find(t => t.id === selectedTask.id);
                if (updated) setSelectedTask(updated);
            }
        } catch (error) {
            console.error('Failed to fetch assigned tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const updateStatus = async (id, status, resNotes = null) => {
        try {
            const payload = { status };
            if (resNotes) payload.resolutionNotes = resNotes;

            await axiosInstance.patch(`/technician/tickets/${id}/status`, payload);
            fetchTasks(); // refresh
            setShowResolutionModal(false);
            setResolutionNotes('');
            setResError('');
        } catch (error) {
            console.error('Failed to update status:', error);
            if (status === 'RESOLVED') {
                const message = error.response?.data?.message || error.response?.data || 'Failed to update status';
                setResError(message);
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'SUBMITTED': return 'bg-slate-500 text-white';
            case 'UNDER_REVIEW': return 'bg-amber-500 text-white';
            case 'ASSIGNED': return 'bg-blue-500 text-white';
            case 'IN_PROGRESS': return 'bg-orange-500 text-white';
            case 'ON_HOLD': return 'bg-purple-500 text-white';
            case 'RESOLVED': return 'bg-emerald-500 text-white';
            case 'CLOSED': return 'bg-slate-800 text-white';
            case 'REJECTED': return 'bg-red-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const addComment = async (id) => {
        if (!commentText.trim()) return;
        try {
            const response = await axiosInstance.post(`/technician/tickets/${id}/comments`, {
                message: commentText,
                visibleToRequester,
            });
            setSelectedTask(response.data);
            setCommentText('');
            fetchTasks();
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    const deleteComment = async (taskId, commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            const response = await axiosInstance.delete(`/technician/tickets/${taskId}/comments/${commentId}`);
            setSelectedTask(response.data);
            fetchTasks();
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    const editComment = async (taskId, commentId) => {
        if (!commentText.trim()) return;
        try {
            const response = await axiosInstance.put(`/technician/tickets/${taskId}/comments/${commentId}`, {
                message: commentText,
                visibleToRequester,
            });
            setSelectedTask(response.data);
            setCommentText('');
            setEditingCommentId(null);
            fetchTasks();
        } catch (error) {
            console.error('Failed to edit comment:', error);
            alert("Error editing comment. Only the author can edit.");
        }
    };

    const submitComment = () => {
        if (editingCommentId) {
            editComment(selectedTask.id, editingCommentId);
        } else {
            addComment(selectedTask.id);
        }
    };

    const filteredTasks = tasks.filter(task => filter === 'ALL' || task.status === filter);

    return (
        <Layout>
            <div className="space-y-8 animate-fade-in text-slate-800 relative min-h-screen -m-8 p-8 overflow-hidden bg-slate-50">
                {/* Background Blobs for Epic aesthetic */}
                <div className="absolute top-[-5%] right-[-10%] w-[50%] h-[60%] bg-emerald-400/20 rounded-full blur-[130px] pointer-events-none animate-[tech-float_10s_ease-in-out_infinite]" />
                <div className="absolute bottom-[-15%] left-[-5%] w-[45%] h-[50%] bg-blue-500/15 rounded-full blur-[140px] pointer-events-none animate-[tech-pulse_8s_ease-in-out_infinite]" />

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight drop-shadow-sm">Technician Console</h1>
                        <p className="text-slate-600 font-medium text-lg mt-1">Welcome, <span className="text-emerald-600 font-bold">{firstName}</span>. Your operations workstation is ready.</p>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col sm:flex-row items-center gap-4 relative z-10 w-fit mt-4">
                    <span className="font-bold text-slate-700 text-sm pl-2">Filter Tasks:</span>
                    <select 
                        className="bg-white border border-slate-200 rounded-xl text-sm px-4 py-2 focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium text-slate-600 cursor-pointer shadow-sm"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="ALL">All Tickets</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="ON_HOLD">On Hold</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                </div>

                {/* Content Area */}
                <div className="min-h-[400px]">
                    {loading ? (
                        <div className="flex animate-pulse space-x-4">
                            <div className="flex-1 space-y-6 py-1">
                                <div className="h-2 rounded bg-slate-200"></div>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2 h-2 rounded bg-slate-200"></div>
                                        <div className="col-span-1 h-2 rounded bg-slate-200"></div>
                                    </div>
                                    <div className="h-2 rounded bg-slate-200"></div>
                                </div>
                            </div>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-500 border-2 border-dashed border-slate-200 rounded-3xl">
                            <CheckCircle className="w-16 h-16 mb-4 text-slate-300" />
                            <h3 className="text-xl font-bold text-slate-700">All Caught Up!</h3>
                            <p className="mt-2 text-center text-slate-500 max-w-sm">
                                You currently have no tasks assigned to you. Enjoy your downtime or check back later!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                            {filteredTasks.map(task => (
                                <div key={task.id} className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 relative flex flex-col pt-12 text-slate-800">
                                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black font-mono tracking-widest ${getStatusColor(task.status)} shadow-sm uppercase`}>
                                        {task.status.replace(/_/g, ' ')}
                                    </div>
                                    <div className="absolute top-4 left-4 flex items-center justify-center p-2 bg-slate-50 rounded-xl text-slate-500 border border-slate-100">
                                        <ClipboardList className="w-5 h-5" />
                                    </div>

                                    <h3 className="text-lg font-bold truncate mt-2">{task.title}</h3>
                                    <p className="text-slate-500 text-sm mt-1 line-clamp-2 min-h-[40px] leading-relaxed">{task.description}</p>

                                    <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            <span className="font-medium">{task.location}</span>
                                            {task.room && <span className="text-slate-400">({task.room})</span>}
                                        </div>
                                        <div className="flex items-center gap-2 font-mono text-xs">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            <span>{task.category}</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-6 flex gap-3">
                                        <button
                                            onClick={() => setSelectedTask(task)}
                                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl font-bold transition-colors shadow-sm"
                                        >
                                            View Details
                                        </button>
                                        {(task.status === 'ASSIGNED' || task.status === 'ON_HOLD') && (
                                            <button
                                                onClick={() => updateStatus(task.id, 'IN_PROGRESS')}
                                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-bold transition-colors shadow-sm shadow-amber-500/20"
                                            >
                                                Start Work
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details Modal */}
                {selectedTask && (
                    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] relative border border-white/50 flex flex-col max-h-[90vh]">

                            <div className="px-8 py-6 border-b border-slate-200/50 flex items-start justify-between bg-white/50">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(selectedTask.status)}`}>
                                            {selectedTask.status.replace(/_/g, ' ')}
                                        </span>
                                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-200 text-slate-700">
                                            {selectedTask.priority} PRIORITY
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedTask.title}</h2>
                                    <p className="text-sm font-semibold text-slate-500 mt-1">Ticket ID: {selectedTask.ticketId}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedTask(null)}
                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                                >
                                    <X size={20} className="stroke-[3]" />
                                </button>
                            </div>

                            <div className="px-8 py-6 overflow-y-auto space-y-6 flex-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</div>
                                        <div className="font-bold text-slate-800 text-sm">{selectedTask.category}</div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</div>
                                        <div className="font-bold text-slate-800 text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                                            {selectedTask.location} {selectedTask.room ? `- ${selectedTask.room}` : ''}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Requester</div>
                                        <div className="font-bold text-slate-800 text-sm">{selectedTask.submittedByName || 'Unknown'}</div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Created</div>
                                        <div className="font-bold text-slate-800 text-sm">
                                            {new Date(selectedTask.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-100 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-inner">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">SLA Status</p>
                                        <p>Hello</p>
                                        <div className="inline-block px-2 py-1 bg-white border border-blue-200 text-blue-700 text-xs font-bold rounded">
                                            {selectedTask.slaStatus ? selectedTask.slaStatus.replace(/_/g, ' ') : 'NOT TRACKED'}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Response Target</p>
                                        <p className="text-sm font-bold text-blue-900">{selectedTask.slaResponseDeadline ? new Date(selectedTask.slaResponseDeadline).toLocaleString() : 'N/A'}</p>
                                        <p className="text-[10px] mt-2 text-slate-500 font-medium tracking-wide">
                                            <span className="font-bold">Actual:</span> {selectedTask.actualFirstResponseAt ? new Date(selectedTask.actualFirstResponseAt).toLocaleString() : 'Pending'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Resolution Target</p>
                                        <p className="text-sm font-bold text-blue-900">{selectedTask.slaResolutionDeadline ? new Date(selectedTask.slaResolutionDeadline).toLocaleString() : 'N/A'}</p>
                                        <p className="text-[10px] mt-2 text-slate-500 font-medium tracking-wide">
                                            <span className="font-bold">Actual:</span> {selectedTask.actualResolutionAt ? new Date(selectedTask.actualResolutionAt).toLocaleString() : 'Pending'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-black text-slate-900 mb-2 uppercase tracking-widest">Full Description</h3>
                                    <p className="bg-slate-50 p-4 rounded-xl text-slate-600 text-sm leading-relaxed border border-slate-100 whitespace-pre-wrap">
                                        {selectedTask.description || 'No description provided.'}
                                    </p>
                                </div>

                                {selectedTask.resolutionNotes && (
                                    <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-inner mt-6">
                                        <h3 className="text-sm font-black text-emerald-900 mb-2 uppercase tracking-widest flex items-center gap-2">
                                            <CheckCircle size={16} /> Resolution Details
                                        </h3>
                                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                            {selectedTask.resolutionNotes}
                                        </p>
                                    </div>
                                )}

                                {/* Comments Section */}
                                <div className="border-t border-slate-100 pt-6 mt-6">
                                    <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest text-center">{editingCommentId ? 'Edit Comment' : 'Add Progress Comment'}</h3>
                                    <div className="flex flex-col gap-3">
                                        <textarea
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder="Write your note..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary/20 outline-none resize-none transition-all"
                                            rows="3"
                                        />
                                        <div className="flex items-center gap-2 px-1 justify-between">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="visibleRequest"
                                                    checked={visibleToRequester}
                                                    onChange={(e) => setVisibleToRequester(e.target.checked)}
                                                    className="rounded border-slate-300 text-primary focus:ring-primary"
                                                />
                                                <label htmlFor="visibleRequest" className="text-sm text-slate-600 font-medium cursor-pointer">Visible to Requester</label>
                                            </div>
                                            {editingCommentId && (
                                                <button onClick={() => { setEditingCommentId(null); setCommentText(''); }} className="text-sm text-slate-500 hover:text-slate-800 font-bold">Cancel Edit</button>
                                            )}
                                        </div>
                                        <button
                                            onClick={submitComment}
                                            disabled={!commentText.trim()}
                                            className="bg-primary hover:bg-primary/90 text-white rounded-xl py-2 font-bold shadow-md opacity-100 disabled:opacity-50 transition-all"
                                        >
                                            {editingCommentId ? 'Save Changes' : 'Post Comment'}
                                        </button>
                                    </div>
                                    {selectedTask.comments && selectedTask.comments.length > 0 && (
                                        <div className="mt-6 space-y-3 max-h-60 overflow-y-auto pr-2">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Previous Comments</h4>
                                            {selectedTask.comments.filter(c => !c.softDeleted).map((c, i) => (
                                                <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-bold text-slate-700">{c.authorName} ({c.authorRole})</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] text-slate-500">{new Date(c.timestamp).toLocaleString()}{c.editedAt && ' (edited)'}</span>
                                                            {(c.id && (c.authorName?.toLowerCase() === user?.name?.toLowerCase() || c.authorName?.toLowerCase() === user?.sub?.split('@')[0]?.toLowerCase() || !c.authorName)) && (
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => { setEditingCommentId(c.id); setCommentText(c.message); setVisibleToRequester(c.visibleToRequester); }} className="text-blue-500 hover:text-blue-700 transition-colors"><Edit2 size={14} /></button>
                                                                    <button onClick={() => deleteComment(selectedTask.id, c.id)} className="text-rose-500 hover:text-rose-700 transition-colors"><Trash2 size={14} /></button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mt-2">{c.message}</p>
                                                    {c.visibleToRequester && <div className="mt-2 inline-block px-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded uppercase">Visible to Requester</div>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Technician Action Controls */}
                                <div className="border-t border-slate-100 pt-6 mt-6">
                                    <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest text-center">Update Work Status</h3>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        {(selectedTask.status === 'ASSIGNED' || selectedTask.status === 'ON_HOLD') && (
                                            <button
                                                onClick={() => updateStatus(selectedTask.id, 'IN_PROGRESS')}
                                                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2"
                                            >
                                                <AlertCircle size={18} />
                                                Start / Resume Work
                                            </button>
                                        )}
                                        {selectedTask.status === 'IN_PROGRESS' && (
                                            <>
                                                <button
                                                    onClick={() => updateStatus(selectedTask.id, 'ON_HOLD')}
                                                    className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-transform active:scale-95 shadow-md"
                                                >
                                                    Mark On Hold
                                                </button>
                                                <button
                                                    onClick={() => setShowResolutionModal(true)}
                                                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle size={18} />
                                                    Mark Resolved
                                                </button>
                                            </>
                                        )}
                                        {(selectedTask.status === 'RESOLVED' || selectedTask.status === 'CLOSED' || selectedTask.status === 'REJECTED') && (
                                            <div className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold flex items-center justify-center gap-2 w-full max-w-xs cursor-not-allowed">
                                                No further actions available
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Resolution Notes Modal */}
                {showResolutionModal && (
                    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-800">Complete Resolution</h3>
                                <button 
                                    onClick={() => { setShowResolutionModal(false); setResolutionNotes(''); setResError(''); }} 
                                    className="text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-sm text-slate-500 font-medium">
                                    Please provide details on how the issue was resolved. This will be visible to the requester and logged in the history.
                                </p>
                                <div>
                                    <textarea
                                        value={resolutionNotes}
                                        onChange={(e) => {
                                            setResolutionNotes(e.target.value);
                                            if (e.target.value.trim()) setResError('');
                                        }}
                                        placeholder="Describe the resolution... (e.g., Replaced faulty bulb, verified wiring)"
                                        className={`w-full bg-slate-50 border ${resError ? 'border-rose-300 ring-2 ring-rose-500/10' : 'border-slate-200'} rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-emerald-500/20 outline-none resize-none transition-all`}
                                        rows="4"
                                    />
                                    {resError && (
                                        <p className="mt-2 text-xs font-bold text-rose-500 flex items-center gap-1">
                                            <AlertCircle size={12} /> {resError}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-slate-50 flex gap-3">
                                <button
                                    onClick={() => { setShowResolutionModal(false); setResolutionNotes(''); setResError(''); }}
                                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (!resolutionNotes.trim()) {
                                            setResError('Resolution notes are required to resolve the ticket.');
                                            return;
                                        }
                                        updateStatus(selectedTask.id, 'RESOLVED', resolutionNotes.trim());
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                                >
                                    Confirm & Resolve
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default TechDashboard;

