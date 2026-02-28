/**
 * Next.js 미들웨어: 서버사이드 라우트 보호
 * - refreshToken 쿠키만 검증 (단순화)
 * - 역할 기반 접근 제어는 클라이언트에서 처리
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 보호되는 라우트
const protectedRoutes = ['/airline', '/admin', '/announcements', '/callsign-management'];
// 📌 /change-password는 제외: 로그인 상태의 사용자가 언제든 접근 가능해야 함
const authRoutes = ['/login', '/forgot-password'];

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

  // refreshToken 쿠키만 확인 (단순화)
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const userCookie = request.cookies.get('user')?.value;

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
        shouldDeleteRefreshToken = true;
        tokenPayload = null;
      }
    }
  }

  const isLoggedIn = !!refreshToken && isValidFormat && !!tokenPayload;
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  let userRole: string | null = null;
  let needsPasswordChange = false;
  if (userCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(userCookie));
      userRole = parsed?.role || null;
      // 📌 passwordChangeRequired 플래그 확인
      needsPasswordChange = parsed?.passwordChangeRequired === true;
    } catch (error) {
      // 쿠키 파싱 실패: 로그인 상태로 간주하지 않음
    }
  }

  const defaultRedirect = userRole === 'admin' ? '/admin' : '/airline';

  const finalizeResponse = (response: NextResponse) => {
    if (shouldDeleteRefreshToken) {
      response.cookies.delete('refreshToken');
    }
    return response;
  };

  // 📌 강제 비밀번호 변경 필요 여부 체크
  // - 로그인 상태 AND 비밀번호 변경 필요 AND 보호 라우트 AND change-password 경로 제외
  const isChangePasswordRoute = pathname === '/change-password' || pathname.startsWith('/api/auth/change-password') || pathname.startsWith('/api/auth/logout') || pathname.startsWith('/api/auth/me');
  const needsForcedPasswordChange = isLoggedIn && needsPasswordChange && isProtectedRoute && !isChangePasswordRoute;

  // 0. 강제 비밀번호 변경 → /change-password로 리다이렉트 (우회 불가)
  if (needsForcedPasswordChange) {
    return finalizeResponse(NextResponse.redirect(new URL('/change-password?forced=true', request.url)));
  }

  // 1. 로그인 안 된 상태 + 보호 라우트 → /으로 리다이렉트
  if (!isLoggedIn && isProtectedRoute) {
    return finalizeResponse(NextResponse.redirect(new URL('/', request.url)));
  }

  // 2. 로그인 상태 + 인증 라우트 → 역할별 기본 페이지로 리다이렉트
  // (비밀번호 변경 필요한 경우는 제외)
  if (isLoggedIn && isAuthRoute && !needsPasswordChange) {
    return finalizeResponse(NextResponse.redirect(new URL(defaultRedirect, request.url)));
  }

  // 3. 로그인 상태 + 홈(/) 접속 → 역할별 기본 페이지로 리다이렉트
  if (isLoggedIn && pathname === '/') {
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
