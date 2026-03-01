# Security Architect Memory - KATC1

## Project Overview
- KATC1: Aviation similar callsign warning system
- Stack: Next.js 14, React 18, TypeScript, Zustand, better-sqlite3, bcryptjs, JWT
- Self-hosted backend: SQLite + JWT generation in API routes
- Level: Dynamic (fullstack)

## Security Score History
- 2026-02-19: 57/100 (Conditional Pass)
- 2026-02-22: 68/100 (Conditional Pass, improved)
- 2026-03-01: reset-data endpoint 98/100 (PASS) - userId bug fixed, audit logging working

## Resolved Issues (since 2026-02-19)
1. httpOnly cookie - FIXED: Server-side Set-Cookie in login/refresh routes
2. Security headers - FIXED: 7 headers in next.config.js (HSTS, CSP, X-Frame-Options, etc.)
3. middleware.ts - FIXED: Server-side route protection with JWT format validation
4. AuthState user:any - FIXED: proper User type
5. AuthState refreshToken field - FIXED: removed (cookie-only)

## Current Critical/High Issues (2026-03-01, updated)
1. **CRITICAL: .env.development tracked by Git** - Contains DB_PASSWORD & JWT_SECRET in plaintext, .gitignore only covers .env*.local
2. ~~CRITICAL: Debug APIs exposed~~ **RESOLVED** - Debug API files deleted
3. ~~CRITICAL: reset-data userId extraction bug~~ **RESOLVED** - Fixed to payload?.userId with null check
4. **HIGH: user cookie not httpOnly** - role info accessible to JS, middleware trusts client-manipulable cookie
5. **HIGH: PATCH /api/actions/[id] missing role check** - any authenticated user can modify actions
6. **HIGH: GET logout** - enables CSRF-based forced logout
7. **HIGH: Signup API open** - creates active accounts without auth
8. **HIGH: No rate limiting** - brute-force vulnerable
9. ~~HIGH: Security event logging blocked~~ **RESOLVED** - audit_logs INSERT now works (userId bug fixed)

## Good Security Patterns Confirmed
- Parameterized queries (? placeholders for SQLite) throughout ALL SQL (no injection risk)
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
- Backend: SQLite (better-sqlite3) with multi-DB abstraction layer (src/lib/db/index.ts)
- JWT created locally via jsonwebtoken library (not external service)
- JWT AccessToken payload fields: userId, email, role, status, airlineId (NOT sub/id)
- bcryptjs for password hashing (salt rounds: 10)
- Math.random() used for temp password generation (should use crypto)
- Transaction: BEGIN/COMMIT/ROLLBACK in sqlite.ts, callback pattern
