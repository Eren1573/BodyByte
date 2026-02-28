import React, { useState } from 'react';
import { UserProfile, Gender } from '../types';
import { calculateHealthPlan } from '../services/geminiService';
import { ArrowRight } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: 25,
    gender: Gender.Male,
    height: 170,
    weight: 70
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const plan = await calculateHealthPlan(
        formData.name,
        Number(formData.age),
        Number(formData.height),
        Number(formData.weight),
        formData.gender
      );

      const fullProfile: UserProfile = {
        name: formData.name,
        age: Number(formData.age),
        height: Number(formData.height),
        weight: Number(formData.weight),
        gender: formData.gender,
        bmi: plan.bmi || 22,
        targetCalories: plan.targetCalories || 2000,
        targetProtein: plan.targetProtein || 150,
        targetCarbs: plan.targetCarbs || 250,
        targetFat: plan.targetFat || 70,
        targetFiber: plan.targetFiber || 30,
        targetCalcium: plan.targetCalcium || 1000,
        targetIron: plan.targetIron || 18,
        targetVitaminA: plan.targetVitaminA || 900,
        targetVitaminC: plan.targetVitaminC || 90,
      };

      onComplete(fullProfile);
    } catch (error) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bodybyte-dark text-white flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <img 
            src="/logo.png" 
            alt="BodyByte Logo" 
            className="w-20 h-20 mx-auto mb-6 object-contain drop-shadow-lg"
          />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-2">
            Welcome to BodyByte
          </h1>
          <p className="text-slate-400">Nutrition in every byte.</p>
        </div>

        <div className="bg-bodybyte-card p-8 rounded-3xl shadow-xl border border-slate-700/50 backdrop-blur-sm min-h-[400px] flex flex-col justify-center">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full">
               <LoadingSpinner />
               <p className="text-cyan-400 font-medium mt-4">AI is crafting your plan...</p>
             </div>
          ) : (
            <>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                    placeholder="e.g. Rahul"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value={Gender.Male}>Male</option>
                      <option value={Gender.Female}>Female</option>
                      <option value={Gender.Other}>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!formData.name}
                className="w-full mt-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create My Plan <ArrowRight size={20} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;