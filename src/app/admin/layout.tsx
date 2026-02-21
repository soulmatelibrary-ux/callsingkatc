import { Header } from '@/components/layout/Header';
import { AdminSidebar } from '@/components/layout/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <div className="flex flex-1 pt-16 h-screen overflow-hidden">
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
