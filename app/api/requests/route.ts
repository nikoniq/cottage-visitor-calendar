import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { sendAdminNotification } from '@/lib/email';
import { END_DATE, START_DATE } from '@/lib/constants';

export async function GET() {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from('visit_requests').select('*').order('arrival', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ bookings: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to load bookings.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, arrival, departure, guests, notes } = body;

    if (!name || !email || !phone || !arrival || !departure) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    if (arrival < START_DATE || departure > '2026-10-31' || arrival >= departure) {
      return NextResponse.json({ error: 'Invalid dates.' }, { status: 400 });
    }

    if (Number(guests) < 1 || Number(guests) > 4) {
      return NextResponse.json({ error: 'Guest count must be between 1 and 4.' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('visit_requests')
      .insert({ name, email, phone, arrival, departure, guests, notes, status: 'requested' })
      .select('*')
      .single();

    if (error) throw error;

    await sendAdminNotification(
      'New Cottage Visit Request',
      `<p>A new visit request has been submitted.</p>
       <p><strong>Name:</strong> ${name}</p>
       <p><strong>Email:</strong> ${email}</p>
       <p><strong>Phone:</strong> ${phone}</p>
       <p><strong>Dates:</strong> ${arrival} to ${departure}</p>
       <p><strong>Guests:</strong> ${guests}</p>
       <p><strong>Notes:</strong> ${notes ?? ''}</p>`
    );

    return NextResponse.json({ booking: data });
  } catch {
    return NextResponse.json({ error: 'Unable to submit request.' }, { status: 500 });
  }
}
