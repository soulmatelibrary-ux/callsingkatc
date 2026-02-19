import { ChangePasswordForm } from '@/components/forms/ChangePasswordForm';

export const metadata = {
  title: '비밀번호 변경 | KATC 유사호출부호 경고시스템',
};

export default function ChangePasswordPage() {
  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">비밀번호 변경</h1>
        <p className="mt-1 text-sm text-gray-500">
          현재 비밀번호를 확인 후 새 비밀번호로 변경합니다.
        </p>
      </div>
      <ChangePasswordForm />
    </>
  );
}
