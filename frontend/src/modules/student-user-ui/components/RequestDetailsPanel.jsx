import React, { useState } from 'react';
import { Clock3, Loader2, MapPin, Tag, UserCircle2, Wrench, Paperclip, Eye, Download, Send, Edit2, Trash2, X, Check, Phone, UserPlus } from 'lucide-react';
import EmptyState from './EmptyState';
import SectionHeader from './SectionHeader';
import StatusBadge, { INCIDENT_STATUS_ORDER, formatIncidentStatusLabel, normalizeIncidentStatus, PriorityBadge } from './StatusBadge';
import SurfaceCard from './SurfaceCard';
import { formatDateTime, formatDateTimeOrFallback, formatDurationMinutes } from '../../maintenance/utils/dateTime';
import { downloadAttachment, getAttachmentName, viewAttachment, getViewerUrl } from '../../maintenance/utils/attachmentActions';

const getCommentContent = (comment) => comment?.content || comment?.message || comment?.comment || comment?.text || '';
const getCommentCreatedAt = (comment) => comment?.createdAt || comment?.timestamp || null;
const getCommentUpdatedAt = (comment) => comment?.updatedAt || comment?.editedAt || null;

const statusStepIndex = (status) => {
  const normalizedStatus = normalizeIncidentStatus(status);
  return INCIDENT_STATUS_ORDER.indexOf(normalizedStatus);
};

const getUpdates = (request) => {
  return request?.comments || [];
};

