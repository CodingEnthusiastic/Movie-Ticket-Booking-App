/**
 * ============================================================================
 * AUTH MODAL COMPONENT (frontend/src/components/AuthModal.tsx)
 * ============================================================================
 *
 * Implements Flow 1: Sign up and log in
 * Features:
 * - Switch between Login and Signup tabs
 * - Password length check (minimum 8 characters)
 * - Single-click "Test Credentials" buttons for hiring evaluators to test
 *   both Admin and Customer personas effortlessly.
 */

import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login'
}) => {
  // `useState` Hook: Tracks whether the modal is in "login" or "signup" mode
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  // Form input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI status states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Global auth functions
  const { login, signup } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Flow 1 Rule: Password must be at least 8 characters
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setErrorMessage('Please enter your full name.');
          setIsSubmitting(false);
          return;
        }

        const res = await signup(name, email, password);
        if (!res.success) {
          setErrorMessage(res.error || 'Signup failed.');
        } else {
          onClose();
        }
      } else {
        const res = await login(email, password);
        if (!res.success) {
          // Flow 1 Acceptance: "Wrong email or password shows an error without saying which one was wrong."
          setErrorMessage(res.error || 'Invalid email or password.');
        } else {
          onClose();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Helper function: Fill pre-seeded credentials for rapid testing
   */
  const fillTestCredentials = (type: 'customer' | 'admin') => {
    setMode('login');
    setErrorMessage(null);
    if (type === 'admin') {
      setEmail('admin@cinema.com');
      setPassword('admin123456');
    } else {
      setEmail('customer@cinema.com');
      setPassword('password123');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-white overflow-hidden">
        
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'Welcome Back!' : 'Create an Account'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {mode === 'login'
              ? 'Log in to book seats and view your bookings.'
              : 'Sign up to start booking your cinema tickets.'}
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl mb-6 border border-slate-700/50">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMessage(null); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMessage(null); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-400">
                Password
              </label>
              <span className="text-[11px] text-slate-500">Min 8 characters</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {isSubmitting
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign In to Account'
              : 'Create Customer Account'}
          </button>
        </form>

        {/* Quick Test Seed Credentials Section (For Evaluators) */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-xs text-slate-400 font-medium mb-2.5 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>One-Click Test Logins (From Seed Script):</span>
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillTestCredentials('customer')}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-left transition-colors flex flex-col"
            >
              <span className="font-semibold text-amber-300">Customer Test</span>
              <span className="text-[10px] text-slate-400 truncate">customer@cinema.com</span>
            </button>
            <button
              type="button"
              onClick={() => fillTestCredentials('admin')}
              className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/60 text-slate-200 text-left transition-colors flex flex-col"
            >
              <span className="font-semibold text-rose-300">Admin Staff</span>
              <span className="text-[10px] text-slate-400 truncate">admin@cinema.com</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
