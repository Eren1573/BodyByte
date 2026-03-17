import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { AuthUser } from '../types';

// Simple hash to avoid plain-text passwords in localStorage
const hash = (str: string) => btoa(str + '_bb_salt');

const getUsers = (): AuthUser[] => JSON.parse(localStorage.getItem('bodybyte_users') || '[]');
const saveUsers = (u: AuthUser[]) => localStorage.setItem('bodybyte_users', JSON.stringify(u));

interface Props { onSignIn: (name: string) => void; }

const SignIn: React.FC<Props> = ({ onSignIn }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');
    if (!email || !password) return setError('Please fill in all fields.');
    if (mode === 'signup' && !name) return setError('Please enter your name.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    const users = getUsers();
    const h = hash(email + password);

    if (mode === 'signup') {
      if (users.find(u => u.email === email)) return setError('Account already exists.');
      saveUsers([...users, { email, passwordHash: h, displayName: name }]);
      onSignIn(name);
    } else {
      const user = users.find(u => u.email === email);
      if (!user) return setError('No account found with this email.');
      if (user.passwordHash !== h) return setError('Incorrect password.');
      onSignIn(user.displayName);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-bodybyte-dark flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <img src="/logo.png" alt="BodyByte" className="w-24 h-24 mx-auto mb-4 object-contain drop-shadow-2xl" />
          <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-1">BodyByte</h1>
          <p className="text-slate-500">Nutrition in every byte.</p>
        </div>

        <div className="bg-white dark:bg-bodybyte-card p-8 rounded-3xl shadow-2xl border dark:border-slate-700/50">
          {/* Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 mb-6">
            {(['signin', 'signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === m ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your Name"
                  className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl pl-11 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/30" />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
                className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl pl-11 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 6)"
                className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl pl-11 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <button onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-transform mt-1">
              {mode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
