import React from 'react';
import { Clock, Wrench, CheckCircle, ShieldCheck, AlertCircle, UserPlus } from 'lucide-react';

export const INCIDENT_STATUS_ORDER = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];
export const INCIDENT_STATUS_UPDATE_ORDER = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];
export const INCIDENT_PRIORITY_ORDER = ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'];

export const normalizeIncidentStatus = (status) => {
  switch (status) {
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
      return 'OPEN';
    case 'ON_HOLD':
      return 'IN_PROGRESS';
    default:
      return status || 'OPEN';
  }
};

const statusConfigs = {
  OPEN: {
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <Clock size={12} />,
    label: 'Open',
  },
  ASSIGNED: {
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: <UserPlus size={12} />,
    label: 'Assigned',
  },
  IN_PROGRESS: {
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: <Wrench size={12} />,
    label: 'In Progress',
  },
  RESOLVED: {
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <CheckCircle size={12} />,
    label: 'Resolved',
  },
  CLOSED: {
    color: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: <ShieldCheck size={12} />,
    label: 'Closed',
  },
  REJECTED: {
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: <AlertCircle size={12} />,
    label: 'Rejected',
  },
};

export const INCIDENT_STATUS_OPTIONS = INCIDENT_STATUS_ORDER.map((status) => ({
  value: status,
  label: statusConfigs[status]?.label || status,
}));

export const INCIDENT_STATUS_UPDATE_OPTIONS = INCIDENT_STATUS_UPDATE_ORDER.map((status) => ({
  value: status,
  label: statusConfigs[status]?.label || status,
}));

export const formatIncidentStatusLabel = (status) => {
  const normalizedStatus = normalizeIncidentStatus(status);
  return statusConfigs[normalizedStatus]?.label || normalizedStatus.replace(/_/g, ' ');
};

export const normalizeIncidentPriority = (priority) => {
  const normalized = String(priority || '').toUpperCase();
  if (normalized === 'URGENT') return 'EMERGENCY';
  if (INCIDENT_PRIORITY_ORDER.includes(normalized)) return normalized;
  return 'MEDIUM';
};

export const getPriorityConfig = (priority) => {
  switch (normalizeIncidentPriority(priority)) {
    case 'EMERGENCY':
      return {
        color: 'bg-rose-100 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        label: 'Emergency',
      };
    case 'HIGH':
      return {
        color: 'bg-orange-100 text-orange-700 border-orange-200',
        dot: 'bg-orange-500',
        label: 'High',
      };
    case 'MEDIUM':
      return {
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        label: 'Medium',
      };
    case 'LOW':
    default:
      return {
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Low',
      };
  }
};

export const INCIDENT_PRIORITY_OPTIONS = INCIDENT_PRIORITY_ORDER.map((priority) => ({
  value: priority,
  label: getPriorityConfig(priority).label,
}));

export const formatIncidentPriorityLabel = (priority) => getPriorityConfig(priority).label;

export const PriorityBadge = ({ priority, className = '' }) => {
  const config = getPriorityConfig(priority);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest transition-colors ${config.color} ${className}`.trim()}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

const StatusBadge = ({ status, className = '' }) => {
  const normalizedStatus = normalizeIncidentStatus(status);
  const config = statusConfigs[normalizedStatus] || {
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: null,
    label: formatIncidentStatusLabel(normalizedStatus),
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors ${config.color} ${className}`.trim()}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

export default StatusBadge;
