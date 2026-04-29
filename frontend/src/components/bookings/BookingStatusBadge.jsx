import React from 'react';
import { CheckCircle, Clock, XCircle, Ban } from 'lucide-react';

const statusConfig = {
  PENDING: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-100',
    dot: 'bg-amber-400',
  },
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100',
    dot: 'bg-emerald-500',
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-100',
    dot: 'bg-rose-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: Ban,
    className: 'bg-slate-100 text-slate-500 border-slate-200 ring-slate-100',
    dot: 'bg-slate-400',
  },
};

const BookingStatusBadge = ({ status, size = 'md' }) => {
  const config = statusConfig[status] || statusConfig.PENDING;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border shadow-sm ring-2 transition-all duration-300 ${config.className} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 shadow-sm ${config.dot}`} />
      <Icon size={size === 'sm' ? 10 : size === 'lg' ? 14 : 12} strokeWidth={2.5} />
      <span className="uppercase tracking-wider">{config.label}</span>
    </span>
  );
};

export default BookingStatusBadge;