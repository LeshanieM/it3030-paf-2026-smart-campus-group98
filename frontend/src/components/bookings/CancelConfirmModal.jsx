import React from 'react';
import { X, Ban, AlertTriangle, Loader2 } from 'lucide-react';

const CancelConfirmModal = ({ booking, onConfirm, onClose, isLoading, mode = 'cancel' }) => {
  if (!booking) return null;

  const isDelete = mode === 'delete';
  const title = isDelete ? 'Delete Booking Request' : 'Cancel Booking';
  const confirmText = isDelete ? 'Yes, Delete It' : 'Yes, Cancel It';
  const warningText = isDelete 
    ? 'This pending request will be removed entirely from your history.' 
    : 'Only approved bookings can be cancelled. This booking will be marked as CANCELLED.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-100 w-full max-w-sm animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <Ban size={20} className="text-rose-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">{title}</h3>
              <p className="text-xs text-slate-400">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            {isDelete 
              ? 'Are you sure you want to delete this pending request? It will be permanently removed.' 
              : 'Are you sure you want to cancel this booking? The resource slot will be freed up for others.'}
          </p>

          {/* Booking summary */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm space-y-2">
            <div className="font-semibold text-slate-700">{booking.resourceName}</div>
            <div className="text-slate-500 text-xs flex items-center gap-2">
              <span>{booking.date}</span>
              <span className="text-slate-300">·</span>
              <span>{booking.startTime} – {booking.endTime}</span>
            </div>
            {booking.purpose && (
              <p className="text-slate-400 text-xs line-clamp-2">{booking.purpose}</p>
            )}
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              {warningText}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50"
          >
            Keep Booking
          </button>
          <button
            onClick={() => onConfirm(booking.id)}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-all shadow-sm shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Ban size={15} />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelConfirmModal;
