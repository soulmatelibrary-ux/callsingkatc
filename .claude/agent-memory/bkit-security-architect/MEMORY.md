# Security Architect Memory - KATC1

## Project Overview
- KATC1: Aviation similar callsign warning system
- Stack: Next.js 14, React 18, TypeScript, Zustand, pg (PostgreSQL), bcryptjs, JWT
- Self-hosted backend (not BaaS): direct PostgreSQL + JWT generation in API routes
- Level: Dynamic (fullstack)

## Security Score History
- 2026-02-19: 57/100 (Conditional Pass)
- 2026-02-22: 68/100 (Conditional Pass, improved)

## Resolved Issues (since 2026-02-19)
1. httpOnly cookie - FIXED: Server-side Set-Cookie in login/refresh routes
2. Security headers - FIXED: 7 headers in next.config.js (HSTS, CSP, X-Frame-Options, etc.)
3. middleware.ts - FIXED: Server-side route protection with JWT format validation
4. AuthState user:any - FIXED: proper User type
5. AuthState refreshToken field - FIXED: removed (cookie-only)

## Current Critical/High Issues (2026-02-22)
1. **CRITICAL: .env.development tracked by Git** - Contains DB_PASSWORD & JWT_SECRET in plaintext, .gitignore only covers .env*.local
2. **CRITICAL: Debug APIs exposed** - /api/debug/callsigns & /api/airlines/test-callsigns have NO auth, stack trace in error response
3. **HIGH: user cookie not httpOnly** - role info accessible to JS, middleware trusts client-manipulable cookie
4. **HIGH: PATCH /api/actions/[id] missing role check** - any authenticated user can modify actions
5. **HIGH: GET logout** - enables CSRF-based forced logout
6. **HIGH: Signup API open** - creates active accounts without auth
7. **HIGH: No rate limiting** - brute-force vulnerable
8. **HIGH: No security event logging** - no audit trail

## Good Security Patterns Confirmed
- Parameterized queries ($1, $2) throughout ALL SQL (no injection risk)
- No innerHTML/dangerouslySetInnerHTML/eval
- Enumeration defense: same error for invalid email/password
- PASSWORD_REGEX: 8+ chars, upper, lower, digit, special
- Token rotation on refresh
- accessToken: Zustand memory only
- refreshToken: httpOnly + Secure + SameSite=lax cookie
- Concurrent refresh prevention (refreshingPromise singleton)
- Admin role verification on all /api/admin/* endpoints
- Transaction wrapping for multi-step DB operations

## Key File Paths
- `/Users/sein/Desktop/katc1/src/middleware.ts` - Route protection
- `/Users/sein/Desktop/katc1/src/lib/jwt.ts` - JWT generation/verification
- `/Users/sein/Desktop/katc1/src/lib/db.ts` - PostgreSQL pool + parameterized query
- `/Users/sein/Desktop/katc1/src/lib/api/client.ts` - API client with 401 interceptor
- `/Users/sein/Desktop/katc1/src/store/authStore.ts` - Auth state (memory-only tokens)
- `/Users/sein/Desktop/katc1/next.config.js` - Security headers configured
- `/Users/sein/Desktop/katc1/docs/02-design/security-spec.md` - Full security review v2
- `/Users/sein/Desktop/katc1/.env.development` - DANGER: credentials in plaintext

## Architecture Notes
- Backend is NOT bkend.ai BaaS anymore - it's self-hosted PostgreSQL with pg driver
- JWT created locally via jsonwebtoken library (not external service)
- bcryptjs for password hashing (salt rounds: 10)
- Math.random() used for temp password generation (should use crypto)
