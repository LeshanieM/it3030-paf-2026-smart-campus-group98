import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '../../components/Layout';
import BookingTable from '../../components/bookings/BookingTable';
import BookingDetailModal from '../../components/bookings/BookingDetailModal';
import RejectReasonModal from '../../components/bookings/RejectReasonModal';
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge';
import { bookingService } from '../../services/bookingService';
import {
  Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, AlertCircle, Loader2, LayoutList, CalendarDays,
  Users2, Clock, Inbox, CheckCircle, XCircle, X
} from 'lucide-react';

const PAGE_SIZE = 10;

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onDismiss }) => {
  useEffect(() => { const t = setTimeout(onDismiss, 4500); return () => clearTimeout(t); }, [onDismiss]);
  return (
    <div className={`fixed top-8 right-8 z-[100] flex items-center gap-4 px-6 py-4 rounded-[1.25rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border backdrop-blur-xl animate-slide-in-right max-w-sm
      ${type === 'success' 
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' 
        : 'bg-rose-500/10 border-rose-500/20 text-rose-700'}`}>
      
      <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0
        ${type === 'success' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'}`}>
        {type === 'success' ? <CheckCircle2 size={20} strokeWidth={3} /> : <AlertCircle size={20} strokeWidth={3} />}
      </div>
      
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-0.5">
          {type === 'success' ? 'Success' : 'Attention'}
        </span>
        <span className="text-sm font-bold leading-tight">{message}</span>
      </div>
      
      <button onClick={onDismiss} className="ml-2 opacity-30 hover:opacity-100 transition-opacity">
        <X size={16} />
      </button>
    </div>
  );
};

// ── Approve confirm dialog ─────────────────────────────────────────────────────
const ApproveConfirmModal = ({ booking, onConfirm, onClose, isLoading }) => {
  if (!booking) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm animate-fade-in">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle size={20} className="text-emerald-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Approve Booking</h3>
              <p className="text-xs text-slate-400">This will notify the requester</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm space-y-1 mb-6">
            <div className="font-semibold text-slate-700">{booking.resourceName}</div>
            <div className="text-slate-400 text-xs">{booking.date} · {booking.startTime} – {booking.endTime}</div>
            {booking.createdBy && <div className="text-slate-400 text-xs">By: {booking.createdBy}</div>}
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} disabled={isLoading} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50">
              Cancel
            </button>
            <button onClick={() => onConfirm(booking.id)} disabled={isLoading} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-sm shadow-emerald-500/20 transition-all disabled:opacity-50">
              {isLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Skeleton rows ──────────────────────────────────────────────────────────────
const SkeletonRows = () => (
  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
    <div className="h-12 bg-slate-50 border-b border-slate-50" />
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex gap-4 px-5 py-4 border-b border-slate-50">
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-slate-100 rounded w-1/3" />
          <div className="h-2.5 bg-slate-50 rounded w-1/4" />
        </div>
        <div className="h-3 bg-slate-100 rounded w-20 self-center" />
        <div className="h-3 bg-slate-100 rounded w-24 self-center" />
        <div className="h-5 bg-slate-100 rounded-full w-16 self-center" />
      </div>
    ))}
  </div>
);

// ── Stat card ──────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className={`flex items-center gap-4 bg-white rounded-2xl border p-5 shadow-sm ${color}`}>
    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/60 backdrop-blur-sm shrink-0">
      <Icon size={20} />
    </div>
    <div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</div>
    </div>
  </div>
);

