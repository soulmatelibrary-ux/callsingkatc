/**
 * POST /api/auth/logout
 * 로그아웃 API (쿠키 삭제)
 */

import { NextRequest, NextResponse } from 'next/server';

async function handleLogout(request: NextRequest) {
  const response = NextResponse.json(
    { message: '로그아웃되었습니다.' },
    { status: 200 }
  );

  // refreshToken 쿠키 삭제 (명시적으로 Max-Age=0 설정)
  response.cookies.set({
    name: 'refreshToken',
    value: '',
    maxAge: 0,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });

  // user 쿠키도 삭제
  response.cookies.set({
    name: 'user',
    value: '',
    maxAge: 0,
    path: '/',
  });

  return response;
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}
