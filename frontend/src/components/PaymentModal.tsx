/**
 * ============================================================================
 * PAYMENT MODAL COMPONENT (frontend/src/components/PaymentModal.tsx)
 * ============================================================================
 *
 * Implements Flow 5: Fake payment step
 * Features:
 * - High-contrast text on dark glass modal
 * - 5-minute countdown timer with glowing amber badge
 * - "Payment Success" (confirms booking)
 * - "Payment Failure" (keeps hold for retry)
 * - Expiration detection
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
  const [remainingSeconds, setRemainingSeconds] = useState<number>(300);
  const [paymentFailed, setPaymentFailed] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !expiresAt) return;

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

    return () => clearInterval(interval);
  }, [isOpen, expiresAt, onHoldExpired]);

  if (!isOpen) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isExpired = remainingSeconds <= 0;

  const handleSuccessClick = async () => {
    if (isExpired) {
      setErrorMessage('Cannot pay: Your 5-minute hold has already expired.');
      return;
    }

    if (!seats || seats.length === 0) {
      setErrorMessage('No seats are currently selected. Please choose at least 1 seat.');
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

  const handleFailureClick = () => {
    setPaymentFailed(true);
  };

  const handleRetryPayment = () => {
    setPaymentFailed(false);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0b101d] border border-white/[0.1] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-6 sm:p-8 text-white overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/[0.08] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/40 mb-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <CreditCard className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Checkout & Fake Payment
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Test Sandbox: Click either button below to test the corresponding flow
          </p>
        </div>

        {/* 5-Minute Hold Countdown Bar */}
        <div className={`p-4 rounded-2xl border mb-6 flex items-center justify-between ${
          isExpired
            ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
            : remainingSeconds < 60
            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
            : 'bg-[#12192c] border-white/[0.1] text-slate-200'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Seats Held For:</span>
          </div>
          <div className="font-mono font-black text-xl text-amber-400">
            {isExpired ? '00:00 (Expired)' : formattedTime}
          </div>
        </div>

        {/* Order Details Card */}
        <div className="bg-[#12192c]/90 border border-white/[0.08] rounded-2xl p-5 mb-6 space-y-2.5 text-xs sm:text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400 font-medium">Movie</span>
            <span className="font-bold text-white">{movieTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-medium">Date & Time</span>
            <span className="text-slate-200 font-semibold">{showDate} at {startTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-medium">Seats</span>
            <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {seats && seats.length > 0 ? seats.join(', ') : 'None'}
            </span>
          </div>
          <div className="pt-3 border-t border-white/[0.08] flex justify-between items-center text-sm sm:text-base font-bold">
            <span className="text-white">Total Amount</span>
            <span className="text-2xl font-black text-amber-400">₹{totalAmount}</span>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-200 text-xs font-semibold flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Payment Failure State (Flow 5) */}
        {paymentFailed ? (
          <div className="p-5 bg-rose-500/15 border border-rose-500/40 rounded-2xl text-center space-y-3 mb-4 animate-shake">
            <div className="inline-flex p-2.5 rounded-full bg-rose-500/30 text-rose-300">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-black text-lg text-rose-300">Payment Failed</h3>
              <p className="text-xs text-rose-200 mt-1 leading-relaxed">
                Your payment did not go through. Your seats stay held for the remainder of the 5 minutes so you can retry now!
              </p>
            </div>
            <button
              type="button"
              onClick={handleRetryPayment}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        ) : (
          /* Payment Action Buttons (Flow 5) */
          <div className="space-y-3">
            <p className="text-xs text-center text-slate-400 font-semibold mb-2">
              Select an outcome below to test the acceptance criteria:
            </p>

            <button
              type="button"
              disabled={isExpired || isProcessing || !seats || seats.length === 0}
              onClick={handleSuccessClick}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-slate-800 disabled:to-slate-800 text-white disabled:text-slate-600 font-black rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5 text-white" />
              <span>{isProcessing ? 'Confirming Ticket Booking...' : 'Payment Success'}</span>
            </button>

            <button
              type="button"
              disabled={isExpired || isProcessing}
              onClick={handleFailureClick}
              className="w-full py-3.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 font-black rounded-xl transition-all flex items-center justify-center gap-2"
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
