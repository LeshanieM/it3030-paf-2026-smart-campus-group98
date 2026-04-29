import React from 'react';

const TabNavigation = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="overflow-x-auto">
      <div className="inline-flex min-w-full gap-2 rounded-[24px] border border-slate-200 bg-white/80 p-2 shadow-sm">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`inline-flex min-w-fit items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-[0_10px_22px_rgba(37,99,235,0.24)]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabNavigation;
