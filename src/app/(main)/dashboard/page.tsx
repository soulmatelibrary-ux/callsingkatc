'use client';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-900 mb-4">
          대시보드
        </h1>
        <p className="text-lg text-blue-700 mb-8">
          KATC 유사호출부호 경고시스템에 오신 것을 환영합니다!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-blue-900 mb-3">📊 시스템 상태</h2>
            <p className="text-gray-700">정상 작동 중</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-blue-900 mb-3">🔔 알림</h2>
            <p className="text-gray-700">새로운 알림 없음</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-blue-900 mb-3">✈️ 항공사</h2>
            <p className="text-gray-700">11개 항공사 모니터링 중</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-blue-900 mb-3">🛡️ 보안</h2>
            <p className="text-gray-700">모든 시스템 안전</p>
          </div>
        </div>

        <div className="mt-8 bg-blue-600 text-white rounded-lg p-6">
          <h3 className="text-xl font-bold mb-2">로그아웃</h3>
          <a href="/api/auth/logout" className="inline-block bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded">
            로그아웃하기
          </a>
        </div>
      </div>
    </div>
  );
}
