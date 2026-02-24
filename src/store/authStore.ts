/**
 * 인증 상태 관리 (Zustand) - 서버 중심 패턴
 * - accessToken: 메모리에만 저장
 * - refreshToken: httpOnly 쿠키에만 저장
 * - user: 서버에서만 가져옴 (쿠키 저장 없음)
 */

import { create } from 'zustand';
import { User } from '@/types/user';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;

  // 액션
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (value: boolean) => void;
  logout: () => Promise<void>;
  fetchUserInfo: () => Promise<User | null>;
  initializeAuth: () => Promise<void>;

  // 파생 상태
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  isSuspended: () => boolean;
  isActive: () => boolean;
}

export const authStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  isInitialized: false,

  setAuth: (user, accessToken) => {
    // 메모리에만 저장, 쿠키 저장 제거
    set({ user, accessToken, isLoading: false });
  },

  setAccessToken: (token) =>
    set({ accessToken: token }),

  setUser: (user) => {
    // 메모리에만 저장, 쿠키 저장 제거
    set({ user });
  },

  setLoading: (loading) =>
    set({ isLoading: loading }),

  setInitialized: (value) =>
    set({ isInitialized: value }),

  // 페이지 로드 시 초기화: refreshToken이 있으면 accessToken 자동 갱신
  initializeAuth: async () => {
    try {
      const state = get();

      // 이미 초기화되었으면 스킵
      if (state.isInitialized) {
        return;
      }

      set({ isLoading: true });

      // refreshToken 쿠키가 있는지 확인 (refresh API 호출로 확인)
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // 쿠키 포함
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        set({
          user: data.user,
          accessToken: data.accessToken,
          isInitialized: true,
          isLoading: false,
        });
        console.log('[AuthStore] 초기화 완료: refreshToken으로 토큰 갱신됨');
      } else {
        // refreshToken이 유효하지 않으면 로그아웃
        await get().logout();
        set({ isInitialized: true, isLoading: false });
        console.log('[AuthStore] 초기화 완료: refreshToken 유효하지 않음');
      }
    } catch (error) {
      console.error('[AuthStore] 초기화 오류:', error);
      await get().logout();
      set({ isInitialized: true, isLoading: false });
    }
  },

  // 서버에서 현재 사용자 정보 가져오기
  fetchUserInfo: async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // 쿠키 포함
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          set({ user: data.user });
          return data.user;
        }
      }

      // 서버에서 사용자 정보를 가져올 수 없으면 로그아웃
      await get().logout();
      return null;
    } catch (error) {
      console.error('사용자 정보 가져오기 실패:', error);
      await get().logout();
      return null;
    }
  },

  logout: async () => {
    // 쿠키 정리를 위한 API 호출 (완료 대기)
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
    }

    // 메모리 상태만 초기화
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
