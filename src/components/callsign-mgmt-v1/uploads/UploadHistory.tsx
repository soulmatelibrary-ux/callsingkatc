interface UploadHistoryItem {
  fileName: string;
  uploadedAt: string;
  totalRows: number;
  successCount: number;
  failedCount: number;
}

interface UploadHistoryProps {
  history: UploadHistoryItem[];
}

export function UploadHistory({ history }: UploadHistoryProps) {
  return (
    <div className="bg-white rounded-none shadow-sm border border-gray-100 p-8">
      <h3 className="text-lg font-black text-gray-900 mb-4">📋 업로드 이력</h3>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {history.map((item, idx) => (
          <div
            key={idx}
            className="p-4 bg-gray-50 rounded-none border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer group"
          >
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="font-bold text-sm text-gray-900 group-hover:text-primary">
                  {item.fileName}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(item.uploadedAt).toLocaleString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <span
                className={`text-[10px] font-black px-2.5 py-1 rounded-none border ${item.failedCount === 0
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : 'bg-red-50 text-red-600 border-red-100'
                  }`}
              >
                {item.totalRows}건
              </span>
            </div>
            <div className="mt-2 flex gap-2 text-[10px] font-bold text-gray-500">
              <span className="text-emerald-600">성공: {item.successCount}</span>
              {item.failedCount > 0 && (
                <span className="text-red-600">실패: {item.failedCount}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {history.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-6">업로드 이력이 없습니다</p>
      )}
    </div>
  );
}
