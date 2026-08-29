/**
 * CSV Generation & Sanitization Utility
 * 
 * SECURITY CONTRACT per 08-SECURITY.md §7.3 & §10:
 * - Sanitizes cells to prevent CSV formula injection (cells starting with '=', '+', '-', '@' prepended with "'").
 * - Escapes double quotes and commas.
 * - Prepends UTF-8 BOM (\uFEFF) for Arabic/Excel UTF-8 compatibility.
 */

export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let str = String(value).trim();

  // CSV Formula Injection Prevention:
  // If the cell begins with dangerous spreadsheet formula characters, escape it with a leading apostrophe.
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // If the string contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function generateCsvContent(
  headers: string[],
  rows: (string | number | null | undefined)[][]
): string {
  const headerLine = headers.map(sanitizeCsvCell).join(",");
  const rowLines = rows.map((row) => row.map(sanitizeCsvCell).join(","));
  return "\uFEFF" + [headerLine, ...rowLines].join("\r\n");
}

export function downloadCsvFile(filename: string, csvContent: string): void {
  // Ensure safe filename
  const safeName = filename.toLowerCase().replace(/[^a-z0-9-_.]/g, "-");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", safeName.endsWith(".csv") ? safeName : `${safeName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
