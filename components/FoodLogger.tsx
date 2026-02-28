import React, { useState, useRef, useEffect } from 'react';
import { FoodItem } from '../types';
import { analyzeFoodText, analyzeFoodImage } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { Camera, Search, X, Check, Image as ImageIcon, ChevronDown, Utensils, ArrowLeft, Loader2 } from 'lucide-react';

interface FoodLoggerProps {
  onClose: () => void;
  onLog: (item: Omit<FoodItem, 'id' | 'timestamp'>) => void;
  initialMode: 'text' | 'camera';
  initialMealType?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  initialData?: FoodItem; // For editing
}

const COMMON_UNITS = [
  { label: 'Piece(pcs)', value: 'pcs' },
  { label: 'Bowl(~300g)', value: 'bowl' },
  { label: 'Plate(~400g)', value: 'plate' },
  { label: 'Cup(~240ml)', value: 'cup' },
  { label: 'Grams(g)', value: 'g' },
  { label: 'Milliliters(ml)', value: 'ml' },
  { label: 'Tablespoon(tbsp)', value: 'tbsp' },
  { label: 'Teaspoon(tsp)', value: 'tsp' },
  { label: 'Slice(~30g)', value: 'slice' },
  { label: 'Ounce(oz)', value: 'oz' }
];

const SUGGESTIONS = [
    "2 Chapathi's ", "Paneer Butter Masala", "Chicken Biryani", "Masala Dosa", 
    "Idli Sambhar", "1 Cup Chai", "Oatmeal with Milk", "Boiled Eggs", 
    "Rajma Chawal", "Grilled Sandwich", "Cooked white Rice", "Upma", "Fruit Salad", 
    "Protein Shake", "Rice and Curd", "Chole Bhature"
];

const LOADING_TAGLINES = [
    "Consulting the calorie oracle...",
    "Decoding your delicious data...",
    "Calculating crunchiness levels...",
    "Analyzing nutritional matrix...",
    "Scanning for hidden proteins...",
    "Weighing the digital carbs...",
    "Asking the AI chef..."
];

