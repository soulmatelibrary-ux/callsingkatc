/**
 * GET /api/debug/callsigns
 * 호출부호 데이터 진단 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 1. 항공사 개수
    const airlines = await query('SELECT COUNT(*) as total FROM airlines');
    
    // 2. 호출부호 전체 개수
    const callsigns = await query('SELECT COUNT(*) as total FROM callsigns');
    
    // 3. KAL 관련 호출부호
    const kalCallsigns = await query(
      `SELECT id, airline_code, other_airline_code, callsign_pair
       FROM callsigns
       WHERE airline_code = ? OR other_airline_code = ?
       LIMIT 5`,
      ['KAL']
    );

    return NextResponse.json({
      status: 'ok',
      data: {
        totalAirlines: airlines.rows[0]?.total || 0,
        totalCallsigns: callsigns.rows[0]?.total || 0,
        kalCallsigns: kalCallsigns.rows,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
