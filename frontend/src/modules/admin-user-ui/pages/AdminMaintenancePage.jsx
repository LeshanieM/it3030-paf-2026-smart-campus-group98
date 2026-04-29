import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Layout from '../../../components/Layout';
import { useAdminMaintenanceDashboard } from '../hooks/useAdminMaintenanceDashboard';
import { BellRing, CheckCircle, Clock, AlertCircle, RefreshCw, Filter, MonitorPlay, X, User as UserIcon, Calendar, MapPin, Paperclip, Eye, Download, Send, Loader2, ShieldCheck, Edit2, Trash2, Check } from 'lucide-react';
import { formatDateTime, formatDateTimeOrFallback, formatDurationMinutes } from '../../maintenance/utils/dateTime';
import { downloadAttachment, getAttachmentName, viewAttachment, getViewerUrl } from '../../maintenance/utils/attachmentActions';
import StatusBadge, { INCIDENT_STATUS_OPTIONS, INCIDENT_STATUS_UPDATE_OPTIONS, PriorityBadge, normalizeIncidentStatus } from '../../student-user-ui/components/StatusBadge';
import { AnalyticsTabToggle } from '../../maintenance/components/DashboardAnalytics';
import AdminIncidentAnalyticsOverview from '../components/AdminIncidentAnalyticsOverview';

const getCommentContent = (comment) => comment?.content || comment?.message || '';
const getCommentCreatedAt = (comment) => comment?.createdAt || comment?.timestamp || null;
const getCommentUpdatedAt = (comment) => comment?.updatedAt || comment?.editedAt || null;

