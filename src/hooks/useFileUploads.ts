/**
 * 파일 업로드 이력 조회 훅
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';

export interface FileUploadItem {
  id: string;
  file_name: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  total_rows: number;
  success_count: number;
  failed_count: number;
  error_message?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processed_at?: string;
  can_delete?: boolean;
  actions_count?: number;
  // camelCase 버전
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  totalRows: number;
  successCount: number;
  failedCount: number;
  errorMessage?: string;
  processedAt?: string;
}

export interface FileUploadListResponse {
  data: FileUploadItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useFileUploads(
  filters?: {
    status?: 'pending' | 'processing' | 'completed' | 'failed';
    page?: number;
    limit?: number;
  }
) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;

  return useQuery({
    queryKey: ['file-uploads', filters?.status, page, limit],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      params.append('page', String(page));
      params.append('limit', String(limit));

      const response = await fetch(`/api/admin/file-uploads?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증이 필요합니다.');
        }
        if (response.status === 403) {
          throw new Error('관리자 권한이 필요합니다.');
        }
        throw new Error('파일 업로드 이력 조회 실패');
      }

      const data = (await response.json()) as FileUploadListResponse;
      return data;
    },
    enabled: !!accessToken,
    staleTime: 30 * 1000, // 30초
    gcTime: 5 * 60 * 1000, // 5분
  });
}

/**
 * 파일 업로드 이력 삭제 mutation
 */
export function useDeleteFileUpload() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation({
    mutationFn: async (fileUploadId: string) => {
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(`/api/admin/file-uploads/${fileUploadId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          throw new Error(errorData.error || '항공사가 작성한 조치가 있어 삭제할 수 없습니다.');
        }
        if (response.status === 401) {
          throw new Error('인증이 필요합니다.');
        }
        if (response.status === 403) {
          throw new Error('관리자 권한이 필요합니다.');
        }
        if (response.status === 404) {
          throw new Error('업로드 이력을 찾을 수 없습니다.');
        }
        throw new Error(errorData.error || '업로드 이력 삭제 실패');
      }

      return response.json();
    },
    onSuccess: () => {
      // 캐시 무효화: file-uploads 쿼리 모두 무효화
      queryClient.invalidateQueries({ queryKey: ['file-uploads'] });
    },
  });
}
