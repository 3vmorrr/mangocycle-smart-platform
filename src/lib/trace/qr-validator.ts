/**
 * Validates a scanned QR payload or URL and extracts a safe internal route.
 * Rejects any external or malformed URLs to prevent open redirects.
 */
export function validateAndResolveQrPayload(
  payload: string,
  appUrl?: string
): { isValid: boolean; targetRoute?: string; error?: string } {
  if (!payload || typeof payload !== "string") {
    return { isValid: false, error: "Empty or invalid QR code payload." };
  }

  const raw = payload.trim();

  // 1. Direct path check (e.g. "/trace/waste/MW-2026-001" or "/trace/product/BF-2026-001")
  if (raw.startsWith("/trace/waste/") || raw.startsWith("/trace/product/")) {
    const code = raw.split("/")[3]?.trim().toUpperCase();
    if (code && /^[A-Z0-9-]+$/.test(code)) {
      const type = raw.startsWith("/trace/waste/") ? "waste" : "product";
      return { isValid: true, targetRoute: `/trace/${type}/${code}` };
    }
    return { isValid: false, error: "Malformed traceability path in QR code." };
  }

  // 2. Full URL check
  try {
    const parsed = new URL(raw);
    const pathname = parsed.pathname;

    // Check if the URL has a valid trace path
    if (pathname.startsWith("/trace/waste/") || pathname.startsWith("/trace/product/")) {
      // Trusted origins derived strictly from current browser origin and configured NEXT_PUBLIC_APP_URL
      const allowedHosts = new Set<string>();
      if (typeof window !== "undefined" && window.location?.host) {
        allowedHosts.add(window.location.host.toLowerCase());
      }
      const configUrl = appUrl || (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_APP_URL : undefined);
      if (configUrl) {
        try {
          allowedHosts.add(new URL(configUrl).host.toLowerCase());
        } catch {
          // ignore invalid url configuration
        }
      }

      // Verify host is in authorized origins set
      if (allowedHosts.size > 0 && allowedHosts.has(parsed.host.toLowerCase())) {
        const parts = pathname.split("/");
        const code = parts[3]?.trim().toUpperCase();
        if (code && /^[A-Z0-9-]+$/.test(code)) {
          const type = pathname.startsWith("/trace/waste/") ? "waste" : "product";
          return { isValid: true, targetRoute: `/trace/${type}/${code}` };
        }
      }
    }

    return {
      isValid: false,
      error: "External or unrecognized URL. Scanned code does not belong to the MangoCycle platform.",
    };
  } catch {
    // 3. Fallback: Check if payload is a raw batch code (e.g. "MW-2026-001" or "BF-2026-001")
    const upper = raw.toUpperCase();
    if (upper.startsWith("MW-") && /^[A-Z0-9-]+$/.test(upper)) {
      return { isValid: true, targetRoute: `/trace/waste/${upper}` };
    }
    if (upper.startsWith("BF-") && /^[A-Z0-9-]+$/.test(upper)) {
      return { isValid: true, targetRoute: `/trace/product/${upper}` };
    }

    return {
      isValid: false,
      error: "Unrecognized QR code format. Expected a MangoCycle trace URL or valid batch identifier.",
    };
  }
}