const STATUS_OPTIONS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingActionId, setLoadingActionId] = useState(null);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);

  const [detailTarget, setDetailTarget] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const [toast, setToast] = useState(null);

  const getStatusCode = (err) => err?.response?.status;

  const getErrorMessageForStatus = (status, fallback) => {
    switch (status) {
      case 403:
        return 'Access denied. Admin permission is required.';
      case 500:
        return 'Server error. Please try again in a moment.';
      default:
        return fallback;
    }
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bookingService.getAllBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      const status = getStatusCode(error);
      setToast({ message: getErrorMessageForStatus(status, 'Failed to load bookings.'), type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchText, statusFilter, dateFilter]);

  // ── Derived filtered list ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
      const q = searchText.toLowerCase();
      const matchesSearch =
        !q ||
        b.resourceName?.toLowerCase().includes(q) ||
        b.createdBy?.toLowerCase().includes(q) ||
        b.purpose?.toLowerCase().includes(q);
      const matchesDate = !dateFilter || b.date === dateFilter;
      return matchesStatus && matchesSearch && matchesDate;
    });
  }, [bookings, statusFilter, searchText, dateFilter]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'PENDING').length,
    approved: bookings.filter((b) => b.status === 'APPROVED').length,
    rejected: bookings.filter((b) => b.status === 'REJECTED').length,
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    setLoadingActionId(id);
    try {
      await bookingService.approveBooking(id);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'APPROVED' } : b));
      setToast({ message: 'Booking approved successfully.', type: 'success' });
      setApproveTarget(null);
    } catch (error) {
      const status = getStatusCode(error);
      setToast({ message: getErrorMessageForStatus(status, 'Failed to approve booking.'), type: 'error' });
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleReject = async (id, reason) => {
    setLoadingActionId(id);
    try {
      await bookingService.rejectBooking(id, reason);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'REJECTED', rejectionReason: reason } : b));
      setToast({ message: 'Booking rejected.', type: 'success' });
      setRejectTarget(null);
    } catch (error) {
      const status = getStatusCode(error);
      setToast({ message: getErrorMessageForStatus(status, 'Failed to reject booking.'), type: 'error' });
    } finally {
      setLoadingActionId(null);
    }
  };

  return (
    <Layout>
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}

      {detailTarget && <BookingDetailModal booking={detailTarget} onClose={() => setDetailTarget(null)} />}
      {approveTarget && (
        <ApproveConfirmModal
          booking={approveTarget}
          onClose={() => setApproveTarget(null)}
          onConfirm={handleApprove}
          isLoading={loadingActionId === approveTarget?.id}
        />
      )}
      {rejectTarget && (
        <RejectReasonModal
          booking={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
          isLoading={loadingActionId === rejectTarget?.id}
        />
      )}

      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Booking Management</h1>
            <p className="text-slate-500 mt-1 text-sm">Review, approve, or reject all campus resource bookings.</p>
          </div>
          <button
            onClick={fetchBookings}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total" value={stats.total} icon={LayoutList} color="border-slate-100 text-slate-700" />
          <StatCard label="Pending" value={stats.pending} icon={Clock} color="border-amber-100 text-amber-700 bg-amber-50/50" />
          <StatCard label="Approved" value={stats.approved} icon={CheckCircle} color="border-emerald-100 text-emerald-700 bg-emerald-50/50" />
          <StatCard label="Rejected" value={stats.rejected} icon={XCircle} color="border-rose-100 text-rose-700 bg-rose-50/50" />
        </div>

        {/* Filters bar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by resource, user, or purpose…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
              />
            </div>

            {/* Status filter */}
            <div className="relative">
              <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-8 pr-8 py-2.5 text-sm bg-slate-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all appearance-none font-medium text-slate-600"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>
                ))}
              </select>
            </div>

            {/* Date filter */}
            <div className="relative">
              <CalendarDays size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-8 pr-4 py-2.5 text-sm bg-slate-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all text-slate-600"
              />
            </div>

            {/* Clear filters */}
            {(searchText || statusFilter !== 'ALL' || dateFilter) && (
              <button
                onClick={() => { setSearchText(''); setStatusFilter('ALL'); setDateFilter(''); }}
                className="text-xs font-semibold text-rose-500 hover:text-rose-700 px-3 py-2.5 rounded-xl hover:bg-rose-50 transition-all whitespace-nowrap"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Result count */}
          <p className="text-xs text-slate-400 mt-3 ml-1">
            Showing <strong className="text-slate-600">{filtered.length}</strong> of <strong className="text-slate-600">{bookings.length}</strong> bookings
          </p>
        </div>

        {/* Table */}
        {loading ? (
          <SkeletonRows />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center bg-white rounded-2xl border border-slate-100">
            <Inbox size={36} className="text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-500 mb-1">No bookings found</h3>
            <p className="text-sm text-slate-400">Try adjusting your filters.</p>
          </div>
        ) : (
          <BookingTable
            bookings={paginated}
            isAdmin={true}
            loadingActionId={loadingActionId}
            onApprove={setApproveTarget}
            onReject={setRejectTarget}
            onViewDetail={setDetailTarget}
          />
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3.5">
            <p className="text-sm text-slate-400">
              Page <strong className="text-slate-600">{currentPage}</strong> of <strong className="text-slate-600">{totalPages}</strong>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${
                        page === currentPage ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
                if (Math.abs(page - currentPage) === 2) return <span key={page} className="text-slate-300 text-xs px-1">…</span>;
                return null;
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminBookingsPage;