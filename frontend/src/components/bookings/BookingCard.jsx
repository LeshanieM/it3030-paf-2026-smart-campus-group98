import React from 'react';
import { Calendar, Clock, MapPin, Users, AlertCircle, X } from 'lucide-react';
import BookingStatusBadge from './BookingStatusBadge';

const BookingCard = ({ booking, onCancel, onDelete, onViewDetail }) => {
  const { resourceName, resourceType, resourceLocation, date, startTime, endTime, purpose, status, rejectionReason, expectedAttendees } = booking;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  const resourceTypeColors = {
    LAB: 'bg-violet-100 text-violet-700',
    ROOM: 'bg-sky-100 text-sky-700',
    EQUIPMENT: 'bg-orange-100 text-orange-700',
  };
  const typeColor = resourceTypeColors[resourceType] || 'bg-slate-100 text-slate-600';

  return (
    <div
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 overflow-hidden cursor-pointer hover-lift"
      onClick={() => onViewDetail && onViewDetail(booking)}
    >
      {/* Top color bar based on status - combined gradient from second version */}
      <div className={`h-1.5 w-full ${
        status === 'APPROVED' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
        status === 'REJECTED' ? 'bg-gradient-to-r from-rose-400 to-pink-500' :
        status === 'CANCELLED' ? 'bg-gradient-to-r from-slate-300 to-slate-400' :
        'bg-gradient-to-r from-amber-400 to-orange-500'
      }`} />

      <div className="p-5">
        {/* Header row - combined styles */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight group-hover:text-primary transition-colors truncate">
                {resourceName}
              </h3>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${typeColor} shadow-sm`}>
                {resourceType}
              </span>
            </div>
            {resourceLocation && (
              <div className="flex items-center gap-1 text-slate-400 text-xs">
                <div className="p-1 rounded-md bg-slate-50 border border-slate-100">
                  <MapPin size={10} className="text-slate-500" />
                </div>
                <span className="text-[11px] font-medium truncate tracking-wide uppercase italic opacity-80">
                  {resourceLocation}
                </span>
              </div>
            )}
          </div>
          <BookingStatusBadge status={status} size="sm" />
        </div>

        {/* Date/Time info - using grid layout from second version with first version's simplicity */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Calendar size={10} className="text-primary" />
              Date
            </div>
            <span className="text-xs font-bold text-slate-700">{formatDate(date)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Clock size={10} className="text-primary" />
              Time Slot
            </div>
            <span className="text-xs font-bold text-slate-700">{startTime} – {endTime}</span>
          </div>
        </div>

        {/* Purpose - combined styling */}
        {purpose && (
          <div className="mb-4">
            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 italic px-3 py-2 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
              "{purpose}"
            </p>
          </div>
        )}

        {/* Attendees - combined display */}
        {expectedAttendees != null && resourceType !== 'EQUIPMENT' && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
            <div className="flex items-center gap-1 px-2 py-1 bg-primary/5 rounded-md text-[10px] font-bold text-primary uppercase">
              <Users size={10} />
              <span>{expectedAttendees} attendees expected</span>
            </div>
          </div>
        )}

        {/* Footer with view details hint */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
          <div className="flex-1" />
          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest group-hover:text-primary/40 transition-colors">
            View Details →
          </div>
        </div>

        {/* Rejection Reason */}
        {status === 'REJECTED' && rejectionReason && (
          <div className="mt-4 flex items-start gap-2 bg-rose-50/50 border border-rose-100/50 rounded-xl p-3">
            <AlertCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-0.5">Rejection Reason</p>
              <p className="text-[11px] text-rose-600 font-medium leading-tight">{rejectionReason}</p>
            </div>
          </div>
        )}

        {/* Cancel/Delete action */}
        {status === 'APPROVED' && onCancel && (
          <button
            onClick={(e) => { e.stopPropagation(); onCancel(booking); }}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 text-[11px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl transition-all duration-300 shadow-sm shadow-rose-100/50 uppercase tracking-wider"
          >
            <X size={14} strokeWidth={3} />
            Cancel Booking
          </button>
        )}

        {status === 'PENDING' && onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(booking); }}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 text-[11px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl transition-all duration-300 shadow-sm shadow-rose-100/50 uppercase tracking-wider"
          >
            <X size={14} strokeWidth={3} />
            Delete Request
          </button>
        )}
      </div>
    </div>
  );
};

export default BookingCard;