/**
 * ============================================================================
 * ADMIN DASHBOARD PAGE (frontend/src/pages/AdminDashboardPage.tsx)
 * ============================================================================
 *
 * Implements:
 * - Flow 7: Admin add/edit/delete movies & schedule shows (with OVERLAP check)
 * - Bonus Flow 9: Admin show analytics, occupancy percentage, revenue, customer booking list,
 *   and visual seat map inspection
 *
 * Upgraded with:
 * - Obsidian dark background with gold & rose neon accents
 * - High-contrast text on all tables, forms, and cards
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Film, Calendar, Clock, Plus, Trash2, Edit3, 
  Users, DollarSign, AlertCircle, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import { Movie, AdminShowStat } from '../types.js';
import { api } from '../api.js';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'schedule' | 'movies'>('stats');
  const [showStats, setShowStats] = useState<AdminShowStat[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states: Add Show
  const [selectedMovieId, setSelectedMovieId] = useState<number | ''>('');
  const [showDate, setShowDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [ticketPrice, setTicketPrice] = useState<number>(250);
  const [isSubmittingShow, setIsSubmittingShow] = useState<boolean>(false);

  // Form states: Add / Edit Movie
  const [movieTitle, setMovieTitle] = useState<string>('');
  const [movieDescription, setMovieDescription] = useState<string>('');
  const [moviePoster, setMoviePoster] = useState<string>('');
  const [movieLanguage, setMovieLanguage] = useState<string>('English');
  const [movieDuration, setMovieDuration] = useState<number>(120);
  const [movieRating, setMovieRating] = useState<'U' | 'UA' | 'A'>('UA');
  const [editingMovieId, setEditingMovieId] = useState<number | null>(null);

  // Flow 9: Inspect Show Modal
  const [inspectShowId, setInspectShowId] = useState<number | null>(null);
  const [inspectData, setInspectData] = useState<{
    show: any;
    bookings: any[];
    seats: any[];
  } | null>(null);
  const [isLoadingInspect, setIsLoadingInspect] = useState<boolean>(false);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, moviesRes] = await Promise.all([
        api.get('/shows/admin/stats'),
        api.get('/movies')
      ]);
      setShowStats(statsRes.data.shows || []);
      setMovies(moviesRes.data.movies || []);
      if (moviesRes.data.movies.length > 0 && selectedMovieId === '') {
        setSelectedMovieId(moviesRes.data.movies[0].id);
      }
    } catch (err: any) {
      setAlert({
        type: 'error',
        message: err.response?.data?.error || 'Failed to load admin data.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleAddShow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMovieId || !showDate || !startTime) {
      setAlert({ type: 'error', message: 'Please complete all show details.' });
      return;
    }

    setIsSubmittingShow(true);
    setAlert(null);

    try {
      await api.post('/shows', {
        movie_id: Number(selectedMovieId),
        show_date: showDate,
        start_time: startTime,
        ticket_price: ticketPrice
      });

      setAlert({
        type: 'success',
        message: 'Show scheduled successfully with all 80 seats initialized!'
      });

      setShowDate('');
      setStartTime('');
      loadDashboardData();
      setActiveTab('stats');
    } catch (err: any) {
      setAlert({
        type: 'error',
        message: err.response?.data?.error || 'Failed to schedule show.'
      });
    } finally {
      setIsSubmittingShow(false);
    }
  };

  const handleDeleteShow = async (showId: number) => {
    if (!window.confirm('Are you sure you want to delete this show?')) return;

    setAlert(null);
    try {
      await api.delete(`/shows/${showId}`);
      setAlert({ type: 'success', message: 'Show deleted successfully.' });
      loadDashboardData();
    } catch (err: any) {
      setAlert({
        type: 'error',
        message: err.response?.data?.error || 'Failed to delete show.'
      });
    }
  };

  const handleSaveMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    try {
      const payload = {
        title: movieTitle,
        description: movieDescription,
        poster_url: moviePoster,
        language: movieLanguage,
        duration_mins: Number(movieDuration),
        rating: movieRating
      };

      if (editingMovieId) {
        await api.put(`/movies/${editingMovieId}`, payload);
        setAlert({ type: 'success', message: 'Movie updated successfully!' });
      } else {
        await api.post('/movies', payload);
        setAlert({ type: 'success', message: 'Movie added successfully!' });
      }

      setEditingMovieId(null);
      setMovieTitle('');
      setMovieDescription('');
      setMoviePoster('');
      setMovieDuration(120);
      loadDashboardData();
    } catch (err: any) {
      setAlert({
        type: 'error',
        message: err.response?.data?.error || 'Failed to save movie.'
      });
    }
  };

  const handleDeleteMovie = async (movieId: number) => {
    if (!window.confirm('Are you sure you want to delete this movie?')) return;

    setAlert(null);
    try {
      await api.delete(`/movies/${movieId}`);
      setAlert({ type: 'success', message: 'Movie deleted successfully.' });
      loadDashboardData();
    } catch (err: any) {
      setAlert({
        type: 'error',
        message: err.response?.data?.error || 'Failed to delete movie.'
      });
    }
  };

  const handleInspectShow = async (showId: number) => {
    setInspectShowId(showId);
    setIsLoadingInspect(true);
    try {
      const res = await api.get(`/shows/${showId}/admin-details`);
      setInspectData(res.data);
    } catch (err: any) {
      setAlert({
        type: 'error',
        message: err.response?.data?.error || 'Failed to load show bookings.'
      });
    } finally {
      setIsLoadingInspect(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.2)]">
              Staff Portal
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3 mt-1.5">
            <ShieldCheck className="w-8 h-8 text-rose-400" />
            <span>Cinema Admin Dashboard</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Manage movie listings, schedule screenings without overlaps, and view show revenues
          </p>
        </div>

        {/* Dashboard Sub-Tabs */}
        <div className="flex bg-[#0d1322] border border-white/[0.08] p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'stats'
                ? 'bg-amber-400 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Shows & Bookings</span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'schedule'
                ? 'bg-amber-400 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule Show</span>
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'movies'
                ? 'bg-amber-400 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Manage Movies</span>
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between ${
          alert.type === 'success'
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
            : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
        }`}>
          <div className="flex items-center gap-2.5 font-bold">
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-xs hover:underline ml-4 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: SHOWS & OCCUPANCY STATS (Bonus Flow 9) */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>Show Occupancy & Revenue</span>
              <span className="text-xs font-bold text-slate-400 font-mono bg-white/[0.05] px-2 py-0.5 rounded-lg">
                ({showStats.length} shows)
              </span>
            </h2>
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-slate-300 animate-pulse font-semibold">Loading stats...</div>
          ) : showStats.length === 0 ? (
            <div className="p-10 bg-[#0b101d] border border-white/[0.08] rounded-3xl text-center text-slate-300">
              No shows scheduled yet. Go to "Schedule Show" to add your first screening.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {showStats.map((stat) => (
                <div
                  key={stat.id}
                  className="bg-[#0b101d] border border-white/[0.09] rounded-3xl p-6 space-y-4 hover:border-amber-400/40 transition-all shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                      <span>{stat.show_date}</span>
                      <span className="font-bold text-white bg-white/[0.08] px-2.5 py-0.5 rounded-md">
                        {stat.start_time}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-white line-clamp-1">
                      {stat.movie_title}
                    </h3>

                    {/* Progress Bar for Occupancy */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-300">Seats Booked</span>
                        <span className="text-amber-400 font-mono">
                          {stat.booked_seats} / 80 ({stat.percentageFull}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/[0.06]">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                          style={{ width: `${stat.percentageFull}%` }}
                        />
                      </div>
                    </div>

                    {/* Revenue */}
                    <div className="flex justify-between items-center text-xs pt-1 font-bold">
                      <span className="text-slate-400">Price: ₹{stat.ticket_price}</span>
                      <span className="text-emerald-400 text-sm">
                        Revenue: ₹{stat.total_revenue}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleInspectShow(stat.id)}
                      className="px-4 py-2 bg-white/[0.08] hover:bg-amber-400 hover:text-slate-950 text-amber-300 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow"
                    >
                      <span>View Bookings & Map</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteShow(stat.id)}
                      title="Delete Show"
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SCHEDULE SHOW (Flow 7) */}
      {activeTab === 'schedule' && (
        <div className="max-w-2xl mx-auto bg-[#0b101d] border border-white/[0.1] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          <div>
            <h2 className="text-2xl font-black text-white">Schedule a New Show</h2>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              Screenings are hosted on the single cinema screen. Overlapping shows are automatically blocked.
            </p>
          </div>

          <form onSubmit={handleAddShow} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Select Movie
              </label>
              <select
                required
                value={selectedMovieId}
                onChange={(e) => setSelectedMovieId(Number(e.target.value))}
                className="w-full bg-[#12192c] border border-white/[0.1] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400/80"
              >
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.duration_mins} mins • {m.language})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                  Show Date
                </label>
                <input
                  type="date"
                  required
                  value={showDate}
                  onChange={(e) => setShowDate(e.target.value)}
                  className="w-full bg-[#12192c] border border-white/[0.1] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400/80"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-[#12192c] border border-white/[0.1] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400/80"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                Ticket Price (₹)
              </label>
              <input
                type="number"
                required
                min={0}
                step={10}
                value={ticketPrice}
                onChange={(e) => setTicketPrice(Number(e.target.value))}
                className="w-full bg-[#12192c] border border-white/[0.1] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400/80"
              />
            </div>

            <div className="p-4 bg-[#12192c] border border-white/[0.08] rounded-2xl text-xs text-slate-300 leading-relaxed font-medium">
              💡 <strong>Screen Overlap Rule:</strong> Two shows cannot occupy the cinema screen at the same time. The backend automatically computes `start_time + duration` and rejects collisions!
            </div>

            <button
              type="submit"
              disabled={isSubmittingShow}
              className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all"
            >
              {isSubmittingShow ? 'Checking Overlaps & Scheduling...' : 'Schedule Show & Initialize 80 Seats'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: MANAGE MOVIES (Flow 7) */}
      {activeTab === 'movies' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Movie Form */}
          <div className="bg-[#0b101d] border border-white/[0.1] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-white">
              {editingMovieId ? 'Edit Movie' : 'Add New Movie'}
            </h3>

            <form onSubmit={handleSaveMovie} className="space-y-3.5">
              <div>
                <label className="block text-xs uppercase font-bold text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gladiator II"
                  value={movieTitle}
                  onChange={(e) => setMovieTitle(e.target.value)}
                  className="w-full bg-[#12192c] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/80"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Movie plot synopsis..."
                  value={movieDescription}
                  onChange={(e) => setMovieDescription(e.target.value)}
                  className="w-full bg-[#12192c] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/80"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-300 mb-1">
                  Poster Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={moviePoster}
                  onChange={(e) => setMoviePoster(e.target.value)}
                  className="w-full bg-[#12192c] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/80"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-300 mb-1">
                    Language
                  </label>
                  <input
                    type="text"
                    required
                    value={movieLanguage}
                    onChange={(e) => setMovieLanguage(e.target.value)}
                    className="w-full bg-[#12192c] border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold text-slate-300 mb-1">
                    Duration (m)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={movieDuration}
                    onChange={(e) => setMovieDuration(Number(e.target.value))}
                    className="w-full bg-[#12192c] border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold text-slate-300 mb-1">
                    Rating
                  </label>
                  <select
                    value={movieRating}
                    onChange={(e) => setMovieRating(e.target.value as any)}
                    className="w-full bg-[#12192c] border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-white font-bold"
                  >
                    <option value="U">U</option>
                    <option value="UA">UA</option>
                    <option value="A">A</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow transition-all"
                >
                  {editingMovieId ? 'Update Movie' : 'Add Movie'}
                </button>
                {editingMovieId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMovieId(null);
                      setMovieTitle('');
                      setMovieDescription('');
                      setMoviePoster('');
                    }}
                    className="px-4 py-3 bg-white/[0.08] text-slate-300 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Movies List */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xl font-black text-white mb-2">Movie Catalogue</h3>
            {movies.map((m) => (
              <div
                key={m.id}
                className="bg-[#0b101d] border border-white/[0.09] rounded-2xl p-4 flex items-center justify-between gap-4 shadow-lg"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-white/[0.1]">
                    <img
                      src={m.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80'}
                      alt={m.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm">{m.title}</h4>
                    <p className="text-xs text-slate-300 font-medium">
                      {m.language} • {m.duration_mins} mins • Rating: <strong className="text-amber-400 font-bold">{m.rating}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMovieId(m.id);
                      setMovieTitle(m.title);
                      setMovieDescription(m.description || '');
                      setMoviePoster(m.poster_url || '');
                      setMovieLanguage(m.language);
                      setMovieDuration(m.duration_mins);
                      setMovieRating(m.rating);
                    }}
                    title="Edit Movie"
                    className="p-2.5 bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 rounded-xl transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMovie(m.id)}
                    title="Delete Movie"
                    className="p-2.5 bg-white/[0.06] hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* INSPECT SHOW MODAL (Bonus Flow 9) */}
      {inspectShowId && inspectData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0b101d] border border-white/[0.1] rounded-3xl shadow-2xl p-6 sm:p-8 text-white overflow-y-auto space-y-6">
            
            <button
              onClick={() => {
                setInspectShowId(null);
                setInspectData(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs uppercase font-black text-amber-400 tracking-wider">
                Show Details & Occupancy
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                {inspectData.show.movie_title}
              </h2>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                {inspectData.show.show_date} at {inspectData.show.start_time} • {inspectData.bookings.length} Bookings Made
              </p>
            </div>

            {/* Visual Seat Map */}
            <div className="bg-[#12192c] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="text-center">
                <div className="w-2/3 h-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full mx-auto shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                <span className="text-[10px] font-mono tracking-widest text-amber-300 uppercase mt-1.5 block font-bold">
                  Screen This Way
                </span>
              </div>

              {/* 8x10 Grid View */}
              <div className="space-y-2 overflow-x-auto pb-2">
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((row) => (
                  <div key={row} className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <span className="w-5 text-center font-black text-xs text-amber-400 font-mono">
                      {row}
                    </span>
                    <div className="flex gap-1.5 sm:gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((col) => {
                        const seatCode = `${row}${col}`;
                        const seat = inspectData.seats.find((s) => s.seat_number === seatCode);
                        const isBooked = seat?.status === 'booked';

                        return (
                          <div
                            key={seatCode}
                            title={isBooked ? `Booked by ${seat.booked_by_name} (${seat.booked_by_email})` : 'Available'}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[10px] font-black flex items-center justify-center transition-all ${
                              isBooked
                                ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                                : 'bg-[#1a2234] text-slate-300 border border-white/[0.06]'
                            }`}
                          >
                            {seatCode}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-5 text-xs text-slate-300 font-semibold pt-2 border-t border-white/[0.08]">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-[#1a2234] border border-white/[0.1]" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-rose-600 shadow" />
                  <span className="text-rose-300">Booked</span>
                </div>
              </div>
            </div>

            {/* List of Bookings */}
            <div>
              <h3 className="text-lg font-black text-white mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Customer Bookings List</span>
              </h3>

              {inspectData.bookings.length === 0 ? (
                <p className="text-xs text-slate-300 bg-[#12192c] p-4 rounded-xl border border-white/[0.06]">
                  No tickets booked for this show yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {inspectData.bookings.map((b) => (
                    <div
                      key={b.booking_id}
                      className="bg-[#12192c] border border-white/[0.08] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-black text-white text-sm">
                          {b.customer_name} <span className="font-medium text-slate-400">({b.customer_email})</span>
                        </div>
                        <div className="text-slate-300 mt-1">
                          Booking ID: <strong className="font-mono text-amber-400">#{b.booking_id}</strong> • Booked at: {new Date(b.booked_at).toLocaleString()}
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <span className="font-mono font-black text-amber-400 block text-xs">
                          Seats: {b.seats || 'None'}
                        </span>
                        <span className="font-black text-emerald-400 text-sm">
                          ₹{b.total_amount} ({b.status})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
