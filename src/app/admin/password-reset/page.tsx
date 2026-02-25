import AdminUsersPageClient from '../users/client';

/**
 * /admin/password-reset 라우트는 사용자 관리 탭 UI를 재사용한다.
 */
export default function AdminPasswordResetPage() {
  return <AdminUsersPageClient initialTab="password" />;
}

