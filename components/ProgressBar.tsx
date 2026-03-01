import React from 'react';

interface Props { current: number; total: number; colorClass: string; label: string; unit?: string; }

const ProgressBar: React.FC<Props> = ({ current, total, colorClass, label, unit = 'g' }) => (
  <div className="w-full">
    <div className="flex justify-between mb-1.5">
      <span className="text-sm font-semibold text-slate-400">{label}</span>
      <span className="text-sm font-bold text-slate-700 dark:text-white">
        {Math.round(current)} <span className="text-slate-500 font-normal">/ {total}{unit}</span>
      </span>
    </div>
    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${colorClass} transition-all duration-700`} style={{ width: `${Math.min((current / total) * 100, 100)}%` }} />
    </div>
  </div>
);

export default ProgressBar;
