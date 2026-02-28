import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import FoodLogger from './components/FoodLogger';
import SignIn from './components/SignIn';
import Stats from './components/Stats';
import Profile from './components/Profile';
// import logo from './assets/logo.png'; // TODO: Add logo.png to assets folder
import { UserProfile, FoodItem } from './types';
import { Home, Camera, BarChart2, User, Plus, LogOut, Search } from 'lucide-react';

type Tab = 'home' | 'snap' | 'stats' | 'profile';
type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

const App: React.FC = () => {
  // Global State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<FoodItem[]>([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showLogger, setShowLogger] = useState(false);
  const [loggerMode, setLoggerMode] = useState<'text' | 'camera'>('text');
  const [loggerMealType, setLoggerMealType] = useState<MealType>('Breakfast'); // Default
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Edit State
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);

  // Initialization
  useEffect(() => {
    const savedUser = localStorage.getItem('bodybyte_user');
    const savedLogs = localStorage.getItem('bodybyte_logs');
    const savedAuth = localStorage.getItem('bodybyte_auth');
    const savedTheme = localStorage.getItem('bodybyte_theme');

    if (savedAuth === 'true') setIsAuthenticated(true);
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    
    // Theme logic
    const theme = savedTheme === 'light' ? false : true; // Default dark
    setIsDarkMode(theme);
    updateThemeClass(theme);

  }, []);

  // Persistence
  useEffect(() => {
    if (user) localStorage.setItem('bodybyte_user', JSON.stringify(user));
    if (logs) localStorage.setItem('bodybyte_logs', JSON.stringify(logs));
    localStorage.setItem('bodybyte_auth', String(isAuthenticated));
    localStorage.setItem('bodybyte_theme', isDarkMode ? 'dark' : 'light');
    updateThemeClass(isDarkMode);
  }, [user, logs, isAuthenticated, isDarkMode]);

  const updateThemeClass = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSignIn = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setLogs([]);
    localStorage.clear();
    setActiveTab('home');
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUser(profile);
  };

  const handleAddOrUpdateLog = (itemData: Omit<FoodItem, 'id' | 'timestamp'>) => {
    if (editingItem) {
      // Update existing log
      setLogs(prev => prev.map(log => 
        log.id === editingItem.id 
          ? { ...log, ...itemData, id: editingItem.id, timestamp: editingItem.timestamp } // Keep original ID and timestamp
          : log
      ));
      setEditingItem(null);
    } else {
      // Create new log
      const newItem: FoodItem = {
        ...itemData,
        id: Date.now().toString(),
        timestamp: new Date()
      };
      setLogs(prev => [newItem, ...prev]);
    }
  };

  const handleDeleteLog = (id: string) => {
    setLogs(prev => prev.filter(item => item.id !== id));
  };

  const handleMoveLog = (id: string, newMealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack') => {
    setLogs(prev => prev.map(item => 
      item.id === id ? { ...item, mealType: newMealType } : item
    ));
  };
  
  const handleEditLog = (item: FoodItem) => {
      setEditingItem(item);
      setLoggerMode('text'); // Force text/edit mode view
      setLoggerMealType(item.mealType);
      setShowLogger(true);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  const openLogger = (mode: 'text' | 'camera', specificMealType?: MealType) => {
    setEditingItem(null); // Clear editing state when opening fresh
    setLoggerMode(mode);
    // If a specific meal is requested (e.g. clicking + on Lunch), use it. Otherwise default to Breakfast or current time logic.
    if (specificMealType) {
        setLoggerMealType(specificMealType);
    } else {
        // Simple time based default
        const hour = new Date().getHours();
        if (hour < 11) setLoggerMealType('Breakfast');
        else if (hour < 16) setLoggerMealType('Lunch');
        else if (hour < 20) setLoggerMealType('Dinner');
        else setLoggerMealType('Snack');
    }
    setShowLogger(true);
  };

  // ---------------- Render Logic ----------------

  // 1. Sign In Screen
  if (!isAuthenticated) {
    return <SignIn onSignIn={handleSignIn} />;
  }

  // 2. Onboarding Screen
  if (!user) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // 3. Main App Layout (Responsive)
  return (
    <div className="min-h-screen font-sans selection:bg-cyan-500/30 bg-slate-50 dark:bg-bodybyte-dark transition-colors duration-300">
      
      <div className="flex min-h-screen relative">
        
        {/* DESKTOP SIDEBAR (Hidden on mobile) */}
        <aside className="hidden md:flex flex-col w-64 fixed h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-30">
           <div className="p-6 flex items-center gap-3">
              {/* <img src={logo} alt="BodyByte" className="h-8 w-8" /> */}
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-400">
                BodyByte
              </h1>
           </div>

           <nav className="flex-1 px-4 space-y-2 mt-4">
              <button onClick={() => setActiveTab('home')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'home' ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                 <Home size={20} /> Home
              </button>
              <button onClick={() => openLogger('text')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800`}>
                 <Search size={20} /> Log Food
              </button>
              <button onClick={() => setActiveTab('stats')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'stats' ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                 <BarChart2 size={20} /> Statistics
              </button>
              <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'profile' ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                 <User size={20} /> Profile
              </button>
           </nav>

           <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10">
                 <LogOut size={20} /> Sign Out
              </button>
           </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 md:ml-64 p-5 pb-24 md:p-8 overflow-y-auto min-h-screen">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'home' && (
              <Dashboard
                user={user}
                logs={logs}
                onAddFood={(mealType) => openLogger('text', mealType)}
                onScanFood={() => openLogger('camera')}
                onDeleteLog={handleDeleteLog}
                onMoveLog={handleMoveLog}
                onEditLog={handleEditLog}
                onViewStats={() => setActiveTab('stats')}
                onOpenProfile={() => setActiveTab('profile')}
              />
            )}
            
            {activeTab === 'stats' && (
              <Stats logs={logs} user={user} />
            )}

            {activeTab === 'profile' && (
              <Profile 
                  user={user} 
                  onUpdateUser={handleUpdateUser}
                  isDarkMode={isDarkMode}
                  onToggleTheme={() => setIsDarkMode(!isDarkMode)}
                  onLogout={handleLogout}
              />
            )}
          </div>
        </main>
      </div>

      {/* MOBILE FAB (Floating Action Button) */}
      <div className="md:hidden fixed bottom-24 right-6 z-20">
          <button
            onClick={() => openLogger('text')}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/40 flex items-center justify-center text-white transform transition-transform hover:scale-110 active:scale-95 border-2 border-white dark:border-bodybyte-dark"
          >
            <Plus size={28} />
          </button>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-bodybyte-dark/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 z-10 pb-safe transition-colors duration-300">
          <div className="flex justify-around items-center h-16 px-2">
            <button 
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${activeTab === 'home' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`}
            >
              <Home size={24} />
              <span className="text-[10px] mt-1 font-medium">Home</span>
            </button>
            
            <button 
              onClick={() => openLogger('text')} 
              className={`flex flex-col items-center justify-center w-16 h-full transition-colors mr-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300`}
            >
              <Search size={24} />
              <span className="text-[10px] mt-1 font-medium">Log Food</span>
            </button>

            <button 
              onClick={() => setActiveTab('stats')}
              className={`flex flex-col items-center justify-center w-16 h-full transition-colors ml-8 ${activeTab === 'stats' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`}
            >
              <BarChart2 size={24} />
              <span className="text-[10px] mt-1 font-medium">Stats</span>
            </button>

            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${activeTab === 'profile' ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`}
            >
              <User size={24} />
              <span className="text-[10px] mt-1 font-medium">Profile</span>
            </button>
          </div>
      </nav>

      {/* Full Screen Logger Modal */}
      {showLogger && (
        <FoodLogger
          onClose={() => setShowLogger(false)}
          onLog={handleAddOrUpdateLog}
          initialMode={loggerMode}
          initialMealType={loggerMealType}
          initialData={editingItem || undefined}
        />
      )}
    </div>
  );
};

export default App;