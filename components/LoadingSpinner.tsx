import React from 'react';

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col justify-center items-center p-8 gap-4 min-h-[200px]">
    <div className="w-16 h-16 border-4 border-slate-800 border-t-rose-500 border-r-purple-600 rounded-full animate-spin"></div>
    <p className="bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent text-sm font-bold animate-pulse tracking-widest uppercase">
      Loading...
    </p>
  </div>
);

export default LoadingSpinner;