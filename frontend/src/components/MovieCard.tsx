/**
 * ============================================================================
 * MOVIE CARD COMPONENT (frontend/src/components/MovieCard.tsx)
 * ============================================================================
 *
 * Implements Flow 2: Browse movies and shows
 * Displays:
 * - Movie poster image (with automatic placeholder fallback)
 * - Title
 * - Language
 * - Duration in hours and minutes
 * - Rating badge ('U', 'UA', 'A')
 * - Interactive click trigger to view upcoming showtimes
 */

import React, { useState } from 'react';
import { Clock, Globe, Film } from 'lucide-react';
import { Movie } from '../types.js';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movieId: number) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onSelect }) => {
  // `useState` Hook: If the poster image fails to load, fallback to default placeholder
  const [imgError, setImgError] = useState(false);

  // Helper to format duration like "2h 28m"
  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return `${hours}h ${remaining > 0 ? `${remaining}m` : ''}`;
  };

  // Color badges for movie ratings
  const getRatingBadgeColor = (rating: string) => {
    switch (rating) {
      case 'U':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'UA':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'A':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const placeholderImage = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80';

  return (
    <div
      onClick={() => onSelect(movie.id)}
      className="group relative bg-slate-800/80 hover:bg-slate-800 rounded-2xl overflow-hidden border border-slate-700/60 hover:border-amber-500/50 shadow-md hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer flex flex-col"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
        <img
          src={imgError || !movie.poster_url ? placeholderImage : movie.poster_url}
          alt={movie.title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Rating Badge Overlay */}
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border backdrop-blur-md shadow ${getRatingBadgeColor(movie.rating)}`}>
            {movie.rating}
          </span>
        </div>

        {/* Gradient overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
      </div>

      {/* Movie Details Body */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors line-clamp-1">
            {movie.title}
          </h3>

          <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 font-medium">
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              {movie.language}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {formatDuration(movie.duration_mins)}
            </span>
          </div>

          {movie.description && (
            <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
              {movie.description}
            </p>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs font-semibold">
          <span className="text-amber-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
            <Film className="w-3.5 h-3.5" />
            View Showtimes
          </span>
          <span className="text-slate-500 group-hover:text-slate-300">→</span>
        </div>
      </div>
    </div>
  );
};
