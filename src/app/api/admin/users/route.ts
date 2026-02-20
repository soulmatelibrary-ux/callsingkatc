/**
 * GET /api/admin/users
 * 사용자 목록 조회 (관리자만)
 *
 * 쿼리 파라미터:
 *   - status: active|suspended (필터)
 *   - airlineId: 항공사별 필터
 *
 * POST /api/admin/users
 * 사용자 사전등록 (관리자만)
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/jwt';
import { query, transaction } from '@/lib/db';
import { PASSWORD_REGEX } from '@/lib/constants';

export async function GET(request: NextRequest) {
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

    // 필터 조건
    const status = request.nextUrl.searchParams.get('status');
    const airlineId = request.nextUrl.searchParams.get('airlineId');

    let sql = `SELECT
                 u.id, u.email, u.status, u.role, u.last_login_at, u.created_at, u.updated_at,
                 u.airline_id, u.is_default_password, u.password_change_required, u.last_password_changed_at,
                 a.code as airline_code, a.name_ko as airline_name_ko, a.name_en as airline_name_en
               FROM users u
               LEFT JOIN airlines a ON u.airline_id = a.id
               WHERE 1=1`;
    const params: any[] = [];

    // 상태 필터 (active|suspended만 가능)
    if (status && ['active', 'suspended'].includes(status)) {
      sql += ` AND u.status = $${params.length + 1}`;
      params.push(status);
    }

    // 항공사 필터
    if (airlineId) {
      sql += ` AND u.airline_id = $${params.length + 1}`;
      params.push(airlineId);
    }

    sql += ' ORDER BY u.created_at DESC';

    const result = await query(sql, params);

    return NextResponse.json({
      users: result.rows.map((user: any) => ({
        id: user.id,
        email: user.email,
        status: user.status,
        role: user.role,
        airline_id: user.airline_id,
        airline: user.airline_code
          ? {
              id: user.airline_id,
              code: user.airline_code,
              name_ko: user.airline_name_ko,
              name_en: user.airline_name_en,
            }
          : null,
        is_default_password: user.is_default_password,
        password_change_required: user.password_change_required,
        // 날짜/로그인 필드: snake_case + camelCase 둘 다 제공
        last_password_changed_at: user.last_password_changed_at,
        last_login_at: user.last_login_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      })),
    });
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '사용자 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { email, password, airlineId, airlineCode, role = 'user' } = await request.json();

    // 유효성 검사
    if (!email || (!airlineId && !airlineCode)) {
      return NextResponse.json(
        { error: '이메일과 항공사는 필수입니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 입력 검증 (비밀번호를 입력한 경우)
    if (password && !PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        { error: '비밀번호: 8자 이상, 대문자·소문자·숫자·특수문자 모두 포함 필요' },
        { status: 400 }
      );
    }

    // 역할 검증
    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: '올바른 역할이 아닙니다.' },
        { status: 400 }
      );
    }

    // 기존 이메일 확인
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 409 }
      );
    }

    // 항공사 존재 여부 확인 (code 또는 id로 조회)
    const airlineCheck = airlineCode
      ? await query('SELECT id FROM airlines WHERE code = $1', [airlineCode])
      : await query('SELECT id FROM airlines WHERE id = $1', [airlineId]);
    if (airlineCheck.rows.length === 0) {
      return NextResponse.json(
        { error: '존재하지 않는 항공사입니다.' },
        { status: 404 }
      );
    }

    // 실제 DB의 UUID id 사용
    const resolvedAirlineId: string = airlineCheck.rows[0].id;

    // 비밀번호 처리
    let passwordHash: string;
    if (password) {
      // 입력된 비밀번호 사용
      passwordHash = await bcrypt.hash(password, 10);
    } else {
      // 임시 비밀번호 생성 (UUID의 일부)
      const tempPassword = `Temp${Date.now()}@${Math.random().toString(36).substr(2, 5)}`;
      passwordHash = await bcrypt.hash(tempPassword, 10);
    }

    // 사용자 생성 (트랜잭션)
    const result = await transaction(async (trx) => {
      // 사용자 생성
      const createResult = await trx(
        `INSERT INTO users (
           email, password_hash, airline_id, status, role,
           is_default_password, password_change_required
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, status, role, airline_id, is_default_password, password_change_required, created_at`,
        [email, passwordHash, resolvedAirlineId, 'active', role, !password, true]
      );

      return createResult.rows[0];
    });

    // 항공사 정보 조회
    const airlineResult = await query(
      'SELECT code, name_ko, name_en FROM airlines WHERE id = $1',
      [resolvedAirlineId]
    );

    const airline = airlineResult.rows[0]
      ? {
          id: resolvedAirlineId,
          code: airlineResult.rows[0].code,
          name_ko: airlineResult.rows[0].name_ko,
          name_en: airlineResult.rows[0].name_en,
        }
      : null;

    return NextResponse.json(
      {
        user: {
          id: result.id,
          email: result.email,
          status: result.status,
          role: result.role,
          airline_id: result.airline_id,
          airline,
          is_default_password: result.is_default_password,
          password_change_required: result.password_change_required,
          createdAt: result.created_at,
        },
        message: password
          ? '사용자가 생성되었습니다.'
          : '사용자가 생성되었습니다. 임시 비밀번호가 설정되었습니다.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('사용자 생성 오류:', error);
    return NextResponse.json(
      { error: '사용자 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
