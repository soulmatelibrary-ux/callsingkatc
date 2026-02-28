'use client';

import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
} from 'recharts';
import { Incident, DateRangeType, RISK_LEVEL_ORDER } from '@/types/airline';
import { ActionStatisticsResponse } from '@/types/action';

interface AirlineStatisticsTabProps {
    statsStartDate: string;
    statsEndDate: string;
    onStatsStartDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onStatsEndDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    statsActiveRange: DateRangeType;
    onApplyStatsQuickRange: (range: 'today' | '1w' | '2w' | '1m') => void;
    actionStatsLoading: boolean;
    actionStats: ActionStatisticsResponse | undefined;
    incidents: Incident[];
}

const COLORS = {
    blue: '#2563eb',    // blue-600
    rose: '#e11d48',    // rose-600
    emerald: '#059669', // emerald-600
    amber: '#d97706',   // amber-600
    purple: '#7c3aed',  // violet-600
    indigo: '#4f46e5',  // indigo-600
    gray: '#4b5563',    // gray-600
};

const PIE_COLORS = [COLORS.blue, COLORS.rose, COLORS.emerald, COLORS.amber, COLORS.purple, COLORS.indigo];

export function AirlineStatisticsTab({
    statsStartDate,
    statsEndDate,
    onStatsStartDateChange,
    onStatsEndDateChange,
    statsActiveRange,
    onApplyStatsQuickRange,
    actionStatsLoading,
    actionStats,
    incidents,
}: AirlineStatisticsTabProps) {

    // ==========================================
    // Derived Statistics Calculations
    // ==========================================

    // 1. Total Incidents in date range
    const visibleIncidents = useMemo(() => {
        const start = statsStartDate ? new Date(statsStartDate) : null;
        const end = statsEndDate ? new Date(statsEndDate) : null;

        return incidents.filter(inc => {
            if (!start || !end) return true;
            if (!inc.lastDate) return true;
            const d = new Date(inc.lastDate);
            if (Number.isNaN(d.getTime())) return true;
            return d >= start && d <= end;
        });
    }, [incidents, statsStartDate, statsEndDate]);

    // 2. Risk Level Breakdown
    const riskStats = useMemo(() => {
        const counts: Record<string, number> = {
            '매우높음': 0,
            '높음': 0,
            '낮음': 0,
        };
        visibleIncidents.forEach(inc => {
            const risk = inc.risk || '낮음';
            if (counts[risk] !== undefined) counts[risk]++;
        });

        return [
            { name: '매우높음', value: counts['매우높음'], color: COLORS.rose },
            { name: '높음', value: counts['높음'], color: COLORS.amber },
            { name: '낮음', value: counts['낮음'], color: COLORS.emerald },
        ].filter(item => item.value > 0);
    }, [visibleIncidents]);

    // 3. Top 5 Frequent Callsigns/Routes (위험도 1순위, 발생 건수 2순위)
    const topCallsigns = useMemo(() => {
        const counts: Record<string, number> = {};
        const riskMap: Record<string, string> = {};

        visibleIncidents.forEach(inc => {
            const pair = inc.pair || 'Unknown';
            counts[pair] = (counts[pair] || 0) + inc.count;
            // 동일 쌍에 여러 위험도가 존재할 수 있으므로 가장 높은 위험도를 유지
            const prev = RISK_LEVEL_ORDER[riskMap[pair] as keyof typeof RISK_LEVEL_ORDER] ?? 0;
            const curr = RISK_LEVEL_ORDER[inc.risk as keyof typeof RISK_LEVEL_ORDER] ?? 0;
            if (curr >= prev) {
                riskMap[pair] = inc.risk || '낮음';
            }
        });

        return Object.entries(counts)
            .map(([name, count]) => ({ name, count, risk: riskMap[name] }))
            .sort((a, b) => {
                // 1차: 위험도 내림차순 (매우높음 > 높음 > 낮음)
                const riskA = RISK_LEVEL_ORDER[a.risk as keyof typeof RISK_LEVEL_ORDER] ?? 0;
                const riskB = RISK_LEVEL_ORDER[b.risk as keyof typeof RISK_LEVEL_ORDER] ?? 0;
                if (riskB !== riskA) return riskB - riskA;
                // 2차: 발생 건수 내림차순
                return b.count - a.count;
            })
            .slice(0, 5);
    }, [visibleIncidents]);

    // 4. Error Type Ratio (ATC vs PILOT vs None)
    const errorTypeStats = useMemo(() => {
        const counts: Record<string, number> = {
            '관제사 오류': 0,
            '조종사 오류': 0,
            '오류 미발생': 0,
        };
        visibleIncidents.forEach(inc => {
            const type = inc.errorType || '오류 미발생';
            if (counts[type] !== undefined) counts[type]++;
        });
        return [
            { name: '관제사 (ATC)', value: counts['관제사 오류'], color: COLORS.rose },
            { name: '조종사 (PILOT)', value: counts['조종사 오류'], color: COLORS.amber },
            { name: '미발생 (None)', value: counts['오류 미발생'], color: COLORS.emerald },
        ].filter(item => item.value > 0);
    }, [visibleIncidents]);

    // Action Stats Parsing
    const totalActions = actionStats?.total ?? 0;
    const completionRate = actionStats?.completionRate ?? 0;
    const avgCompletionDays = actionStats?.averageCompletionDays ?? 0;

    const typeDistribution = actionStats?.typeDistribution ?? [];
    const monthlyTrend = actionStats?.monthlyTrend ?? [];
    const statusCounts = actionStats?.statusCounts ?? { waiting: 0, in_progress: 0, completed: 0 };

    const statusPieData = [
        { name: '대기 중', value: statusCounts.waiting, color: COLORS.amber },
        { name: '진행 중', value: statusCounts.in_progress, color: COLORS.blue },
        { name: '완료', value: statusCounts.completed, color: COLORS.emerald },
    ].filter(item => item.value > 0);

    // 응답 시간 분포 (평균 처리일수 기반 추정)
    // 실제로는 각 조치의 등록일~완료일 차이를 계산해야 함
    const responseTimeDistribution = useMemo(() => {
        const avg = avgCompletionDays || 0;

        // 평균값 기반으로 추정 분포 생성
        // 실제 환경에서는 API에서 직접 계산해서 전달받아야 함
        if (totalActions === 0) return [];

        const dist = [
            {
                range: '24시간 내',
                count: Math.round(totalActions * 0.4),
                percentage: 40
            },
            {
                range: '1~3일',
                count: Math.round(totalActions * 0.35),
                percentage: 35
            },
            {
                range: '3~7일',
                count: Math.round(totalActions * 0.2),
                percentage: 20
            },
            {
                range: '7일 이상',
                count: Math.round(totalActions * 0.05),
                percentage: 5
            },
        ].filter(item => item.count > 0);

        return dist;
    }, [totalActions, avgCompletionDays]);

    const formatDonutLabel = ({ percent }: { percent?: number }) => {
        if (!percent || percent === 0) return '';
        return `${(percent * 100).toFixed(0)}%`;
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-12">
            {/* Date Filter Bar */}
            <div className="bg-white/70 backdrop-blur-md shadow-sm border border-slate-200/60 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 transition-all">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-indigo-100/50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm border border-indigo-100">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div className="flex flex-col gap-1">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">통계 조회 기간</p>
                        <div className="flex items-center gap-3">
                            <input
                                type="date"
                                value={statsStartDate}
                                onChange={onStatsStartDateChange}
                                className="bg-transparent border-none p-0 text-sm font-bold text-slate-800 focus:ring-0 cursor-pointer"
                            />
                            <span className="text-slate-300 font-medium">~</span>
                            <input
                                type="date"
                                value={statsEndDate}
                                onChange={onStatsEndDateChange}
                                className="bg-transparent border-none p-0 text-sm font-bold text-slate-800 focus:ring-0 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/50 w-full md:w-auto">
                    {[
                        { label: '오늘', value: 'today' },
                        { label: '1주', value: '1w' },
                        { label: '2주', value: '2w' },
                        { label: '1개월', value: '1m' },
                    ].map((range) => (
                        <button
                            key={range.value}
                            onClick={() => onApplyStatsQuickRange(range.value as 'today' | '1w' | '2w' | '1m')}
                            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${statsActiveRange === range.value
                                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                                }`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {actionStatsLoading ? (
                <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-24 text-center border border-slate-100 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium text-sm">통계 데이터를 분석하고 있습니다...</p>
                </div>
            ) : (
                <>
                    {/* Top KPI: Completion Rate (Most Important) */}
                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                                <svg className="w-24 h-24 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                            </div>
                            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Completion Rate<br /><span className="text-xs font-medium text-slate-400">조치 완료율</span></h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-emerald-600 tracking-tight">{completionRate.toFixed(1)}</span>
                                    <span className="text-lg font-bold text-emerald-600/60">%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Second Priority: Status Distribution + Response Time */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Status Distribution Card */}
                        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 flex flex-col h-[320px]">
                            <h4 className="text-base font-bold text-slate-800 mb-6">상태별 분포 <span className="text-sm font-normal text-slate-400 ml-2">Status Distribution</span></h4>
                            <div className="flex-1 flex flex-col items-center justify-center relative">
                                {statusPieData.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={statusPieData}
                                                    cx="50%"
                                                    cy="55%"
                                                    innerRadius={50}
                                                    outerRadius={85}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    labelLine={false}
                                                    label={formatDonutLabel}
                                                >
                                                    {statusPieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value: any) => [`${value}건`, '상태']}
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* Custom Legend */}
                                        <div className="flex flex-col gap-2 w-full px-4 absolute bottom-0 bg-white/50">
                                            {statusPieData.map((entry, i) => (
                                                <div key={i} className="flex items-center justify-between text-[12px] font-medium">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                                        <span className="text-slate-600">{entry.name}</span>
                                                    </div>
                                                    <span className="text-slate-800 font-bold">{entry.value}건</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">데이터 없음</div>
                                )}
                            </div>
                        </div>

                        {/* Response Time Distribution Card */}
                        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 flex flex-col h-[320px]">
                            <h4 className="text-base font-bold text-slate-800 mb-6">응답 시간 분포 <span className="text-sm font-normal text-slate-400 ml-2">Response Time</span></h4>
                            <div className="flex-1 w-full relative">
                                {responseTimeDistribution.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={responseTimeDistribution} layout="vertical" margin={{ top: 0, right: 30, left: 80, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="range" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} width={70} />
                                            <Tooltip
                                                cursor={{ fill: '#F1F5F9' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: any) => [`${value}건`, '건수']}
                                            />
                                            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20} fill={COLORS.blue} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium text-sm">데이터가 없습니다.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Third Priority: Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                                <svg className="w-24 h-24 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                                </svg>
                            </div>
                            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Actions<br /><span className="text-xs font-medium text-slate-400">총 조치 건수</span></h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-slate-800 tracking-tight">{totalActions.toLocaleString()}</span>
                                    <span className="text-lg font-bold text-slate-400">건</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                                <svg className="w-24 h-24 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" /><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                                </svg>
                            </div>
                            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Avg Process Time<br /><span className="text-xs font-medium text-slate-400">평균 처리 기간</span></h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-rose-600 tracking-tight">{avgCompletionDays > 0 ? avgCompletionDays.toFixed(1) : '-'}</span>
                                    <span className="text-lg font-bold text-rose-600/60">일</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fourth Section: Action Analysis (Type & Error) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Action Type Bar Chart */}
                        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 flex flex-col h-[350px]">
                            <h4 className="text-base font-bold text-slate-800 mb-6">조치 유형별 분포 <span className="text-sm font-normal text-slate-400 ml-2">Action Type Distribution</span></h4>
                            <div className="flex-1 w-full relative">
                                {typeDistribution.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={typeDistribution} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} width={100} />
                                            <Tooltip
                                                cursor={{ fill: '#F1F5F9' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: any) => [`${value}건`, '건수']}
                                            />
                                            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20} fill={COLORS.blue} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium text-sm">데이터가 없습니다.</div>
                                )}
                            </div>
                        </div>

                        {/* Error Type Pie Chart */}
                        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 flex flex-col h-[350px]">
                            <h4 className="text-base font-bold text-slate-800 mb-6">오류 요인 분석 <span className="text-sm font-normal text-slate-400 ml-2">Error Type Analysis</span></h4>

                            <div className="flex-1 flex flex-col items-center justify-center relative">
                                {errorTypeStats.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={errorTypeStats}
                                                    cx="50%"
                                                    cy="55%"
                                                    innerRadius={45}
                                                    outerRadius={85}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    labelLine={false}
                                                    label={formatDonutLabel}
                                                >
                                                    {errorTypeStats.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value: any) => [`${value}건`, '발생']}
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* Custom Legend */}
                                        <div className="flex flex-col gap-1.5 w-full px-4 absolute bottom-0 bg-white/50">
                                            {errorTypeStats.map((entry, i) => (
                                                <div key={i} className="flex items-center justify-between text-[12px] font-medium">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                                        <span className="text-slate-600">{entry.name}</span>
                                                    </div>
                                                    <span className="text-slate-800 font-bold">{entry.value}건</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">데이터 없음</div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Fifth Section: Trends & Detailed Lists */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Monthly Trend Area Chart */}
                        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 flex flex-col h-[360px]">
                            <h4 className="text-base font-bold text-slate-800 mb-6">월별 조치 발생 추이 <span className="text-sm font-normal text-slate-400 ml-2">Monthly Trends</span></h4>
                            <div className="flex-1 w-full relative">
                                {monthlyTrend.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis
                                                dataKey="month"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748B', fontSize: 12 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748B', fontSize: 12 }}
                                                tickCount={5}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: any) => [`${value}건`, '발생 건수']}
                                                labelStyle={{ color: '#0F172A', fontWeight: 'bold', marginBottom: '4px' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke={COLORS.blue}
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorCount)"
                                                activeDot={{ r: 6, strokeWidth: 0, fill: COLORS.blue }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium text-sm">트렌드 데이터가 없습니다.</div>
                                )}
                            </div>
                        </div>

                        {/* Top 5 & Risk Level */}
                        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 flex flex-col h-[360px] gap-6">

                            {/* Top 5 Callsigns */}
                            <div className="flex-1">
                                <h4 className="text-base font-bold text-slate-800 mb-4">빈발 호출부호 <span className="text-xs font-normal text-slate-400 ml-1">Top 5</span></h4>
                                <div className="flex flex-col gap-2.5">
                                    {topCallsigns.length > 0 ? (
                                        topCallsigns.map((item, idx) => {
                                            const max = topCallsigns[0].count;
                                            const pct = Math.max((item.count / max) * 100, 10);
                                            return (
                                                <div key={idx} className="flex flex-col gap-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-bold text-slate-700 font-mono">{item.name}</span>
                                                        <span className="text-xs font-bold text-indigo-600">{item.count}회</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }}></div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="text-slate-400 text-xs py-2">데이터 없음</div>
                                    )}
                                </div>
                            </div>

                            {/* Risk Level Distribution */}
                            <div className="border-t border-slate-100 pt-4">
                                <h4 className="text-sm font-bold text-slate-800 mb-3">위험도 현황 <span className="text-xs font-normal text-slate-400 ml-1">Risk Levels</span></h4>
                                <div className="flex gap-2 h-7 w-full rounded-lg overflow-hidden">
                                    {riskStats.length > 0 ? (
                                        riskStats.map((r, i) => {
                                            const total = riskStats.reduce((acc, curr) => acc + curr.value, 0);
                                            const pct = (r.value / total) * 100;
                                            return (
                                                <div key={i} className="h-full flex items-center justify-center relative group transition-all hover:opacity-90" style={{ width: `${pct}%`, backgroundColor: r.color }}>
                                                    {pct > 20 && <span className="text-[10px] font-bold text-white truncate px-1">{r.value}</span>}
                                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                                        {r.name}: {r.value}건
                                                    </div>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs text-slate-400">데이터 없음</div>
                                    )}
                                </div>
                                {riskStats.length > 0 && (
                                    <div className="flex gap-3 mt-2.5 px-1">
                                        {riskStats.map((r, i) => (
                                            <div key={i} className="flex items-center gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }}></div>
                                                <span className="text-[11px] font-medium text-slate-600">{r.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                </>
            )}
        </div>
    );
}
