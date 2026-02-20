# Week 4 Review: Security, Rate Limits, Validation, Logging, & Performance
**Status: DAYS 1-6 COMPLETE ✅**

---

## Executive Summary
You've successfully implemented **production-ready security & reliability patterns**. Your backend now:
- ✅ Prevents attacks via helmet + CORS
- ✅ Handles errors gracefully with centralized error middleware
- ✅ Stops abuse with rate limiting
- ✅ Validates all input with Zod
- ✅ Logs errors & suspicious activity with Pino
- ✅ Avoids N+1 queries with proper indexing

---

## WEEK 4 DAY-BY-DAY BREAKDOWN

### **DAY 1: Security Headers & CORS** 
**Files Involved:**
- [src/app.js](src/app.js) (Lines 1-70)
- [src/middlewares/error.middleware.js](src/middlewares/error.middleware.js)

#### What They Do:

**app.js — The Main Application Setup**
```
Purpose: Central Express configuration
What it does:
  1. helmet() — Adds security HTTP headers
     - Prevents XSS (cross-site scripting)
     - Disables framing (clickjacking)
     - Sets content security policy
     - Hides Express version
  
  2. cors() — Controls who can call your API
     - Only allows requests from allowedOrigins
     - Prevents browser from blocking frontend requests
     - Restricts methods to GET, POST, PUT, DELETE
     - Allows credentials (auth tokens)
  
  3. express.json() — Parse incoming JSON bodies
     - Special: captures raw body in req.rawBody (needed for webhook signature verification)
  
  4. mounts routes — All your API endpoints
  
  5. uses errorMiddleware at the end — catches ALL errors
```

**Why you need this:**
- **Helmet**: Without security headers, attackers can inject malicious scripts or break your UI
- **CORS**: Without it, only same-domain requests work. Your frontend can't talk to your backend
- **rawBody capture**: Paystack webhook verification requires the exact raw bytes sent by Paystack

---

### **DAY 2: Rate Limiting**
**Files Involved:**
- [src/middlewares/rateLimit.middleware.js](src/middlewares/rateLimit.middleware.js)
- [src/modules/auth/auth.routes.js](src/modules/auth/auth.routes.js)
- [src/modules/payments/payments.routes.js](src/modules/payments/payments.routes.js)
- [src/modules/webhooks/webhooks.routes.js](src/modules/webhooks/webhooks.routes.js)

#### What It Does:

**rateLimit.middleware.js**
```
Purpose: Prevent abuse by limiting request frequency

Three limiters configured:

1. authLimiter
   - Window: 15 minutes (or AUTH_WINDOW_MS from .env)
   - Max requests: AUTH_MAX (e.g., 10 attempts)
   - Applied to: register & login routes
   - Why: Prevents brute force password attacks
   - Example: Attacker can only try 10 login attempts per 15 min

2. paymentsLimiter
   - Window: 15 minutes
   - Max requests: PAYMENTS_MAX (e.g., 20 requests)
   - Applied to: /initialize-payment endpoint
   - Why: Prevents accidental duplicate payment creation
   - Example: User clicks "Pay" button 3 times → only 1 transaction created (due to idempotency key)

3. webhooksLimiter
   - Window: 15 minutes
   - Max requests: WEBHOOKS_MAX (e.g., unlimited for Paystack)
   - Applied to: /paystack webhook endpoint
   - Why: Paystack can retry webhooks heavily, so we allow many
   - Still logs warnings via logger.warn()

How it works:
  1. Client makes request → middleware checks IP + endpoint
  2. If < max in window → passes request through
  3. If >= max → returns 429 "Too many requests"
  4. Sends warning to logger (logged for review)
```

**Why you need this:**
- **Brute force protection**: Without limits, attacker sends 1000 login attempts/second
- **DDoS mitigation**: Legitimate users filtered from attackers
- **Cost control**: Prevents accidental loop sending 10,000 webhook handlers

