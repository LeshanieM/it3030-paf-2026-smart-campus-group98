import React from 'react';
import { Calendar, Clock, MapPin, Users, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import BookingStatusBadge from './BookingStatusBadge';

const BookingTable = ({
  bookings,
  isAdmin = false,
  loadingActionId,
  onApprove,
  onReject,
  onCancel,
  onDelete,
  onViewDetail,
}) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCreatedAt = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!bookings || bookings.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Resource</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Date</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Time</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Purpose</th>
            {isAdmin && (
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Requested By</th>
            )}
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Status</th>
            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {bookings.map((booking) => {
            const isLoading = loadingActionId === booking.id;
            return (
              <tr
                key={booking.id}
                className="bg-white hover:bg-slate-50/80 transition-colors cursor-pointer group"
                onClick={() => onViewDetail && onViewDetail(booking)}
              >
                {/* Resource */}
                <td className="px-5 py-4">
                  <div className="font-semibold text-slate-800 group-hover:text-primary transition-colors">{booking.resourceName}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    {booking.resourceLocation && <><MapPin size={10} /><span>{booking.resourceLocation}</span></>}
                  </div>
                  {booking.resourceType && (
                    <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-px rounded bg-slate-100 text-slate-500 uppercase tracking-wider">
                      {booking.resourceType}
                    </span>
                  )}
                </td>

                {/* Date */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Calendar size={13} className="text-slate-400" />
                    <span className="font-medium">{formatDate(booking.date)}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Booked {formatCreatedAt(booking.createdAt)}</div>
                </td>

                {/* Time */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock size={13} className="text-slate-400" />
                    <span className="font-medium">{booking.startTime} – {booking.endTime}</span>
                  </div>
                </td>

                {/* Purpose */}
                <td className="px-5 py-4">
                  <p className="text-slate-600 max-w-xs truncate">{booking.purpose || '—'}</p>
                  {booking.status === 'REJECTED' && booking.rejectionReason && (
                    <div className="flex items-center gap-1 text-xs text-rose-500 mt-1 group/tooltip relative">
                      <AlertCircle size={11} />
                      <span className="truncate max-w-[160px] cursor-help">{booking.rejectionReason}</span>
                    </div>
                  )}
                </td>

                {/* Created By (Admin only) */}
                {isAdmin && (
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
                        {booking.createdBy?.[0] || '?'}
                      </div>
                      <span className="text-slate-600 text-xs font-medium truncate max-w-[120px]">{booking.createdBy}</span>
                    </div>
                  </td>
                )}

                {/* Status */}
                <td className="px-5 py-4">
                  <BookingStatusBadge status={booking.status} size="sm" />
                </td>

                {/* Actions */}
                <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    {isAdmin && booking.status === 'PENDING' && (
                      <>
                        <button
                          disabled={isLoading}
                          onClick={() => onApprove && onApprove(booking)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all disabled:opacity-50"
                        >
                          {isLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                          Approve
                        </button>
                        <button
                          disabled={isLoading}
                          onClick={() => onReject && onReject(booking)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all disabled:opacity-50"
                        >
                          {isLoading ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                          Reject
                        </button>
                      </>
                    )}

                    {!isAdmin && booking.status === 'APPROVED' && (
                      <button
                        disabled={isLoading}
                        onClick={() => onCancel && onCancel(booking)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                        Cancel
                      </button>
                    )}

                    {!isAdmin && booking.status === 'PENDING' && (
                      <button
                        disabled={isLoading}
                        onClick={() => onDelete && onDelete(booking)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                        Delete
                      </button>
                    )}

                    {/* No action for non-actionable states */}
                    {((isAdmin && booking.status !== 'PENDING') || (!isAdmin && (booking.status !== 'APPROVED' && booking.status !== 'PENDING'))) && (
                      <span className="text-xs text-slate-300 italic">—</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BookingTable;
