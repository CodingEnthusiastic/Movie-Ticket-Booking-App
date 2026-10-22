/**
 * ============================================================================
 * SEAT MAP COMPONENT (frontend/src/components/SeatMap.tsx)
 * ============================================================================
 *
 * Implements:
 * - Flow 3: See the seat map (8 rows A-H x 10 cols 1-10 = 80 seats)
 * - Flow 4: Select 1 to 6 seats with max limit validation & price calculation
 *
 * Cinematic Design Enhancements:
 * - Illuminated curved projection screen with spotlight beam effect
 * - High-contrast luxury cinema recliner seats
 * - Glowing selected seats with vibrant amber highlight
 * - Real-time seat legend & interactive counter
 */

import React from 'react';
import { Lock, Check, AlertTriangle, Monitor, Sparkles } from 'lucide-react';
import { Seat } from '../types.js';

interface SeatMapProps {
  seats: Seat[];
  selectedSeats: string[];
  onToggleSeat: (seatNumber: string) => void;
  ticketPrice: number;
  onContinue: () => void;
  isHolding: boolean;
  holdExpiresAt: number | null;
  errorMessage?: string | null;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  selectedSeats,
  onToggleSeat,
  ticketPrice,
  onContinue,
  isHolding,
  errorMessage
}) => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const seatLookup = React.useMemo(() => {
    const map = new Map<string, Seat>();
    seats.forEach((s) => map.set(s.seatNumber, s));
    return map;
  }, [seats]);

  const totalPrice = selectedSeats.length * ticketPrice;

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#0b101d]/90 backdrop-blur-2xl border border-white/[0.09] rounded-3xl p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
      
      {/* 1. Cinema Projection Screen with Light Beam (Flow 3) */}
      <div className="w-full flex flex-col items-center mb-12 relative overflow-hidden pt-4">
        {/* Overhead projector light beam */}
        <div className="absolute top-0 w-3/4 h-20 bg-gradient-to-b from-amber-400/10 via-amber-400/5 to-transparent blur-md pointer-events-none" />
        
        {/* Curved Screen Arc */}
        <div className="w-4/5 h-3 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full shadow-[0_0_25px_rgba(245,158,11,0.8)] cinema-screen-arc" />
        
        <div className="flex items-center gap-2 text-xs font-black tracking-widest text-amber-300 uppercase mt-3">
          <Monitor className="w-4 h-4 text-amber-400" />
          <span>SCREEN THIS WAY (ALL EYES HERE)</span>
        </div>
      </div>

      {/* Error / Warning Alert */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-500/15 border border-rose-500/40 rounded-2xl text-rose-200 text-xs sm:text-sm flex items-center gap-3 animate-shake shadow-lg">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* 2. The 8 x 10 Seat Grid */}
      <div className="space-y-4 mb-10 overflow-x-auto pb-4 pt-2">
        {rows.map((row) => (
          <div key={row} className="flex items-center justify-center gap-2 sm:gap-3.5 min-w-[540px]">
            {/* Row Letter */}
            <span className="w-6 text-center font-black text-sm text-amber-400/80 font-mono">
              {row}
            </span>

            {/* 10 Seats for this row */}
            <div className="flex gap-2 sm:gap-2.5">
              {cols.map((col) => {
                const seatCode = `${row}${col}`;
                const seatData = seatLookup.get(seatCode);

                const isBooked = seatData?.status === 'booked';
                const isHeldByOther = seatData?.heldByOther || (seatData?.status === 'held' && !seatData?.heldByMe);
                const isHeldByMe = seatData?.heldByMe;
                const isSelected = selectedSeats.includes(seatCode);

                // Styling logic
                let buttonStyle = 'bg-[#151c2e] hover:bg-[#1e2842] text-slate-200 border-white/[0.08] hover:border-amber-400/40 shadow-sm';
                let isDisabled = false;

                if (isBooked) {
                  buttonStyle = 'bg-slate-950/90 text-slate-700 border-white/[0.03] cursor-not-allowed opacity-40';
                  isDisabled = true;
                } else if (isHeldByOther) {
                  buttonStyle = 'bg-amber-950/40 text-amber-500 border-amber-900/60 cursor-not-allowed';
                  isDisabled = true;
                } else if (isSelected || isHeldByMe) {
                  buttonStyle = 'bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black border-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.6)] scale-110 z-10';
                }

                const isAisleGap = col === 5;

                return (
                  <React.Fragment key={seatCode}>
                    <button
                      type="button"
                      disabled={isDisabled}
                      onClick={() => onToggleSeat(seatCode)}
                      title={`Seat ${seatCode} - ${
                        isBooked
                          ? 'Already Booked'
                          : isHeldByOther
                          ? 'Held by another customer'
                          : isSelected
                          ? 'Selected by you'
                          : `Available (₹${ticketPrice})`
                      }`}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl border text-xs font-bold flex items-center justify-center transition-all duration-150 relative ${buttonStyle}`}
                    >
                      {isBooked ? (
                        <span className="text-[10px] text-slate-600 font-mono">✕</span>
                      ) : isHeldByOther ? (
                        <Lock className="w-3.5 h-3.5 text-amber-500/80" />
                      ) : isSelected ? (
                        <Check className="w-4 h-4 stroke-[3.5]" />
                      ) : (
                        col
                      )}
                    </button>
                    {isAisleGap && <div className="w-4 sm:w-8" />}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Row Letter on Right */}
            <span className="w-6 text-center font-black text-sm text-amber-400/80 font-mono">
              {row}
            </span>
          </div>
        ))}
      </div>

      {/* 3. Seat States Legend (Flow 3) */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-6 border-t border-white/[0.08] text-xs font-semibold text-slate-300">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-lg bg-[#151c2e] border border-white/[0.12]" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-lg bg-amber-400 border border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
          <span className="text-amber-300 font-bold">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-lg bg-amber-950/60 border border-amber-800/80 flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-amber-400" />
          </div>
          <span>Held by someone else</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-lg bg-slate-950 border border-white/[0.04] flex items-center justify-center">
            <span className="text-[10px] text-slate-600 font-bold">✕</span>
          </div>
          <span>Booked</span>
        </div>
      </div>

      {/* 4. Selection Summary Bar & Continue (Flow 4) */}
      <div className="mt-8 p-6 bg-gradient-to-r from-[#12192c] via-[#161f36] to-[#12192c] border border-white/[0.09] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xl">
        <div className="text-center sm:text-left">
          <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center justify-center sm:justify-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Selected Seats ({selectedSeats.length}/6 max)</span>
          </div>
          
          <div className="text-xl font-black text-white mt-1">
            {selectedSeats.length > 0 ? (
              <span className="font-mono text-amber-300 tracking-wide bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
                {selectedSeats.join(', ')}
              </span>
            ) : (
              <span className="text-slate-400 text-sm font-medium">Please click 1 to 6 seats on the map above</span>
            )}
          </div>

          {selectedSeats.length > 0 && (
            <div className="text-xs text-slate-300 mt-2 font-medium">
              {selectedSeats.length} seat(s) × ₹{ticketPrice} = <strong className="text-white text-sm font-black">₹{totalPrice}</strong>
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={selectedSeats.length === 0 || isHolding}
          onClick={onContinue}
          className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:from-slate-800 disabled:to-slate-800 text-slate-950 disabled:text-slate-600 font-black text-sm rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.35)] disabled:shadow-none transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 disabled:hover:scale-100"
        >
          {isHolding ? (
            'Holding Seats for 5 Mins...'
          ) : (
            <>
              <span>Continue (Hold for 5 Mins)</span>
              <span>→</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
