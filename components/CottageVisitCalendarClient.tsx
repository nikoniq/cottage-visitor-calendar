'use client';

import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  ExternalLink,
  Home,
  KeyRound,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { Booking } from '@/lib/types';
import {
  addDays,
  bookingExpires,
  diffDays,
  formatDate,
  formatRangeDate,
  getMonthsInRange,
  isExpired,
  isWithinRange,
  overlaps,
  toISODate,
} from '@/lib/utils';
import { END_DATE, START_DATE } from '@/lib/constants';
import { HOLIDAYS_2026, type HolidayItem } from '@/lib/holidays';

type Props = {
  initialBookings: Booking[];
  sharedPassword: string;
  adminPassword: string;
};

type ActiveTab = 'calendar' | 'request' | 'list' | 'holidays';


type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'destructive';
};

function Button({ className = '', variant = 'default', type = 'button', ...props }: ButtonProps) {
  const variantClass =
    variant === 'outline'
      ? 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
      : variant === 'destructive'
        ? 'bg-rose-600 text-white hover:bg-rose-700'
        : 'bg-slate-900 text-white hover:bg-slate-800';
  return <button type={type} className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition ${variantClass} disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />;
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`w-full border border-slate-200 bg-white px-3 text-sm outline-none ring-0 focus:border-slate-400 ${className}`} {...props} />;
}

function Label({ className = '', ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`text-sm font-medium text-slate-700 ${className}`} {...props} />;
}

function statusMeta(status: 'requested' | 'unavailable' | 'available') {
  if (status === 'requested') {
    return {
      label: 'Requested',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      cell: 'bg-amber-100 border-amber-200 text-amber-900',
      icon: Clock3,
    };
  }
  if (status === 'unavailable') {
    return {
      label: 'Unavailable',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      cell: 'bg-rose-100 border-rose-200 text-rose-900',
      icon: Ban,
    };
  }
  return {
    label: 'Available',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cell: 'bg-emerald-50 border-emerald-100 text-emerald-900',
    icon: CheckCircle2,
  };
}

function dayStatus(day: string, bookings: Booking[]) {
  for (const booking of bookings) {
    if (isWithinRange(day, booking.arrival, booking.departure)) return booking.status;
  }
  return 'available';
}