**Real-world example:**
```
Your app sends payment confirmation email on each login.
Attacker: tries to login 1000x/second to spam email list.
With limiter: Login blocked after 10 attempts. Attacker's IP blacklisted.
```

---

### **DAY 3: Input Validation**
**Files Involved:**
- [src/modules/auth/auth.validation.js](src/modules/auth/auth.validation.js)
- [src/modules/payments/payments.validation.js](src/modules/payments/payments.validation.js)

#### What It Does:

**auth.validation.js — Validates User Registration & Login**
```
Tool Used: Zod (schema validation)

registerSchema validates:
  ✓ fullName: must be >= 2 chars (prevents empty names)
  ✓ email: must be valid format (catches typos)
  ✓ password: must be >= 8 chars (security minimum)
  ✓ passwordConfirm: must match password (prevents typos)

Result: If invalid → 422 Unprocessable Entity with error details
Example error:
  {
    "success": false,
    "message": "Validation error",
    "errors": [
      { "path": ["password"], "message": "Password must be at least 8 chars" }
    ]
  }

loginSchema validates:
  ✓ email: valid format
  ✓ password: not empty

refreshSchema validates:
  ✓ refreshToken: not empty
```

**payments.validation.js — Validates Deposit Amounts**
```
initializePaymentSchema validates:
  ✓ amount: must be a number (not string "2000")
  ✓ amount: must be integer (no decimals like 2000.50)
  ✓ amount: must be positive (no negative payments)
  ✓ amount: max 10,000,000 NGN (prevents accidental huge transfers)

Why validation at all?
  Without it:
    - Client sends string amount: "two thousand" → database breaks
    - Client sends 0.999 kobo → weird precision errors
    - Client sends -1000 → withdraws money that doesn't exist
    - Client sends 999,999,999 → unintended massive charge
  
  With validation:
    - All data is guaranteed correct BEFORE touching database
    - Error thrown early (saves database work)
    - Clear feedback to client
```

**Why you need this:**
- **Data integrity**: Database assumptions hold (money is integer)
- **Security**: Prevents SQL injection (Zod sanitizes input)
- **User experience**: Users get clear error messages, not database crashes
- **Developer peace**: You KNOW incoming data is valid

---

### **DAY 4: Logging**
**Files Involved:**
- [src/config/logger.js](src/config/logger.js)
- [src/middlewares/error.middleware.js](src/middlewares/error.middleware.js)
- [src/middlewares/rateLimit.middleware.js](src/middlewares/rateLimit.middleware.js)

#### What It Does:

**logger.js — Centralized Logging with Pino**
```
Tool Used: Pino (fast JSON logger)

Configuration:
  1. Log Level (from NODE_ENV):
     - Development: "debug" (logs EVERYTHING)
     - Production: "info" (logs important events only)
  
  2. Transports (where logs go):
     Development:
       → pino-pretty: colorized console output (human-readable)
       Example:
         [2026-02-20 10:30:45 UTC] INFO User registered user_id=5
         [2026-02-20 10:30:46 UTC] ERROR Database connection failed code=ECONNREFUSED
     
     Production:
       → combined.log: ALL logs (info level)
       → error.log: ONLY errors (error level)
       Why split? Errors go to monitoring tools (Sentry, DataDog) automatically

  3. Timestamp: ISO format (standard for log aggregation tools)

Usage throughout codebase:
  logger.error() → caught exceptions, database failures
  logger.warn()  → rate limits exceeded, suspicious activity
  logger.info()  → user registered, payment succeeded
  logger.debug() → deep details for troubleshooting
```

