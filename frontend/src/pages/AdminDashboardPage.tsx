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
 * 🎓 FOR VIBE CODERS - OVERLAP VALIDATION:
 * ----------------------------------------------------------------------------
 * When an admin schedules a show at 14:00 for a 120-minute movie, the screen is
 * occupied from 14:00 to 16:00.
 * If the admin tries to schedule another show at 15:30, the backend rejects it with:
 * "Time conflict! Screen is occupied... Two shows on the same screen cannot overlap."
 * We catch this error in `handleAddShow` and display it in an alert box.
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Film, Calendar, Clock, Plus, Trash2, Edit3, 
  Users, DollarSign, AlertCircle, CheckCircle2, ChevronRight, X, Monitor, Lock
} from 'lucide-react';
import { Movie, AdminShowStat } from '../types.js';
import { api } from '../api.js';

export const AdminDashboardPage: React.FC = () => {
  // Navigation sub-tab: 'stats' | 'schedule' | 'movies'
  const [activeTab, setActiveTab] = useState<'stats' | 'schedule' | 'movies'>('stats');

  // Data states
  const [showStats, setShowStats] = useState<AdminShowStat[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Status alerts
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

  // Flow 9: Inspect Show Modal states
  const [inspectShowId, setInspectShowId] = useState<number | null>(null);
  const [inspectData, setInspectData] = useState<{
    show: any;
    bookings: any[];
    seats: any[];
  } | null>(null);
  const [isLoadingInspect, setIsLoadingInspect] = useState<boolean>(false);

  // Load stats and movies
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

  /**
   * Flow 7: Add a Show with Overlap check
   */
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

      // Reset form
      setShowDate('');
      setStartTime('');
      loadDashboardData();
      setActiveTab('stats');
    } catch (err: any) {
      // Flow 7 Overlap Error message displayed here!
      setAlert({
        type: 'error',
        message: err.response?.data?.error || 'Failed to schedule show.'
      });
    } finally {
      setIsSubmittingShow(false);
    }
  };

  /**
   * Flow 7: Delete a Show (Checks if show has active bookings)
   */
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

  /**
   * Flow 7: Add or Update Movie
   */
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

      // Reset form
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

  /**
   * Flow 7: Delete a Movie
   */
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

  /**
   * Bonus Flow 9: Inspect Show Bookings and Seat Map
   */
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
              Staff Portal
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 mt-1">
            <ShieldCheck className="w-8 h-8 text-rose-400" />
            <span>Cinema Admin Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage movie listings, schedule screenings without overlaps, and view show revenues
          </p>
        </div>

        {/* Dashboard Sub-Tabs */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'stats'
                ? 'bg-amber-500 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Shows & Bookings</span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'schedule'
                ? 'bg-amber-500 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule Show</span>
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'movies'
                ? 'bg-amber-500 text-slate-950 shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Manage Movies</span>
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div className={`p-4 rounded-2xl border text-sm flex items-center justify-between ${
          alert.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-xs hover:underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: SHOWS & OCCUPANCY STATS (Bonus Flow 9) */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Show Occupancy & Revenue</span>
              <span className="text-xs font-normal text-slate-400 font-mono">
                ({showStats.length} total shows)
              </span>
            </h2>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-slate-400 animate-pulse">Loading stats...</div>
          ) : showStats.length === 0 ? (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400">
              No shows scheduled yet. Go to "Schedule Show" to add your first screening.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {showStats.map((stat) => (
                <div
                  key={stat.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>{stat.show_date}</span>
                      <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                        {stat.start_time}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white line-clamp-1">
                      {stat.movie_title}
                    </h3>

                    {/* Progress Bar for Occupancy */}
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">Seats Booked</span>
                        <span className="text-amber-400 font-mono">
                          {stat.booked_seats} / 80 ({stat.percentageFull}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                          style={{ width: `${stat.percentageFull}%` }}
                        />
                      </div>
                    </div>

                    {/* Total Revenue */}
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-slate-400">Ticket Price: ₹{stat.ticket_price}</span>
                      <span className="font-bold text-emerald-400 flex items-center">
                        Revenue: ₹{stat.total_revenue}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleInspectShow(stat.id)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>View Bookings & Map</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteShow(stat.id)}
                      title="Delete Show"
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
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

      {/* TAB 2: SCHEDULE SHOW (Flow 7: Overlap validation) */}
      {activeTab === 'schedule' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Schedule a New Show</h2>
            <p className="text-xs text-slate-400 mt-1">
              Screenings are hosted on the single screen. The system automatically rejects overlapping shows.
            </p>
          </div>

          <form onSubmit={handleAddShow} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Select Movie
              </label>
              <select
                required
                value={selectedMovieId}
                onChange={(e) => setSelectedMovieId(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
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
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Show Date
                </label>
                <input
                  type="date"
                  required
                  value={showDate}
                  onChange={(e) => setShowDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Ticket Price (₹)
              </label>
              <input
                type="number"
                required
                min={0}
                step={10}
                value={ticketPrice}
                onChange={(e) => setTicketPrice(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-300">
              💡 <strong>Screen Overlap Rule:</strong> Two shows cannot occupy the cinema screen at the same time. Start time + movie runtime is enforced automatically.
            </div>

            <button
              type="submit"
              disabled={isSubmittingShow}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
            >
              {isSubmittingShow ? 'Checking Overlaps & Scheduling...' : 'Schedule Show & Initialize 80 Seats'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: MANAGE MOVIES (Flow 7: Add/Edit/Delete) */}
      {activeTab === 'movies' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Movie Form (Add / Edit) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-white">
              {editingMovieId ? 'Edit Movie' : 'Add New Movie'}
            </h3>

            <form onSubmit={handleSaveMovie} className="space-y-3.5">
              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gladiator II"
                  value={movieTitle}
                  onChange={(e) => setMovieTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Movie plot synopsis..."
                  value={movieDescription}
                  onChange={(e) => setMovieDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">
                  Poster Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={moviePoster}
                  onChange={(e) => setMoviePoster(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">
                    Language
                  </label>
                  <input
                    type="text"
                    required
                    value={movieLanguage}
                    onChange={(e) => setMovieLanguage(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">
                    Duration (m)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={movieDuration}
                    onChange={(e) => setMovieDuration(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">
                    Rating
                  </label>
                  <select
                    value={movieRating}
                    onChange={(e) => setMovieRating(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="U">U</option>
                    <option value="UA">UA</option>
                    <option value="A">A</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
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
                    className="px-4 py-2.5 bg-slate-800 text-slate-400 text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Movies List */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xl font-bold text-white mb-2">Movie Catalogue</h3>
            {movies.map((m) => (
              <div
                key={m.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-16 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                    <img
                      src={m.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80'}
                      alt={m.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{m.title}</h4>
                    <p className="text-xs text-slate-400">
                      {m.language} • {m.duration_mins} mins • Rating: <strong className="text-amber-400">{m.rating}</strong>
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
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMovie(m.id)}
                    title="Delete Movie"
                    className="p-2 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* INSPECT SHOW MODAL (Bonus Flow 9: Customer list & visual seat map) */}
      {inspectShowId && inspectData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-white overflow-y-auto space-y-6">
            
            <button
              onClick={() => {
                setInspectShowId(null);
                setInspectData(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div>
              <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                Show Details & Bookings
              </span>
              <h2 className="text-2xl font-black text-white mt-0.5">
                {inspectData.show.movie_title}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {inspectData.show.show_date} at {inspectData.show.start_time} • {inspectData.bookings.length} Bookings Made
              </p>
            </div>

            {/* Visual Seat Map (Flow 9 Acceptance: "The admin sees the same seat map as customers, with booked seats marked.") */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
              <div className="text-center">
                <div className="w-2/3 h-1.5 bg-amber-400/80 rounded-full mx-auto" />
                <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mt-1 block">
                  Screen This Way
                </span>
              </div>

              {/* 8x10 Grid View */}
              <div className="space-y-2 overflow-x-auto pb-2">
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((row) => (
                  <div key={row} className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <span className="w-5 text-center font-bold text-xs text-slate-500 font-mono">
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
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded text-[10px] font-bold flex items-center justify-center transition-all ${
                              isBooked
                                ? 'bg-rose-600 text-white shadow'
                                : 'bg-slate-800 text-slate-400'
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

              <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-slate-800" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-rose-600" />
                  <span>Booked</span>
                </div>
              </div>
            </div>

            {/* List of Bookings (Flow 9 Acceptance: "The admin can open a show and see the list of bookings (booking ID, customer name, seats, time booked)") */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Customer Bookings List</span>
              </h3>

              {inspectData.bookings.length === 0 ? (
                <p className="text-xs text-slate-400 bg-slate-800/40 p-4 rounded-xl">
                  No tickets booked for this show yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {inspectData.bookings.map((b) => (
                    <div
                      key={b.booking_id}
                      className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white text-sm">
                          {b.customer_name} <span className="font-normal text-slate-400">({b.customer_email})</span>
                        </div>
                        <div className="text-slate-400 mt-0.5">
                          Booking ID: <strong className="font-mono text-amber-400">#{b.booking_id}</strong> • Booked at: {new Date(b.booked_at).toLocaleString()}
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <span className="font-mono font-bold text-amber-400 block">
                          Seats: {b.seats || 'None'}
                        </span>
                        <span className="font-semibold text-emerald-400">
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
