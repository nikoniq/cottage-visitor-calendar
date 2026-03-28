export type BookingStatus = 'requested' | 'unavailable';

export type Booking = {
  id: string;
  name: string;
  email: string;
  phone: string;
  arrival: string;
  departure: string;
  guests: number;
  notes: string | null;
  status: BookingStatus;
  created_at: string;
};
