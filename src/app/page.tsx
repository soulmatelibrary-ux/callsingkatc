export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-navy to-blue-900">
      <header className="top-bar fixed top-0 left-0 right-0 h-16 bg-navy shadow-md flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-3">
          <div className="text-white font-bold text-xl">KATC</div>
          <h1 className="text-white text-sm">유사호출부호 경고시스템</h1>
        </div>
        <a href="/login" className="px-4 py-2 bg-sky text-white rounded-lg hover:bg-cyan-600 transition">
          로그인
        </a>
      </header>

      <div className="pt-32 flex flex-col items-center justify-center">
        <div className="text-center mb-12">
          <div className="mb-8">
            <svg className="w-32 h-32 mx-auto text-white opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19.5L3.5 14m0 0L9 8.5M3.5 14h15a2 2 0 012 2v2a2 2 0 01-2 2h-15a2 2 0 01-2-2v-2a2 2 0 012-2z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">항공교통관제</h2>
          <p className="text-xl text-gray-200">항공사 유사호출부호 감시 및 경고 시스템</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl px-6">
          <a href="/airline.html" className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6 text-white hover:bg-white/20 transition-colors cursor-pointer block">
            <svg className="w-8 h-8 mb-3 text-sky" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-semibold mb-2">항공사 유사호출부호 페이지</h3>
            <p className="text-sm text-gray-300">항공사의 유사호출부호 실시간 감시 및 모니터링</p>
          </a>

          <a href="/admin" className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6 text-white hover:bg-white/20 transition-colors cursor-pointer block">
            <svg className="w-8 h-8 mb-3 text-sky" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="font-semibold mb-2">항공교통본부 유사호출부호 관리 페이지</h3>
            <p className="text-sm text-gray-300">항공교통본부의 즉시 알림 및 관리 시스템</p>
          </a>

          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6 text-white">
            <svg className="w-8 h-8 mb-3 text-sky" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-semibold mb-2">안전 관리</h3>
            <p className="text-sm text-gray-300">항공 안전 강화를 위한 신뢰할 수 있는 시스템</p>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-300">
          <p className="text-sm">로그인하여 시스템에 접근하세요</p>
        </div>
      </div>
    </main>
  )
}
