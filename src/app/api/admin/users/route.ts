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
      sql += ` AND u.status = ?`;
      params.push(status);
    }

    // 항공사 필터
    if (airlineId) {
      sql += ` AND u.airline_id = ?`;
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
    if (!email || !password || (!airlineId && !airlineCode)) {
      return NextResponse.json(
        { error: '이메일, 비밀번호, 항공사는 필수입니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 규칙 검증 (필수)
    if (!PASSWORD_REGEX.test(password)) {
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
    const existingUser = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 409 }
      );
    }

    // 항공사 존재 여부 확인 (code 또는 id로 조회)
    const airlineCheck = airlineCode
      ? await query('SELECT id FROM airlines WHERE code = ?', [airlineCode])
      : await query('SELECT id FROM airlines WHERE id = ?', [airlineId]);
    if (airlineCheck.rows.length === 0) {
      return NextResponse.json(
        { error: '존재하지 않는 항공사입니다.' },
        { status: 404 }
      );
    }

    // 실제 DB의 UUID id 사용
    const resolvedAirlineId: string = airlineCheck.rows[0].id;

    // 비밀번호 암호화 (필수)
    let passwordHash: string;
    try {
      passwordHash = await bcrypt.hash(password, 10);
    } catch (hashError) {
      console.error('[USER_CREATE] 비밀번호 암호화 실패:', hashError);
      return NextResponse.json(
        { error: '비밀번호 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 사용자 생성 (직접 쿼리)
    // 📌 신규 생성 사용자는 항상 is_default_password=true, password_change_required=true로 설정
    // 첫 로그인 시 무조건 비밀번호 변경 페이지로 강제 이동
    try {
      await query(
        `INSERT INTO users (
           email, password_hash, airline_id, status, role,
           is_default_password, password_change_required, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [email, passwordHash, resolvedAirlineId, 'active', role, 1, 1]
      );
    } catch (insertError: any) {
      console.error('[USER_CREATE] 사용자 INSERT 실패:', {
        email,
        airlineId: resolvedAirlineId,
        error: insertError.message
      });
      return NextResponse.json(
        { error: '사용자 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 생성된 사용자 조회
    const userResult = await query(
      `SELECT id, email, status, role, airline_id, is_default_password, password_change_required
       FROM users
       WHERE email = ?`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: '사용자 조회 실패' },
        { status: 500 }
      );
    }

    const result = userResult.rows[0];

    // 항공사 정보 조회
    const airlineResult = await query(
      'SELECT code, name_ko, name_en FROM airlines WHERE id = ?',
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
        message: '사용자가 생성되었습니다. 첫 로그인 시 비밀번호 변경이 필요합니다.',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: '사용자 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