**error.middleware.js — Centralized Error Handling**
```
What it does:
  1. Catches ALL errors from all routes automatically
  2. Logs error details:
     - message: what went wrong
     - path: which route failed
     - method: GET/POST/etc
     - ip: client IP
     - userId: which user (if authenticated)
     - statusCode: HTTP status
     - stack: full error stack trace
  
  3. Handles ZodError specially:
     - Returns 422 (Unprocessable Entity)
     - Includes validation error details
  
  4. Different responses for dev vs production:
     Dev: shows full error message + stack trace
     Prod: shows generic "Internal server error" (hides internals from attackers)

Why it's critical:
  Without centralized error handling:
    - Route 1 returns error in format A
    - Route 2 returns error in format B
    - Frontend confused → poor UX
    - Errors go to console → lost when server restarts
    - No way to track which routes fail most
  
  With centralized handling:
    - All errors follow same format
    - All errors logged to file
    - Can analyze logs to find patterns
    - Can alert on specific errors

Example workflow:
  1. Auth middleware finds expired token
  2. Throws error with statusCode: 401
  3. errorMiddleware catches it
  4. Logs: {message: "Token expired", userId: 5, ...}
  5. Returns: {success: false, message: "Unauthorized"}
```

**Real-world usage in your code:**
```javascript
// rateLimit.middleware.js
handler: (req, res) => {
  logger.warn({
    event: 'rate_limit_exceeded',
    path: req.originalUrl,
    ip: req.ip,
  });
  // Sends alert: suspicious IP trying /payments/initialize 100x/min
}
```

**Why you need this:**
- **Debugging**: Read logs instead of running server in console
- **Monitoring**: Set up alerts when errors spike
- **Compliance**: Keep audit trail of failures (financial regulation requires this)
- **Performance**: Don't lose error context when server restarts

---

### **DAY 5: Avoiding N+1 Queries & Smart Indexing**
**Files Involved:**
- [src/modules/transactions/transactions.service.js](src/modules/transactions/transactions.service.js)
- [src/modules/wallets/wallets.service.js](src/modules/wallets/wallets.service.js)
- [prisma/schema.prisma](prisma/schema.prisma)

#### What It Does:

**The N+1 Problem (and how you solved it):**

```
What is N+1?
  You query 1 user.
  That user has 100 transactions.
  Without optimization:
    1. SELECT * FROM users WHERE id = 5  (1 query)
    2. SELECT * FROM transactions WHERE userId = 5  (1 query for 100 rows)
    3. For each transaction, you ask "who's this transaction's wallet?"
       100 separate SELECT queries!
  Total: 102 queries → SLOW

Your solution (transactions.service.js):
```

**fetchUserTransactions() — Good Query Design**
```javascript
// ✅ GOOD: Loads user + transactions + related wallets in ONE database call
prisma.transaction.findMany({
  where: { userId },
  include: {
    entries: {  // Preload ALL ledger entries for each transaction
      include: {
        wallet: {  // Preload wallet details for each entry
          select: { id: true, userId: true, isSystem: true, currency: true }
        }
      }
    }
  }
})

This generates ~2-3 database queries total (Prisma batches them)
Without include: 100+ queries

Why it works:
  `include` tells Prisma: "When fetching transactions, 
   automatically also fetch their ledger entries and wallets"
```

**Database Transactions (acid compliance):**
```javascript
// ✅ Uses prisma.$transaction() for atomicity
return prisma.$transaction([
  prisma.transaction.findMany(...),
  prisma.transaction.count(...)
])

Why it's needed:
  If your code crashes between findMany() and count():
    - You show user 10 transactions
    - But total count says 20
    - Frontend shows "Page 1 of 2" but only 1 page exists
  
  With $transaction:
    - Both queries run together
    - If one fails, both fail
    - Data always consistent
```

---

### **DAY 6: Table Indexes**
**Files Involved:**
- [prisma/schema.prisma](prisma/schema.prisma)

#### What Indexes Do:

An **index** is like a book's table of contents:
```
Without index on userId:
  SELECT * FROM transactions WHERE userId = 5
  → Database checks every row (1 million → slow)

With index on userId:
  SELECT * FROM transactions WHERE userId = 5
  → Database looks up userId in index → finds row instantly
  → 1000x faster
```

