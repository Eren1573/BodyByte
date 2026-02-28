import React, { useState, useEffect } from 'react';
import { UserProfile, Gender } from '../types';
import { User, Moon, Sun, Ruler, Weight, Save, LogOut, ChevronRight } from 'lucide-react';
import { calculateHealthPlan } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface ProfileProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
}

const UPDATING_TAGLINES = [
    "Recalibrating biometrics...",
    "Optimizing metabolic path...",
    " adjusting daily targets...",
    "Re-analyzing nutritional needs...",
    "Updating your data...",
    "Making final checks..."
];

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, isDarkMode, onToggleTheme, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...user });
  
  // Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTagline, setLoadingTagline] = useState(UPDATING_TAGLINES[0]);

  // Cycle taglines during loading
  useEffect(() => {
    if (isLoading) {
        setLoadingTagline(UPDATING_TAGLINES[0]);
        const interval = setInterval(() => {
             setLoadingTagline(prev => {
                 const currentIndex = UPDATING_TAGLINES.indexOf(prev);
                 return UPDATING_TAGLINES[(currentIndex + 1) % UPDATING_TAGLINES.length];
             });
        }, 1500);
        return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
        // Call AI to recalculate everything based on new stats
        const newPlan = await calculateHealthPlan(
            formData.name,
            formData.age,
            formData.height,
            formData.weight,
            formData.gender
        );

        const updatedUser: UserProfile = {
            ...formData, // Keep name, age, gender, etc.
            bmi: newPlan.bmi || 22, // Update derived stats
            targetCalories: newPlan.targetCalories || 2000,
            targetProtein: newPlan.targetProtein || 150,
            targetCarbs: newPlan.targetCarbs || 250,
            targetFat: newPlan.targetFat || 70,
            targetFiber: newPlan.targetFiber || 30,
            targetCalcium: newPlan.targetCalcium || 1000,
            targetIron: newPlan.targetIron || 18,
            targetVitaminA: newPlan.targetVitaminA || 900,
            targetVitaminC: newPlan.targetVitaminC || 90,
        };

        onUpdateUser(updatedUser);
        setIsEditing(false);
    } catch (error) {
        console.error("Failed to update profile plan", error);
        // Fallback: just update the local values if AI fails, recalculate BMI locally
        const heightM = formData.height / 100;
        const newBmi = parseFloat((formData.weight / (heightM * heightM)).toFixed(1));
        onUpdateUser({
            ...formData,
            bmi: newBmi
        });
        setIsEditing(false);
    } finally {
        setIsLoading(false);
    }
  };

  if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
            <LoadingSpinner />
            <p className="text-cyan-500 font-medium text-lg mt-6 animate-pulse px-4 text-center">
                {loadingTagline}
            </p>
        </div>
      );
  }

  return (
    <div className="animate-fade-in text-slate-900 dark:text-white max-w-2xl mx-auto">
      <header className="mb-8 flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold">Profile</h2>
           <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your settings</p>
        </div>
      </header>

      <div className="bg-white dark:bg-bodybyte-card p-6 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700/50 relative mb-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 border-4 border-white dark:border-bodybyte-card flex items-center justify-center text-4xl font-bold text-cyan-600 dark:text-cyan-400 shadow-sm">
                {user.name.charAt(0)}
            </div>
            
            <div className="text-center md:text-left flex-1">
                <h3 className="text-2xl font-bold">{user.name}</h3>
                <p className="text-slate-500 text-sm mt-1">{user.gender} • {user.age} years old</p>
                <div className="mt-4 flex gap-4 justify-center md:justify-start">
                     <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
                        <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">Height</span>
                        <span className="font-bold text-lg">{user.height} cm</span>
                     </div>
                     <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl">
                        <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">Weight</span>
                        <span className="font-bold text-lg">{user.weight} kg</span>
                     </div>
                </div>
            </div>
            
            <button 
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md ${isEditing ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50'}`}
            >
                {isEditing ? <><Save size={18} /> Save</> : 'Edit'}
            </button>
        </div>

        {isEditing && (
             <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
                 <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Height (cm)</label>
                    <input 
                      type="number" 
                      value={formData.height} 
                      onChange={(e) => setFormData({...formData, height: Number(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Weight (kg)</label>
                    <input 
                      type="number" 
                      value={formData.weight} 
                      onChange={(e) => setFormData({...formData, weight: Number(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                    />
                 </div>
             </div>
        )}
      </div>

      <div className="space-y-3">
          <button 
             onClick={onToggleTheme}
             className="w-full bg-white dark:bg-bodybyte-card p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm group"
          >
             <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                     {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                 </div>
                 <span className="font-semibold">Appearance</span>
             </div>
             <div className="flex items-center gap-2">
                 <span className="text-sm text-slate-500">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
                 <ChevronRight size={18} className="text-slate-400" />
             </div>
          </button>

          <button 
             onClick={onLogout}
             className="w-full bg-white dark:bg-bodybyte-card p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors shadow-sm group"
          >
             <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                     <LogOut size={20} />
                 </div>
                 <span className="font-semibold text-red-500">Log Out</span>
             </div>
             <ChevronRight size={18} className="text-red-300" />
          </button>
      </div>

      <p className="text-center text-slate-400 text-xs mt-8">BodyByte v1.2.0</p>
    </div>
  );
};

export default Profile;