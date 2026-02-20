'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Mockup Header (Keeping consistency with Admin Mockup)
function MockupHeader() {
    return (
        <header
            className="sticky top-0 z-50 flex items-center justify-between px-8 py-5"
            style={{
                background: 'linear-gradient(135deg, #1a2e4a 0%, #2563eb 50%, #3b82f6 100%)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
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
                <div className="flex bg-black/10 p-1 rounded-xl backdrop-blur-sm">
                    <Link href="/admin/mockup" className="px-4 py-2 text-white/70 text-sm font-bold rounded-lg hover:text-white transition-all">대시보드</Link>
                    <Link href="/admin/airlines/mockup" className="px-4 py-2 bg-white/20 text-white text-sm font-extrabold rounded-lg shadow-sm">항공사 관리</Link>
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
        </div>
    );
}

export default function AirlineMockupPage() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [search, setSearch] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const mockAirlines = [
        { id: '1', code: 'KAL', name_ko: '대한항공', name_en: 'Korean Air', order: 1 },
        { id: '2', code: 'AAR', name_ko: '아시아나항공', name_en: 'Asiana Airlines', order: 2 },
        { id: '3', code: 'JJA', name_ko: '제주항공', name_en: 'Jeju Air', order: 3 },
        { id: '4', code: 'JNA', name_ko: '진에어', name_en: 'Jin Air', order: 4 },
        { id: '5', code: 'ABL', name_ko: '에어부산', name_en: 'Air Busan', order: 5 },
        { id: '6', code: 'ESR', name_ko: '이스타항공', name_en: 'Eastar Jet', order: 6 },
        { id: '7', code: 'TWB', name_ko: '티웨이항공', name_en: 'Tway Air', order: 7 },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-primary/10">
            <MockupHeader />

            <main className={`flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-8 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

                {/* 상단 타이틀 섹션 */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-8 h-1 bg-primary rounded-full" />
                            <span className="text-primary font-bold text-sm tracking-widest uppercase">Management</span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">항공사 관리</h1>
                        <p className="mt-2 text-gray-500 font-medium">시스템에 등록된 국내외 항공사 목록 및 노출 순서를 관리합니다.</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="group flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                            <span>항공사 추가</span>
                        </button>
                    </div>
                </div>

                {/* 통계 섹션 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <PremiumStatCard
                        label="전체 항공사"
                        value={mockAirlines.length}
                        color="text-primary"
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                    />
                    <PremiumStatCard
                        label="국내 항공사"
                        value={7}
                        color="text-emerald-600"
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                    <PremiumStatCard
                        label="업데이트 대기"
                        value={0}
                        color="text-amber-600"
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                </div>

                {/* 검색 및 리스트 */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/30">
                        <div className="relative w-full md:w-96">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                            <input
                                type="text"
                                placeholder="항공사 코드 또는 이름 검색..."
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 bg-white border border-gray-200 text-gray-500 rounded-xl text-xs font-black shadow-sm hover:bg-gray-50 uppercase tracking-widest transition-all">Export Excel</button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-white">
                                    <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Order</th>
                                    <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Code</th>
                                    <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Name (KO)</th>
                                    <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Name (EN)</th>
                                    <th className="px-8 py-4 text-right text-[11px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {mockAirlines.map((airline, i) => (
                                    <tr key={i} className="group hover:bg-primary/[0.02] transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col gap-1">
                                                    <button className="text-gray-300 hover:text-primary transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" /></svg></button>
                                                    <button className="text-gray-300 hover:text-primary transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg></button>
                                                </div>
                                                <span className="font-black text-gray-300 group-hover:text-primary transition-colors tracking-tighter text-lg">{airline.order}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg font-mono text-sm font-bold tracking-widest group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                {airline.code}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="font-extrabold text-gray-900 leading-tight">{airline.name_ko}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-sm font-bold text-gray-400 uppercase tracking-tight">{airline.name_en}</div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 안내 서비스 정보 */}
                <div className="p-8 rounded-3xl bg-navy text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M21 16.5c0 .38-.21.71-.53.88l-7.97 4.44c-.31.17-.69.17-1 0l-7.97-4.44c-.32-.17-.53-.5-.53-.88v-9c0-.38.21-.71.53-.88l7.97-4.44c.31-.17.69-.17 1 0l7.97 4.44c.32.17.53.5.53.88v9zM12 4.15L5 8l7 3.85L19 8l-7-3.85z" /></svg>
                    </div>
                    <div className="relative">
                        <p className="text-xs font-black uppercase tracking-widest text-white/50 mb-2">Management Guide</p>
                        <h4 className="text-2xl font-black mb-4 tracking-tight">항공사 데이터 동기화</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                            <p className="text-white/70 text-sm leading-relaxed font-medium">항공사 코드는 ICAO 표준 3자리 코드를 사용합니다. 등록된 코드는 유사호출부호 분석 엔진의 핵심 식별자로 사용되므로 신중히 관리하십시오.</p>
                            <p className="text-white/70 text-sm leading-relaxed font-medium">표시 순서는 사용자 대시보드 및 통계 필터에서 우선순위를 결정합니다. 드래그 앤 드롭 또는 화살표 버튼으로 조정할 수 있습니다.</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Add Form Side-over Mockup */}
            {showAddForm && (
                <div className="fixed inset-0 z-[100] overflow-hidden">
                    <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
                    <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl transition-all duration-300 ease-in-out p-10 flex flex-col">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">새 항공사 등록</h3>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-6 flex-1">
                            <div>
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Airline Code</label>
                                <input
                                    type="text"
                                    placeholder="예: KAL"
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-300"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Korean Name</label>
                                <input
                                    type="text"
                                    placeholder="예: 대한항공"
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-300"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">English Name</label>
                                <input
                                    type="text"
                                    placeholder="예: Korean Air"
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-300"
                                />
                            </div>
                        </div>

                        <div className="mt-auto pt-10 grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="px-6 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl font-black hover:bg-gray-50 transition-all"
                            >
                                취소
                            </button>
                            <button className="px-6 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all">
                                항공사 등록
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="max-w-7xl w-full mx-auto px-6 py-10 border-t border-gray-100 text-center md:text-left">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">© 2026 Korea Airports Corporation. All rights reserved.</p>
            </footer>
        </div>
    );
}
