import { Booking } from './types';
import { HOLD_DAYS } from './constants';

export function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRangeDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function diffDays(a: string, b: string) {
  const ms = new Date(b).setHours(0, 0, 0, 0) - new Date(a).setHours(0, 0, 0, 0);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function isWithinRange(day: string, start: string, end: string) {
  const t = new Date(day).setHours(0, 0, 0, 0);
  const s = new Date(start).setHours(0, 0, 0, 0);
  const e = new Date(end).setHours(0, 0, 0, 0);
  return t >= s && t < e;
}

export function getMonthsInRange(start: Date, end: Date) {
  const months: Date[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

export function overlaps(arrival: string, departure: string, bookings: Booking[]) {
  return bookings.filter((b) => arrival < b.departure && departure > b.arrival);
}

export function bookingExpires(createdAt: string) {
  const expiry = addDays(new Date(createdAt), HOLD_DAYS);
  return toISODate(expiry);
}

export function isExpired(booking: Booking, todayIso: string) {
  return booking.status === 'requested' && bookingExpires(booking.created_at) < todayIso;
}
