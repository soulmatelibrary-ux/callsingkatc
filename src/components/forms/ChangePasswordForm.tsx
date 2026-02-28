/**
 * ChangePasswordForm 컴포넌트
 * - 현재 비밀번호 확인 후 새 비밀번호 변경
 * - 로그인된 사용자 전용
 * - forced=true: 강제 변경 모드 (초기 로그인 또는 관리자 초기화)
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PasswordStrength } from '@/components/ui/PasswordStrength';
import { AUTH_ERRORS, PASSWORD_REGEX, PASSWORD_RULE } from '@/lib/constants';
import { changePasswordAPI } from '@/lib/api/auth';
import { useAuthStore } from '@/store/authStore';

const schema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
    newPassword: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다.')
      .regex(PASSWORD_REGEX, PASSWORD_RULE),
    newPasswordConfirm: z.string().min(1, '비밀번호 확인을 입력해주세요.'),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: '새 비밀번호가 일치하지 않습니다.',
    path: ['newPasswordConfirm'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: '현재 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.',
    path: ['newPassword'],
  });

type FormValues = z.infer<typeof schema>;

interface ChangePasswordFormProps {
  forced?: boolean; // 강제 변경 모드 여부
}

export function ChangePasswordForm({ forced = false }: ChangePasswordFormProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [watchedNewPassword, setWatchedNewPassword] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const newPasswordProps = register('newPassword');

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await changePasswordAPI(values);
      setIsSuccess(true);
      reset();
      setWatchedNewPassword('');

      // 📌 Zustand 상태 업데이트: passwordChangeRequired 플래그 해제
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setUser({
          ...currentUser,
          is_default_password: false,
          password_change_required: false,
        });
      }

      // 📌 강제 변경 모드: 성공 메시지 표시 (버튼 클릭 시 이동)
    } catch (err: any) {
      // changePasswordAPI throws { error: string }, not axios-style error
      const errorMessage = err?.error || err?.message || AUTH_ERRORS.UNKNOWN_ERROR;
      setServerError(errorMessage);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {isSuccess && (
        <div className="space-y-3">
          <div
            role="status"
            className="px-3 py-2.5 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700"
          >
            ✅ 비밀번호가 성공적으로 변경되었습니다.
          </div>
          {forced && (
            <Button
              type="button"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={isRedirecting}
              disabled={isRedirecting}
              onClick={() => {
                setIsRedirecting(true);
                const targetUrl = user?.role === 'admin' ? '/admin' : '/airline';
                router.push(targetUrl);
              }}
            >
              {isRedirecting ? '이동 중...' : '확인'}
            </Button>
          )}
        </div>
      )}

      {/* 강제 변경 모드에서는 다른 페이지 이동 방지 */}
      {!isSuccess && (
        <>
          <Input
            id="currentPassword"
            type="password"
            label="현재 비밀번호"
            placeholder="현재 비밀번호 입력"
            autoComplete="current-password"
            required
            error={errors.currentPassword?.message}
            disabled={isRedirecting}
            {...register('currentPassword')}
          />

          <div>
            <Input
              id="newPassword"
              type="password"
              label="새 비밀번호"
              placeholder="8자 이상, 대문자 + 숫자 포함"
              autoComplete="new-password"
              required
              error={errors.newPassword?.message}
              hint={!errors.newPassword ? PASSWORD_RULE : undefined}
              disabled={isRedirecting}
              {...newPasswordProps}
              onChange={(e) => {
                setWatchedNewPassword(e.target.value);
                newPasswordProps.onChange(e);
              }}
            />
            <PasswordStrength password={watchedNewPassword} />
          </div>

          <Input
            id="newPasswordConfirm"
            type="password"
            label="새 비밀번호 확인"
            placeholder="새 비밀번호 재입력"
            autoComplete="new-password"
            required
            error={errors.newPasswordConfirm?.message}
            disabled={isRedirecting}
            {...register('newPasswordConfirm')}
          />

          {serverError && (
            <div role="alert" className="px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            isLoading={isSubmitting || isRedirecting}
            disabled={isRedirecting}
          >
            비밀번호 변경
          </Button>

          {/* 강제 변경 모드에서는 로그아웃 버튼만 제공 */}
          {forced && (
            <div className="pt-2 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                size="lg"
                onClick={async () => {
                  setIsRedirecting(true);
                  await logout();
                  router.push('/login');
                }}
                disabled={isRedirecting}
              >
                로그아웃
              </Button>
              <p className="text-xs text-gray-500 text-center mt-2">
                비밀번호 변경 전까지 다른 페이지에 접근할 수 없습니다.
              </p>
            </div>
          )}
        </>
      )}
    </form>
  );
}
