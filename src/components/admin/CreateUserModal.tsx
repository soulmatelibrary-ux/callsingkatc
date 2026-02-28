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
import { useAirlines } from '@/hooks/useAirlines';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*]{8,}$/;

export function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [airlineCode, setAirlineCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);
  const { data: airlines = [], isLoading: airlinesLoading } = useAirlines();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // 유효성 검사
    if (!email || !password || !passwordConfirm || !airlineCode) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setError('비밀번호: 8자 이상, 대문자·소문자·숫자·특수문자 모두 포함 필요');
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
          password,
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
      setPassword('');
      setPasswordConfirm('');
      setAirlineCode('');

      // 사용자 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

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
                사용자는 첫 로그인 시 비밀번호를 반드시 변경해야 합니다.
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

          <div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                초기 비밀번호 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  label=""
                  placeholder="8자 이상, 대문자+소문자+숫자+특수문자"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  {showPassword ? '숨기기' : '보이기'}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              8자 이상, 대문자·소문자·숫자·특수문자(!@#$%^&*) 모두 포함
            </p>
          </div>

          <div>
            <Input
              id="passwordConfirm"
              type={showPassword ? 'text' : 'password'}
              label="비밀번호 확인"
              placeholder="초기 비밀번호 재입력"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
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
              disabled={isLoading || airlinesLoading}
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
              {airlines.map((airline) => (
                <option key={airline.code} value={airline.code}>
                  {airline.name_ko} ({airline.code})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-700">
            <p className="font-semibold">📋 안내</p>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>첫 로그인 시 비밀번호를 반드시 변경해야 합니다.</li>
              <li>변경 전까지 다른 페이지 접근이 제한됩니다.</li>
            </ul>
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
