'use client';

import { useMemo, useState } from 'react';
import { FileUploadZone } from './uploads/FileUploadZone';
import { UploadResult } from './uploads/UploadResult';
import { UploadHistory } from './uploads/UploadHistory';
import { UploadHistoryManagement } from './uploads/UploadHistoryManagement';
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
  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'history'>('upload');

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
      {/* 업로드 / 이력 관리 탭 */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab('upload')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeSubTab === 'upload'
              ? 'text-primary border-b-2 border-primary -mb-[2px]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📁 업로드
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeSubTab === 'history'
              ? 'text-primary border-b-2 border-primary -mb-[2px]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📋 이력 관리
        </button>
      </div>

      {/* 업로드 탭 */}
      {activeSubTab === 'upload' && (
        <div className="space-y-6">
          <FileUploadZone onUploadComplete={handleUploadComplete} />
          {uploadResult && <UploadResult result={uploadResult} />}
          <UploadHistory history={history} />
        </div>
      )}

      {/* 이력 관리 탭 */}
      {activeSubTab === 'history' && (
        <UploadHistoryManagement />
      )}
    </div>
  );
}
