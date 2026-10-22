/**
 * ============================================================================
 * MAIN APPLICATION COMPONENT (frontend/src/App.tsx)
 * ============================================================================
 *
 * 🎓 FOR VIBE CODERS - REACT ARCHITECTURE EXPLAINER:
 * ----------------------------------------------------------------------------
 * 1. Component Tree:
 *    <AuthProvider> wraps the entire app so every component has access to user state.
 *    Inside <MainApp>, we use standard React state (`useState`) to switch screens:
 *    - Home -> Movie Details -> Seat Booking -> My Bookings -> Admin Portal.
 *
 * 2. Why this state-based routing?
 *    In single-page applications (SPAs), updating state (like `setSelectedShowId(5)`)
 *    instantly displays the new screen without reloading the browser page!
 *
 * 3. Protected Flow 1 Rule:
 *    If an unauthenticated user tries to open "My Bookings" or book seats,
 *    we automatically prompt the <AuthModal>.
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { AuthModal } from './components/AuthModal.js';
import { HomePage } from './pages/HomePage.js';
import { MovieDetailsPage } from './pages/MovieDetailsPage.js';
import { SeatBookingPage } from './pages/SeatBookingPage.js';
import { MyBookingsPage } from './pages/MyBookingsPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { ShieldCheck, Film, Popcorn } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, isAdmin } = useAuth();

  // Navigation tab state: 'movies' | 'my-bookings' | 'admin'
  const [activeTab, setActiveTab] = useState<string>('movies');

  // Currently viewed movie details (null when on home catalogue)
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);

  // Currently viewed show's seat map (null when browsing)
  const [selectedShowId, setSelectedShowId] = useState<number | null>(null);

  // Auth modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleSelectMovie = (id: number | null) => {
    setSelectedMovieId(id);
    setSelectedShowId(null);
    setActiveTab('movies');
  };

  const handleSelectShow = (showId: number) => {
    setSelectedShowId(showId);
  };

  const handleBackFromSeats = () => {
    setSelectedShowId(null);
  };

  const handleViewMyBookings = () => {
    setSelectedShowId(null);
    setSelectedMovieId(null);
    setActiveTab('my-bookings');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Global Navigation Bar */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedMovieId(null);
          setSelectedShowId(null);
        }}
        onSelectMovie={handleSelectMovie}
      />

      {/* Main Screen Body */}
      <main className="flex-1 pb-16">
        {/* Screen 1: Seat Map & Booking Page (Flow 3, 4, 5, 10) */}
        {selectedShowId ? (
          <SeatBookingPage
            showId={selectedShowId}
            onBack={handleBackFromSeats}
            onOpenAuth={handleOpenAuth}
            onViewMyBookings={handleViewMyBookings}
          />
        ) : selectedMovieId ? (
          /* Screen 2: Movie Details & Showtimes Page (Flow 2) */
          <MovieDetailsPage
            movieId={selectedMovieId}
            onBack={() => setSelectedMovieId(null)}
            onSelectShow={handleSelectShow}
          />
        ) : activeTab === 'my-bookings' ? (
          /* Screen 3: Customer's Bookings & Cancellation Page (Flow 6 & 8) */
          user ? (
            <MyBookingsPage onBackToMovies={() => handleSelectMovie(null)} />
          ) : (
            <div className="max-w-md mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
              <Film className="w-12 h-12 text-amber-400 mx-auto" />
              <h2 className="text-xl font-bold text-white">Login Required</h2>
              <p className="text-xs text-slate-400">
                You must be logged in to view your bookings.
              </p>
              <button
                onClick={() => handleOpenAuth('login')}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md"
              >
                Log In to Account
              </button>
            </div>
          )
        ) : activeTab === 'admin' ? (
          /* Screen 4: Staff Admin Dashboard (Flow 7 & 9) */
          isAdmin ? (
            <AdminDashboardPage />
          ) : (
            <div className="max-w-md mx-auto my-20 p-8 bg-slate-900 border border-rose-900/40 rounded-3xl text-center space-y-4">
              <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
              <h2 className="text-xl font-bold text-white">Access Denied</h2>
              <p className="text-xs text-slate-400">
                You do not have staff administrator privileges to view this portal.
              </p>
              <button
                onClick={() => setActiveTab('movies')}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs"
              >
                Return to Movies
              </button>
            </div>
          )
        ) : (
          /* Screen 5: Home Movie Catalogue (Flow 2) */
          <HomePage onSelectMovie={handleSelectMovie} />
        )}
      </main>

      {/* Auth Modal (Login / Signup) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-400">
            🎬 Yozigo Cinema Ticket Booking Application
          </p>
          <p className="text-[11px] text-slate-600">
            Built with React, TypeScript, Express, SQLite, and Socket.IO for real-time seat synchronization.
          </p>
        </div>
      </footer>

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
