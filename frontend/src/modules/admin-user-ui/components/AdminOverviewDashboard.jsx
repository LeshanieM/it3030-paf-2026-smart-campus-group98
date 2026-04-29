import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BellRing,
  Building2,
  CheckCircle,
  Clock3,
  LayoutGrid,
  RefreshCw,
  Ticket,
  TrendingUp,
  UserCog,
  Users,
} from 'lucide-react';
import api from '../../../services/api';
import { facilityApi } from '../../facility-catalogue/api/facilityApi';
import { bookingService } from '../../../services/bookingService';
import { getAllTickets } from '../api/adminMaintenanceApi';
import {
  AnalyticsSection,
  DistributionBar,
  InsightList,
  KpiCard,
  MiniBarChart,
} from '../../maintenance/components/DashboardAnalytics';

const EMPTY_ARRAY = [];

const buildSegments = (entries, palette) =>
  entries.map(([key, label, value], index) => ({
    key,
    label,
    value,
    color: palette[index % palette.length],
  }));

const countBy = (items, selector) => {
  const counts = {};
  items.forEach((item) => {
    const key = selector(item) || 'Unknown';
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
};

const toInsightItems = (counts, limit = 5, formatter = (value) => value) =>
  Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([label, value]) => ({
      key: label,
      label: formatter(label),
      value,
    }));

const parseHourLabel = (timeValue) => {
  if (!timeValue) return null;
  const raw = String(timeValue);
  const hour = Number.parseInt(raw.split(':')[0], 10);
  if (Number.isNaN(hour)) return null;
  return `${String(hour).padStart(2, '0')}:00`;
};

const SectionHeading = ({ icon, title }) => (
  <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-4 py-3 shadow-lg shadow-slate-900/10">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/60">Admin Overview</p>
      <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white">{title}</h3>
    </div>
  </div>
);

const AdminOverviewDashboard = () => {
  const [users, setUsers] = useState(EMPTY_ARRAY);
  const [resources, setResources] = useState(EMPTY_ARRAY);
  const [bookings, setBookings] = useState(EMPTY_ARRAY);
  const [tickets, setTickets] = useState(EMPTY_ARRAY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [usersResponse, resourcesResponse, bookingsData, ticketsData] = await Promise.all([
        api.get('/admin/users'),
        facilityApi.getAdminResources(),
        bookingService.getAllBookings(),
        getAllTickets(),
      ]);

      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : EMPTY_ARRAY);
      setResources(Array.isArray(resourcesResponse.data) ? resourcesResponse.data : EMPTY_ARRAY);
      setBookings(Array.isArray(bookingsData) ? bookingsData : EMPTY_ARRAY);
      setTickets(Array.isArray(ticketsData) ? ticketsData : EMPTY_ARRAY);
    } catch (loadError) {
      const message =
        loadError?.response?.data?.message ||
        loadError?.message ||
        'Unable to load the admin dashboard right now.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const analytics = useMemo(() => {
    const usersByRole = countBy(users, (user) => user.role || 'USER');
    const resourcesByStatus = countBy(resources, (resource) => resource.status || 'UNKNOWN');
    const resourcesByType = countBy(resources, (resource) => resource.type || 'UNKNOWN');
    const bookingsByStatus = countBy(bookings, (booking) => booking.status || 'UNKNOWN');
    const bookingsByResource = countBy(bookings, (booking) => booking.resourceName || 'Unknown resource');
    const ticketsByStatus = countBy(tickets, (ticket) => ticket.status || 'UNKNOWN');
    const ticketsByLocation = countBy(tickets, (ticket) => ticket.location || 'Unknown');

    const bookingHourCounts = {};
    bookings.forEach((booking) => {
      const hourLabel = parseHourLabel(booking.startTime);
      if (!hourLabel) return;
      bookingHourCounts[hourLabel] = (bookingHourCounts[hourLabel] || 0) + 1;
    });

    const bookingHourBars = Object.entries(bookingHourCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 8)
      .map(([label, value], index) => ({
        label,
        value,
        color: ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-cyan-500'][index % 4],
      }));

    const peakBookingHours = Object.entries(bookingHourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([label, value]) => ({ key: label, label, value }));

    const pendingTicketCount = tickets.filter((ticket) =>
      ['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(ticket.status)
    ).length;

    const resolvedTicketCount = tickets.filter((ticket) =>
      ['RESOLVED', 'CLOSED'].includes(ticket.status)
    ).length;

    return {
      totalUsers: users.length,
      adminUsers: usersByRole.ADMIN || 0,
      technicianUsers: usersByRole.TECHNICIAN || 0,
      memberUsers: usersByRole.USER || 0,
      totalResources: resources.length,
      activeResources: resourcesByStatus.ACTIVE || 0,
      outOfServiceResources: resourcesByStatus.OUT_OF_SERVICE || 0,
      totalBookings: bookings.length,
      pendingBookings: bookingsByStatus.PENDING || 0,
      approvedBookings: bookingsByStatus.APPROVED || 0,
      totalTickets: tickets.length,
      pendingTickets: pendingTicketCount,
      resolvedTickets: resolvedTicketCount,
      userRoleSegments: buildSegments(
        [
          ['ADMIN', 'Admins', usersByRole.ADMIN || 0],
          ['TECHNICIAN', 'Technicians', usersByRole.TECHNICIAN || 0],
          ['USER', 'Members', usersByRole.USER || 0],
        ],
        ['bg-indigo-500', 'bg-emerald-500', 'bg-blue-500']
      ),
      resourceStatusSegments: buildSegments(
        [
          ['ACTIVE', 'Active', resourcesByStatus.ACTIVE || 0],
          ['OUT_OF_SERVICE', 'Out of Service', resourcesByStatus.OUT_OF_SERVICE || 0],
        ],
        ['bg-emerald-500', 'bg-rose-500']
      ),
      bookingStatusSegments: buildSegments(
        [
          ['PENDING', 'Pending', bookingsByStatus.PENDING || 0],
          ['APPROVED', 'Approved', bookingsByStatus.APPROVED || 0],
          ['REJECTED', 'Rejected', bookingsByStatus.REJECTED || 0],
          ['CANCELLED', 'Cancelled', bookingsByStatus.CANCELLED || 0],
        ],
        ['bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-slate-400']
      ),
      ticketStatusSegments: buildSegments(
        [
          ['OPEN', 'Open', ticketsByStatus.OPEN || 0],
          ['ASSIGNED', 'Assigned', ticketsByStatus.ASSIGNED || 0],
          ['IN_PROGRESS', 'In Progress', ticketsByStatus.IN_PROGRESS || 0],
          ['RESOLVED', 'Resolved', ticketsByStatus.RESOLVED || 0],
          ['CLOSED', 'Closed', ticketsByStatus.CLOSED || 0],
        ],
        ['bg-blue-500', 'bg-indigo-500', 'bg-orange-500', 'bg-emerald-500', 'bg-slate-400']
      ),
      topResourceTypes: toInsightItems(resourcesByType, 5, (label) => label.replace(/_/g, ' ')),
      topBookedResources: toInsightItems(bookingsByResource, 5),
      topTicketLocations: toInsightItems(ticketsByLocation, 5),
      peakBookingHours,
      bookingHourBars,
      recentBookings: [...bookings]
        .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
        .slice(0, 5)
        .map((booking) => ({
          key: booking.id,
          label: booking.resourceName || 'Unnamed resource',
          sublabel: [booking.date, booking.startTime, booking.endTime]
            .filter(Boolean)
            .join(' - ') || 'Schedule not available',
        })),
      recentTickets: [...tickets]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map((ticket) => ({
          key: ticket.id,
          label: ticket.title || ticket.ticketId || 'Incident ticket',
          sublabel: `${ticket.location || 'Unknown'} - ${ticket.priority || 'No priority'}`,
          value: ticket.status || 'UNKNOWN',
        })),
    };
  }, [bookings, resources, tickets, users]);

  if (isLoading) {
    return (
      <div className="rounded-[28px] border border-white/60 bg-white/75 p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <RefreshCw size={30} className="mx-auto animate-spin text-primary" />
        <p className="mt-4 text-sm font-bold text-slate-600">Loading campus-wide admin analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-rose-100 bg-rose-50/80 p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <AlertCircle size={34} className="mx-auto text-rose-500" />
        <p className="mt-4 text-sm font-bold text-rose-700">{error}</p>
        <button
          type="button"
          onClick={loadDashboard}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-rose-600 shadow-sm hover:bg-rose-100"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <KpiCard icon={<Users size={18} />} label="Total Users" value={analytics.totalUsers} accent="indigo" />
        <KpiCard icon={<Building2 size={18} />} label="Resources" value={analytics.totalResources} accent="blue" />
        <KpiCard icon={<CheckCircle size={18} />} label="Active Facilities" value={analytics.activeResources} accent="emerald" />
        <KpiCard icon={<Clock3 size={18} />} label="Pending Tickets" value={analytics.pendingTickets} accent="orange" />
        <KpiCard icon={<BellRing size={18} />} label="Resolved Tickets" value={analytics.resolvedTickets} accent="purple" />
        <KpiCard icon={<LayoutGrid size={18} />} label="Bookings" value={analytics.totalBookings} accent="slate" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AnalyticsSection>
          <SectionHeading icon={<UserCog size={18} />} title="Users Overview" />
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="Admins" value={analytics.adminUsers} accent="indigo" />
            <KpiCard label="Technicians" value={analytics.technicianUsers} accent="emerald" />
            <KpiCard label="Members" value={analytics.memberUsers} accent="blue" />
          </div>
          <DistributionBar title="Role Distribution" segments={analytics.userRoleSegments} />
        </AnalyticsSection>

        <AnalyticsSection>
          <SectionHeading icon={<Building2 size={18} />} title="Facilities Snapshot" />
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="Total" value={analytics.totalResources} accent="blue" />
            <KpiCard label="Active" value={analytics.activeResources} accent="emerald" />
            <KpiCard label="Out of Service" value={analytics.outOfServiceResources} accent="rose" />
          </div>
          <DistributionBar title="Resource Health" segments={analytics.resourceStatusSegments} />
          <InsightList
            title="Top Facility Types"
            items={analytics.topResourceTypes}
            emptyMessage="No facility data available"
          />
        </AnalyticsSection>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AnalyticsSection>
          <SectionHeading icon={<Ticket size={18} />} title="Incident Operations" />
          <DistributionBar title="Ticket Status" segments={analytics.ticketStatusSegments} />
          <InsightList
            title="Most Reported Locations"
            items={analytics.topTicketLocations}
            emptyMessage="No incident data available"
          />
          <InsightList
            title="Latest Tickets"
            items={analytics.recentTickets}
            emptyMessage="No recent incidents"
          />
        </AnalyticsSection>

        <AnalyticsSection>
          <SectionHeading icon={<TrendingUp size={18} />} title="Booking Usage Analytics" />
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="Total" value={analytics.totalBookings} accent="slate" />
            <KpiCard label="Pending" value={analytics.pendingBookings} accent="amber" />
            <KpiCard label="Approved" value={analytics.approvedBookings} accent="emerald" />
          </div>
          <DistributionBar title="Booking Status" segments={analytics.bookingStatusSegments} />
          <MiniBarChart
            title="Peak Booking Start Hours"
            bars={analytics.bookingHourBars}
            emptyMessage="No booking timing data available"
          />
          <InsightList
            title="Top Resources"
            items={analytics.topBookedResources}
            emptyMessage="No booking usage data available"
          />
          <InsightList
            title="Recent Bookings"
            items={analytics.recentBookings}
            emptyMessage="No recent bookings"
          />
        </AnalyticsSection>
      </div>

      <AnalyticsSection>
        <SectionHeading icon={<Activity size={18} />} title="Operations Highlights" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <InsightList
            title="Peak Booking Hours"
            items={analytics.peakBookingHours}
            emptyMessage="No booking peak hours detected"
          />
          <InsightList
            title="Top Facility Types"
            items={analytics.topResourceTypes}
            emptyMessage="No resource type data"
          />
          <InsightList
            title="Top Ticket Locations"
            items={analytics.topTicketLocations}
            emptyMessage="No incident location data"
          />
        </div>
      </AnalyticsSection>
    </div>
  );
};

export default AdminOverviewDashboard;
