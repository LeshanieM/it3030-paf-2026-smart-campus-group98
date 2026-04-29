import React from 'react';
import { CheckCircle, Clock, Calendar, User, Mail, Shield, Loader2, X } from 'lucide-react';

/**
 * ApproveConfirmModal - A professional confirmation dialog for approving bookings.
 * Features a detailed info card with requester details and clear action buttons.
 */
const ApproveConfirmModal = ({ booking, onConfirm, onClose, isLoading }) => {
  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-[2rem] shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-zoom-in">
        
        {/* Header Decor */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />
        
        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
                <CheckCircle size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Approve Booking</h3>
                <p className="text-sm text-slate-400 font-medium">This will notify the requester immediately</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Details Card */}
          <div className="bg-slate-50/50 rounded-[1.5rem] border border-slate-100 p-6 mb-8">
            <div className="flex flex-col gap-5">
              {/* Resource Name */}
              <div>
                <h4 className="text-lg font-black text-slate-700 leading-tight mb-1">{booking.resourceName}</h4>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                   <Calendar size={12} /> {booking.date} 
                   <span className="text-slate-200">|</span>
                   <Clock size={12} /> {booking.startTime} - {booking.endTime}
                </div>
              </div>

              {/* User Info (Mocking some details if they aren't in the object, based on screenshot) */}
              <div className="pt-5 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                    <User size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Requester</p>
                    <p className="text-sm font-bold text-slate-600 truncate">{booking.createdBy || 'Unknown User'}</p>
                  </div>
                </div>

                {/* Additional details like in the screenshot */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                      <Shield size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Role</p>
                      <p className="text-xs font-bold text-slate-500 uppercase">USER</p>
                    </div>
                  </div>
                  
                  {/* Status Indicator inside card */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-emerald-400">
                      <CheckCircle size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Current Status</p>
                      <p className="text-xs font-bold text-emerald-500 uppercase">PENDING</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose} 
              disabled={isLoading}
              className="flex-1 px-6 py-4 text-sm font-black text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all uppercase tracking-widest disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={() => onConfirm(booking.id)} 
              disabled={isLoading}
              className="flex-[1.5] relative group flex items-center justify-center gap-3 px-8 py-4 text-sm font-black text-white bg-emerald-500 hover:bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all uppercase tracking-widest disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10 flex items-center gap-3">
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} strokeWidth={2.5} />}
                {isLoading ? 'Processing...' : 'Approve'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApproveConfirmModal;
