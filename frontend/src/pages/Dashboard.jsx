import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import AdminOverviewDashboard from '../modules/admin-user-ui/components/AdminOverviewDashboard';
import api from '../services/api';
import { AlertCircle, CalendarClock, CheckCircle2, Clock3, FolderKanban, RefreshCw, ShieldCheck, Wrench } from 'lucide-react';
import StatusBadge, { PriorityBadge, normalizeIncidentPriority, normalizeIncidentStatus } from '../modules/student-user-ui/components/StatusBadge';
import SurfaceCard from '../modules/student-user-ui/components/SurfaceCard';
import {
    AnalyticsSection,
    DistributionBar,
    KpiCard,
    buildPrioritySegments,
    buildStatusSegments,
} from '../modules/maintenance/components/DashboardAnalytics';
import { bookingService } from '../services/bookingService';
import { getMyRequests } from '../modules/student-user-ui/api/studentMaintenanceApi';
import { facilityApi } from '../modules/facility-catalogue/api/facilityApi';

const formatTime = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString();
};

const formatBookingDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString();
};

const RequesterDashboard = () => {
    const [requests, setRequests] = React.useState([]);
    const [bookings, setBookings] = React.useState([]);
    const [resources, setResources] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [loadError, setLoadError] = React.useState('');
    const requestSeqRef = React.useRef(0);

    const withTimeout = React.useCallback((promise, ms, label) => {
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = window.setTimeout(() => {
                reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`));
            }, ms);
        });
        return Promise.race([promise, timeoutPromise]).finally(() => window.clearTimeout(timeoutId));
    }, []);

    const loadDashboard = React.useCallback(async () => {
        const seq = requestSeqRef.current + 1;
        requestSeqRef.current = seq;
        setIsLoading(true);
        setLoadError('');
        try {
            const results = await Promise.allSettled([
                withTimeout(getMyRequests(), 25_000, 'Requests'),
                withTimeout(bookingService.getMyBookings(), 25_000, 'Bookings'),
                withTimeout(facilityApi.getAllResources().then((res) => res.data), 25_000, 'Facilities'),
            ]);

            if (requestSeqRef.current !== seq) return;

            const [requestsResult, bookingsResult, resourcesResult] = results;

            if (requestsResult.status === 'fulfilled') {
                setRequests(Array.isArray(requestsResult.value) ? requestsResult.value : []);
            } else {
                setRequests([]);
            }

            if (bookingsResult.status === 'fulfilled') {
                setBookings(Array.isArray(bookingsResult.value) ? bookingsResult.value : []);
            } else {
                setBookings([]);
            }

            if (resourcesResult.status === 'fulfilled') {
                setResources(Array.isArray(resourcesResult.value) ? resourcesResult.value : []);
            } else {
                setResources([]);
            }

            const failed = results
                .filter((r) => r.status === 'rejected')
                .map((r) => r.reason?.message || 'Request failed');

            if (failed.length > 0) {
                setLoadError('Some dashboard data could not be loaded. Please refresh.');
            }
        } finally {
            if (requestSeqRef.current !== seq) return;
            setIsLoading(false);
        }
    }, [withTimeout]);

    React.useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const analytics = React.useMemo(() => {
        const normalizedRequests = requests.map((request) => ({
            ...request,
            normalizedStatus: normalizeIncidentStatus(request.status),
            normalizedPriority: normalizeIncidentPriority(request.priority),
        }));

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfWeek = new Date(startOfToday);
        endOfWeek.setDate(endOfWeek.getDate() + 7);

        const bookingStatusCounts = bookings.reduce((acc, booking) => {
            const key = String(booking.status || 'PENDING').toUpperCase();
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const bookingSegments = [
            { key: 'PENDING', label: 'Pending', value: bookingStatusCounts.PENDING || 0, color: 'bg-amber-500' },
            { key: 'APPROVED', label: 'Approved', value: bookingStatusCounts.APPROVED || 0, color: 'bg-emerald-500' },
            { key: 'REJECTED', label: 'Rejected', value: bookingStatusCounts.REJECTED || 0, color: 'bg-rose-500' },
            { key: 'CANCELLED', label: 'Cancelled', value: bookingStatusCounts.CANCELLED || 0, color: 'bg-slate-400' },
        ];

        const upcomingBookings = bookings
            .filter((booking) => String(booking.status || '').toUpperCase() === 'APPROVED')
            .filter((booking) => {
                const bookingDate = new Date(`${booking.date}T00:00:00`);
                return Number.isFinite(bookingDate.getTime()) && bookingDate >= startOfToday;
            })
            .sort((a, b) => new Date(`${a.date}T00:00:00`) - new Date(`${b.date}T00:00:00`));

        const activeBookings = upcomingBookings.filter((booking) => {
            const bookingDate = new Date(`${booking.date}T00:00:00`);
            return bookingDate <= endOfWeek;
        });

        const requestStatusCounts = {
            open: normalizedRequests.filter((request) => request.normalizedStatus === 'OPEN').length,
            inProgress: normalizedRequests.filter((request) => ['ASSIGNED', 'IN_PROGRESS'].includes(request.normalizedStatus)).length,
            resolved: normalizedRequests.filter((request) => request.normalizedStatus === 'RESOLVED').length,
            rejected: normalizedRequests.filter((request) => request.normalizedStatus === 'REJECTED').length,
        };

        const recentRequestUpdates = [...normalizedRequests]
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
            .slice(0, 4);

        const recentBookings = [...bookings]
            .sort((a, b) => new Date(b.createdAt || `${b.date}T00:00:00`) - new Date(a.createdAt || `${a.date}T00:00:00`))
            .slice(0, 4);

        const attentionItems = [
            ...normalizedRequests
                .filter((request) => request.normalizedStatus === 'REJECTED')
                .map((request) => ({
                    key: `request-rejected-${request.id}`,
                    type: 'Request',
                    title: request.title,
                    status: request.normalizedStatus,
                    when: request.updatedAt || request.createdAt,
                    to: '/maintenance',
                })),
            ...normalizedRequests
                .filter((request) => ['ASSIGNED', 'IN_PROGRESS'].includes(request.normalizedStatus))
                .slice(0, 3)
                .map((request) => ({
                    key: `request-active-${request.id}`,
                    type: 'Request',
                    title: request.title,
                    status: request.normalizedStatus,
                    when: request.updatedAt || request.createdAt,
                    to: '/maintenance',
                })),
            ...upcomingBookings
                .slice(0, 3)
                .map((booking) => ({
                    key: `booking-upcoming-${booking.id}`,
                    type: 'Booking',
                    title: booking.resourceName || 'Upcoming booking',
                    status: booking.status,
                    when: `${booking.date}T00:00:00`,
                    to: '/bookings/my',
                })),
        ]
            .sort((a, b) => new Date(b.when) - new Date(a.when))
            .slice(0, 6);

        const resourceTypeCounts = resources.reduce((acc, resource) => {
            const type = String(resource.type || 'OTHER').toUpperCase();
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
        const topResourceTypes = Object.entries(resourceTypeCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 4)
            .map(([type, count]) => ({
                key: type,
                label: type.replace(/_/g, ' '),
                value: count,
                color: 'bg-slate-400',
            }));

        return {
            requestTotal: normalizedRequests.length,
            requestStatusCounts,
            bookingTotal: bookings.length,
            activeBookings: activeBookings.length,
            upcomingBookings: upcomingBookings.length,
            pendingBookings: bookingStatusCounts.PENDING || 0,
            completedBookings: bookingStatusCounts.CANCELLED || 0,
            requestStatusSegments: buildStatusSegments(normalizedRequests.map((request) => ({ ...request, status: request.normalizedStatus }))),
            requestPrioritySegments: buildPrioritySegments(normalizedRequests.map((request) => ({ ...request, priority: request.normalizedPriority }))),
            bookingSegments,
            recentRequestUpdates,
            recentBookings,
            attentionItems,
            topResourceTypes,
        };
    }, [requests, bookings, resources]);

    const quickLinks = [
        { label: 'Submit New Incident Ticket', to: '/maintenance' },
        { label: 'View My Requests', to: '/maintenance' },
        { label: 'Book a Facility', to: '/bookings/new' },
        { label: 'View My Bookings', to: '/bookings/my' },
        { label: 'Explore Facilities', to: '/facilities' },
        { label: 'Recent Updates', to: '/maintenance' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Requester Dashboard</p>
                    <h3 className="text-2xl font-black tracking-tight text-slate-900">Your service activity at a glance</h3>
                    <p className="text-sm text-slate-500">Requests, bookings, and recent updates tied to your account.</p>
                </div>
                <button
                    onClick={loadDashboard}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {isLoading && (
                <div className="rounded-[28px] border border-slate-100 bg-white/50 backdrop-blur-sm p-12 text-center shadow-sm">
                    <RefreshCw size={30} className="mx-auto animate-spin text-blue-600" />
                    <p className="mt-4 text-sm font-bold text-slate-600 tracking-tight">Syncing your service activity...</p>
                </div>
            )}

            {!isLoading && loadError && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                    {loadError}
                </div>
            )}

            {!isLoading && (
                <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">

                <KpiCard icon={<FolderKanban size={18} />} label="Total Requests" value={analytics.requestTotal} accent="blue" />
                <KpiCard icon={<Clock3 size={18} />} label="Open Requests" value={analytics.requestStatusCounts.open} accent="amber" />
                <KpiCard icon={<Wrench size={18} />} label="In Progress Requests" value={analytics.requestStatusCounts.inProgress} accent="orange" />
                <KpiCard icon={<CheckCircle2 size={18} />} label="Resolved Requests" value={analytics.requestStatusCounts.resolved} accent="emerald" />
                <KpiCard icon={<AlertCircle size={18} />} label="Rejected Requests" value={analytics.requestStatusCounts.rejected} accent="rose" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard icon={<CalendarClock size={18} />} label="Active Bookings" value={analytics.activeBookings} accent="indigo" />
                <KpiCard icon={<CalendarClock size={18} />} label="Upcoming Bookings" value={analytics.upcomingBookings} accent="blue" />
                <KpiCard icon={<Clock3 size={18} />} label="Pending Booking Requests" value={analytics.pendingBookings} accent="amber" />
                <KpiCard icon={<CheckCircle2 size={18} />} label="Completed Bookings" value={analytics.completedBookings} accent="slate" />
            </div>

            <AnalyticsSection>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Quick Actions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {quickLinks.map((link) => (
                        <Link
                            key={link.label}
                            to={link.to}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </AnalyticsSection>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <SurfaceCard className="p-6 sm:p-7">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">Important Attention</h4>
                    {isLoading ? (
                        <p className="text-sm text-slate-400">Loading important items...</p>
                    ) : analytics.attentionItems.length === 0 ? (
                        <p className="text-sm text-slate-400">No urgent items right now.</p>
                    ) : (
                        <div className="space-y-3">
                            {analytics.attentionItems.map((item) => (
                                <div key={item.key} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate">{item.title}</p>
                                            <p className="text-[11px] font-medium text-slate-500">{item.type}</p>
                                        </div>
                                        <Link to={item.to} className="text-xs font-bold text-slate-700 hover:text-slate-900">Open</Link>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        {item.type === 'Request' ? (
                                            <StatusBadge status={item.status} />
                                        ) : (
                                            <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                                                {String(item.status || '').toUpperCase()}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-slate-400 font-semibold">{formatTime(item.when)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SurfaceCard>

                <SurfaceCard className="p-6 sm:p-7">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">Recent Activity</h4>
                    {isLoading ? (
                        <p className="text-sm text-slate-400">Loading recent activity...</p>
                    ) : (
                        <div className="space-y-3">
                            {analytics.recentRequestUpdates.slice(0, 3).map((request) => (
                                <div key={`recent-request-${request.id}`} className="rounded-xl border border-slate-100 bg-white px-4 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="text-sm font-bold text-slate-800 truncate">{request.title}</p>
                                        <Link to="/maintenance" className="text-xs font-bold text-blue-600">View</Link>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <StatusBadge status={request.normalizedStatus} />
                                        <PriorityBadge priority={request.priority} />
                                        <span className="text-[10px] font-semibold text-slate-400">{formatTime(request.updatedAt || request.createdAt)}</span>
                                    </div>
                                </div>
                            ))}
                            {analytics.recentBookings.slice(0, 3).map((booking) => (
                                <div key={`recent-booking-${booking.id}`} className="rounded-xl border border-slate-100 bg-white px-4 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="text-sm font-bold text-slate-800 truncate">{booking.resourceName || 'Booking'}</p>
                                        <Link to="/bookings/my" className="text-xs font-bold text-blue-600">View</Link>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                                            {String(booking.status || 'PENDING').toUpperCase()}
                                        </span>
                                        <span className="text-[10px] font-semibold text-slate-400">{formatBookingDate(booking.date)}</span>
                                    </div>
                                </div>
                            ))}
                            {analytics.recentRequestUpdates.length === 0 && analytics.recentBookings.length === 0 && (
                                <p className="text-sm text-slate-400">No recent activity.</p>
                            )}
                        </div>
                    )}
                </SurfaceCard>
            </div>

            <AnalyticsSection>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <DistributionBar title="Requests by Status" segments={analytics.requestStatusSegments} />
                    <DistributionBar title="Requests by Priority" segments={analytics.requestPrioritySegments} />
                </div>
            </AnalyticsSection>

            <AnalyticsSection>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <DistributionBar title="Bookings by Status" segments={analytics.bookingSegments} />
                    <DistributionBar title="Resource Types Available" segments={analytics.topResourceTypes} />
                </div>
            </AnalyticsSection>
                </>
            )}
        </div>
    );
};

const TechnicianDashboard = () => {
    const [tickets, setTickets] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const loadTickets = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/technician/tickets');
            setTickets(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            setTickets([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    const analytics = React.useMemo(() => {
        const normalized = tickets.map((ticket) => ({
            ...ticket,
            normalizedStatus: normalizeIncidentStatus(ticket.status),
            normalizedPriority: normalizeIncidentPriority(ticket.priority),
        }));

        const highPrioritySet = new Set(['HIGH', 'EMERGENCY']);
        const total = normalized.length;
        const openNotStarted = normalized.filter((ticket) => ['OPEN', 'ASSIGNED'].includes(ticket.normalizedStatus)).length;
        const inProgress = normalized.filter((ticket) => ticket.normalizedStatus === 'IN_PROGRESS').length;
        const resolved = normalized.filter((ticket) => ticket.normalizedStatus === 'RESOLVED').length;
        const highPriority = normalized.filter((ticket) => highPrioritySet.has(ticket.normalizedPriority)).length;

        const statusSegments = buildStatusSegments(normalized.map((ticket) => ({
            ...ticket,
            status: ticket.normalizedStatus,
        })));
        const prioritySegments = buildPrioritySegments(normalized.map((ticket) => ({
            ...ticket,
            priority: ticket.normalizedPriority,
        })));

        const recentTickets = [...normalized]
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
            .slice(0, 6);

        const needingAttention = [...normalized]
            .filter((ticket) => ['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(ticket.normalizedStatus))
            .filter((ticket) => highPrioritySet.has(ticket.normalizedPriority))
            .sort((a, b) => new Date(a.updatedAt || a.createdAt) - new Date(b.updatedAt || b.createdAt))
            .slice(0, 6);

        return {
            total,
            openNotStarted,
            inProgress,
            resolved,
            highPriority,
            statusSegments,
            prioritySegments,
            recentTickets,
            needingAttention,
        };
    }, [tickets]);

    const quickLinks = [
        { label: 'Not Yet Started', helper: 'Open and assigned queue', to: '/tech/tasks?tab=tickets&focus=not-started', icon: <FolderKanban size={16} /> },
        { label: 'In Progress', helper: 'Continue active work', to: '/tech/tasks?tab=tickets&focus=in-progress', icon: <Wrench size={16} /> },
        { label: 'High / Urgent', helper: 'Priority response tickets', to: '/tech/tasks?tab=tickets&focus=high-priority', icon: <AlertCircle size={16} /> },
        { label: 'Recently Updated', helper: 'Latest activity first', to: '/tech/tasks?tab=tickets&focus=recent', icon: <Clock3 size={16} /> },
    ];

    const completionPct = analytics.total > 0
        ? Math.round((analytics.resolved / analytics.total) * 100)
        : 0;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500">Technician Dashboard</p>
                    <h3 className="text-2xl font-black tracking-tight text-slate-900">Your workload snapshot</h3>
                    <p className="text-sm text-slate-500">Live overview of tickets currently assigned to you.</p>
                </div>
                <button
                    onClick={loadTickets}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {isLoading && (
                <div className="rounded-[28px] border border-blue-50 bg-white/50 backdrop-blur-sm p-12 text-center shadow-sm">
                    <RefreshCw size={30} className="mx-auto animate-spin text-indigo-600" />
                    <p className="mt-4 text-sm font-bold text-slate-600 tracking-tight">Loading your assigned tickets...</p>
                </div>
            )}

            {!isLoading && (
                <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">

                <KpiCard icon={<FolderKanban size={18} />} label="Total Assigned Tickets" value={analytics.total} accent="blue" />
                <KpiCard icon={<Clock3 size={18} />} label="Open / Not Started" value={analytics.openNotStarted} accent="amber" />
                <KpiCard icon={<Wrench size={18} />} label="In Progress" value={analytics.inProgress} accent="orange" />
                <KpiCard icon={<CheckCircle2 size={18} />} label="Resolved" value={analytics.resolved} accent="emerald" />
                <KpiCard icon={<AlertCircle size={18} />} label="High Priority" value={analytics.highPriority} accent="rose" />
            </div>

            <AnalyticsSection>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Quick Access</h4>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4 sm:p-5 xl:col-span-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-500">Work Pulse</p>
                        <div className="mt-3 flex items-center gap-4">
                            <div className="relative h-16 w-16 rounded-full bg-slate-100">
                                <div
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        background: `conic-gradient(#4f46e5 ${completionPct * 3.6}deg, #e2e8f0 0deg)`,
                                    }}
                                />
                                <div className="absolute inset-[7px] rounded-full bg-white flex items-center justify-center">
                                    <span className="text-xs font-black text-indigo-700">{completionPct}%</span>
                                </div>
                            </div>
                            <div className="text-xs space-y-1">
                                <p className="font-semibold text-slate-700">Resolved progress</p>
                                <p className="text-slate-500">{analytics.resolved} of {analytics.total} tickets resolved</p>
                                <p className="text-rose-600 font-semibold">{analytics.highPriority} high/urgent active alerts</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:col-span-2">
                    {quickLinks.map((link) => (
                        <Link
                            key={link.label}
                            to={link.to}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
                        >
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                {link.icon}
                                {link.label}
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500 font-medium">{link.helper}</p>
                        </Link>
                    ))}
                    </div>
                </div>
            </AnalyticsSection>

            <AnalyticsSection>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <DistributionBar title="Workload by Status" segments={analytics.statusSegments} />
                    <DistributionBar title="Workload by Priority" segments={analytics.prioritySegments} />
                </div>
            </AnalyticsSection>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <SurfaceCard className="p-6 sm:p-7">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">Recent Assigned / Activity</h4>
                    {isLoading ? (
                        <p className="text-sm text-slate-400">Loading recent tickets...</p>
                    ) : analytics.recentTickets.length === 0 ? (
                        <p className="text-sm text-slate-400">No recent updates.</p>
                    ) : (
                        <div className="space-y-3">
                            {analytics.recentTickets.map((ticket) => (
                                <div key={ticket.id} className="rounded-xl border border-slate-100 bg-white px-4 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate">{ticket.title}</p>
                                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{ticket.ticketId || 'No ticket ID'}</p>
                                        </div>
                                        <Link to={`/tech/tasks?tab=tickets&focus=all`} className="text-xs font-bold text-blue-600 hover:text-blue-700">
                                            Open
                                        </Link>
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <StatusBadge status={ticket.normalizedStatus} />
                                        <PriorityBadge priority={ticket.priority} />
                                        <span className="text-[10px] font-semibold text-slate-400">{formatTime(ticket.updatedAt || ticket.createdAt)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SurfaceCard>

                <SurfaceCard className="p-6 sm:p-7">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">Tickets Requiring Attention</h4>
                    {isLoading ? (
                        <p className="text-sm text-slate-400">Loading high-priority unresolved tickets...</p>
                    ) : analytics.needingAttention.length === 0 ? (
                        <p className="text-sm text-slate-400">No high or urgent unresolved tickets.</p>
                    ) : (
                        <div className="space-y-3">
                            {analytics.needingAttention.map((ticket) => (
                                <div key={ticket.id} className="rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="text-sm font-bold text-slate-800 truncate">{ticket.title}</p>
                                        <Link to={`/tech/tasks?tab=tickets&focus=all`} className="text-xs font-bold text-amber-700 hover:text-amber-800">
                                            View
                                        </Link>
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <StatusBadge status={ticket.normalizedStatus} />
                                        <PriorityBadge priority={ticket.priority} />
                                        <span className="text-[10px] font-semibold text-slate-500">Last update: {formatTime(ticket.updatedAt || ticket.createdAt)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SurfaceCard>
            </div>
                </>
            )}
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const isTechnician = user?.role === 'TECHNICIAN';
    const isRequester = user?.role === 'USER';
    const firstName = String(user?.name || user?.email || user?.sub || 'there')
        .trim()
        .split(' ')[0]
        .split('@')[0];

    return (
        <Layout>
            <div className="space-y-8 animate-fade-in text-slate-900">
                {/* Admin Setup Notice */}
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-4 shadow-sm">
                    <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-600/20">
                        <ShieldCheck size={20} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-blue-900 leading-snug">Initial System Setup Requirement</p>
                        <p className="text-xs text-blue-700/80 mt-1 leading-relaxed font-medium">
                            The first admin user must have their role manually changed in the database. Once this initial admin role is set, that admin will be able to log into the system and manage the application, including changing roles of other users through the admin dashboard.
                        </p>
                    </div>
                </div>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-extrabold tracking-tight">
                            Welcome, <span className="text-primary">{firstName}</span>
                        </h2>
                        <p className="text-slate-500 font-medium mt-1">Here is your campus operations overview.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-bold uppercase tracking-wider border border-emerald-100 flex items-center gap-2 shadow-sm">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                            System Live
                        </div>
                    </div>
                </div>

                {isAdmin && <AdminOverviewDashboard />}
                {isTechnician && <TechnicianDashboard />}
                {isRequester && <RequesterDashboard />}
            </div>
        </Layout>
    );
};

export default Dashboard;
