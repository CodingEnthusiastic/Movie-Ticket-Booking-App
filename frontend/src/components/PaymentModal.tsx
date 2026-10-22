/**
 * ============================================================================
 * PAYMENT MODAL COMPONENT (frontend/src/components/PaymentModal.tsx)
 * ============================================================================
 *
 * Implements Flow 5: Pay and confirm the booking
 * Features:
 * - Fake payment simulation with two clear buttons:
 *   1. "Payment success" (confirms booking and marks seats as booked)
 *   2. "Payment failure" (keeps seats held for remainder of 5 mins, gives 'Try again' option)
 * - Real-time 5-minute countdown timer with automatic hold expiration handling
 * - Clear error handling if payment is attempted after hold expires
 *
 * 🎓 FOR VIBE CODERS - `useEffect` TIMER EXPLAINER:
 * ----------------------------------------------------------------------------
 * We use `useEffect` to start a timer that ticks every 1 second:
 * `const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);`
 *
 * The return function `return () => clearInterval(timer);` is called a "Cleanup function".
 * It stops the timer when the modal closes, so the browser doesn't keep running
 * background timers and draining memory!
 */

import React, { useState, useEffect } from 'react';
import { X, Clock, AlertTriangle, CheckCircle, XCircle, CreditCard, RotateCcw } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieTitle: string;
  showDate: string;
  startTime: string;
  seats: string[];
  totalAmount: number;
  expiresAt: number | null;
  onPaymentSuccess: () => Promise<void>;
  onHoldExpired: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  movieTitle,
  showDate,
  startTime,
  seats,
  totalAmount,
  expiresAt,
  onPaymentSuccess,
  onHoldExpired
}) => {
  // `useState` Hook: Tracks remaining seconds on the 5-minute hold timer
  const [remainingSeconds, setRemainingSeconds] = useState<number>(300);

  // `useState` Hook: Tracks whether a payment attempt failed
  const [paymentFailed, setPaymentFailed] = useState<boolean>(false);

  // `useState` Hook: Tracks whether payment is currently in progress
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // `useState` Hook: Custom error message (e.g. if hold expired)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * `useEffect` Hook: Live 5-minute countdown timer
   */
  useEffect(() => {
    if (!isOpen || !expiresAt) return;

    // Calculate remaining seconds based on server's expiresAt timestamp
    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        setErrorMessage('Your 5-minute seat hold has expired. The seats have been released.');
        onHoldExpired();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    // Cleanup function: clears timer when modal unmounts
    return () => clearInterval(interval);
  }, [isOpen, expiresAt, onHoldExpired]);

  if (!isOpen) return null;

  // Format seconds into MM:SS (e.g. "04:59")
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isExpired = remainingSeconds <= 0;

  // Handle "Payment success" button click
  const handleSuccessClick = async () => {
    if (isExpired) {
      setErrorMessage('Cannot pay: Your 5-minute hold has already expired.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      await onPaymentSuccess();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to complete booking. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle "Payment failure" button click (Flow 5 rule)
  const handleFailureClick = () => {
    setPaymentFailed(true);
    // Notice: We do NOT delete the hold here!
    // Flow 5 Acceptance Criteria: "The seats stay held for the rest of the 5 minutes
    // so the user can retry; after that they become available to everyone."
  };

  // User clicks "Try Again" after failed payment
  const handleRetryPayment = () => {
    setPaymentFailed(false);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-white overflow-hidden">
        
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
            <CreditCard className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Checkout & Fake Payment
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Testing sandbox: Choose success or failure to test both flows
          </p>
        </div>

        {/* 5-Minute Hold Countdown Bar */}
        <div className={`p-3.5 rounded-2xl border mb-6 flex items-center justify-between ${
          isExpired
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            : remainingSeconds < 60
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse'
            : 'bg-slate-800/80 border-slate-700 text-slate-300'
        }`}>
          <div className="flex items-center gap-2 text-xs font-medium">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Seats held for:</span>
          </div>
          <div className="font-mono font-bold text-lg text-amber-400">
            {isExpired ? '00:00 (Expired)' : formattedTime}
          </div>
        </div>

        {/* Order Details Card */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 mb-6 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Movie</span>
            <span className="font-semibold text-white">{movieTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Date & Time</span>
            <span className="text-slate-200">{showDate} at {startTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Seats</span>
            <span className="font-mono font-bold text-amber-400">{seats.join(', ')}</span>
          </div>
          <div className="pt-2 border-t border-slate-700/60 flex justify-between items-center text-base font-bold">
            <span className="text-white">Total Amount</span>
            <span className="text-xl text-amber-400">₹{totalAmount}</span>
          </div>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Payment Failure State (Flow 5 Acceptance Criteria) */}
        {paymentFailed ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center space-y-3 mb-4 animate-shake">
            <div className="inline-flex p-2 rounded-full bg-rose-500/20 text-rose-400">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-rose-300">Payment Failed</h3>
              <p className="text-xs text-rose-200/80 mt-1 leading-relaxed">
                Your card was declined or the transaction timed out. Your seats stay held for the remainder of your 5-minute timer so you can try again!
              </p>
            </div>
            <button
              type="button"
              onClick={handleRetryPayment}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-xl shadow transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        ) : (
          /* Normal Payment Action Buttons (Flow 5 Requirement) */
          <div className="space-y-3">
            <p className="text-xs text-center text-slate-400 mb-2">
              Click a test button below to simulate payment:
            </p>

            <button
              type="button"
              disabled={isExpired || isProcessing}
              onClick={handleSuccessClick}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-600 font-bold rounded-xl shadow-lg shadow-emerald-600/20 disabled:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5 text-emerald-200" />
              <span>{isProcessing ? 'Confirming Booking...' : 'Payment Success'}</span>
            </button>

            <button
              type="button"
              disabled={isExpired || isProcessing}
              onClick={handleFailureClick}
              className="w-full py-3.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5 text-rose-400" />
              <span>Payment Failure</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
