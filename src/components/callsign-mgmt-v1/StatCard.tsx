interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

export function StatCard({ label, value, color }: StatCardProps) {
  // 색상 맵핑 (Tailwind 클래스 직접 추출 대신 정확한 배경 조합을 위해)
  const getBgColor = (c: string) => {
    if (c.includes('red')) return 'bg-red-500';
    if (c.includes('amber')) return 'bg-amber-500';
    if (c.includes('emerald')) return 'bg-emerald-500';
    return 'bg-blue-500';
  };

  return (
    <div className="group relative bg-white rounded-none p-8 shadow-sm hover:shadow-2xl transition-all border border-gray-100 overflow-hidden">
      {/* 프리미엄 액센트 바 */}
      <div className={`absolute top-0 left-0 w-1.5 h-full ${getBgColor(color)} opacity-80`} />

      <div
        className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${getBgColor(color)}`}
      />

      <div className="relative">
        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <p className={`text-5xl font-black ${color} tracking-tighter`}>
            {value.toLocaleString()}
          </p>
          <span className="text-xs font-bold text-gray-300 uppercase">Points</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-300 tracking-widest uppercase text-left">Real-time Data</span>
        <div className={`w-2 h-2 rounded-full ${getBgColor(color)} animate-pulse opacity-40`} />
      </div>
    </div>
  );
}
