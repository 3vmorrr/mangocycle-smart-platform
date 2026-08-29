# MangoCycle Smart Platform — IoT Architecture

> **Document Name:** IoT Architecture  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 05-DATABASE-SCHEMA.md, 08-SECURITY.md, 23-ESP32-INTEGRATION.md, 24-API-SPECIFICATION.md

---

## 1. Purpose

This document defines the IoT integration architecture for Smart Bins. IoT is an **optional, non-blocking** feature (P4). The platform must function fully without IoT hardware.

---

## 2. System Overview

```mermaid
graph LR
    A["Mango Waste"] --> B["Load Cell"]
    B --> C["HX711 ADC"]
    C --> D["ESP32"]
    D -->|"Wi-Fi / HTTPS"| E["POST /api/iot/weight"]
    E --> F["Validate + Store"]
    F --> G["Database"]
    G --> H["Dashboard"]
```

---

## 3. Hardware Components

| Component | Role | Model (Suggested) |
|---|---|---|
| ESP32 | Microcontroller with Wi-Fi | ESP32-WROOM-32 |
| HX711 | Load cell amplifier / ADC | HX711 module |
| Load Cell | Weight sensor | 5 kg or 10 kg strain gauge |
| Power | Power supply | USB or battery pack |

---

## 4. Data Transmission Strategy

### 4.1 When to Send

Do not send every raw sensor reading. Use one of:

| Strategy | Description | Recommended |
|---|---|---|
| Threshold-based | Send when weight changes > 50g from last sent value | ✅ Primary |
| Interval-based | Send every 30 seconds regardless of change | Fallback |
| Combined | Threshold OR max interval (whichever comes first) | Optimal |

### 4.2 Payload

```json
{
  "device_id": "BIN-001",
  "weight_kg": 0.735,
  "timestamp": "2026-01-15T14:30:00Z"
}
```

### 4.3 Sensor Smoothing

Apply before transmission to reduce noise:

| Method | Detail |
|---|---|
| Median Filter | Take median of last 5–10 readings |
| Moving Average | Average of last 5–10 readings |

Recommended: **Median filter** (more robust to spike noise).

---

## 5. API Endpoint

`POST /api/iot/weight` — See [24-API-SPECIFICATION.md](./24-API-SPECIFICATION.md) for full contract.

Authentication: API key in `Authorization: Bearer {key}` header.

Validation:
- Device ID exists and is active
- API key hash matches
- Weight in range 0–1000 kg
- Timestamp within ±5 minutes of server time
- Rate limit: 60 requests/minute/device

---

## 6. Device Management

| Feature | Detail |
|---|---|
| Registration | Admin creates device in UI, receives one-time API key |
| Dashboard | List of devices with last-seen status |
| Detail page | Device info, weight reading history, last-seen timestamp |
| Deactivation | Admin can deactivate a device (API key stops working) |
| Key rotation | Admin can regenerate API key (old key invalidated) |

---

## 7. Platform Behavior Without IoT

| Component | With IoT | Without IoT |
|---|---|---|
| Weight entry | Pre-filled from Smart Bin reading | Manual input field |
| Dashboard | Shows Smart Bin status section | Section hidden or shows "No devices" |
| Waste Batch creation | Optional IoT weight link | Standard manual creation |
| Navigation | IoT menu item visible | IoT menu item hidden or grayed |

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [23-ESP32-INTEGRATION.md](./23-ESP32-INTEGRATION.md) | ESP32 firmware specification |
| [05-DATABASE-SCHEMA.md](./05-DATABASE-SCHEMA.md) | `iot_devices`, `iot_weight_readings` tables |
| [08-SECURITY.md](./08-SECURITY.md) | IoT security requirements |
| [24-API-SPECIFICATION.md](./24-API-SPECIFICATION.md) | IoT weight API contract |
