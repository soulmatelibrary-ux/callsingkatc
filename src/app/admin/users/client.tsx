"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { UserApprovalTable } from "@/components/admin/UserApprovalTable";
import { AirlinesAdminSection } from "@/components/admin/AirlinesAdminSection";
import { PasswordResetSection } from "@/components/admin/PasswordResetSection";

type AdminTab = "users" | "airlines" | "password";

interface AdminUsersPageClientProps {
  initialTab?: string;
}

export default function AdminUsersPageClient({ initialTab }: AdminUsersPageClientProps) {
  const tabParam = initialTab;
  const defaultTab: AdminTab =
    tabParam === "airlines" || tabParam === "password" ? (tabParam as AdminTab) : "users";

  const [activeTab, setActiveTab] = useState<AdminTab>(defaultTab);

  useEffect(() => {
    // 초기 탭 설정
    if (tabParam === "airlines" || tabParam === "password") {
      setActiveTab(tabParam as AdminTab);
    }
  }, [tabParam]);

  return (
    <main className="flex-1 w-full px-4 sm:px-6 py-10 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">관리자 페이지</h1>
          <p className="mt-1 text-sm text-gray-500">
            사용자, 항공사, 비밀번호를 한 곳에서 관리합니다.
          </p>
        </div>
      </div>

      {activeTab === "users" && (
        <Card>
          <CardHeader
            title="사용자 목록"
            description="가입 신청 검토 및 계정 상태 변경"
          />
          <CardBody>
            <UserApprovalTable />
          </CardBody>
        </Card>
      )}

      {activeTab === "airlines" && <AirlinesAdminSection />}

      {activeTab === "password" && <PasswordResetSection />}
    </main>
  );
}
