/**
 * ============================================================================
 * MOVIE DETAILS & SHOWTIMES PAGE (frontend/src/pages/MovieDetailsPage.tsx)
 * ============================================================================
 *
 * Implements Flow 2: Browse movies and shows
 * Acceptance Criteria:
 * - Shows movie synopsis, rating, language, and runtime
 * - Lists upcoming shows grouped by date
 * - Shows that have already started are NOT listed (filtered by backend query)
 * - Each show displays how many seats are still available (e.g. "76 / 80 seats available")
 * - Clicking a show navigates to the Seat Map for booking
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Globe, Calendar, Ticket, AlertCircle } from 'lucide-react';
import { Movie, Show } from '../types.js';
import { api } from '../api.js';

interface MovieDetailsPageProps {
  movieId: number;
  onBack: () => void;
  onSelectShow: (showId: number) => void;
}

export const MovieDetailsPage: React.FC<MovieDetailsPageProps> = ({
  movieId,
  onBack,
  onSelectShow
}) => {
  // `useState` Hook: Holds the movie details object
  const [movie, setMovie] = useState<Movie | null>(null);

  // `useState` Hook: Holds shows grouped by date: { "2026-10-23": [show1, show2] }
  const [showsByDate, setShowsByDate] = useState<Record<string, Show[]>>({});

  // `useState` Hook: Loading indicator
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // `useState` Hook: Error message if movie fetch fails
  const [error, setError] = useState<string | null>(null);

  // `useState` Hook: Tracks image loading failure
  const [imgError, setImgError] = useState<boolean>(false);

  /**
   * `useEffect` Hook:
   * Fetches movie details and its upcoming shows from GET /api/movies/:id
   */
  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await api.get(`/movies/${movieId}`);
        setMovie(res.data.movie);
        setShowsByDate(res.data.showsByDate || {});
      } catch (err: any) {
        console.error('Error fetching movie details:', err);
        setError(err.response?.data?.error || 'Failed to load movie details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId]); // Re-run if movieId changes

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded mx-auto mb-4" />
        <p className="text-sm">Loading showtimes and movie details...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Movie Not Found</h3>
        <p className="text-xs text-slate-400">{error || 'Could not find this movie.'}</p>
        <button
          onClick={onBack}
          className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
        >
          Return to Movies
        </button>
      </div>
    );
  }

  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return `${hours}h ${remaining > 0 ? `${remaining}m` : ''}`;
  };

  const dates = Object.keys(showsByDate).sort();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors p-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Movies</span>
      </button>

      {/* Movie Hero Banner Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row gap-8 items-start">
        
        {/* Poster Image */}
        <div className="w-full md:w-56 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden bg-slate-800 shadow-xl border border-slate-700">
          <img
            src={imgError || !movie.poster_url ? 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80' : movie.poster_url}
            alt={movie.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Synopsis and Metadata */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {movie.rating}
            </span>
            <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              {movie.language}
            </span>
            <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {formatDuration(movie.duration_mins)}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {movie.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {movie.description || 'No description available for this movie.'}
          </p>

          <div className="pt-2 text-xs text-slate-400 border-t border-slate-800 flex items-center gap-2">
            <span className="font-semibold text-amber-400">Single Screen Cinema</span>
            <span>•</span>
            <span>80 Seats per Show</span>
          </div>
        </div>

      </div>

      {/* Upcoming Shows Grouped by Date (Flow 2 Acceptance Criteria) */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Calendar className="w-6 h-6 text-amber-400" />
          <span>Upcoming Showtimes</span>
        </h2>

        {dates.length === 0 ? (
          <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-2">
            <Ticket className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-base font-semibold text-slate-300">No Upcoming Shows</h4>
            <p className="text-xs text-slate-500">
              There are currently no upcoming shows scheduled for this movie. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {dates.map((dateStr) => {
              const showList = showsByDate[dateStr];
              const dateObj = new Date(dateStr + 'T00:00:00');
              const formattedDate = dateObj.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              });

              return (
                <div key={dateStr} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                      {formattedDate}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {dateStr}
                    </span>
                  </div>

                  {/* Showtimes for this date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    {showList.map((show) => {
                      const availableSeats = show.available_seats ?? 80;
                      const isSoldOut = availableSeats === 0;

                      return (
                        <div
                          key={show.id}
                          onClick={() => !isSoldOut && onSelectShow(show.id)}
                          className={`p-4 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                            isSoldOut
                              ? 'bg-slate-950 border-slate-800/80 opacity-60 cursor-not-allowed'
                              : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/80 hover:border-amber-500/60 cursor-pointer hover:shadow-lg'
                          }`}
                        >
                          <div>
                            <span className="text-xl font-black text-white font-mono tracking-tight block">
                              {show.start_time}
                            </span>
                            <span className="text-xs font-semibold text-amber-400">
                              ₹{show.ticket_price}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${
                              isSoldOut
                                ? 'bg-rose-500/20 text-rose-400'
                                : availableSeats < 15
                                ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {isSoldOut ? 'Sold Out' : `${availableSeats}/80 Free`}
                            </span>
                            <span className="block text-[10px] text-slate-500 mt-0.5">
                              {isSoldOut ? 'No seats left' : 'Click to select seats'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
