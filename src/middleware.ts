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

interface RefreshTokenPayload {
  userId: string;
  exp?: number;
}

const decodeJwtPayload = (token: string): RefreshTokenPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64Payload.padEnd(base64Payload.length + (4 - (base64Payload.length % 4)) % 4, '=');
    const decoded = atob(padded);
    const jsonPayload = decodeURIComponent(
      decoded
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.warn('[Middleware] refreshToken payload decode 실패:', error);
    return null;
  }
};

const isTokenExpired = (payload: RefreshTokenPayload | null): boolean => {
  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('[Middleware] pathname:', pathname);

  // refreshToken 쿠키만 확인 (단순화)
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const userCookie = request.cookies.get('user')?.value;

  console.log('[Middleware] refreshToken exists:', !!refreshToken);

  // 토큰 유효성/만료 여부 체크
  let tokenPayload: RefreshTokenPayload | null = null;
  let shouldDeleteRefreshToken = false;
  let isValidFormat = false;

  if (refreshToken) {
    const parts = refreshToken.split('.');
    isValidFormat = parts.length === 3 && parts.every((part) => part.length > 0);

    if (!isValidFormat) {
      shouldDeleteRefreshToken = true;
    } else {
      tokenPayload = decodeJwtPayload(refreshToken);
      if (!tokenPayload || isTokenExpired(tokenPayload)) {
        console.log('[Middleware] refreshToken 만료 또는 손상 → 삭제 예정');
        shouldDeleteRefreshToken = true;
        tokenPayload = null;
      }
    }
  }

  const isLoggedIn = !!refreshToken && isValidFormat && !!tokenPayload;
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

  const finalizeResponse = (response: NextResponse) => {
    if (shouldDeleteRefreshToken) {
      response.cookies.delete('refreshToken');
    }
    return response;
  };

  // 1. 로그인 안 된 상태 + 보호 라우트 → /으로 리다이렉트
  if (!isLoggedIn && isProtectedRoute) {
    console.log('[Middleware] 리다이렉트: 보호 라우트 - 인증 실패 → 홈으로 이동');
    return finalizeResponse(NextResponse.redirect(new URL('/', request.url)));
  }

  // 2. 로그인 상태 + 인증 라우트 → 역할별 기본 페이지로 리다이렉트
  if (isLoggedIn && isAuthRoute) {
    console.log('[Middleware] 리다이렉트: 인증 라우트 →', defaultRedirect);
    return finalizeResponse(NextResponse.redirect(new URL(defaultRedirect, request.url)));
  }

  // 3. 로그인 상태 + 홈(/) 접속 → 역할별 기본 페이지로 리다이렉트
  if (isLoggedIn && pathname === '/') {
    console.log('[Middleware] 리다이렉트: 홈 →', defaultRedirect);
    return finalizeResponse(NextResponse.redirect(new URL(defaultRedirect, request.url)));
  }

  return finalizeResponse(NextResponse.next());
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
