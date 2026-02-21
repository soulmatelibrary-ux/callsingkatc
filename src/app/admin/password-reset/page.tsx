/**
 * 관리자 비밀번호 초기화 페이지
 * GET /admin/password-reset
 *
 * 기능:
 * 1. 이메일로 사용자 검색
 * 2. 선택한 사용자의 비밀번호를 임시 비밀번호로 초기화
 * 3. 생성된 임시 비밀번호를 화면에 표시 (관리자가 사용자에게 전달)
 */
"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { PasswordResetSection } from "@/components/admin/PasswordResetSection";

export default function AdminPasswordResetPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pb-10 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-gray-900 hover:underline"
          >
            대시보드
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-2xl font-bold text-gray-900">비밀번호 초기화</h1>
        </div>

        <PasswordResetSection />
      </main>
    </div>
  );
}

