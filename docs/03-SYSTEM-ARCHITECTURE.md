# MangoCycle Smart Platform — System Architecture

> **Document Name:** System Architecture  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 04-TECH-STACK.md, 05-DATABASE-SCHEMA.md, 08-SECURITY.md, 15-AI-ARCHITECTURE.md, 22-IOT-ARCHITECTURE.md, 30-DEPLOYMENT.md

---

## 1. Architecture Overview

The MangoCycle Smart Platform follows a **monolithic Next.js application** architecture with Supabase as the backend-as-a-service provider. This architecture is chosen for rapid development within the competition timeline while maintaining clear separation of concerns.

### High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        Browser["Browser (Desktop/Mobile)"]
        Phone["Phone (QR Scan)"]
        ESP32["ESP32 Smart Bin"]
    end

    subgraph "Application Layer (Vercel)"
        NextJS["Next.js Application"]
        ServerActions["Server Actions"]
        RouteHandlers["Route Handlers (API)"]
        PublicPages["Public Traceability Pages"]
        Middleware["Auth Middleware"]
    end

    subgraph "External Services"
        LLMAPI["External LLM API"]
    end

    subgraph "Backend Services (Supabase)"
        SupaAuth["Supabase Auth"]
        SupaDB["PostgreSQL Database"]
        SupaStorage["Supabase Storage"]
        SupaRealtime["Supabase Realtime"]
        RLS["Row Level Security"]
    end

    Browser --> Middleware
    Middleware --> NextJS
    Phone --> PublicPages
    ESP32 -->|"HTTPS POST"| RouteHandlers

    NextJS --> ServerActions
    NextJS --> RouteHandlers
    ServerActions --> SupaDB
    ServerActions --> SupaAuth
    ServerActions --> SupaStorage
    ServerActions --> LLMAPI
    RouteHandlers --> SupaDB
    RouteHandlers --> LLMAPI

    PublicPages --> SupaDB

    SupaDB --> RLS
    SupaDB --> SupaRealtime
```

---

## 2. Architecture Layers

### 2.1 Client Layer

| Client | Purpose | Protocol |
|---|---|---|
| Browser (Desktop/Mobile) | Primary application interface for authenticated users | HTTPS |
| Phone (QR Scan) | Public traceability page viewing | HTTPS |
| ESP32 Smart Bin | IoT weight data submission | HTTPS POST |

### 2.2 Application Layer (Next.js on Vercel)

The Next.js application handles all rendering, routing, business logic, and API endpoints.

#### Server Components (Default)
- Page rendering with data fetching
- Direct database queries via Supabase server client
- No client-side data exposure of secrets

#### Client Components (Where Needed)
- Interactive forms (React Hook Form)
- Charts and visualizations
- Real-time updates
- Image upload UI

#### Server Actions
- Form submissions and mutations
- Business logic execution
- Validation (Zod)
- Audit log creation
- Database writes

#### Route Handlers (API Routes)
- IoT weight data endpoint (`POST /api/iot/weight`)
- AI endpoints (proxied through server to protect API keys)
- Public data endpoints for traceability pages
- Webhook handlers if needed

#### Middleware
- Authentication verification on protected routes
- Role-based route protection
- Public route passthrough (traceability pages, landing page)

### 2.3 External Services

| Service | Usage | Dependency Level |
|---|---|---|
| External LLM API | AI features (vision analysis, processing advice, Ask MangoCycle, insights, reports) | Optional — platform works without it |

### 2.4 Backend Services (Supabase)

| Service | Usage |
|---|---|
| **PostgreSQL** | Primary data store for all application data |
| **Supabase Auth** | User authentication, session management, JWT tokens |
| **Supabase Storage** | Laboratory file attachments, uploaded images |
| **Supabase Realtime** | Optional — live dashboard updates, IoT weight notifications |
| **Row Level Security** | Database-level access control enforcement |

---

## 3. Data Flow Architecture

### 3.1 Authenticated Application Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Middleware
    participant NextJS as Next.js Server
    participant Supabase

    User->>Browser: Navigate to /dashboard
    Browser->>Middleware: Request with session cookie
    Middleware->>Supabase: Verify JWT
    Supabase-->>Middleware: Valid session + user role
    Middleware->>NextJS: Authorized request
    NextJS->>Supabase: Query data (server client)
    Supabase-->>NextJS: Data (filtered by RLS)
    NextJS-->>Browser: Rendered page
```

### 3.2 Public Traceability Flow

```mermaid
sequenceDiagram
    actor Visitor
    participant Phone
    participant NextJS as Next.js Server
    participant Supabase

    Visitor->>Phone: Scan QR Code
    Phone->>NextJS: GET /trace/waste/MW-2026-001
    NextJS->>Supabase: Query public batch data
    Note over NextJS,Supabase: Only public-safe fields returned
    Supabase-->>NextJS: Public batch data
    NextJS-->>Phone: Rendered traceability page
```

