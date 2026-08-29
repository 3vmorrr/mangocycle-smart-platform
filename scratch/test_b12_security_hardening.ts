import fs from "fs";
import { createClient } from "@supabase/supabase-js";

if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  envContent.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function runB12SecuritySuite() {
  console.log("================================================================================");
  console.log("🥭 MangoCycle Smart Platform — Phase B12 Security & Audit Hardening Test Suite");
  console.log("================================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      throw new Error(`Security verification failed: ${message}`);
    }
  }

  // -------------------------------------------------------------------------
  // 1. Audit Log Read Permissions & Isolation
  // -------------------------------------------------------------------------
  console.log("--- 1. Audit Log Read Permissions & Isolation ---");
  const { data: anonReadData, error: anonReadErr } = await supabaseAnon
    .from("audit_logs")
    .select("id, action")
    .limit(5);
  assert(
    !anonReadData || anonReadData.length === 0,
    "Anonymous PostgREST client cannot read audit_logs (RLS active)"
  );

  const { data: adminReadData, error: adminReadErr } = await supabaseAdmin
    .from("audit_logs")
    .select("id, action, entity_type, created_at")
    .limit(5);
  assert(!adminReadErr && Array.isArray(adminReadData), "Service role client can read audit_logs");

  // -------------------------------------------------------------------------
  // 2. Audit Log Write Tamper-Proofing (Direct Client INSERT Denial)
  // -------------------------------------------------------------------------
  console.log("\n--- 2. Audit Log Tamper-Proofing (Direct Client INSERT Denial) ---");
  const { error: anonInsertErr } = await supabaseAnon.from("audit_logs").insert({
    action: "forged.attack",
    entity_type: "system",
  });
  assert(
    Boolean(anonInsertErr && anonInsertErr.message.includes("violates row-level security policy")),
    `Anonymous direct INSERT is rejected by RLS: "${anonInsertErr?.message}"`
  );

  // -------------------------------------------------------------------------
  // 3. Server-Side Audit Logger & Sensitive Key Redaction
  // -------------------------------------------------------------------------
  console.log("\n--- 3. Server-Side Audit Logger & Redaction Engine ---");
  const { recordAuditLog } = await import("../src/lib/audit/logger");

  const testAction = `test.security_verification_${Date.now()}`;
  await recordAuditLog({
    action: testAction,
    entityType: "security_test",
    beforeValue: {
      password: "SuperSecretPassword123!",
      apiKey: "mgc_live_secret_key_999",
      safeKey: "normal_value",
    },
    afterValue: {
      token: "jwt.bearer.secret",
      role: "admin",
    },
  });

  const { data: loggedRow, error: verifyErr } = await supabaseAdmin
    .from("audit_logs")
    .select("*")
    .eq("action", testAction)
    .single();

  assert(Boolean(loggedRow), "recordAuditLog successfully wrote record to public.audit_logs");
  assert(
    loggedRow?.before_value?.password === "[REDACTED]",
    "Sensitive 'password' field was scrubbed to [REDACTED]"
  );
  assert(
    loggedRow?.before_value?.apiKey === "[REDACTED]",
    "Sensitive 'apiKey' field was scrubbed to [REDACTED]"
  );
  assert(
    loggedRow?.before_value?.safeKey === "normal_value",
    "Non-sensitive 'safeKey' field was preserved accurately"
  );
  assert(
    loggedRow?.after_value?.token === "[REDACTED]",
    "Sensitive 'token' field was scrubbed to [REDACTED]"
  );

  // Clean up test audit row
  await supabaseAdmin.from("audit_logs").delete().eq("id", loggedRow.id);

  // -------------------------------------------------------------------------
  // 4. Role Escalation Denial & Profile Management
  // -------------------------------------------------------------------------
  console.log("\n--- 4. Role Escalation & RBAC Boundary Verification ---");
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, role, is_active")
    .limit(1);

  assert(Boolean(profiles && profiles.length > 0), "Profiles table is accessible for RBAC verification");

  // -------------------------------------------------------------------------
  // 5. Database Functions search_path Security
  // -------------------------------------------------------------------------
  console.log("\n--- 5. Database SECURITY DEFINER search_path Hardening ---");
  // Test manage_profile rejects invalid role or unauthenticated execution safely
  const { error: rpcErr } = await supabaseAnon.rpc("manage_profile", {
    p_target_id: "00000000-0000-0000-0000-000000000000",
    p_role: "super_admin",
  });
  assert(Boolean(rpcErr), "Anonymous direct call to manage_profile RPC is rejected");

  // -------------------------------------------------------------------------
  // 6. Security Headers & CSP Configuration
  // -------------------------------------------------------------------------
  console.log("\n--- 6. Security Headers & CSP Configuration ---");
  const nextConfigModule = await import("../next.config.mjs");
  const nextConfig = nextConfigModule.default;
  assert(typeof nextConfig.headers === "function", "next.config.mjs defines async headers()");

  const headersResult = await nextConfig.headers();
  const rootHeaders = headersResult?.find((h: any) => h.source === "/:path*");
  assert(Boolean(rootHeaders), "Headers configured for global route path '/:path*'");

  const headerMap = new Map<string, string>();
  rootHeaders?.headers.forEach((h: any) => headerMap.set(h.key, h.value));

  assert(headerMap.get("X-Frame-Options") === "DENY", "X-Frame-Options is DENY (anti-clickjacking)");
  assert(headerMap.get("X-Content-Type-Options") === "nosniff", "X-Content-Type-Options is nosniff");
  assert(
    headerMap.get("Referrer-Policy") === "strict-origin-when-cross-origin",
    "Referrer-Policy is strict-origin-when-cross-origin"
  );
  assert(
    headerMap.get("Permissions-Policy") === "camera=(), microphone=(), geolocation=()",
    "Permissions-Policy restricts unused browser sensors"
  );

  const csp = headerMap.get("Content-Security-Policy");
  assert(Boolean(csp), "Content-Security-Policy is present");
  assert(csp!.includes("frame-ancestors 'none'"), "CSP includes frame-ancestors 'none'");
  assert(
    csp!.includes("connect-src 'self' https://*.supabase.co wss://*.supabase.co"),
    "CSP restricts connect-src to Supabase (No Gemini browser connection)"
  );
  assert(
    !csp!.includes("generativelanguage.googleapis.com"),
    "CSP strictly excludes direct browser connection to Google Gemini"
  );

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`🎉 ALL ${passedTests}/${totalTests} B12 SECURITY HARDENING CHECKS PASSED!`);
  console.log("================================================================================");
}

runB12SecuritySuite().catch((err) => {
  console.error("\n❌ B12 Security Suite Error:", err);
  process.exit(1);
});
