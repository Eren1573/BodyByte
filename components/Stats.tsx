import React, { useMemo, useState } from 'react';
import { FoodItem, UserProfile } from '../types';
import ProgressBar from './ProgressBar';
import { getWeeklySummary } from '../services/geminiService';
import { Droplet, Flame, Zap, Sparkles, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props { logs: FoodItem[]; user: UserProfile; }

const Stats: React.FC<Props> = ({ logs, user }) => {
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const todayTotal = useMemo(() => logs
    .filter(l => new Date(l.timestamp).toISOString().split('T')[0] === today)
    .reduce((a, i) => ({
      calories: a.calories + i.calories, protein: a.protein + i.protein, carbs: a.carbs + i.carbs,
      fat: a.fat + i.fat, fiber: a.fiber + i.fiber,
      calcium: a.calcium + (i.micros?.calcium || 0), iron: a.iron + (i.micros?.iron || 0),
      vitC: a.vitC + (i.micros?.vitaminC || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, calcium: 0, iron: 0, vitC: 0 }),
    [logs, today]);

  const weekData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split('T')[0];
    return {
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      calories: Math.round(logs.filter(l => new Date(l.timestamp).toISOString().split('T')[0] === ds).reduce((s, l) => s + l.calories, 0)),
      target: user.targetCalories,
    };
  }), [logs, user.targetCalories]);

  const pct = Math.min(Math.round((todayTotal.calories / user.targetCalories) * 100), 999);
  const over = todayTotal.calories > user.targetCalories * 1.1;
  const hit = pct >= 90 && pct <= 110;
  const barColor = over ? 'bg-red-500' : hit ? 'bg-emerald-500' : 'bg-yellow-400';
  const textColor = over ? 'text-red-500' : hit ? 'text-emerald-500' : 'text-yellow-400';
  const faceBg = over ? 'bg-red-600' : hit ? 'bg-emerald-500' : 'bg-slate-700';

  const handleSummary = async () => {
    setSummaryLoading(true);
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    try { setSummary(await getWeeklySummary(logs.filter(l => new Date(l.timestamp) >= cutoff), user)); }
    catch { setSummary('Could not load summary. Try again.'); }
    finally { setSummaryLoading(false); }
  };

  return (
    <div className="pb-24 animate-fade-in text-slate-900 dark:text-white max-w-3xl mx-auto space-y-6">
      {/* Budget card */}
      <div className="bg-white dark:bg-bodybyte-card rounded-[2.5rem] p-8 shadow-xl border border-slate-200 dark:border-slate-700/50">
        <h2 className="text-2xl font-bold mb-8">Today's Budget</h2>
        <div className="flex items-center gap-8 mb-8">
          <div className={`w-32 h-32 rounded-full ${faceBg} flex-shrink-0 flex items-center justify-center shadow-inner`}>
            {over ? (
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M9 9h.01" fill="white" stroke="white" strokeWidth="3" /><path d="M15 9h.01" fill="white" stroke="white" strokeWidth="3" /><path d="M16 16a4 4 0 0 0-8 0" /></svg>
            ) : hit ? (
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" /><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" /></svg>
            ) : (
              <><svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><path d="M9 9h.01" fill="#64748b" stroke="#64748b" strokeWidth="3" /><path d="M15 9h.01" fill="#64748b" stroke="#64748b" strokeWidth="3" /><path d="M9 15h6" /></svg><div className="absolute top-2 right-4 text-blue-400"><Droplet size={24} fill="currentColor" /></div></>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-4xl font-extrabold">{Math.round(todayTotal.calories)}</span>
              <span className="text-xl text-slate-400">/ {user.targetCalories} Cal</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-3">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <div className={`text-5xl font-black ${textColor} tracking-tighter`}>{pct}%</div>
          </div>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="bg-white dark:bg-bodybyte-card p-6 rounded-[2rem] shadow-lg border border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-cyan-500/15 rounded-full"><Flame size={18} className="text-cyan-400" /></div>
          <h3 className="font-bold text-lg">7-Day Calories</h3>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={weekData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
            <Line type="monotone" dataKey="target" stroke="#334155" strokeDasharray="4 4" dot={false} strokeWidth={1.5} />
            <Line type="monotone" dataKey="calories" stroke="#38bdf8" strokeWidth={2.5} dot={{ fill: '#38bdf8', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-500 mt-2 text-center">Dashed line = daily target</p>
      </div>

      {/* Macros + Micros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[
          { title: 'Macros', icon: <Flame size={18} className="text-orange-400" />, bg: 'bg-orange-500/15', bars: [
            { current: todayTotal.protein, total: user.targetProtein, colorClass: 'bg-emerald-500', label: 'Protein' },
            { current: todayTotal.carbs, total: user.targetCarbs, colorClass: 'bg-cyan-500', label: 'Carbs' },
            { current: todayTotal.fat, total: user.targetFat, colorClass: 'bg-rose-500', label: 'Fat' },
          ]},
          { title: 'Micros', icon: <Zap size={18} className="text-purple-400" />, bg: 'bg-purple-600/15', bars: [
            { current: todayTotal.fiber, total: user.targetFiber || 30, colorClass: 'bg-yellow-400', label: 'Fiber' },
            { current: todayTotal.calcium, total: user.targetCalcium || 1000, colorClass: 'bg-blue-400', label: 'Calcium', unit: 'mg' as 'mg' },
            { current: todayTotal.iron, total: user.targetIron || 18, colorClass: 'bg-red-400', label: 'Iron', unit: 'mg' as 'mg' },
            { current: todayTotal.vitC, total: user.targetVitaminC || 90, colorClass: 'bg-orange-400', label: 'Vit C', unit: 'mg' as 'mg' },
          ]},
        ].map(card => (
          <div key={card.title} className="bg-white dark:bg-bodybyte-card p-7 rounded-[2rem] shadow-lg border border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-3 mb-5">
              <div className={`p-2.5 ${card.bg} rounded-full`}>{card.icon}</div>
              <h3 className="font-bold text-lg uppercase tracking-wide text-slate-500 dark:text-slate-300">{card.title}</h3>
            </div>
            <div className="space-y-5">
              {card.bars.map(b => <ProgressBar key={b.label} {...b} unit={b.unit || 'g'} />)}
            </div>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      <div className="bg-white dark:bg-bodybyte-card p-6 rounded-[2rem] shadow-lg border border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-emerald-500/15 rounded-full"><Sparkles size={18} className="text-emerald-400" /></div>
          <h3 className="font-bold text-lg">AI Weekly Summary</h3>
        </div>
        {summary && <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 mb-4">{summary}</div>}
        {!summary && <p className="text-slate-400 text-sm mb-4">Get a personalised AI analysis of your past 7 days.</p>}
        <button onClick={handleSummary} disabled={summaryLoading}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all shadow-md">
          {summaryLoading ? <><Loader2 size={18} className="animate-spin" /> Generating...</> : <><Sparkles size={18} /> {summary ? 'Refresh' : 'Get Weekly Summary'}</>}
        </button>
      </div>
    </div>
  );
};

export default Stats;
