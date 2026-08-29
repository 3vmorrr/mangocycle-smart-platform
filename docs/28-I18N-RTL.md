# MangoCycle Smart Platform — Internationalization & RTL

> **Document Name:** Internationalization & RTL Support  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 10-UI-UX-SPECIFICATION.md

---

## 1. Purpose

This document defines the internationalization (i18n) and right-to-left (RTL) architecture to ensure the MVP does not make design decisions that prevent future Arabic language support.

---

## 2. MVP Scope

- **MVP language:** English (LTR)
- **Architecture goal:** RTL-ready — easy to add Arabic later
- **Full Arabic translation:** Post-MVP

---

## 3. Locale Strategy

### 3.1 Architecture

Use **next-intl** or a similar Next.js-compatible i18n library that supports:
- Static message extraction
- Dynamic locale switching
- RTL/LTR direction control
- Date/number/unit formatting per locale

### 3.2 Locale Configuration

```typescript
const locales = ['en', 'ar'] as const;
const defaultLocale = 'en';
```

### 3.3 URL Strategy

For MVP, no locale prefix in URLs. When Arabic is added, use locale prefix:
- English: `/en/dashboard` or `/dashboard` (default)
- Arabic: `/ar/dashboard`

---

## 4. Translation Files

```
messages/
├── en.json
└── ar.json      (placeholder for future)
```

**English structure example:**

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "loading": "Loading..."
  },
  "dashboard": {
    "title": "Dashboard",
    "totalWaste": "Total Mango Waste Collected",
    "processedWaste": "Total Waste Processed"
  },
  "wasteBatch": {
    "title": "Waste Batches",
    "create": "Create Waste Batch",
    "batchCode": "Batch Code"
  }
}
```

---

## 5. RTL/LTR Handling

### 5.1 CSS Rules

| Rule | Detail |
|---|---|
| Use `dir="rtl"` on `<html>` for Arabic | Set dynamically based on locale |
| Use logical CSS properties | `margin-inline-start` not `margin-left` |
| Use `text-start` / `text-end` | Not `text-left` / `text-right` |
| Tailwind RTL plugin | Enable `rtl:` and `ltr:` variants |
| Mirror directional icons | Arrows, chevrons, etc. flip in RTL |

### 5.2 Implementation Checklist for MVP

Even before Arabic is added, these patterns must be followed:

- [ ] Use logical CSS properties throughout
- [ ] Use `start`/`end` alignment instead of `left`/`right`
- [ ] Ensure layout direction is set from a central locale config
- [ ] No hard-coded text in components — use translation keys
- [ ] Test that layout doesn't break if `dir="rtl"` is set manually

---

## 6. Date/Number/Unit Formatting

| Format | English | Arabic |
|---|---|---|
| Date | `Jan 15, 2026` or `2026-01-15` | `١٥ يناير ٢٠٢٦` |
| Number | `1,234.56` | `١٬٢٣٤٫٥٦` |
| Weight unit | `2.5 kg` | `٢٫٥ كجم` |

Use `Intl.DateTimeFormat` and `Intl.NumberFormat` with the current locale for all formatting.

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [10-UI-UX-SPECIFICATION.md](./10-UI-UX-SPECIFICATION.md) | RTL readiness rules for UI |
| [GOVERNANCE.md](./GOVERNANCE.md) | Canonical terminology |
