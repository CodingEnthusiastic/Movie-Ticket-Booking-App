/**
 * ============================================================================
 * HOME PAGE COMPONENT (frontend/src/pages/HomePage.tsx)
 * ============================================================================
 *
 * Implements Flow 2: Browse movies and shows
 * - Displays hero cinema header
 * - Lists all active movies with posters, language, duration, and ratings (U, UA, A)
 * - Allows searching movies by title or filtering by language
 * - Clicking a movie opens its details and showtimes
 */

import React, { useState, useEffect } from 'react';
import { Search, Film, Sparkles, Popcorn } from 'lucide-react';
import { Movie } from '../types.js';
import { api } from '../api.js';
import { MovieCard } from '../components/MovieCard.js';

interface HomePageProps {
  onSelectMovie: (movieId: number) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectMovie }) => {
  // `useState` Hook: Store the list of movies fetched from backend API
  const [movies, setMovies] = useState<Movie[]>([]);

  // `useState` Hook: Track if the page is currently fetching data
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // `useState` Hook: Search input query state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // `useState` Hook: Language filter state ('All', 'English', 'Japanese', etc.)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');

  /**
   * `useEffect` Hook:
   * Fetches all movies from GET /api/movies when the component mounts.
   */
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
  }, []); // Run once on mount

  // Extract unique languages for filter buttons
  const languages = ['All', ...Array.from(new Set(movies.map((m) => m.language)))];

  // Filter movies based on user search query and selected language
  const filteredMovies = movies.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.language.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLanguage = selectedLanguage === 'All' || m.language === selectedLanguage;
    return matchesSearch && matchesLanguage;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-600 via-rose-600 to-purple-800 p-8 sm:p-12 text-white shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wide uppercase">
            <Popcorn className="w-3.5 h-3.5" />
            <span>Single-Screen Cinema Experience</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Book Your Seats. <br />
            <span className="text-amber-200">Zero Double Bookings.</span>
          </h1>
          <p className="text-white/80 text-sm sm:text-base leading-relaxed">
            Pick your favourite seats on our live interactive seat map. Seats are held safely for 5 minutes during checkout with instant synchronization.
          </p>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Search Input Box */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search movies by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        {/* Language Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedLanguage === lang
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

      </div>

      {/* Movies Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-400" />
            <span>Now Showing</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {filteredMovies.length} {filteredMovies.length === 1 ? 'Movie' : 'Movies'} Available
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[2/3] bg-slate-800/50 rounded-2xl border border-slate-800" />
            ))}
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
            <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No movies found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or language filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
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
