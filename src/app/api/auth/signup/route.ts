/**
 * POST /api/auth/signup
 * 회원가입 API (테스트용)
 *
 * 참고: 현재는 테스트/개발용으로 남겨두었으며, 프로덕션에서는 관리자가 사전등록 API를 사용합니다.
 * 구조:
 * - 사용자는 관리자가 사전등록 API (/api/admin/users/create)로 생성
 * - 이 라우트는 테스트/초기화 용도로만 사용
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { PASSWORD_REGEX } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    // airlineCode(코드 문자열) 또는 airlineId(UUID) 둘 다 허용
    const airlineCode: string | undefined = body.airlineCode;
    const airlineId: string | undefined = body.airlineId;

    // 유효성 검사
    if (!email || !password || (!airlineCode && !airlineId)) {
      return NextResponse.json(
        { error: '이메일, 비밀번호, 항공사는 필수입니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 규칙 검사 (8자+대문자+소문자+숫자+특수문자)
    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        { error: '8자 이상, 대문자·소문자·숫자·특수문자 모두 포함 필요' },
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

    // 비밀번호 암호화
    const passwordHash = await bcrypt.hash(password, 10);

    // 사용자 생성 (active 상태, is_default_password=false로 설정)
    const result = await query(
      `INSERT INTO users (
         email, password_hash, airline_id, status, role,
         is_default_password, password_change_required
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, status, role, airline_id, is_default_password, password_change_required, created_at`,
      [email, passwordHash, resolvedAirlineId, 'active', 'user', false, false]
    );

    const user = result.rows[0];

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

    // 토큰 생성
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      airlineId: user.airline_id,
    });

    const refreshToken = generateRefreshToken(user.id);

    // 응답 생성
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          status: user.status,
          role: user.role,
          airline_id: user.airline_id,
          airline,
          is_default_password: user.is_default_password,
          password_change_required: user.password_change_required,
          createdAt: user.created_at,
        },
        accessToken,
        refreshToken,
      },
      { status: 201 }
    );

    // refreshToken을 httpOnly 쿠키에 저장
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7일
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('회원가입 오류:', error);
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
