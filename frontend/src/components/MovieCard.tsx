/**
 * ============================================================================
 * MOVIE CARD COMPONENT (frontend/src/components/MovieCard.tsx)
 * ============================================================================
 *
 * Implements Flow 2: Browse movies and shows
 * Features:
 * - High-contrast light text on dark glass card
 * - Neon rating pill badges
 * - Subtle ambient golden glow on hover
 * - High-res poster with fallback
 */

import React, { useState } from 'react';
import { Clock, Globe, Film, ChevronRight, Star } from 'lucide-react';
import { Movie } from '../types.js';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movieId: number) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onSelect }) => {
  const [imgError, setImgError] = useState(false);

  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return `${hours}h ${remaining > 0 ? `${remaining}m` : ''}`;
  };

  const getRatingBadgeColor = (rating: string) => {
    switch (rating) {
      case 'U':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
      case 'UA':
        return 'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]';
      case 'A':
        return 'bg-rose-500/20 text-rose-300 border-rose-400/40 shadow-[0_0_12px_rgba(244,63,94,0.2)]';
      default:
        return 'bg-slate-800 text-slate-200 border-slate-700';
    }
  };

  const placeholderImage = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80';

  return (
    <div
      onClick={() => onSelect(movie.id)}
      className="group relative bg-[#0d1322]/90 hover:bg-[#12192c] rounded-3xl overflow-hidden border border-white/[0.08] hover:border-amber-400/50 shadow-xl hover:shadow-[0_15px_35px_rgba(245,158,11,0.18)] transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
        <img
          src={imgError || !movie.poster_url ? placeholderImage : movie.poster_url}
          alt={movie.title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Rating Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-xl text-xs font-black border backdrop-blur-md ${getRatingBadgeColor(movie.rating)}`}>
            {movie.rating}
          </span>
        </div>

        {/* Deep bottom gradient for clear text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1322] via-[#0d1322]/30 to-transparent" />
      </div>

      {/* Movie Details Body */}
      <div className="p-5 flex flex-col flex-grow justify-between space-y-3 -mt-6 relative z-10">
        <div>
          <h3 className="font-extrabold text-lg text-white group-hover:text-amber-300 transition-colors line-clamp-1 tracking-tight">
            {movie.title}
          </h3>

          <div className="flex items-center gap-3 text-xs text-slate-300 font-semibold mt-1.5">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              {movie.language}
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {formatDuration(movie.duration_mins)}
            </span>
          </div>

          {movie.description && (
            <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
              {movie.description}
            </p>
          )}
        </div>

        {/* View Showtimes Button */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-xs font-black text-amber-400 group-hover:text-amber-300 flex items-center gap-1.5 tracking-wide uppercase">
            <Film className="w-3.5 h-3.5" />
            Book Tickets
          </span>
          <div className="w-7 h-7 rounded-xl bg-white/[0.06] group-hover:bg-amber-400 group-hover:text-slate-950 text-slate-300 flex items-center justify-center transition-all duration-200">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
