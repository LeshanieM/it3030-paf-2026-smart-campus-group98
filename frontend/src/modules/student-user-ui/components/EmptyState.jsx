import React from 'react';

const EmptyState = ({ icon, title, description, compact = false }) => {
  return (
    <div
      className={`rounded-[26px] border border-dashed border-slate-300 bg-slate-50/70 text-center ${
        compact ? 'px-5 py-8' : 'px-6 py-12'
      }`}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
};

export default EmptyState;
