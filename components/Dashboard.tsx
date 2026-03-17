import React, { useMemo, useState, useEffect, useRef } from 'react';
import { UserProfile, FoodItem, DailyStats } from '../types';
import WaterTracker from './WaterTracker';
import { Plus, Camera, Utensils, Flame, MoreVertical, Trash2, ArrowRightLeft, Edit2, Trophy } from 'lucide-react';

interface Props {
  user: UserProfile; logs: FoodItem[]; waterMl: number; streak: number;
  onUpdateWater: (ml: number) => void;
  onAddFood: (meal?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack') => void;
  onScanFood: () => void; onDeleteLog: (id: string) => void;
  onMoveLog: (id: string, meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack') => void;
  onEditLog: (item: FoodItem) => void; onViewStats: () => void; onOpenProfile: () => void;
}

// Animated SVG ring
const Ring: React.FC<{ current: number; total: number; color: string; label: string; unit?: string }> = ({ current, total, color, label, unit = 'g' }) => {
  const size = 72; const sw = 7;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);
  const pct = Math.min(current / Math.max(total, 1), 1);

  useEffect(() => { const t = setTimeout(() => setAnimated(pct), 100); return () => clearTimeout(t); }, [pct]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={sw} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
            strokeLinecap="round" strokeDasharray={circ}
            strokeDashoffset={circ * (1 - animated)}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-black" style={{ color }}>{Math.round(current)}</span>
          <span className="text-[9px] text-slate-500">{unit}</span>
        </div>
      </div>
      <span className="text-[10px] text-slate-400 font-semibold">{label}</span>
    </div>
  );
};

// Calendar strip showing last 7 days
const CalendarStrip: React.FC<{ logs: FoodItem[]; selected: string; onSelect: (d: string) => void }> = ({ logs, selected, onSelect }) => {
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {days.map(d => {
        const ds = d.toISOString().split('T')[0];
        const cals = logs.filter(l => new Date(l.timestamp).toISOString().split('T')[0] === ds).reduce((s, l) => s + l.calories, 0);
        const active = ds === selected;
        return (
          <button key={ds} onClick={() => onSelect(ds)}
            className={`flex flex-col items-center py-2 px-3 rounded-2xl min-w-[52px] transition-all ${active ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
            <span className="text-[10px] font-semibold uppercase">{d.toLocaleDateString('en', { weekday: 'short' })}</span>
            <span className={`text-lg font-black ${active ? 'text-white' : ds === today ? 'text-cyan-500' : ''}`}>{d.getDate()}</span>
            <span className="text-[9px] opacity-70">{cals > 0 ? cals : '·'}</span>
          </button>
        );
      })}
    </div>
  );
};

// Swipe-left to delete on mobile
const SwipeCard: React.FC<{ onDelete: () => void; children: React.ReactNode }> = ({ onDelete, children }) => {
  const [tx, setTx] = useState(0);
  const startX = useRef(0);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center">
        <Trash2 size={20} className="text-white" />
      </div>
      <div style={{ transform: `translateX(${tx}px)`, transition: tx === 0 ? 'transform 0.3s ease' : 'none' }}
        onTouchStart={e => { startX.current = e.touches[0].clientX; }}
        onTouchMove={e => { const diff = e.touches[0].clientX - startX.current; if (diff < 0) setTx(Math.max(diff, -80)); }}
        onTouchEnd={() => { if (tx < -55) onDelete(); else setTx(0); }}>
        {children}
      </div>
    </div>
  );
};

const MEALS = ['Breakfast', 'Lunch', 'Snack', 'Dinner'] as const;
const MEAL_COLORS: Record<string, string> = { Breakfast: 'bg-orange-400', Lunch: 'bg-cyan-400', Snack: 'bg-purple-400', Dinner: 'bg-indigo-400' };

const Dashboard: React.FC<Props> = ({ user, logs, waterMl, streak, onUpdateWater, onAddFood, onScanFood, onDeleteLog, onMoveLog, onEditLog, onViewStats, onOpenProfile }) => {
  const [menuId, setMenuId] = useState<string | null>(null);
  const today = new Date().toISOString().split('T')[0];
  const [selected, setSelected] = useState(today);

  useEffect(() => {
    const close = () => setMenuId(null);
    if (menuId) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuId]);

  const dayLogs = useMemo(() => logs.filter(l => new Date(l.timestamp).toISOString().split('T')[0] === selected), [logs, selected]);

  const stats = useMemo<DailyStats>(() => dayLogs.reduce((a, i) => ({
    totalCalories: a.totalCalories + i.calories, totalProtein: a.totalProtein + i.protein,
    totalCarbs: a.totalCarbs + i.carbs, totalFat: a.totalFat + i.fat, totalFiber: a.totalFiber + i.fiber,
  }), { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, totalFiber: 0 }), [dayLogs]);

  const remaining = Math.max(0, user.targetCalories - stats.totalCalories);
  const calPct = Math.min((stats.totalCalories / user.targetCalories) * 100, 100);
  const grouped = useMemo(() => {
    const g: Record<string, FoodItem[]> = { Breakfast: [], Lunch: [], Snack: [], Dinner: [] };
    dayLogs.forEach(l => { if (g[l.mealType]) g[l.mealType].push(l); });
    return g;
  }, [dayLogs]);

  const isToday = selected === today;
  const earnedBadges = [
    streak >= 1 && `🔥 ${streak}d Streak`,
    stats.totalCalories >= user.targetCalories * 0.9 && stats.totalCalories <= user.targetCalories * 1.1 && '🎯 Goal Hit',
    stats.totalProtein >= user.targetProtein * 0.9 && '💪 Protein Pro',
    waterMl >= (user.targetWater || 2500) * 0.9 && '💧 Hydrated',
  ].filter(Boolean) as string[];

  return (
    <div className="animate-fade-in text-slate-900 dark:text-white">
      {/* Header */}
      <header className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-3xl font-bold">Hello, {user.name} 👋</h2>
          <p className="text-slate-500 text-sm mt-0.5">{streak > 0 ? `🔥 ${streak} day streak!` : "Let's hit your goals today!"}</p>
        </div>
        <button onClick={onOpenProfile} className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900/50 border-2 border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-lg hover:scale-105 transition-transform">
          {user.name.charAt(0)}
        </button>
      </header>

      <div className="mb-5"><CalendarStrip logs={logs} selected={selected} onSelect={setSelected} /></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Stats panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Calorie card */}
          <div onClick={onViewStats} className="bg-white dark:bg-bodybyte-card rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700/50 cursor-pointer hover:shadow-2xl transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Calories Left</p>
                <p className="text-4xl font-black text-slate-800 dark:text-white">{Math.round(remaining)}</p>
                <p className="text-xs text-slate-400 mt-1">{Math.round(stats.totalCalories)} / {user.targetCalories} kcal</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-full">
                <Flame size={13} className="text-orange-400" />
                <span className="text-xs font-bold text-white">{Math.round(calPct)}%</span>
              </div>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-5 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${calPct}%`, background: calPct > 100 ? '#ef4444' : calPct >= 80 ? '#10b981' : '#38bdf8' }} />
            </div>
            <div className="flex justify-around">
              <Ring current={stats.totalProtein} total={user.targetProtein} color="#34d399" label="Protein" />
              <Ring current={stats.totalCarbs} total={user.targetCarbs} color="#38bdf8" label="Carbs" />
              <Ring current={stats.totalFat} total={user.targetFat} color="#f472b6" label="Fat" />
              <Ring current={stats.totalFiber} total={user.targetFiber} color="#fbbf24" label="Fiber" />
            </div>
          </div>

          {/* Water tracker */}
          {isToday && <WaterTracker currentMl={waterMl} targetMl={user.targetWater || 2500} onUpdate={onUpdateWater} />}

          {/* Badges */}
          {earnedBadges.length > 0 && (
            <div className="bg-white dark:bg-bodybyte-card rounded-3xl p-4 border border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={15} className="text-yellow-400" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Badges</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {earnedBadges.map(b => (
                  <span key={b} className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-full">{b}</span>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => onAddFood()} className="bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl border border-slate-700 flex flex-col gap-2 transition-all group">
              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform"><Utensils size={18} /></div>
              <div><p className="font-bold text-white text-sm">Log Food</p><p className="text-[10px] text-slate-500">Search AI</p></div>
            </button>
            <button onClick={onScanFood} className="bg-indigo-900/70 hover:bg-indigo-900 p-4 rounded-2xl border border-indigo-500/30 flex flex-col gap-2 transition-all group">
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform"><Camera size={18} /></div>
              <div><p className="font-bold text-white text-sm">Snap Meal</p><p className="text-[10px] text-indigo-300">AI Vision</p></div>
            </button>
          </div>
        </div>

        {/* Right: Meal logs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">
              {isToday ? "Today's Meals" : new Date(selected + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h3>
            {!isToday && <button onClick={() => setSelected(today)} className="text-xs text-cyan-400 hover:underline">→ Today</button>}
          </div>

          {MEALS.map(meal => {
            const items = grouped[meal] || [];
            return (
              <div key={meal} className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-5 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-8 rounded-full ${MEAL_COLORS[meal]}`} />
                    <h4 className="font-bold text-lg">{meal}</h4>
                    <span className="text-xs text-slate-400">{items.reduce((s, i) => s + i.calories, 0)} cal</span>
                  </div>
                  {isToday && (
                    <button onClick={() => onAddFood(meal)} className="w-9 h-9 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white flex items-center justify-center shadow-md transition-colors">
                      <Plus size={18} strokeWidth={3} />
                    </button>
                  )}
                </div>

                {items.length === 0 ? (
                  <div onClick={() => isToday && onAddFood(meal)}
                    className={`border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-sm ${isToday ? 'hover:border-cyan-500/50 hover:text-cyan-500 cursor-pointer' : ''} transition-all`}>
                    {isToday ? <><Plus className="mx-auto mb-1 opacity-50" size={22} />Add {meal}</> : <span className="opacity-40">Nothing logged</span>}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map(item => (
                      <SwipeCard key={item.id} onDelete={() => onDeleteLog(item.id)}>
                        <div className="bg-white dark:bg-bodybyte-card rounded-2xl p-4 flex items-center gap-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                          {item.imageUrl
                            ? <img src={item.imageUrl} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                            : <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0"><Utensils size={22} /></div>
                          }
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate">{item.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{item.amount} • {item.calories} cal</p>
                          </div>
                          <div className="hidden sm:flex gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl text-xs">
                            {[{ v: item.protein, c: 'text-emerald-500', l: 'P' }, { v: item.carbs, c: 'text-cyan-500', l: 'C' }, { v: item.fat, c: 'text-pink-500', l: 'F' }].map(m => (
                              <React.Fragment key={m.l}>
                                <div className="text-center"><span className={`block ${m.c} font-bold`}>{Math.round(m.v)}g</span><span className="text-[9px] text-slate-400">{m.l}</span></div>
                                {m.l !== 'F' && <div className="w-px bg-slate-200 dark:bg-slate-700" />}
                              </React.Fragment>
                            ))}
                          </div>
                          {/* Context menu */}
                          <div className="relative">
                            <button onClick={e => { e.stopPropagation(); setMenuId(menuId === item.id ? null : item.id); }}
                              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                              <MoreVertical size={18} />
                            </button>
                            {menuId === item.id && (
                              <div className="absolute right-0 top-10 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden">
                                <div className="p-1">
                                  <button onClick={() => onEditLog(item)} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <Edit2 size={13} /> Edit
                                  </button>
                                  <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                                  <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">Move To</p>
                                  {MEALS.filter(m => m !== item.mealType).map(m => (
                                    <button key={m} onClick={() => onMoveLog(item.id, m)} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                      <ArrowRightLeft size={13} /> {m}
                                    </button>
                                  ))}
                                  <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                                  <button onClick={() => onDeleteLog(item.id)} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2">
                                    <Trash2 size={13} /> Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </SwipeCard>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
