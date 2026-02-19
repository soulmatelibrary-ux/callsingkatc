/**
 * PATCH /api/admin/users/[id]
 * 사용자 상태 변경 (관리자만)
 *
 * 요청 본문:
 *   - status: active|suspended
 *   - role: admin|user (선택사항)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { query } from '@/lib/db';

interface Params {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
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

    const { status, role, airlineId, airlineCode } = await request.json();
    const userId = params.id;

    // 상태 검증 (active|suspended만 가능)
    if (status && !['active', 'suspended'].includes(status)) {
      return NextResponse.json(
        { error: '올바른 상태가 아닙니다. (active|suspended)' },
        { status: 400 }
      );
    }

    // 역할 검증 (선택사항)
    if (role && !['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: '올바른 역할이 아닙니다. (admin|user)' },
        { status: 400 }
      );
    }

    // 항공사 검증 (선택사항) - airlineCode 또는 airlineId 지원
    let resolvedAirlineId: string | undefined;
    if (airlineId || airlineCode) {
      const airlineCheck = airlineCode
        ? await query('SELECT id FROM airlines WHERE code = $1', [airlineCode])
        : await query('SELECT id FROM airlines WHERE id = $1', [airlineId]);
      if (airlineCheck.rows.length === 0) {
        return NextResponse.json(
          { error: '존재하지 않는 항공사입니다.' },
          { status: 404 }
        );
      }
      resolvedAirlineId = airlineCheck.rows[0].id;
    }

    // 업데이트할 필드 동적 구성
    const updates: string[] = [];
    const params_array: any[] = [];
    let paramCount = 1;

    if (status) {
      updates.push(`status = $${paramCount}`);
      params_array.push(status);
      paramCount++;
    }

    if (role) {
      updates.push(`role = $${paramCount}`);
      params_array.push(role);
      paramCount++;
    }

    if (resolvedAirlineId) {
      updates.push(`airline_id = $${paramCount}`);
      params_array.push(resolvedAirlineId);
      paramCount++;
    }

    // 항상 updated_at 업데이트
    updates.push(`updated_at = NOW()`);

    if (updates.length === 0) {
      return NextResponse.json(
        { error: '업데이트할 필드가 없습니다.' },
        { status: 400 }
      );
    }

    // userId 추가
    params_array.push(userId);

    // 사용자 업데이트
    const sql = `UPDATE users
                 SET ${updates.join(', ')}
                 WHERE id = $${paramCount}
                 RETURNING id, email, status, role, airline_id, last_login_at, created_at, updated_at`;

    const result = await query(sql, params_array);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    // 항공사 정보 조회
    const airlineResult = await query(
      'SELECT code, name_ko, name_en FROM airlines WHERE id = $1',
      [user.airline_id]
    );

    const airline = airlineResult.rows[0]
      ? {
          id: user.airline_id,
          code: airlineResult.rows[0].code,
          name_ko: airlineResult.rows[0].name_ko,
          name_en: airlineResult.rows[0].name_en,
        }
      : null;

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        role: user.role,
        airline_id: user.airline_id,
        airline,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (error) {
    console.error('사용자 상태 변경 오류:', error);
    return NextResponse.json(
      { error: '사용자 상태 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