**Your Index Strategy:**

```prisma
Session Model:
  @@index([userId])
  WHY: When user logs out, you fetch ALL sessions for that user
       "SELECT * FROM sessions WHERE userId = 5"

Wallet Model:
  @@unique([userId])
  WHY: One wallet per user. When loading wallet, you query by userId
       Also serves as an index (unique = auto-indexed)

Transaction Model:
  @@unique([userId, idempotencyKey])
  WHY: Idempotency — prevent duplicate payments
       "SELECT * FROM transactions WHERE userId = 5 AND idempotencyKey = 'ABC'"

  @@index([userId])
  WHY: Fetch user's transaction history
       "SELECT * FROM transactions WHERE userId = 5"

  @@index([userId, createdAt(sort: Desc)])
  WHY: Paginated history sorted by newest first
       "SELECT * FROM transactions WHERE userId = 5 ORDER BY createdAt DESC LIMIT 20"
       This is a COMPOSITE index (2 columns together)

  @@index([status])
  WHY: Admin dashboard: "Show me all PENDING transactions"
       "SELECT * FROM transactions WHERE status = 'PENDING'"

LedgerEntry Model:
  @@index([transactionId])
  WHY: Get all ledger entries for a transaction
       "SELECT * FROM ledger_entries WHERE transactionId = 42"

  @@index([walletId])
  WHY: Calculate wallet balance (sum all entries for this wallet)
       "SELECT SUM(amount) FROM ledger_entries WHERE walletId = 10"

WebhookEvent Model:
  @@unique([provider, reference, eventType])
  WHY: Prevent re-processing same webhook
       "SELECT * FROM webhook_events WHERE provider = 'PAYSTACK' 
        AND reference = 'TX-123' AND eventType = 'charge.success'"
```

**Why indexes matter for fintech:**
- **Speed**: Wallet balance fetches < 1ms instead of 1s
- **Concurrency**: Many users querying simultaneously doesn't slow down
- **Reliability**: Webhook retries don't cause duplicate charges (unique index prevents it)
- **Cost**: Fast queries use less CPU = lower cloud bill

---

## SUMMARY TABLE: Week 4 Features at a Glance

| Day | Feature | File(s) | What It Prevents |
|-----|---------|---------|-----------------|
| 1 | Security Headers | app.js | XSS, clickjacking, info leakage |
| 1 | CORS | app.js | Unauthorized cross-origin requests |
| 2 | Rate Limiting | rateLimit.middleware.js | Brute force, DDoS, accidental loops |
| 3 | Input Validation | auth.validation.js, payments.validation.js | Invalid data, SQL injection risk |
| 4 | Error Logging | logger.js, error.middleware.js | Lost errors, debugging blind |
| 5 | N+1 Queries | transactions.service.js | 100x slower queries |
| 6 | Database Indexes | schema.prisma | Slow table scans |

---

## What You've Built (Production Readiness Checklist)

✅ **Security**: Helmet headers + CORS policies  
✅ **Abuse Prevention**: Rate limiters on sensitive routes  
✅ **Data Integrity**: Zod validation for all input  
✅ **Observability**: Pino logging to files  
✅ **Error Handling**: Centralized middleware  
✅ **Performance**: Indexes on all frequently-queried columns  
✅ **Logging**: Both combined.log and error.log in production  

Your backend is now **harder to attack**, **easier to debug**, and **faster to query**.

---

## Next: WEEK 4 DAY 7
📋 **Update Swagger Docs** — Document all endpoints with examples
- New endpoints need JSDoc comments
- Rate limit behavior should be documented
- Validation errors should show in examples
- Error responses should be documented (401, 422, 429, 500)

Would you like to review any of these files in more detail, or are you ready to move to Day 7 (Swagger documentation)?
