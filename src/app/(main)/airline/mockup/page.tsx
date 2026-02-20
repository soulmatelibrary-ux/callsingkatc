'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Mockup Header
function MockupHeader({ airlineName }: { airlineName: string }) {
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
                    <Link href="/airline/mockup" className="px-4 py-2 bg-white/20 text-white text-sm font-extrabold rounded-lg shadow-sm">항공사 대시보드</Link>
                    <Link href="#" className="px-4 py-2 text-white/70 text-sm font-bold rounded-lg hover:text-white transition-all">조치 이력</Link>
                </div>
                <div className="flex items-center gap-3 ml-4 border-l border-white/10 pl-4 text-white">
                    <div className="flex flex-col text-right">
                        <span className="text-xs font-black uppercase tracking-widest text-white/50">User</span>
                        <span className="text-sm font-bold">{airlineName}</span>
                    </div>
                    <button className="p-2.5 text-white/90 bg-red-500/20 hover:bg-red-500/40 border border-red-500/20 rounded-xl transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                </div>
            </nav>
        </header>
    );
}

function StatCard({ label, value, color, description, trend }: any) {
    return (
        <div className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-[0.03] group-hover:opacity-[0.07] transition-opacity ${color.replace('text-', 'bg-')}`} />

            <div className="relative flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                    {trend && (
                        <span className={`text-[10px] font-black px-2 py-1 rounded-md ${trend > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {trend > 0 ? '+' : ''}{trend}%
                        </span>
                    )}
                </div>

                <div className="flex items-baseline gap-1">
                    <p className={`text-5xl font-black ${color} tracking-tighter`}>{value}</p>
                    <span className="text-sm font-bold text-gray-400">건</span>
                </div>

                <p className="mt-auto pt-4 text-[12px] font-bold text-gray-400 leading-tight">
                    {description}
                </p>
            </div>
        </div>
    );
}

