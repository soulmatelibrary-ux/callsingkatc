/**
 * CreateUserModal 컴포넌트 (관리자용)
 * - 기본 비밀번호로 사용자 생성
 * - 이메일 + 항공사 선택
 */

'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { AIRLINES } from '@/lib/constants';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_PASSWORD = 'TempPass123!';

export function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
  const [email, setEmail] = useState('');
  const [airlineCode, setAirlineCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // 유효성 검사
    if (!email || !airlineCode) {
      setError('이메일과 항공사를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          password: DEFAULT_PASSWORD,
          airlineCode,
          role: 'user',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '사용자 생성 실패');
      }

      setSuccess(true);
      setEmail('');
      setAirlineCode('');

      // 사용자 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ['users'] });

      // 3초 후 모달 닫기
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '사용자 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">사용자 추가</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* 본문 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success && (
            <div className="px-3 py-2.5 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
              ✅ 사용자가 생성되었습니다!
              <div className="text-xs mt-1 text-green-600">
                임시 비밀번호: {DEFAULT_PASSWORD}
              </div>
            </div>
          )}

          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <Input
              id="email"
              type="email"
              label="이메일"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="airlineCode" className="text-sm font-semibold text-gray-700">
              항공사 <span className="text-red-500">*</span>
            </label>
            <select
              id="airlineCode"
              value={airlineCode}
              onChange={(e) => setAirlineCode(e.target.value)}
              disabled={isLoading}
              className={[
                'px-3 py-2.5 text-sm rounded-lg border transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
                'bg-white',
                'border-gray-300 focus:border-primary focus:ring-primary/20',
              ].join(' ')}
              required
            >
              <option value="">항공사를 선택하세요</option>
              {AIRLINES.map((airline) => (
                <option key={airline.code} value={airline.code}>
                  {airline.name_ko} ({airline.code})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-700">
            <p className="font-semibold">임시 비밀번호: <code>{DEFAULT_PASSWORD}</code></p>
            <p className="mt-1">사용자가 첫 로그인 시 비밀번호를 변경해야 합니다.</p>
          </div>
        </form>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-2 justify-end">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={isLoading || success}
          >
            {success ? '완료' : '생성'}
          </Button>
        </div>
      </div>
    </div>
  );
}
