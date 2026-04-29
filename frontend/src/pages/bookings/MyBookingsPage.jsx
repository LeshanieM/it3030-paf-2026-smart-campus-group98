import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import BookingCard from '../../components/bookings/BookingCard';
import BookingTable from '../../components/bookings/BookingTable';
import BookingDetailModal from '../../components/bookings/BookingDetailModal';
import CancelConfirmModal from '../../components/bookings/CancelConfirmModal';
import BookingStatusBadge from '../../components/bookings/BookingStatusBadge';
import { bookingService } from '../../services/bookingService';
import {
  Calendar, Clock, PlusCircle, CheckCircle2, AlertCircle,
  Loader2, LayoutGrid, LayoutList, RefreshCw, Inbox
} from 'lucide-react';

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onDismiss }) => {
  useEffect(() => { const t = setTimeout(onDismiss, 4000); return () => clearTimeout(t); }, [onDismiss]);
  return (
    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold animate-fade-in max-w-sm
      ${type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
      {type === 'success' ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
      {message}
    </div>
  );
};

// ── Skeleton cards ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse space-y-3">
    <div className="flex justify-between">
      <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
      <div className="h-5 bg-slate-100 rounded-full w-20" />
    </div>
    <div className="h-3 bg-slate-100 rounded-lg w-1/3" />
    <div className="grid grid-cols-2 gap-3">
      <div className="h-8 bg-slate-50 rounded-lg" />
      <div className="h-8 bg-slate-50 rounded-lg" />
    </div>
    <div className="h-10 bg-slate-50 rounded-xl" />
  </div>
);

const STATUS_FILTER_OPTIONS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

const MyBookingsPage = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bookingService.getMyBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setToast({ message: 'Failed to load bookings.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancelConfirm = async (id) => {
    setCancelLoading(true);
    try {
      await bookingService.cancelBooking(id);
      setBookings((prev) =>
        prev.map((b) => b.id === id ? { ...b, status: 'CANCELLED' } : b)
      );
      setToast({ message: 'Booking cancelled successfully.', type: 'success' });
      setCancelTarget(null);
    } catch {
      setToast({ message: 'Failed to cancel booking.', type: 'error' });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleDeleteConfirm = async (id) => {
    setDeleteLoading(true);
    try {
      await bookingService.deleteBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
      setToast({ message: 'Booking request deleted.', type: 'success' });
      setDeleteTarget(null);
    } catch {
      setToast({ message: 'Failed to delete booking request.', type: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Stats
  const stats = {
    PENDING: bookings.filter((b) => b.status === 'PENDING').length,
    APPROVED: bookings.filter((b) => b.status === 'APPROVED').length,
    REJECTED: bookings.filter((b) => b.status === 'REJECTED').length,
    CANCELLED: bookings.filter((b) => b.status === 'CANCELLED').length,
  };

  const filtered = statusFilter === 'ALL'
    ? bookings
    : bookings.filter((b) => b.status === statusFilter);

  return (
    <Layout>
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}

      {detailTarget && (
        <BookingDetailModal booking={detailTarget} onClose={() => setDetailTarget(null)} />
      )}
      {cancelTarget && (
        <CancelConfirmModal
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancelConfirm}
          isLoading={cancelLoading}
          mode="cancel"
        />
      )}
      {deleteTarget && (
        <CancelConfirmModal
          booking={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          isLoading={deleteLoading}
          mode="delete"
        />
      )}

      <div className="space-y-10 animate-fade-in pb-12">
        {/* Modern Header Section - from version 2 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <Calendar size={12} className="text-primary" />
              <span>Campus Resources</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
              My <span className="text-primary">Bookings</span>
            </h1>
            <p className="text-slate-500 font-medium max-w-md leading-relaxed">
              Manage your reservation schedule, check approval statuses, and coordinate resource usage.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchBookings}
              disabled={loading}
              className="group p-3.5 text-slate-400 hover:text-primary hover:bg-primary/5 bg-white border border-slate-200 rounded-2xl transition-all shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw size={18} className={`${loading ? 'animate-spin text-primary' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            </button>
            <button
              onClick={() => navigate('/bookings/new')}
              className="flex items-center gap-3 px-8 py-3.5 text-sm font-black text-white bg-gradient-to-r from-primary to-primary/80 hover:shadow-2xl hover:shadow-primary/30 rounded-2xl transition-all hover:-translate-y-1 active:translate-y-0 uppercase tracking-widest shadow-xl shadow-primary/20"
            >
              <PlusCircle size={18} strokeWidth={2.5} />
              New Booking
            </button>
          </div>
        </div>

        {/* Stats Section - Dashboard Style from version 2 */}
        {!loading && bookings.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Pending', count: stats.PENDING, color: 'amber', icon: Clock },
              { label: 'Approved', count: stats.APPROVED, color: 'emerald', icon: CheckCircle2 },
              { label: 'Rejected', count: stats.REJECTED, color: 'rose', icon: AlertCircle },
              { label: 'Cancelled', count: stats.CANCELLED, color: 'slate', icon: Inbox }
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-primary/20 transition-all">
                <div className={`shrink-0 w-12 h-12 rounded-xl bg-${s.color}-50 flex items-center justify-center text-${s.color}-500 shadow-inner group-hover:scale-110 transition-transform`}>
                  <s.icon size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-800 tracking-tight">{s.count}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar & Filter Bar - from version 2 */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
          {/* Enhanced Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
            {STATUS_FILTER_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`relative px-5 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap
                  ${statusFilter === s
                    ? 'bg-white shadow-md text-primary ring-1 ring-slate-200'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                  }`}
              >
                {s === 'ALL' ? `Everything (${bookings.length})` : s}
                {statusFilter === s && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(65,105,225,0.8)]" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between lg:justify-end gap-6">
            {/* Results Count */}
            <div className="hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Displaying <span className="text-slate-900">{filtered.length}</span> Results
              </p>
            </div>

            {/* View Switching */}
            <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-inner">
              {[
                { mode: 'cards', icon: LayoutGrid },
                { mode: 'table', icon: LayoutList }
              ].map((v) => (
                <button
                  key={v.mode}
                  onClick={() => setViewMode(v.mode)}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === v.mode ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 'text-slate-300 hover:text-slate-500'}`}
                >
                  <v.icon size={18} strokeWidth={2.5} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="relative min-h-[400px]">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : bookings.length === 0 ? (
            /* Premium Empty State - from version 2 */
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="relative mb-8">
                <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-primary/5 to-indigo-500/5 backdrop-blur-xl border border-primary/10 flex items-center justify-center shadow-inner">
                  <Inbox size={48} className="text-primary/20" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center text-primary/40 border border-slate-50 animate-bounce">
                   <PlusCircle size={20} />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-3 italic">Empty Schedule</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed font-medium mb-10">
                Looks like you haven't reserved any campus resources yet. Let's get your first booking started!
              </p>
              <button
                onClick={() => navigate('/bookings/new')}
                className="group flex items-center gap-3 px-10 py-4 text-sm font-black text-white bg-gradient-to-r from-primary to-primary/80 hover:shadow-2xl hover:shadow-primary/30 rounded-2xl transition-all hover:-translate-y-1 uppercase tracking-widest shadow-xl shadow-primary/20"
              >
                <PlusCircle size={18} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform" />
                Initialize First Booking
              </button>
            </div>
          ) : filtered.length === 0 ? (
            /* No Filter Results - from version 2 */
            <div className="flex flex-col items-center py-24 text-center animate-fade-in">
              <div className="p-6 bg-slate-100 rounded-[2rem] mb-6">
                <Calendar size={40} className="text-slate-300" strokeWidth={1} />
              </div>
              <p className="text-slate-600 font-black tracking-tight text-lg mb-2 capitalize">No {statusFilter.toLowerCase()} Bookings</p>
              <p className="text-slate-400 text-sm font-medium mb-8">Adjust your filters to see more results.</p>
              <button 
                onClick={() => setStatusFilter('ALL')} 
                className="px-6 py-2.5 text-[11px] font-black text-primary uppercase tracking-widest bg-primary/5 rounded-xl hover:bg-primary/10 transition-all border border-primary/10"
              >
                View Everything
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancel={setCancelTarget}
                  onDelete={setDeleteTarget}
                  onViewDetail={setDetailTarget}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
              <BookingTable
                bookings={filtered}
                isAdmin={false}
                onCancel={setCancelTarget}
                onDelete={setDeleteTarget}
                onViewDetail={setDetailTarget}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MyBookingsPage;