export default function AirlineDashboardMockup() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState('incidents');

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const mockIncidents = [
        { pair: 'KAL2134 | KAL2155', type: '관제사 오류', risk: '매우높음', similarity: '98%', count: 12, last: '2026. 02. 20' },
        { pair: 'KAL038 | KAL078', type: '조종사 오류', risk: '높음', similarity: '92%', count: 8, last: '2026. 02. 19' },
        { pair: 'KAL1270 | KAL1278', type: '오류 미발생', risk: '낮음', similarity: '35%', count: 3, last: '2026. 02. 18' },
        { pair: 'KAL1406 | KAL706', type: '관제사 오류', risk: '높음', similarity: '88%', count: 5, last: '2026. 02. 17' },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-primary/10">
            <MockupHeader airlineName="대한항공" />

            <main className={`flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-8 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

                {/* 상단 타이틀 섹션 */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-8 h-1 bg-primary rounded-full" />
                            <span className="text-primary font-bold text-sm tracking-widest uppercase">Airline Statistics</span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">유사호출부호 경고현황</h1>
                        <p className="mt-2 text-gray-500 font-medium">대한항공(KAL)의 실시간 유사호출부호 분석 및 리스크 현황입니다.</p>
                    </div>

                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-1.5 shadow-sm border border-gray-100 flex gap-1">
                        <button
                            onClick={() => setActiveTab('incidents')}
                            className={`px-6 py-3 rounded-xl text-sm font-black tracking-tight transition-all ${activeTab === 'incidents' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                        >
                            📊 현황 대시보드
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-6 py-3 rounded-xl text-sm font-black tracking-tight transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                        >
                            📋 상세 이력
                        </button>
                    </div>
                </div>

                {/* 필터 섹션 */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-lg">📅</span>
                            <span className="text-sm font-bold text-gray-900">2026. 02. 01. ~ 2026. 02. 20.</span>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-[11px] font-black text-gray-500 hover:border-primary hover:text-primary transition-all uppercase tracking-widest shadow-sm">Today</button>
                            <button className="px-5 py-2.5 bg-primary text-white rounded-xl text-[11px] font-black border border-primary transition-all uppercase tracking-widest shadow-md shadow-primary/20">1 Month</button>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold shadow-sm hover:bg-gray-50 transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            <span>보고서 다운로드</span>
                        </button>
                    </div>
                </div>

                {/* 요약 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard
                        label="Total Cases"
                        value={totalStats.total}
                        color="text-gray-900"
                        description="분석 기간 내 전체 발생 건수"
                        trend={+12}
                    />
                    <StatCard
                        label="ATC Related"
                        value={totalStats.atc}
                        color="text-rose-600"
                        description="관제사 요인으로 판명된 사례"
                        trend={-4}
                    />
                    <StatCard
                        label="Pilot Related"
                        value={totalStats.pilot}
                        color="text-amber-600"
                        description="조종사 요인으로 판명된 사례"
                        trend={+2}
                    />
                    <StatCard
                        label="No Error"
                        value={totalStats.none}
                        color="text-emerald-600"
                        description="오류 없이 경고만 발생한 사례"
                        trend={+15}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 주요 발생 테이블 */}
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">유사호출부호 발생현황</h3>
                                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Top risk callsign pairs</p>
                            </div>
                            <button className="text-primary font-bold text-sm hover:underline">상세 필터</button>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-white">
                                        <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Callsign Pair</th>
                                        <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Error Type</th>
                                        <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Risk</th>
                                        <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Sim. %</th>
                                        <th className="px-8 py-4 text-right text-[11px] font-black text-gray-400 uppercase tracking-widest">Last Occ.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {mockIncidents.map((incident, i) => (
                                        <tr key={i} className="group hover:bg-primary/[0.02] transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-extrabold text-gray-900 tracking-tight">{incident.pair}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Sector 7 / FL290</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`text-[12px] font-bold ${incident.type === '관제사 오류' ? 'text-rose-600' : incident.type === '조종사 오류' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    {incident.type}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${incident.risk === '매우높음' ? 'bg-rose-500 text-white' :
                                                        incident.risk === '높음' ? 'bg-amber-400 text-white' : 'bg-emerald-400 text-white'
                                                    }`}>
                                                    {incident.risk}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-gray-700">{incident.similarity}</span>
                                                    <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${parseInt(incident.similarity) > 90 ? 'bg-rose-500' : parseInt(incident.similarity) > 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                                            style={{ width: incident.similarity }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right font-bold text-gray-400 text-sm">
                                                {incident.last}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex justify-center">
                            <button className="text-xs font-black text-gray-400 hover:text-primary transition-all uppercase tracking-widest flex items-center gap-2">
                                <span>Load More Data</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* 서브 오류 분포 사이드바 */}
                    <div className="space-y-6 flex flex-col h-full">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex-1">
                            <div className="flex items-center gap-2 mb-8">
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">세부 오류 분석</h3>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { label: '복창오류', count: 18, color: 'bg-blue-500', total: 45 },
                                    { label: '무응답/재호출', count: 12, color: 'bg-indigo-500', total: 45 },
                                    { label: '고도이탈', count: 7, color: 'bg-emerald-500', total: 45 },
                                    { label: '비행경로이탈', count: 5, color: 'bg-orange-500', total: 45 },
                                    { label: '기타', count: 3, color: 'bg-gray-400', total: 45 },
                                ].map((stat, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm font-black text-gray-700 tracking-tight">{stat.label}</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-black text-gray-900 leading-none">{stat.count}</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Cases</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                            <div
                                                className={`${stat.color} h-full transition-all duration-1000 ease-out delay-${i * 100}`}
                                                style={{ width: `${(stat.count / stat.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12 p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Analysis Insight</p>
                                <p className="text-[13px] font-bold text-gray-600 leading-relaxed">
                                    최근 30일간 <span className="text-primary">복창오류</span>가 전체의 40%를 차지하며 가장 빈번하게 발생하고 있습니다. 조종사 교육 프로그램 보완이 검토됩니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 안내 서비스 정보 */}
                <div className="p-10 rounded-[2.5rem] bg-navy text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500">
                        <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                    </div>
                    <div className="relative z-10">
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 mb-3">System Information</p>
                        <h4 className="text-3xl font-black mb-6 tracking-tight">유사호출부호 분석 엔진 v2.5</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                            <div>
                                <p className="text-white/70 text-base leading-relaxed font-bold mb-4">본 시스템은 전 세계 항공 통신 데이터를 기반으로 AI 알고리즘을 통해 호출부호의 발음 유사도 및 혼동 가능성을 실시간으로 판별합니다.</p>
                                <div className="flex items-center gap-4">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-navy bg-white/20 flex items-center justify-center text-[10px] font-bold">K</div>)}
                                    </div>
                                    <span className="text-xs font-bold text-white/50 underline decoration-white/20 underline-offset-4">Safety Managers using this system</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span className="text-sm font-extrabold text-white/90 tracking-tight">Real-time Data Processing Active</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span className="text-sm font-extrabold text-white/90 tracking-tight">Machine Learning Model: CallsignSync-H3</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-sky-400" />
                                    <span className="text-sm font-extrabold text-white/90 tracking-tight">Last Engine Update: 2026. 02. 15</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="max-w-7xl w-full mx-auto px-6 py-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">© 2026 Korea Airports Corporation. All rights reserved.</p>
                <div className="flex gap-8">
                    <Link href="#" className="text-xs font-extrabold text-gray-400 hover:text-primary transition-colors tracking-widest uppercase">Privacy</Link>
                    <Link href="#" className="text-xs font-extrabold text-gray-400 hover:text-primary transition-colors tracking-widest uppercase">Terms</Link>
                    <Link href="#" className="text-xs font-extrabold text-gray-400 hover:text-primary transition-colors tracking-widest uppercase">Support</Link>
                </div>
            </footer>
        </div>
    );
}

const totalStats = {
    total: 45,
    atc: 12,
    pilot: 10,
    none: 23
};