### 3.3 AI Feature Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant NextJS as Next.js Server
    participant Supabase
    participant LLM as External LLM API

    User->>Browser: Upload waste image
    Browser->>NextJS: Server Action with image
    NextJS->>NextJS: Validate input + file
    NextJS->>LLM: Send image + structured prompt
    LLM-->>NextJS: Structured JSON response
    NextJS->>NextJS: Validate + sanitize AI output
    NextJS->>Supabase: Store AI analysis record
    NextJS-->>Browser: Display assessment results
```

### 3.4 IoT Data Flow

```mermaid
sequenceDiagram
    participant Sensor as Load Cell + HX711
    participant ESP32
    participant NextJS as Next.js Route Handler
    participant Supabase

    Sensor->>ESP32: Raw weight reading
    ESP32->>ESP32: Smooth (median/moving avg)
    ESP32->>ESP32: Check threshold / interval
    ESP32->>NextJS: POST /api/iot/weight (JSON + API key)
    NextJS->>NextJS: Validate device + payload
    NextJS->>Supabase: Insert weight reading
    Supabase-->>NextJS: Confirm
    NextJS-->>ESP32: 200 OK
```

### 3.5 Ask MangoCycle Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant NextJS as Next.js Server
    participant LLM as External LLM API
    participant Supabase
    participant Tools as Approved Tool Layer

    User->>Browser: "How much waste collected this month?"
    Browser->>NextJS: Server Action
    NextJS->>LLM: User question + tool definitions
    LLM-->>NextJS: Tool call: get_total_waste(period="month")
    NextJS->>Tools: Execute approved function
    Tools->>Supabase: Parameterized query
    Supabase-->>Tools: Result: 47.5 kg
    Tools-->>NextJS: Verified result
    NextJS->>LLM: Tool result: 47.5 kg
    LLM-->>NextJS: "47.5 kg of mango waste was collected this month."
    NextJS-->>Browser: Display response
```

---

## 4. Component Architecture

### 4.1 Next.js Project Structure (Conceptual)

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (login, forgot-password)
│   ├── (dashboard)/              # Protected application routes
│   │   ├── dashboard/
│   │   ├── waste-batches/
│   │   ├── products/
│   │   ├── laboratory/
│   │   ├── ai/
│   │   ├── iot/
│   │   ├── reports/
│   │   └── admin/
│   ├── trace/                    # Public traceability pages
│   │   ├── waste/[batchCode]/
│   │   └── product/[batchCode]/
│   ├── api/                      # Route Handlers
│   │   └── iot/
│   ├── layout.tsx
│   └── page.tsx                  # Landing page
│
├── components/                   # Reusable UI components
│   ├── ui/                       # Base design system components
│   ├── forms/                    # Form components
│   ├── charts/                   # Chart components
│   ├── layout/                   # Layout components (sidebar, header)
│   └── shared/                   # Shared feature components
│
├── lib/                          # Core libraries and utilities
│   ├── supabase/                 # Supabase client configurations
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── admin.ts              # Service role client
│   ├── ai/                       # AI integration layer
│   │   ├── provider.ts           # LLM API abstraction
│   │   ├── tools.ts              # Ask MangoCycle tool definitions
│   │   └── prompts/              # Structured prompts
│   ├── validators/               # Zod schemas
│   ├── utils/                    # Utility functions
│   └── constants/                # Application constants
│
├── actions/                      # Server Actions
│   ├── waste-batches.ts
│   ├── products.ts
│   ├── laboratory.ts
│   ├── ai.ts
│   ├── auth.ts
│   └── audit.ts
│
├── types/                        # TypeScript type definitions
│
└── hooks/                        # Custom React hooks
```

> [!NOTE]
> This is a conceptual structure. The implementing agent should adapt it as needed while maintaining the separation of concerns.

### 4.2 Key Architectural Boundaries

```mermaid
graph LR
    subgraph "Client (Browser)"
        UI["UI Components"]
        Forms["Form Components"]
        Charts["Chart Components"]
    end

    subgraph "Server (Next.js)"
        SA["Server Actions"]
        RH["Route Handlers"]
        BL["Business Logic"]
        VAL["Validators (Zod)"]
        AI["AI Integration Layer"]
        AuditSvc["Audit Service"]
    end

    subgraph "Data (Supabase)"
        DB["PostgreSQL + RLS"]
        Auth["Supabase Auth"]
        Storage["Supabase Storage"]
    end

    UI --> SA
    Forms --> SA
    SA --> VAL
    SA --> BL
    BL --> DB
    BL --> AI
    BL --> AuditSvc
    AuditSvc --> DB
    AI --> |"Server-side only"| ExternalAI["LLM API"]
    RH --> VAL
    RH --> BL
