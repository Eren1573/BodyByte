import React, { useState, useEffect } from 'react';
import { UserProfile, Gender, WeightEntry } from '../types';
import { Sun, Moon, Save, LogOut, ChevronRight, Plus, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import { calculateHealthPlan } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  user: UserProfile; onUpdateUser: (u: UserProfile) => void;
  isDarkMode: boolean; onToggleTheme: () => void; onLogout: () => void;
  weightEntries: WeightEntry[]; onAddWeight: (e: WeightEntry) => void;
  streak: number; totalLogsCount: number;
}

const BADGES = [
  { emoji: '🥗', label: 'First Log', unlock: (_: number, c: number) => c >= 1 },
  { emoji: '🔥', label: '3-Day Streak', unlock: (s: number) => s >= 3 },
  { emoji: '💪', label: '7-Day Warrior', unlock: (s: number) => s >= 7 },
  { emoji: '📊', label: 'Data Driven', unlock: (_: number, c: number) => c >= 50 },
  { emoji: '🏆', label: '30-Day Legend', unlock: (s: number) => s >= 30 },
  { emoji: '🌟', label: 'Dedicated', unlock: (_: number, c: number) => c >= 100 },
];

const Profile: React.FC<Props> = ({ user, onUpdateUser, isDarkMode, onToggleTheme, onLogout, weightEntries, onAddWeight, streak, totalLogsCount }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ ...user });
  const [loading, setLoading] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [showWeightInput, setShowWeightInput] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const plan = await calculateHealthPlan(form.name, form.age, form.height, form.weight, form.gender);
      onUpdateUser({ ...form, bmi: plan.bmi || 22, targetCalories: plan.targetCalories || 2000, targetProtein: plan.targetProtein || 150, targetCarbs: plan.targetCarbs || 250, targetFat: plan.targetFat || 70, targetFiber: plan.targetFiber || 30, targetCalcium: plan.targetCalcium || 1000, targetIron: plan.targetIron || 18, targetVitaminA: plan.targetVitaminA || 900, targetVitaminC: plan.targetVitaminC || 90, targetWater: plan.targetWater || 2500 });
    } catch {
      const h = form.height / 100;
      onUpdateUser({ ...form, bmi: parseFloat((form.weight / (h * h)).toFixed(1)) });
    } finally {
      setLoading(false); setIsEditing(false);
    }
  };

  const handleAddWeight = () => {
    const w = parseFloat(newWeight);
    if (!w || w < 20 || w > 500) return;
    onAddWeight({ id: Date.now().toString(), weight: w, date: new Date().toISOString().split('T')[0] });
    setNewWeight(''); setShowWeightInput(false);
  };

  const latestWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight : user.weight;
  const prevWeight = weightEntries.length > 1 ? weightEntries[weightEntries.length - 2].weight : null;
  const delta = prevWeight ? (latestWeight - prevWeight).toFixed(1) : null;
  const TrendIcon = delta && parseFloat(delta) < 0 ? TrendingDown : TrendingUp;
  const trendColor = delta && parseFloat(delta) < 0 ? 'text-emerald-400' : 'text-red-400';

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <LoadingSpinner />
      <p className="text-cyan-500 font-medium mt-4 animate-pulse">Updating your plan...</p>
    </div>
  );

  return (
    <div className="animate-fade-in text-slate-900 dark:text-white max-w-2xl mx-auto pb-16 space-y-4">
      <header className="mb-2">
        <h2 className="text-2xl font-bold">Profile</h2>
        <p className="text-slate-500 text-sm">Your stats & settings</p>
      </header>

      {/* Profile card */}
      <div className="bg-white dark:bg-bodybyte-card p-6 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700/50">
        <div className="flex flex-col md:flex-row items-center gap-5">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-4xl font-black text-white shadow-lg">
              {user.name.charAt(0)}
            </div>
            {streak >= 3 && <span className="absolute -top-1 -right-1 text-xl">🔥</span>}
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-2xl font-bold">{user.name}</h3>
            <p className="text-slate-500 text-sm">{user.gender} • {user.age} yrs</p>
            <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
              {[`${user.height} cm`, `${latestWeight} kg`, `BMI ${user.bmi}`, streak > 0 ? `🔥 ${streak}d` : ''].filter(Boolean).map(v => (
                <span key={v} className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-sm font-semibold">{v}</span>
              ))}
            </div>
          </div>
          <button onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${isEditing ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600'}`}>
            {isEditing ? <><Save size={16} />Save</> : 'Edit'}
          </button>
        </div>
        {isEditing && (
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-4 animate-slide-up">
            {[{ label: 'Height (cm)', key: 'height' }, { label: 'Weight (kg)', key: 'weight' }, { label: 'Age', key: 'age' }].map(f => (
              <div key={f.key}>
                <label className="block text-sm text-slate-500 mb-1">{f.label}</label>
                <input type="number" value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weight tracker */}
      <div className="bg-white dark:bg-bodybyte-card p-6 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700/50">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/15 rounded-xl"><TrendIcon size={18} className={trendColor} /></div>
            <div>
              <p className="font-bold">Weight Tracking</p>
              {delta && <p className={`text-xs ${trendColor} font-semibold`}>{parseFloat(delta) > 0 ? '+' : ''}{delta} kg from last entry</p>}
            </div>
          </div>
          <button onClick={() => setShowWeightInput(!showWeightInput)} className="w-9 h-9 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white flex items-center justify-center transition-colors">
            <Plus size={18} />
          </button>
        </div>
        {showWeightInput && (
          <div className="flex gap-2 mb-4">
            <input type="number" value={newWeight} onChange={e => setNewWeight(e.target.value)} placeholder="e.g. 72.5" step="0.1"
              className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white" />
            <button onClick={handleAddWeight} className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold">Log</button>
          </div>
        )}
        {weightEntries.length >= 2 ? (
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={weightEntries.slice(-14).map(e => ({ date: e.date.slice(5), weight: e.weight }))} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="weight" stroke="#34d399" strokeWidth={2.5} dot={{ fill: '#34d399', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="text-slate-400 text-sm text-center py-4">Log 2+ entries to see your chart 📈</p>}
      </div>

      {/* Badges */}
      <div className="bg-white dark:bg-bodybyte-card p-6 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={16} className="text-yellow-400" />
          <p className="font-bold">Badges ({BADGES.filter(b => b.unlock(streak, totalLogsCount)).length}/{BADGES.length})</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {BADGES.map(b => {
            const earned = b.unlock(streak, totalLogsCount);
            return (
              <div key={b.label} className={`p-3 rounded-2xl border transition-all ${earned ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-50'}`}>
                <span className="text-2xl block mb-1">{earned ? b.emoji : '🔒'}</span>
                <p className="text-xs font-bold text-slate-800 dark:text-white">{b.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-3">
        <button onClick={onToggleTheme} className="w-full bg-white dark:bg-bodybyte-card p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</div>
            <span className="font-semibold">Appearance</span>
          </div>
          <div className="flex items-center gap-2"><span className="text-sm text-slate-500">{isDarkMode ? 'Dark' : 'Light'}</span><ChevronRight size={18} className="text-slate-400" /></div>
        </button>
        <button onClick={onLogout} className="w-full bg-white dark:bg-bodybyte-card p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500"><LogOut size={20} /></div>
            <span className="font-semibold text-red-500">Log Out</span>
          </div>
          <ChevronRight size={18} className="text-red-300" />
        </button>
      </div>
      <p className="text-center text-slate-400 text-xs">BodyByte v2.0.0</p>
    </div>
  );
};

export default Profile;
