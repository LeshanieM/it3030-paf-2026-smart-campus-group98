import React from 'react';
import {
  INCIDENT_PRIORITY_ORDER,
  INCIDENT_STATUS_ORDER,
  formatIncidentPriorityLabel,
  formatIncidentStatusLabel,
  normalizeIncidentPriority,
  normalizeIncidentStatus,
} from '../../student-user-ui/components/StatusBadge';

/* ─── Colour Maps (aligned with StatusBadge.jsx) ─── */

const STATUS_COLORS = {
  OPEN:        { bg: 'bg-blue-500',    text: 'text-blue-700',    light: 'bg-blue-50',    border: 'border-blue-200',   hex: '#3b82f6' },
  ASSIGNED:    { bg: 'bg-indigo-500',  text: 'text-indigo-700',  light: 'bg-indigo-50',  border: 'border-indigo-200', hex: '#6366f1' },
  IN_PROGRESS: { bg: 'bg-orange-500',  text: 'text-orange-700',  light: 'bg-orange-50',  border: 'border-orange-200', hex: '#f97316' },
  RESOLVED:    { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50', border: 'border-emerald-200',hex: '#10b981' },
  CLOSED:      { bg: 'bg-slate-400',   text: 'text-slate-600',   light: 'bg-slate-100',  border: 'border-slate-200',  hex: '#94a3b8' },
  REJECTED:    { bg: 'bg-rose-500',    text: 'text-rose-700',    light: 'bg-rose-50',    border: 'border-rose-200',   hex: '#f43f5e' },
};

const PRIORITY_COLORS = {
  LOW:       { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-50', hex: '#10b981' },
  MEDIUM:    { bg: 'bg-amber-500',   text: 'text-amber-700',   light: 'bg-amber-50',   hex: '#f59e0b' },
  HIGH:      { bg: 'bg-orange-500',  text: 'text-orange-700',  light: 'bg-orange-50',  hex: '#f97316' },
  EMERGENCY: { bg: 'bg-rose-500',    text: 'text-rose-700',    light: 'bg-rose-50',    hex: '#f43f5e' },
};

/* ─── KPI Card ─── */

export const KpiCard = ({ icon, label, value, accent = 'blue' }) => {
  const accents = {
    blue:    'from-blue-500 to-blue-600',
    indigo:  'from-indigo-500 to-indigo-600',
    orange:  'from-orange-500 to-orange-600',
    emerald: 'from-emerald-500 to-emerald-600',
    rose:    'from-rose-500 to-rose-600',
    slate:   'from-slate-400 to-slate-500',
    amber:   'from-amber-500 to-amber-600',
    purple:  'from-purple-500 to-purple-600',
  };

  return (
    <div className="group relative bg-white/80 backdrop-blur-sm rounded-[20px] border border-slate-200/80 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden">
      {/* Subtle gradient accent stripe */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accents[accent] || accents.blue} opacity-80`} />
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{label}</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
        </div>
        {icon && (
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${accents[accent] || accents.blue} text-white shadow-lg shadow-${accent}-500/20 shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Stacked Horizontal Distribution Bar ─── */

export const DistributionBar = ({ title, segments = [], total }) => {
  const effectiveTotal = total || segments.reduce((sum, s) => sum + s.value, 0);

  if (effectiveTotal === 0) {
    return (
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</h4>
        <div className="h-4 rounded-full bg-slate-100 border border-slate-200/60" />
        <p className="text-xs text-slate-400 italic">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</h4>

      {/* Bar */}
      <div className="h-5 rounded-full overflow-hidden flex bg-slate-100 border border-slate-200/60">
        {segments.filter(s => s.value > 0).map((seg, i) => {
          const pct = Math.max((seg.value / effectiveTotal) * 100, 2); // min 2% for visibility
          return (
            <div
              key={seg.key || i}
              className={`${seg.color} transition-all duration-500 ease-out relative group/seg`}
              style={{ width: `${pct}%` }}
              title={`${seg.label}: ${seg.value} (${Math.round((seg.value / effectiveTotal) * 100)}%)`}
            >
              <div className="absolute inset-0 bg-white/0 group-hover/seg:bg-white/20 transition-all" />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.filter(s => s.value > 0).map((seg, i) => (
          <div key={seg.key || i} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${seg.color} shrink-0`} />
            <span className="text-[11px] font-semibold text-slate-600">
              {seg.label} <span className="font-black text-slate-800">{seg.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Mini Vertical Bar Chart (CSS-only) ─── */

export const MiniBarChart = ({ title, bars = [], emptyMessage = 'No data available' }) => {
  const maxVal = Math.max(...bars.map(b => b.value), 1);

  if (bars.length === 0 || maxVal === 0) {
    return (
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</h4>
        <p className="text-xs text-slate-400 italic">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</h4>
      <div className="flex items-end gap-2 h-28">
        {bars.map((bar, i) => {
          const heightPct = Math.max((bar.value / maxVal) * 100, 6);
          return (
            <div key={bar.label || i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <span className="text-[10px] font-black text-slate-600">{bar.value}</span>
              <div
                className={`w-full rounded-t-lg transition-all duration-500 ease-out ${bar.color || 'bg-blue-500'}`}
                style={{ height: `${heightPct}%`, minHeight: '4px' }}
                title={`${bar.label}: ${bar.value}`}
              />
              <span className="text-[9px] font-bold text-slate-400 truncate w-full text-center">{bar.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Insight List (compact clickable list) ─── */

export const InsightList = ({ title, items = [], emptyMessage = 'No data available', renderItem }) => {
  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</h4>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
          <p className="text-xs text-slate-400 italic">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</h4>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={item.key || i}
            className="flex items-center justify-between rounded-xl bg-white border border-slate-100 px-4 py-3 transition-all duration-200 hover:shadow-sm hover:border-slate-200"
          >
            {renderItem ? renderItem(item, i) : (
              <>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{item.label}</p>
                  {item.sublabel && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{item.sublabel}</p>}
                </div>
                <span className="text-xs font-black text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg shrink-0 ml-3">
                  {item.value}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Technician Workload Grid ─── */

export const TechnicianWorkloadGrid = ({ title, workloadData = [] }) => {
  if (workloadData.length === 0) {
    return (
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</h4>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
          <p className="text-xs text-slate-400 italic">No technician assignments yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {workloadData.map((tech) => (
          <div
            key={tech.name}
            className="bg-white rounded-2xl border border-slate-100 p-4 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-sm font-black shadow-md shadow-indigo-500/20">
              {tech.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <p className="mt-2 text-xs font-bold text-slate-700 truncate">{tech.name}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{tech.count}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tickets</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Analytics Section Wrapper ─── */

export const AnalyticsSection = ({ children, className = '' }) => (
  <div className={`bg-white/60 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8 space-y-8 ${className}`}>
    {children}
  </div>
);

/* ─── Tab Toggle ─── */

export const AnalyticsTabToggle = ({ activeTab, onTabChange, analyticsLabel = 'Analytics', ticketsLabel = 'Tickets' }) => (
  <div className="inline-flex rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-1.5 shadow-sm">
    <button
      type="button"
      onClick={() => onTabChange('analytics')}
      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
        activeTab === 'analytics'
          ? 'bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.24)]'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {analyticsLabel}
    </button>
    <button
      type="button"
      onClick={() => onTabChange('tickets')}
      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
        activeTab === 'tickets'
          ? 'bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.24)]'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {ticketsLabel}
    </button>
  </div>
);

/* ─── Helper: Build status distribution segments from tickets ─── */

export const buildStatusSegments = (tickets) => {
  return INCIDENT_STATUS_ORDER.map(status => ({
    key: status,
    label: formatIncidentStatusLabel(status),
    value: tickets.filter(t => normalizeIncidentStatus(t.status) === status).length,
    color: STATUS_COLORS[status]?.bg || 'bg-slate-400',
  }));
};

/* ─── Helper: Build priority distribution segments from tickets ─── */

export const buildPrioritySegments = (tickets) => {
  return INCIDENT_PRIORITY_ORDER.map(priority => ({
    key: priority,
    label: formatIncidentPriorityLabel(priority),
    value: tickets.filter(t => normalizeIncidentPriority(t.priority) === priority).length,
    color: PRIORITY_COLORS[priority]?.bg || 'bg-slate-400',
  }));
};

/* ─── Helper: Group tickets by a field and count ─── */

export const groupByField = (tickets, field, limit = 5) => {
  const counts = {};
  tickets.forEach(t => {
    const val = t[field] || 'Unknown';
    counts[val] = (counts[val] || 0) + 1;
  });
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([label, value]) => ({ label, value, key: label }));
};

/* ─── Helper: Get peak hours from createdAt timestamps ─── */

export const getPeakHours = (tickets, limit = 3) => {
  const hourCounts = Array(24).fill(0);
  tickets.forEach(t => {
    if (t.createdAt) {
      const hour = new Date(t.createdAt).getHours();
      hourCounts[hour]++;
    }
  });
  return hourCounts
    .map((count, hour) => ({
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`,
      value: count,
      key: `hour-${hour}`,
    }))
    .filter(h => h.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
};

/* ─── Helper: Get day-of-week distribution bars ─── */

export const getDayOfWeekBars = (tickets) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const counts = Array(7).fill(0);
  tickets.forEach(t => {
    if (t.createdAt) {
      counts[new Date(t.createdAt).getDay()]++;
    }
  });
  const colors = ['bg-slate-400', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500'];
  return days.map((label, i) => ({ label, value: counts[i], color: colors[i] }));
};

/* ─── Helper: Build technician workload data ─── */

export const buildTechnicianWorkload = (tickets) => {
  const counts = {};
  let unassigned = 0;
  tickets.forEach(t => {
    const name = t.assignedTechnicianName;
    if (name) {
      counts[name] = (counts[name] || 0) + 1;
    } else {
      unassigned++;
    }
  });
  const result = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  if (unassigned > 0) {
    result.push({ name: 'Unassigned', count: unassigned });
  }
  return result;
};
