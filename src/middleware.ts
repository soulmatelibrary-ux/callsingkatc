/**
 * Next.js 미들웨어: 서버사이드 라우트 보호
 * - refreshToken 쿠키만 검증 (단순화)
 * - 역할 기반 접근 제어는 클라이언트에서 처리
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 보호되는 라우트
const protectedRoutes = ['/airline', '/admin', '/dashboard'];
const authRoutes = ['/login', '/signup', '/forgot-password', '/change-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('[Middleware] pathname:', pathname);

  // refreshToken 쿠키만 확인 (단순화)
  const refreshToken = request.cookies.get('refreshToken')?.value;

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

  console.log('[Middleware] isLoggedIn:', isLoggedIn, 'isProtectedRoute:', isProtectedRoute, 'isAuthRoute:', isAuthRoute);

  // 1. 로그인 안 된 상태 + 보호 라우트 → /login으로 리다이렉트
  if (!isLoggedIn && isProtectedRoute) {
    console.log('[Middleware] 리다이렉트: 보호 라우트 - 인증 실패');
    const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
    
    // 형식이 잘못된 쿠키 제거
    if (refreshToken && !isValidFormat) {
      redirectResponse.cookies.delete('refreshToken');
    }
    
    return redirectResponse;
  }

  // 2. 로그인 상태 + 인증 라우트 → /airline으로 리다이렉트
  if (isLoggedIn && isAuthRoute) {
    console.log('[Middleware] 리다이렉트: 인증 라우트 → airline');
    return NextResponse.redirect(new URL('/airline', request.url));
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
    // 인증 라우트
    '/login',
    '/signup',
    '/forgot-password',
    '/change-password',
    // 제외 라우트
    '/((?!_next|api|static|favicon.ico).*)',
  ],
};
