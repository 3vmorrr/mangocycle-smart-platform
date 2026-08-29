# MangoCycle Smart Platform — Anomaly Detection

> **Document Name:** Anomaly Detection  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 05-DATABASE-SCHEMA.md, 02-MVP-SCOPE.md

---

## 1. Purpose

This document specifies the simple statistical anomaly detection system for the MVP. This is **not** a trained ML model — it uses basic statistical methods to flag outliers.

---

## 2. Feature Summary

| Attribute | Value |
|---|---|
| Priority | P3 |
| Label | "Statistical anomaly detection" |
| Methods | IQR, Z-score, threshold-based rules |
| ML Model | **No** — pure statistical calculations |

---

## 3. Detection Methods

### 3.1 IQR (Interquartile Range)

Values outside `[Q1 - 1.5×IQR, Q3 + 1.5×IQR]` are flagged as outliers.

### 3.2 Z-Score

Values with `|z| > 2` (or configurable threshold) are flagged. Suitable when data is approximately normally distributed.

### 3.3 Threshold-Based Rules

Fixed or configurable thresholds defined in `app_settings`:

| Alert | Condition | Default Threshold |
|---|---|---|
| Long processing duration | Days from first stage to current > threshold | 14 days (TBD by scientific team) |
| Unusual weight | `weight_kg` is an IQR outlier vs recent batches | Statistical |
| Extended storage | `storage_duration_days` > threshold | 7 days (TBD) |

---

## 4. Implementation

Anomaly checks run as server-side calculations when the Dashboard or batch detail loads. Results are displayed as alert badges or a "Requiring Attention" section.

---

## 5. Scientific Labeling

> [!IMPORTANT]
> This feature must be described as **"Statistical anomaly detection"** — not as a trained ML model, AI diagnosis, or validated quality assessment.

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [GOVERNANCE.md](./GOVERNANCE.md) | Scientific language constraints |
| [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md) | Source data for calculations |
| [37-OPEN-QUESTIONS.md](./37-OPEN-QUESTIONS.md) | Threshold values pending scientific input |
