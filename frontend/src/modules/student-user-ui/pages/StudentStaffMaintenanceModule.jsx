import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  AlertCircle,
  Bell,
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Wrench,
  Type,
  MapPin,
  AlertTriangle,
  Camera,
  BarChart3,
  TrendingUp,
  Layers,
  Clock,
} from 'lucide-react';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';
import EmptyState from '../components/EmptyState';
import SectionHeader from '../components/SectionHeader';
import SummaryCard from '../components/SummaryCard';
import RequestForm from '../components/RequestForm';
import NotificationList from '../components/NotificationList';
import RequestList from '../components/RequestList';
import RequestDetailsPanel from '../components/RequestDetailsPanel';
import SkeletonBlock from '../components/SkeletonBlock';
import SurfaceCard from '../components/SurfaceCard';
import { formatIncidentStatusLabel, normalizeIncidentStatus } from '../components/StatusBadge';
import TabNavigation from '../components/TabNavigation';
import ToastStack from '../components/ToastStack';
import { useStudentMaintenanceDashboard } from '../hooks/useStudentMaintenanceDashboard';
import {
  DistributionBar, MiniBarChart, InsightList, AnalyticsSection,
  buildStatusSegments, buildPrioritySegments, getDayOfWeekBars,
} from '../../maintenance/components/DashboardAnalytics';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getDisplayName = (user) => {
  const subject = user?.name || user?.sub || user?.email || 'there';
  return String(subject).split('@')[0];
};

