import React from 'react';
import { ClipboardPlus, Filter, RefreshCw } from 'lucide-react';
import SurfaceCard from './SurfaceCard';

const QuickActions = ({ onNewRequest, onRefresh, isRefreshing, filters, setFilters }) => {
  return (
    <SurfaceCard className="min-w-0 p-5 sm:p-6" tone="muted">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          <Filter size={14} />
          Quick Actions
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <button
            type="button"
            onClick={onNewRequest}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700"
          >
            <ClipboardPlus size={18} />
            New Request
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700"
          >
            <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={18} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <label className="min-w-0 space-y-2">
            <span className="text-sm font-semibold text-slate-700">Search requests</span>
            <input
              value={filters.query}
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
              placeholder="Search by title, location, or category"
              className="block w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            />
          </label>

          <label className="min-w-0 space-y-2">
            <span className="text-sm font-semibold text-slate-700">Status filter</span>
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              className="block w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </label>
        </div>
      </div>
    </SurfaceCard>
  );
};

export default QuickActions;
