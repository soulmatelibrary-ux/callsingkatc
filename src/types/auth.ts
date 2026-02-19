/**
 * 토큰 갱신 응답 타입
 */
export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * 인증 상태 타입
 */
export interface AuthState {
  user: any | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * 로그인 요청 타입
 */
export interface LoginRequest {
  email: string;
  password: string;
}