const StudentStaffMaintenanceModule = () => {
  const { user } = useAuth();
  const formRef = useRef(null);
  const detailsRef = useRef(null);
  const [filters, setFilters] = useState({ query: '', status: 'ALL' });
  const [activeTab, setActiveTab] = useState('overview');

  const {
    summary,
    requests,
    resources,
    isResourcesLoading,
    notifications,
    selectedRequest,
    selectedRequestId,
    setSelectedRequestId,
    formValues,
    formErrors,
    updateField,
    submitRequest,
    handleAddComment,
    handleEditComment,
    handleDeleteComment,
    hasRequests,
    isBootstrapping,
    isRefreshing,
    isSubmitting,
    isDetailLoading,
    pageError,
    submitMessage,
    submitError,
    toasts,
    cancelRequest,
    isCancelling,
    refreshDashboard,
    loadResources,
    clearSubmitStatus,
  } = useStudentMaintenanceDashboard();
  const styleRef = useRef(null);

  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.textContent = `
      @keyframes aurora-wave {
        0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
        50% { transform: translateY(-20px) rotate(1deg) scale(1.03); }
      }
      @keyframes aurora-pulse {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.15); }
      }
    `;
    document.head.appendChild(styleEl);
    styleRef.current = styleEl;
    return () => document.head.removeChild(styleEl);
  }, []);

  useEffect(() => {
    if (activeTab !== 'new-request') {
      clearSubmitStatus();
    }
  }, [activeTab, clearSubmitStatus]);

  useEffect(() => {
    if (activeTab === 'new-request' && resources.length === 0) {
      loadResources();
    }
  }, [activeTab, resources.length, loadResources]);

  useEffect(() => {
    if (selectedRequestId && detailsRef.current) {
        detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedRequestId]);

  const filteredRequests = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return [...requests].filter((request) => {
      const matchesQuery =
        !query ||
        request.title?.toLowerCase().includes(query) ||
        request.location?.toLowerCase().includes(query) ||
        request.category?.toLowerCase().includes(query);

      const normalizedStatus = normalizeIncidentStatus(request.status);
      const matchesStatus = filters.status === 'ALL' || normalizedStatus === filters.status;
      return matchesQuery && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [filters, requests]);

  const recentActivity = useMemo(() => {
    return [...requests]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 3);
  }, [requests]);

  /* ─── Analytics Computations for Overview tab ─── */
  const overviewAnalytics = useMemo(() => {
    const statusSegments = buildStatusSegments(requests);
    const requesterPriorityTickets = requests.map((request) => ({
      ...request,
      // Requester view requirement: treat HIGH as Emergency in priority distribution.
      priority: String(request.priority || '').toUpperCase() === 'HIGH' ? 'EMERGENCY' : request.priority,
    }));
    const prioritySegments = buildPrioritySegments(requesterPriorityTickets);
    const dayBars = getDayOfWeekBars(requests);

    const recentRequests = [...requests]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(r => ({
        key: r.id,
        label: r.title,
        sublabel: r.location || '',
        value: formatIncidentStatusLabel(r.status),
      }));

    const latestUpdates = [...requests]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 5)
      .map(r => ({
        key: r.id,
        label: r.title,
        sublabel: r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : '',
        value: formatIncidentStatusLabel(r.status),
      }));

    return { statusSegments, prioritySegments, dayBars, recentRequests, latestUpdates };
  }, [requests]);


  const displaySummary = useMemo(() => {
    const totalSubmitted = requests.length;
    const pending = requests.filter((request) => normalizeIncidentStatus(request.status) === 'OPEN').length;
    const inProgress = requests.filter((request) => ['IN_PROGRESS', 'ASSIGNED'].includes(normalizeIncidentStatus(request.status))).length;
    const completed = requests.filter((request) =>
      ['RESOLVED', 'CLOSED'].includes(normalizeIncidentStatus(request.status))
    ).length;
    const rejected = requests.filter((request) => normalizeIncidentStatus(request.status) === 'REJECTED').length;

    return {
      ...summary,
      totalSubmitted,
      pending,
      inProgress,
      completed,
      rejected,
    };
  }, [requests, summary]);

  const handleNewRequest = () => {
    setActiveTab('new-request');
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'new-request', label: 'New Request', icon: <FilePlus2 size={16} /> },
    { id: 'my-requests', label: 'My Requests', icon: <ClipboardList size={16} /> },
    { id: 'updates', label: 'Updates', icon: <Bell size={16} /> },
  ];

  return (
    <Layout>
      <ToastStack toasts={toasts} />

      <div className="space-y-8 text-slate-800 relative min-h-screen -m-8 p-8 overflow-hidden bg-slate-50">
        {/* Epic Background Elements */}
        <div className="absolute top-[-10%] right-[-5%] w-[55%] h-[50%] bg-blue-500/15 rounded-full blur-[140px] pointer-events-none animate-[aurora-wave_12s_ease-in-out_infinite]" />
        <div className="absolute top-[20%] left-[-10%] w-[45%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-[aurora-pulse_10s_ease-in-out_infinite]" />

        <div className="relative z-10 w-full sm:p-9 p-7 rounded-[32px] border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-gradient-to-br from-white/90 to-blue-50/50">
          <SectionHeader
            eyebrow="Student and Staff Portal"
            icon={<ShieldCheck size={14} className="text-blue-600" />}
            title={<strong className="text-slate-900 drop-shadow-sm">{getGreeting()}, {getDisplayName(user)}.</strong>}
            description="Submit campus incidents, monitor maintenance progress, and stay updated through one clean dashboard designed for everyday university use."
            actions={
              <button
                type="button"
                onClick={refreshDashboard}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700"
              >
                {isRefreshing ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                Refresh data
              </button>
            }
          />

          <div className="mt-8">
            <div className="rounded-[26px] border border-white/80 bg-white/80 p-5 shadow-sm">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                Incident ticketing and maintenance dashboard
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Follow a simple flow: submit a request, track status changes, and review updates from the facilities team without unnecessary clutter.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          {pageError && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700 mb-6">
              <AlertCircle className="mt-0.5 shrink-0" size={18} />
              <span>{pageError}</span>
            </div>
          )}

          {!isBootstrapping && (
            <TabNavigation tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          )}
        </div>

        {isBootstrapping ? (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <SurfaceCard key={index} className="p-6">
                  <SkeletonBlock className="h-7 w-28" />
                  <SkeletonBlock className="mt-5 h-10 w-20" />
                  <SkeletonBlock className="mt-4 h-4 w-40" />
                </SurfaceCard>
              ))}
            </section>

            <div className="grid grid-cols-1 gap-8 2xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
              <SurfaceCard className="p-8">
                <div className="space-y-4">
                  <SkeletonBlock className="h-7 w-56" />
                  <SkeletonBlock className="h-4 w-full max-w-xl" />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <SkeletonBlock className="h-14 w-full" />
                    <SkeletonBlock className="h-14 w-full" />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <SkeletonBlock className="h-14 w-full" />
                    <SkeletonBlock className="h-14 w-full" />
                  </div>
                  <SkeletonBlock className="h-40 w-full" />
                </div>
              </SurfaceCard>

              <SurfaceCard className="p-8" tone="muted">
                <div className="space-y-4">
                  <SkeletonBlock className="h-7 w-40" />
                  <SkeletonBlock className="h-24 w-full" />
                  <SkeletonBlock className="h-24 w-full" />
                </div>
              </SurfaceCard>
            </div>
          </>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-8 relative z-10">
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  <SummaryCard
                    label="Total requests"
                    value={displaySummary.totalSubmitted}
                    hint="All issues you have submitted"
                    accentClass="bg-slate-100 text-slate-700"
                  />
                  <SummaryCard
                    label="Pending"
                    value={displaySummary.pending}
                    hint="Waiting for approval or review"
                    accentClass="bg-amber-50 text-amber-700"
                  />
                  <SummaryCard
                    label="In Progress"
                    value={displaySummary.inProgress}
                    hint="Currently being worked on"
                    accentClass="bg-indigo-50 text-indigo-700"
                  />
                  <SummaryCard
                    label="Completed"
                    value={displaySummary.completed}
                    hint="Resolved requests"
                    accentClass="bg-emerald-50 text-emerald-700"
                  />
                  <SummaryCard
                    label="Rejected"
                    value={displaySummary.rejected}
                    hint="Tickets not approved"
                    accentClass="bg-rose-50 text-rose-700"
                  />
                </section>

                <SurfaceCard className="p-6 sm:p-7">
                  <SectionHeader
                    eyebrow="Start Here"
                    icon={<FilePlus2 size={14} />}
                    title="Your workflow at a glance"
                    description="Submit a request, track progress from the request list, and review updates as technicians and administrators respond."
                  />

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {[
                      {
                        step: '1',
                        title: 'Submit',
                        description: 'Create a clear incident or maintenance ticket with the exact location and issue details.',
                      },
                      {
                        step: '2',
                        title: 'Track',
                        description: 'Monitor progress through pending, approved, in progress, and completed stages.',
                      },
                      {
                        step: '3',
                        title: 'Review updates',
                        description: 'Check notifications, recent movement, and request details for the latest context.',
                      },
                    ].map((item) => (
                      <div key={item.step} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                          {item.step}
                        </span>
                        <h3 className="mt-4 text-lg font-bold text-slate-900">{item.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </SurfaceCard>

                {/* Analytics Insights */}
                <AnalyticsSection>
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 size={16} className="text-slate-400" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Request Distribution</h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <DistributionBar title="My Requests by Status" segments={overviewAnalytics.statusSegments} />
                    <DistributionBar title="My Requests by Priority" segments={overviewAnalytics.prioritySegments} />
                  </div>
                </AnalyticsSection>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <AnalyticsSection>
                    <div className="flex items-center gap-2 mb-2">
                      <Layers size={16} className="text-slate-400" />
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Recent Requests</h3>
                    </div>
                    <InsightList
                      title="Last 5 Submissions"
                      items={overviewAnalytics.recentRequests}
                      emptyMessage="No requests submitted yet"
                    />
                  </AnalyticsSection>

                  <AnalyticsSection>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-slate-400" />
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Latest Updates</h3>
                    </div>
                    <InsightList
                      title="Most Recently Changed"
                      items={overviewAnalytics.latestUpdates}
                      emptyMessage="No updates yet"
                    />
                  </AnalyticsSection>

                  <AnalyticsSection>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={16} className="text-slate-400" />
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Submission Trends</h3>
                    </div>
                    <MiniBarChart
                      title="Requests by Day of Week"
                      bars={overviewAnalytics.dayBars}
                      emptyMessage="Not enough data for trends"
                    />
                  </AnalyticsSection>
                </div>
              </div>
            )}

            {activeTab === 'new-request' && (
              <div className="mx-auto max-w-[1000px] relative z-10">
                <div ref={formRef} className="bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/60">
                  <RequestForm
                    values={formValues}
                    errors={formErrors}
                    resources={resources}
                    isResourcesLoading={isResourcesLoading}
                    onChange={updateField}
                    onSubmit={submitRequest}
                    isSubmitting={isSubmitting}
                    submitMessage={submitMessage}
                    submitError={submitError}
                  />
                </div>
              </div>
            )}

            {activeTab === 'my-requests' && (
              <div className="grid grid-cols-1 gap-8 2xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)] relative z-10">
                <div className="bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/60">
                  <RequestList
                  requests={filteredRequests}
                  selectedRequestId={selectedRequestId}
                  onSelect={setSelectedRequestId}
                  isLoading={false}
                  filters={filters}
                  setFilters={setFilters}
                  onNewRequest={handleNewRequest}
                  onRefresh={refreshDashboard}
                  isRefreshing={isRefreshing}
                />
                </div>

                <div ref={detailsRef} className="bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/60">
                  <RequestDetailsPanel 
                    request={selectedRequest} 
                    isLoading={isDetailLoading} 
                    onCancel={() => cancelRequest(selectedRequestId)}
                    isCancelling={isCancelling}
                    onAddComment={handleAddComment}
                    onEditComment={handleEditComment}
                    onDeleteComment={handleDeleteComment}
                  />
                </div>
              </div>
            )}

            {activeTab === 'updates' && (
              <div className={`grid grid-cols-1 gap-8 ${notifications.length > 0 ? '2xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)]' : ''} relative z-10`}>
                <NotificationList notifications={notifications} isLoading={false} />

                <SurfaceCard className="p-6 sm:p-7" tone="muted">
                  <SectionHeader
                    eyebrow="Recent Activity"
                    icon={<RefreshCw size={14} />}
                    title="Latest request movement"
                    description="Use this tab to stay updated on the tickets that changed most recently."
                  />

                  {recentActivity.length === 0 ? (
                    <div className="mt-6">
                      <EmptyState
                        compact
                        icon={<Wrench size={20} />}
                        title="No activity yet"
                        description="Activity appears here once your tickets begin moving through the workflow."
                      />
                    </div>
                  ) : (
                    <div className="mt-6 space-y-3">
                      {recentActivity.map((request) => (
                        <button
                          key={request.id}
                          type="button"
                          onClick={() => {
                            setSelectedRequestId(request.id);
                            setActiveTab('my-requests');
                          }}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800">{request.title}</p>
                              <p className="mt-1 text-sm text-slate-500">{request.location}</p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              {formatIncidentStatusLabel(request.status)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </SurfaceCard>
              </div>
            )}

            {!hasRequests && (
              <EmptyState
                icon={<Wrench size={22} />}
                title="Start by submitting your first request"
                description="Once you submit an incident or maintenance ticket, your request list, details panel, and updates will all appear here from the live backend APIs."
              />
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default StudentStaffMaintenanceModule;
