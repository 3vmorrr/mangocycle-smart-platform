/**
 * MangoCycle Smart Platform — ESP32 Smart Bin Firmware Reference
 * 
 * Hardware:
 * - ESP32-WROOM-32
 * - HX711 Load Cell Amplifier (DOUT: GPIO 4, SCK: GPIO 5)
 * - 5kg / 10kg Strain Gauge Load Cell
 * 
 * Dependencies:
 * - HX711 by Bogdan Necula (v0.7.5+)
 * - ArduinoJson by Benoit Blanchon (v6.21.0+)
 * - WiFiClientSecure & HTTPClient (ESP32 core)
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include "HX711.h"

// ==========================================
// CONFIGURATION CONSTANTS (Use config.h in production)
// ==========================================
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// MangoCycle Ingestion Endpoint
const char* API_URL = "https://mangocycle.app/api/iot/weight";
const char* DEVICE_ID = "BIN-001";
const char* API_KEY = "YOUR_DEVICE_API_KEY_HERE"; // Provided during admin provisioning

// Hardware Pins
const int HX711_DOUT = 4;
const int HX711_SCK = 5;

// Calibration & Filtering
// NOTE: CALIBRATION_FACTOR MUST be calibrated for the physical load cell using known weights
const float CALIBRATION_FACTOR = 2280.0f;
const float WEIGHT_CHANGE_THRESHOLD_KG = 0.050f; // 50 grams threshold
const unsigned long MAX_SEND_INTERVAL_MS = 30000; // 30 seconds interval
const int MEDIAN_FILTER_SIZE = 10;
const int SAMPLE_DELAY_MS = 100;

// NTP Time Configuration for ISO 8601 Timestamps
const char* NTP_SERVER = "pool.ntp.org";
const long GMT_OFFSET_SEC = 0;
const int DAYLIGHT_OFFSET_SEC = 0;

// ==========================================
// GLOBALS
// ==========================================
HX711 scale;
float recentSamples[MEDIAN_FILTER_SIZE];
int sampleIndex = 0;
float lastSentWeightKg = 0.0f;
unsigned long lastSendTimeMs = 0;

// Helper: Calculate median of samples to reject sensor noise spikes
float getMedianWeight(float* samples, int count) {
  float sorted[MEDIAN_FILTER_SIZE];
  for (int i = 0; i < count; i++) sorted[i] = samples[i];
  for (int i = 0; i < count - 1; i++) {
    for (int j = i + 1; j < count; j++) {
      if (sorted[j] < sorted[i]) {
        float tmp = sorted[i];
        sorted[i] = sorted[j];
        sorted[j] = tmp;
      }
    }
  }
  return sorted[count / 2];
}

// Helper: Get formatted ISO 8601 timestamp string
String getIsoTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return "";
  }
  char buf[30];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buf);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[MangoCycle] ESP32 Smart Bin Starting...");

  // 1. Initialize HX711
  scale.begin(HX711_DOUT, HX711_SCK);
  scale.set_scale(CALIBRATION_FACTOR);
  scale.tare(); // Zero the scale at startup
  Serial.println("[MangoCycle] HX711 scale initialized & tared.");

  // 2. Connect Wi-Fi
  Serial.printf("[MangoCycle] Connecting to Wi-Fi SSID: %s\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[MangoCycle] Wi-Fi connected! IP: %s\n", WiFi.localIP().toString().c_str());
    configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
  } else {
    Serial.println("\n[MangoCycle] Wi-Fi connection failed. Continuing in local sensor buffer mode.");
  }
}

void sendWeightTelemetry(float weightKg) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[MangoCycle] Wi-Fi offline. Skipping transmission.");
    return;
  }

  String timestamp = getIsoTimestamp();
  if (timestamp.length() == 0) {
    Serial.println("[MangoCycle] NTP time not yet synced. Skipping transmission.");
    return;
  }

  WiFiClientSecure client;
  // In production deployment, load the server root CA certificate for full TLS verification:
  // client.setCACert(MANGO_ROOT_CA_CERTIFICATE);
  // For local development / unprovisioned domains, certificate verification can be configured in config.h.
  #ifdef USE_INSECURE_TLS_DEV_ONLY
  client.setInsecure();
  #endif

  HTTPClient https;
  if (https.begin(client, API_URL)) {
    https.addHeader("Content-Type", "application/json");
    char authHeader[100];
    snprintf(authHeader, sizeof(authHeader), "Bearer %s", API_KEY);
    https.addHeader("Authorization", authHeader);

    StaticJsonDocument<200> doc;
    doc["device_id"] = DEVICE_ID;
    doc["weight_kg"] = serialized(String(weightKg, 3));
    doc["timestamp"] = timestamp;

    String jsonPayload;
    serializeJson(doc, jsonPayload);

    Serial.printf("[MangoCycle] Sending telemetry: %s\n", jsonPayload.c_str());
    int httpCode = https.POST(jsonPayload);

    if (httpCode > 0) {
      String response = https.getString();
      Serial.printf("[MangoCycle] Response (%d): %s\n", httpCode, response.c_str());
      if (httpCode == 200) {
        lastSentWeightKg = weightKg;
        lastSendTimeMs = millis();
      } else if (httpCode == 429) {
        Serial.println("[MangoCycle] Rate limit encountered. Backing off for 60 seconds.");
        delay(60000);
      }
    } else {
      Serial.printf("[MangoCycle] HTTPS POST failed, error: %s\n", https.errorToString(httpCode).c_str());
    }
    https.end();
  }
}

void loop() {
  if (scale.is_ready()) {
    float rawWeight = scale.get_units(1);
    if (rawWeight < 0.0f) rawWeight = 0.0f; // Clamp sensor noise below zero tare

    recentSamples[sampleIndex] = rawWeight;
    sampleIndex = (sampleIndex + 1) % MEDIAN_FILTER_SIZE;

    float filteredWeight = getMedianWeight(recentSamples, MEDIAN_FILTER_SIZE);
    unsigned long now = millis();

    bool thresholdExceeded = fabs(filteredWeight - lastSentWeightKg) >= WEIGHT_CHANGE_THRESHOLD_KG;
    bool intervalElapsed = (now - lastSendTimeMs) >= MAX_SEND_INTERVAL_MS;

    if (thresholdExceeded || (intervalElapsed && filteredWeight > 0.001f)) {
      sendWeightTelemetry(filteredWeight);
    }
  }

  delay(SAMPLE_DELAY_MS);
}
