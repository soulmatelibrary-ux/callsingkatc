import React from 'react';

export default function LoginMockup() {
    return (
        <div
            className="min-h-screen w-full flex relative overflow-hidden bg-[#0A0F1D]"
            style={{
                backgroundImage: `
          linear-gradient(to right, rgba(10, 15, 29, 0.8) 0%, rgba(10, 15, 29, 0.4) 50%, rgba(10, 15, 29, 0.1) 100%),
          url('https://images.unsplash.com/photo-1540339832862-274291176b6b?q=80&w=2940&auto=format&fit=crop')
        `,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-transparent z-10"></div>

            {/* Subtle Grid Overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none mix-blend-overlay"></div>

            {/* Left Area - Branding & Welcome */}
            <div className="flex-1 flex flex-col justify-center px-16 lg:px-32 z-10 relative">
                <div className="animate-fade-in-up">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center backdrop-blur-md border border-blue-500/30">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white/60 text-sm font-bold tracking-widest uppercase">Republic of Korea</span>
                            <span className="text-white font-black text-xl tracking-tight">KAC Aviation Portal</span>
                        </div>
                    </div>

                    <h1 className="text-6xl lg:text-7xl font-black text-white leading-tight mb-6 tracking-tighter">
                        Elevating <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Air Traffic</span> <br />
                        Safety.
                    </h1>
                    <p className="text-lg text-white/70 max-w-xl leading-relaxed font-medium">
                        Next-generation airspace management and surveillance system.
                        Ensuring precise coordination and unparalleled safety for every flight.
                    </p>
                </div>
            </div>

            {/* Right Area - Login Panel */}
            <div className="w-full lg:w-[540px] flex items-center justify-center relative z-10 p-8">

                {/* Glassmorphism Card */}
                <div className="w-full max-w-[440px] bg-white/10 backdrop-blur-2xl rounded-3xl p-10 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] relative overflow-hidden">

                    {/* Subtle glowing orb behind the form */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/30 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="mb-10 text-center">
                            <h2 className="text-2xl font-black text-white tracking-tight mb-2">유사호출부호 경고시스템</h2>
                            <p className="text-sm font-medium text-white/50 tracking-widest uppercase">Secure Login Portal</p>
                        </div>

                        {/* Type selector */}
                        <div className="flex bg-black/20 p-1.5 rounded-xl border border-white/10 mb-8 backdrop-blur-md">
                            <button className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                항공사
                            </button>
                            <button className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white/50 hover:text-white transition-all flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                관리자
                            </button>
                        </div>

                        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/70 tracking-wider">이메일</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="name@airline.com"
                                        className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/30 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-black/30 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/70 tracking-wider">비밀번호</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/30 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-black/30 transition-all font-mono tracking-widest"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center">
                                    <input id="remember-me" type="checkbox" className="h-4 w-4 bg-black/20 border-white/20 rounded text-blue-600 focus:ring-blue-500/50 cursor-pointer" />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-white/70 cursor-pointer">
                                        아이디 저장
                                    </label>
                                </div>
                                <div className="text-sm">
                                    <a href="#" className="font-bold text-blue-400 hover:text-blue-300 transition-colors">
                                        비밀번호 찾기
                                    </a>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3.5 mt-6 border border-transparent rounded-xl shadow-lg shadow-blue-600/20 text-sm font-black text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0F1D] focus:ring-blue-500 transition-all uppercase tracking-widest"
                            >
                                로그인
                            </button>
                        </form>

                        <div className="mt-8 text-center space-y-2">
                            <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest">
                                한국공항공사 · 국토교통부 항공교통본부
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
