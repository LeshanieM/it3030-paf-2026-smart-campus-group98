import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Edit2, Loader2, MessageSquare, RefreshCw, Trash2, Wrench, Paperclip, Eye, Download, PlayCircle, MapPin, CheckCircle2, X, ShieldCheck, Filter } from 'lucide-react';
import { createPortal } from 'react-dom';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import SectionHeader from '../../student-user-ui/components/SectionHeader';
import SurfaceCard from '../../student-user-ui/components/SurfaceCard';
import StatusBadge, { INCIDENT_STATUS_OPTIONS, PriorityBadge, normalizeIncidentPriority, normalizeIncidentStatus } from '../../student-user-ui/components/StatusBadge';
import ToastStack from '../../student-user-ui/components/ToastStack';
import EmptyState from '../../student-user-ui/components/EmptyState';
import { formatDateTime, formatDateTimeOrFallback, formatDurationMinutes } from '../../maintenance/utils/dateTime';
import { downloadAttachment, getAttachmentName, viewAttachment, getViewerUrl } from '../../maintenance/utils/attachmentActions';

const sortTickets = (items) => [...items].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
const getCommentContent = (comment) => comment?.content || comment?.message || '';
const getCommentCreatedAt = (comment) => comment?.createdAt || comment?.timestamp || null;
const getCommentUpdatedAt = (comment) => comment?.updatedAt || comment?.editedAt || null;
const normalizeIdentity = (value) => String(value || '').trim().toLowerCase();

