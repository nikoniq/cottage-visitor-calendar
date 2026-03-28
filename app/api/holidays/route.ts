import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { HOLIDAYS_2026, HolidayItem } from '@/lib/holidays';

type HolidayRow = {
  id: string;
  name: string;
  date_range: string;
  link: string;
  description: string | null;
  emoji: string | null;
};

function staticHolidayFallback(): HolidayItem[] {
  return HOLIDAYS_2026.map((item, index) => ({ ...item, id: `static-${index}` }));
}

export async function GET() {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('holiday_events')
      .select('id,name,date_range,link,description,emoji')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const holidays = ((data ?? []) as HolidayRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      dateRange: row.date_range,
      link: row.link,
      description: row.description ?? undefined,
      emoji: row.emoji ?? undefined,
    }));

    return NextResponse.json({ holidays });
  } catch {
    return NextResponse.json({ holidays: staticHolidayFallback() });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, dateRange, link, description, emoji, adminPassword } = body;

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!name || !dateRange || !link) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('holiday_events')
      .insert({ name, date_range: dateRange, link, description: description ?? null, emoji: emoji ?? null })
      .select('id,name,date_range,link,description,emoji')
      .single();

    if (error) throw error;

    const holiday = {
      id: data.id,
      name: data.name,
      dateRange: data.date_range,
      link: data.link,
      description: data.description ?? undefined,
      emoji: data.emoji ?? undefined,
    };

    return NextResponse.json({ holiday });
  } catch {
    return NextResponse.json({ error: 'Unable to save holiday event.' }, { status: 500 });
  }
}
