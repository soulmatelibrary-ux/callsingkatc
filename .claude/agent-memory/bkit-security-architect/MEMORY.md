# Security Architect Memory - KATC1

## Project Overview
- KATC1: Aviation similar callsign warning system (항공사 유사호출부호 경고시스템)
- Stack: Next.js 14, React 18, TypeScript, Zustand, Axios, Zod, TailwindCSS
- Backend: bkend.ai (managed JWT, bcrypt, DB)
- Level: Dynamic (from .pdca-status.json)

## Critical Security Findings (2026-02-19)
1. **httpOnly cookie NOT actually applied** - `document.cookie` cannot set httpOnly flag. refreshToken is exposed to JS. Must use server-side Set-Cookie header.
2. **No security headers in next.config.js** - HSTS, X-Frame-Options, X-Content-Type-Options all missing.
3. **middleware.ts not implemented** - Server-side route protection does not exist yet.

## Good Security Patterns Already in Place
- Enumeration attack defense: same error message for invalid email/password
- Password policy: 8+ chars, uppercase, number (PASSWORD_REGEX)
- Token rotation on refresh
- No innerHTML/dangerouslySetInnerHTML/eval usage
- Zustand memory-only for accessToken (not localStorage)
- Environment variable distinction (NEXT_PUBLIC_* prefix)

## Key File Paths
- `/Users/sein/Desktop/katc1/src/lib/api/client.ts` - API client with token interceptor
- `/Users/sein/Desktop/katc1/src/lib/constants.ts` - Auth config, cookie options, routes
- `/Users/sein/Desktop/katc1/src/types/auth.ts` - AuthState has `user: any` (needs fix)
- `/Users/sein/Desktop/katc1/src/types/user.ts` - User/LoginResponse types
- `/Users/sein/Desktop/katc1/next.config.js` - Needs security headers
- `/Users/sein/Desktop/katc1/docs/02-design/security-spec.md` - Full security review

## Security Score: 57/100 (Conditional Pass)
- Must fix: httpOnly cookie, security headers, middleware.ts before deployment
