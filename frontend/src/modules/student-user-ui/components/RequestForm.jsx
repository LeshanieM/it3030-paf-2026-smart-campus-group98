import React from 'react';
import { AlertCircle, FileText, Loader2, Paperclip, Send, Sparkles, Type, MapPin, AlertTriangle, Camera, X, Image as ImageIcon } from 'lucide-react';
import FieldControl, { fieldInputClass } from './FieldControl';
import SectionHeader from './SectionHeader';
import SurfaceCard from './SurfaceCard';
import { INCIDENT_PRIORITY_OPTIONS } from './StatusBadge';

const categoryOptions = [
  'Electrical',
  'Plumbing',
  'HVAC',
  'Furniture',
  'Cleaning',
  'Safety',
  'Network',
  'Other',
];

const RequestForm = ({
  values,
  errors,
  resources = [],
  isResourcesLoading = false,
  onChange,
  onSubmit,
  isSubmitting,
  submitMessage,
  submitError,
}) => {
  const normalizeText = (value) => String(value || '').trim().toLowerCase();

  const formatResourceType = (value) =>
    String(value || '')
      .toLowerCase()
      .split('_')
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');

  const dbResourceTypes = Array.from(
    new Set(
      (resources || [])
        .map((resource) => formatResourceType(resource?.type))
        .filter(Boolean)
    )
  );

  const combinedCategoryOptions = Array.from(
    new Set([...dbResourceTypes, ...categoryOptions])
  );

  const filteredResourceOptions = (resources || []).filter((resource) => {
    if (!values.category?.trim()) {
      return true;
    }

    return normalizeText(formatResourceType(resource?.type)) === normalizeText(values.category);
  });

  const locationOptions = Array.from(
    new Set(
      (resources || [])
        .map((resource) => resource?.location?.trim())
        .filter(Boolean)
    )
  );

  return (
    <SurfaceCard className="p-6 sm:p-8">
      <SectionHeader
        eyebrow="Submit Request"
        icon={<Sparkles size={14} />}
        title="Create a new incident or maintenance ticket"
        description="Use clear details so the facilities team can understand the issue quickly and respond with less back-and-forth."
      />

      {/* Inline Compact Tips Banner */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { icon: <Type size={16} className="text-blue-600" />, title: 'Clear Title', text: 'Name the specific issue and place.', bg: 'bg-blue-50/50', border: 'border-blue-100' },
          { icon: <MapPin size={16} className="text-emerald-600" />, title: 'Exact Location', text: 'Floor, room, or nearby landmark.', bg: 'bg-emerald-50/50', border: 'border-emerald-100' },
          { icon: <AlertTriangle size={16} className="text-amber-600" />, title: 'Impact Level', text: 'Mention if it affects safety or access.', bg: 'bg-amber-50/50', border: 'border-amber-100' },
          { icon: <Camera size={16} className="text-purple-600" />, title: 'Visual Proof', text: 'Attach a photo to help remotely.', bg: 'bg-purple-50/50', border: 'border-purple-100' },
        ].map((tip, idx) => (
          <div key={idx} className={`flex items-start gap-3 rounded-2xl border ${tip.border} ${tip.bg} p-3.5 transition-transform hover:-translate-y-0.5`}>
            <div className="shrink-0 rounded-lg bg-white p-2 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
              {tip.icon}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{tip.title}</h4>
              <p className="mt-1 flex-1 text-[11px] leading-relaxed text-slate-600 font-medium">{tip.text}</p>
            </div>
          </div>
        ))}
      </div>

      <form className="mt-8 space-y-6" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FieldControl label="Title" required error={errors.title}>
            <input
              value={values.title}
              onChange={(event) => onChange('title', event.target.value)}
              className={fieldInputClass(Boolean(errors.title))}
              placeholder="Water leak near Library staircase"
              maxLength={120}
            />
          </FieldControl>

          <FieldControl label="Location" required error={errors.location} hint="Select a saved location from the database or type a custom one.">
            <input
              value={values.location}
              onChange={(event) => onChange('location', event.target.value)}
              className={fieldInputClass(Boolean(errors.location))}
              placeholder="Select or type location..."
              list="location-list"
              maxLength={140}
            />
            <datalist id="location-list">
              {locationOptions.map((location) => (
                <option key={location} value={location} />
              ))}
            </datalist>
          </FieldControl>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <FieldControl label="Resource Type / Category" required error={errors.category} hint="Select a database resource type or type a custom category.">
            <input
              value={values.category}
              onChange={(event) => onChange('category', event.target.value)}
              className={fieldInputClass(Boolean(errors.category))}
              placeholder="Select or type category..."
              list="resource-type-list"
              maxLength={80}
            />
            <datalist id="resource-type-list">
              {combinedCategoryOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </FieldControl>

          <FieldControl
            label="Relevant Resource"
            error={errors.room}
            hint={values.category?.trim()
              ? 'Select a matching saved resource or type a custom one.'
              : 'Choose a resource type first, then select or type the resource.'}
          >
            <input
              value={values.room}
              onChange={(event) => onChange('room', event.target.value)}
              className={fieldInputClass(Boolean(errors.room))}
              placeholder={values.category?.trim() ? 'Select or type resource...' : 'Type resource or choose after selecting type...'}
              list="resource-name-list"
              maxLength={120}
            />
            <datalist id="resource-name-list">
              {filteredResourceOptions.map((resource) => (
                <option key={resource.id} value={resource.name} />
              ))}
            </datalist>
          </FieldControl>

          <FieldControl label="Priority" required error={errors.priority}>
            <select
              value={values.priority}
              onChange={(event) => onChange('priority', event.target.value)}
              className={fieldInputClass(Boolean(errors.priority))}
            >
              {INCIDENT_PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldControl>

          <FieldControl label="Preferred Contact Details" required error={errors.preferredContact}>
            <input
              value={values.preferredContact}
              onChange={(event) => {
                const val = event.target.value.replace(/[^0-9+\s-]/g, '');
                onChange('preferredContact', val);
              }}
              className={fieldInputClass(Boolean(errors.preferredContact))}
              placeholder="e.g. 0771234567"
            />
          </FieldControl>

          <FieldControl label="Email Address" className="md:col-span-2" hint="Automatically populated from your account.">
            <input
              value={values.email}
              readOnly
              className={`${fieldInputClass(false)} bg-slate-50/50 cursor-not-allowed`}
              placeholder="your.email@university.edu"
            />
          </FieldControl>
        </div>

        {isResourcesLoading && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-medium text-blue-700">
            Loading latest resource suggestions...
          </div>
        )}

        <FieldControl
          label="Description"
          error={errors.description}
          hint="Explain what happened, when you noticed it, and whether it affects safety, access, or teaching."
        >
          <textarea
            value={values.description}
            onChange={(event) => onChange('description', event.target.value)}
            className={`${fieldInputClass(Boolean(errors.description))} min-h-[160px] resize-y`}
            placeholder="Describe the issue, when you noticed it, and whether it affects teaching, safety, or student access."
          />
        </FieldControl>

        <FieldControl
          label="Optional attachments"
          error={errors.attachments}
          hint="Attach up to 3 photos (Max 10MB each)."
        >
          <div className="flex flex-col gap-3">
            <label className={`flex cursor-pointer items-center justify-between rounded-2xl border border-dashed px-4 py-3 text-sm transition ${errors.attachments ? 'border-rose-300 bg-rose-50 text-rose-600' : 'border-slate-300 bg-slate-50 text-slate-600 hover:border-blue-300 hover:bg-blue-50/40'}`}>
              <div className="flex items-center gap-3">
                <Paperclip size={18} />
                <span className="truncate">Add an image (JPG, PNG, WEBP)</span>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">Browse</span>
              <input
                type="file"
                className="hidden"
                multiple
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(event) => {
                  const newFiles = Array.from(event.target.files || []);
                  onChange('attachments', [...(values.attachments || []), ...newFiles]);
                  event.target.value = null;
                }}
              />
            </label>

            {values.attachments && values.attachments.length > 0 && (
              <div className="flex flex-col gap-2">
                {values.attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <ImageIcon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-700">{file.name}</p>
                        <p className="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextAttachments = [...values.attachments];
                        nextAttachments.splice(idx, 1);
                        onChange('attachments', nextAttachments);
                      }}
                      className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FieldControl>

        {submitMessage && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <FileText className="mt-0.5 shrink-0" size={16} />
            <span>{submitMessage}</span>
          </div>
        )}

        {submitError && (
          <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 shrink-0" size={16} />
            <span>{submitError}</span>
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            Required fields are marked with <span className="font-semibold text-rose-500">*</span>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400 sm:w-auto"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            {isSubmitting ? 'Submitting request...' : 'Submit request'}
          </button>
        </div>
      </form>
    </SurfaceCard>
  );
};

export default RequestForm;
