/**
 * ============================================================================
 * MY BOOKINGS PAGE (frontend/src/pages/MyBookingsPage.tsx)
 * ============================================================================
 *
 * Implements:
 * - Flow 6: User bookings (upcoming first, then past)
 * - Bonus Flow 8: Cancel booking (permitted up to 2 hours before show start)
 * - Modern dark cinema UI with light high-contrast typography
 */

import React, { useState, useEffect } from 'react';
import { Ticket, Calendar, Clock, Film, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Booking } from '../types.js';
import { api } from '../api.js';

interface MyBookingsPageProps {
  onBackToMovies: () => void;
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({ onBackToMovies }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterTab, setFilterTab] = useState<'all' | 'upcoming' | 'past'>('all');
  const [cancellingBookingId, setCancellingBookingId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const displayedBookings = bookings.filter((b) => {
    if (filterTab === 'upcoming') return b.isUpcoming;
    if (filterTab === 'past') return !b.isUpcoming;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <button
            onClick={onBackToMovies}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Back to Movies</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <Ticket className="w-8 h-8 text-amber-400" />
            <span>My Bookings</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            View all your cinema tickets and manage upcoming reservations
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-[#0d1322] border border-white/[0.08] p-1.5 rounded-2xl">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'all'
                ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setFilterTab('upcoming')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'upcoming'
                ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilterTab('past')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterTab === 'past'
                ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Past
          </button>
        </div>
      </div>

      {/* Success / Error Notification */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between ${
          statusMessage.type === 'success'
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
            : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
        }`}>
          <div className="flex items-center gap-2.5 font-semibold">
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs hover:underline ml-4 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Bookings List */}
      {isLoading ? (
        <div className="text-center py-20 text-slate-300 animate-pulse font-semibold">
          <p>Loading your tickets...</p>
        </div>
      ) : displayedBookings.length === 0 ? (
        <div className="p-14 bg-[#0b101d] border border-white/[0.08] rounded-3xl text-center space-y-3">
          <Ticket className="w-14 h-14 text-slate-600 mx-auto" />
          <h3 className="text-xl font-bold text-white">No Bookings Found</h3>
          <p className="text-xs text-slate-300 max-w-sm mx-auto">
            You don't have any {filterTab !== 'all' ? filterTab : ''} bookings yet. Browse our movies and pick your seats!
          </p>
          <button
            onClick={onBackToMovies}
            className="mt-3 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all"
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
                className={`bg-[#0b101d] border rounded-3xl p-6 transition-all ${
                  isCancelled
                    ? 'border-white/[0.04] opacity-50'
                    : 'border-white/[0.09] hover:border-amber-400/50 shadow-xl'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  
                  {/* Left: Movie & Show Details */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-24 shrink-0 rounded-2xl overflow-hidden bg-slate-950 border border-white/[0.1]">
                      <img
                        src={booking.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80'}
                        alt={booking.movieTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          #{booking.id}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          isCancelled
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {booking.status}
                        </span>
                        {booking.isUpcoming && !isCancelled && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Upcoming
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-black text-white">
                        {booking.movieTitle}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          {booking.showDate}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5 font-mono font-bold text-slate-100">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          {booking.startTime}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 pt-1">
                        <span className="text-slate-400">Seats: </span>
                        <span className="font-mono font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {booking.seats.join(', ')}
                        </span>
                        <span className="text-slate-400 ml-3">Amount: </span>
                        <span className="font-black text-emerald-400 text-sm">₹{booking.totalAmount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Cancellation Action (Flow 8) */}
                  <div className="shrink-0 flex flex-col md:items-end justify-center pt-3 md:pt-0 border-t md:border-t-0 border-white/[0.08]">
                    {booking.status === 'confirmed' && booking.isUpcoming && (
                      <div>
                        {booking.canCancel ? (
                          <button
                            type="button"
                            onClick={() => setCancellingBookingId(booking.id)}
                            className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold rounded-xl transition-all shadow-md"
                          >
                            Cancel Booking
                          </button>
                        ) : (
                          <div className="text-[11px] text-slate-400 text-right max-w-xs font-medium">
                            <span className="block font-bold text-slate-300">Cannot cancel</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#0b101d] border border-white/[0.1] rounded-3xl p-6 sm:p-8 text-white space-y-4 shadow-2xl">
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-2xl w-fit text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-white">
              Cancel Booking #{cancellingBookingId}?
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Are you sure you want to cancel this booking? Your seats will be released immediately so other customers can book them.
            </p>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setCancellingBookingId(null)}
                className="flex-1 py-3 bg-white/[0.08] hover:bg-white/[0.12] text-slate-200 text-xs font-bold rounded-xl"
              >
                Keep Booking
              </button>

              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all disabled:opacity-50"
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
