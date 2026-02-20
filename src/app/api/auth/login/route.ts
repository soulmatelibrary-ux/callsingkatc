/**
 * POST /api/auth/login
 * 로그인 API
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // 유효성 검사
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 사용자 조회 (항공사 정보, 비밀번호 정책 추적 필드 포함)
    const result = await query(
      `SELECT
         u.id, u.password_hash, u.status, u.role, u.email,
         u.airline_id, u.is_default_password, u.password_change_required,
         a.code as airline_code, a.name_ko as airline_name_ko, a.name_en as airline_name_en
       FROM users u
       LEFT JOIN airlines a ON u.airline_id = a.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      // 열거 공격 방어: 존재하지 않는 사용자도 같은 메시지 반환
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    const user = result.rows[0];
    console.log('[LOGIN] 조회된 사용자:', {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 사용자 상태 확인
    if (user.status === 'suspended') {
      return NextResponse.json(
        { error: '정지된 계정입니다.' },
        { status: 403 }
      );
    }

    // 마지막 로그인 시간 업데이트
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    // 토큰 생성 (airline_id 포함)
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      airlineId: user.airline_id,
    });

    const refreshToken = generateRefreshToken(user.id);

    // 항공사 정보 구성
    const airline = user.airline_code
      ? {
          id: user.airline_id,
          code: user.airline_code,
          name_ko: user.airline_name_ko,
          name_en: user.airline_name_en,
        }
      : null;

    const sanitizedUser = {
      id: user.id,
      email: user.email,
      status: user.status,
      role: user.role,
      airline_id: user.airline_id,
      airline,
      is_default_password: user.is_default_password,
      password_change_required: user.password_change_required,
      forceChangePassword: user.is_default_password === true,
    };

    // 응답 생성 (forceChangePassword 플래그 포함)
    const response = NextResponse.json(
      {
        user: sanitizedUser,
        accessToken,
        forceChangePassword: sanitizedUser.forceChangePassword,
      },
      { status: 200 }
    );

    // refreshToken은 httpOnly 쿠키에 저장
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    // user 쿠키 설정 (라우트 보호 및 세션 확인용)
    response.cookies.set('user', JSON.stringify({
      id: sanitizedUser.id,
      email: sanitizedUser.email,
      role: sanitizedUser.role,
      status: sanitizedUser.status,
      airline_id: sanitizedUser.airline_id,
      airline: sanitizedUser.airline,
    }), {
      httpOnly: false, // 클라이언트에서 접근 가능
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('로그인 오류:', error);
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