const FoodLogger: React.FC<FoodLoggerProps> = ({ onClose, onLog, initialMode, initialMealType, initialData }) => {
  const [mode, setMode] = useState<'text' | 'camera'>(initialMode);
  const [inputText, setInputText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTagline, setLoadingTagline] = useState("Loading...");
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  
  // Analysis State
  const [analyzedItem, setAnalyzedItem] = useState<Omit<FoodItem, 'id' | 'timestamp' | 'mealType' | 'amount'> & { weight_g?: number } | null>(null);
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>(initialMealType || 'Breakfast');
  
  // Edit State
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('pcs');
  
  // Nutrition State (Source of Truth)
  const [rawNutrition, setRawNutrition] = useState<{
      total: {calories: number, protein: number, carbs: number, fat: number, fiber: number, micros?: any},
      perGram: {calories: number, protein: number, carbs: number, fat: number, fiber: number, micros?: any} | null,
      perOriginalUnit: {calories: number, protein: number, carbs: number, fat: number, fiber: number, micros?: any} | null
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize for editing if data exists
  useEffect(() => {
    if (initialData) {
        setAnalyzedItem({
            name: initialData.name,
            quantity: initialData.quantity,
            unit: initialData.unit,
            calories: initialData.calories,
            protein: initialData.protein,
            carbs: initialData.carbs,
            fat: initialData.fat,
            fiber: initialData.fiber,
            micros: initialData.micros,
            // Note: We don't have weight_g persisted in legacy items, so perGram logic might be limited for edits unless re-analyzed
        });
        setQuantity(initialData.quantity);
        setUnit(initialData.unit);
        setMealType(initialData.mealType);
        if (initialData.imageUrl) setImagePreview(initialData.imageUrl);

        // Reverse calculate base nutrition per unit (we assume original save was accurate)
        const q = initialData.quantity || 1;
        const perUnit = {
            calories: initialData.calories / q,
            protein: initialData.protein / q,
            carbs: initialData.carbs / q,
            fat: initialData.fat / q,
            fiber: initialData.fiber / q,
            micros: initialData.micros ? {
                calcium: initialData.micros.calcium ? initialData.micros.calcium / q : 0,
                iron: initialData.micros.iron ? initialData.micros.iron / q : 0,
                vitaminA: initialData.micros.vitaminA ? initialData.micros.vitaminA / q : 0,
                vitaminC: initialData.micros.vitaminC ? initialData.micros.vitaminC / q : 0,
            } : undefined
        };

        setRawNutrition({
            total: { ...initialData, micros: initialData.micros }, // technically total is current logs total
            perGram: null, // Cannot infer weight from legacy data safely
            perOriginalUnit: perUnit
        });
    }
  }, [initialData]);

  // Random Tagline Logic
  useEffect(() => {
    if (loading && mode === 'camera') {
        const randomTag = LOADING_TAGLINES[Math.floor(Math.random() * LOADING_TAGLINES.length)];
        setLoadingTagline(randomTag);
        const interval = setInterval(() => {
             const nextTag = LOADING_TAGLINES[Math.floor(Math.random() * LOADING_TAGLINES.length)];
             setLoadingTagline(nextTag);
        }, 2000);
        return () => clearInterval(interval);
    }
  }, [loading, mode]);

  useEffect(() => {
    if (inputText) {
        const matches = SUGGESTIONS.filter(s => s.toLowerCase().includes(inputText.toLowerCase()));
        setFilteredSuggestions(matches.slice(0, 3));
    } else {
        setFilteredSuggestions([]);
    }
  }, [inputText]);

  const processAnalysisResult = (result: any) => {
    setAnalyzedItem(result);
    const qty = result.quantity && result.quantity > 0 ? result.quantity : 1;
    setQuantity(qty);
    setUnit(result.unit || 'pcs');
    
    // Calculate derived nutrition metrics
    const total = {
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        fiber: result.fiber,
        micros: result.micros
    };

    let perGram = null;
    if (result.weight_g && result.weight_g > 0) {
        perGram = {
            calories: total.calories / result.weight_g,
            protein: total.protein / result.weight_g,
            carbs: total.carbs / result.weight_g,
            fat: total.fat / result.weight_g,
            fiber: total.fiber / result.weight_g,
            micros: total.micros ? {
                calcium: total.micros.calcium / result.weight_g,
                iron: total.micros.iron / result.weight_g,
                vitaminA: total.micros.vitaminA / result.weight_g,
                vitaminC: total.micros.vitaminC / result.weight_g
            } : undefined
        };
    }

    const perOriginalUnit = {
        calories: total.calories / qty,
        protein: total.protein / qty,
        carbs: total.carbs / qty,
        fat: total.fat / qty,
        fiber: total.fiber / qty,
        micros: total.micros ? {
            calcium: total.micros.calcium / qty,
            iron: total.micros.iron / qty,
            vitaminA: total.micros.vitaminA / qty,
            vitaminC: total.micros.vitaminC / qty
        } : undefined
    };

    setRawNutrition({
        total,
        perGram,
        perOriginalUnit
    });
  };

  const handleTextAnalyze = async (textOverride?: string) => {
    const textToAnalyze = textOverride || inputText;
    if (!textToAnalyze.trim()) return;
    setLoading(true);
    setAnalyzedItem(null);
    try {
      const result = await analyzeFoodText(textToAnalyze);
      processAnalysisResult(result);
    } catch (e) {
      alert('Could not analyze text. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setLoading(true);
        setAnalyzedItem(null);
        try {
          const base64Data = base64String.split(',')[1];
          const result = await analyzeFoodImage(base64Data, file.type);
          processAnalysisResult(result);
        } catch (error) {
           console.error(error);
           alert("Could not analyze image.");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculate current display values based on selected unit
  const getDisplayNutrition = () => {
      if (!rawNutrition) return null;

      const isWeightUnit = unit === 'g' || unit === 'ml';
      
      // If user selected grams/ml and we have perGram data, use it
      if (isWeightUnit && rawNutrition.perGram) {
          const m = rawNutrition.perGram;
          return {
            calories: Math.round(m.calories * quantity),
            protein: (m.protein * quantity).toFixed(1),
            carbs: (m.carbs * quantity).toFixed(1),
            fat: (m.fat * quantity).toFixed(1),
            fiber: (m.fiber * quantity).toFixed(1),
            micros: m.micros ? {
                calcium: m.micros.calcium * quantity,
                iron: m.micros.iron * quantity,
                vitaminA: m.micros.vitaminA * quantity,
                vitaminC: m.micros.vitaminC * quantity,
            } : undefined
          };
      }
      
      // Fallback: Use perOriginalUnit scaling
      // This applies if unit is original unit (e.g. bowl) or if we lack weight data
      if (rawNutrition.perOriginalUnit) {
           const m = rawNutrition.perOriginalUnit;
           return {
            calories: Math.round(m.calories * quantity),
            protein: (m.protein * quantity).toFixed(1),
            carbs: (m.carbs * quantity).toFixed(1),
            fat: (m.fat * quantity).toFixed(1),
            fiber: (m.fiber * quantity).toFixed(1),
            micros: m.micros ? {
                calcium: m.micros.calcium * quantity,
                iron: m.micros.iron * quantity,
                vitaminA: m.micros.vitaminA * quantity,
                vitaminC: m.micros.vitaminC * quantity,
            } : undefined
          };
      }
      
      return null;
  };

  const displayNutrition = getDisplayNutrition();

  const handleConfirm = () => {
    if (analyzedItem && displayNutrition) {
      // Find label for selected unit to display e.g. "Bowl (~300g)" instead of just "bowl"
      const unitObj = COMMON_UNITS.find(u => u.value === unit);
      const displayUnit = unitObj ? unitObj.label : unit;
      
      // Parse values back from display strings
      const finalItem = {
        name: analyzedItem.name,
        quantity: quantity,
        unit: unit,
        amount: `${quantity} ${unitObj ? unitObj.label.split('(')[0].trim() : unit}`, 
        displayAmount: `${quantity} x ${displayUnit}`, 
        calories: displayNutrition.calories,
        protein: parseFloat(displayNutrition.protein as string),
        carbs: parseFloat(displayNutrition.carbs as string),
        fat: parseFloat(displayNutrition.fat as string),
        fiber: parseFloat(displayNutrition.fiber as string),
        micros: displayNutrition.micros,
        mealType,
        imageUrl: imagePreview || undefined
      };
      
      onLog(finalItem);
      onClose();
    }
  };

  const reset = () => {
    setImagePreview(null);
    setAnalyzedItem(null);
    setInputText('');
    setRawNutrition(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 dark:bg-bodybyte-dark/95 backdrop-blur-sm z-50 flex flex-col animate-fade-in text-white">
      {/* Header */}
      <div className="p-4 flex items-center border-b border-slate-800 gap-4">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 transition-colors">
          <ArrowLeft size={24} className="text-slate-400" />
        </button>
        <h2 className="text-lg font-semibold flex-1 text-center mr-10">{initialData ? 'Edit Food Log' : 'Log Food'}</h2>
      </div>

      {/* Tabs - Only show when not analyzing result and not loading AND not editing */}
      {!analyzedItem && !loading && !initialData && (
        <div className="flex p-4 gap-4">
          <button
            onClick={() => { setMode('text'); reset(); }}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors flex justify-center items-center gap-2 ${mode === 'text' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-800 text-slate-400'}`}
          >
            <Utensils size={18} /> Log Meal
          </button>
          <button
            onClick={() => { setMode('camera'); reset(); }}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors flex justify-center items-center gap-2 ${mode === 'camera' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-800 text-slate-400'}`}
          >
            <Camera size={18} /> Snap
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {loading && mode === 'camera' ? (
            <div className="flex-1 flex flex-col items-center justify-center animate-fade-in gap-6">
                <LoadingSpinner />
                <p className="text-cyan-400 text-lg font-medium animate-pulse text-center px-4">
                    {loadingTagline}
                </p>
            </div>
        ) : !analyzedItem ? (
          mode === 'text' ? (
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={inputText}
                  disabled={loading}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="e.g. 2 Paneer Paratha with curd"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                  onKeyDown={(e) => e.key === 'Enter' && handleTextAnalyze()}
                />
                <button
                  onClick={() => handleTextAnalyze()}
                  disabled={!inputText || loading}
                  className="absolute right-2 top-2 bottom-2 bg-cyan-600 hover:bg-cyan-500 text-white w-12 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                </button>
              </div>
              
              {/* Recommendations List */}
              {filteredSuggestions.length > 0 && !loading && (
                  <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                      {filteredSuggestions.map((s, idx) => (
                          <div 
                            key={idx}
                            onClick={() => { setInputText(s); handleTextAnalyze(s); }}
                            className="p-3 border-b border-slate-700 last:border-0 hover:bg-slate-700 cursor-pointer flex items-center gap-2"
                          >
                             <Search size={14} className="text-slate-400" />
                             <span className="text-sm">{s}</span>
                          </div>
                      ))}
                  </div>
              )}

              <p className="text-lg font-medium text-slate-400 text-center mt-6">
                Type any food description. Our AI understands Indian cuisine perfectly. 🍛 🥘 🥗
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {!imagePreview ? (
                 <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 rounded-3xl h-64 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all"
                 >
                   <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-cyan-400">
                      <Camera size={32} />
                   </div>
                   <p className="text-slate-300 font-medium">Tap to take photo</p>
                   <p className="text-xs text-slate-500 mt-2">or upload from gallery</p>
                   <input
                     ref={fileInputRef}
                     type="file"
                     accept="image/*"
                     capture="environment"
                     onChange={handleImageUpload}
                     className="hidden"
                   />
                 </div>
              ) : (
                <div className="relative rounded-3xl overflow-hidden border border-slate-700 h-64 bg-black">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain opacity-80" />
                  <button
                    onClick={reset}
                    className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-black/80"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>
          )
        ) : (
          /* Analysis Result View */
          <div className="bg-bodybyte-card rounded-2xl p-5 border border-slate-700 animate-slide-up shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-slate-600 hover:scale-[1.01]">
             <div className="flex justify-between items-start mb-6">
               <div>
                  <h3 className="text-xl font-bold text-white">{analyzedItem.name}</h3>
                  <p className="text-slate-400 text-xs mt-1">Adjust quantity if needed</p>
               </div>
               {displayNutrition && (
                 <div className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-lg text-sm font-bold shadow-sm">
                   {displayNutrition.calories} Cal
                 </div>
               )}
             </div>

             {/* Quantity and Unit Selectors */}
             <div className="flex gap-3 mb-6">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-400 mb-2">Quantity</label>
                  <input 
                    type="number" 
                    min="0.1" 
                    step="0.5"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-inner"
                  />
                </div>
                <div className="flex-[2]">
                   <label className="block text-sm font-bold text-slate-400 mb-2">Unit</label>
                   <div className="relative">
                     <select 
                        value={unit}
                        onChange={(e) => {
                             setUnit(e.target.value);
                             // When switching TO grams/ml from a non-weight unit, defaults to 100g if appropriate, or keep 1
                             if (e.target.value === 'g' || e.target.value === 'ml') {
                                 setQuantity(100); 
                             } else {
                                 setQuantity(1);
                             }
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white text-base font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-inner"
                     >
                       {COMMON_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                       {!COMMON_UNITS.find(u => u.value === unit) && <option value={unit}>{unit}</option>}
                     </select>
                     <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                   </div>
                </div>
             </div>

             {displayNutrition && (
               <div className="grid grid-cols-4 gap-2 mb-6 text-center">
                  <div className="bg-slate-800 p-2 rounded-xl border border-slate-700 hover:bg-slate-750 transition-colors hover:border-emerald-500/30">
                    <div className="text-xs text-slate-400 mb-1">Prot</div>
                    <div className="text-emerald-400 font-bold">{displayNutrition.protein}g</div>
                  </div>
                  <div className="bg-slate-800 p-2 rounded-xl border border-slate-700 hover:bg-slate-750 transition-colors hover:border-cyan-500/30">
                    <div className="text-xs text-slate-400 mb-1">Carbs</div>
                    <div className="text-cyan-400 font-bold">{displayNutrition.carbs}g</div>
                  </div>
                  <div className="bg-slate-800 p-2 rounded-xl border border-slate-700 hover:bg-slate-750 transition-colors hover:border-pink-500/30">
                    <div className="text-xs text-slate-400 mb-1">Fat</div>
                    <div className="text-pink-400 font-bold">{displayNutrition.fat}g</div>
                  </div>
                  <div className="bg-slate-800 p-2 rounded-xl border border-slate-700 hover:bg-slate-750 transition-colors hover:border-yellow-500/30">
                    <div className="text-xs text-slate-400 mb-1">Fiber</div>
                    <div className="text-yellow-400 font-bold">{displayNutrition.fiber}g</div>
                  </div>
               </div>
             )}

             <div className="mb-8">
                <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">Meal Time</label>
                <div className="flex gap-2 bg-slate-800 p-2 rounded-xl">
                   {(['Breakfast', 'Lunch', 'Snack', 'Dinner'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setMealType(m)}
                        className={`flex-1 py-3 px-2 text-sm font-bold rounded-lg transition-all ${mealType === m ? 'bg-slate-600 text-white shadow-lg scale-105 ring-2 ring-slate-500/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
                      >
                        {m}
                      </button>
                   ))}
                </div>
             </div>

             <div className="flex gap-3">
               <button 
                 onClick={onClose}
                 className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors"
               >
                 Cancel
               </button>
               <button
                 onClick={handleConfirm}
                 className="flex-[2] py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95 hover:shadow-emerald-500/40"
               >
                 <Check size={24} /> {initialData ? 'Update Log' : 'Add Log'}
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodLogger;