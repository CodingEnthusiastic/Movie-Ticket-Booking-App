/**
 * ============================================================================
 * SEAT BOOKING PAGE (frontend/src/pages/SeatBookingPage.tsx)
 * ============================================================================
 *
 * Implements:
 * - Flow 1: Auth check (prompts login if unauthenticated)
 * - Flow 3: See the seat map (8x10 grid with accurate states)
 * - Flow 4: Select 1-6 seats, hold for 5 minutes, conflict detection
 * - Flow 5: Fake payment step (Success & Failure buttons), receipt confirmation
 * - Flow 10: Real-time live seat updates via WebSockets (Socket.IO)
 *
 * 🎓 FOR VIBE CODERS - SOCKET.IO & WEBSOCKET EXPLAINER:
 * ----------------------------------------------------------------------------
 * Traditional websites only fetch data when you click "Refresh".
 * But in a cinema app, if someone else books Seat C4 while you are staring at it,
 * you need to see C4 turn RED instantly!
 *
 * How this works:
 * 1. When this page opens, `useEffect` connects to the server via Socket.IO:
 *    `const socket = io('http://localhost:5000');`
 * 2. It joins a specific room for this show:
 *    `socket.emit('join_show', showId);`
 * 3. Whenever ANY customer anywhere holds, releases, or books a seat, the server
 *    emits `seats_updated` to that room.
 * 4. This component hears that event and immediately calls `setSeats(data.seats)` -
 *    causing the seat map to update right before your eyes without refreshing!
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Calendar, Film, ShieldAlert, Sparkles } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { Seat, ShowDetail } from '../types.js';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.js';
import { SeatMap } from '../components/SeatMap.js';
import { PaymentModal } from '../components/PaymentModal.js';
import { BookingSuccessModal } from '../components/BookingSuccessModal.js';

interface SeatBookingPageProps {
  showId: number;
  onBack: () => void;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onViewMyBookings: () => void;
}

export const SeatBookingPage: React.FC<SeatBookingPageProps> = ({
  showId,
  onBack,
  onOpenAuth,
  onViewMyBookings
}) => {
  const { user } = useAuth();

  // State: Show metadata (movie title, date, price, duration)
  const [show, setShow] = useState<ShowDetail | null>(null);

  // State: All 80 seats and their states (available, held, booked)
  const [seats, setSeats] = useState<Seat[]>([]);

  // State: Seats currently selected by the user in this session
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  // State: Loading and error indicators
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State: Hold process and 5-minute expiration timestamp
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);

  // State: Modal visibility
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);

  /**
   * Helper function to fetch the current seats from the backend
   */
  const loadShowAndSeats = async () => {
    try {
      const res = await api.get(`/shows/${showId}/seats`);
      setShow(res.data.show);
      setSeats(res.data.seats);
    } catch (err: any) {
      console.error('Error loading show seats:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to load seats.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * `useEffect` Hook: Initial Load + Bonus Flow 10 (WebSocket Live Updates)
   */
  useEffect(() => {
    loadShowAndSeats();

    // 1. Connect to backend WebSocket server
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket: Socket = io(socketUrl, { transports: ['websocket', 'polling'] });

    // 2. Join the dedicated room for this show
    socket.emit('join_show', showId);

    // 3. Listen for live seat changes from other users
    socket.on('seats_updated', (data: { showId: number; seats: Seat[] }) => {
      if (data.showId === showId) {
        setSeats(data.seats);

        // If a seat that the user had clicked got taken by someone else in the meantime:
        setSelectedSeats((prevSelected) => {
          const stillAvailable = prevSelected.filter((seatNum) => {
            const updatedSeat = data.seats.find((s) => s.seatNumber === seatNum);
            return updatedSeat && updatedSeat.status === 'available';
          });

          if (stillAvailable.length < prevSelected.length) {
            setErrorMessage('One or more of your selected seats were just taken by another customer.');
          }

          return stillAvailable;
        });
      }
    });

    // Cleanup when user leaves this page
    return () => {
      socket.emit('leave_show', showId);
      socket.disconnect();
    };
  }, [showId]);

  /**
   * Seat Selection Handler:
   * Enforces Flow 4 Rule: "A user can select 1 to 6 seats. Trying a 7th shows a message."
   */
  const handleToggleSeat = (seatNumber: string) => {
    setErrorMessage(null);

    if (selectedSeats.includes(seatNumber)) {
      // Toggle off if already selected
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
    } else {
      // If user tries to pick more than 6 seats:
      if (selectedSeats.length >= 6) {
        setErrorMessage('Maximum 6 seats per booking. Please deselect a seat first if you want a different one.');
        return;
      }
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  /**
   * Continue Button Handler:
   * Enforces Flow 1 Rule: Must be logged in to book.
   * Enforces Flow 4 Rule: Holds seats for 5 minutes with conflict detection.
   */
  const handleContinueToPayment = async () => {
    // 1. Ensure user is logged in
    if (!user) {
      onOpenAuth('login');
      return;
    }

    if (selectedSeats.length === 0) {
      setErrorMessage('Please select at least 1 seat.');
      return;
    }

    setIsHolding(true);
    setErrorMessage(null);

    try {
      // Call backend to hold the seats for 5 minutes
      const res = await api.post('/bookings/hold', {
        showId,
        seats: selectedSeats
      });

      setHoldExpiresAt(res.data.expiresAt);
      setIsPaymentModalOpen(true);
    } catch (err: any) {
      // Flow 4: If any chosen seat was taken by someone else, hold fails and user is told which seat
      const msg = err.response?.data?.error || 'Failed to hold seats. Please refresh.';
      setErrorMessage(msg);
      // Reload seat state
      loadShowAndSeats();
    } finally {
      setIsHolding(false);
    }
  };

  /**
   * Flow 5: Payment Success Handler
   */
  const handlePaymentSuccess = async () => {
    const res = await api.post('/bookings/confirm', {
      showId,
      seats: selectedSeats
    });

    setConfirmedBooking(res.data.booking);
    setIsPaymentModalOpen(false);
    setIsSuccessModalOpen(true);
    // Refresh local seats
    loadShowAndSeats();
  };

  /**
   * Hold Expired Handler (5-minute timer ran out)
   */
  const handleHoldExpired = () => {
    setErrorMessage('Your 5-minute hold on these seats has expired.');
    setSelectedSeats([]);
    setHoldExpiresAt(null);
    loadShowAndSeats();
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-400 animate-pulse">
        <p>Loading interactive seat map...</p>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
        <h3 className="text-lg font-bold text-white">Show Not Found</h3>
        <button onClick={onBack} className="px-4 py-2 bg-slate-800 rounded-lg text-xs font-semibold">
          Return to Movie
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Navigation & Show Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Movie</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Live Sync Enabled (WebSocket Room #{showId})</span>
        </div>
      </div>

      {/* Show Information Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-semibold text-amber-400 tracking-wider block">
            Booking Tickets For
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {show.movieTitle}
          </h2>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {show.showDate}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono font-bold text-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {show.startTime}
            </span>
            <span>•</span>
            <span className="text-amber-400 font-semibold">
              ₹{show.ticketPrice} / seat
            </span>
          </div>
        </div>

        {!user && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl text-xs text-amber-300">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>You'll be asked to sign in before confirming seats</span>
          </div>
        )}
      </div>

      {/* The 8x10 Interactive Seat Map */}
      <SeatMap
        seats={seats}
        selectedSeats={selectedSeats}
        onToggleSeat={handleToggleSeat}
        ticketPrice={show.ticketPrice}
        onContinue={handleContinueToPayment}
        isHolding={isHolding}
        holdExpiresAt={holdExpiresAt}
        errorMessage={errorMessage}
      />

      {/* Fake Payment Modal (Flow 5) */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        movieTitle={show.movieTitle}
        showDate={show.showDate}
        startTime={show.startTime}
        seats={selectedSeats}
        totalAmount={selectedSeats.length * show.ticketPrice}
        expiresAt={holdExpiresAt}
        onPaymentSuccess={handlePaymentSuccess}
        onHoldExpired={handleHoldExpired}
      />

      {/* Booking Confirmation Receipt Modal (Flow 5) */}
      <BookingSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          setSelectedSeats([]);
        }}
        onViewMyBookings={onViewMyBookings}
        booking={confirmedBooking}
      />

    </div>
  );
};
