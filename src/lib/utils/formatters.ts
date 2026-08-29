/**
 * Locale-aware formatters per 28-I18N-RTL.md
 */

export function formatDate(
  dateInput: string | number | Date | null | undefined,
  locale = "en-US",
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return "—";
  try {
    const date =
      typeof dateInput === "string" || typeof dateInput === "number"
        ? new Date(dateInput)
        : dateInput;
    if (isNaN(date.getTime())) return "—";

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...options,
    };
    return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
  } catch {
    return "—";
  }
}

export function formatWeightKg(
  weightKg: number | null | undefined,
  locale = "en-US",
  decimals = 2
): string {
  if (weightKg === null || weightKg === undefined || isNaN(weightKg)) return "— kg";
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(weightKg);
  return `${formatted} kg`;
}

export function formatNumber(
  value: number | null | undefined,
  locale = "en-US"
): string {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercentage(
  value: number | null | undefined,
  locale = "en-US",
  decimals = 0
): string {
  if (value === null || value === undefined || isNaN(value)) return "0%";
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
  return `${formatted}%`;
}
