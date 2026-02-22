'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// 로컬용 모킹 헤더 (디자인 개선 시연용)
function MockupHeader() {
    return (
        <header
            className="sticky top-0 z-50 flex items-center justify-between px-8 py-5" // py-3 -> py-5 (높이 증가)
            style={{
                background: 'linear-gradient(135deg, #1a2e4a 0%, #2563eb 50%, #3b82f6 100%)', // 더 풍부한 그라데이션
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)', // 더 깊은 그림자
            }}
        >
            <div className="flex items-center gap-3">
                <span className="text-white p-2 bg-white/10 rounded-lg shadow-inner">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </span>
                <div className="flex flex-col">
                    <span className="text-white font-extrabold text-lg leading-tight tracking-tight">KATC</span>
                    <span className="text-white/80 text-xs font-medium uppercase tracking-widest">Aviation Warning System</span>
                </div>
            </div>

            <nav className="flex items-center gap-4">
                <span className="hidden md:inline-block text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/5">
                    lsi117@airport.co.kr
                </span>
                <div className="flex bg-black/10 p-1 rounded-xl backdrop-blur-sm">
                    <Link href="#" className="px-4 py-2 text-white/70 text-sm font-bold rounded-lg hover:text-white transition-all">대시보드</Link>
                    <Link href="#" className="px-4 py-2 bg-white/20 text-white text-sm font-extrabold rounded-lg shadow-sm">관리자 페이지</Link>
                </div>
                <button className="px-4 py-2 text-white/90 text-sm font-bold rounded-xl bg-red-500/20 hover:bg-red-500/40 border border-red-500/20 transition-all">
                    로그아웃
                </button>
            </nav>
        </header>
    );
}

function PremiumStatCard({ label, value, color, icon }: any) {
    return (
        <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            {/* 백그라운드 장식 스포트라이트 */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${color.replace('text-', 'bg-')}`} />

            <div className="relative flex justify-between items-start">
                <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className={`text-4xl font-black ${color} tracking-tighter`}>{value.toLocaleString()}</p>
                </div>
                <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('-700', '-50').replace('-900', '-50')} transition-colors`}>
                    {icon}
                </div>
            </div>

            <div className="mt-4 flex items-center gap-1">
                <span className="text-[10px] font-bold text-gray-400">Total System Users</span>
                <div className="h-[1px] flex-1 bg-gray-100" />
            </div>
        </div>
    );
}

export default function AdminMockupPage() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-primary/10">
            <MockupHeader />

            <main className={`flex-1 w-full px-6 py-10 space-y-8 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

                {/* 상단 타이틀 섹션 */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-8 h-1 bg-primary rounded-full" />
                            <span className="text-primary font-bold text-sm tracking-widest uppercase">System Management</span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">관리자 대시보드</h1>
                        <p className="mt-2 text-gray-500 font-medium">KATC 유사호출부호 경고시스템의 통합 관리 및 현황 데이터</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button className="group flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all">
                            <span>사용자 관리</span>
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3.5 bg-white text-gray-700 border border-gray-200 rounded-2xl font-bold shadow-sm hover:bg-gray-50 transition-all">
                            항공사 관리
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3.5 bg-white text-gray-700 border border-gray-200 rounded-2xl font-bold shadow-sm hover:bg-gray-50 transition-all text-sm">
                            비밀번호 초기화
                        </button>
                    </div>
                </div>

                {/* 통계 섹션 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <PremiumStatCard
                        label="전체 사용자"
                        value={1324}
                        color="text-gray-900"
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                    />
                    <PremiumStatCard
                        label="활성 사용자"
                        value={1280}
                        color="text-emerald-600"
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                    <PremiumStatCard
                        label="정지 사용자"
                        value={44}
                        color="text-rose-600"
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 최근 로그인 테이블 */}
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">최근 로그인 현황</h3>
                                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Real-time user access logs</p>
                            </div>
                            <button className="text-primary font-bold text-sm hover:underline">전체 보기</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-white">
                                        <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">User Detail</th>
                                        <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Privilege</th>
                                        <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Last Access</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {[
                                        { email: 'admin@airport.co.kr', status: 'active', role: '관리자', time: '오전 11:06' },
                                        { email: 'star11@naver.com', status: 'active', role: '사용자', time: '오전 10:59' },
                                        { email: 'kac_dev@gmail.com', status: 'active', role: '사용자', time: '오전 10:42' },
                                        { email: 'sky_watcher@korea.kr', status: 'suspended', role: '사용자', time: '오전 09:15' },
                                        { email: 'ops01@airport.co.kr', status: 'active', role: '관리자', time: '어제 17:30' },
                                    ].map((user, i) => (
                                        <tr key={i} className="group hover:bg-primary/[0.02] transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        {user.email[0].toUpperCase()}
                                                    </div>
                                                    <span className="font-bold text-gray-700">{user.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${user.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                                                    }`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-sm font-bold text-gray-600">{user.role}</span>
                                            </td>
                                            <td className="px-8 py-5 text-gray-400 font-medium text-sm">
                                                {user.time}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 시스템 상태 사이드바 */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">시스템 상태</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex flex-col gap-2 p-5 rounded-2xl bg-gray-50/50 border border-gray-100 group hover:border-emerald-200 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-gray-800">Database Engine</span>
                                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase">Normal</span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full w-[94%]" />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 p-5 rounded-2xl bg-gray-50/50 border border-gray-100 group hover:border-emerald-200 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-gray-800">API Server (v2.1)</span>
                                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase">Online</span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full w-[99%]" />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 p-5 rounded-2xl bg-gray-50/50 border border-gray-100 group hover:border-sky-200 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-gray-800">Real-time Warning Service</span>
                                        <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-2 py-1 rounded-md uppercase">Active</span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-sky-500 h-full w-[88%]" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-6 rounded-2xl bg-navy text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                                </div>
                                <p className="text-xs font-black uppercase tracking-widest text-white/50 mb-1">Notice</p>
                                <h4 className="font-bold text-sm mb-2">정기 점검 안내</h4>
                                <p className="text-xs text-white/70 leading-relaxed">내일 새벽 02:00 ~ 04:00 사이에 데이터베이스 최적화 작업이 예정되어 있습니다.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="w-full px-6 py-10 border-t border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">© 2026 Korea Airports Corporation. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="#" className="text-xs font-bold text-gray-400 hover:text-primary transition-colors uppercase tracking-widest">Privacy Policy</Link>
                        <Link href="#" className="text-xs font-bold text-gray-400 hover:text-primary transition-colors uppercase tracking-widest">Terms of Service</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
