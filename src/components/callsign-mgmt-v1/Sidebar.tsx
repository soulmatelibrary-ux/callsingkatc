'use client';

import { useState } from 'react';
import { FileUploadZone } from './uploads/FileUploadZone';
import { UploadResult } from './uploads/UploadResult';
import { UploadHistory } from './uploads/UploadHistory';

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
  const [uploadHistory, setUploadHistory] = useState<Array<any>>([]);

  const handleUploadComplete = (result: UploadResultData) => {
    setUploadResult(result);
    // 업로드 이력에 추가
    setUploadHistory((prev) => [
      {
        fileName: `upload_${new Date().toISOString().split('T')[0]}`,
        uploadedAt: new Date().toISOString(),
        totalRows: result.total,
        successCount: result.inserted,
        failedCount: result.failed,
      },
      ...prev,
    ].slice(0, 5));
  };

  return (
    <div className="space-y-6">
      <FileUploadZone onUploadComplete={handleUploadComplete} />
      {uploadResult && <UploadResult result={uploadResult} />}
      <UploadHistory history={uploadHistory} />
    </div>
  );
}
