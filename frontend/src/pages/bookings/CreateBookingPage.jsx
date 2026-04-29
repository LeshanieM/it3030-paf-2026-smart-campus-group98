import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { resourceService } from '../../services/resourceService';
import { bookingService } from '../../services/bookingService';
import {
  Calendar, Clock, MapPin, Users, FileText, Layers,
  CheckCircle2, AlertCircle, Loader2, PlusCircle, ChevronRight, XCircle
} from 'lucide-react';

// ── Toast component ──────────────────────────────────────────────────────────
const Toast = ({ message, type, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

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
        <XCircle size={16} />
      </button>
    </div>
  );
};

// ── Loading skeleton ─────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
);

// ── Field wrapper ─────────────────────────────────────────────────────────────
const Field = ({ label, error, children, required }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold text-slate-700">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-xs text-rose-500">
        <AlertCircle size={11} /> {error}
      </p>
    )}
  </div>
);

// ── Helpers ──────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];

const validate = (form, resources) => {
  const errors = {};
  if (!form.resourceId) errors.resourceId = 'Please select a resource.';
  if (!form.date) errors.date = 'Please pick a date.';
  else if (form.date < today()) errors.date = 'Date cannot be in the past.';
  if (!form.startTime) errors.startTime = 'Start time is required.';
  if (!form.endTime) errors.endTime = 'End time is required.';
  else if (form.startTime && form.endTime && form.endTime <= form.startTime)
    errors.endTime = 'End time must be after start time.';
  if (!form.purpose.trim()) errors.purpose = 'Purpose is required.';

  const selected = resources.find((r) => r.id === form.resourceId);
  if (selected && selected.type !== 'EQUIPMENT' && form.expectedAttendees !== '' && Number(form.expectedAttendees) < 1)
    errors.expectedAttendees = 'Attendees must be at least 1.';

  return errors;
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const CreateBookingPage = () => {
  const navigate = useNavigate();

  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [conflictError, setConflictError] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const [form, setForm] = useState({
    resourceId: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    expectedAttendees: '',
  });

  useEffect(() => {
    resourceService.getAllResources()
      .then(setResources)
      .catch(() => setToast({ message: 'Failed to load resources.', type: 'error' }))
      .finally(() => setLoadingResources(false));
  }, []);

  const selectedResource = resources.find((r) => r.id === form.resourceId);
  const isEquipment = selectedResource?.type === 'EQUIPMENT';

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setConflictError('');
    setSuggestions([]);
  };

  const submitBooking = async (formData) => {
    setSubmitting(true);
    setConflictError('');
    setSuggestions([]);

    const payload = {
      resourceId: formData.resourceId,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      purpose: formData.purpose.trim(),
      ...((!isEquipment && formData.expectedAttendees !== '') && { expectedAttendees: Number(formData.expectedAttendees) }),
    };

    try {
      await bookingService.createBooking(payload);
      setToast({ message: 'Booking created successfully!', type: 'success' });
      setTimeout(() => navigate('/bookings/my'), 1500);
    } catch (err) {
      if (err.response?.status === 409) {
        const data = err.response.data;
        setConflictError(data.conflictMessage || 'This resource is already booked for the selected time slot. Please choose a different time.');
        setSuggestions(data.suggestions || []);
      } else {
        setToast({ message: err.response?.data?.message || 'Failed to create booking.', type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(form, resources);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    await submitBooking(form);
  };

  const handleBookAlternative = (suggestion) => {
    const updatedForm = { ...form, resourceId: suggestion.resourceId };
    setForm(updatedForm);
    setToast({ message: `Switching to ${suggestion.resourceName}...`, type: 'success' });
    setConflictError('');
    setSuggestions([]);
    submitBooking(updatedForm);
  };

  const resourceTypeColors = {
    LAB: 'text-violet-600 bg-violet-50',
    ROOM: 'text-sky-600 bg-sky-50',
    EQUIPMENT: 'text-orange-600 bg-orange-50',
  };

  return (
    <Layout>
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}

      <div className="max-w-4xl mx-auto animate-fade-in pb-12">
        {/* Page header with gradient background from second version */}
        <div className="relative mb-8 rounded-3xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/70 opacity-90" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          
          <div className="relative p-8 md:p-12 text-white">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/60 mb-4">
              <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('/bookings/my')}>My Bookings</span>
              <ChevronRight size={12} strokeWidth={3} />
              <span className="text-white">New Booking</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
              Reserve <span className="text-white/80">a</span> Resource
            </h1>
            <p className="text-white/70 max-w-lg font-medium leading-relaxed">
              Secure your spot for labs, rooms, or equipment. Our automated system ensures a seamless experience for your campus needs.
            </p>
          </div>

          {/* Decorative element */}
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mb-32 -mr-32" />
        </div>

        {/* Main Form Content - using grid layout from second version */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Body */}
          <form onSubmit={handleSubmit} noValidate className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              
              {/* Section: Resource Selection - combined styling */}
              <div className="p-8 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">Resource Selection</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Step 1 of 3</p>
                  </div>
                </div>

                {loadingResources ? (
                  <div className="space-y-4">
                    <SkeletonRow /><SkeletonRow />
                  </div>
                ) : (
                  <Field label="Choose Resource" error={errors.resourceId} required>
                    <div className="relative group">
                      <select
                        value={form.resourceId}
                        onChange={(e) => handleChange('resourceId', e.target.value)}
                        className={`w-full text-sm px-5 py-4 pr-12 rounded-2xl border-2 bg-white outline-none transition-all appearance-none font-bold text-slate-700
                          focus:ring-8 focus:ring-primary/5 focus:border-primary
                          ${errors.resourceId ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'}`}
                      >
                        <option value="">— Select from available resources —</option>
                        {resources.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.type}) · {r.location}
                          </option>
                        ))}
                      </select>
                      <ChevronRight size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none group-focus-within:text-primary transition-colors" />
                    </div>
                  </Field>
                )}

                {/* Selected resource details pill - from first version */}
                {selectedResource && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${resourceTypeColors[selectedResource.type] || 'bg-slate-100 text-slate-600'}`}>
                      {selectedResource.type}
                    </span>
                    {selectedResource.location && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin size={11} /> {selectedResource.location}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Section: Date & Time */}
              <div className="p-8 border-b border-slate-100 bg-slate-50/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">Date & Time</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Step 2 of 3</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Field label="Date" error={errors.date} required>
                      <div className="relative group">
                        <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                          type="date"
                          min={today()}
                          value={form.date}
                          onChange={(e) => handleChange('date', e.target.value)}
                          className={`w-full text-sm pl-14 pr-5 py-4 rounded-2xl border-2 bg-white outline-none transition-all font-bold text-slate-700
                            focus:ring-8 focus:ring-primary/5 focus:border-primary
                            ${errors.date ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'}`}
                        />
                      </div>
                    </Field>
                  </div>

                  <Field label="Start Time" error={errors.startTime} required>
                    <div className="relative group">
                      <Clock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <input
                        type="time"
                        value={form.startTime}
                        onChange={(e) => handleChange('startTime', e.target.value)}
                        className={`w-full text-sm pl-14 pr-5 py-4 rounded-2xl border-2 bg-white outline-none transition-all font-bold text-slate-700
                          focus:ring-8 focus:ring-primary/5 focus:border-primary
                          ${errors.startTime ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'}`}
                      />
                    </div>
                  </Field>

                  <Field label="End Time" error={errors.endTime} required>
                    <div className="relative group">
                      <Clock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <input
                        type="time"
                        value={form.endTime}
                        onChange={(e) => handleChange('endTime', e.target.value)}
                        min={form.startTime || undefined}
                        className={`w-full text-sm pl-14 pr-5 py-4 rounded-2xl border-2 bg-white outline-none transition-all font-bold text-slate-700
                          focus:ring-8 focus:ring-primary/5 focus:border-primary
                          ${errors.endTime ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'}`}
                      />
                    </div>
                  </Field>
                </div>

                {/* Time conflict error with suggestions - from second version */}
                {conflictError && (
                  <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex items-start gap-4 bg-rose-50 border-2 border-rose-100 rounded-2xl p-5">
                      <AlertCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-rose-700 font-black uppercase tracking-wider mb-1">Room Not Available</p>
                        <p className="text-sm text-rose-600 font-medium leading-relaxed">{conflictError}</p>
                      </div>
                    </div>

                    {suggestions.length > 0 && (
                      <div className="pt-2">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="h-px flex-1 bg-slate-200" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Suggested Alternatives</span>
                          <div className="h-px flex-1 bg-slate-200" />
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                          {suggestions.map((s) => (
                            <div key={s.resourceId} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                  <MapPin size={18} />
                                </div>
                                <div>
                                  <h4 className="text-sm font-black text-slate-700 leading-tight">{s.resourceName}</h4>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                    {s.type} • Cap: {s.capacity} • {s.location}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleBookAlternative(s)}
                                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-primary bg-primary/5 hover:bg-primary hover:text-white rounded-xl transition-all uppercase tracking-wider"
                              >
                                Book This Instead
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section: Purpose */}
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">Booking Details</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Step 3 of 3</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <Field label="Purpose of Booking" error={errors.purpose} required>
                    <textarea
                      value={form.purpose}
                      onChange={(e) => handleChange('purpose', e.target.value)}
                      placeholder="Briefly describe the purpose of this booking..."
                      rows={3}
                      className={`w-full text-sm px-6 py-5 rounded-2xl border-2 bg-white resize-none outline-none transition-all font-medium text-slate-700
                        focus:ring-8 focus:ring-primary/5 focus:border-primary
                        ${errors.purpose ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'}`}
                    />
                  </Field>

                  {!isEquipment && (
                    <Field label="Expected Attendees" error={errors.expectedAttendees}>
                      <div className="relative group">
                        <Users size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                          type="number"
                          min="1"
                          value={form.expectedAttendees}
                          onChange={(e) => handleChange('expectedAttendees', e.target.value)}
                          placeholder="Optional"
                          className={`w-full text-sm pl-14 pr-5 py-4 rounded-2xl border-2 bg-white outline-none transition-all font-bold text-slate-700
                            focus:ring-8 focus:ring-primary/5 focus:border-primary
                            ${errors.expectedAttendees ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'}`}
                        />
                      </div>
                    </Field>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/bookings/my')}
                className="px-8 py-4 text-sm font-black text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-all uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || loadingResources}
                className="group relative flex items-center justify-center gap-3 px-10 py-4 text-sm font-black text-white bg-gradient-to-r from-primary to-primary/80 rounded-2xl transition-all shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none uppercase tracking-widest overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10 flex items-center gap-3">
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
                  {submitting ? 'Processing...' : 'Create Booking'}
                </span>
              </button>
            </div>
          </form>

          {/* Sidebar / Info - from second version */}
          <div className="space-y-6">
            {/* Selected Resource Preview */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 sticky top-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Resource Summary</h3>
              
              {selectedResource ? (
                <div className="space-y-6">
                  <div className="aspect-video rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 border-2 border-dashed border-primary/20 flex items-center justify-center overflow-hidden">
                    <div className="text-primary/40 flex flex-col items-center gap-2">
                      <MapPin size={40} strokeWidth={1.5} />
                      <span className="text-[10px] font-bold uppercase tracking-tight">Location Preview</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xl font-black text-slate-800 leading-tight">{selectedResource.name}</h4>
                      <p className="text-xs font-bold text-primary uppercase mt-1 tracking-wider">{selectedResource.type}</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                          <MapPin size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Location</p>
                          <p className="text-sm font-bold text-slate-700">{selectedResource.location || 'Not Specified'}</p>
                        </div>
                      </div>
                      
                      {selectedResource.capacity && (
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                            <Users size={14} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Max Capacity</p>
                            <p className="text-sm font-bold text-slate-700">{selectedResource.capacity} Person(s)</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 px-4 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                  <Layers size={32} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-sm text-slate-400 font-medium italic">Select a resource to view its live details and location preview here.</p>
                </div>
              )}

              {/* Policy Note */}
              <div className="mt-8 pt-8 border-t border-slate-100">
                <div className="flex items-start gap-3 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
                  <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                    By submitting this request, you agree to follow the campus facility usage policies. All bookings are subject to approval by the department administrator.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default CreateBookingPage;