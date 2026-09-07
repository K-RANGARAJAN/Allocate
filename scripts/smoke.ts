// Smoke test. Runs the engine through its front door and refuses to pass on
// anything the interface could not safely render. Run before every commit.

import { CONTRACT_VERSION, type MetricKey } from "../src/contract/types";
import { defaultConfig, runSimulation } from "../src/engine/index";

// maxAgeToList is legitimately null when no upper age limit is set.
const NULLABLE_PATHS = ["outcome.config.constraints.maxAgeToList"];

function inspect(path: string, value: unknown, problems: string[]): void {
  if (value === undefined) {
    problems.push(path + " is undefined");
    return;
  }
  if (value === null) {
    if (!NULLABLE_PATHS.includes(path)) {
      problems.push(path + " is null");
    }
    return;
  }
  if (typeof value === "number") {
    if (Number.isNaN(value)) {
      problems.push(path + " is NaN");
      return;
    }
    if (!Number.isFinite(value)) {
      problems.push(path + " is Infinity");
    }
    return;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      inspect(path + "[" + i + "]", value[i], problems);
    }
    return;
  }
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      inspect(path + "." + key, child, problems);
    }
  }
}

const config = defaultConfig();
const outcome = runSimulation(config);
const problems: string[] = [];

inspect("outcome", outcome, problems);

if (outcome.contractVersion !== CONTRACT_VERSION) {
  problems.push(
    "outcome.contractVersion is " + outcome.contractVersion + ", expected " + CONTRACT_VERSION
  );
}
for (const key of ["transplants", "waitlistDeaths", "organsDiscarded"] as MetricKey[]) {
  if (outcome.metrics[key] < 0) {
    problems.push("outcome.metrics." + key + " is negative");
  }
}

if (problems.length > 0) {
  console.error("SMOKE FAILED");
  for (const problem of problems) {
    console.error("  " + problem);
  }
  process.exit(1);
}

console.log("SMOKE PASSED");
process.exit(0);
