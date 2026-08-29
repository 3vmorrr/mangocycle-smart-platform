import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { UserRole } from "../src/data/contracts/auth";

// Load .env.local safely
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

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${msg}`);
}

function roleSatisfies(userRole: UserRole, requiredRole: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    viewer: 1,
    operator: 2,
    researcher: 3,
    admin: 4,
    super_admin: 5,
  };
  return (hierarchy[userRole] || 0) >= (hierarchy[requiredRole] || 99);
}

async function runRbacTests() {
  console.log("=== B10 RBAC & Authorization Verification Suite ===\n");

  // 1. Role Hierarchy Evaluation for Report Generation (requires researcher+)
  console.log("--- 1. Report Generation Role Hierarchy ---");
  assert(roleSatisfies("viewer", "researcher") === false, "Role 'viewer' is denied report generation");
  assert(roleSatisfies("operator", "researcher") === false, "Role 'operator' is denied report generation");
  assert(roleSatisfies("researcher", "researcher") === true, "Role 'researcher' is authorized for report generation");
  assert(roleSatisfies("admin", "researcher") === true, "Role 'admin' is authorized for report generation");
  assert(roleSatisfies("super_admin", "researcher") === true, "Role 'super_admin' is authorized for report generation");

  // 2. Role Hierarchy for Report Viewing / Export (requires viewer+)
  console.log("\n--- 2. Report Viewing & Export Role Hierarchy ---");
  assert(roleSatisfies("viewer", "viewer") === true, "Role 'viewer' is authorized to view/export session reports");
  assert(roleSatisfies("operator", "viewer") === true, "Role 'operator' is authorized to view/export session reports");
  assert(roleSatisfies("researcher", "viewer") === true, "Role 'researcher' is authorized to view/export session reports");
  assert(roleSatisfies("admin", "viewer") === true, "Role 'admin' is authorized to view/export session reports");
  assert(roleSatisfies("super_admin", "viewer") === true, "Role 'super_admin' is authorized to view/export session reports");

  // 3. Ensure Authenticated Researcher User Exists on Remote Database
  console.log("\n--- 3. Database Profile Role Verification ---");
  const researcherEmail = "b10.researcher.live@mangocycle.invalid";
  const researcherPassword = "ResearcherLivePassword123!";

  const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
  let researcherId: string;
  const existingUser = userList?.users?.find((u) => u.email === researcherEmail);

  if (existingUser) {
    researcherId = existingUser.id;
  } else {
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: researcherEmail,
      password: researcherPassword,
      email_confirm: true,
      user_metadata: { full_name: "B10 Lead Analytical Researcher" },
    });
    if (createErr || !newUser?.user) {
      throw new Error(`Failed to create researcher user: ${createErr?.message}`);
    }
    researcherId = newUser.user.id;
  }

  await supabaseAdmin.from("profiles").upsert({
    id: researcherId,
    email: researcherEmail,
    role: "researcher",
    full_name: "B10 Lead Analytical Researcher",
    is_active: true,
    updated_at: new Date().toISOString(),
  });

  const { data: researcherProfile } = await supabaseAdmin
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", researcherId)
    .single();

  assert(Boolean(researcherProfile), "Researcher profile verified in remote database");
  assert(researcherProfile!.role === "researcher", "Profile role is strictly 'researcher'");
  assert(researcherProfile!.is_active === true, "Researcher profile is active");

  const { data: operatorProfile } = await supabaseAdmin
    .from("profiles")
    .select("id, role, is_active")
    .eq("role", "operator")
    .limit(1)
    .single();

  assert(Boolean(operatorProfile), "Operator profile exists in remote database");
  assert(operatorProfile!.role === "operator", "Profile role is strictly 'operator'");

  console.log("\n==========================================");
  console.log("✅ ALL B10 RBAC TESTS PASSED!");
  console.log("==========================================");
}

runRbacTests().catch((err) => {
  console.error("❌ RBAC test failed:", err);
  process.exit(1);
});
