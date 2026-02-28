import React, { useMemo } from 'react';
import { FoodItem, UserProfile } from '../types';
import ProgressBar from './ProgressBar';
import { Share2, Droplet, Flame, Zap, Activity } from 'lucide-react';

interface StatsProps {
  logs: FoodItem[];
  user: UserProfile;
}

const Stats: React.FC<StatsProps> = ({ logs, user }) => {
  
  const dailyTotal = useMemo(() => {
    return logs.reduce((acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
      fiber: acc.fiber + item.fiber,
      calcium: (acc.calcium || 0) + (item.micros?.calcium || 0),
      iron: (acc.iron || 0) + (item.micros?.iron || 0),
      vitA: (acc.vitA || 0) + (item.micros?.vitaminA || 0),
      vitC: (acc.vitC || 0) + (item.micros?.vitaminC || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, calcium: 0, iron: 0, vitA: 0, vitC: 0 });
  }, [logs]);

  const caloriesPercent = Math.min(Math.round((dailyTotal.calories / user.targetCalories) * 100), 999);
  
  // Status Logic
  const isOverBudget = dailyTotal.calories > user.targetCalories * 1.1; // 10% buffer for "Over"
  const isTargetHit = caloriesPercent >= 90 && caloriesPercent <= 110;
  
  // Theme Colors
  let themeColor = 'text-yellow-400';
  let barColor = 'bg-yellow-400';
  let faceBg = 'bg-slate-200 dark:bg-slate-700';
  let progressColor = 'bg-yellow-400';
  
  if (isTargetHit) {
      themeColor = 'text-emerald-500';
      barColor = 'bg-emerald-500';
      faceBg = 'bg-emerald-500'; // Green face
      progressColor = 'bg-emerald-500';
  } else if (isOverBudget) {
      themeColor = 'text-red-500';
      barColor = 'bg-red-500';
      faceBg = 'bg-red-600'; // Red face
      progressColor = 'bg-red-500';
  }

  const getContextText = () => {
    if (isOverBudget) {
        return `You have had a hearty meal! But you went a bit over your budget of ${user.targetCalories} calories. Don't worry, just balance it tomorrow.`;
    }
    if (isTargetHit) {
        return "Great work! Your calorie intake is balanced so far. Track the rest of your meals and get an updated analysis.";
    }
    if (caloriesPercent < 40) {
        return "You haven't tracked all meals today. Continue tracking the rest of your meals and stick to your calorie budget for the day.";
    }
    return "You're on the right track! Keep logging your meals to hit your daily goal.";
  };

  return (
    <div className="pb-24 animate-fade-in text-slate-900 dark:text-white max-w-3xl mx-auto">
      
      {/* Main Budget Card */}
      <div className="bg-white dark:bg-bodybyte-card rounded-[2.5rem] p-8 shadow-xl border border-slate-200 dark:border-slate-700/50 relative overflow-hidden mb-10">
         <div className="flex justify-between items-start mb-8">
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Your Calorie Budget</h2>
             <Share2 size={24} className="text-slate-400" />
         </div>

         <div className="flex items-center gap-10 mb-8">
             {/* Dynamic Face Emoji */}
             <div className={`relative w-36 h-36 rounded-full ${faceBg} flex-shrink-0 flex items-center justify-center transition-all duration-500 transform shadow-inner`}>
                 {isOverBudget ? (
                     // Red Sad Face
                     <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <circle cx="12" cy="12" r="10" stroke="none" />
                         <path d="M9 9h.01" fill="white" stroke="white" strokeWidth="3"/>
                         <path d="M15 9h.01" fill="white" stroke="white" strokeWidth="3"/>
                         <path d="M16 16a4 4 0 0 0-8 0" /> 
                     </svg>
                 ) : isTargetHit ? (
                     // Green Happy Face
                     <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" stroke="none" />
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                        <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" />
                        <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
                     </svg>
                 ) : (
                     // Neutral/Sweat Face (Yellow Context)
                    <>
                     <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <path d="M9 9h.01" fill="#64748b" stroke="#64748b" strokeWidth="3"/>
                         <path d="M15 9h.01" fill="#64748b" stroke="#64748b" strokeWidth="3"/>
                         <path d="M9 15h6" />
                     </svg>
                     {/* Sweat Drop */}
                     <div className="absolute top-2 right-4 text-blue-400">
                        <Droplet size={28} fill="currentColor" />
                     </div>
                    </>
                 )}
             </div>

             {/* Stats Text */}
             <div className="flex-1">
                 <div className="flex items-baseline gap-2 mb-3">
                     <span className="text-4xl font-extrabold text-slate-700 dark:text-white">
                         {Math.round(dailyTotal.calories)} 
                     </span>
                     <span className="text-xl text-slate-400 font-medium">
                         / {user.targetCalories} Cal
                     </span>
                 </div>
                 
                 {/* Progress Line */}
                 <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-3">
                     <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(caloriesPercent, 100)}%` }}></div>
                 </div>

                 <div className={`text-6xl font-black ${themeColor} tracking-tighter`}>
                     {caloriesPercent}%
                 </div>
             </div>
         </div>

         <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed font-medium">
             {getContextText()}
         </p>
      </div>
      
      {/* 2. Detailed Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Macros Card */}
          <div className="bg-white dark:bg-bodybyte-card p-8 rounded-[2rem] shadow-lg border border-slate-200 dark:border-slate-700/50">
             <div className="flex items-center gap-3 mb-6">
                 {/* Macros Icon: Orange/Yellow Flame */}
                 <div className="p-3 bg-orange-500/20 rounded-full text-orange-400">
                    <Flame size={24} fill="currentColor" />
                 </div>
                 <h3 className="font-bold text-xl uppercase tracking-wider text-slate-500 dark:text-slate-300">
                    Macros
                 </h3>
             </div>
             
             <div className="space-y-6">
                 <ProgressBar 
                   current={dailyTotal.protein} 
                   total={user.targetProtein} 
                   colorClass="bg-emerald-500" 
                   label="Protein"
                   unit="g" 
                 />
                 <ProgressBar 
                   current={dailyTotal.carbs} 
                   total={user.targetCarbs} 
                   colorClass="bg-cyan-500" 
                   label="Carbs" 
                   unit="g"
                 />
                 <ProgressBar 
                   current={dailyTotal.fat} 
                   total={user.targetFat} 
                   colorClass="bg-rose-500" 
                   label="Fat" 
                   unit="g"
                 />
             </div>
          </div>

          {/* Micros Card */}
          <div className="bg-white dark:bg-bodybyte-card p-8 rounded-[2rem] shadow-lg border border-slate-200 dark:border-slate-700/50">
             <div className="flex items-center gap-3 mb-6">
                 {/* Micros Icon: Purple Zap (Thunder) */}
                 <div className="p-3 bg-purple-600/20 rounded-full text-purple-400">
                    <Zap size={24} fill="currentColor" />
                 </div>
                 <h3 className="font-bold text-xl uppercase tracking-wider text-slate-500 dark:text-slate-300">
                    Micros
                 </h3>
             </div>
             
             <div className="space-y-6">
               <ProgressBar 
                 current={dailyTotal.fiber} 
                 total={user.targetFiber || 30} 
                 colorClass="bg-yellow-400" 
                 label="Fiber" 
                 unit="g"
               />
               <ProgressBar 
                 current={dailyTotal.calcium} 
                 total={user.targetCalcium || 1000} 
                 colorClass="bg-blue-400" 
                 label="Calcium" 
                 unit="mg"
               />
               <ProgressBar 
                 current={dailyTotal.iron} 
                 total={user.targetIron || 18} 
                 colorClass="bg-red-400" 
                 label="Iron" 
                 unit="mg"
               />
               <ProgressBar 
                 current={dailyTotal.vitC} 
                 total={user.targetVitaminC || 90} 
                 colorClass="bg-orange-400" 
                 label="Vit C" 
                 unit="mg"
               />
             </div>
          </div>
      </div>
    </div>
  );
};

export default Stats;