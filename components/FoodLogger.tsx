import React, { useState, useRef, useEffect } from 'react';
import { FoodItem, SavedFood } from '../types';
import { analyzeFoodText, analyzeFoodImage } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { Camera, Search, X, Check, ChevronDown, Utensils, ArrowLeft, Loader2, Star, BookOpen } from 'lucide-react';

interface Props {
  onClose: () => void; onLog: (item: Omit<FoodItem, 'id' | 'timestamp'>) => void;
  initialMode: 'text' | 'camera'; initialMealType?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  initialData?: FoodItem; savedFoods: SavedFood[];
  onSaveFood: (food: SavedFood) => void; onDeleteSavedFood: (id: string) => void;
}

const UNITS = [
  { label: 'Piece (pcs)', value: 'pcs' }, { label: 'Katori (~150g)', value: 'katori' },
  { label: 'Bowl (~300g)', value: 'bowl' }, { label: 'Plate (~400g)', value: 'plate' },
  { label: 'Cup (~240ml)', value: 'cup' }, { label: 'Roti / Chapati', value: 'roti' },
  { label: 'Paratha', value: 'paratha' }, { label: 'Slice (~30g)', value: 'slice' },
  { label: 'Grams (g)', value: 'g' }, { label: 'Milliliters (ml)', value: 'ml' },
  { label: 'Tablespoon (tbsp)', value: 'tbsp' }, { label: 'Teaspoon (tsp)', value: 'tsp' },
];

const SUGGESTIONS = [
  "2 Roti with sabzi", "Paneer Butter Masala", "Chicken Biryani", "Masala Dosa",
  "Idli Sambhar 3 pcs", "1 Cup Chai with milk", "Oatmeal with banana",
  "2 Boiled eggs", "Rajma Chawal 1 plate", "Grilled Sandwich",
  "1 katori cooked rice", "Upma 1 bowl", "Aloo Paratha 2 pcs",
  "Dal Tadka 1 katori", "Poha 1 plate", "Pav Bhaji", "Egg Bhurji 2 eggs",
  "Protein Shake", "Curd Rice 1 katori", "Chole Bhature",
];

const TAGLINES = ["Consulting the calorie oracle...", "Analysing nutritional matrix...", "Asking the AI chef...", "Decoding your food data..."];
const MEALS = ['Breakfast', 'Lunch', 'Snack', 'Dinner'] as const;

