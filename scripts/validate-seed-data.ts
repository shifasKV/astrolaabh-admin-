/**
 * Seed Data Validation Script
 *
 * Run with: npx tsx scripts/validate-seed-data.ts
 *
 * Validates all generated test data against the business rules matrix.
 */

import { validateSeedData, SCENARIO_CATALOGUE, SEED_ORDERS, ASSUMPTIONS, UNSUPPORTED_CASES } from "../lib/mock/seed-scenarios";

function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  ASTROLAABH SEED DATA — VALIDATION REPORT");
  console.log("═══════════════════════════════════════════════════════\n");

  const results = validateSeedData();
  let totalChecks = 0;
  let passedChecks = 0;
  let failedOrders: string[] = [];

  for (const result of results) {
    const order = SEED_ORDERS.find(o => o.id === result.orderId);
    const scenario = SCENARIO_CATALOGUE[results.indexOf(result)];
    const icon = result.overallPass ? "✓" : "✗";
    const label = scenario ? `${scenario.id}: ${scenario.name}` : result.orderId;

    console.log(`${icon} ${result.orderId} — ${label}`);

    for (const check of result.checks) {
      totalChecks++;
      if (check.passed) {
        passedChecks++;
      } else {
        console.log(`    ✗ FAIL: ${check.rule} [${check.detail}]`);
      }
    }

    if (!result.overallPass) {
      failedOrders.push(result.orderId);
    }
  }

  console.log("\n───────────────────────────────────────────────────────");
  console.log(`  RESULTS: ${passedChecks}/${totalChecks} checks passed`);
  console.log(`  ORDERS:  ${results.length - failedOrders.length}/${results.length} orders fully valid`);

  if (failedOrders.length > 0) {
    console.log(`  FAILED:  ${failedOrders.join(", ")}`);
  }

  console.log("───────────────────────────────────────────────────────\n");

  console.log("SCENARIO COVERAGE:");
  console.log(`  Total scenarios defined: ${SCENARIO_CATALOGUE.length}`);
  console.log(`  Orders generated: ${SEED_ORDERS.length}`);
  console.log("");

  console.log("ASSUMPTIONS:");
  ASSUMPTIONS.forEach((a, i) => console.log(`  ${i + 1}. ${a}`));
  console.log("");

  console.log("UNSUPPORTED CASES:");
  UNSUPPORTED_CASES.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));
  console.log("");

  process.exit(failedOrders.length > 0 ? 1 : 0);
}

main();
