/**
 * SignupForm 컴포넌트
 * - 이메일 + 비밀번호 + 비밀번호 확인 + 항공사 선택
 * - PasswordStrength로 강도 실시간 표시
 * - 가입 성공 시 pending 페이지로 이동
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PasswordStrength } from '@/components/ui/PasswordStrength';
import { useAuthStore } from '@/store/authStore';
import { AIRLINES, AUTH_ERRORS, PASSWORD_REGEX, PASSWORD_RULE, ROUTES } from '@/lib/constants';

const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, '이메일을 입력해주세요.')
      .email(AUTH_ERRORS.INVALID_EMAIL),
    airlineCode: z.string().min(1, '항공사를 선택해주세요.'),
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다.')
      .regex(PASSWORD_REGEX, PASSWORD_RULE),
    passwordConfirm: z.string().min(1, '비밀번호 확인을 입력해주세요.'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);
  const [watchedPassword, setWatchedPassword] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  // password onChange를 커스텀 핸들러로 intercept
  const passwordProps = register('password');

  async function onSubmit(values: SignupFormValues) {
    setServerError(null);
    try {
      // 로컬 PostgreSQL API 호출
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          airlineCode: values.airlineCode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setServerError(error.error || AUTH_ERRORS.UNKNOWN_ERROR);
        return;
      }

      const result = await response.json();

      // Zustand에 저장
      setAuth(result.user, result.accessToken);

      router.push(ROUTES.PENDING);
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;
      if (code === 'EMAIL_ALREADY_EXISTS' || code === 'CONFLICT') {
        setServerError('이미 사용 중인 이메일입니다.');
      } else {
        setServerError(AUTH_ERRORS.UNKNOWN_ERROR);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Input
        id="email"
        type="email"
        label="이메일"
        placeholder="user@example.com"
        autoComplete="email"
        required
        error={errors.email?.message}
        {...register('email')}
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="airlineCode"
          className="text-sm font-semibold text-gray-700"
        >
          항공사
          <span className="ml-1 text-red-500" aria-hidden="true">*</span>
        </label>
        <select
          id="airlineCode"
          aria-invalid={Boolean(errors.airlineCode)}
          aria-describedby={errors.airlineCode ? 'airlineCode-error' : undefined}
          className={[
            'w-full px-3 py-2.5 text-sm rounded-lg border transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
            'bg-white',
            errors.airlineCode
              ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:border-primary focus:ring-primary/20',
          ].join(' ')}
          {...register('airlineCode')}
        >
          <option value="">항공사를 선택하세요</option>
          {AIRLINES.map((airline) => (
            <option key={airline.code} value={airline.code}>
              {airline.name_ko} ({airline.code})
            </option>
          ))}
        </select>
        {errors.airlineCode && (
          <p
            id="airlineCode-error"
            role="alert"
            className="text-xs text-red-600 font-medium"
          >
            {errors.airlineCode.message}
          </p>
        )}
      </div>

      <div>
        <Input
          id="password"
          type="password"
          label="비밀번호"
          placeholder="8자 이상, 대문자 + 숫자 포함"
          autoComplete="new-password"
          required
          error={errors.password?.message}
          hint={!errors.password ? PASSWORD_RULE : undefined}
          {...passwordProps}
          onChange={(e) => {
            setWatchedPassword(e.target.value);
            passwordProps.onChange(e);
          }}
        />
        <PasswordStrength password={watchedPassword} />
      </div>

      <Input
        id="passwordConfirm"
        type="password"
        label="비밀번호 확인"
        placeholder="비밀번호 재입력"
        autoComplete="new-password"
        required
        error={errors.passwordConfirm?.message}
        {...register('passwordConfirm')}
      />

      {serverError && (
        <div
          role="alert"
          className="px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
        >
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
        회원가입
      </Button>

      <p className="text-center text-sm text-gray-600">
        이미 계정이 있으신가요?{' '}
        <Link
          href={ROUTES.LOGIN}
          className="text-primary hover:text-primary-dark hover:underline font-medium"
        >
          로그인
        </Link>
      </p>
    </form>
  );
}
