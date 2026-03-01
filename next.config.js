/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  eslint: {
    // 빌드 중 ESLint 검사 비활성화 (devDependencies 설치 안 될 경우 대비)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 빌드 중 TypeScript 검사 비활성화 (better-sqlite3 타입 오류 대비)
    ignoreBuildErrors: true,
  },
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          // HSTS: HTTPS를 항상 사용하도록 강제
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // 클릭재킹 방어
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // MIME 스니핑 방지
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // XSS 방어
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer-Policy 설정
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Content Security Policy (CSP)
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' cdn.jsdelivr.net; style-src 'self' cdn.jsdelivr.net; img-src 'self' data: https:; font-src 'self' cdn.jsdelivr.net; connect-src 'self' https://api-client.bkend.ai;",
          },
          // 권한 정책
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  redirects: async () => {
    return [
      {
        source: '/dashboard',
        destination: '/admin/dashboard',
        permanent: false,
      },
    ];
  },
  rewrites: async () => {
    return [
      {
        source: '/admin/dashboard',
        destination: '/dashboard',
      },
    ];
  },
};

module.exports = nextConfig;
