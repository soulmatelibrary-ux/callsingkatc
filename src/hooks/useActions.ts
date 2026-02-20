/**
 * 조치(조사/개선) 관련 React Query 훅
 * - useAirlineActions: 조치 목록 조회 (필터/페이지 지원)
 * - useCallsigns: 호출부호 목록 조회
 * - useCreateAction: 조치 등록
 * - useUpdateAction: 조치 상태 업데이트
 * - useDeleteAction: 조치 삭제
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import {
  Action,
  Callsign,
  ActionListResponse,
  CallsignListResponse,
  CreateActionRequest,
  UpdateActionRequest,
} from '@/types/action';

/**
 * 조치 목록 조회 (항공사별)
 * 필터: status, search
 * 페이지네이션 지원
 */
export function useAirlineActions(filters?: {
  airlineId?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  search?: string;
  page?: number;
  limit?: number;
}) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;

  return useQuery({
    queryKey: ['airline-actions', filters?.airlineId, filters?.status, filters?.search, page, limit],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }

      if (!filters?.airlineId) {
        throw new Error('항공사 ID가 필요합니다.');
      }

      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      params.append('page', String(page));
      params.append('limit', String(limit));

      const response = await fetch(`/api/airlines/${filters.airlineId}/actions?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증이 필요합니다.');
        }
        throw new Error('조치 목록 조회 실패');
      }

      const data = (await response.json()) as ActionListResponse;
      return data;
    },
    enabled: !!accessToken && !!filters?.airlineId,
    staleTime: 30 * 1000, // 30초
    gcTime: 5 * 60 * 1000, // 5분
  });
}

/**
 * 호출부호 목록 조회 (인증 필요)
 * 필터: riskLevel
 * 페이지네이션 지원
 */
export function useCallsigns(filters?: {
  riskLevel?: string;
  page?: number;
  limit?: number;
}) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;

  return useQuery({
    queryKey: ['callsigns', filters?.riskLevel, page, limit],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const params = new URLSearchParams();
      if (filters?.riskLevel) params.append('riskLevel', filters.riskLevel);
      params.append('page', String(page));
      params.append('limit', String(limit));

      const response = await fetch(`/api/callsigns?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('호출부호 목록 조회 실패');
      }

      const data = (await response.json()) as CallsignListResponse;
      return data;
    },
    enabled: !!accessToken,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * 항공사별 호출부호 목록 조회 (인증 필요)
 */
export function useAirlineCallsigns(
  airlineId: string | undefined,
  filters?: {
    riskLevel?: string;
    page?: number;
    limit?: number;
  }
) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;

  return useQuery({
    queryKey: ['airline-callsigns', airlineId, filters?.riskLevel, page, limit],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const params = new URLSearchParams();
      if (filters?.riskLevel) params.append('riskLevel', filters.riskLevel);
      params.append('page', String(page));
      params.append('limit', String(limit));

      const response = await fetch(
        `/api/airlines/${airlineId}/callsigns?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('항공사별 호출부호 조회 실패');
      }

      const data = (await response.json()) as CallsignListResponse;
      return data;
    },
    enabled: !!accessToken && !!airlineId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * 조치 상세 조회
 */
export function useAction(actionId: string | undefined) {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: ['action', actionId],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(`/api/actions/${actionId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('조치를 찾을 수 없습니다.');
        }
        throw new Error('조치 상세 조회 실패');
      }

      return (await response.json()) as Action;
    },
    enabled: !!accessToken && !!actionId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * 조치 등록 (관리자만)
 */
export function useCreateAction() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateActionRequest & { airlineId: string }) => {
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const { airlineId, ...actionData } = data;

      const response = await fetch(`/api/airlines/${airlineId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(actionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '조치 등록 실패');
      }

      return (await response.json()) as Action;
    },
    onSuccess: () => {
      // 조치 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['airline-actions'] });
    },
  });
}

/**
 * 조치 상태 업데이트 (관리자만)
 */
export function useUpdateAction() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateActionRequest & { id: string }) => {
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const { id, ...updateData } = data;

      const response = await fetch(`/api/actions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '조치 업데이트 실패');
      }

      return (await response.json()) as Action;
    },
    onSuccess: () => {
      // 조치 목록 및 상세 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      queryClient.invalidateQueries({ queryKey: ['action'] });
    },
  });
}

/**
 * 조치 삭제 (관리자만)
 */
export function useDeleteAction() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(`/api/actions/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '조치 삭제 실패');
      }

      return response.json();
    },
    onSuccess: () => {
      // 조치 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
  });
}
