/**
 * ============================================================================
 * NAVBAR COMPONENT (frontend/src/components/Navbar.tsx)
 * ============================================================================
 *
 * Provides header navigation across the web app:
 * - Brand logo
 * - Browse Movies link
 * - My Bookings link (accessible only when logged in)
 * - Admin Dashboard link (accessible only when logged in as admin)
 * - User greeting badge and Login/Logout controls
 */

import React from 'react';
import { Film, Ticket, ShieldCheck, LogIn, LogOut, User as UserIcon } from 'lucide-react';
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
  // Pull current authentication state from our global AuthContext
  const { user, logout, isAdmin } = useAuth();

  const handleNavClick = (tab: string) => {
    if (tab === 'movies' && onSelectMovie) {
      onSelectMovie(null); // Reset movie selection to show all movies
    }
    setActiveTab(tab);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand Logo & Title */}
        <div 
          onClick={() => handleNavClick('movies')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="p-2 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-xl text-white shadow-md group-hover:scale-105 transition-transform">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              Yozigo <span className="text-amber-400">Cinema</span>
            </span>
            <span className="block text-xs text-slate-400 -mt-1 font-mono">Single Screen • 80 Seats</span>
          </div>
        </div>

        {/* Center: Main Navigation Links */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => handleNavClick('movies')}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'movies'
                ? 'bg-slate-800 text-amber-400 shadow-inner'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Movies & Shows</span>
          </button>

          {/* Flow 1: My Bookings is only accessible to logged in users */}
          <button
            onClick={() => {
              if (!user) {
                onOpenAuth('login');
              } else {
                handleNavClick('my-bookings');
              }
            }}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'my-bookings'
                ? 'bg-slate-800 text-amber-400 shadow-inner'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>My Bookings</span>
          </button>

          {/* Flow 7 & 9: Admin Dashboard is only visible to Admin role */}
          {isAdmin && (
            <button
              onClick={() => handleNavClick('admin')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-rose-950/50 text-rose-400 border border-rose-800/60'
                  : 'text-rose-300 hover:text-rose-200 hover:bg-rose-950/30'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>Admin Portal</span>
            </button>
          )}
        </nav>

        {/* Right: User Authentication Controls */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-200">{user.name}</span>
                <span className={`text-[11px] font-mono uppercase tracking-wider ${
                  isAdmin ? 'text-rose-400 font-bold' : 'text-slate-400'
                }`}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                title="Log Out"
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-rose-400 hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold shadow-md transition-colors"
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
