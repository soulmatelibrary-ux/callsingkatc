'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/lib/constants';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = useAuthStore((s) => s.user);
    const router = useRouter();

    // 관리자가 아니면 홈으로 리다이렉트
    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.replace(ROUTES.HOME);
        }
    }, [user, router]);

    // 관리자가 아니면 아무것도 렌더링하지 않음
    if (!user || user.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* 사이드바는 스크롤 없이 고정 */}
                <AdminSidebar />

                {/* 메인 콘텐츠 영역은 자체 스크롤 */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