const FoodLogger: React.FC<Props> = ({ onClose, onLog, initialMode, initialMealType, initialData, savedFoods, onSaveFood, onDeleteSavedFood }) => {
  const [mode, setMode] = useState<'text' | 'camera' | 'saved'>(initialMode);
  const [inputText, setInputText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tagline, setTagline] = useState(TAGLINES[0]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [analyzed, setAnalyzed] = useState<any>(null);
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>(initialMealType || 'Breakfast');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('pcs');
  const [rawNutr, setRawNutr] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initialData) return;
    setAnalyzed(initialData);
    setQuantity(initialData.quantity); setUnit(initialData.unit); setMealType(initialData.mealType);
    if (initialData.imageUrl) setImagePreview(initialData.imageUrl);
    const q = initialData.quantity || 1;
    const perUnit = { calories: initialData.calories / q, protein: initialData.protein / q, carbs: initialData.carbs / q, fat: initialData.fat / q, fiber: initialData.fiber / q };
    setRawNutr({ perGram: null, perOriginalUnit: perUnit });
  }, [initialData]);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setTagline(TAGLINES[Math.floor(Math.random() * TAGLINES.length)]), 2000);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    setSuggestions(inputText ? SUGGESTIONS.filter(s => s.toLowerCase().includes(inputText.toLowerCase())).slice(0, 4) : []);
  }, [inputText]);

  const processResult = (result: any) => {
    setAnalyzed(result);
    const qty = result.quantity > 0 ? result.quantity : 1;
    setQuantity(qty); setUnit(result.unit || 'pcs');
    const perGram = result.weight_g > 0
      ? { calories: result.calories / result.weight_g, protein: result.protein / result.weight_g, carbs: result.carbs / result.weight_g, fat: result.fat / result.weight_g, fiber: result.fiber / result.weight_g }
      : null;
    setRawNutr({ perGram, perOriginalUnit: { calories: result.calories / qty, protein: result.protein / qty, carbs: result.carbs / qty, fat: result.fat / qty, fiber: result.fiber / qty } });
  };

  const analyzeText = async (text?: string) => {
    const t = text || inputText;
    if (!t.trim()) return;
    setLoading(true); setAnalyzed(null);
    try { processResult(await analyzeFoodText(t)); } catch { alert('Could not analyse. Try again.'); } finally { setLoading(false); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const b64 = reader.result as string;
      setImagePreview(b64); setLoading(true); setAnalyzed(null);
      try { processResult(await analyzeFoodImage(b64.split(',')[1], file.type)); } catch { alert('Could not analyse image.'); } finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  const getDisplay = () => {
    if (!rawNutr) return null;
    const isWeight = unit === 'g' || unit === 'ml';
    const m = isWeight && rawNutr.perGram ? rawNutr.perGram : rawNutr.perOriginalUnit;
    if (!m) return null;
    return { calories: Math.round(m.calories * quantity), protein: (m.protein * quantity).toFixed(1), carbs: (m.carbs * quantity).toFixed(1), fat: (m.fat * quantity).toFixed(1), fiber: (m.fiber * quantity).toFixed(1) };
  };

  const display = getDisplay();
  const reset = () => { setImagePreview(null); setAnalyzed(null); setInputText(''); setRawNutr(null); };

  const handleConfirm = () => {
    if (!analyzed || !display) return;
    const unitLabel = UNITS.find(u => u.value === unit)?.label.split('(')[0].trim() || unit;
    onLog({ name: analyzed.name, quantity, unit, amount: `${quantity} ${unitLabel}`, calories: display.calories, protein: parseFloat(display.protein as string), carbs: parseFloat(display.carbs as string), fat: parseFloat(display.fat as string), fiber: parseFloat(display.fiber as string), mealType, imageUrl: imagePreview || undefined });
    onClose();
  };

  const handleSave = () => {
    if (!analyzed || !display) return;
    onSaveFood({ id: Date.now().toString(), name: analyzed.name, calories: display.calories, protein: parseFloat(display.protein as string), carbs: parseFloat(display.carbs as string), fat: parseFloat(display.fat as string), fiber: parseFloat(display.fiber as string), quantity, unit, amount: `${quantity} ${unit}`, savedAt: new Date().toISOString() });
  };

  const alreadySaved = savedFoods.some(s => s.name.toLowerCase() === (analyzed?.name || '').toLowerCase());

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-sm z-50 flex flex-col text-white">
      {/* Header */}
      <div className="p-4 flex items-center border-b border-slate-800 gap-4">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800"><ArrowLeft size={24} className="text-slate-400" /></button>
        <h2 className="text-lg font-semibold flex-1 text-center">{initialData ? 'Edit Log' : mode === 'saved' ? 'Quick Add' : 'Log Food'}</h2>
        {!initialData && mode !== 'saved' && (
          <button onClick={() => setMode('saved')} className="relative p-2 rounded-full hover:bg-slate-800">
            <BookOpen size={22} className="text-slate-400" />
            {savedFoods.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cyan-500 rounded-full text-[9px] flex items-center justify-center font-bold">{savedFoods.length}</span>}
          </button>
        )}
      </div>

      {/* Mode tabs */}
      {!analyzed && !loading && !initialData && mode !== 'saved' && (
        <div className="flex p-4 gap-3">
          {([['text', 'Log Meal', Utensils], ['camera', 'Snap', Camera]] as const).map(([m, label, Icon]) => (
            <button key={m} onClick={() => { setMode(m); reset(); }}
              className={`flex-1 py-3 rounded-xl font-medium flex justify-center items-center gap-2 transition-all ${mode === m ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-800 text-slate-400'}`}>
              <Icon size={17} /> {label}
            </button>
          ))}
          {savedFoods.length > 0 && (
            <button onClick={() => setMode('saved')} className="flex-1 py-3 rounded-xl font-medium flex justify-center items-center gap-2 bg-slate-800 text-slate-400 hover:text-yellow-400">
              <Star size={17} /> Saved
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {/* Loading */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <LoadingSpinner />
            <p className="text-cyan-400 animate-pulse text-center">{tagline}</p>
          </div>
        )}

        {/* Saved foods */}
        {!loading && mode === 'saved' && !analyzed && (
          <div className="space-y-4">
            <div className="flex gap-2 bg-slate-800 p-1.5 rounded-xl">
              {MEALS.map(m => <button key={m} onClick={() => setMealType(m)} className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${mealType === m ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>{m}</button>)}
            </div>
            {savedFoods.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Star size={36} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No saved foods yet</p>
                <p className="text-sm mt-1">Log a food and tap ⭐ to save it</p>
              </div>
            ) : savedFoods.map(food => (
              <div key={food.id} className="bg-slate-800 rounded-2xl p-4 flex items-center gap-3 border border-slate-700">
                <div className="flex-1">
                  <p className="font-bold">{food.name}</p>
                  <p className="text-xs text-slate-400">{food.amount} • {food.calories} cal</p>
                </div>
                <button onClick={() => onDeleteSavedFood(food.id)} className="p-2 text-slate-500 hover:text-red-400"><X size={16} /></button>
                <button onClick={() => { onLog({ ...food, mealType }); onClose(); }} className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 rounded-xl text-white text-sm font-bold">Add</button>
              </div>
            ))}
          </div>
        )}

        {/* Text search */}
        {!loading && !analyzed && mode === 'text' && (
          <div className="space-y-4">
            <div className="relative">
              <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} autoFocus
                placeholder="e.g. 2 Roti with dal, 1 cup chai..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 pr-14 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                onKeyDown={e => e.key === 'Enter' && analyzeText()} />
              <button onClick={() => analyzeText()} disabled={!inputText}
                className="absolute right-2 top-2 bottom-2 bg-cyan-600 hover:bg-cyan-500 w-11 rounded-lg flex items-center justify-center disabled:opacity-40">
                <Search size={18} />
              </button>
            </div>
            {suggestions.length > 0 && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {suggestions.map((s, i) => (
                  <div key={i} onClick={() => { setInputText(s); analyzeText(s); }}
                    className="p-3.5 border-b border-slate-700 last:border-0 hover:bg-slate-700 cursor-pointer flex items-center gap-2">
                    <Search size={13} className="text-slate-500 flex-shrink-0" />
                    <span className="text-sm">{s}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-center py-6 text-slate-500 text-sm">🍛 AI understands Indian & global cuisine.<br />Try "2 roti sabzi" or "biryani 1 plate"</p>
          </div>
        )}

        {/* Camera upload */}
        {!loading && !analyzed && mode === 'camera' && (
          !imagePreview ? (
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-700 rounded-3xl h-64 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-cyan-400"><Camera size={32} /></div>
              <p className="text-slate-300 font-medium">Tap to take photo</p>
              <p className="text-xs text-slate-500 mt-1">or upload from gallery</p>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
            </div>
          ) : (
            <div className="relative rounded-3xl overflow-hidden border border-slate-700 h-64 bg-black">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-contain opacity-80" />
              <button onClick={reset} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full hover:bg-black/80"><X size={20} /></button>
            </div>
          )
        )}

        {/* Analysis result */}
        {analyzed && !loading && (
          <div className="bg-bodybyte-card rounded-2xl p-5 border border-slate-700 animate-slide-up shadow-xl">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-xl font-bold">{analyzed.name}</h3>
                <p className="text-slate-400 text-xs mt-1">Adjust quantity if needed</p>
              </div>
              <div className="flex items-center gap-2">
                {display && <div className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-lg text-sm font-bold">{display.calories} Cal</div>}
                <button onClick={alreadySaved ? undefined : handleSave} className={`p-2 rounded-lg ${alreadySaved ? 'text-yellow-400' : 'text-slate-500 hover:text-yellow-400'}`}>
                  <Star size={20} fill={alreadySaved ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mb-5">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 mb-2">Quantity</label>
                <input type="number" min="0.1" step="0.5" value={quantity} onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div className="flex-[2]">
                <label className="block text-xs font-bold text-slate-400 mb-2">Unit</label>
                <div className="relative">
                  <select value={unit} onChange={e => { setUnit(e.target.value); setQuantity(e.target.value === 'g' || e.target.value === 'ml' ? 100 : 1); }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                    {!UNITS.find(u => u.value === unit) && <option value={unit}>{unit}</option>}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            {display && (
              <div className="grid grid-cols-4 gap-2 mb-5">
                {[{ l: 'Prot', v: display.protein, c: 'text-emerald-400' }, { l: 'Carbs', v: display.carbs, c: 'text-cyan-400' }, { l: 'Fat', v: display.fat, c: 'text-pink-400' }, { l: 'Fiber', v: display.fiber, c: 'text-yellow-400' }].map(m => (
                  <div key={m.l} className="bg-slate-800 p-2 rounded-xl text-center border border-slate-700">
                    <div className="text-[10px] text-slate-400 mb-1">{m.l}</div>
                    <div className={`${m.c} font-bold text-sm`}>{m.v}g</div>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">Meal Time</label>
              <div className="flex gap-2 bg-slate-800 p-1.5 rounded-xl">
                {MEALS.map(m => <button key={m} onClick={() => setMealType(m)} className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${mealType === m ? 'bg-slate-600 text-white shadow-lg scale-105' : 'text-slate-400 hover:text-white'}`}>{m}</button>)}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold">Cancel</button>
              <button onClick={handleConfirm} className="flex-[2] py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95">
                <Check size={22} /> {initialData ? 'Update' : 'Add Log'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodLogger;
