'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function AdminSidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [activeMenu, setActiveMenu] = useState('dashboard');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (pathname === '/admin') {
            setActiveMenu('dashboard');
        } else if (pathname.startsWith('/admin/users')) {
            if (tab === 'airlines') {
                setActiveMenu('airlines');
            } else if (tab === 'password') {
                setActiveMenu('password');
            } else {
                setActiveMenu('users');
            }
        }
    }, [pathname, searchParams]);

    const menuItems = [
        { id: 'dashboard', label: '대시보드', href: '/admin', icon: '📊' },
        { id: 'users', label: '사용자 관리', href: '/admin/users?tab=users', icon: '👥' },
        { id: 'airlines', label: '항공사 관리', href: '/admin/users?tab=airlines', icon: '✈️' },
        { id: 'password', label: '비밀번호 초기화', href: '/admin/users?tab=password', icon: '🔒' },
    ];

    return (
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col pt-0 shrink-0 h-[calc(100vh-64px)] overflow-y-auto">
            <div className="px-6 mb-6">
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">
                    Admin Menu
                </h2>
            </div>
            <nav className="flex-1 px-4 space-y-1">
                {menuItems.map((item) => {
                    const isActive = activeMenu === item.id;
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-none text-sm font-bold tracking-tight transition-all text-left border-l-4 ${isActive
                                    ? 'bg-navy text-white shadow-md border-primary'
                                    : 'text-gray-600 hover:bg-gray-50 border-transparent hover:border-gray-300'
                                }`}
                        >
                            <span className="text-lg opacity-90">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 mt-auto border-t border-gray-100">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-none text-xs text-gray-500 font-medium">
                    이 페이지는 시스템 관리자 전용 메뉴입니다. 권한 부여 및 시스템 모니터링 시 각별히 주의하시기 바랍니다.
                </div>
            </div>
        </aside>
    );
}
