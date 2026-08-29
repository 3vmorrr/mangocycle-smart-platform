# MangoCycle ESP32 Smart Bin Firmware

## Hardware Wiring
| ESP32 Pin | HX711 Module Pin |
|---|---|
| GPIO 4 | DOUT (Data Out) |
| GPIO 5 | SCK (Serial Clock) |
| 3.3V | VCC |
| GND | GND |

## Calibration Procedure
1. Upload firmware with `CALIBRATION_FACTOR = 1.0`.
2. Tare scale with no load.
3. Place a known calibration weight (e.g. 1.000 kg).
4. Note the raw reading and calculate: `NEW_FACTOR = RAW_READING / KNOWN_WEIGHT_KG`.
5. Update `CALIBRATION_FACTOR` in firmware and re-upload.

## Security Configuration
- Create a `config.h` file (ignored by `.gitignore`) to store `WIFI_SSID`, `WIFI_PASSWORD`, and `API_KEY`.
- Never commit actual device credentials to version control.
- In production, load the server root CA certificate for full TLS verification.
