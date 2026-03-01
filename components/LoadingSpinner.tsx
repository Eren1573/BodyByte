import React from 'react';

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center gap-4 p-8">
    <div className="w-14 h-14 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
    <p className="text-cyan-400 text-sm font-bold animate-pulse tracking-widest uppercase">Loading...</p>
  </div>
);

export default LoadingSpinner;
