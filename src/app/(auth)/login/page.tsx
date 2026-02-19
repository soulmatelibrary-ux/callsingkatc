import { LoginForm } from '@/components/forms/LoginForm';

export const metadata = {
  title: '로그인 | KATC 유사호출부호 경고시스템',
};

export default function LoginPage() {
  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">로그인</h1>
        <p className="mt-1 text-sm text-gray-500">계정으로 로그인하세요</p>
      </div>
      <LoginForm />
    </>
  );
}
