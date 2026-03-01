import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import FoodLogger from './components/FoodLogger';
import SignIn from './components/SignIn';
import Stats from './components/Stats';
import Profile from './components/Profile';
import { UserProfile, FoodItem, WeightEntry, SavedFood } from './types';
import { Home, BarChart2, User, Plus, LogOut, Search } from 'lucide-react';

type Tab = 'home' | 'stats' | 'profile';
type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

const todayKey = () => new Date().toISOString().split('T')[0];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<FoodItem[]>([]);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [savedFoods, setSavedFoods] = useState<SavedFood[]>([]);
  const [waterMl, setWaterMl] = useState(0);
  const [waterDate, setWaterDate] = useState(todayKey());

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showLogger, setShowLogger] = useState(false);
  const [loggerMode, setLoggerMode] = useState<'text' | 'camera'>('text');
  const [loggerMealType, setLoggerMealType] = useState<MealType>('Breakfast');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const savedUser = localStorage.getItem('bodybyte_user');
    const savedLogs = localStorage.getItem('bodybyte_logs');
    const savedAuth = localStorage.getItem('bodybyte_auth');
    const savedTheme = localStorage.getItem('bodybyte_theme');
    const savedWeight = localStorage.getItem('bodybyte_weight');
    const savedFoodsData = localStorage.getItem('bodybyte_saved_foods');
    const savedWaterMl = localStorage.getItem(`bodybyte_water_${todayKey()}`);

    if (savedAuth === 'true') setIsAuthenticated(true);
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedWeight) setWeightEntries(JSON.parse(savedWeight));
    if (savedFoodsData) setSavedFoods(JSON.parse(savedFoodsData));
    if (savedWaterMl) setWaterMl(parseInt(savedWaterMl, 10));

    const dark = savedTheme !== 'light';
    setIsDarkMode(dark);
    updateTheme(dark);
  }, []);

  // ── Persistence ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (user) localStorage.setItem('bodybyte_user', JSON.stringify(user));
    localStorage.setItem('bodybyte_logs', JSON.stringify(logs));
    localStorage.setItem('bodybyte_auth', String(isAuthenticated));
    localStorage.setItem('bodybyte_theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('bodybyte_weight', JSON.stringify(weightEntries));
    localStorage.setItem('bodybyte_saved_foods', JSON.stringify(savedFoods));
    updateTheme(isDarkMode);
  }, [user, logs, isAuthenticated, isDarkMode, weightEntries, savedFoods]);

  // Persist water daily
  useEffect(() => {
    const today = todayKey();
    if (waterDate !== today) { setWaterMl(0); setWaterDate(today); }
    localStorage.setItem(`bodybyte_water_${today}`, String(waterMl));
  }, [waterMl, waterDate]);

  const updateTheme = (dark: boolean) => {
    dark ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
  };

  // ── Streak calculation ────────────────────────────────────────────────────
  const streak = React.useMemo(() => {
    if (!logs.length) return 0;
    const logDates = new Set(logs.map(l => new Date(l.timestamp).toISOString().split('T')[0]));
    let count = 0;
    const cur = new Date();
    while (true) {
      const ds = cur.toISOString().split('T')[0];
      if (logDates.has(ds)) { count++; cur.setDate(cur.getDate() - 1); }
      else break;
    }
    return count;
  }, [logs]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSignIn = (displayName: string) => {
    setIsAuthenticated(true);
    // If no user exists yet, the onboarding will create one
    const savedUser = localStorage.getItem('bodybyte_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      // Update name from auth if needed
      if (u.name !== displayName && !u.name) setUser({ ...u, name: displayName });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setLogs([]);
    setWaterMl(0);
    setWeightEntries([]);
    setSavedFoods([]);
    localStorage.removeItem('bodybyte_user');
    localStorage.removeItem('bodybyte_logs');
    localStorage.removeItem('bodybyte_auth');
    setActiveTab('home');
  };

  const handleOnboardingComplete = (profile: UserProfile) => setUser(profile);

  const handleAddOrUpdateLog = (itemData: Omit<FoodItem, 'id' | 'timestamp'>) => {
    if (editingItem) {
      setLogs(prev => prev.map(l => l.id === editingItem.id ? { ...l, ...itemData, id: editingItem.id, timestamp: editingItem.timestamp } : l));
      setEditingItem(null);
    } else {
      setLogs(prev => [{ ...itemData, id: Date.now().toString(), timestamp: new Date() }, ...prev]);
    }
  };

  const handleDeleteLog = (id: string) => setLogs(prev => prev.filter(i => i.id !== id));

  const handleMoveLog = (id: string, newMealType: MealType) =>
    setLogs(prev => prev.map(i => i.id === id ? { ...i, mealType: newMealType } : i));

  const handleEditLog = (item: FoodItem) => {
    setEditingItem(item); setLoggerMode('text'); setLoggerMealType(item.mealType); setShowLogger(true);
  };

  const handleUpdateUser = (u: UserProfile) => setUser(u);

  const handleAddWeight = (entry: WeightEntry) => setWeightEntries(prev => [...prev, entry]);

  const handleSaveFood = (food: SavedFood) => {
    if (!savedFoods.find(s => s.name.toLowerCase() === food.name.toLowerCase()))
      setSavedFoods(prev => [...prev, food]);
  };

  const handleDeleteSavedFood = (id: string) => setSavedFoods(prev => prev.filter(f => f.id !== id));

  const openLogger = (mode: 'text' | 'camera', meal?: MealType) => {
    setEditingItem(null); setLoggerMode(mode);
    if (meal) { setLoggerMealType(meal); }
    else {
      const h = new Date().getHours();
      setLoggerMealType(h < 11 ? 'Breakfast' : h < 16 ? 'Lunch' : h < 20 ? 'Dinner' : 'Snack');
    }
    setShowLogger(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (!isAuthenticated) return <SignIn onSignIn={handleSignIn} />;
  if (!user) return <Onboarding onComplete={handleOnboardingComplete} />;

  return (
    <div className="min-h-screen font-sans selection:bg-cyan-500/30 bg-slate-50 dark:bg-bodybyte-dark transition-colors duration-300">
      <div className="flex min-h-screen relative">

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 fixed h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-30">
          <div className="p-6 flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-400">BodyByte</h1>
          </div>
          <nav className="flex-1 px-4 space-y-1 mt-2">
            {([['home', 'Home', Home], ['stats', 'Statistics', BarChart2], ['profile', 'Profile', User]] as const).map(([tab, label, Icon]) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === tab ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <Icon size={20} /> {label}
              </button>
            ))}
            <button onClick={() => openLogger('text')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Search size={20} /> Log Food
            </button>
          </nav>
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10">
              <LogOut size={20} /> Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-5 pb-24 md:p-8 overflow-y-auto min-h-screen">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'home' && user && (
              <Dashboard
                user={user} logs={logs} waterMl={waterMl} onUpdateWater={setWaterMl} streak={streak}
                onAddFood={(meal) => openLogger('text', meal)} onScanFood={() => openLogger('camera')}
                onDeleteLog={handleDeleteLog} onMoveLog={handleMoveLog} onEditLog={handleEditLog}
                onViewStats={() => setActiveTab('stats')} onOpenProfile={() => setActiveTab('profile')}
              />
            )}
            {activeTab === 'stats' && user && <Stats logs={logs} user={user} />}
            {activeTab === 'profile' && user && (
              <Profile
                user={user} onUpdateUser={handleUpdateUser} isDarkMode={isDarkMode}
                onToggleTheme={() => setIsDarkMode(!isDarkMode)} onLogout={handleLogout}
                weightEntries={weightEntries} onAddWeight={handleAddWeight}
                streak={streak} totalLogsCount={logs.length}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-24 right-6 z-20">
        <button onClick={() => openLogger('text')} className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/40 flex items-center justify-center text-white transform transition-transform hover:scale-110 active:scale-95 border-2 border-white dark:border-bodybyte-dark">
          <Plus size={28} />
        </button>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-bodybyte-dark/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 z-10 transition-colors duration-300">
        <div className="flex justify-around items-center h-16 px-2">
          {([['home', 'Home', Home], ['stats', 'Stats', BarChart2], ['profile', 'Profile', User]] as const).map(([tab, label, Icon], i) => (
            <React.Fragment key={tab}>
              {i === 1 && <div className="w-16" />}
              <button onClick={() => setActiveTab(tab)} className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${activeTab === tab ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`}>
                <Icon size={22} />
                <span className="text-[10px] mt-0.5 font-medium">{label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      </nav>

      {/* Food Logger Modal */}
      {showLogger && (
        <FoodLogger
          onClose={() => { setShowLogger(false); setEditingItem(null); }}
          onLog={handleAddOrUpdateLog}
          initialMode={loggerMode} initialMealType={loggerMealType} initialData={editingItem || undefined}
          savedFoods={savedFoods} onSaveFood={handleSaveFood} onDeleteSavedFood={handleDeleteSavedFood}
        />
      )}
    </div>
  );
};

export default App;
