import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, adminPassword } = body;

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!id || typeof id !== 'string' || id.startsWith('static-')) {
      return NextResponse.json({ error: 'Invalid holiday id.' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { error } = await supabase.from('holiday_events').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unable to delete holiday event.' }, { status: 500 });
  }
}
