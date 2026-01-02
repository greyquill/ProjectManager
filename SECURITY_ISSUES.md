# Security Issues - To Fix

This document tracks security issues that need to be addressed in the Project Manager application.

## Issue 1: Hardcoded Login Code

**Severity:** Medium
**Status:** Pending
**Priority:** High

### Description
The login code `2341` is hardcoded in multiple locations in the source code, making it visible to anyone who has access to the repository.

### Affected Files

1. **`src/app/api/auth/verify/route.ts`** (Line 3)
   ```typescript
   const VALID_CODE = '2341' // In production, this would be in an environment variable
   ```

2. **`src/app/projects/[projectName]/page.tsx`** (Lines 1998, 2063)
   ```typescript
   if (deleteLoginCode !== '2341') {
     setDeleteError('Nope!')
     return
   }

   if (epicIdLoginCode !== '2341') {
     setEpicIdError('Nope!')
     return
   }
   ```

3. **`src/app/docs/page.tsx`** (Line 558)
   - Documentation mentions the hardcoded code

### Impact
- Login code is visible in source code
- Cannot change code without code deployment
- Security through obscurity (not a real security measure)

### Solution

1. **Add environment variable:**
   - Add `LOGIN_CODE=2341` to `.env.local`
   - Add `LOGIN_CODE=2341` to `env.example`
   - Update `.env.local` with actual production code (different from default)

2. **Update `src/app/api/auth/verify/route.ts`:**
   ```typescript
   const VALID_CODE = process.env.LOGIN_CODE || '2341'
   ```

3. **Remove client-side hardcoded checks:**
   - Remove hardcoded `'2341'` checks from `page.tsx`
   - Rely on server-side validation only (see Issue 2)

4. **Update documentation:**
   - Remove hardcoded code from `src/app/docs/page.tsx`

### Implementation Notes
- Default fallback to `'2341'` for backward compatibility during migration
- Ensure production `.env.local` has a strong, unique code
- Consider using a secrets manager for production deployments

---

## Issue 2: Delete Operations - Client-Side Only Validation

**Severity:** High
**Status:** Pending
**Priority:** Critical

### Description
Delete operations (stories and epics) only validate the login code on the client-side. The server-side API routes do not check authentication, allowing anyone to call the DELETE endpoints directly.

### Affected Files

1. **`src/app/projects/[projectName]/page.tsx`** (Lines 1997-2052)
   - Client-side validation: `if (deleteLoginCode !== '2341')`
   - Makes DELETE API calls without sending authentication

2. **`src/app/api/projects/[projectName]/epics/[epicName]/stories/[storyId]/route.ts`** (DELETE handler)
   - No authentication check
   - No authorization check

3. **`src/app/api/projects/[projectName]/epics/[epicName]/route.ts`** (DELETE handler)
   - No authentication check
   - No authorization check

4. **`src/app/api/projects/[projectName]/epics/[epicName]/update-epic-id/route.ts`** (PUT handler)
   - No authentication check
   - No authorization check

### Impact
- **Critical:** Anyone can delete stories/epics by calling the API directly
- **Critical:** Anyone can update epic IDs by calling the API directly
- Client-side validation can be bypassed with browser DevTools
- No protection against automated attacks

### Solution

1. **Create authentication helper:**
   - Create `src/lib/auth-helper.ts`:
   ```typescript
   import { NextRequest, NextResponse } from 'next/server'

   export function requireAuth(request: NextRequest): NextResponse | null {
     const authCookie = request.cookies.get('pm-auth')

     if (!authCookie || authCookie.value !== 'authenticated') {
       return NextResponse.json(
         { success: false, error: 'Authentication required' },
         { status: 401 }
       )
     }

     return null
   }
   ```

2. **Add authentication to DELETE routes:**
   - `src/app/api/projects/[projectName]/epics/[epicName]/stories/[storyId]/route.ts`
   - `src/app/api/projects/[projectName]/epics/[epicName]/route.ts`

   ```typescript
   export async function DELETE(request: NextRequest, ...) {
     // Require authentication
     const { requireAuth } = await import('@/lib/auth-helper')
     const authError = requireAuth(request)
     if (authError) {
       return authError
     }

     // ... rest of handler
   }
   ```

3. **Add authentication to update-epic-id route:**
   - `src/app/api/projects/[projectName]/epics/[epicName]/update-epic-id/route.ts`

   ```typescript
   export async function PUT(request: NextRequest, ...) {
     // Require authentication
     const { requireAuth } = await import('@/lib/auth-helper')
     const authError = requireAuth(request)
     if (authError) {
       return authError
     }

     // ... rest of handler
   }
   ```

4. **Update frontend:**
   - Remove client-side hardcoded code checks
   - Keep UX flow (show modal, collect code) but rely on server validation
   - Handle 401 errors gracefully

### Implementation Notes
- Use the existing `pm-auth` cookie for authentication
- Middleware already protects routes, but API routes need explicit checks
- Consider adding audit logging for destructive operations