export const AdminMaintenancePage = () => {
    const { tickets, technicians, isLoading, error, changeStatus, assignTicket, addComment, editComment, deleteComment, refreshTickets } = useAdminMaintenanceDashboard();
    const [filter, setFilter] = useState('ALL');
    const [dashTab, setDashTab] = useState('analytics');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [pendingTechAssignment, setPendingTechAssignment] = useState('');
    const [pendingStatus, setPendingStatus] = useState('');
    const [attachmentActionKey, setAttachmentActionKey] = useState('');
    const [adminComment, setAdminComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [visibleToRequester, setVisibleToRequester] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editCommentText, setEditCommentText] = useState('');
    const [editVisibleToRequester, setEditVisibleToRequester] = useState(false);
    const [actionModal, setActionModal] = useState({ open: false, type: '', status: '', title: '', value: '' });
    const styleRef = useRef(null);

    useEffect(() => {
        const styleEl = document.createElement("style");
        styleEl.textContent = `
          @keyframes float-slow {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-20px) scale(1.05); }
          }
          @keyframes glow-pulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.2); }
          }
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
        `;
        document.head.appendChild(styleEl);
        styleRef.current = styleEl;
        return () => document.head.removeChild(styleEl);
    }, []);

    // Lock body scroll when any modal is open
    useEffect(() => {
        const isAnyModalOpen = Boolean(selectedTicket) || actionModal.open;
        if (isAnyModalOpen) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden'; // Ensure both are locked
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, [selectedTicket, actionModal.open]);

    const filteredTickets = tickets
        .filter(t => filter === 'ALL' || normalizeIncidentStatus(t.status) === filter)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const handleQuickAction = (e, ticketId, newStatus) => {
        e.stopPropagation(); // prevent modal from opening
        changeStatus(ticketId, { status: newStatus });
    };

    const handleStatusChangeRequest = (newStatus) => {
        if (newStatus === 'REJECTED') {
            setActionModal({
                open: true,
                type: 'REJECTED',
                status: 'REJECTED',
                title: 'Reject Ticket',
                label: 'Rejection Reason',
                placeholder: 'Please provide a reason for rejecting this ticket...',
                value: ''
            });
            return;
        }

        if (newStatus === 'RESOLVED') {
            setActionModal({
                open: true,
                type: 'RESOLVED',
                status: 'RESOLVED',
                title: 'Resolve Ticket',
                label: 'Resolution Notes (Optional)',
                placeholder: 'Add any final notes about the fix...',
                value: ''
            });
            return;
        }

        setPendingStatus(newStatus);
    };

    const handleActionConfirm = async () => {
        const payload = { status: actionModal.status };
        if (actionModal.type === 'REJECTED') {
            if (!actionModal.value.trim()) return;
            payload.rejectionReason = actionModal.value.trim();
        } else if (actionModal.type === 'RESOLVED') {
            if (actionModal.value.trim()) {
                payload.resolutionNotes = actionModal.value.trim();
            }
        }

        const updated = await changeStatus(selectedTicket.id, payload);
        if (updated) {
            setSelectedTicket(updated);
            setPendingStatus('');
        }
        setActionModal({ open: false, type: '', status: '', title: '', value: '' });
    };

    const handleSave = async () => {
        let hasChanges = false;

        if (pendingTechAssignment) {
            await assignTicket(selectedTicket.id, pendingTechAssignment);
            hasChanges = true;
        }

        if (pendingStatus && pendingStatus !== selectedTicket.status) {
            const updated = await changeStatus(selectedTicket.id, { status: pendingStatus });
            if (updated) {
                setSelectedTicket(updated);
            }
            hasChanges = true;
        }

        if (hasChanges) {
            setSelectedTicket(null);
            setPendingTechAssignment('');
            setPendingStatus('');
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!adminComment.trim() || isSubmittingComment) return;

        setIsSubmittingComment(true);
        const updated = await addComment(selectedTicket.id, { 
            message: adminComment.trim(), 
            visibleToRequester: visibleToRequester 
        });
        if (updated) {
            setSelectedTicket(updated);
            setAdminComment('');
            setVisibleToRequester(false); // Default to internal
        }
        setIsSubmittingComment(false);
    };

    const handleBeginEditComment = (comment) => {
        setEditingCommentId(comment.id);
        setEditCommentText(getCommentContent(comment));
        setEditVisibleToRequester(Boolean(comment.visibleToRequester));
    };

    const handleSaveEditComment = async () => {
        if (!editCommentText.trim() || !editingCommentId) return;
        const updated = await editComment(selectedTicket.id, editingCommentId, {
            message: editCommentText.trim(),
            visibleToRequester: editVisibleToRequester
        });
        if (updated) {
            setSelectedTicket(updated);
            setEditingCommentId(null);
            setEditCommentText('');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;
        const updated = await deleteComment(selectedTicket.id, commentId);
        if (updated) {
            setSelectedTicket(updated);
        }
    };

    const handleAttachmentAction = async (attachment, mode) => {
        const key = `${attachment?.id || getAttachmentName(attachment)}-${mode}`;
        setAttachmentActionKey(key);
        try {
            if (mode === 'view') {
                await viewAttachment(attachment);
            } else {
                await downloadAttachment(attachment);
            }
        } catch (error) {
            alert(error?.response?.data?.message || error?.message || 'Unable to open the attachment.');
        } finally {
            setAttachmentActionKey('');
        }
    };

    return (
        <Layout>
            <div className="space-y-8 animate-fade-in relative min-h-screen text-slate-800 -m-8 p-8 overflow-hidden bg-slate-50">
                {/* Background Blobs for Epic aesthetic */}
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[50%] bg-indigo-400/20 rounded-full blur-[120px] pointer-events-none animate-[float-slow_8s_ease-in-out_infinite]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[40%] bg-blue-400/20 rounded-full blur-[140px] pointer-events-none animate-[float-slow_12s_ease-in-out_infinite_reverse]" />
                <div className="absolute top-[20%] right-[10%] w-[25%] h-[30%] bg-purple-400/15 rounded-full blur-[100px] pointer-events-none animate-[glow-pulse_6s_ease-in-out_infinite]" />

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight drop-shadow-sm">Incident Ticketing Monitor</h1>
                        <p className="text-slate-600 font-medium">Oversee all campus facility breakdowns and map technicians to workflow requests.</p>
                    </div>
                </div>

                {/* Analytics / Tickets Tab Toggle */}
                <div className="flex items-center justify-between gap-4 relative z-10">
                    <AnalyticsTabToggle
                        activeTab={dashTab}
                        onTabChange={setDashTab}
                        analyticsLabel="📊 Analytics"
                        ticketsLabel="🎫 Ticket Queue"
                    />
                </div>

                {/* Analytics Dashboard */}
                {dashTab === 'analytics' && (
                    <AdminIncidentAnalyticsOverview
                        tickets={tickets}
                        isLoading={isLoading}
                        error={error}
                        onRefresh={refreshTickets}
                    />
                )}

                {/* Dashboard Datatable */}
                {dashTab === 'tickets' && <div className="glass-card overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 bg-white/60 backdrop-blur-xl rounded-[24px] relative z-10">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-white/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/40">
                        <div className="flex items-center gap-2">
                            <MonitorPlay className="text-slate-400" size={18} />
                            <span className="font-bold text-slate-700 text-sm">Global Filter:</span>
                            <select
                                className="bg-white border border-slate-200 rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-slate-600"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="ALL">All Incidents</option>
                                {INCIDENT_STATUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <button onClick={refreshTickets} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors">
                            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                            Refresh Console
                        </button>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto min-h-[400px]">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center p-20 text-slate-400 space-y-4">
                                <RefreshCw className="animate-spin text-primary" size={32} />
                                <p className="font-bold">Syncing incident database...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center p-20 text-rose-500 space-y-3 bg-rose-50/30">
                                <AlertCircle size={40} />
                                <p className="font-bold">{error}</p>
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-20 text-slate-400 space-y-3">
                                <CheckCircle size={48} className="text-emerald-400 opacity-50" />
                                <p className="font-black text-xl text-slate-600">No tickets found</p>
                                <p className="text-sm font-medium">The campus queue is currently clear.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest w-[180px]">ID / Priority</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest min-w-[200px]">Title & Details</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest w-[180px]">Submitted By</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest w-[150px]">Current Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right w-[140px]">Quick Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200/50">
                                    {filteredTickets.map(ticket => (
                                        <tr
                                            key={ticket.id}
                                            onClick={() => setSelectedTicket(ticket)}
                                            className="hover:bg-white/80 transition-all duration-300 group cursor-pointer hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 relative z-10"
                                        >
                                            <td className="px-6 py-4 w-[180px] align-top">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-[85px] shrink-0">
                                                        <PriorityBadge priority={ticket.priority} className="w-full justify-center mt-0.5" />
                                                    </div>
                                                    <div className="font-black text-slate-800 tracking-tight leading-tight min-w-0 break-words">
                                                        {ticket.ticketId}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 min-w-[200px]">
                                                <div className="font-bold text-slate-900 truncate mb-1" title={ticket.title}>{ticket.title}</div>
                                                <div className="text-xs text-slate-500 font-medium truncate flex items-center gap-1.5 overflow-hidden">
                                                    <span className="bg-slate-100 text-slate-600 px-2 rounded font-semibold text-[10px] uppercase tracking-wider shrink-0">{ticket.category}</span>
                                                    <span className="truncate">{ticket.location} {ticket.room ? `- ${ticket.room}` : ''}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 w-[180px]">
                                                <div className="text-sm font-bold text-slate-700 truncate" title={ticket.submittedByName}>{ticket.submittedByName || 'Unknown'}</div>
                                                <div className="text-xs text-slate-400 font-medium">{new Date(ticket.createdAt).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4 w-[150px]">
                                                <div className="flex items-center h-full">
                                                    <StatusBadge status={ticket.status} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right w-[140px]">
                                                {normalizeIncidentStatus(ticket.status) === 'OPEN' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); }}
                                                        className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shadow-md shadow-primary/20 hover:scale-105 transition-all"
                                                    >
                                                        Assign Task
                                                    </button>
                                                )}
                                                {['ASSIGNED', 'IN_PROGRESS'].includes(normalizeIncidentStatus(ticket.status)) && (
                                                    <button
                                                        onClick={(e) => handleQuickAction(e, ticket.id, 'RESOLVED')}
                                                        className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-600/20 hover:scale-105 transition-all"
                                                    >
                                                        Resolve
                                                    </button>
                                                )}
                                                {['RESOLVED', 'REJECTED', 'CLOSED'].includes(normalizeIncidentStatus(ticket.status)) && (
                                                    <span className="text-xs font-bold text-slate-400">Archived</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>}
            </div>

            {/* Details & Assignment Modal - Using Portal for proper scroll behavior and layout */}
            {selectedTicket && createPortal(
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-zoom-in relative">

                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-slate-100 flex items-start justify-between bg-white sticky top-0 z-10">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <PriorityBadge priority={selectedTicket.priority} />
                                    <StatusBadge status={selectedTicket.status} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedTicket.title}</h2>
                                <p className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                                    Tracker: <span className="text-primary">{selectedTicket.ticketId}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => { setSelectedTicket(null); setPendingTechAssignment(''); setPendingStatus(''); }}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                            >
                                <X size={24} className="stroke-[2.5]" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-8 py-6 overflow-y-auto space-y-8 flex-1 bg-slate-50/30">

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</div>
                                    <div className="font-bold text-slate-800 text-sm truncate">{selectedTicket.category.replace('_', ' ')}</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin size={10} /> Location</div>
                                    <div className="font-bold text-slate-800 text-sm truncate">
                                        {selectedTicket.location} {selectedTicket.room && <span className="text-primary">({selectedTicket.room})</span>}
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><UserIcon size={10} /> Requester</div>
                                    <div className="font-bold text-slate-800 text-sm truncate">{selectedTicket.submittedByName || 'Unknown'}</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><MonitorPlay size={10} className="rotate-90" /> Contact Number</div>
                                    <div className="font-bold text-slate-800 text-sm truncate">{selectedTicket.preferredContact || 'Not available'}</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm col-span-2 md:col-span-1">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">@ Email Address</div>
                                    <div className="font-bold text-slate-800 text-sm truncate" title={selectedTicket.submittedByEmail}>{selectedTicket.submittedByEmail || 'Not available'}</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar size={10} /> Created</div>
                                    <div className="font-bold text-slate-800 text-sm truncate">{new Date(selectedTicket.createdAt).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                                <div className="mb-4 flex items-center gap-2 text-blue-900">
                                    <Clock size={16} />
                                    <h3 className="text-xs font-black uppercase tracking-widest">SLA Performance</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Response Due</div>
                                        <div className="text-xs font-bold text-blue-900">{formatDateTime(selectedTicket.slaResponseDeadline)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Resolution Due</div>
                                        <div className="text-xs font-bold text-blue-900">{formatDateTime(selectedTicket.slaResolutionDeadline)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Status</div>
                                        <div className="mt-1 inline-block rounded bg-blue-100 px-2 py-0.5 text-[9px] font-black uppercase text-blue-700">
                                            {selectedTicket.slaStatus?.replace(/_/g, ' ') || 'ACTIVE'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Actual Res</div>
                                        <div className="text-xs font-bold text-slate-500">{formatDateTimeOrFallback(selectedTicket.actualResolutionAt)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h3 className="text-xs font-black text-slate-900 mb-3 uppercase tracking-widest">Problem Description</h3>
                                <p className="bg-white p-5 rounded-2xl text-slate-600 text-sm leading-relaxed border border-slate-100 shadow-sm whitespace-pre-wrap">
                                    {selectedTicket.description || 'No description provided.'}
                                </p>
                            </div>

                            {/* Rejection/Resolution View */}
                            {(selectedTicket.rejectionReason || selectedTicket.resolutionSummary) && (
                                <div className={`rounded-2xl border p-5 ${normalizeIncidentStatus(selectedTicket.status) === 'REJECTED' ? 'border-rose-100 bg-rose-50/50' : 'border-emerald-100 bg-emerald-50/50'}`}>
                                    <h3 className={`text-xs font-black mb-2 uppercase tracking-widest ${normalizeIncidentStatus(selectedTicket.status) === 'REJECTED' ? 'text-rose-700' : 'text-emerald-700'}`}>
                                        {normalizeIncidentStatus(selectedTicket.status) === 'REJECTED' ? 'Rejection' : 'Resolution'} Notes
                                    </h3>
                                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${normalizeIncidentStatus(selectedTicket.status) === 'REJECTED' ? 'text-rose-800' : 'text-emerald-800'}`}>
                                        {selectedTicket.rejectionReason || selectedTicket.resolutionSummary}
                                    </p>
                                </div>
                            )}

                            {/* Attachments */}
                            <div>
                                <h3 className="text-xs font-black text-slate-900 mb-3 uppercase tracking-widest">Linked Assets</h3>
                                {selectedTicket.attachments?.length ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {selectedTicket.attachments.map((attachment, index) => (
                                            <div
                                                key={`${getAttachmentName(attachment)}-${index}`}
                                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Paperclip size={14} className="text-slate-400 shrink-0" />
                                                    <span className="text-xs font-bold text-slate-700 truncate" title={getAttachmentName(attachment)}>
                                                        {getAttachmentName(attachment)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={() => handleAttachmentAction(attachment, 'view')}
                                                        className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAttachmentAction(attachment, 'download')}
                                                        className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors"
                                                        title="Download"
                                                    >
                                                        <Download size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-400 bg-slate-50">
                                        No attachments provided
                                    </div>
                                )}
                            </div>

                            {/* Comments Section */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Activity & Comments</h3>
                                    <span className="text-[10px] font-bold text-slate-400">{selectedTicket.comments?.length || 0} Updates</span>
                                </div>

                                {/* Admin Comment Input */}
                                <form onSubmit={handlePostComment} className="mb-6 relative">
                                    <textarea
                                        value={adminComment}
                                        onChange={(e) => setAdminComment(e.target.value)}
                                        placeholder="Post a secure update or response..."
                                        rows={2}
                                        className="w-full rounded-2xl border border-slate-200 bg-white p-4 pb-14 text-sm focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none shadow-sm"
                                    />
                                    <div className="absolute bottom-3 left-4 right-3 flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={visibleToRequester}
                                                onChange={(e) => setVisibleToRequester(e.target.checked)}
                                                className="rounded text-primary focus:ring-primary border-slate-300"
                                            />
                                            Share with Requester
                                        </label>
                                        <button
                                            type="submit"
                                            disabled={isSubmittingComment || !adminComment.trim()}
                                            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all"
                                        >
                                            {isSubmittingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                            Post Comment
                                        </button>
                                    </div>
                                </form>

                                {selectedTicket.comments?.filter(c => getCommentContent(c).trim()).length ? (
                                    <div className="space-y-3">
                                        {[...selectedTicket.comments]
                                            .filter(c => getCommentContent(c).trim())
                                            .reverse()
                                            .map((comment) => {
                                                const isEditing = editingCommentId === comment.id;
                                                const commentCreated = getCommentCreatedAt(comment);
                                                const commentUpdated = getCommentUpdatedAt(comment);
                                                const isEdited = commentUpdated && commentCreated && new Date(commentUpdated).getTime() > new Date(commentCreated).getTime() + 1000;

                                                return (
                                                    <div key={comment.id} className={`rounded-2xl border p-4 shadow-sm ${!comment.visibleToRequester ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 bg-white'}`}>
                                                        <div className="flex items-start justify-between gap-4 mb-2">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="text-xs font-black text-slate-800">{comment.authorName}</p>
                                                                {comment.authorRole === 'ADMIN' && (
                                                                    <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-black uppercase border border-indigo-100">Admin</span>
                                                                )}
                                                                {comment.authorRole === 'TECHNICIAN' && (
                                                                    <span className="bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded text-[9px] font-black uppercase border border-teal-100">Technician</span>
                                                                )}
                                                                <span className="text-[10px] font-bold text-slate-400">• {formatDateTime(commentCreated)}</span>
                                                                {isEdited && (
                                                                    <span className="text-[9px] font-bold text-slate-400 italic">(edited)</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                {!comment.visibleToRequester && (
                                                                    <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-200">
                                                                        Internal note
                                                                    </span>
                                                                )}
                                                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${comment.authorRole === 'USER' ? 'bg-blue-50 text-blue-600' : (comment.visibleToRequester ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500')}`}>
                                                                    {comment.authorRole === 'USER' ? 'Requester' : (comment.visibleToRequester ? 'External' : 'Staff Only')}
                                                                </span>
                                                                {comment.canEdit && !isEditing && (
                                                                    <button onClick={() => handleBeginEditComment(comment)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors" title="Edit comment">
                                                                        <Edit2 size={12} />
                                                                    </button>
                                                                )}
                                                                {comment.canDelete && !isEditing && (
                                                                    <button onClick={() => handleDeleteComment(comment.id)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600 transition-colors" title="Delete comment">
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {isEditing ? (
                                                            <div className="mt-2 space-y-3">
                                                                <textarea
                                                                    value={editCommentText}
                                                                    onChange={(e) => setEditCommentText(e.target.value)}
                                                                    className="w-full rounded-xl border border-blue-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                                                                    rows={3}
                                                                />
                                                                <div className="flex items-center justify-between">
                                                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={editVisibleToRequester}
                                                                            onChange={(e) => setEditVisibleToRequester(e.target.checked)}
                                                                            className="rounded text-primary focus:ring-primary border-slate-300"
                                                                        />
                                                                        Share with Requester
                                                                    </label>
                                                                    <div className="flex gap-2">
                                                                        <button onClick={() => setEditingCommentId(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 transition-colors" title="Cancel">
                                                                            <X size={16} />
                                                                        </button>
                                                                        <button onClick={handleSaveEditComment} className="rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-700 transition-colors" title="Save">
                                                                            <Check size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{getCommentContent(comment)}</p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                ) : (
                                    <div className="text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                                        No activity logs yet.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Control Panel - Stays inside the flex-col modal container at the bottom */}
                        <div className="bg-indigo-600 p-6 border-t border-indigo-700/50 space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 space-y-2">
                                    <label className="text-[10px] font-black text-indigo-100 uppercase tracking-widest ml-1">Assign Technician</label>
                                    <select
                                        className="w-full bg-white/10 border border-white/20 text-white text-sm rounded-xl px-4 py-3 outline-none font-bold backdrop-blur-md focus:bg-white/20 transition-all"
                                        value={pendingTechAssignment || technicians.find(t => t.name === selectedTicket.assignedTechnicianName)?.id || ''}
                                        onChange={(e) => setPendingTechAssignment(e.target.value)}
                                        disabled={selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED'}
                                    >
                                        <option value="" disabled className="text-slate-800">Choose Specialist...</option>
                                        {technicians.map(tech => (
                                            <option key={tech.id} value={tech.id} className="text-slate-800">{tech.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex-1 space-y-2">
                                    <label className="text-[10px] font-black text-indigo-100 uppercase tracking-widest ml-1">Update Status</label>
                                    <select
                                        className="w-full bg-white/10 border border-white/20 text-white text-sm rounded-xl px-4 py-3 outline-none font-bold backdrop-blur-md focus:bg-white/20 transition-all"
                                        value={pendingStatus || selectedTicket.status}
                                        onChange={(e) => handleStatusChangeRequest(e.target.value)}
                                        disabled={selectedTicket.status === 'CLOSED'}
                                    >
                                        {INCIDENT_STATUS_UPDATE_OPTIONS.map((status) => (
                                            <option key={status.value} value={status.value} className="text-slate-800">
                                                {status.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={!pendingTechAssignment && (!pendingStatus || pendingStatus === selectedTicket.status)}
                                className="w-full bg-white text-indigo-600 text-sm font-black py-4 rounded-2xl shadow-lg hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                Confirm Action Plan
                            </button>
                        </div>

                        {/* Action Backdrop Modal (Rejection/Resolution) */}
                        {actionModal.open && (
                            <div className="absolute inset-0 z-20 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-8 animate-fade-in">
                                <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                                    <div className="p-6 border-b border-slate-100">
                                        <h3 className="text-xl font-black text-slate-900">{actionModal.title}</h3>
                                        <p className="text-xs text-slate-400 mt-1">This update will be visible to the requester.</p>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{actionModal.label}</label>
                                            <textarea
                                                autoFocus
                                                value={actionModal.value}
                                                onChange={(e) => setActionModal(prev => ({ ...prev, value: e.target.value }))}
                                                placeholder={actionModal.placeholder}
                                                rows={4}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm focus:border-primary/30 focus:bg-white outline-none transition-all resize-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="p-6 bg-slate-50 flex gap-3">
                                        <button
                                            onClick={() => setActionModal({ open: false, type: '', status: '', title: '', value: '' })}
                                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleActionConfirm}
                                            disabled={actionModal.type === 'REJECTED' && !actionModal.value.trim()}
                                            className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all ${actionModal.type === 'REJECTED' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'}`}
                                        >
                                            Confirm {actionModal.type === 'REJECTED' ? 'Rejection' : 'Resolution'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </Layout>
    );
};

export default AdminMaintenancePage;
