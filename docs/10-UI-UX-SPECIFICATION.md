# MangoCycle Smart Platform — UI/UX Specification

> **Document Name:** UI/UX Specification  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 09-ROUTES-AND-PAGES.md, 28-I18N-RTL.md

---

## 1. Purpose

This document defines the visual design direction, component patterns, layout structure, and UX guidelines for the MangoCycle Smart Platform. It provides the design specification that implementing agents need to build a cohesive, professional interface.

---

## 2. Design Direction

### 2.1 Visual Identity

The platform communicates: **sustainability, biotechnology, clean scientific interface, modern dashboard, professional university innovation.**

### 2.2 Do / Don't

| Do ✅ | Don't ❌ |
|---|---|
| Clean, modern dashboard aesthetic | Cartoonish environmental design |
| Professional scientific interface | Excessive gradients or glow effects |
| Subtle, purposeful color palette | Childish green themes |
| Structured data hierarchy | Excessive animations |
| Accessible contrast ratios | Generic AI neon style |
| Consistent typography | Marketing/landing-page feel in the app |
| Meaningful white space | Cluttered layouts with dense data |

---

## 3. Color System

### 3.1 Primary Palette

| Token | Role | Suggested Value | Notes |
|---|---|---|---|
| `--color-primary` | Primary actions, active states | `hsl(152, 57%, 35%)` | Muted teal-green — sustainability without being cartoonish |
| `--color-primary-light` | Hover states, light backgrounds | `hsl(152, 45%, 92%)` | |
| `--color-primary-dark` | Dark variant | `hsl(152, 57%, 25%)` | |
| `--color-secondary` | Secondary actions | `hsl(210, 40%, 45%)` | Slate blue — scientific/professional |
| `--color-accent` | Highlights, important badges | `hsl(38, 80%, 55%)` | Warm amber — mango reference |

### 3.2 Neutral Palette

| Token | Role | Light Mode | Dark Mode |
|---|---|---|---|
| `--color-bg` | Page background | `hsl(0, 0%, 98%)` | `hsl(220, 20%, 10%)` |
| `--color-surface` | Card/component surfaces | `hsl(0, 0%, 100%)` | `hsl(220, 18%, 14%)` |
| `--color-surface-elevated` | Elevated surfaces (modals) | `hsl(0, 0%, 100%)` | `hsl(220, 16%, 18%)` |
| `--color-border` | Borders, dividers | `hsl(220, 13%, 91%)` | `hsl(220, 13%, 23%)` |
| `--color-text-primary` | Primary text | `hsl(220, 20%, 15%)` | `hsl(220, 13%, 91%)` |
| `--color-text-secondary` | Secondary/muted text | `hsl(220, 10%, 45%)` | `hsl(220, 10%, 60%)` |

### 3.3 Semantic Colors

| Token | Role | Value |
|---|---|---|
| `--color-success` | Positive states, completed | `hsl(152, 57%, 35%)` |
| `--color-warning` | Warnings, attention needed | `hsl(38, 80%, 55%)` |
| `--color-error` | Errors, failures, rejected | `hsl(0, 65%, 50%)` |
| `--color-info` | Informational | `hsl(210, 60%, 50%)` |

### 3.4 Dark Mode

Support dark mode via CSS custom properties and Tailwind's `dark:` prefix. Default to system preference with a manual toggle.

---

## 4. Typography

### 4.1 Font Stack

| Role | Font | Source |
|---|---|---|
| Primary (UI) | **Inter** | Google Fonts |
| Monospace (codes, data) | **JetBrains Mono** or system monospace | Google Fonts |

### 4.2 Scale

| Token | Size | Weight | Usage |
|---|---|---|---|
| `text-display` | 30px / 1.875rem | 700 | Page titles |
| `text-heading` | 24px / 1.5rem | 600 | Section headings |
| `text-subheading` | 18px / 1.125rem | 600 | Card titles |
| `text-body` | 14px / 0.875rem | 400 | Body text |
| `text-small` | 12px / 0.75rem | 400 | Captions, labels |
| `text-code` | 13px / 0.8125rem | 400 (mono) | Batch codes, technical data |

---

## 5. Layout Structure

### 5.1 Application Shell

```
┌─────────────────────────────────────────────────┐
│                   Top Header                     │
│  Logo   Navigation Breadcrumb    User Menu       │
├──────────┬──────────────────────────────────────┤
│          │                                       │
│  Sidebar │           Main Content                │
│  (Nav)   │                                       │
│          │                                       │
│          │                                       │
│          │                                       │
│          │                                       │
│          │                                       │
│          │                                       │
└──────────┴──────────────────────────────────────┘
```

