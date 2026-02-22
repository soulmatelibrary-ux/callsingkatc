import { redirect } from 'next/navigation';

/**
 * /admin 페이지 - 유사호출부호 관리로 자동 리다이렉트
 */
export const dynamic = 'force-dynamic';

export default function AdminPage() {
  redirect('/admin/callsign-management');
}
