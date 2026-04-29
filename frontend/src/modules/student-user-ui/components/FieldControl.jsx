import React from 'react';

export const fieldInputClass = (hasError) =>
  `w-full rounded-2xl border px-4 py-3.5 text-sm text-slate-800 outline-none transition duration-200 ${
    hasError
      ? 'border-rose-300 bg-rose-50 focus:border-rose-400'
      : 'border-slate-200 bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50'
  }`;

const FieldControl = ({
  label,
  required = false,
  error,
  hint,
  className = '',
  children,
}) => {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="flex items-center gap-1 text-sm font-semibold text-slate-700">
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
        {children}
        {error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : hint ? (
          <p className="text-xs leading-5 text-slate-400">{hint}</p>
        ) : null}
      </div>
    );
};

export default FieldControl;