const RequestDetailsPanel = ({ 
  request, 
  isLoading, 
  onCancel, 
  isCancelling,
  onAddComment,
  onEditComment,
  onDeleteComment
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  if (isLoading) {
    return (
      <SurfaceCard className="p-6 sm:p-7">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 className="animate-spin" size={18} />
          <span>Loading request details...</span>
        </div>
      </SurfaceCard>
    );
  }

  if (!request) {
    return (
      <SurfaceCard className="p-6 sm:p-7">
        <EmptyState
          icon={<Wrench size={20} />}
          title="Request details will appear here"
          description="Select a ticket from the list to review its description, assignment, and progress timeline."
        />
      </SurfaceCard>
    );
  }

  const activeIndex = statusStepIndex(request.status);
  const normalizedStatus = normalizeIncidentStatus(request.status);
  const updates = getUpdates(request);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    const success = await onAddComment(newComment.trim());
    if (success) setNewComment('');
    setIsSubmitting(false);
  };

  const handleStartEdit = (comment) => {
    setEditingId(comment.id);
    setEditValue(getCommentContent(comment));
  };

  const handleSaveEdit = async (commentId) => {
    if (!editValue.trim()) return;
    const success = await onEditComment(commentId, editValue.trim());
    if (success) setEditingId(null);
  };

  const timelineSteps = normalizedStatus === 'REJECTED' 
    ? ['OPEN', 'REJECTED'] 
    : INCIDENT_STATUS_ORDER.filter(s => s !== 'REJECTED');

  return (
    <SurfaceCard className="p-6 sm:p-7">
      <SectionHeader
        eyebrow="Ticket Details"
        icon={<Wrench size={14} />}
        title={request.title}
        description="Review the latest status, assignment, and timeline for this ticket."
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Are you sure you want to cancel this ticket?")) onCancel();
              }}
              disabled={normalizedStatus !== 'OPEN' || isCancelling}
              title={normalizedStatus !== 'OPEN' ? "Cancellation only allowed when status is OPEN" : "Cancel ticket"}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                normalizedStatus !== 'OPEN' 
                  ? 'cursor-not-allowed bg-slate-100 text-slate-400' 
                  : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
              }`}
            >
              {isCancelling ? <Loader2 size={14} className="animate-spin" /> : null}
              Cancel
            </button>
            <StatusBadge status={request.status} />
          </div>
        }
      />

      <p className="mt-6 text-sm leading-7 text-slate-600">{request.description}</p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            <MapPin size={14} />
            <span>Location</span>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-800">
            {request.location} {request.room ? `(${request.room})` : ''}
          </p>
          <div className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            <Tag size={14} />
            <span>Category</span>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-800">{request.category}</p>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Priority</p>
          <div className="mt-2">
            <PriorityBadge priority={request.priority} />
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            <Phone size={14} />
            <span>Preferred Contact</span>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-800">{request.preferredContact || 'Not provided'}</p>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Timeline</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">
            <span className="text-slate-500 font-normal">Created:</span> {formatDateTime(request.createdAt)}
          </p>
          {request.actualResolutionAt && (
            <p className="mt-1 text-xs font-semibold text-emerald-700">
              <span className="text-emerald-600 font-normal">Resolved:</span> {formatDateTime(request.actualResolutionAt)}
            </p>
          )}
          <div className="mt-5 inline-block rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 tracking-wider">
            {request.slaStatus ? request.slaStatus.replace(/_/g, ' ') : 'SLA ACTIVE'}
          </div>
        </div>
      </div>

      {/* Assigned Technician */}
      {request.assignedTechnicianName && (
        <div className="mt-4 rounded-[24px] border border-indigo-200 bg-indigo-50/60 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-400">
            <UserPlus size={14} />
            <span>Assigned Technician</span>
          </div>
          <p className="mt-3 text-sm font-semibold text-indigo-800">{request.assignedTechnicianName}</p>
        </div>
      )}

      {/* Rejection Reason */}
      {normalizedStatus === 'REJECTED' && request.rejectionReason && (
        <div className="mt-4 rounded-[24px] border border-rose-200 bg-rose-50/70 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-rose-500">
            <span>Rejection Reason</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-rose-800 whitespace-pre-wrap">{request.rejectionReason}</p>
        </div>
      )}

      {/* Resolution Notes */}
      {normalizedStatus === 'RESOLVED' && (request.resolutionNotes || request.resolutionSummary) && (
        <div className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-500">
            <span>Resolution Notes</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-emerald-800 whitespace-pre-wrap">{request.resolutionNotes || request.resolutionSummary}</p>
        </div>
      )}

      <div className="mt-8 rounded-[26px] border border-blue-200 bg-blue-50/70 p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-blue-900">
          <Clock3 size={18} />
          <h4 className="text-lg font-bold">SLA details</h4>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-blue-100 bg-white/80 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-500">Response target</p>
            <p className="mt-2 text-sm font-semibold text-blue-900">{formatDateTime(request.slaResponseDeadline)}</p>
            <p className="mt-2 text-xs text-slate-500">Actual: {formatDateTimeOrFallback(request.actualFirstResponseAt)}</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-white/80 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-500">Resolution target</p>
            <p className="mt-2 text-sm font-semibold text-blue-900">{formatDateTime(request.slaResolutionDeadline)}</p>
            <p className="mt-2 text-xs text-slate-500">Actual: {formatDateTimeOrFallback(request.actualResolutionAt)}</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-white/80 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-500">First response time</p>
            <p className="mt-2 text-sm font-semibold text-blue-900">{formatDurationMinutes(request.responseDurationMinutes)}</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-white/80 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-500">Resolution time</p>
            <p className="mt-2 text-sm font-semibold text-blue-900">{formatDurationMinutes(request.resolutionDurationMinutes)}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-[26px] border border-slate-200 bg-slate-50/80 p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-slate-800">
          <Clock3 size={18} />
          <h4 className="text-lg font-bold">Progress timeline</h4>
        </div>
        <div className={`grid gap-3 ${timelineSteps.length === 2 ? 'grid-cols-2 max-w-sm' : 'grid-cols-2 md:grid-cols-5'}`}>
          {timelineSteps.map((step) => {
            const stepIdx = INCIDENT_STATUS_ORDER.indexOf(step);
            const isComplete = stepIdx <= activeIndex || (normalizedStatus === 'REJECTED' && step === 'REJECTED');
            const label = formatIncidentStatusLabel(step);
            return (
              <div
                key={step}
                className={`rounded-xl border px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider transition ${
                  isComplete
                    ? step === 'REJECTED' 
                      ? 'border-rose-200 bg-rose-50 text-rose-700 shadow-sm'
                      : 'border-blue-200 bg-white text-blue-700 shadow-sm'
                    : 'border-slate-200 bg-slate-100 text-slate-400'
                }`}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 rounded-[26px] border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-slate-800">
          <Clock3 size={18} />
          <h4 className="text-lg font-bold">Comments and updates</h4>
        </div>

        {/* Comment Input */}
        <form onSubmit={handlePostComment} className="mb-6 relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment or follow-up question..."
            rows={2}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 pb-14 text-sm focus:border-blue-300 focus:bg-white focus:outline-none transition-all resize-none"
          />
          <div className="absolute bottom-3 right-3">
             <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none transition"
             >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Post Update
             </button>
          </div>
        </form>

        {updates.filter(u => getCommentContent(u).trim()).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No updates yet. Feel free to add a comment above.
          </div>
        ) : (
          <div className="space-y-4">
            {[...updates]
              .filter(u => getCommentContent(u).trim())
              .reverse()
              .map((update, index) => {
              const isEditing = editingId === update.id;
              const isMyComment = update.canEdit; // Backend flag for ownership
              const isAdmin = update.authorRole === 'ADMIN';
              const isTechnician = update.authorRole === 'TECHNICIAN';
              const commentCreated = getCommentCreatedAt(update);
              const commentUpdated = getCommentUpdatedAt(update);
              const isEdited = commentUpdated && commentCreated && new Date(commentUpdated).getTime() > new Date(commentCreated).getTime() + 1000;

              return (
                <div key={update.id || index} className="group relative rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-4 hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-bold ${isMyComment ? 'text-blue-700' : 'text-slate-800'}`}>
                          {update.authorName || 'User'}
                        </p>
                        {isAdmin && (
                          <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-indigo-700 border border-indigo-200">
                            Admin
                          </span>
                        )}
                        {isTechnician && (
                          <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-teal-700 border border-teal-200">
                            Technician
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {update.authorRole} • {formatDateTime(commentUpdated || commentCreated)}
                        </span>
                        {isEdited && (
                          <span className="text-[9px] font-bold text-slate-400 italic">(edited)</span>
                        )}
                      </div>
                      
                      {isEditing ? (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full rounded-lg border border-blue-200 bg-white p-3 text-sm focus:outline-none"
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingId(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200"><X size={16} /></button>
                            <button onClick={() => handleSaveEdit(update.id)} className="rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-700"><Check size={16} /></button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm leading-6 text-slate-600 whitespace-pre-wrap">
                          {getCommentContent(update)}
                        </p>
                      )}
                    </div>
                    
                    {isMyComment && !isEditing && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleStartEdit(update)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-blue-600 shadow-sm transition"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        {update.canDelete && (
                        <button 
                          onClick={() => { if(window.confirm('Delete comment?')) onDeleteComment(update.id) }}
                          className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-rose-600 shadow-sm transition"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 rounded-[26px] border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-slate-800">
          <Paperclip size={18} />
          <h4 className="text-lg font-bold">Attachments</h4>
        </div>

        {request.attachments?.length ? (
          <div className="space-y-3">
            {request.attachments.map((attachment, index) => (
              <div key={`${getAttachmentName(attachment)}-${index}`} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div 
                  className="text-sm font-semibold text-slate-800 truncate max-w-[250px]" 
                  title={getAttachmentName(attachment)}
                >
                  {getAttachmentName(attachment)}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={getViewerUrl(attachment) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 ${!attachment?.viewUrl ? 'cursor-not-allowed opacity-50 pointer-events-none' : ''}`}
                  >
                    <Eye size={14} />
                    View
                  </a>
                  <button
                    type="button"
                    onClick={() => downloadAttachment(attachment).catch((error) => window.alert(error?.response?.data?.message || error?.message || 'Unable to download the attachment.'))}
                    disabled={!attachment?.downloadUrl}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download size={14} />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No attachments were uploaded for this ticket.
          </div>
        )}
      </div>
    </SurfaceCard>
  );
};

export default RequestDetailsPanel;
