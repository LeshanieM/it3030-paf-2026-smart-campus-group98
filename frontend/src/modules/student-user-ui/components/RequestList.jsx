import React from 'react';
import { Calendar, ClipboardList, Loader2, MapPin, Search, Filter, Plus, RefreshCw } from 'lucide-react';
import EmptyState from './EmptyState';
import SectionHeader from './SectionHeader';
import StatusBadge, { INCIDENT_STATUS_OPTIONS, PriorityBadge } from './StatusBadge';
import SurfaceCard from './SurfaceCard';
import { formatDateTime } from '../../maintenance/utils/dateTime';

const RequestList = ({ requests, selectedRequestId, onSelect, isLoading, filters, setFilters, onNewRequest, onRefresh, isRefreshing }) => {
  return (
    <SurfaceCard className="p-6 sm:p-7">
      <SectionHeader
        eyebrow="Your Tickets"
        icon={<ClipboardList size={14} />}
        title="Submitted requests"
        description="Choose a ticket to review its full details, current status, and technician updates."
      />

      <div className="mt-8 flex flex-col xl:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={filters.query}
            onChange={(e) => setFilters(c => ({...c, query: e.target.value}))}
            placeholder="Search tickets..."
            className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition"
          />
        </div>
        
        <div className="relative w-full xl:w-48 shrink-0">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            value={filters.status}
            onChange={(e) => setFilters(c => ({...c, status: e.target.value}))}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-3 pl-10 pr-10 text-sm font-medium text-slate-800 appearance-none focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition cursor-pointer"
          >
            <option value="ALL">All statuses</option>
            {INCIDENT_STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>

        <div className="flex w-full xl:w-auto items-center gap-3 shrink-0">
          <button 
            type="button" 
            onClick={onRefresh}
            className="flex flex-1 xl:flex-none items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 shadow-sm"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
            <span className="xl:hidden">Refresh</span>
          </button>
          
          <button
            type="button"
            onClick={onNewRequest}
            className="flex flex-1 xl:flex-none items-center justify-center gap-1.5 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            <Plus size={18} />
            <span>New Ticket</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
          <Loader2 className="animate-spin" size={18} />
          <span>Loading your requests...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            compact
            icon={<ClipboardList size={20} />}
            title="No tickets submitted yet"
            description="Start by submitting your first request and it will appear here for tracking."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {requests.map((request) => {
            const isActive = selectedRequestId === request.id;

            return (
              <button
                key={request.id}
                type="button"
                onClick={() => onSelect(request.id)}
                className={`group w-full rounded-[26px] border p-5 text-left transition duration-200 ${
                  isActive
                    ? 'border-blue-200 bg-blue-50/70 shadow-[0_12px_28px_rgba(59,130,246,0.08)]'
                    : 'border-slate-200 bg-slate-50 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.05)]'
                }`}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="text-lg font-bold text-slate-900">{request.title}</h4>
                      <StatusBadge status={request.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-600">
                        {request.category}
                      </span>
                      <PriorityBadge priority={request.priority} />
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-medium text-slate-600">
                        <MapPin size={14} />
                        {request.location}{request.room ? ` (${request.room})` : ''}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{request.description}</p>
                  </div>
                  <div className="shrink-0 text-sm text-slate-400 transition group-hover:text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={14} />
                      Submitted {formatDateTime(request.createdAt)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </SurfaceCard>
  );
};

export default RequestList;
