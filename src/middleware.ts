import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 테스트 단계에서는 미들웨어에서 인증을 강제하지 않고 그대로 통과시킨다.
 * 추후 세션 관리가 복원되면 기존 로직을 다시 적용한다.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
