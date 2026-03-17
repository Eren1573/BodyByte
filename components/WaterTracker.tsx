import React from 'react';
import { Droplets, Minus } from 'lucide-react';

interface Props { currentMl: number; targetMl: number; onUpdate: (ml: number) => void; }

const WaterTracker: React.FC<Props> = ({ currentMl, targetMl, onUpdate }) => {
  const pct = Math.min((currentMl / targetMl) * 100, 100);

  return (
    <div className="bg-blue-900/30 rounded-3xl p-5 border border-blue-700/30">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Droplets size={18} className="text-blue-400" />
          <span className="text-sm font-bold text-white">Water</span>
        </div>
        <span className="text-sm text-slate-400">{currentMl} / {targetMl} ml</span>
      </div>

      <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
        <div className="h-full rounded-full bg-blue-400 transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex gap-2">
        {[150, 250, 500].map(ml => (
          <button key={ml} onClick={() => onUpdate(currentMl + ml)}
            className="flex-1 py-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 text-xs font-bold border border-blue-500/20 transition-all active:scale-95">
            +{ml}ml
          </button>
        ))}
        {currentMl > 0 && (
          <button onClick={() => onUpdate(Math.max(0, currentMl - 250))}
            className="w-10 h-8 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-400 flex items-center justify-center transition-all">
            <Minus size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default WaterTracker;
