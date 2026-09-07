// Gate A. Runs three single-weight policies at the same seed and prints every
// metric side by side. The project's whole thesis is that no policy wins on
// everything. If one does, there is no trade-off to show and nothing to build.
// Run with: npx tsx scripts/conflict-check.ts

import type { Outcome } from "../src/contract/types";
import { defaultConfig, runSimulation } from "../src/engine/index";

const COLUMN = 16;

function pad(text: string, width: number): string {
  let out = text;
  while (out.length < width) {
    out = out + " ";
  }
  return out;
}

function run(label: string, urgency: number, lifeYears: number, waitingTime: number): Outcome {
  const config = defaultConfig();
  config.weights = { urgency, lifeYears, waitingTime };
  const outcome = runSimulation(config);
  console.log("  " + label + " ran in " + outcome.meta.runtimeMs + "ms");
  return outcome;
}

// The over-60 rate is the finding the utilityTrap preset has to produce, so it
// is checked here even though it is not one of the nine headline metrics.
function overSixtyRatePct(outcome: Outcome): number {
  let listed = 0;
  let transplanted = 0;
  for (const row of outcome.breakdowns.byAgeBand) {
    if (row.band === "60-69" || row.band === "70+") {
      listed = listed + row.listed;
      transplanted = transplanted + row.transplanted;
    }
  }
  if (listed === 0) {
    return 0;
  }
  return Math.round((transplanted / listed) * 1000) / 10;
}

console.log("Gate A — policy conflict check, seed " + defaultConfig().sim.seed);
console.log("");

const urgencyOnly = run("pure urgency   ", 1, 0, 0);
const lifeYearsOnly = run("pure life-years", 0, 1, 0);
const waitingOnly = run("pure waiting   ", 0, 0, 1);
console.log("");

const runs = [urgencyOnly, lifeYearsOnly, waitingOnly];
const names = ["urgency", "life-years", "waiting"];

// Direction each metric improves in. Used only to decide whether one column
// beats the other two everywhere, never to score or rank a policy.
const HIGHER_IS_BETTER: Record<string, boolean> = {
  transplants: true,
  lifeYearsGained: true,
  waitlistDeaths: false,
  medianWaitDays: false,
  p90WaitDays: false,
  organsDiscarded: false,
  meanColdIschemiaHours: false,
  meanGraftQuality: true,
  regionGapPct: false
};

const metricKeys = Object.keys(HIGHER_IS_BETTER);

let header = pad("metric", 24);
for (const name of names) {
  header = header + pad(name, COLUMN);
}
console.log(header);
console.log("-".repeat(24 + COLUMN * 3));

for (const key of metricKeys) {
  let line = pad(key, 24);
  for (const outcome of runs) {
    const value = (outcome.metrics as unknown as Record<string, number>)[key];
    line = line + pad(String(value), COLUMN);
  }
  console.log(line);
}

let overLine = pad("over-60 rate %", 24);
for (const outcome of runs) {
  overLine = overLine + pad(String(overSixtyRatePct(outcome)), COLUMN);
}
console.log(overLine);
console.log("");

// Check one: does any single config win on every metric at once?
const winners: string[] = [];
for (let i = 0; i < runs.length; i++) {
  let winsEverything = true;
  for (const key of metricKeys) {
    const mine = (runs[i].metrics as unknown as Record<string, number>)[key];
    for (let j = 0; j < runs.length; j++) {
      if (i === j) {
        continue;
      }
      const theirs = (runs[j].metrics as unknown as Record<string, number>)[key];
      if (HIGHER_IS_BETTER[key] && mine < theirs) {
        winsEverything = false;
      }
      if (!HIGHER_IS_BETTER[key] && mine > theirs) {
        winsEverything = false;
      }
    }
  }
  if (winsEverything) {
    winners.push(names[i]);
  }
}

const urgencyOverSixty = overSixtyRatePct(urgencyOnly);
const lifeYearsOverSixty = overSixtyRatePct(lifeYearsOnly);

console.log("CHECK 1 — no config wins on every metric");
if (winners.length === 0) {
  console.log("  PASS. Every policy is beaten by another somewhere.");
} else {
  console.log("  FAIL. These win on everything: " + winners.join(", "));
}

console.log("CHECK 2 — pure life-years transplants fewer over-60s than pure urgency");
console.log(
  "  urgency " + urgencyOverSixty + "%  vs  life-years " + lifeYearsOverSixty + "%"
);
if (lifeYearsOverSixty < urgencyOverSixty) {
  console.log("  PASS. The age collapse comes out of the weights, unaided.");
} else {
  console.log("  FAIL. Life-years weighting is not suppressing older recipients.");
}

console.log("");
if (winners.length === 0 && lifeYearsOverSixty < urgencyOverSixty) {
  console.log("GATE A PASSED");
} else {
  console.log("GATE A FAILED");
  process.exit(1);
}
