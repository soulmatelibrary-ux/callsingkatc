/**
 * Next.js 미들웨어: 서버사이드 라우트 보호
 * - refreshToken 쿠키 기반 인증 확인
 * - 역할 기반 접근 제어
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 보호되는 라우트
const protectedRoutes = ['/airline', '/admin'];
const authRoutes = ['/login', '/signup', '/forgot-password', '/change-password'];
const changePasswordRoute = '/change-password';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('[Middleware] pathname:', pathname);

  // refreshToken 쿠키 확인 (httpOnly 쿠키는 서버에서만 접근 가능)
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const user = request.cookies.get('user')?.value;

  console.log('[Middleware] refreshToken:', !!refreshToken);
  console.log('[Middleware] user:', !!user);

  let parsedUser = null;
  if (user) {
    try {
      parsedUser = JSON.parse(decodeURIComponent(user));
    } catch (e) {
      // 쿠키 파싱 실패 - 로그인 안 된 상태로 취급
    }
  }

  const isLoggedIn = !!refreshToken;
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const isChangePasswordRoute = pathname.startsWith(changePasswordRoute);

  console.log('[Middleware] isLoggedIn:', isLoggedIn, 'isProtectedRoute:', isProtectedRoute, 'isAuthRoute:', isAuthRoute);

  // 1. 로그인 안 된 상태 + 보호 라우트 → /login으로 리다이렉트
  if (!isLoggedIn && isProtectedRoute) {
    console.log('[Middleware] 리다이렉트: 보호 라우트');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. 로그인 상태 + 인증 라우트 → /airline으로 리다이렉트
  // (단, /change-password는 제외 - 비밀번호 변경이 필요한 경우를 위함)
  if (isLoggedIn && isAuthRoute && !isChangePasswordRoute) {
    console.log('[Middleware] 리다이렉트: 인증 라우트 → airline');
    return NextResponse.redirect(new URL('/airline', request.url));
  }

  // 3. 로그인 상태 + 역할 기반 접근 제어
  if (isLoggedIn && parsedUser) {
    // 관리자 라우트 접근 제어 - role이 admin이 아니면 /airline으로 리다이렉트
    if (pathname.startsWith('/admin') && parsedUser.role !== 'admin') {
      console.log('[Middleware] 리다이렉트: 권한 없음');
      return NextResponse.redirect(new URL('/airline', request.url));
    }

    // 비밀번호 변경 필요 확인
    // forceChangePassword가 true이고 /change-password가 아니면 /change-password로 리다이렉트
    if (parsedUser.forceChangePassword && !isChangePasswordRoute) {
      console.log('[Middleware] 리다이렉트: 비밀번호 변경 필요');
      return NextResponse.redirect(new URL('/change-password', request.url));
    }
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
