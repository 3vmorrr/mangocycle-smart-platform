/**
 * URL and Environment helper for QR Code generation and public links
 * per 13-QR-SYSTEM.md §3.3 and 29-ENVIRONMENT-CONFIG.md
 */

export function getAppBaseUrl(): string {
  // 1. Environment variable configured for production / deployment
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  // 2. Client-side browser origin fallback (for local demo / preview)
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  // 3. Documented canonical default
  return "https://mangocycle.app";
}

export function getWasteTraceabilityUrl(batchCode: string): string {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/trace/waste/${batchCode.trim().toUpperCase()}`;
}

export function getProductTraceabilityUrl(batchCode: string): string {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/trace/product/${batchCode.trim().toUpperCase()}`;
}
