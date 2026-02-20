/**
 * 환경 변수
 */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'KATC 유사호출부호 경고시스템';

/**
 * 비밀번호 규칙 (강화됨)
 * - 최소 8자
 * - 최소 1개의 대문자
 * - 최소 1개의 소문자
 * - 최소 1개의 숫자
 * - 최소 1개의 특수문자
 */
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]).{8,}$/;
export const PASSWORD_RULE = '8자 이상, 대문자·소문자·숫자·특수문자 모두 포함';

/**
 * 에러 메시지 (열거 공격 방어: 이메일/비밀번호 구분 없이 동일 메시지)
 */
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
  USER_NOT_FOUND: '이메일 또는 비밀번호가 올바르지 않습니다.',
  INVALID_EMAIL: '유효한 이메일을 입력해주세요.',
  WEAK_PASSWORD: PASSWORD_RULE,
  PENDING_APPROVAL: '관리자의 승인을 기다리는 중입니다.',
  SUSPENDED_ACCOUNT: '정지된 계정입니다.',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
  UNKNOWN_ERROR: '오류가 발생했습니다.',
};

/**
 * 쿠키 설정
 */
export const COOKIE_OPTIONS = {
  REFRESH_TOKEN_NAME: 'refreshToken',
  REFRESH_TOKEN_MAX_AGE: 7 * 24 * 60 * 60, // 7일 (초 단위)
  PATH: '/',
  HTTP_ONLY: true,
  SECURE: process.env.NODE_ENV === 'production',
  SAME_SITE: 'lax' as const,
};

/**
 * 폴링 설정
 */
export const POLLING = {
  PENDING_INTERVAL: 30000, // 30초
  PENDING_MAX_ATTEMPTS: 120, // 최대 60분
};

/**
 * 라우트 설정
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  CHANGE_PASSWORD: '/change-password',
  PENDING: '/pending',
  AIRLINE: '/airline',
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_PASSWORD_RESET: '/admin/password-reset',
  ADMIN_AIRLINES: '/admin/airlines',
};

/**
 * 사용자 상태 (변경됨: pending 제거 → 사전등록만 지원)
 */
export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
} as const;

/**
 * 국내 항공사 목록 (9개)
 */
export const AIRLINES = [
  { code: 'KAL', name_ko: '대한항공', name_en: 'Korean Air' },
  { code: 'AAR', name_ko: '아시아나항공', name_en: 'Asiana Airlines' },
  { code: 'JJA', name_ko: '제주항공', name_en: 'Jeju Air' },
  { code: 'JNA', name_ko: '진에어', name_en: 'Jin Air' },
  { code: 'TWB', name_ko: '티웨이항공', name_en: 'T\'way Air' },
  { code: 'ABL', name_ko: '에어부산', name_en: 'Air Busan' },
  { code: 'ASV', name_ko: '에어서울', name_en: 'Air Seoul' },
  { code: 'EOK', name_ko: '이스타항공', name_en: 'Eastar Jet' },
  { code: 'FGW', name_ko: '플라이강원', name_en: 'Fly Gangwon' },
] as const;

/**
 * 사용자 역할
 */
export const USER_ROLE = {
  ADMIN: 'admin',
  USER: 'user',
} as const;
