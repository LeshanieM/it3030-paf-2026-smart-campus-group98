import React from 'react';

const SurfaceCard = ({ children, className = '', tone = 'default' }) => {
  const toneClasses = {
    default: 'border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]',
    muted: 'border-slate-200 bg-slate-50/70 shadow-[0_8px_24px_rgba(15,23,42,0.04)]',
    hero: 'border-blue-100 bg-gradient-to-br from-white via-slate-50 to-blue-50 shadow-[0_18px_40px_rgba(59,130,246,0.08)]',
  };

  return (
    <section
      className={`rounded-[30px] border ${toneClasses[tone] || toneClasses.default} ${className}`}
    >
      {children}
    </section>
  );
};

export default SurfaceCard;
