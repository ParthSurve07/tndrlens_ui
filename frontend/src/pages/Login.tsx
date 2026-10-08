import React, { useState } from 'react';
import { api } from '../services/api';
import { FileText, Lock, User, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
  onGoToRegister: () => void;
  onGoToLanding: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onGoToRegister, onGoToLanding }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.login(username, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Incorrect username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative select-none">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <button onClick={onGoToLanding} className="bg-indigo-600 text-white p-3 rounded-2xl flex items-center justify-center hover:scale-105 transition-transform duration-200">
            <FileText size={24} />
          </button>
          <h2 className="text-xl font-bold mt-4 text-slate-100">Welcome Back</h2>
          <p className="text-xs text-slate-400 mt-1">Sign in to your Tndrlens dashboard</p>
        </div>

        {error && (
          <div className="bg-rose-950/40 border border-rose-900/50 rounded-xl p-3.5 mb-5 flex items-center gap-3 text-rose-300 text-xs">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-colors duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-colors duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3.5 font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-98 flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <button onClick={onGoToRegister} className="text-indigo-400 font-semibold hover:underline">
            Register Company Account
          </button>
        </div>
      </div>
    </div>
  );
};
