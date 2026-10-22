/**
 * ============================================================================
 * SEAT MAP COMPONENT (frontend/src/components/SeatMap.tsx)
 * ============================================================================
 *
 * Implements:
 * - Flow 3: See the seat map (8 rows A-H x 10 cols 1-10 = 80 seats with "Screen This Way")
 * - Flow 4: Select 1 to 6 seats with max seat validation message & price calculation
 *
 * 🎓 FOR VIBE CODERS - HOW THIS WORKS:
 * ----------------------------------------------------------------------------
 * The cinema screen has exactly 8 rows (A to H) and 10 seats per row (1 to 10).
 * We group seats by their row letter, e.g. Row "A" -> [A1, A2, ..., A10].
 *
 * Each seat has a state:
 * - 'booked': Someone already paid for it -> Rendered in dark gray, disabled.
 * - 'heldByOther': Another customer is currently on the payment page for it -> Rendered in orange with a padlock, disabled.
 * - 'heldByMe': You previously held it -> Rendered in amber.
 * - 'selected': You clicked on it right now -> Rendered in vibrant blue.
 * - 'available': Free for anyone to pick -> Clickable emerald/slate.
 */

import React from 'react';
import { Lock, Check, AlertTriangle, Monitor } from 'lucide-react';
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
  holdExpiresAt,
  errorMessage
}) => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Map seats into a quick lookup dictionary: { "A1": Seat, "A2": Seat, ... }
  const seatLookup = React.useMemo(() => {
    const map = new Map<string, Seat>();
    seats.forEach((s) => map.set(s.seatNumber, s));
    return map;
  }, [seats]);

  const totalPrice = selectedSeats.length * ticketPrice;

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
      
      {/* 1. "Screen This Way" Marker (Flow 3 Acceptance Criteria) */}
      <div className="w-full flex flex-col items-center mb-10">
        <div className="w-3/4 h-2.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full shadow-[0_0_20px_rgba(251,191,36,0.6)]" />
        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-400 uppercase mt-2.5">
          <Monitor className="w-4 h-4 text-amber-400" />
          <span>Screen This Way</span>
        </div>
      </div>

      {/* Error / Warning Alert Box */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm flex items-center gap-3 animate-shake">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. The 8 x 10 Seat Grid */}
      <div className="space-y-3.5 mb-8 overflow-x-auto pb-4">
        {rows.map((row) => (
          <div key={row} className="flex items-center justify-center gap-2 sm:gap-3 min-w-[500px]">
            {/* Row Letter Indicator */}
            <span className="w-6 text-center font-bold text-sm text-slate-500 font-mono">
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

                // Determine seat styling and interactive status
                let buttonStyle = 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-500';
                let isDisabled = false;

                if (isBooked) {
                  // Booked: cannot be clicked
                  buttonStyle = 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed opacity-50';
                  isDisabled = true;
                } else if (isHeldByOther) {
                  // Held by someone else: cannot be clicked
                  buttonStyle = 'bg-amber-950/40 text-amber-600 border-amber-900/50 cursor-not-allowed';
                  isDisabled = true;
                } else if (isSelected || isHeldByMe) {
                  // Selected or Held by current user
                  buttonStyle = 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/30 scale-105';
                }

                // Add aisle gap between seats 5 and 6
                const isAisleGap = col === 5;

                return (
                  <React.Fragment key={seatCode}>
                    <button
                      type="button"
                      disabled={isDisabled}
                      onClick={() => onToggleSeat(seatCode)}
                      title={`Seat ${seatCode} - ${
                        isBooked
                          ? 'Booked'
                          : isHeldByOther
                          ? 'Held by another customer'
                          : isSelected
                          ? 'Selected'
                          : `₹${ticketPrice}`
                      }`}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all duration-150 relative ${buttonStyle}`}
                    >
                      {isBooked ? (
                        <span className="text-[10px] text-slate-600">✕</span>
                      ) : isHeldByOther ? (
                        <Lock className="w-3.5 h-3.5 text-amber-500/70" />
                      ) : isSelected ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        col
                      )}
                    </button>
                    {isAisleGap && <div className="w-4 sm:w-6" />}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Row Letter on Right for symmetry */}
            <span className="w-6 text-center font-bold text-sm text-slate-500 font-mono">
              {row}
            </span>
          </div>
        ))}
      </div>

      {/* 3. Seat States Legend (Flow 3 Acceptance Criteria) */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-6 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-800 border border-slate-700" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500 border border-amber-400" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-950/40 border border-amber-900/50 flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-amber-500" />
          </div>
          <span>Held by someone else</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-950 border border-slate-900 flex items-center justify-center">
            <span className="text-[10px] text-slate-600">✕</span>
          </div>
          <span>Booked</span>
        </div>
      </div>

      {/* 4. Selection Summary Bar & Continue Button (Flow 4 Acceptance Criteria) */}
      <div className="mt-8 p-5 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Selected Seats ({selectedSeats.length}/6)
          </div>
          <div className="text-lg font-bold text-white mt-0.5">
            {selectedSeats.length > 0 ? (
              <span className="text-amber-400 font-mono">{selectedSeats.join(', ')}</span>
            ) : (
              <span className="text-slate-500 text-sm font-normal">Please pick 1 to 6 seats on the map above</span>
            )}
          </div>
          {selectedSeats.length > 0 && (
            <div className="text-xs text-slate-400 mt-1">
              {selectedSeats.length} ticket(s) × ₹{ticketPrice} = <strong className="text-white">₹{totalPrice}</strong>
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={selectedSeats.length === 0 || isHolding}
          onClick={onContinue}
          className="w-full sm:w-auto px-7 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 font-bold rounded-xl shadow-lg shadow-amber-500/20 disabled:shadow-none transition-all flex items-center justify-center gap-2"
        >
          {isHolding ? (
            'Holding Seats...'
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