### 5.2 Sidebar

- Width: 256px (expanded), 64px (collapsed icon-only)
- Collapsible on desktop, drawer overlay on mobile
- Shows navigation items per visibility rules in [09-ROUTES-AND-PAGES.md](./09-ROUTES-AND-PAGES.md)
- Active item highlighted
- Grouped sections with subtle dividers

### 5.3 Top Header

- Height: 56–64px
- Contains: logo/brand, breadcrumb, quick actions, user avatar/menu
- Sticky on scroll

### 5.4 Main Content Area

- Max width: 1280px centered (or full-width for dashboards)
- Padding: 24px on desktop, 16px on mobile
- Content flows top-to-bottom

### 5.5 Responsive Breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | < 768px | Sidebar hidden (hamburger menu), single column |
| Tablet | 768px–1024px | Sidebar collapsed (icons), content adjusts |
| Desktop | > 1024px | Sidebar expanded, full layout |

---

## 6. Component Patterns

### 6.1 KPI Cards

```
┌─────────────────────────┐
│  📦  Total Waste         │
│                          │
│       127.5 kg           │
│  ▲ 12% vs last month    │
└─────────────────────────┘
```

- Icon + label at top
- Large metric value prominently displayed
- Optional trend indicator (up/down arrow + percentage)
- Subtle background color or left border accent

### 6.2 Data Tables

- Sortable column headers
- Row hover highlight
- Pagination (20 items per page default)
- Filter bar above table
- Status badges in cells
- Actions column (view, edit, delete)
- Empty state with illustration and CTA

### 6.3 Forms

- Label above input (not floating labels — better for accessibility and RTL)
- Validation errors below input in red
- Required field indicator (asterisk)
- Submit button at bottom-right (respects RTL)
- Loading state on submit
- Success/error toast notification

### 6.4 Status Badges

| Status | Color | Used For |
|---|---|---|
| Collected | `info` (blue) | Waste stage |
| Sorted, Washed, Dried, Ground | `info` (blue) | Waste stage |
| Extraction, Production | `warning` (amber) | Waste stage |
| Laboratory Testing | `secondary` (slate) | Waste stage |
| Completed | `success` (green) | Waste/product status |
| Rejected | `error` (red) | Waste/product status |
| Pending | `secondary` (slate) | Lab test status |
| In Progress | `warning` (amber) | Lab/product status |
| Passed | `success` (green) | Lab test status |
| Failed | `error` (red) | Lab test status |

### 6.5 Processing Timeline

Vertical timeline component for Waste Batch detail page:

```
  ● Collected           2026-01-15  ✅
  │
  ● Sorted              2026-01-16  ✅
  │
  ● Washed              2026-01-16  ✅
  │
  ● Dried               2026-01-18  ✅
  │
  ○ Ground              —           (current)
  │
  ○ Extraction          —
  │
  ○ Production          —
  │
  ○ Laboratory Testing  —
  │
  ○ Completed           —
```

- Filled circles for completed stages
- Open circle for current and future stages
- Dates and optional notes per stage
- Performed-by user info (private pages only)

### 6.6 QR Code Display

- QR rendered as SVG (via `qrcode.react`)
- Displayed in a card with batch code label
- Download button (PNG/SVG)
- Print button
- Size: ~200px for display, higher resolution for download

### 6.7 Toast Notifications

- Bottom-right position (adjusts for RTL)
- Auto-dismiss after 5 seconds
- Types: success (green), error (red), warning (amber), info (blue)
- Dismiss button (×)

### 6.8 Empty States

Every list page must have a meaningful empty state:
- Relevant illustration or icon
- Short descriptive text
- Call-to-action button (e.g., "Create your first Waste Batch")

### 6.9 Loading States

- Skeleton loaders for page content (not spinners for full-page loads)
- Spinner for button actions
- Disabled state during form submission

---

## 7. Dashboard Layout

Detailed in [01-PRODUCT-REQUIREMENTS.md](./01-PRODUCT-REQUIREMENTS.md) §2.6. Visual structure:

