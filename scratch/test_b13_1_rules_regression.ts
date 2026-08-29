import { evaluateProcessingRules } from "../src/lib/ai/rules/processing-advisor";

function runRulesRegression() {
  console.log("================================================================================");
  console.log("🥭 MangoCycle — Processing Advisor Canonical Rules R001–R007 Regression Suite");
  console.log("================================================================================\n");

  const results: Array<{
    ruleId: string;
    condition: string;
    expectedTrigger: boolean;
    actualTrigger: boolean;
    priority: string;
    recommendation: string;
    passed: boolean;
  }> = [];

  // R001 Test: moistureStatus = 'high'
  const resR001 = evaluateProcessingRules({
    id: "test-001",
    batchCode: "MW-TEST-001",
    wasteType: "mango_peel",
    currentStatus: "collected",
    moistureStatus: "high",
  });
  const r001 = resR001.triggeredRules.find((r) => r.id === "R001");
  results.push({
    ruleId: "R001",
    condition: "moistureStatus = 'high'",
    expectedTrigger: true,
    actualTrigger: Boolean(r001),
    priority: r001?.priority || "none",
    recommendation: r001?.recommendation || "none",
    passed: Boolean(r001 && r001.priority === "high"),
  });

  // R002 Test: storageDurationDays > 7 (collectionDate = 10 days ago)
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const resR002 = evaluateProcessingRules({
    id: "test-002",
    batchCode: "MW-TEST-002",
    wasteType: "mango_peel",
    currentStatus: "collected",
    collectionDate: tenDaysAgo,
  });
  const r002 = resR002.triggeredRules.find((r) => r.id === "R002");
  results.push({
    ruleId: "R002",
    condition: "storageDurationDays > 7 (10 days ago)",
    expectedTrigger: true,
    actualTrigger: Boolean(r002),
    priority: r002?.priority || "none",
    recommendation: r002?.recommendation || "none",
    passed: Boolean(r002 && r002.priority === "high"),
  });

  // R003 Test: visualCondition = 'poor'
  const resR003 = evaluateProcessingRules({
    id: "test-003",
    batchCode: "MW-TEST-003",
    wasteType: "mango_peel",
    currentStatus: "collected",
    visualCondition: "poor",
  });
  const r003 = resR003.triggeredRules.find((r) => r.id === "R003");
  results.push({
    ruleId: "R003",
    condition: "visualCondition = 'poor'",
    expectedTrigger: true,
    actualTrigger: Boolean(r003),
    priority: r003?.priority || "none",
    recommendation: r003?.recommendation || "none",
    passed: Boolean(r003 && r003.priority === "high"),
  });

  // R004 Test: currentStatus = 'collected' AND storageDurationDays > 3 (4 days ago)
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const resR004 = evaluateProcessingRules({
    id: "test-004",
    batchCode: "MW-TEST-004",
    wasteType: "mango_peel",
    currentStatus: "collected",
    collectionDate: fourDaysAgo,
  });
  const r004 = resR004.triggeredRules.find((r) => r.id === "R004");
  results.push({
    ruleId: "R004",
    condition: "currentStatus = 'collected' AND storageDurationDays > 3",
    expectedTrigger: true,
    actualTrigger: Boolean(r004),
    priority: r004?.priority || "none",
    recommendation: r004?.recommendation || "none",
    passed: Boolean(r004 && r004.priority === "medium"),
  });

  // R005 Test: wasteType = 'mango_seed' AND currentStatus = 'dried'
  const resR005 = evaluateProcessingRules({
    id: "test-005",
    batchCode: "MW-TEST-005",
    wasteType: "mango_seed",
    currentStatus: "dried",
  });
  const r005 = resR005.triggeredRules.find((r) => r.id === "R005");
  results.push({
    ruleId: "R005",
    condition: "wasteType = 'mango_seed' AND currentStatus = 'dried'",
    expectedTrigger: true,
    actualTrigger: Boolean(r005),
    priority: r005?.priority || "none",
    recommendation: r005?.recommendation || "none",
    passed: Boolean(r005 && r005.priority === "medium"),
  });

  // R006 Test: currentStatus = 'ground'
  const resR006 = evaluateProcessingRules({
    id: "test-006",
    batchCode: "MW-TEST-006",
    wasteType: "mango_peel",
    currentStatus: "ground",
  });
  const r006 = resR006.triggeredRules.find((r) => r.id === "R006");
  results.push({
    ruleId: "R006",
    condition: "currentStatus = 'ground'",
    expectedTrigger: true,
    actualTrigger: Boolean(r006),
    priority: r006?.priority || "none",
    recommendation: r006?.recommendation || "none",
    passed: Boolean(r006 && r006.priority === "low"),
  });

  // R007 Test: currentStatus = 'production'
  const resR007 = evaluateProcessingRules({
    id: "test-007",
    batchCode: "MW-TEST-007",
    wasteType: "mango_peel",
    currentStatus: "production",
  });
  const r007 = resR007.triggeredRules.find((r) => r.id === "R007");
  results.push({
    ruleId: "R007",
    condition: "currentStatus = 'production'",
    expectedTrigger: true,
    actualTrigger: Boolean(r007),
    priority: r007?.priority || "none",
    recommendation: r007?.recommendation || "none",
    passed: Boolean(r007 && r007.priority === "low"),
  });

  console.table(results);

  const allPassed = results.every((r) => r.passed);
  if (!allPassed) {
    console.error("❌ Some canonical rules failed regression!");
    process.exit(1);
  }
  console.log("🎉 ALL 7/7 CANONICAL PROCESSING ADVISOR RULES (R001–R007) PASSED REGRESSION!\n");
}

runRulesRegression();
