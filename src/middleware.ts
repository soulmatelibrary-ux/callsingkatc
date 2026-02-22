/**
 * Next.js 미들웨어: 서버사이드 라우트 보호
 * - refreshToken 쿠키만 검증 (단순화)
 * - 역할 기반 접근 제어는 클라이언트에서 처리
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 보호되는 라우트
const protectedRoutes = ['/airline', '/admin', '/announcements', '/callsign-management'];
const authRoutes = ['/login', '/forgot-password', '/change-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('[Middleware] pathname:', pathname);

  // refreshToken 쿠키만 확인 (단순화)
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const userCookie = request.cookies.get('user')?.value;

  console.log('[Middleware] refreshToken exists:', !!refreshToken);
  
  // 기본 토큰 형태 검증 (JWT 형태인지만 확인)
  let isValidFormat = false;
  if (refreshToken) {
    const parts = refreshToken.split('.');
    isValidFormat = parts.length === 3 && parts.every(part => part.length > 0);
    console.log('[Middleware] token format valid:', isValidFormat);
  }

  const isLoggedIn = !!refreshToken && isValidFormat;
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  let userRole: string | null = null;
  if (userCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(userCookie));
      userRole = parsed?.role || null;
    } catch (error) {
      console.warn('[Middleware] 사용자 쿠키 파싱 실패:', error);
    }
  }

  const defaultRedirect = userRole === 'admin' ? '/callsign-management' : '/airline';

  console.log('[Middleware] isLoggedIn:', isLoggedIn, 'isProtectedRoute:', isProtectedRoute, 'isAuthRoute:', isAuthRoute);

  // 1. 로그인 안 된 상태 + 보호 라우트 → /으로 리다이렉트
  if (!isLoggedIn && isProtectedRoute) {
    console.log('[Middleware] 리다이렉트: 보호 라우트 - 인증 실패 → 홈으로 이동');
    const redirectResponse = NextResponse.redirect(new URL('/', request.url));

    // 형식이 잘못된 쿠키 제거
    if (refreshToken && !isValidFormat) {
      redirectResponse.cookies.delete('refreshToken');
    }

    return redirectResponse;
  }

  // 2. 로그인 상태 + 인증 라우트 → 역할별 기본 페이지로 리다이렉트
  if (isLoggedIn && isAuthRoute) {
    console.log('[Middleware] 리다이렉트: 인증 라우트 →', defaultRedirect);
    return NextResponse.redirect(new URL(defaultRedirect, request.url));
  }

  // 3. 로그인 상태 + 홈(/) 접속 → 역할별 기본 페이지로 리다이렉트
  if (isLoggedIn && pathname === '/') {
    console.log('[Middleware] 리다이렉트: 홈 →', defaultRedirect);
    return NextResponse.redirect(new URL(defaultRedirect, request.url));
  }

  return NextResponse.next();
}

/**
 * 미들웨어 설정
 */
export const config = {
  matcher: [
    // 보호 라우트
    '/airline/:path*',
    '/admin/:path*',
    '/callsign-management/:path*',
    // 인증 라우트
    '/login',
    '/forgot-password',
    '/change-password',
    // 제외 라우트
    '/((?!_next|api|static|favicon.ico).*)',
  ],
};
