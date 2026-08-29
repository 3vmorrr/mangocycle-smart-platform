# MangoCycle Smart Platform — ESP32 Integration

> **Document Name:** ESP32 Integration  
> **Version:** 0.1  
> **Status:** Draft  
> **Last Updated:** 2026-08-28  
> **Owner:** MangoCycle Project Team  
> **Related Documents:** GOVERNANCE.md, 22-IOT-ARCHITECTURE.md, 24-API-SPECIFICATION.md

---

## 1. Purpose

This document specifies the ESP32 firmware requirements for the Smart Bin IoT device. The firmware is written in C++ using the Arduino framework.

---

## 2. Firmware Overview

| Attribute | Value |
|---|---|
| Language | C++ |
| Framework | Arduino |
| IDE | Arduino IDE or PlatformIO |
| Target | ESP32-WROOM-32 |
| Libraries | WiFi, HTTPClient, HX711, ArduinoJson |

---

## 3. Firmware Logic

```
Setup:
  1. Initialize serial for debugging
  2. Connect to Wi-Fi
  3. Initialize HX711
  4. Calibrate load cell (tare)

Loop:
  1. Read weight from HX711
  2. Apply median filter (last 10 readings)
  3. Check if weight changed > threshold since last send
  4. If yes (or max interval elapsed):
     a. Build JSON payload
     b. POST to /api/iot/weight via HTTPS
     c. Handle response
     d. Update last_sent values
  5. Delay between readings (100ms)
```

---

## 4. Configuration Constants

```cpp
// Wi-Fi
const char* WIFI_SSID = "...";       // Set during setup
const char* WIFI_PASSWORD = "...";   // Set during setup

// API
const char* API_URL = "https://mangocycle.app/api/iot/weight";
const char* API_KEY = "...";          // Provided at device registration
const char* DEVICE_ID = "BIN-001";

// Thresholds
const float WEIGHT_CHANGE_THRESHOLD = 0.050;  // 50 grams
const unsigned long MAX_SEND_INTERVAL = 30000; // 30 seconds
const int READING_DELAY_MS = 100;
const int MEDIAN_FILTER_SIZE = 10;

// HX711 pins
const int HX711_DOUT = 4;
const int HX711_SCK = 5;
```

> [!NOTE]
> Credentials should be stored in a separate `config.h` file that is `.gitignore`'d. Never commit API keys to version control.

---

## 5. HTTPS Requirement

The ESP32 must use HTTPS, not HTTP. Include the server's root CA certificate in the firmware for TLS verification, or use `setInsecure()` for MVP prototyping (document the security trade-off).

---

## 6. Error Handling

| Scenario | Behavior |
|---|---|
| Wi-Fi disconnected | Attempt reconnection every 5 seconds; buffer last reading |
| API returns 401 | Log error; likely invalid API key |
| API returns 429 | Back off sending for 60 seconds |
| API returns 5xx | Retry after 10 seconds, max 3 retries |
| HX711 not responding | Log error; blink error LED |

---

## 7. LED Indicators (Optional)

| State | LED |
|---|---|
| Wi-Fi connected | Solid green |
| Sending data | Blink blue |
| Error | Blink red |
| Idle | Off |

---

## Dependencies & Related Documents

| Document | Relationship |
|---|---|
| [22-IOT-ARCHITECTURE.md](./22-IOT-ARCHITECTURE.md) | System-level IoT architecture |
| [24-API-SPECIFICATION.md](./24-API-SPECIFICATION.md) | API endpoint contract |
| [08-SECURITY.md](./08-SECURITY.md) | IoT security, HTTPS requirement |
