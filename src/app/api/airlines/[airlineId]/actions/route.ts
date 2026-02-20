/**
 * POST /api/airlines/[airlineId]/actions
 * 항공사의 조치 등록 (관리자만)
 *
 * 요청 본문:
 * {
 *   callsignId: string (필수)
 *   actionType: string (필수) - "편명 변경", "브리핑 시행" 등
 *   description?: string
 *   managerName?: string
 *   managerEmail?: string
 *   plannedDueDate?: string (ISO 8601)
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { query, transaction } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { airlineId: string } }
) {
  try {
    const airlineId = params.airlineId;

    // 인증 확인
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자만 접근 가능합니다.' },
        { status: 403 }
      );
    }

    // 요청 본문
    const {
      callsignId,
      actionType,
      description,
      managerName,
      managerEmail,
      plannedDueDate,
    } = await request.json();

    // 필수 필드 검증
    if (!callsignId || !actionType) {
      return NextResponse.json(
        { error: '호출부호와 조치 유형은 필수입니다.' },
        { status: 400 }
      );
    }

    // 항공사 존재 여부 확인
    const airlineCheck = await query(
      'SELECT id FROM airlines WHERE id = $1',
      [airlineId]
    );

    if (airlineCheck.rows.length === 0) {
      return NextResponse.json(
        { error: '항공사를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 호출부호 존재 및 항공사 일치 확인
    const callsignCheck = await query(
      'SELECT id FROM callsigns WHERE id = $1 AND airline_id = $2',
      [callsignId, airlineId]
    );

    if (callsignCheck.rows.length === 0) {
      return NextResponse.json(
        { error: '호출부호를 찾을 수 없거나 항공사와 일치하지 않습니다.' },
        { status: 404 }
      );
    }

    // 조치 생성 (트랜잭션)
    const result = await transaction(async (trx) => {
      return trx(
        `INSERT INTO actions (
          airline_id, callsign_id, action_type, description,
          manager_name, manager_email, planned_due_date,
          status, registered_by, registered_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          airlineId,
          callsignId,
          actionType,
          description || null,
          managerName || null,
          managerEmail || null,
          plannedDueDate || null,
          'pending',
          payload.userId, // 현재 관리자 ID
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '조치 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    const action = result.rows[0];

    return NextResponse.json(
      {
        id: action.id,
        airline_id: action.airline_id,
        callsign_id: action.callsign_id,
        action_type: action.action_type,
        description: action.description,
        manager_name: action.manager_name,
        manager_email: action.manager_email,
        planned_due_date: action.planned_due_date,
        status: action.status,
        registered_by: action.registered_by,
        registered_at: action.registered_at,
        updated_at: action.updated_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('조치 생성 오류:', error);
    return NextResponse.json(
      { error: '조치 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
