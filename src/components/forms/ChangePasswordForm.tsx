/**
 * ChangePasswordForm 컴포넌트
 * - 현재 비밀번호 확인 후 새 비밀번호 변경
 * - 로그인된 사용자 전용
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PasswordStrength } from '@/components/ui/PasswordStrength';
import { AUTH_ERRORS, PASSWORD_REGEX, PASSWORD_RULE } from '@/lib/constants';
import { changePasswordAPI } from '@/lib/api/auth';

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

export function ChangePasswordForm() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [watchedNewPassword, setWatchedNewPassword] = useState('');

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
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;
      if (code === 'INVALID_PASSWORD') {
        setServerError('현재 비밀번호가 올바르지 않습니다.');
      } else {
        setServerError(AUTH_ERRORS.UNKNOWN_ERROR);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {isSuccess && (
        <div
          role="status"
          className="px-3 py-2.5 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700"
        >
          비밀번호가 성공적으로 변경되었습니다.
        </div>
      )}

      <Input
        id="currentPassword"
        type="password"
        label="현재 비밀번호"
        placeholder="현재 비밀번호 입력"
        autoComplete="current-password"
        required
        error={errors.currentPassword?.message}
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
        isLoading={isSubmitting}
      >
        비밀번호 변경
      </Button>
    </form>
  );
}
