import React, { useMemo } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  Layers,
  MapPin,
  RefreshCw,
  Ticket,
  TrendingUp,
  Users,
  Zap,
  Archive,
} from 'lucide-react';
import {
  AnalyticsSection,
  DistributionBar,
  InsightList,
  KpiCard,
  MiniBarChart,
  TechnicianWorkloadGrid,
  buildPrioritySegments,
  buildStatusSegments,
  buildTechnicianWorkload,
  getDayOfWeekBars,
  getPeakHours,
  groupByField,
} from '../../maintenance/components/DashboardAnalytics';

const AdminIncidentAnalyticsOverview = ({
  tickets = [],
  isLoading = false,
  error = null,
  onRefresh,
  className = '',
}) => {
  const analytics = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((ticket) => ticket.status === 'OPEN').length;
    const inProgress = tickets.filter(
      (ticket) => ticket.status === 'ASSIGNED' || ticket.status === 'IN_PROGRESS'
    ).length;
    const resolved = tickets.filter((ticket) => ticket.status === 'RESOLVED').length;
    const rejected = tickets.filter((ticket) => ticket.status === 'REJECTED').length;
    const closed = tickets.filter((ticket) => ticket.status === 'CLOSED').length;

    const statusSegments = buildStatusSegments(tickets);
    const prioritySegments = buildPrioritySegments(tickets);
    const topLocations = groupByField(tickets, 'location', 5);
    const peakHours = getPeakHours(tickets, 5);
    const dayBars = getDayOfWeekBars(tickets);
    const recentTickets = [...tickets]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((ticket) => ({
        key: ticket.id,
        label: ticket.title,
        sublabel: `${ticket.ticketId} - ${ticket.location}`,
        value: ticket.status?.replace(/_/g, ' '),
      }));
    const techWorkload = buildTechnicianWorkload(tickets);

    return {
      total,
      open,
      inProgress,
      resolved,
      rejected,
      closed,
      statusSegments,
      prioritySegments,
      topLocations,
      peakHours,
      dayBars,
      recentTickets,
      techWorkload,
    };
  }, [tickets]);

  if (isLoading) {
    return (
      <div className={`relative z-10 rounded-[24px] border border-white/60 bg-white/70 p-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${className}`}>
        <RefreshCw size={28} className="mx-auto animate-spin text-primary" />
        <p className="mt-4 text-sm font-bold text-slate-600">Loading incident analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative z-10 rounded-[24px] border border-rose-100 bg-rose-50/80 p-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${className}`}>
        <AlertCircle size={32} className="mx-auto text-rose-500" />
        <p className="mt-4 text-sm font-bold text-rose-700">{error}</p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-rose-600 shadow-sm transition-colors hover:bg-rose-100"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 relative z-10 animate-fade-in ${className}`}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard icon={<Ticket size={18} />} label="Total Tickets" value={analytics.total} accent="blue" />
        <KpiCard icon={<Clock size={18} />} label="Open" value={analytics.open} accent="blue" />
        <KpiCard icon={<Zap size={18} />} label="In Progress" value={analytics.inProgress} accent="orange" />
        <KpiCard icon={<CheckCircle size={18} />} label="Resolved" value={analytics.resolved} accent="emerald" />
        <KpiCard icon={<AlertCircle size={18} />} label="Rejected" value={analytics.rejected} accent="rose" />
        <KpiCard icon={<Archive size={18} />} label="Closed" value={analytics.closed} accent="slate" />
      </div>

      <AnalyticsSection>
        <div className="mb-2 flex items-center gap-2">
          <BarChart3 size={16} className="text-slate-400" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Ticket Distribution</h3>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <DistributionBar title="By Status" segments={analytics.statusSegments} />
          <DistributionBar title="By Priority" segments={analytics.prioritySegments} />
        </div>
      </AnalyticsSection>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AnalyticsSection>
          <div className="mb-2 flex items-center gap-2">
            <MapPin size={16} className="text-slate-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Top Locations</h3>
          </div>
          <InsightList
            title="Most Reported Locations"
            items={analytics.topLocations}
            emptyMessage="No location data available"
          />
        </AnalyticsSection>

        <AnalyticsSection>
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp size={16} className="text-slate-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Reporting Patterns</h3>
          </div>
          <MiniBarChart
            title="Submissions by Day of Week"
            bars={analytics.dayBars}
            emptyMessage="No submission data"
          />
          <InsightList
            title="Peak Reporting Hours"
            items={analytics.peakHours}
            emptyMessage="No time data available"
          />
        </AnalyticsSection>

        <AnalyticsSection>
          <div className="mb-2 flex items-center gap-2">
            <Layers size={16} className="text-slate-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Recent Submissions</h3>
          </div>
          <InsightList
            title="Last 5 Tickets"
            items={analytics.recentTickets}
            emptyMessage="No recent tickets"
          />
        </AnalyticsSection>
      </div>

      <AnalyticsSection>
        <div className="mb-2 flex items-center gap-2">
          <Users size={16} className="text-slate-400" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Technician Workload</h3>
        </div>
        <TechnicianWorkloadGrid title="Tickets Per Technician" workloadData={analytics.techWorkload} />
      </AnalyticsSection>
    </div>
  );
};

export default AdminIncidentAnalyticsOverview;
