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

async function runSecurityAudit() {
  console.log("=== B12.0.1 Remote Security Checks ===\n");

  // 1. Anon direct INSERT into audit_logs
  const { error: anonInsertErr } = await supabaseAnon.from("audit_logs").insert({
    action: "forged.event",
    entity_type: "system",
  });
  console.log("1. Anon direct INSERT into audit_logs:", anonInsertErr ? `BLOCKED (${anonInsertErr.message})` : "FAILED TO BLOCK");

  // 2. Anon direct SELECT from audit_logs
  const { data: anonSelectData, error: anonSelectErr } = await supabaseAnon
    .from("audit_logs")
    .select("id, action")
    .limit(5);
  console.log("2. Anon direct SELECT from audit_logs:", anonSelectData && anonSelectData.length > 0 ? "LEAKED" : "BLOCKED / EMPTY");

  // 3. Service role direct SELECT from audit_logs
  const { data: adminSelectData, error: adminSelectErr } = await supabaseAdmin
    .from("audit_logs")
    .select("id, action, entity_type, created_at")
    .limit(3);
  console.log("3. Service role direct SELECT from audit_logs:", adminSelectErr ? `ERROR (${adminSelectErr.message})` : `SUCCESS (${adminSelectData?.length} rows)`);

  // 4. Test is_active=false impact on current_user_role
  console.log("\n--- 4. Active user vs Deactivated user check in DB ---");
  const { data: activeProfiles } = await supabaseAdmin
    .from("profiles")
    .select("id, email, role, is_active")
    .limit(3);
  console.log("Sample active profiles in DB:", activeProfiles?.map(p => ({ role: p.role, active: p.is_active })));
}

runSecurityAudit().catch(console.error);
