import React, { useState } from 'react';
import { UserProfile, Gender } from '../types';
import { calculateHealthPlan } from '../services/geminiService';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface Props { onComplete: (profile: UserProfile) => void; }

const STEPS = [
  { emoji: '👋', title: "What's your name?", sub: 'So we can personalise your experience' },
  { emoji: '🧬', title: 'About yourself', sub: 'Age and gender shape your nutrition needs' },
  { emoji: '📏', title: 'Height & Weight', sub: "We'll calculate your BMI and calorie targets" },
];

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', age: 25, gender: Gender.Male, height: 170, weight: 70 });

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const canNext = () => {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 1) return form.age > 0;
    return form.height > 0 && form.weight > 0;
  };

  const handleNext = async () => {
    if (!canNext()) return;
    if (step < 2) return setStep(step + 1);

    setLoading(true);
    try {
      const plan = await calculateHealthPlan(form.name, Number(form.age), Number(form.height), Number(form.weight), form.gender);
      onComplete({
        name: form.name, age: Number(form.age), height: Number(form.height),
        weight: Number(form.weight), gender: form.gender,
        bmi: plan.bmi || 22, targetCalories: plan.targetCalories || 2000,
        targetProtein: plan.targetProtein || 150, targetCarbs: plan.targetCarbs || 250,
        targetFat: plan.targetFat || 70, targetFiber: plan.targetFiber || 30,
        targetCalcium: plan.targetCalcium || 1000, targetIron: plan.targetIron || 18,
        targetVitaminA: plan.targetVitaminA || 900, targetVitaminC: plan.targetVitaminC || 90,
        targetWater: plan.targetWater || 2500,
      });
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bodybyte-dark text-white flex flex-col justify-center items-center">
        <LoadingSpinner />
        <p className="text-cyan-400 font-semibold mt-2">Crafting your personalised plan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bodybyte-dark text-white flex flex-col p-6">
      {/* Progress */}
      <div className="flex gap-2 mt-4 mb-8">
        {[0, 1, 2].map(i => (
          <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-cyan-400' : 'bg-slate-700'}`} />
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        {/* Illustration */}
        <div className="h-44 rounded-3xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-8">
          <span className="text-8xl">{STEPS[step].emoji}</span>
        </div>

        <h2 className="text-3xl font-bold mb-2">{STEPS[step].title}</h2>
        <p className="text-slate-400 mb-8">{STEPS[step].sub}</p>

        {step === 0 && (
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)} autoFocus
            placeholder="e.g. Rahul, Priya..."
            className="w-full bg-slate-800 border border-slate-700 focus:border-cyan-500 rounded-2xl px-5 py-5 text-xl font-medium focus:outline-none"
            onKeyDown={e => e.key === 'Enter' && handleNext()} />
        )}

        {step === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Gender</label>
              <select value={form.gender} onChange={e => set('gender', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 text-white focus:outline-none">
                {Object.values(Gender).map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Age</label>
              <input type="number" value={form.age} onChange={e => set('age', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 text-white focus:outline-none" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Height (cm)</label>
              <input type="number" value={form.height} onChange={e => set('height', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 text-white focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Weight (kg)</label>
              <input type="number" value={form.weight} onChange={e => set('weight', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 text-white focus:outline-none" />
            </div>
          </div>
        )}
      </div>

      {/* Nav Buttons */}
      <div className="flex gap-3 mt-8 max-w-md mx-auto w-full">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)}
            className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
            <ArrowLeft size={22} />
          </button>
        )}
        <button onClick={handleNext} disabled={!canNext()}
          className="flex-1 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-all">
          {step === 2 ? '✨ Create My Plan' : 'Continue'} <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
