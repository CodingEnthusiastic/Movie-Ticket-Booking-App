/**
 * ============================================================================
 * BOOKING SUCCESS MODAL COMPONENT (frontend/src/components/BookingSuccessModal.tsx)
 * ============================================================================
 *
 * Implements Flow 5: Payment success confirmation receipt
 * Designed as a realistic glowing golden cinema E-Ticket with side perforations!
 */

import React from 'react';
import { CheckCircle2, Calendar, Clock, Film, ArrowRight, Sparkles, QrCode } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0b101d] border border-white/[0.1] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-6 sm:p-8 text-white overflow-hidden text-center">
        
        {/* Animated Checkmark Badge */}
        <div className="inline-flex p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-bounce">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight">
          Booking Confirmed!
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Your cinema tickets are reserved. Enjoy the movie!
        </p>

        {/* Digital Cinema Ticket Card with Perforations */}
        <div className="my-6 bg-gradient-to-b from-[#121a2d] to-[#151f38] border border-white/[0.1] rounded-2xl p-5 text-left shadow-2xl relative overflow-hidden">
          
          {/* Side notches */}
          <div className="ticket-perforation-left" />
          <div className="ticket-perforation-right" />

          {/* Ticket Header */}
          <div className="flex justify-between items-center pb-3 border-b border-dashed border-white/[0.15]">
            <span className="text-[11px] font-black text-amber-400 tracking-wider uppercase font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              CINEMA E-TICKET
            </span>
            <span className="text-xs font-black font-mono text-white bg-white/[0.08] px-2.5 py-0.5 rounded-md">
              #{booking.id}
            </span>
          </div>

          {/* Movie Title */}
          <div className="py-3.5">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{booking.movieTitle}</span>
            </h3>
          </div>

          {/* Show Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs py-2.5 border-t border-white/[0.08]">
            <div>
              <span className="text-slate-400 block mb-0.5 font-medium">Show Date</span>
              <span className="font-bold text-slate-100 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                {booking.showDate}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-medium">Show Time</span>
              <span className="font-bold text-slate-100 flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {booking.startTime}
              </span>
            </div>
          </div>

          {/* Seats and Total Price */}
          <div className="pt-3 border-t border-white/[0.08] flex justify-between items-center">
            <div>
              <span className="text-slate-400 block mb-0.5 text-xs font-medium">Seats</span>
              <span className="text-base font-black font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                {booking.seats.join(', ')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block mb-0.5 text-xs font-medium">Amount Paid</span>
              <span className="text-lg font-black text-emerald-400">
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
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2"
          >
            <span>View in My Bookings</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
