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

  // 액션
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  fetchUserInfo: () => Promise<User | null>;

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
      get().logout();
      return null;
    } catch (error) {
      console.error('사용자 정보 가져오기 실패:', error);
      get().logout();
      return null;
    }
  },

  logout: () => {
    // 쿠키 정리를 위한 API 호출
    fetch('/api/auth/logout', { 
      method: 'POST',
      credentials: 'include'
    }).catch(console.error);
    
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
