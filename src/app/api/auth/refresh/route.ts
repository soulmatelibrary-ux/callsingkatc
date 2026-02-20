/**
 * POST /api/auth/refresh
 * 토큰 갱신 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // 쿠키에서 refreshToken 추출
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: '리프레시 토큰이 필요합니다.' },
        { status: 401 }
      );
    }

    // 리프레시 토큰 검증
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { error: '유효하지 않은 리프레시 토큰입니다.' },
        { status: 401 }
      );
    }

    // DB에서 사용자 정보 조회 (airline_id 포함)
    const result = await query(
      `SELECT
         u.id,
         u.email,
         u.status,
         u.role,
         u.airline_id,
         u.is_default_password,
         u.password_change_required,
         a.code as airline_code,
         a.name_ko as airline_name_ko,
         a.name_en as airline_name_en
       FROM users u
       LEFT JOIN airlines a ON u.airline_id = a.id
       WHERE u.id = $1`,
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    const airline = user.airline_code
      ? {
          id: user.airline_id,
          code: user.airline_code,
          name_ko: user.airline_name_ko,
          name_en: user.airline_name_en,
        }
      : null;

    // 새 토큰 생성 (airline_id 포함)
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      airlineId: user.airline_id,
    });

    const newRefreshToken = generateRefreshToken(user.id);

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

    // 응답 생성
    const response = NextResponse.json(
      {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: sanitizedUser,
      },
      { status: 200 }
    );

    // 새 refreshToken을 쿠키에 설정
    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    // user 쿠키도 최신 정보로 갱신
    response.cookies.set('user', JSON.stringify(sanitizedUser), {
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('토큰 갱신 오류:', error);
    return NextResponse.json(
      { error: '토큰 갱신 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
