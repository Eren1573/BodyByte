import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  colorClass: string;
  label: string;
  unit?: string;
  heightClass?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  current, 
  total, 
  colorClass, 
  label, 
  unit = 'g', 
  heightClass = 'h-4' // Default thicker bar
}) => {
  const percentage = Math.min((current / total) * 100, 100);

  return (
    <div className="flex flex-col w-full mb-6">
      <div className="flex justify-between items-end mb-2">
        <span className="font-bold text-slate-400 text-base dark:text-slate-300 tracking-wide">{label}</span>
        <span className="font-bold text-slate-700 dark:text-white text-lg">
            {Math.round(current)} <span className="text-slate-500 text-sm font-medium">/ {total}{unit}</span>
        </span>
      </div>
      <div className={`w-full bg-slate-200 dark:bg-slate-700/50 rounded-full ${heightClass} overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass} shadow-lg`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;