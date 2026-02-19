/**
 * 관리자 - 사용자 관리 페이지
 * - 관리자 역할 전용
 * - UserApprovalTable 컴포넌트 렌더링
 */

import { Header } from '@/components/layout/Header';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { UserApprovalTable } from '@/components/admin/UserApprovalTable';

export const metadata = {
  title: '사용자 관리 | KATC 관리자',
};

export default function AdminUsersPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            회원 가입 신청을 승인하거나 계정 상태를 관리합니다.
          </p>
        </div>

        <Card>
          <CardHeader
            title="사용자 목록"
            description="가입 신청 검토 및 계정 상태 변경"
          />
          <CardBody>
            <UserApprovalTable />
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
