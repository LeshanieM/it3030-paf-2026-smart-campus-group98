import React, { useState } from 'react';
import { X, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

const RejectReasonModal = ({ booking, onConfirm, onClose, isLoading }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('A rejection reason is required.');
      return;
    }
    setError('');
    onConfirm(booking.id, reason.trim());
  };

  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-100 w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <XCircle size={20} className="text-rose-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Reject Booking</h3>
              <p className="text-xs text-slate-400">Provide a reason for rejection</p>
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
          {/* Booking summary */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm space-y-1">
            <div className="font-semibold text-slate-700">{booking.resourceName}</div>
            <div className="text-slate-400 text-xs">{booking.date} · {booking.startTime} – {booking.endTime}</div>
            {booking.createdBy && (
              <div className="text-slate-400 text-xs">By: {booking.createdBy}</div>
            )}
          </div>

          {/* Warning note */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              This action cannot be undone. The user will be notified with the reason provided.
            </p>
          </div>

          {/* Reason textarea */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(''); }}
              placeholder="e.g., The room is under maintenance for that period..."
              rows={4}
              className={`w-full text-sm px-4 py-3 rounded-xl border bg-white resize-none outline-none transition-all
                focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400
                ${error ? 'border-rose-400 bg-rose-50' : 'border-slate-200 focus:border-primary/40'}`}
            />
            {error && (
              <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
                <AlertTriangle size={11} />
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !reason.trim()}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-all shadow-sm shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
            Reject Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectReasonModal;
