'use client';

import { useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { NanoIcon } from '@/components/ui/NanoIcon';
import { FileSpreadsheet, UploadCloud } from 'lucide-react';

interface FileUploadZoneProps {
  onUploadComplete: (result: any) => void;
}

export function FileUploadZone({ onUploadComplete }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { accessToken } = useAuthStore((s) => ({ accessToken: s.accessToken }));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // 파일 타입 검증
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('.xlsx 또는 .xls 파일만 지원합니다.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('업로드할 파일을 선택해주세요.');
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + Math.random() * 20, 90));
      }, 200);

      const res = await fetch('/api/admin/upload-callsigns', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!res.ok) {
        throw new Error('업로드 실패');
      }

      const data = await res.json();
      onUploadComplete(data);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드 실패');
      console.error(err);
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div className="bg-white rounded-none shadow-sm border border-gray-100 p-8">
      <div className="flex items-center gap-3 mb-6">
        <NanoIcon icon={FileSpreadsheet} color="orange" size="sm" />
        <h3 className="text-lg font-black text-gray-900">엑셀 업로드</h3>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-none p-8 text-center transition-all cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-primary/5'
          }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="mb-4 flex justify-center">
          <NanoIcon icon={UploadCloud} color="primary" size="lg" />
        </div>
        <div className="text-sm font-bold text-gray-600 mb-2">
          {selectedFile ? selectedFile.name : '파일을 드래그하거나 클릭해서 선택'}
        </div>
        <p className="text-xs text-gray-400">
          {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : '.xlsx, .xls 파일만 지원 (최대 10MB)'}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
          className="hidden"
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className="w-full mt-6 px-6 py-3 bg-primary text-white font-bold rounded-none shadow-sm hover:bg-navy disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
      >
        {isUploading ? '업로드 중...' : '업로드'}
      </button>

      {/* 진행률 */}
      {isUploading && (
        <div className="mt-4">
          <div className="flex items-center gap-3 mb-2">
            <svg
              className="w-4 h-4 text-primary animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="text-sm font-bold text-gray-700">처리 중... {Math.floor(progress)}%</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-none overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="mt-4 px-4 py-3 bg-red-50 border border-red-100 rounded-none text-sm text-red-700 font-bold">
          {error}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-100">
        <h4 className="text-sm font-black text-gray-700 mb-3">📋 Excel 형식 안내</h4>
        <ul className="text-xs text-gray-500 space-y-2 text-left">
          <li>• 국내 항공사 데이터만 자동으로 필터링됩니다.</li>
          <li>• 편명1 또는 편명2에서 국내 항공사 코드를 추출합니다.</li>
          <li>• 유사도 및 오류발생가능성 정보가 자동 매핑됩니다.</li>
          <li>• 중복된 유사호출부호 쌍은 자동 업데이트됩니다.</li>
          <li className="pt-2 border-t border-dashed border-gray-200">
            <strong>필수 컬럼:</strong> 편명1, 편명2 (나머지는 선택사항)
          </li>
        </ul>
      </div>
    </div>
  );
}
