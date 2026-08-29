# MangoCycle Smart Platform — Future AI Roadmap

> **Document Name:** Future AI Roadmap  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 02-MVP-SCOPE.md, 15-AI-ARCHITECTURE.md

---

## 1. Purpose

This document describes future AI capabilities that are **not** part of the MVP. These require labeled datasets, historical data, or specialist validation.

---

## 2. Future Features

### 2.1 Custom Waste Quality Classification

| Attribute | Value |
|---|---|
| **Requirement** | Labeled dataset of mango waste images with quality grades |
| **Approach** | Fine-tuned image classification model |
| **Prerequisite** | 500+ labeled images minimum, scientific team validation |
| **Data Collection** | MVP platform collects images via AI Waste Analyzer |

### 2.2 Yield Prediction

| Attribute | Value |
|---|---|
| **Requirement** | Historical data linking waste inputs to product yields |
| **Approach** | Regression model (waste type, weight, condition → expected yield) |
| **Prerequisite** | 50+ completed waste-to-product cycles with yield data |
| **Data Collection** | MVP platform tracks product quantities and linked waste |

### 2.3 Disease / Fungal Species Detection

| Attribute | Value |
|---|---|
| **Requirement** | Labeled image dataset with identified species |
| **Approach** | Specialized image classification |
| **Prerequisite** | Domain expert labeling, validation study |
| **Risk** | High — medical/agricultural claim requires rigorous validation |

### 2.4 Automated TEM/XRD/FTIR Interpretation

| Attribute | Value |
|---|---|
| **Requirement** | Specialist-labeled spectroscopy/microscopy data |
| **Approach** | Domain-specific analysis models |
| **Prerequisite** | Collaboration with material science / chemistry experts |
| **Risk** | Very high complexity; requires peer-reviewed validation |

### 2.5 Advanced ML Anomaly Detection

| Attribute | Value |
|---|---|
| **Requirement** | 6+ months of historical processing data |
| **Approach** | Isolation Forest, Autoencoders, or similar |
| **Prerequisite** | Sufficient data volume with known anomaly examples |
| **Data Collection** | MVP platform collects structured processing data |

### 2.6 Predictive Analytics

| Attribute | Value |
|---|---|
| **Requirement** | Historical time-series data |
| **Approach** | Time-series forecasting (waste collection trends, processing demand) |
| **Prerequisite** | 6+ months of consistent data collection |

---

## 3. Data Collection Strategy

The MVP platform is designed to collect clean, structured data that enables these future models:

| Future Feature | Data Collected by MVP |
|---|---|
| Quality Classification | Waste images + AI visual assessments |
| Yield Prediction | Waste weights + product quantities + processing history |
| Anomaly Detection | Processing durations + weight changes + stage timelines |
| Predictive Analytics | Timestamped waste collection and processing data |

---

## 4. Technology Considerations

When custom ML models are developed:

| Decision | Consideration |
|---|---|
| **Language** | Python (ML ecosystem) — separate service from TypeScript platform |
| **Framework** | PyTorch, TensorFlow, or scikit-learn depending on task |
| **Deployment** | Separate ML service with API; platform calls via HTTP |
| **Integration** | Extend AI abstraction layer to support custom model endpoints |

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [02-MVP-SCOPE.md](./02-MVP-SCOPE.md) | Future scope definition |
| [15-AI-ARCHITECTURE.md](./15-AI-ARCHITECTURE.md) | Extensible AI abstraction layer |
| [GOVERNANCE.md](./GOVERNANCE.md) | Scientific language constraints |
