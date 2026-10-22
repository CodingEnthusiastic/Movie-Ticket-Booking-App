/**
 * ============================================================================
 * TYPE DEFINITIONS (frontend/src/types.ts)
 * ============================================================================
 *
 * For vibe coders:
 * TypeScript types act like blueprints. They tell our code exactly what fields
 * an object has (e.g. a Movie has an `id`, `title`, and `duration_mins`).
 * This prevents typos and bugs before our app even runs!
 */

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin';
}

export interface Movie {
  id: number;
  title: string;
  description: string;
  poster_url: string;
  language: string;
  duration_mins: number;
  rating: 'U' | 'UA' | 'A';
  created_at?: string;
}

export interface Show {
  id: number;
  movie_id: number;
  show_date: string;
  start_time: string;
  ticket_price: number;
  available_seats?: number;
  total_seats?: number;
}

export interface ShowDetail {
  id: number;
  movieId: number;
  movieTitle: string;
  movieDuration: number;
  showDate: string;
  startTime: string;
  ticketPrice: number;
  posterUrl: string;
  rating: string;
}

export interface Seat {
  seatNumber: string; // e.g. "A1", "C4"
  status: 'available' | 'held' | 'booked';
  heldByMe?: boolean;
  heldByOther?: boolean;
  heldUntil?: number | null;
  booking_id?: number | null;
}

export interface Booking {
  id: number;
  movieTitle: string;
  posterUrl: string;
  showDate: string;
  startTime: string;
  ticketPrice: number;
  seats: string[];
  totalAmount: number;
  status: 'confirmed' | 'cancelled';
  bookedAt: string;
  isUpcoming: boolean;
  canCancel: boolean;
  hoursUntilShow: number;
}

export interface AdminShowStat {
  id: number;
  show_date: string;
  start_time: string;
  ticket_price: number;
  movie_title: string;
  duration_mins: number;
  booked_seats: number;
  total_revenue: number;
  totalSeats: number;
  percentageFull: number;
}