---

## Issue 3: No Rate Limiting

**Severity:** Medium
**Status:** Pending
**Priority:** Medium

### Description
The login endpoint (`/api/auth/verify`) has no rate limiting, making it vulnerable to brute force attacks. An attacker could attempt thousands of login codes per second.

### Affected Files

1. **`src/app/api/auth/verify/route.ts`**
   - No rate limiting implementation
   - No tracking of failed attempts

### Impact
- Vulnerable to brute force attacks
- Attacker can try all possible 4-digit codes quickly
- No protection against automated attacks
- Could lead to account compromise if code is weak

### Solution

1. **Create rate limiter utility:**
   - Create `src/lib/rate-limiter.ts` with in-memory rate limiting
   - Track attempts per IP address
   - Configurable window and max attempts

2. **Implement rate limiting in auth route:**
   ```typescript
   import { isRateLimited, getClientIp, getRemainingAttempts, getResetTime } from '@/lib/rate-limiter'

   export async function POST(request: NextRequest) {
     const clientIp = getClientIp(request)

     // Check rate limiting
     if (isRateLimited(clientIp)) {
       const resetTime = getResetTime(clientIp)
       return NextResponse.json(
         {
           success: false,
           error: 'Too many login attempts. Please try again later.',
           resetTime: resetTime ? new Date(resetTime).toISOString() : null,
         },
         { status: 429 }
       )
     }

     // ... rest of handler
   }
   ```

3. **Rate limiting configuration:**
   - **Window:** 15 minutes
   - **Max attempts:** 5 per window
   - **Reset:** Automatic after window expires

### Implementation Notes
- **In-memory solution:** Works for single-instance deployments
- **Production consideration:** For multi-instance deployments, use Redis-based rate limiting
- **IP detection:** Handle proxies, load balancers (X-Forwarded-For, X-Real-IP)
- **User feedback:** Return remaining attempts and reset time in error responses

### Future Enhancements
- Use Redis for distributed rate limiting (if deploying multiple instances)
- Add CAPTCHA after N failed attempts
- Implement exponential backoff
- Add monitoring/alerting for suspicious activity

---

## Testing Checklist

After implementing fixes, test the following:

### Issue 1: Environment Variable
- [ ] Login works with `LOGIN_CODE` env variable
- [ ] Falls back to default if env variable not set
- [ ] Production uses different code than development
- [ ] No hardcoded `2341` in source code

### Issue 2: Server-Side Authentication
- [ ] DELETE story API returns 401 without auth cookie
- [ ] DELETE epic API returns 401 without auth cookie
- [ ] UPDATE epic ID API returns 401 without auth cookie
- [ ] All operations work correctly with valid auth cookie
- [ ] Frontend handles 401 errors gracefully

### Issue 3: Rate Limiting
- [ ] After 5 failed attempts, returns 429 error
- [ ] Rate limit resets after 15 minutes
- [ ] Different IPs have separate rate limits
- [ ] Successful login resets rate limit counter
- [ ] Error message includes reset time

---

## Implementation Order

1. **Issue 1** (Environment Variable) - Quick win, low risk
2. **Issue 2** (Server-Side Auth) - Critical security fix
3. **Issue 3** (Rate Limiting) - Important but less critical

---

## Related Files

- `src/app/api/auth/verify/route.ts` - Login endpoint
- `src/app/api/auth/check/route.ts` - Auth status check
- `src/app/api/auth/logout/route.ts` - Logout endpoint
- `src/middleware.ts` - Route protection middleware
- `src/app/projects/[projectName]/page.tsx` - Frontend delete operations
- `src/app/api/projects/[projectName]/epics/[epicName]/stories/[storyId]/route.ts` - Delete story API
- `src/app/api/projects/[projectName]/epics/[epicName]/route.ts` - Delete epic API
- `src/app/api/projects/[projectName]/epics/[epicName]/update-epic-id/route.ts` - Update epic ID API

---

## Additional Security Considerations

### Future Improvements
1. **Password-based authentication** - Replace code-based auth with proper passwords
2. **Session management** - Implement proper session tokens instead of simple cookie
3. **CSRF protection** - Add CSRF tokens for state-changing operations
4. **Audit logging** - Log all authentication attempts and destructive operations
5. **Two-factor authentication** - Add 2FA for additional security
6. **Account lockout** - Lock accounts after repeated failed attempts
7. **Security headers** - Add security headers (CSP, HSTS, etc.)
8. **Input validation** - Ensure all inputs are validated and sanitized
9. **SQL injection protection** - Not applicable (no SQL), but ensure KV queries are safe
10. **XSS protection** - Ensure all user inputs are properly escaped

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Rate Limiting Strategies](https://www.cloudflare.com/learning/bots/what-is-rate-limiting/)

---

**Last Updated:** 2025-01-XX
**Status:** All issues pending implementation

