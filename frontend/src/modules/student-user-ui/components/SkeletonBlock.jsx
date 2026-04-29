import React from 'react';

const SkeletonBlock = ({ className = '' }) => {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/70 ${className}`} />;
};

export default SkeletonBlock;