```
┌──────────────────────────────────────────────────┐
│  Dashboard           [Date Filter ▼]  [+ New ▼]  │
├──────────────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│
│  │Total│ │Proc.│ │Actve│ │Comp.│ │Prod.│ │Divrt││
│  │Waste│ │Waste│ │Batch│ │Batch│ │Batch│ │Waste││
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘│
├──────────────────────────────────────────────────┤
│  ┌────────────────────┐ ┌────────────────────┐    │
│  │                    │ │                    │    │
│  │  Waste Over Time   │ │  Waste by Source   │    │
│  │  (Line Chart)      │ │  (Pie/Donut Chart) │    │
│  │                    │ │                    │    │
│  └────────────────────┘ └────────────────────┘    │
│  ┌────────────────────┐ ┌────────────────────┐    │
│  │                    │ │                    │    │
│  │  Batches by Stage  │ │  Processed vs      │    │
│  │  (Bar Chart)       │ │  Remaining (Donut) │    │
│  │                    │ │                    │    │
│  └────────────────────┘ └────────────────────┘    │
├──────────────────────────────────────────────────┤
│  Recent Batches                     [View All →]  │
│  ┌──────────────────────────────────────────┐     │
│  │  MW-2026-001  │ Mango Peel │ Dried  │ 2.5kg│  │
│  │  MW-2026-002  │ Mango Seed │ Sorted │ 1.2kg│  │
│  └──────────────────────────────────────────┘     │
├──────────────────────────────────────────────────┤
│  Batches Requiring Attention        [View All →]  │
│  AI Insights                                      │
│  Smart Bin Status (if IoT enabled)               │
└──────────────────────────────────────────────────┘
```

---

## 8. Public Traceability Page Layout

Clean, branded page accessible without login. No navigation sidebar.

```
┌──────────────────────────────────────────┐
│  🥭 MangoCycle                            │
│  Waste Traceability                       │
├──────────────────────────────────────────┤
│                                          │
│  Batch: MW-2026-001                      │
│  Type: Mango Peel                        │
│  Source: University Agriculture Lab      │
│  Weight: 2.500 kg                        │
│  Collected: 2026-01-15                   │
│  Status: ● Dried                         │
│                                          │
├──────────────────────────────────────────┤
│  Processing Timeline                     │
│  ● Collected → ● Sorted → ● Washed →    │
│  ● Dried → ○ Ground → ...               │
│                                          │
├──────────────────────────────────────────┤
│  Linked Product                          │
│  BF-2026-001 — Biofungicide Batch 1     │
│                                          │
├──────────────────────────────────────────┤
│  🌱 Sustainability                       │
│  2.5 kg waste diverted from disposal     │
│                                          │
├──────────────────────────────────────────┤
│  Powered by MangoCycle Smart Platform    │
└──────────────────────────────────────────┘
```

---

## 9. Accessibility

| Requirement | Detail |
|---|---|
| Color contrast | WCAG AA minimum (4.5:1 for text) |
| Keyboard navigation | All interactive elements focusable and operable |
| Focus indicators | Visible focus ring on interactive elements |
| Screen reader labels | `aria-label` on icon-only buttons |
| Form labels | Every input has an associated label |
| Error announcements | Validation errors announced to screen readers |
| Alt text | Meaningful alt text on all images |

---

## 10. RTL Readiness

Even if the MVP launches in English (LTR), avoid design decisions that make RTL support difficult. Details in [28-I18N-RTL.md](./28-I18N-RTL.md).

| Rule | Detail |
|---|---|
| Use logical CSS properties | `margin-inline-start` instead of `margin-left` |
| Tailwind RTL plugin | Enable `rtl:` variants |
| Icon direction | Mirror directional icons in RTL |
| Text alignment | Use `text-start` / `text-end` instead of `text-left` / `text-right` |
| Layout direction | Use `dir="rtl"` on `<html>` element |

---

## 11. Animation Guidelines

| Type | Usage | Duration |
|---|---|---|
| Page transitions | Subtle fade-in on route change | 150–200ms |
| Card hover | Slight elevation/shadow increase | 150ms |
| Button states | Color/shadow transition | 100ms |
| Toast enter/exit | Slide in from right, fade out | 200ms / 150ms |
| Skeleton shimmer | Continuous pulse animation | 1.5s loop |
| Modal open/close | Fade + slight scale | 200ms |

> [!NOTE]
> Respect `prefers-reduced-motion` media query. Disable all non-essential animations when the user prefers reduced motion.

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [GOVERNANCE.md](./GOVERNANCE.md) | Canonical terminology |
| [09-ROUTES-AND-PAGES.md](./09-ROUTES-AND-PAGES.md) | Route definitions this spec designs for |
| [28-I18N-RTL.md](./28-I18N-RTL.md) | Detailed RTL/i18n architecture |
| [01-PRODUCT-REQUIREMENTS.md](./01-PRODUCT-REQUIREMENTS.md) | Dashboard KPI requirements |
