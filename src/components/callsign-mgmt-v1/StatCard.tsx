interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

export function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="group relative bg-white rounded-none p-6 shadow-sm hover:shadow-xl transition-all border border-gray-100 overflow-hidden">
      <div
        className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${color
          .replace('text-', 'bg-')
          .replace('-900', '-500')
          .replace('-700', '-500')
          .replace('-600', '-500')}`}
      />

      <div className="relative">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className={`text-4xl font-black ${color} tracking-tighter`}>
          {value.toLocaleString()}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-1">
        <span className="text-[10px] font-bold text-gray-400">Total</span>
        <div className="h-[1px] flex-1 bg-gray-100" />
      </div>
    </div>
  );
}
