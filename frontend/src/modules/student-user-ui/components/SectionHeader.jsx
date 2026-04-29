import React from 'react';

const SectionHeader = ({ eyebrow, title, description, icon, actions }) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">
            {icon}
            <span>{eyebrow}</span>
          </div>
        )}
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">{title}</h2>
          {description && <p className="max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
};

export default SectionHeader;