function CalendarMonth({ monthDate, bookings }: { monthDate: Date; bookings: Booking[] }) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const startDate = new Date(START_DATE);
  const endDate = new Date(END_DATE);
  const cells: ReactNode[] = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(<div key={`empty-${i}`} className="h-20 rounded-2xl border border-transparent p-2" />);
  }

  for (let dayNum = 1; dayNum <= totalDays; dayNum += 1) {
    const date = new Date(year, month, dayNum);
    const iso = toISODate(date);
    const inGlobalRange = iso >= toISODate(startDate) && iso <= toISODate(endDate);
    const status = inGlobalRange ? dayStatus(iso, bookings) : 'outside';
    const meta = statusMeta(status === 'outside' ? 'available' : status);

    cells.push(
      <div
        key={iso}
        className={`h-20 rounded-2xl border p-2 text-sm shadow-sm ${inGlobalRange ? meta.cell : 'bg-slate-50 text-slate-300 border-slate-100'}`}
      >
        <div className="flex items-start justify-between">
          <span className="font-semibold">{dayNum}</span>
          {inGlobalRange && status !== 'available' ? (
            <span className="mt-0.5 text-[10px] leading-none">{status === 'requested' ? 'Req' : 'Un'}</span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-md">
      <div className="px-6 pb-3 pt-6 text-lg font-semibold">
        {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </div>
      <div className="px-6 pb-6">
        <div className="mb-2 grid grid-cols-7 gap-2 text-xs font-medium text-slate-500">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="px-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">{cells}</div>
      </div>
    </div>
  );
}

export default function CottageVisitCalendarClient({ initialBookings, sharedPassword, adminPassword }: Props) {
  const [enteredPassword, setEnteredPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showSharedPassword, setShowSharedPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('calendar');
  const [holidays, setHolidays] = useState<HolidayItem[]>(HOLIDAYS_2026.map((item, index) => ({ ...item, id: `static-${index}` })));
  const [holidayForm, setHolidayForm] = useState({ name: '', dateRange: '', link: '', description: '', emoji: '' });
  const [holidayMessage, setHolidayMessage] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    arrival: '',
    departure: '',
    guests: '2',
    notes: '',
  });

  const todayIso = toISODate(new Date(START_DATE));
  const activeBookings = useMemo(() => bookings.filter((b) => !isExpired(b, todayIso)), [bookings, todayIso]);
  const months = useMemo(() => getMonthsInRange(new Date(START_DATE), new Date(END_DATE)), []);
  const visibleItems = useMemo(() => [...activeBookings].sort((a, b) => new Date(a.arrival).getTime() - new Date(b.arrival).getTime()), [activeBookings]);

  const formConflicts = useMemo(() => {
    if (!form.arrival || !form.departure || form.arrival >= form.departure) return { unavailable: [], requested: [] };
    const matched = overlaps(form.arrival, form.departure, activeBookings);
    return {
      unavailable: matched.filter((b) => b.status === 'unavailable'),
      requested: matched.filter((b) => b.status === 'requested'),
    };
  }, [form.arrival, form.departure, activeBookings]);

  async function refreshBookings() {
    const res = await fetch('/api/requests', { cache: 'no-store' });
    const data = await res.json();
    if (res.ok) setBookings(data.bookings);
  }

  function handleUnlock() {
    if (enteredPassword === sharedPassword) {
      setUnlocked(true);
      setMessage('');
    } else {
      setMessage('That password is not correct.');
    }
  }

  function handleAdminUnlock() {
    if (adminPasswordInput.trim() === adminPassword.trim()) {
      setAdminMode(true);
      setShowAdminPrompt(false);
      setAdminPasswordInput('');
      setShowAdminPassword(false);
      setMessage('Admin mode enabled. You can now manage request statuses and view full contact details.');
    } else {
      setMessage('That admin password is not correct.');
    }
  }

  function handleAdminToggle() {
    if (adminMode) {
      setAdminMode(false);
      setShowAdminPrompt(false);
      setAdminPasswordInput('');
      setShowAdminPassword(false);
      return;
    }
    setShowAdminPassword(false);
    setShowAdminPrompt(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage('');

    if (!form.name || !form.email || !form.phone || !form.arrival || !form.departure) {
      setMessage('Please complete all required fields.');
      return;
    }

    if (form.arrival < START_DATE || form.departure > toISODate(addDays(new Date(END_DATE), 1))) {
      setMessage('Requests must be within the available calendar window.');
      return;
    }

    if (form.arrival >= form.departure) {
      setMessage('Departure must be after arrival.');
      return;
    }

    const guestCount = Number(form.guests);
    if (guestCount < 1 || guestCount > 4) {
      setMessage('Guest count must be between 1 and 4.');
      return;
    }

    if (formConflicts.unavailable.length) {
      setMessage('Those dates are unavailable. Please choose different dates.');
      return;
    }

    setBusy(true);
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, guests: guestCount }),
    });

    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      setMessage(data.error ?? 'Unable to submit request.');
      return;
    }

    await refreshBookings();
    setForm({ name: '', email: '', phone: '', arrival: '', departure: '', guests: '2', notes: '' });
    setMessage(formConflicts.requested.length ? 'Request submitted successfully. Please note that part of this stay overlaps with dates already marked as requested.' : 'Request submitted successfully. It now appears on the calendar as requested.');
  }

  async function updateBookingStatus(id: string, status: 'requested' | 'unavailable') {
    setBusy(true);
    const res = await fetch('/api/admin/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, adminPassword }),
    });
    setBusy(false);
    if (res.ok) await refreshBookings();
  }

  async function deleteBooking(id: string) {
    setBusy(true);
    const res = await fetch('/api/admin/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, adminPassword }),
    });
    setBusy(false);
    if (res.ok) await refreshBookings();
  }

  const unavailableRanges = visibleItems.filter((b) => b.status === 'unavailable').length;
  const requestedRanges = visibleItems.filter((b) => b.status === 'requested').length;

  useEffect(() => {
    async function loadHolidays() {
      const res = await fetch('/api/holidays', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && Array.isArray(data.holidays)) setHolidays(data.holidays);
    }
    loadHolidays();
  }, []);

  async function addHolidayEvent() {
    setHolidayMessage('');
    if (!holidayForm.name || !holidayForm.dateRange || !holidayForm.link) {
      setHolidayMessage('Please enter name, date range, and URL.');
      return;
    }

    setBusy(true);
    const res = await fetch('/api/holidays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...holidayForm, adminPassword }),
    });
    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      setHolidayMessage(data.error ?? 'Could not save holiday event.');
      return;
    }

    setHolidays((prev) => [...prev, data.holiday]);
    setHolidayForm({ name: '', dateRange: '', link: '', description: '', emoji: '' });
    setHolidayMessage('Holiday event saved.');
  }

  async function deleteHolidayEvent(id?: string) {
    if (!id) return;
    if (id.startsWith('static-')) {
      setHolidayMessage('This is a fallback holiday item. Add the holiday_events table to enable full editing.');
      return;
    }

    setBusy(true);
    const res = await fetch('/api/holidays/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, adminPassword }),
    });
    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      setHolidayMessage(data.error ?? 'Could not delete holiday event.');
      return;
    }
    setHolidays((prev) => prev.filter((item) => item.id !== id));
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6 md:p-10">
        <div className="mx-auto max-w-2xl pt-10">
          <div className="overflow-hidden rounded-[2rem] border-0 bg-white shadow-xl">
            <div className="h-28 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900" />
            <div className="-mt-10 p-8 md:p-10">
              <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-lg md:p-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white"><Home className="h-6 w-6" /></div>
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Cottage Visit Calendar</h1>
                    <p className="mt-1 text-slate-500">Private access for invited guests</p>
                  </div>
                </div>
                <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  View available dates, requested dates, and unavailable dates from {formatDate(new Date(START_DATE))} through {formatDate(new Date(END_DATE))}.
                </div>
                <div className="space-y-3">
                  <Label htmlFor="password">Shared password</Label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Input
                        id="password"
                        type={showSharedPassword ? 'text' : 'password'}
                        value={enteredPassword}
                        onChange={(e) => setEnteredPassword(e.target.value)}
                        placeholder="Enter password"
                        className="h-12 rounded-2xl pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSharedPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                        aria-label={showSharedPassword ? 'Hide password' : 'Show password'}
                      >
                        {showSharedPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button onClick={handleUnlock} className="h-12 rounded-2xl px-6"><Lock className="mr-2 h-4 w-4" />Enter</Button>
                  </div>
                  {message ? <p className="text-sm text-rose-600">{message}</p> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef4f8_0%,#f7fafb_45%,#edf3ee_100%)] text-slate-900">
      <div className="sticky top-0 z-20 border-b border-[#d6dfeb] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Cottage Visit Calendar</h1>
            <p className="mt-1 text-[#4b5f79]">Private visit planning for invited guests</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#dceedd] px-3 py-1 text-sm text-[#245341]">Available</span>
            <span className="rounded-full bg-[#f4e7cf] px-3 py-1 text-sm text-[#7a4f1f]">Requested</span>
            <span className="rounded-full bg-[#f4dde0] px-3 py-1 text-sm text-[#7d2940]">Unavailable</span>
            <Button variant={adminMode ? 'default' : 'outline'} className="ml-2 rounded-2xl" onClick={handleAdminToggle}><ShieldCheck className="mr-2 h-4 w-4" />{adminMode ? 'Hide Admin' : 'Admin View'}</Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-[#d8e2ef] bg-white p-5 shadow-sm"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6edf8]"><CalendarDays className="h-6 w-6" /></div><div><p className="text-sm text-slate-500">Calendar window</p><p className="font-semibold">{formatDate(new Date(START_DATE))} to {formatDate(new Date(END_DATE))}</p></div></div></div>
          <div className="rounded-3xl border border-[#e8ddcd] bg-white p-5 shadow-sm"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4e7cf]"><Clock3 className="h-6 w-6 text-amber-700" /></div><div><p className="text-sm text-slate-500">Current requested ranges</p><p className="font-semibold">{requestedRanges}</p></div></div></div>
          <div className="rounded-3xl border border-[#ead8de] bg-white p-5 shadow-sm"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4dde0]"><Ban className="h-6 w-6 text-rose-700" /></div><div><p className="text-sm text-slate-500">Current unavailable ranges</p><p className="font-semibold">{unavailableRanges}</p></div></div></div>
        </div>



        {adminMode ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <span className="font-semibold">Admin mode is active.</span> You can edit booking statuses, delete requests, and view full contact details below.
          </div>
        ) : null}
        {showAdminPrompt ? (
          <div className="max-w-xl rounded-[2rem] border border-slate-200 bg-white p-5 shadow-md md:p-6">
            <div className="mb-4 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100"><KeyRound className="h-5 w-5 text-slate-700" /></div><div><p className="font-semibold text-slate-900">Admin access</p><p className="text-sm text-slate-500">Enter the separate admin password to manage requests.</p></div></div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  type={showAdminPassword ? 'text' : 'password'}
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="Enter admin password"
                  className="h-11 rounded-2xl pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                  aria-label={showAdminPassword ? 'Hide admin password' : 'Show admin password'}
                >
                  {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button onClick={handleAdminUnlock} className="h-11 rounded-2xl px-5">Unlock</Button>
            </div>
          </div>
        ) : null}

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 rounded-2xl bg-[#e7edf4] p-1 text-sm">
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`rounded-2xl px-4 py-2 transition ${activeTab === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-white/60'}`}
            >
              Calendar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('request')}
              className={`rounded-2xl px-4 py-2 transition ${activeTab === 'request' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-white/60'}`}
            >
              Request Visit
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`rounded-2xl px-4 py-2 transition ${activeTab === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-white/60'}`}
            >
              Date List
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('holidays')}
              className={`rounded-2xl px-4 py-2 transition ${activeTab === 'holidays' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-white/60'}`}
            >
              Bermuda Holidays
            </button>
          </div>

          {activeTab === 'calendar' ? (
            <div className="grid gap-6 xl:grid-cols-2">
              {months.map((month) => <CalendarMonth key={month.toISOString()} monthDate={month} bookings={activeBookings} />)}
            </div>
          ) : null}

          {activeTab === 'request' ? (
            <div className="max-w-3xl rounded-[2rem] border border-slate-200 bg-white shadow-md">
            <div className="p-6"><h2 className="text-2xl font-semibold">Request a visit</h2><p className="mt-1 text-sm text-slate-500">Requested dates appear on the calendar right away and remain requested for up to 1 week unless updated sooner.</p></div>
            <form onSubmit={handleSubmit} className="grid gap-5 p-6 pt-0 md:grid-cols-2">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-2xl" /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 rounded-2xl" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11 rounded-2xl" /></div>
              <div className="space-y-2"><Label>Number of guests</Label><select value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })} className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3">{[1,2,3,4].map((n) => <option key={n} value={String(n)}>{n}</option>)}</select></div>
              <div className="space-y-2"><Label>Arrival</Label><Input type="date" value={form.arrival} min={START_DATE} max={END_DATE} onChange={(e) => setForm({ ...form, arrival: e.target.value })} className="h-11 rounded-2xl" /></div>
              <div className="space-y-2"><Label>Departure</Label><Input type="date" value={form.departure} min={START_DATE} max={toISODate(addDays(new Date(END_DATE), 1))} onChange={(e) => setForm({ ...form, departure: e.target.value })} className="h-11 rounded-2xl" /></div>

              {form.arrival && form.departure && formConflicts.unavailable.length > 0 ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 md:col-span-2"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5" /><div><p className="font-medium">Those dates are unavailable.</p><p className="mt-1 text-sm">Please choose different dates before submitting your request.</p></div></div></div>
              ) : null}
              {form.arrival && form.departure && formConflicts.requested.length > 0 && formConflicts.unavailable.length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 md:col-span-2"><div className="flex items-start gap-3"><Clock3 className="mt-0.5 h-5 w-5" /><div><p className="font-medium">Some of these dates are already requested.</p><p className="mt-1 text-sm">You can still submit this request, but it may need review.</p></div></div></div>
              ) : null}

              <div className="space-y-2 md:col-span-2"><Label>Notes</Label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-28 w-full rounded-2xl border border-slate-200 px-3 py-2" placeholder="Anything helpful to note" /></div>
              <div className="flex flex-col gap-3 pt-2 md:col-span-2 sm:flex-row sm:items-center sm:justify-between"><div className="text-sm text-slate-500">Notifications go to both admins by email. WhatsApp can be added later.</div><Button type="submit" disabled={formConflicts.unavailable.length > 0 || busy} className="h-11 rounded-2xl px-6">{busy ? 'Submitting...' : 'Submit Request'}</Button></div>
              {message ? <p className="text-sm text-slate-700 md:col-span-2">{message}</p> : null}
            </form>
            </div>
          ) : null}

          {activeTab === 'list' ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white shadow-md">
            <div className="p-6"><h2 className="text-2xl font-semibold">Current date list</h2></div>
            <div className="space-y-4 p-6 pt-0">
              {visibleItems.length === 0 ? <p className="text-slate-500">No date ranges yet.</p> : visibleItems.map((booking) => {
                const meta = statusMeta(booking.status);
                const Icon = meta.icon;
                return (
                  <div key={booking.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2"><span className={`rounded-full border px-3 py-1 text-sm ${meta.badge}`}><span className="inline-flex items-center"><Icon className="mr-1 h-3.5 w-3.5" />{meta.label}</span></span><span className="text-sm text-slate-500">{formatRangeDate(booking.arrival)} - {formatRangeDate(booking.departure)}</span></div>
                      <p className="font-medium">{diffDays(booking.arrival, booking.departure)} night stay</p>
                      {adminMode ? <div className="space-y-1 text-sm text-slate-600"><p className="flex items-center gap-2"><Users className="h-4 w-4" /> {booking.name} · {booking.guests} guest{booking.guests > 1 ? 's' : ''}</p><p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {booking.email}</p><p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {booking.phone}</p>{booking.notes ? <p className="text-slate-500">{booking.notes}</p> : null}<p className="text-xs text-slate-400">Requested on {booking.created_at.slice(0,10)}{booking.status === 'requested' ? ` · Expires ${bookingExpires(booking.created_at)}` : ''}</p></div> : null}
                    </div>
                    {adminMode ? <div className="flex flex-wrap gap-2"><Button variant="outline" className="rounded-2xl" onClick={() => updateBookingStatus(booking.id, 'requested')}>Mark Requested</Button><Button variant="outline" className="rounded-2xl" onClick={() => updateBookingStatus(booking.id, 'unavailable')}>Mark Unavailable</Button><Button variant="destructive" className="rounded-2xl" onClick={() => deleteBooking(booking.id)}>Delete</Button></div> : null}
                  </div>
                );
              })}
            </div>
            </div>
          ) : null}

          {activeTab === 'holidays' ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-md">
              <h2 className="text-2xl font-semibold">Bermuda holidays and events</h2>
              <p className="mt-1 text-sm text-slate-500">
                Helpful dates for planning visits. Event schedules can change, so use the official links for the latest details.
              </p>
              <div className="mt-5 space-y-3">
                {holidays.map((item) => (
                  <a
                    key={`${item.name}-${item.dateRange}-${item.id ?? 'noid'}`}
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-base">
                          {item.emoji ?? '🌴'}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900">{item.name}</p>
                          <p className="text-sm text-slate-500">{item.dateRange}</p>
                        </div>
                      </div>
                      {item.description ? <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.description}</p> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center text-sm text-slate-600">
                        Official link <ExternalLink className="ml-1 h-4 w-4" />
                      </span>
                      {adminMode ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            deleteHolidayEvent(item.id);
                          }}
                          className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </a>
                ))}
              </div>
              {adminMode ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-medium text-slate-900">Add holiday/event</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-4">
                    <Input value={holidayForm.emoji} onChange={(e) => setHolidayForm({ ...holidayForm, emoji: e.target.value })} placeholder="Emoji (optional)" className="h-10 rounded-xl bg-white" />
                    <Input value={holidayForm.name} onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })} placeholder="Event name" className="h-10 rounded-xl bg-white" />
                    <Input value={holidayForm.dateRange} onChange={(e) => setHolidayForm({ ...holidayForm, dateRange: e.target.value })} placeholder="Date range (e.g. May 9–10, 2026)" className="h-10 rounded-xl bg-white" />
                    <Input value={holidayForm.link} onChange={(e) => setHolidayForm({ ...holidayForm, link: e.target.value })} placeholder="https://..." className="h-10 rounded-xl bg-white" />
                  </div>
                  <textarea value={holidayForm.description} onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })} className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Short intro (4–5 lines)." />
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Button onClick={addHolidayEvent} disabled={busy} className="rounded-xl">{busy ? 'Saving...' : 'Add event'}</Button>
                    {holidayMessage ? <p className="text-sm text-slate-600">{holidayMessage}</p> : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {adminMode ? <div className="grid gap-4 text-sm text-slate-600 md:grid-cols-2"><div className="rounded-3xl border border-slate-200 bg-white p-4"><p className="mb-2 font-medium text-slate-900">Suggested live wiring</p><p>Supabase stores the bookings. Resend handles email notices. Google Calendar can be added after launch.</p></div><div className="rounded-3xl border border-slate-200 bg-white p-4"><p className="mb-2 font-medium text-slate-900">Passwords</p><p>Change both passwords in Vercel environment variables, not in the code.</p></div></div> : null}
        </div>
      </div>
    </div>
  );
}
