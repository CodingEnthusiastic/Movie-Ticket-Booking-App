/**
 * ============================================================================
 * MY BOOKINGS PAGE (frontend/src/pages/MyBookingsPage.tsx)
 * ============================================================================
 *
 * Implements:
 * - Flow 6: Isolated user bookings (upcoming first, then past)
 * - Bonus Flow 8: Cancel booking (permitted up to 2 hours before show start)
 *
 * 🎓 FOR VIBE CODERS - CANCELLATION TIME WINDOW LOGIC:
 * ----------------------------------------------------------------------------
 * We check if `showDateTime - Date.now() >= 2 hours`:
 * - If YES: A red "Cancel Booking" button is rendered.
 * - If NO (less than 2 hours or show is past): Button is disabled or shows a notice:
 *   "Cancellations are allowed only up to 2 hours before showtime."
 */

import React, { useState, useEffect } from 'react';
import { Ticket, Calendar, Clock, Film, AlertTriangle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Booking } from '../types.js';
import { api } from '../api.js';

interface MyBookingsPageProps {
  onBackToMovies: () => void;
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({ onBackToMovies }) => {
  // `useState` Hook: Holds list of all bookings for the logged-in customer
  const [bookings, setBookings] = useState<Booking[]>([]);

  // `useState` Hook: Loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // `useState` Hook: Active tab ('all', 'upcoming', 'past')
  const [filterTab, setFilterTab] = useState<'all' | 'upcoming' | 'past'>('all');

  // `useState` Hook: Booking selected for cancellation confirmation
  const [cancellingBookingId, setCancellingBookingId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  /**
   * Fetches user's bookings from GET /api/bookings/my-bookings
   */
  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/bookings/my-bookings');
      setBookings(res.data.bookings || []);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to fetch bookings.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  /**
   * Flow 8: Handles cancellation request
   */
  const handleConfirmCancel = async () => {
    if (!cancellingBookingId) return;

    setIsCancelling(true);
    setStatusMessage(null);

    try {
      await api.post(`/bookings/${cancellingBookingId}/cancel`);
      setStatusMessage({
        type: 'success',
        text: 'Booking cancelled successfully. Your seats are now available again.'
      });
      setCancellingBookingId(null);
      // Reload bookings to reflect updated status
      fetchBookings();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to cancel booking.'
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Filter bookings based on active tab
  const displayedBookings = bookings.filter((b) => {
    if (filterTab === 'upcoming') return b.isUpcoming;
    if (filterTab === 'past') return !b.isUpcoming;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <button
            onClick={onBackToMovies}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Movies</span>
          </button>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Ticket className="w-8 h-8 text-amber-400" />
            <span>My Bookings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            View all your cinema tickets and manage upcoming reservations
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setFilterTab('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'upcoming'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilterTab('past')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'past'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Past
          </button>
        </div>
      </div>

      {/* Success / Error Notification Banner */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-sm flex items-center justify-between ${
          statusMessage.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Bookings List (Flow 6 Acceptance Criteria: Upcoming first, then past) */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 animate-pulse">
          <p>Loading your tickets...</p>
        </div>
      ) : displayedBookings.length === 0 ? (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-3">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Bookings Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You don't have any {filterTab !== 'all' ? filterTab : ''} bookings yet. Browse our movies and pick your seats!
          </p>
          <button
            onClick={onBackToMovies}
            className="mt-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all"
          >
            Browse Movies
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedBookings.map((booking) => {
            const isCancelled = booking.status === 'cancelled';

            return (
              <div
                key={booking.id}
                className={`bg-slate-900 border rounded-2xl p-5 sm:p-6 transition-all ${
                  isCancelled
                    ? 'border-slate-800/80 opacity-60'
                    : 'border-slate-800 hover:border-slate-700 shadow-lg'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Left: Movie & Show Details */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
                      <img
                        src={booking.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80'}
                        alt={booking.movieTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500">
                          #{booking.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          isCancelled
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {booking.status}
                        </span>
                        {booking.isUpcoming && !isCancelled && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                            Upcoming
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-white">
                        {booking.movieTitle}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {booking.showDate}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono font-semibold text-slate-200">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {booking.startTime}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 pt-1">
                        <span className="text-slate-500">Seats: </span>
                        <span className="font-mono font-bold text-amber-400">
                          {booking.seats.join(', ')}
                        </span>
                        <span className="text-slate-500 ml-3">Paid: </span>
                        <span className="font-semibold text-white">₹{booking.totalAmount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Cancellation Action (Flow 8 Rule) */}
                  <div className="shrink-0 flex flex-col md:items-end justify-center pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                    {booking.status === 'confirmed' && booking.isUpcoming && (
                      <div>
                        {booking.canCancel ? (
                          <button
                            type="button"
                            onClick={() => setCancellingBookingId(booking.id)}
                            className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-semibold rounded-xl transition-all"
                          >
                            Cancel Booking
                          </button>
                        ) : (
                          <div className="text-[11px] text-slate-500 text-right max-w-xs">
                            <span className="block font-medium text-slate-400">Cannot cancel</span>
                            <span>Within 2 hours of showtime</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Dialog (Bonus Flow 8) */}
      {cancellingBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white space-y-4">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl w-fit text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-white">
              Cancel Booking #{cancellingBookingId}?
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to cancel this booking? Your seats will be released immediately so other customers can book them.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancellingBookingId(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Keep Booking
              </button>

              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
