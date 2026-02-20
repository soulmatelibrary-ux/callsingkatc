'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/lib/constants';
import { Header } from '@/components/layout/Header';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin } = useAuthStore((s) => ({
    user: s.user,
    isAuthenticated: s.isAuthenticated(),
    isAdmin: s.isAdmin(),
  }));

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(ROUTES.HOME);
      return;
    }
    // 관리자도 대시보드 접근 가능하도록 수정
  }, [isAuthenticated, router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        alert('Excel 파일(.xlsx, .xls)만 업로드 가능합니다.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('파일을 선택해주세요.');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const accessToken = useAuthStore.getState().accessToken;
      const response = await fetch('/api/admin/upload-callsigns', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult({
          success: true,
          message: `업로드 완료: 총 ${result.total}건 중 ${result.inserted}건 신규, ${result.updated}건 업데이트`,
          details: result,
        });
        setSelectedFile(null);
        // 파일 input 리셋
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setUploadResult({
          success: false,
          message: result.error || '업로드 중 오류가 발생했습니다.',
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-16 pb-10">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">대시보드</h1>
          <p className="text-gray-600 mb-8">유사호출부호 항공사 관리 기능이 곧 추가됩니다.</p>

          {/* Excel 업로드 섹션 */}
          <div className="max-w-2xl mx-auto mt-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">유사호출부호 데이터 업로드</h2>
              <p className="text-sm text-gray-600 mb-6">
                Excel 파일(.xlsx, .xls)로 유사호출부호 데이터를 일괄 업로드할 수 있습니다.
              </p>

              {/* 파일 선택 */}
              <div className="mb-6">
                <label
                  htmlFor="file-input"
                  className="block w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors cursor-pointer"
                >
                  <input
                    id="file-input"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="text-center">
                    {selectedFile ? (
                      <>
                        <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-700">파일을 선택하거나 드래그하세요</p>
                        <p className="text-xs text-gray-500 mt-1">.xlsx, .xls 파일</p>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* 업로드 버튼 */}
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? '업로드 중...' : '업로드'}
              </button>

              {/* 업로드 결과 */}
              {uploadResult && (
                <div
                  className={`mt-6 p-4 rounded-lg ${
                    uploadResult.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      uploadResult.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {uploadResult.message}
                  </p>
                  {uploadResult.details?.errors && uploadResult.details.errors.length > 0 && (
                    <div className="mt-3 text-xs text-red-700">
                      <p className="font-semibold mb-1">오류 내역:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {uploadResult.details.errors.map((err: string, idx: number) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {uploadResult.success && (
                    <button
                      onClick={() => router.push('/airline')}
                      className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      → 유사호출부호 목록 보기
                    </button>
                  )}
                </div>
              )}

              {/* 안내사항 */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">📋 Excel 형식 안내</h3>
                <div className="text-xs text-gray-600 space-y-2 text-left">
                  <p>• <strong>국내 항공사</strong> 데이터만 자동으로 필터링됩니다</p>
                  <p>• <strong>편명1 또는 편명2</strong> 중 국내 항공사 코드를 자동 추출합니다</p>
                  <p>• <strong>유사도</strong>와 <strong>오류발생가능성</strong> 정보가 자동 매핑됩니다</p>
                  <p>• 중복된 유사호출부호 쌍은 자동으로 업데이트됩니다</p>
                  <p className="mt-3 pt-3 border-t border-gray-300">
                    <strong>필수 컬럼:</strong> 편명1, 편명2가 필수이며, 나머지는 선택 사항입니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
