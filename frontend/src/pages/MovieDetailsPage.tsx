/**
 * ============================================================================
 * MOVIE DETAILS & SHOWTIMES PAGE (frontend/src/pages/MovieDetailsPage.tsx)
 * ============================================================================
 *
 * Implements Flow 2: Browse movies and shows
 * Features:
 * - High-contrast light typography on deep obsidian glass
 * - Backdrop poster with ambient lighting
 * - Dates and showtimes with luminous seat availability badges
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Globe, Calendar, Ticket, AlertCircle, Sparkles, Film } from 'lucide-react';
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
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showsByDate, setShowsByDate] = useState<Record<string, Show[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState<boolean>(false);

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
  }, [movieId]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-slate-300 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded-xl mx-auto mb-4" />
        <p className="text-sm font-semibold">Loading movie details & showtimes...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-[#0d1322] border border-white/[0.08] rounded-3xl text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Movie Not Found</h3>
        <p className="text-xs text-slate-400">{error || 'Could not find this movie.'}</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white transition-colors p-1"
      >
        <ArrowLeft className="w-4 h-4 text-amber-400" />
        <span>Back to All Movies</span>
      </button>

      {/* Movie Hero Card */}
      <div className="bg-[#0b101d]/90 border border-white/[0.09] rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
        
        {/* Poster Image */}
        <div className="w-full md:w-64 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden bg-slate-950 shadow-[0_10px_30px_rgba(0,0,0,0.8)] border border-white/[0.1] relative">
          <img
            src={imgError || !movie.poster_url ? 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80' : movie.poster_url}
            alt={movie.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Synopsis & Details */}
        <div className="flex-1 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-400/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              {movie.rating}
            </span>
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#151c2e] text-slate-200 border border-white/[0.08] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              {movie.language}
            </span>
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#151c2e] text-slate-200 border border-white/[0.08] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {formatDuration(movie.duration_mins)}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {movie.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
            {movie.description || 'No description available for this movie.'}
          </p>

          <div className="pt-4 border-t border-white/[0.08] flex items-center gap-4 text-xs font-semibold text-slate-400">
            <span className="text-amber-400 flex items-center gap-1.5 font-bold">
              <Film className="w-4 h-4" />
              Screen 1 (Single Screen Cinema)
            </span>
            <span>•</span>
            <span>80 Seats per Show</span>
          </div>
        </div>

      </div>

      {/* Upcoming Shows Grouped by Date (Flow 2) */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
          <Calendar className="w-6 h-6 text-amber-400" />
          <span>Available Showtimes</span>
        </h2>

        {dates.length === 0 ? (
          <div className="p-10 bg-[#0d1322] border border-white/[0.08] rounded-3xl text-center space-y-2">
            <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
            <h4 className="text-lg font-bold text-white">No Upcoming Shows</h4>
            <p className="text-xs text-slate-400">
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
                <div key={dateStr} className="bg-[#0b101d]/90 border border-white/[0.08] rounded-3xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <span className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formattedDate}
                    </span>
                    <span className="text-xs text-slate-400 font-mono font-semibold bg-white/[0.05] px-2.5 py-1 rounded-lg">
                      {dateStr}
                    </span>
                  </div>

                  {/* Showtimes for this date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                    {showList.map((show) => {
                      const availableSeats = show.available_seats ?? 80;
                      const isSoldOut = availableSeats === 0;

                      return (
                        <div
                          key={show.id}
                          onClick={() => !isSoldOut && onSelectShow(show.id)}
                          className={`p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                            isSoldOut
                              ? 'bg-slate-950 border-white/[0.04] opacity-50 cursor-not-allowed'
                              : 'bg-[#12192c] hover:bg-[#18213a] border-white/[0.08] hover:border-amber-400/60 cursor-pointer hover:shadow-[0_8px_25px_rgba(245,158,11,0.18)] hover:scale-[1.02]'
                          }`}
                        >
                          <div>
                            <span className="text-2xl font-black text-white font-mono tracking-tight block">
                              {show.start_time}
                            </span>
                            <span className="text-xs font-bold text-amber-400">
                              ₹{show.ticket_price} <span className="text-[10px] text-slate-400 font-normal">/ seat</span>
                            </span>
                          </div>

                          <div className="text-right">
                            <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black ${
                              isSoldOut
                                ? 'bg-rose-500/20 text-rose-300'
                                : availableSeats < 15
                                ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                                : 'bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                            }`}>
                              {isSoldOut ? 'Sold Out' : `${availableSeats}/80 Free`}
                            </span>
                            <span className="block text-[11px] font-semibold text-slate-400 mt-1">
                              {isSoldOut ? 'No seats left' : 'Select Seats →'}
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
