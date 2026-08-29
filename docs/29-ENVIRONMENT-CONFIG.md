# MangoCycle Smart Platform — Environment Configuration

> **Document Name:** Environment Configuration  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 08-SECURITY.md, 04-TECH-STACK.md, 30-DEPLOYMENT.md

---

## 1. Purpose

This document is the **authoritative source** for all environment variables. It includes the `.env.example` specification.

---

## 2. Environment Variable Catalog

### 2.1 Public Variables (Safe for Client)

These are embedded in the client bundle via the `NEXT_PUBLIC_` prefix.

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key | `eyJhbGciOi...` |
| `NEXT_PUBLIC_APP_URL` | Public application URL (for QR codes) | `https://mangocycle.app` |

### 2.2 Server-Only Variables (Secrets)

These are **never** exposed to the client.

| Variable | Description | Example |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) | `eyJhbGciOi...` |
| `AI_API_KEY` | External LLM API key | `sk-...` |
| `AI_PROVIDER` | AI provider identifier | `openai` \| `gemini` \| `anthropic` |
| `AI_MODEL` | Default model name | `gpt-4o` |
| `IOT_DEVICE_SECRET` | Shared secret for IoT device key generation | `random-secret-string` |

### 2.3 Optional Variables

| Variable | Description | Default |
|---|---|---|
| `AI_TIMEOUT_MS` | AI request timeout in milliseconds | `30000` |
| `AI_MAX_RETRIES` | Max AI request retries | `2` |
| `RATE_LIMIT_ENABLED` | Enable rate limiting | `true` |

---

## 3. `.env.example`

```env
# ======================
# MangoCycle Smart Platform
# Environment Configuration
# ======================

# --- Supabase (Public) ---
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# --- Supabase (Server-Only — NEVER prefix with NEXT_PUBLIC_) ---
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# --- Application ---
NEXT_PUBLIC_APP_URL=http://localhost:3000

# --- AI Provider (Server-Only) ---
AI_API_KEY=your-ai-api-key
AI_PROVIDER=openai
AI_MODEL=gpt-4o
AI_TIMEOUT_MS=30000

# --- IoT (Server-Only) ---
IOT_DEVICE_SECRET=your-iot-secret

# --- Optional ---
RATE_LIMIT_ENABLED=true
```

---

## 4. Security Rules

| Rule | Detail |
|---|---|
| `.env.local` in `.gitignore` | Never commit secrets |
| Different keys per environment | Dev ≠ staging ≠ production |
| Vercel env vars | Set via dashboard for production |
| Never `NEXT_PUBLIC_` for secrets | Client-bundled = public |
| Rotate keys periodically | Especially AI and IoT keys |
| No fabricated credentials | Never commit fake but realistic-looking keys |

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [08-SECURITY.md](./08-SECURITY.md) | Secret management requirements |
| [04-TECH-STACK.md](./04-TECH-STACK.md) | Technology-specific config |
| [30-DEPLOYMENT.md](./30-DEPLOYMENT.md) | Environment setup per deployment |
| [13-QR-SYSTEM.md](./13-QR-SYSTEM.md) | Uses `NEXT_PUBLIC_APP_URL` |
