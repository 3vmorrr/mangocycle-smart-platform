import { sanitizeCsvCell, generateCsvContent } from "../src/lib/utils/csv";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${msg}`);
}

function runCsvSecurityTests() {
  console.log("=== B10 CSV Formula Injection & Escaping Security Suite ===\n");

  // ==========================================
  // 1. DANGEROUS FORMULA PREFIX ESCAPING
  // ==========================================
  console.log("--- 1. Spreadsheet Formula Injection Defense ---");

  const dangerousInputs = [
    { input: "=1+1", expected: "'=1+1", desc: "Equals sign formula" },
    { input: "=SUM(A1:A10)", expected: "'=SUM(A1:A10)", desc: "SUM function formula" },
    { input: "+cmd|' /C calc'!A0", expected: "'+cmd|' /C calc'!A0", desc: "Plus sign DDE execution" },
    { input: "-20+30", expected: "'-20+30", desc: "Minus sign formula" },
    { input: "@SUM(1+1)", expected: "'@SUM(1+1)", desc: "At sign formula" },
    { input: "\t=HYPERLINK()", expected: "'\t=HYPERLINK()", desc: "Tab character prefix" },
    { input: "\r=1+1", expected: "\"'\\r=1+1\"", desc: "Carriage return prefix" },
  ];

  for (const test of dangerousInputs) {
    const sanitized = sanitizeCsvCell(test.input);
    assert(
      sanitized.startsWith("'") || sanitized.startsWith("\"'"),
      `Sanitized ${test.desc} (${test.input}) with leading apostrophe: ${sanitized}`
    );
  }

  // ==========================================
  // 2. SAFE LEGITIMATE VALUES PRESERVED
  // ==========================================
  console.log("\n--- 2. Legitimate Values Handling ---");

  assert(sanitizeCsvCell("Mango Peel") === "Mango Peel", "Normal string passes cleanly");
  assert(sanitizeCsvCell(50.5) === "50.5", "Numeric values formatted cleanly");
  assert(sanitizeCsvCell("MW-2026-LIVE8") === "MW-2026-LIVE8", "Batch codes pass without modification");
  assert(sanitizeCsvCell(null) === "", "Null converts to empty string");
  assert(sanitizeCsvCell(undefined) === "", "Undefined converts to empty string");

  // ==========================================
  // 3. COMMA, QUOTE, AND NEWLINE WRAPPING
  // ==========================================
  console.log("\n--- 3. Special Characters Escaping ---");

  assert(
    sanitizeCsvCell("University Agriculture Lab, Sector 4") === '"University Agriculture Lab, Sector 4"',
    "Commas wrapped in double quotes"
  );
  assert(
    sanitizeCsvCell('Special "Premium" Mango Peel') === '"Special ""Premium"" Mango Peel"',
    "Embedded quotes escaped as double double-quotes"
  );
  assert(
    sanitizeCsvCell("Line 1\nLine 2") === '"Line 1\nLine 2"',
    "Newlines wrapped in double quotes"
  );

  // ==========================================
  // 4. FULL DATASET GENERATION & UTF-8 BOM
  // ==========================================
  console.log("\n--- 4. Full Table CSV Generation & UTF-8 BOM ---");

  const headers = ["Batch Code", "Weight (kg)", "Notes"];
  const rows = [
    ["MW-2026-001", 50, "Normal intake"],
    ["=MALICIOUS_CODE", 20, "Contains, comma"],
    ["MW-2026-003", 30, 'Has "quotes" inside'],
  ];

  const csv = generateCsvContent(headers, rows);
  assert(csv.startsWith("\uFEFF"), "CSV starts with UTF-8 BOM for Excel/Unicode compatibility");
  assert(csv.includes("MW-2026-001,50,Normal intake"), "Normal row formatted correctly");
  assert(csv.includes("'=MALICIOUS_CODE,20,\"Contains, comma\""), "Malicious formula neutralized and comma wrapped");
  assert(csv.includes('MW-2026-003,30,"Has ""quotes"" inside"'), "Quotes escaped correctly in row");

  console.log("\n==========================================");
  console.log("✅ ALL CSV SECURITY & ESCAPING TESTS PASSED!");
  console.log("==========================================");
}

runCsvSecurityTests();
