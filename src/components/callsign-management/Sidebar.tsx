'use client';

import { useMemo, useState } from 'react';
import { FileUploadZone } from './uploads/FileUploadZone';
import { UploadResult } from './uploads/UploadResult';
import { UploadHistory } from './uploads/UploadHistory';
import { useFileUploads } from '@/hooks/useFileUploads';

interface UploadResultData {
  success: boolean;
  total: number;
  inserted: number;
  updated: number;
  failed: number;
  errors?: string[];
}

export function Sidebar() {
  const [uploadResult, setUploadResult] = useState<UploadResultData | null>(null);

  // 서버에 저장된 파일 업로드 이력 조회 (완료 상태 기준, 최근 5개)
  const {
    data: fileUploads,
    refetch: refetchFileUploads,
  } = useFileUploads({ status: 'completed', page: 1, limit: 5 });

  const history = useMemo(
    () =>
      (fileUploads?.data || []).map((item) => ({
        fileName: item.fileName || item.file_name,
        uploadedAt: item.uploadedAt || item.uploaded_at,
        totalRows: item.totalRows ?? item.total_rows,
        successCount: item.successCount ?? item.success_count,
        failedCount: item.failedCount ?? item.failed_count,
      })),
    [fileUploads]
  );

  const handleUploadComplete = (result: UploadResultData) => {
    setUploadResult(result);
    // 업로드 완료 후 서버 이력 재조회
    refetchFileUploads();
  };

  return (
    <div className="space-y-6">
      <FileUploadZone onUploadComplete={handleUploadComplete} />
      {uploadResult && <UploadResult result={uploadResult} />}
      <UploadHistory history={history} />
    </div>
  );
}