const TechnicianMaintenancePage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [visibleToRequester, setVisibleToRequester] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [attachmentActionKey, setAttachmentActionKey] = useState('');
  const [ticketFilter, setTicketFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const detailsRef = useRef(null);

  const displayName = useMemo(() => {
    return user?.name || user?.sub || user?.email || 'Technician';
  }, [user]);

  const canManageComment = (comment) => {
    if (comment?.canEdit || comment?.canDelete) {
      return true;
    }

    const authorName = normalizeIdentity(comment?.authorName);
    if (!authorName) {
      return false;
    }

    const identityCandidates = [
      user?.name,
      user?.email,
      user?.sub,
      user?.sub ? String(user.sub).split('@')[0] : null,
    ]
      .map(normalizeIdentity)
      .filter(Boolean);

    return identityCandidates.includes(authorName);
  };

  const pushToast = (tone, title, message = '') => {
    const id = `${tone}-${Date.now()}`;
    setToasts((current) => [...current, { id, tone, title, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  };

  const syncTicketState = (ticket) => {
    setSelectedRequest(ticket);
    setSelectedRequestId(ticket?.id || null);
    setRequests((current) => {
      const next = current.some((item) => item.id === ticket.id)
        ? current.map((item) => (item.id === ticket.id ? ticket : item))
        : [ticket, ...current];
      return sortTickets(next);
    });
  };

  const resetComposer = () => {
    setCommentText('');
    setVisibleToRequester(false);
    setEditingCommentId(null);
  };

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/technician/tickets');
      const nextRequests = sortTickets(Array.isArray(res.data) ? res.data : []);
      setRequests(nextRequests);

      setSelectedRequestId((currentId) => {
        if (currentId && nextRequests.some((item) => item.id === currentId)) {
          return currentId;
        }
        return null;
      });
    } catch (error) {
      pushToast('error', 'Failed to load assigned tickets', error?.response?.data?.message || '');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDetails = async (id) => {
    if (!id) {
      setSelectedRequest(null);
      return;
    }

    const fallbackRequest = requests.find((item) => item.id === id) || null;
    setIsDetailLoading(true);
    try {
      const res = await api.get(`/technician/tickets/${id}`);
      setSelectedRequest(res.data);
    } catch (error) {
      if (fallbackRequest) {
        setSelectedRequest(fallbackRequest);
      } else {
        setSelectedRequest(null);
      }
      pushToast('error', 'Failed to load ticket details', error?.response?.data?.message || '');
    } finally {
      setIsDetailLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    loadDetails(selectedRequestId);
    resetComposer();
    
    // Auto-scroll to details when a ticket is selected
    if (selectedRequestId && detailsRef.current) {
        detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedRequestId]);

  const handleSaveComment = async () => {
    if (!commentText.trim() || !selectedRequestId) return;

    try {
      const payload = { message: commentText.trim(), visibleToRequester };
      const response = editingCommentId
        ? await api.put(`/technician/tickets/${selectedRequestId}/comments/${editingCommentId}`, payload)
        : await api.post(`/technician/tickets/${selectedRequestId}/comments`, payload);

      syncTicketState(response.data);
      pushToast('success', editingCommentId ? 'Comment updated' : 'Comment added');
      resetComposer();
    } catch (error) {
      pushToast('error', 'Failed to save comment', error?.response?.data?.message || '');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!selectedRequestId || !window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await api.delete(`/technician/tickets/${selectedRequestId}/comments/${commentId}`);
      syncTicketState(response.data);
      pushToast('success', 'Comment deleted');
      resetComposer();
    } catch (error) {
      pushToast('error', 'Failed to delete comment', error?.response?.data?.message || '');
    }
  };

  const beginEditing = (comment) => {
    setEditingCommentId(comment.id);
    setCommentText(getCommentContent(comment));
    setVisibleToRequester(Boolean(comment.visibleToRequester));
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
      pushToast('error', 'Attachment unavailable', error?.response?.data?.message || error?.message || '');
    } finally {
      setAttachmentActionKey('');
    }
  };

  const handleUpdateStatus = async (newStatus) => {
      try {
          const payload = { status: newStatus };
          if (newStatus === 'RESOLVED') {
              const resolutionNotes = window.prompt('Enter resolution notes (optional):');
              if (resolutionNotes && resolutionNotes.trim()) {
                  payload.resolutionNotes = resolutionNotes.trim();
              }
          }
          const res = await api.patch(`/technician/tickets/${selectedRequest.id}/status`, payload);
          syncTicketState(res.data);
          pushToast('success', 'Status Updated', `Ticket is now ${newStatus}`);
      } catch (err) {
          pushToast('error', 'Update Failed', err?.response?.data?.message || 'Unauthorized');
      }
  };

  const comments = selectedRequest?.comments || [];
  const quickFocus = searchParams.get('focus');

  useEffect(() => {
    const mappedFilter = quickFocus === 'not-started'
      ? 'NOT_STARTED'
      : quickFocus === 'in-progress'
        ? 'IN_PROGRESS'
        : quickFocus === 'high-priority'
          ? 'HIGH_PRIORITY'
          : quickFocus === 'recent'
            ? 'RECENT'
            : quickFocus === 'resume'
              ? 'RESUME'
              : 'ALL';
    setTicketFilter(mappedFilter);
  }, [searchParams, quickFocus]);

  const filteredRequests = useMemo(() => {
    let result = [...requests];

    // Status filter - primary technician view filter
    if (statusFilter !== 'ALL') {
      result = result.filter(req => normalizeIncidentStatus(req.status) === statusFilter);
    }

    // Quick Focus filters (existing dashboard shortcuts)
    const highPrioritySet = new Set(['HIGH', 'EMERGENCY']);
    
    if (ticketFilter === 'NOT_STARTED') {
      result = result.filter((req) => ['OPEN', 'ASSIGNED'].includes(normalizeIncidentStatus(req.status)));
    } else if (ticketFilter === 'IN_PROGRESS') {
      result = result.filter((req) => normalizeIncidentStatus(req.status) === 'IN_PROGRESS');
    } else if (ticketFilter === 'HIGH_PRIORITY') {
      result = result.filter((req) => highPrioritySet.has(normalizeIncidentPriority(req.priority)));
    } else if (ticketFilter === 'RECENT') {
      // Sorting is already handled in requests state, so we just slice
      result = result.slice(0, 10);
    } else if (ticketFilter === 'RESUME') {
      result = result.filter((req) => normalizeIncidentStatus(req.status) === 'IN_PROGRESS');
    }

    return result;
  }, [requests, ticketFilter, statusFilter]);

  const clearQuickFocus = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('focus');
    nextParams.set('tab', 'tickets');
    setSearchParams(nextParams);
  };

  // Scroll lock for modal
  useEffect(() => {
      if (selectedRequestId && selectedRequest) {
          document.body.style.overflow = 'hidden';
          document.documentElement.style.overflow = 'hidden';
      } else {
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
      }
      return () => {
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
      };
  }, [selectedRequestId, selectedRequest]);

  return (
    <Layout>
      <ToastStack toasts={toasts} />
      <div className="space-y-8 text-slate-900 pb-20">
        <SurfaceCard className="p-7 sm:p-9" tone="hero">
          <SectionHeader
            eyebrow="Technician Dashboard"
            icon={<Wrench size={14} />}
            title={`Assigned Tickets for ${displayName}`}
            actions={
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100">
                  <Filter size={14} className="text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer pr-1"
                  >
                    <option value="ALL">All Statuses</option>
                    {INCIDENT_STATUS_OPTIONS.filter(opt => opt.value !== 'OPEN').map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={loadRequests}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-slate-50 transition-colors border border-slate-100"
                >
                  <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
            }
          />
        </SurfaceCard>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
        ) : (
          <>
            <>
            {quickFocus && (
              <SurfaceCard className="p-4 sm:p-5 border border-blue-100 bg-blue-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500">Quick Focus</p>
                    <p className="text-sm font-semibold text-slate-700">
                      Showing {filteredRequests.length} ticket{filteredRequests.length === 1 ? '' : 's'} for this dashboard shortcut.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearQuickFocus}
                    className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-blue-700 hover:bg-blue-50"
                  >
                    Show All Tickets
                  </button>
                </div>
              </SurfaceCard>
            )}
            {requests.length === 0 ? (
                <SurfaceCard className="p-12 text-center">
                    <EmptyState 
                        icon={<Wrench size={40} className="text-slate-300 mx-auto mb-4" />}
                        title="No assigned tasks"
                        description="You currently have no maintenance tickets assigned to you. Enjoy the quiet!"
                    />
                </SurfaceCard>
            ) : filteredRequests.length === 0 ? (
                <SurfaceCard className="p-12 text-center">
                    <div className="max-w-md mx-auto">
                        <Filter size={40} className="text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-slate-800 mb-2">No tickets match this filter</h3>
                        <p className="text-sm font-medium text-slate-500 mb-6">
                            We couldn't find any {statusFilter !== 'ALL' ? statusFilter.replace('_', ' ').toLowerCase() : ''} tickets {ticketFilter !== 'ALL' ? 'for this focus area' : ''}.
                        </p>
                        <div className="flex justify-center gap-3">
                            {statusFilter !== 'ALL' && (
                                <button 
                                    onClick={() => setStatusFilter('ALL')}
                                    className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all"
                                >
                                    Reset Status Filter
                                </button>
                            )}
                            {ticketFilter !== 'ALL' && (
                                <button 
                                    onClick={clearQuickFocus}
                                    className="px-6 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl text-xs font-black transition-all"
                                >
                                    Clear Focus Area
                                </button>
                            )}
                        </div>
                    </div>
                </SurfaceCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredRequests.map((req) => (
                        <div
                            key={req.id}
                            onClick={() => setSelectedRequestId(req.id)}
                            className="group relative bg-white/80 backdrop-blur-sm rounded-[24px] border border-slate-200 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer flex flex-col h-full"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                                    <Wrench size={20} className="text-slate-400 group-hover:text-blue-500" />
                                </div>
                                <StatusBadge status={req.status} />
                            </div>
                            
                            <h3 className="font-black text-slate-800 text-lg mb-2 line-clamp-2 leading-tight group-hover:text-blue-700 transition-colors">
                                {req.title}
                            </h3>
                            
                            <div className="mt-auto space-y-3">
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                    <MapPin size={12} />
                                    <span className="truncate">{req.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold uppercase tracking-tight">
                                    <ShieldCheck size={10} />
                                    <span>Assigned By: {req.assignedByName || 'Admin'}</span>
                                </div>
                                
                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <PriorityBadge priority={req.priority} />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        {req.ticketId}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Ticket Details Modal */}
            {selectedRequestId && selectedRequest && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Wrench size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 leading-tight">{selectedRequest.title}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedRequest.ticketId}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                        <span className="text-xs font-medium text-slate-500">{selectedRequest.location}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setSelectedRequestId(null); setSelectedRequest(null); }}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Main Content */}
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Description */}
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Incident Description</h4>
                                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 leading-relaxed text-slate-700">
                                            {selectedRequest.description}
                                        </div>
                                    </div>

                                    {/* Attachments */}
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2">
                                            <Paperclip size={14} /> Attachments
                                        </h4>
                                        {selectedRequest.attachments?.length ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {selectedRequest.attachments.map((attachment, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <Paperclip size={16} className="text-slate-400 shrink-0" />
                                                            <span className="text-xs font-bold text-slate-700 truncate">{getAttachmentName(attachment)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <a href={getViewerUrl(attachment)} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-slate-100 rounded text-blue-600"><Eye size={16} /></a>
                                                            <button onClick={() => handleAttachmentAction(attachment, 'download')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Download size={16} /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs font-medium text-slate-400 italic">No files attached to this request.</p>
                                        )}
                                    </div>

                                    {/* Comments Section */}
                                    <div className="pt-4 border-t border-slate-100">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                                            <MessageSquare size={14} /> Activity & Notes
                                        </h4>
                                        
                                        <div className="space-y-4 mb-6">
                                            {comments.length === 0 ? (
                                                <p className="text-xs text-slate-400 italic">No activity recorded yet.</p>
                                            ) : [...comments].reverse().map(comment => {
                                                const commentCreated = getCommentCreatedAt(comment);
                                                const commentUpdated = getCommentUpdatedAt(comment);
                                                const isEdited = commentUpdated && commentCreated && new Date(commentUpdated).getTime() > new Date(commentCreated).getTime() + 1000;
                                                const isEditingThis = editingCommentId === comment.id;

                                                return (
                                                <div key={comment.id} className={`rounded-2xl p-4 border ${!comment.visibleToRequester ? 'border-amber-200 bg-amber-50/30' : 'bg-slate-50/50 border-slate-100'}`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-xs font-black text-slate-800">{comment.authorName}</span>
                                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${comment.authorRole === 'USER' ? 'bg-blue-100 text-blue-700' : comment.authorRole === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'}`}>
                                                                {comment.authorRole === 'USER' ? 'Requester' : comment.authorRole === 'ADMIN' ? 'Admin' : 'Technician'}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400">{formatDateTime(commentCreated)}</span>
                                                            {isEdited && (
                                                                <span className="text-[9px] font-bold text-slate-400 italic">(edited)</span>
                                                            )}
                                                            {!comment.visibleToRequester && (
                                                                <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-200">
                                                                    Internal note
                                                                </span>
                                                            )}
                                                        </div>
                                                        {!isEditingThis && (comment.canEdit || comment.canDelete || canManageComment(comment)) && (
                                                            <div className="flex items-center gap-1">
                                                                {(comment.canEdit || canManageComment(comment)) && (
                                                                    <button onClick={() => beginEditing(comment)} className="p-1 hover:bg-white rounded text-slate-400 hover:text-blue-600 transition-colors" title="Edit"><Edit2 size={12} /></button>
                                                                )}
                                                                {(comment.canDelete || canManageComment(comment)) && (
                                                                    <button onClick={() => handleDeleteComment(comment.id)} className="p-1 hover:bg-white rounded text-slate-400 hover:text-rose-600 transition-colors" title="Delete"><Trash2 size={12} /></button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {isEditingThis ? (
                                                        <div className="mt-2 space-y-3">
                                                            <textarea
                                                                value={commentText}
                                                                onChange={(e) => setCommentText(e.target.value)}
                                                                className="w-full rounded-xl border border-blue-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                                                                rows={3}
                                                            />
                                                            <div className="flex items-center justify-between">
                                                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={visibleToRequester}
                                                                        onChange={(e) => setVisibleToRequester(e.target.checked)}
                                                                        className="rounded text-blue-600"
                                                                    />
                                                                    Share with Requester
                                                                </label>
                                                                <div className="flex gap-2">
                                                                    <button onClick={resetComposer} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                                                                    <button
                                                                        onClick={handleSaveComment}
                                                                        className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                                                                    >
                                                                        Update
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{getCommentContent(comment)}</p>
                                                    )}
                                                </div>
                                                );
                                            })}
                                        </div>

                                        {/* Comment Composer */}
                                        <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
                                            <textarea 
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                className="w-full text-sm focus:outline-none min-h-[80px] resize-none"
                                                placeholder="Add a progress note or update..."
                                            />
                                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={visibleToRequester}
                                                        onChange={(e) => setVisibleToRequester(e.target.checked)}
                                                        className="rounded text-blue-600"
                                                    />
                                                    Share with Requester
                                                </label>
                                                <div className="flex gap-2">
                                                    {editingCommentId && <button onClick={resetComposer} className="px-4 py-2 text-xs font-bold text-slate-500">Cancel</button>}
                                                    <button 
                                                        onClick={handleSaveComment}
                                                        className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                                                    >
                                                        {editingCommentId ? 'Update' : 'Post Note'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar Stats */}
                                <div className="space-y-6">
                                    {/* Action Panel */}
                                    <div className="bg-slate-900 rounded-[28px] p-6 text-white shadow-xl">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Task Management</h4>
                                        <div className="space-y-4">
                                            {['ASSIGNED', 'OPEN'].includes(normalizeIncidentStatus(selectedRequest.status)) ? (
                                                <button
                                                    onClick={() => handleUpdateStatus('IN_PROGRESS')}
                                                    className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 rounded-2xl flex items-center justify-center gap-3 font-black text-sm shadow-lg shadow-indigo-500/30 transition-all"
                                                >
                                                    <PlayCircle size={20} />
                                                    Start My Work
                                                </button>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="text-[10px] text-slate-500 uppercase font-bold px-1">Update Progress</div>
                                                    <select 
                                                        value={selectedRequest.status}
                                                        onChange={(e) => handleUpdateStatus(e.target.value)}
                                                        className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-400 outline-none"
                                                    >
                                                        {INCIDENT_STATUS_OPTIONS.filter((s) => !['OPEN', 'REJECTED'].includes(s.value)).map(s => (
                                                            <option key={s.value} value={s.value}>{s.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                            
                                            {selectedRequest.status !== 'RESOLVED' && selectedRequest.status !== 'CLOSED' && (
                                                <button
                                                    onClick={() => handleUpdateStatus('RESOLVED')}
                                                    className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all"
                                                >
                                                    <CheckCircle2 size={16} className="text-emerald-400" />
                                                    Mark as Resolved
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-6">
                                        <div>
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Priority</h5>
                                            <PriorityBadge priority={selectedRequest.priority} />
                                        </div>
                                        <div>
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Category</h5>
                                            <p className="text-sm font-bold text-slate-800 uppercase tracking-tight">{selectedRequest.category}</p>
                                        </div>
                                        <div>
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Assigned By</h5>
                                            <p className="text-sm font-bold text-slate-800">{selectedRequest.assignedByName || 'Not recorded'}</p>
                                        </div>
                                    </div>

                                    {/* SLA Stats */}
                                    <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100">
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4">SLA Benchmarks</h5>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-blue-600 uppercase">Resolution Target</p>
                                                <p className="text-xs font-black text-blue-900 mt-1">{formatDateTime(selectedRequest.slaResolutionDeadline)}</p>
                                            </div>
                                            <div className="pt-3 border-t border-blue-100">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-blue-600 uppercase">Status</span>
                                                    <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">
                                                        {selectedRequest.slaStatus || 'Active'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            </>
          </>
        )}
      </div>
    </Layout>
  );
};

export default TechnicianMaintenancePage;
