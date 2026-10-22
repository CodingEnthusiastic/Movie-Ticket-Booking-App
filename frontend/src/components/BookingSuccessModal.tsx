/**
 * ============================================================================
 * BOOKING SUCCESS MODAL COMPONENT (frontend/src/components/BookingSuccessModal.tsx)
 * ============================================================================
 *
 * Implements Flow 5 confirmation receipt:
 * Displays:
 * - Booking ID
 * - Movie Title & Poster
 * - Show Date & Time
 * - Confirmed Seats
 * - Total Amount Paid
 * - Navigation buttons ("View My Bookings" or "Book More")
 */

import React from 'react';
import { CheckCircle2, Ticket, Calendar, Clock, Film, DollarSign, ArrowRight } from 'lucide-react';

interface BookingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewMyBookings: () => void;
  booking: {
    id: number;
    movieTitle: string;
    showDate: string;
    startTime: string;
    seats: string[];
    totalAmount: number;
    posterUrl?: string;
  } | null;
}

export const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({
  isOpen,
  onClose,
  onViewMyBookings,
  booking
}) => {
  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-white overflow-hidden text-center">
        
        {/* Animated Checkmark Badge */}
        <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight">
          Booking Confirmed!
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Your cinema tickets are booked and safe. Enjoy the movie!
        </p>

        {/* Digital Ticket Card */}
        <div className="my-6 bg-gradient-to-b from-slate-800 to-slate-800/60 border border-slate-700/80 rounded-2xl p-5 text-left shadow-lg relative">
          
          {/* Booking ID Header */}
          <div className="flex justify-between items-center pb-3 border-b border-dashed border-slate-700">
            <span className="text-xs text-slate-400 font-mono">BOOKING ID</span>
            <span className="text-sm font-black font-mono text-amber-400 tracking-wider">
              #{booking.id}
            </span>
          </div>

          {/* Movie Title */}
          <div className="py-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{booking.movieTitle}</span>
            </h3>
          </div>

          {/* Show Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs py-2 border-t border-slate-700/60">
            <div>
              <span className="text-slate-400 block mb-0.5">Show Date</span>
              <span className="font-semibold text-slate-200 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {booking.showDate}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Show Time</span>
              <span className="font-semibold text-slate-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {booking.startTime}
              </span>
            </div>
          </div>

          {/* Seats and Total Price */}
          <div className="pt-3 border-t border-slate-700/60 flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-400 block mb-0.5">Seats</span>
              <span className="text-sm font-bold font-mono text-amber-400">
                {booking.seats.join(', ')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block mb-0.5">Paid</span>
              <span className="text-base font-black text-emerald-400">
                ₹{booking.totalAmount}
              </span>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onViewMyBookings}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Go to My Bookings</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
