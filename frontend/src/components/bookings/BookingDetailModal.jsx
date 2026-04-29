import React from 'react';
import {
  X, Calendar, Clock, MapPin, Users, FileText,
  User, Hash, Tag, AlertCircle, CheckCircle2, XCircle, Ban, Clock3
} from 'lucide-react';
import BookingStatusBadge from './BookingStatusBadge';

const InfoRow = ({ icon: Icon, label, value, className = '' }) => (
  <div className={`flex items-start gap-3 ${className}`}>
    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
      <Icon size={15} className="text-primary" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-700 break-words">{value || '—'}</p>
    </div>
  </div>
);

const BookingDetailModal = ({ booking, onClose }) => {
  if (!booking) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const statusTimeline = [
    { label: 'Submitted', done: true, icon: Hash },
    { label: 'Under Review', done: ['APPROVED', 'REJECTED', 'CANCELLED'].includes(booking.status), icon: Clock3 },
    { label: booking.status === 'REJECTED' ? 'Rejected' : 'Approved', done: ['APPROVED', 'CANCELLED'].includes(booking.status), rejected: booking.status === 'REJECTED', icon: booking.status === 'REJECTED' ? XCircle : CheckCircle2 },
    { label: 'Completed / Cancelled', done: booking.status === 'CANCELLED', icon: Ban },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-100 w-full max-w-xl max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-bold text-slate-800">{booking.resourceName}</h3>
              <BookingStatusBadge status={booking.status} />
            </div>
            <p className="text-xs text-slate-400">Booking ID: <span className="font-mono text-slate-500">{booking.id}</span></p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all shrink-0 ml-4"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Rejection reason banner */}
          {booking.status === 'REJECTED' && booking.rejectionReason && (
            <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4">
              <AlertCircle size={18} className="text-rose-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-rose-700 mb-1">Rejection Reason</p>
                <p className="text-sm text-rose-600">{booking.rejectionReason}</p>
              </div>
            </div>
          )}

          {/* Resource info */}
          <section>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Resource Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow icon={Tag} label="Resource Name" value={booking.resourceName} />
              <InfoRow icon={Tag} label="Resource Type" value={booking.resourceType} />
              <InfoRow icon={MapPin} label="Location" value={booking.resourceLocation} />
              <InfoRow icon={Hash} label="Resource ID" value={booking.resourceId} />
            </div>
          </section>

          <div className="border-t border-slate-50" />

          {/* Booking details */}
          <section>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Booking Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow icon={Calendar} label="Date" value={formatDate(booking.date)} className="col-span-2" />
              <InfoRow icon={Clock} label="Start Time" value={booking.startTime} />
              <InfoRow icon={Clock} label="End Time" value={booking.endTime} />
              {booking.resourceType !== 'EQUIPMENT' && booking.expectedAttendees != null && (
                <InfoRow icon={Users} label="Expected Attendees" value={String(booking.expectedAttendees)} />
              )}
            </div>
          </section>

          {booking.purpose && (
            <>
              <div className="border-t border-slate-50" />
              <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Purpose</h4>
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 leading-relaxed border border-slate-100">
                  <FileText size={13} className="text-slate-400 inline mr-2" />
                  {booking.purpose}
                </div>
              </section>
            </>
          )}

          <div className="border-t border-slate-50" />

          {/* Meta info */}
          <section>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Request Info</h4>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow icon={User} label="Requested By" value={booking.createdBy} />
              <InfoRow icon={Clock3} label="Submitted At" value={formatTimestamp(booking.createdAt)} />
            </div>
          </section>

          {/* Status timeline */}
          <div className="border-t border-slate-50" />
          <section>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Status Timeline</h4>
            <div className="flex items-center gap-0">
              {statusTimeline.map((step, i) => {
                const Icon = step.icon;
                const isLast = i === statusTimeline.length - 1;
                return (
                  <React.Fragment key={step.label}>
                    <div className="flex flex-col items-center gap-1 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        step.rejected
                          ? 'bg-rose-100 border-rose-300 text-rose-600'
                          : step.done
                          ? 'bg-primary border-primary text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-300'
                      }`}>
                        <Icon size={14} />
                      </div>
                      <span className={`text-[10px] font-semibold text-center leading-tight ${
                        step.done ? 'text-slate-600' : 'text-slate-300'
                      }`}>{step.label}</span>
                    </div>
                    {!isLast && (
                      <div className={`flex-1 h-0.5 mx-1 mb-4 transition-all ${step.done ? 'bg-primary/30' : 'bg-slate-100'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;
