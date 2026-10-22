/**
 * ============================================================================
 * NAVBAR COMPONENT (frontend/src/components/Navbar.tsx)
 * ============================================================================
 *
 * Modern cinema navigation with glassmorphism, crisp high-contrast light typography,
 * glowing cinema badges, and seamless switching between Movies, My Bookings, and Admin.
 */

import React from 'react';
import { Film, Ticket, ShieldCheck, LogIn, LogOut, Clapperboard, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface NavbarProps {
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSelectMovie?: (movieId: number | null) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  activeTab,
  setActiveTab,
  onSelectMovie
}) => {
  const { user, logout, isAdmin } = useAuth();

  const handleNavClick = (tab: string) => {
    if (tab === 'movies' && onSelectMovie) {
      onSelectMovie(null);
    }
    setActiveTab(tab);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#090e1a]/85 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Cinema Title */}
        <div 
          onClick={() => handleNavClick('movies')}
          className="flex items-center space-x-3.5 cursor-pointer group"
        >
          <div className="relative p-2.5 bg-gradient-to-br from-amber-400 to-rose-600 rounded-2xl text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] group-hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] group-hover:scale-105 transition-all duration-300">
            <Clapperboard className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              YOZIGO <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">CINEMA</span>
            </span>
            <div className="flex items-center gap-1.5 -mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase font-mono">
                Screen 1 • 80 Luxury Seats
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 bg-slate-900/60 border border-white/[0.06] p-1.5 rounded-2xl backdrop-blur-md">
          <button
            onClick={() => handleNavClick('movies')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'movies'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Movies & Shows</span>
          </button>

          {/* Flow 1: My Bookings is protected */}
          <button
            onClick={() => {
              if (!user) {
                onOpenAuth('login');
              } else {
                handleNavClick('my-bookings');
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'my-bookings'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>My Bookings</span>
          </button>

          {/* Flow 7 & 9: Admin portal link for staff */}
          {isAdmin && (
            <button
              onClick={() => handleNavClick('admin')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'text-rose-300 hover:text-white hover:bg-rose-500/10'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>Staff Portal</span>
            </button>
          )}
        </nav>

        {/* User Auth Section */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3 bg-slate-900/80 border border-white/[0.08] px-3.5 py-1.5 rounded-2xl">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-white">{user.name}</span>
                <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
                  isAdmin ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                title="Log Out"
                className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-200 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all hover:scale-105"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
