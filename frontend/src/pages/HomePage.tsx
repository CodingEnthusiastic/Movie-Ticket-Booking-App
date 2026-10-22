/**
 * ============================================================================
 * HOME PAGE COMPONENT (frontend/src/pages/HomePage.tsx)
 * ============================================================================
 *
 * Implements Flow 2: Browse movies and shows
 * - Premium dark cinema hero header with gold glowing accents
 * - Quick search and language filters
 * - Dynamic movie catalogue with high-contrast cards
 */

import React, { useState, useEffect } from 'react';
import { Search, Film, Popcorn, Sparkles, Clapperboard, Monitor } from 'lucide-react';
import { Movie } from '../types.js';
import { api } from '../api.js';
import { MovieCard } from '../components/MovieCard.js';

interface HomePageProps {
  onSelectMovie: (movieId: number) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectMovie }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/movies');
        setMovies(res.data.movies || []);
      } catch (err) {
        console.error('Failed to load movies:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const languages = ['All', ...Array.from(new Set(movies.map((m) => m.language)))];

  const filteredMovies = movies.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.language.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLanguage = selectedLanguage === 'All' || m.language === selectedLanguage;
    return matchesSearch && matchesLanguage;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#12192c] via-[#0d1322] to-[#150f1f] p-8 sm:p-14 text-white border border-white/[0.09] shadow-[0_25px_50px_rgba(0,0,0,0.7)]">
        
        {/* Glow ambient spots */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-wide uppercase shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Popcorn className="w-4 h-4 text-amber-400" />
            <span>Single Screen • 80 Luxury Recliner Seats</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-white">
            Experience Cinema. <br />
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
              Zero Double Booking.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Select your favourite seats on our live interactive seat map. Chosen seats are held safely for 5 minutes during checkout with real-time WebSocket synchronization.
          </p>
        </div>
      </div>

      {/* Search and Language Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Search Input Box */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-amber-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search movie title or language..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d1322] border border-white/[0.09] rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 shadow-inner transition-colors"
          />
        </div>

        {/* Language Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                selectedLanguage === lang
                  ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.35)] scale-105'
                  : 'bg-[#0d1322] border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/[0.2]'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

      </div>

      {/* Movies Grid (Flow 2) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5 tracking-tight">
            <Film className="w-6 h-6 text-amber-400" />
            <span>Now Showing at Cinema</span>
          </h2>
          <span className="text-xs font-bold font-mono text-slate-400 bg-white/[0.05] px-3 py-1 rounded-xl">
            {filteredMovies.length} {filteredMovies.length === 1 ? 'Movie' : 'Movies'} Available
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[2/3] bg-slate-900 rounded-3xl border border-white/[0.05]" />
            ))}
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-20 bg-[#0d1322]/60 border border-white/[0.08] rounded-3xl p-8 space-y-3">
            <Film className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-200">No movies found</h3>
            <p className="text-xs text-slate-400">Try adjusting your search query or language filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7">
            {filteredMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onSelect={onSelectMovie}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
