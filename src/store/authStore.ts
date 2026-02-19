/**
 * 인증 상태 관리 (Zustand)
 * - accessToken: 메모리에만 저장 (XSS 방지)
 * - refreshToken: httpOnly 쿠키에 저장 (client.ts에서 관리)
 * - user: 쿠키에도 저장 (middleware에서 읽을 수 있도록)
 */

import { create } from 'zustand';
import { User } from '@/types/user';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;

  // 액션
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;

  // 파생 상태
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  isSuspended: () => boolean;
  isActive: () => boolean;
}

/**
 * 쿠키 헬퍼
 */
function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setSeconds(expires.getSeconds() + maxAge);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
}

export const authStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: false,

  setAuth: (user, accessToken) => {
    // user 정보를 쿠키에도 저장 (middleware에서 읽을 수 있도록)
    setCookie('user', JSON.stringify(user), 7 * 24 * 60 * 60);
    set({ user, accessToken, isLoading: false });
  },

  setAccessToken: (token) =>
    set({ accessToken: token }),

  setUser: (user) => {
    // user 정보를 쿠키에도 저장
    setCookie('user', JSON.stringify(user), 7 * 24 * 60 * 60);
    set({ user });
  },

  setLoading: (loading) =>
    set({ isLoading: loading }),

  logout: () => {
    // 쿠키에서도 user 제거
    removeCookie('user');
    set({ user: null, accessToken: null, isLoading: false });
  },

  isAuthenticated: () => {
    const { user, accessToken } = get();
    return user !== null && accessToken !== null;
  },

  isAdmin: () => {
    const { user } = get();
    return user?.role === 'admin';
  },

  isSuspended: () => {
    const { user } = get();
    return user?.status === 'suspended';
  },

  isActive: () => {
    const { user } = get();
    return user?.status === 'active';
  },
}));

// 훅 형태로도 export (컴포넌트에서 사용)
export const useAuthStore = authStore;
