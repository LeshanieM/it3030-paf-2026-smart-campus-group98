import React from 'react';
import SurfaceCard from './SurfaceCard';

const SummaryCard = ({ label, value, hint, accentClass }) => {
  return (
    <SurfaceCard className="p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
      <div className={`mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${accentClass}`}>
        {label}
      </div>
      <p className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-500">{hint}</p>
    </SurfaceCard>
  );
};

export default SummaryCard;
