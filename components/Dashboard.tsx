import React, { useMemo, useState, useEffect } from 'react';
import { UserProfile, FoodItem, DailyStats } from '../types';
import ProgressBar from './ProgressBar';
import { Plus, Camera, Utensils, Flame, Leaf, Activity, MoreVertical, Trash2, ArrowRightLeft, Edit2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  user: UserProfile;
  logs: FoodItem[];
  onAddFood: (mealType?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack') => void;
  onScanFood: () => void;
  onDeleteLog: (id: string) => void;
  onMoveLog: (id: string, newMealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack') => void;
  onEditLog: (item: FoodItem) => void;
  onViewStats: () => void;
  onOpenProfile: () => void;
}

const COLORS = ['#38bdf8', '#34d399', '#f472b6', '#1e293b']; // Cyan (Carb), Emerald (Protein), Pink (Fat), Empty

const Dashboard: React.FC<DashboardProps> = ({ user, logs, onAddFood, onScanFood, onDeleteLog, onMoveLog, onEditLog, onViewStats, onOpenProfile }) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
        document.addEventListener('click', handleClickOutside);
    }
    return () => {
        document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenuId]);

  const stats = useMemo<DailyStats>(() => {
    return logs.reduce((acc, item) => ({
      totalCalories: acc.totalCalories + item.calories,
      totalProtein: acc.totalProtein + item.protein,
      totalCarbs: acc.totalCarbs + item.carbs,
      totalFat: acc.totalFat + item.fat,
      totalFiber: acc.totalFiber + item.fiber
    }), { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, totalFiber: 0 });
  }, [logs]);

  const remainingCalories = Math.max(0, user.targetCalories - stats.totalCalories);
  
  const macroData = [
    { name: 'Carbs', value: stats.totalCarbs },
    { name: 'Protein', value: stats.totalProtein },
    { name: 'Fat', value: stats.totalFat },
    { name: 'Remaining', value: Math.max(1, (user.targetCarbs + user.targetProtein + user.targetFat) - (stats.totalCarbs + stats.totalProtein + stats.totalFat)) }
  ];

  const groupedLogs = useMemo(() => {
    const groups: Record<string, FoodItem[]> = { 'Breakfast': [], 'Lunch': [], 'Snack': [], 'Dinner': [] };
    logs.forEach(log => {
      if (groups[log.mealType]) groups[log.mealType].push(log);
    });
    return groups;
  }, [logs]);

  // Order: Breakfast -> Lunch -> Snack -> Dinner
  const orderedMeals = ['Breakfast', 'Lunch', 'Snack', 'Dinner'] as const;
  const allMeals = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];

  return (
    <div className="animate-fade-in text-slate-900 dark:text-white">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold">Hello, {user.name}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Let's hit your goals today!</p>
        </div>
        <div 
          onClick={onOpenProfile}
          className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900/50 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-lg cursor-pointer hover:scale-105 transition-transform"
        >
          {user.name.charAt(0)}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats Only */}
        <div className="lg:col-span-1 space-y-6">
            {/* Main Stats Card */}
            <div 
                onClick={onViewStats}
                className="bg-white dark:bg-bodybyte-card rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700/50 relative overflow-hidden sticky top-8 cursor-pointer hover:shadow-2xl transition-all group"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-cyan-500/20 transition-all"></div>

                <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Calories Remaining</p>
                    <h3 className="text-4xl font-bold text-slate-800 dark:text-white tracking-tight">{Math.round(remainingCalories)}</h3>
                    <p className="text-xs text-slate-500 mt-1">Goal: {user.targetCalories}</p>
                </div>
                <div className="w-20 h-20 relative">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={macroData}
                        innerRadius={25}
                        outerRadius={35}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                        >
                        {macroData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        </Pie>
                    </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Flame size={16} className="text-cyan-400" />
                    </div>
                </div>
                </div>

                <div className="space-y-3">
                    <ProgressBar current={stats.totalProtein} total={user.targetProtein} colorClass="bg-emerald-400" label="Protein" />
                    <ProgressBar current={stats.totalCarbs} total={user.targetCarbs} colorClass="bg-cyan-400" label="Carbs" />
                    <ProgressBar current={stats.totalFat} total={user.targetFat} colorClass="bg-pink-400" label="Fat" />
                </div>
            </div>
        </div>

        {/* Right Column: Food Logs & Actions Grid */}
        <div className="lg:col-span-2 space-y-6">
            <h3 className="text-2xl font-bold mb-4">Today's Meals</h3>
            {orderedMeals.map((meal) => {
            const items = groupedLogs[meal] || [];
            return (
                <div key={meal} className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-6 px-2">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-8 rounded-full ${meal === 'Breakfast' ? 'bg-orange-400' : meal === 'Lunch' ? 'bg-cyan-400' : meal === 'Snack' ? 'bg-purple-400' : 'bg-indigo-400'}`}></div>
                        <h3 className="font-bold text-2xl text-slate-800 dark:text-white">
                            {meal}
                        </h3>
                    </div>
                    
                    <div className="flex items-center gap-3">
                         <span className="text-sm font-bold px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300">
                            {items.reduce((sum, item) => sum + item.calories, 0)} Cal
                        </span>
                        <button 
                            onClick={() => onAddFood(meal)}
                            className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white flex items-center justify-center transition-colors shadow-lg shadow-cyan-500/20"
                        >
                            <Plus size={20} strokeWidth={3} />
                        </button>
                    </div>
                </div>
                {items.length === 0 ? (
                    <div
                    onClick={() => onAddFood(meal)}
                    className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-lg hover:border-cyan-500/50 hover:bg-cyan-500/5 hover:text-cyan-500 cursor-pointer transition-all font-medium"
                    >
                    <Plus className="mx-auto mb-3 opacity-50" size={28} />
                    Add {meal}
                    </div>
                ) : (
                    <div className="space-y-4">
                    {items.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-bodybyte-card rounded-2xl p-4 flex items-center gap-5 border border-slate-100 dark:border-slate-700 shadow-sm relative group hover:shadow-md transition-shadow">
                        {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                            <Utensils size={28} />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-lg text-slate-800 dark:text-white truncate">{item.name}</p>
                            <p className="text-sm text-slate-500 mt-1">{item.amount} • {item.calories} Cal</p>
                        </div>
                        
                        <div className="hidden sm:flex gap-3 text-xs font-medium bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl">
                             <div className="text-center"><span className="block text-emerald-500 text-sm font-bold">{Math.round(item.protein)}g</span><span className="text-[10px] text-slate-400">Prot</span></div>
                             <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                             <div className="text-center"><span className="block text-cyan-500 text-sm font-bold">{Math.round(item.carbs)}g</span><span className="text-[10px] text-slate-400">Carb</span></div>
                             <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                             <div className="text-center"><span className="block text-pink-500 text-sm font-bold">{Math.round(item.fat)}g</span><span className="text-[10px] text-slate-400">Fat</span></div>
                        </div>

                        <div className="relative">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === item.id ? null : item.id);
                                }}
                                className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <MoreVertical size={20} />
                            </button>

                            {/* Dropdown Menu */}
                            {openMenuId === item.id && (
                                <div className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-fade-in origin-top-right">
                                    <div className="p-1">
                                        <button 
                                            onClick={() => onEditLog(item)}
                                            className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2"
                                        >
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <div className="my-1 border-t border-slate-100 dark:border-slate-700"></div>
                                        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Move To</div>
                                        {allMeals.filter(m => m !== item.mealType).map(m => (
                                            <button 
                                                key={m}
                                                onClick={() => onMoveLog(item.id, m as any)}
                                                className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2"
                                            >
                                                <ArrowRightLeft size={14} /> {m}
                                            </button>
                                        ))}
                                        <div className="my-1 border-t border-slate-100 dark:border-slate-700"></div>
                                        <button 
                                            onClick={() => onDeleteLog(item.id)}
                                            className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 font-medium"
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        </div>
                    ))}
                    </div>
                )}
                </div>
            );
            })}

            {/* Quick Actions & Mini Stats Grid (Bottom of Meal List) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                {/* 1. Log Food */}
                <button
                onClick={() => onAddFood()}
                className="bg-slate-800 hover:bg-slate-750 p-6 rounded-2xl border border-slate-700 flex flex-col justify-between h-32 transition-all group"
                >
                    <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                        <Utensils size={20} />
                    </div>
                    <div className="text-left">
                        <span className="font-bold text-white text-lg block">Log Food</span>
                        <span className="text-xs text-slate-400">Search database</span>
                    </div>
                </button>

                {/* 2. Snap Meal */}
                <button
                onClick={onScanFood}
                className="bg-gradient-to-br from-indigo-900 to-slate-900 hover:to-indigo-900/80 p-6 rounded-2xl border border-indigo-500/30 flex flex-col justify-between h-32 transition-all group"
                >
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                        <Camera size={20} />
                    </div>
                    <div className="text-left">
                        <span className="font-bold text-white text-lg block">Snap Meal</span>
                        <span className="text-xs text-indigo-300">AI Analysis</span>
                    </div>
                </button>

                {/* 3. BMI */}
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col justify-between h-32">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Activity size={18} />
                        <span className="text-xs font-semibold uppercase tracking-wider">BMI</span>
                    </div>
                    <div>
                         <p className="text-3xl font-bold text-white">{user.bmi}</p>
                         <p className="text-xs text-emerald-400 font-medium mt-1">Healthy Weight</p>
                    </div>
                </div>

                {/* 4. Fiber */}
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col justify-between h-32">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Leaf size={18} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Fiber</span>
                    </div>
                    <div>
                         <p className="text-3xl font-bold text-white">{Math.round(stats.totalFiber)}g</p>
                         <p className="text-xs text-slate-400 font-medium mt-1">Gut Health</p>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;