import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const airlineCode = request.nextUrl.searchParams.get('airlineCode') || 'KAL';
    const result = await query(
      'SELECT id, airline_code, other_airline_code, callsign_pair FROM callsigns WHERE airline_code = ? OR other_airline_code = ? LIMIT 10',
      [airlineCode]
    );
    return NextResponse.json({ airlineCode, count: result.rows.length, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