```

---

## 5. Security Architecture

Security is enforced at every layer. Detailed requirements are defined in [08-SECURITY.md](./08-SECURITY.md).

### 5.1 Defense in Depth

| Layer | Mechanism |
|---|---|
| **Edge** | Vercel edge network, HTTPS, rate limiting |
| **Middleware** | JWT verification, route protection, role check |
| **Application** | Zod validation, input sanitization, output escaping |
| **Server Actions** | Server-side only execution, secret protection |
| **Database** | Row Level Security, constraints, foreign keys |
| **Storage** | Bucket policies, MIME validation, size limits |

### 5.2 Authentication Flow

```
Login → Supabase Auth → JWT → Session Cookie → Middleware Verification → Access
```

### 5.3 Public vs Private Data Boundary

```mermaid
graph TB
    subgraph "Public (No Auth)"
        Landing["Landing Page"]
        WasteTrace["Waste Traceability Page"]
        ProductTrace["Product Traceability Page"]
    end

    subgraph "Private (Auth Required)"
        Dashboard
        WasteMgmt["Waste Batch Management"]
        ProductMgmt["Product Batch Management"]
        Lab["Laboratory Module"]
        AI["MangoCycle AI"]
        IoT["IoT Management"]
        Admin["Administration"]
    end

    subgraph "Server-Only (Never Exposed)"
        APIKeys["AI API Keys"]
        ServiceRole["Supabase Service Role Key"]
        IoTSecret["IoT Device Secrets"]
        InternalAudit["Full Audit History"]
    end
```

---

## 6. AI Integration Architecture

AI is a support layer, not a core dependency. The platform must function without AI.

### 6.1 AI Abstraction Layer

All AI calls go through a server-side abstraction layer that:

1. Manages API keys (server-only)
2. Constructs structured prompts
3. Validates and sanitizes AI output
4. Handles timeouts and errors gracefully
5. Logs AI interactions for audit

### 6.2 AI Provider Strategy

The AI integration layer abstracts the specific LLM provider, allowing the provider to be changed by updating configuration. See [15-AI-ARCHITECTURE.md](./15-AI-ARCHITECTURE.md).

### 6.3 AI Failure Handling

If the AI provider is unavailable:
- AI features show a clear "AI temporarily unavailable" message
- All non-AI features continue to work normally
- No platform functionality is blocked

---

## 7. IoT Integration Architecture

IoT is an optional, non-blocking feature. See [22-IOT-ARCHITECTURE.md](./22-IOT-ARCHITECTURE.md).

### 7.1 Integration Points

- **Inbound**: `POST /api/iot/weight` (ESP32 → Platform)
- **Display**: Dashboard Smart Bin status section
- **Management**: IoT devices admin page

### 7.2 Failure Handling

If IoT hardware is unavailable:
- Manual weight entry remains fully functional
- Dashboard hides/grays out IoT section
- No platform functionality is blocked

---

## 8. Resilience Principles

| Scenario | Platform Behavior |
|---|---|
| AI provider down | All non-AI features work; AI sections show "unavailable" |
| IoT hardware offline | Manual weight entry works; IoT section hidden/disabled |
| Supabase Realtime down | Application works with standard request/response |
| Network slow | Server-side rendering ensures basic content loads |
| Invalid AI response | Validation catches malformed output; user sees error |
| Malicious IoT payload | Validation rejects; logged for review |

---

## 9. Scalability Considerations

For the MVP prototype, scalability is not a primary concern. However, the architecture naturally supports:

- **Horizontal scaling** via Vercel's serverless deployment
- **Database scaling** via Supabase managed PostgreSQL
- **Storage scaling** via Supabase Storage (S3-backed)
- **CDN caching** for public traceability pages via Vercel edge

---

## 10. Architecture Decision Summary

Key architectural decisions are recorded in [38-DECISION-LOG.md](./38-DECISION-LOG.md). Summary:

| Decision | Rationale |
|---|---|
| Monolithic Next.js | Fastest development for competition timeline |
| Supabase BaaS | Integrated auth, DB, storage, realtime in one service |
| Server Actions over REST | Reduced boilerplate, type-safe server calls |
| Route Handlers for IoT | ESP32 needs standard HTTP endpoints |
| AI via external API | No custom model training needed for MVP |
| QR contains URL, not data | URLs allow dynamic content updates; less data in QR |
| UUID + human-readable codes | UUIDs for internal consistency, readable codes for users |

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [GOVERNANCE.md](./GOVERNANCE.md) | Canonical terminology |
| [04-TECH-STACK.md](./04-TECH-STACK.md) | Technology justifications |
| [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md) | Database layer details |
| [07-AUTH-AND-RBAC.md](./07-AUTH-AND-RBAC.md) | Auth architecture details |
| [08-SECURITY.md](./08-SECURITY.md) | Security architecture details |
| [15-AI-ARCHITECTURE.md](./15-AI-ARCHITECTURE.md) | AI integration details |
| [22-IOT-ARCHITECTURE.md](./22-IOT-ARCHITECTURE.md) | IoT integration details |
| [24-API-SPECIFICATION.md](./24-API-SPECIFICATION.md) | API contracts |
| [30-DEPLOYMENT.md](./30-DEPLOYMENT.md) | Deployment architecture |
| [38-DECISION-LOG.md](./38-DECISION-LOG.md) | Architectural decisions |
