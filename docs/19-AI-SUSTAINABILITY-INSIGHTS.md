# MangoCycle Smart Platform — AI Sustainability Insights

> **Document Name:** AI Sustainability Insights  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 15-AI-ARCHITECTURE.md, 05-DATABASE-SCHEMA.md

---

## 1. Purpose

This document specifies the AI Sustainability Insights feature — an AI-assisted narrative generator that interprets verified sustainability metrics calculated from the database.

---

## 2. Feature Summary

| Attribute | Value |
|---|---|
| Feature Name | AI Sustainability Insights |
| Priority | P2 |
| Route | `/ai/insights` |
| Min Role | `viewer` |
| Architecture | Database → Calculated Metrics → LLM → Narrative |

---

## 3. Core Principle: Deterministic First

```
Database (raw data)
    ↓
Backend calculates real metrics (code/SQL)
    ↓
Structured verified metrics object
    ↓
LLM receives metrics and generates narrative
    ↓
User sees narrative WITH underlying data
```

> [!IMPORTANT]
> The LLM **never** calculates metrics. It only **interprets** pre-calculated, verified values. All numbers must come from the database.

---

## 4. Calculated Metrics

The backend calculates these metrics before passing to the LLM:

| Metric | Calculation |
|---|---|
| `total_waste_collected_kg` | `SUM(weight_kg)` from `waste_batches` |
| `total_waste_processed_kg` | `SUM(weight_kg)` where `current_status` IN completed/production stages |
| `total_batches` | `COUNT(*)` from `waste_batches` |
| `completed_batches` | `COUNT(*)` where `current_status = 'completed'` |
| `active_batches` | `COUNT(*)` where `current_status` NOT IN ('completed', 'rejected') |
| `product_batches_count` | `COUNT(*)` from `product_batches` |
| `waste_by_source` | `GROUP BY source` with `SUM(weight_kg)` |
| `waste_by_type` | `GROUP BY waste_type` with `SUM(weight_kg)` |
| `avg_processing_duration_days` | Average days from first to last stage entry |
| `batches_in_each_stage` | `GROUP BY current_status` with `COUNT(*)` |
| `period_comparison` | Current vs previous period totals (if enough data) |

### 4.1 Metrics Object (Input to LLM)

```typescript
interface SustainabilityMetrics {
  period: string;  // e.g., "2026-01"
  total_waste_collected_kg: number;
  total_waste_processed_kg: number;
  processing_rate_pct: number;
  total_batches: number;
  completed_batches: number;
  active_batches: number;
  product_batches_count: number;
  waste_by_source: Record<string, number>;
  waste_by_type: Record<string, number>;
  avg_processing_duration_days: number | null;
  top_source: { name: string; weight_kg: number } | null;
  period_change_pct: number | null;  // vs previous period
}
```

---

## 5. LLM Narrative Generation

### 5.1 System Prompt

```
You are a sustainability insights narrator for the MangoCycle Smart Platform.

You receive VERIFIED, pre-calculated sustainability metrics from the platform database.

Your task is to generate a concise, professional narrative summary highlighting
key sustainability achievements and areas needing attention.

RULES:
1. ONLY reference the numbers provided in the metrics. NEVER invent additional data.
2. Use the exact numbers from the input — do not round or adjust.
3. Focus on sustainability impact: waste diverted, processing progress, source diversity.
4. Highlight positive trends and areas for improvement.
5. Keep the narrative to 3–5 concise bullet points or short paragraphs.
6. Use professional, scientific language appropriate for a university research context.
7. If data is insufficient for meaningful insights, say so.
8. Do NOT make claims about carbon savings, economic value, or environmental impact
   unless those specific metrics are provided.
```

### 5.2 Example Output

Given metrics: `{total_waste_collected_kg: 47.5, processing_rate_pct: 78, top_source: {name: "Mango Processing Factory A", weight_kg: 22.3}, completed_batches: 7, active_batches: 3}`

```
## Sustainability Insights — January 2026

- **47.5 kg** of mango waste has been diverted from disposal through the MangoCycle program.
- **78%** of collected waste has been processed, with 7 batches completed and 3 currently active.
- **Mango Processing Factory A** is the largest waste contributor at 22.3 kg, demonstrating strong industry partnership.
- Several batches remain in active processing stages, indicating continued operational throughput.
- Increasing source diversity could enhance waste collection volume and supply resilience.
```

---

## 6. UI Design

```
┌──────────────────────────────────────────┐
│  🌱 AI Sustainability Insights           │
│  [Period: January 2026 ▼]  [Refresh]     │
├──────────────────────────────────────────┤
│                                          │
│  ℹ️ AI-generated narrative based on       │
│  calculated platform metrics.             │
│                                          │
│  Key Metrics:                            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│  │47.5kg│ │ 78%  │ │  7   │ │  3   │    │
│  │Coll. │ │Proc. │ │Done  │ │Active│    │
│  └──────┘ └──────┘ └──────┘ └──────┘    │
│                                          │
│  AI Narrative:                           │
│  • 47.5 kg diverted from disposal...    │
│  • 78% processing rate...               │
│  • Factory A is top contributor...       │
│                                          │
│  📝 Generated: 2026-01-31 09:00         │
│  Underlying data last updated: 09:00     │
│                                          │
└──────────────────────────────────────────┘
```

### 6.1 Dashboard Integration

A compact version appears on the Dashboard as the "AI Insights" section:
- Shows 2–3 key insight bullets
- Link to full insights page

---

## 7. Caching Strategy

Insights do not need to be regenerated on every page load. Strategy:

| Approach | Detail |
|---|---|
| Cache duration | 1 hour or until data changes |
| Invalidation | When new batch created/updated or stage changed |
| Storage | `ai_analysis_records` with `analysis_type = 'sustainability_insights'` |

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [GOVERNANCE.md](./GOVERNANCE.md) | Scientific language constraints |
| [15-AI-ARCHITECTURE.md](./15-AI-ARCHITECTURE.md) | AI abstraction layer |
| [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md) | Source tables for metric calculations |
| [01-PRODUCT-REQUIREMENTS.md](./01-PRODUCT-REQUIREMENTS.md) | Dashboard KPI definitions |
| [09-ROUTES-AND-PAGES.md](./09-ROUTES-AND-PAGES.md) | Route: `/ai/insights` |
| [37-OPEN-QUESTIONS.md](./37-OPEN-QUESTIONS.md) | Sustainability calculation methodology |
