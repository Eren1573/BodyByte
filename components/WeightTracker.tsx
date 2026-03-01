import React, { useState } from 'react';
import { WeightEntry } from '../types';
import { TrendingDown, TrendingUp, Minus, Scale } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface WeightTrackerProps {
  entries: WeightEntry[];
  currentWeight: number;
  onAdd: (weight: number) => void;
}

const WeightTracker: React.FC<WeightTrackerProps> = ({ entries, currentWeight, onAdd }) => {
  const [input, setInput] = useState('');

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  const latest = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const diff = latest && prev ? +(latest.weight - prev.weight).toFixed(1) : 0;

  const chartData = sorted.map(e => ({
    date: new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    weight: e.weight,
  }));

  const handleAdd = () => {
    const w = parseFloat(input);
    if (w > 0 && w < 500) { onAdd(w); setInput(''); }
  };

  return (
    <div className="bg-white dark:bg-bodybyte-card rounded-3xl p-5 border border-slate-200 dark:border-slate-700/50 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Scale size={16} className="text-purple-400" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-white">Weight Tracking</h3>
        </div>
        {diff !== 0 && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${diff < 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'}`}>
            {diff < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
            {diff > 0 ? '+' : ''}{diff} kg
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold text-slate-800 dark:text-white">{latest?.weight ?? currentWeight}</span>
        <span className="text-slate-400 text-sm">kg</span>
      </div>

      {chartData.length > 1 ? (
        <div className="h-28 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={30} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#f8fafc' }}
                formatter={(v: number) => [`${v} kg`, 'Weight']} />
              <Line type="monotone" dataKey="weight" stroke="#a78bfa" strokeWidth={2.5} dot={{ fill: '#a78bfa', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-xs text-slate-400 mb-4 text-center py-4">Log more days to see your trend chart</p>
      )}

      <div className="flex gap-2">
        <input type="number" value={input} onChange={e => setInput(e.target.value)} placeholder="Today's weight (kg)" step="0.1"
          className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <button onClick={handleAdd} disabled={!input}
          className="px-4 py-2.5 bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
          Log
        </button>
      </div>
    </div>
  );
};

export default WeightTracker;
