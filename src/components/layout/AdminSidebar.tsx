'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NanoIcon } from '@/components/ui/NanoIcon';
import {
    Users,
    Plane,
    Megaphone,
    LockKeyhole
} from 'lucide-react';

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
        } else if (pathname.startsWith('/admin/announcements')) {
            setActiveMenu('announcements');
        }
    }, [pathname, searchParams]);

    const menuItems = [
        { id: 'users', label: '사용자 관리', href: '/admin/users?tab=users', icon: Users, color: 'info' },
        { id: 'airlines', label: '항공사 관리', href: '/admin/users?tab=airlines', icon: Plane, color: 'purple' },
        { id: 'announcements', label: '공지사항 관리', href: '/admin/announcements', icon: Megaphone, color: 'orange' },
        { id: 'password', label: '비밀번호 초기화', href: '/admin/users?tab=password', icon: LockKeyhole, color: 'danger' },
    ];

    return (
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col pt-0 shrink-0 h-full overflow-y-auto">
            <div className="px-6 py-4 mb-0">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">
                    Admin Terminal
                </h2>
            </div>
            <nav className="flex-1 px-4 space-y-2">
                {menuItems.map((item) => {
                    const isActive = activeMenu === item.id;
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`w-full group flex items-center gap-4 px-4 py-4 rounded-none text-sm font-bold tracking-tight transition-all text-left border-l-4 ${isActive
                                ? 'bg-navy text-white shadow-[0_10px_20px_rgba(30,58,95,0.2)] border-primary'
                                : 'text-gray-500 hover:bg-gray-50 border-transparent hover:border-gray-200'
                                }`}
                        >
                            <NanoIcon
                                icon={item.icon as any}
                                color={item.color as any}
                                size="sm"
                                isActive={isActive}
                            />
                            <span className={`transition-all duration-300 ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}>
                                {item.label}
                            </span>
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
