// Smoke test. Runs the engine through its front door and refuses to pass on
// anything the interface could not safely render. Run before every commit.

import { CONTRACT_VERSION, type MetricKey } from "../src/contract/types";
import {
  defaultConfig,
  presets,
  runConstrainedFrontier,
  runCounterfactual,
  runModeComparison,
  runRobustness,
  runSimulation
} from "../src/engine/index";

// Fields where null is the answer rather than a hole.
//
// maxAgeToList null means no upper age limit. ModeMetricRow.best null means no
// allocation rule reads best on that metric, either because the metric has no
// honest direction or because the rules tied - both are deliberate refusals to
// declare a winner, and turning them into a value would be the platform picking
// a side it has promised not to pick.
const NULLABLE_PATHS = ["outcome.config.constraints.maxAgeToList"];

function isNullable(path: string): boolean {
  if (NULLABLE_PATHS.includes(path)) {
    return true;
  }
  if (path.startsWith("modes.rows[") && path.endsWith("].best")) {
    return true;
  }
  return false;
}

const METRIC_ORDER: MetricKey[] = [
  "transplants",
  "lifeYearsGained",
  "waitlistDeaths",
  "medianWaitDays",
  "p90WaitDays",
  "organsDiscarded",
  "meanColdIschemiaHours",
  "meanGraftQuality",
  "regionGapPct",
  "overSixtyRatePct",
  "zoneGiniPct"
];

// The three steadyState rows that cannot honestly be windowed. If this list and
// the engine's ever disagree, the interface will print a zero as though it were
// a measurement.
const NOT_WINDOWABLE: MetricKey[] = ["regionGapPct", "overSixtyRatePct", "zoneGiniPct"];

function inspect(path: string, value: unknown, problems: string[]): void {
  if (value === undefined) {
    problems.push(path + " is undefined");
    return;
  }
  if (value === null) {
    if (!isNullable(path)) {
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

// metricOrder is what the interface renders every metric list from, so it has to
// carry one entry per metric on Metrics, in the same order as steadyState and
// the comparison rows. A missing entry silently drops a tile from the grid.
const metricKeys = Object.keys(outcome.metrics);
if (outcome.metricOrder.length !== metricKeys.length) {
  problems.push(
    "outcome.metricOrder has " + outcome.metricOrder.length + " entries for " +
      metricKeys.length + " metrics"
  );
}
for (const entry of outcome.metricOrder) {
  if (!metricKeys.includes(entry.metric)) {
    problems.push("metricOrder names " + entry.metric + ", which is not on Metrics");
  }
  if (typeof entry.label !== "string" || entry.label.length === 0) {
    problems.push("metricOrder." + entry.metric + " has no label");
  }
}
for (let i = 0; i < outcome.steadyState.length; i++) {
  if (outcome.metricOrder[i] === undefined) {
    continue;
  }
  if (outcome.metricOrder[i].metric !== outcome.steadyState[i].metric) {
    problems.push("metricOrder and steadyState disagree at position " + i);
  }
  if (outcome.metricOrder[i].label !== outcome.steadyState[i].label) {
    problems.push("metricOrder and steadyState label " + outcome.metricOrder[i].metric + " differently");
  }
}

// Equity: three rows, always the same three, always in this order.
const EQUITY_ORDER = ["zone", "ageBand", "hospitalType"];
if (outcome.equity.length !== EQUITY_ORDER.length) {
  problems.push("outcome.equity has " + outcome.equity.length + " rows, expected 3");
} else {
  for (let i = 0; i < EQUITY_ORDER.length; i++) {
    if (outcome.equity[i].dimension !== EQUITY_ORDER[i]) {
      problems.push(
        "outcome.equity[" + i + "].dimension is " +
          outcome.equity[i].dimension +
          ", expected " +
          EQUITY_ORDER[i]
      );
    }
  }
}

// The zone equity row and the two zone metrics are the same measurements taken
// twice. If they ever drift apart, one of them is on screen next to the other
// contradicting it.
const zoneEquity = outcome.equity.find((row) => {
  return row.dimension === "zone";
});
if (zoneEquity) {
  if (zoneEquity.giniPct !== outcome.metrics.zoneGiniPct) {
    problems.push(
      "equity zone giniPct " + zoneEquity.giniPct + " disagrees with metrics.zoneGiniPct " +
        outcome.metrics.zoneGiniPct
    );
  }
  if (zoneEquity.spreadPct !== outcome.metrics.regionGapPct) {
    problems.push(
      "equity zone spreadPct " + zoneEquity.spreadPct + " disagrees with metrics.regionGapPct " +
        outcome.metrics.regionGapPct
    );
  }
}

// Steady state: every metric present once, and exactly the rate metrics marked
// unwindowable. A row that claims to be windowable but is not would put a
// meaningless number on screen.
for (const row of outcome.steadyState) {
  const shouldBeWindowable = !NOT_WINDOWABLE.includes(row.metric);
  if (row.windowable !== shouldBeWindowable) {
    problems.push(
      "steadyState." + row.metric + " windowable is " + row.windowable + ", expected " +
        shouldBeWindowable
    );
  }
  if (!row.windowable && (row.earlyWindow !== 0 || row.lateWindow !== 0 || row.driftPct !== 0)) {
    problems.push("steadyState." + row.metric + " is unwindowable but carries non-zero values");
  }
}

const windows = outcome.meta;
if (windows.earlyWindowDays[1] !== windows.lateWindowDays[0]) {
  problems.push("steady state windows are not contiguous");
}
if (windows.lateWindowDays[1] !== config.sim.durationDays) {
  problems.push("late steady state window does not end at the last simulated day");
}

// The three expensive exports, shape-checked at the smallest parameters that
// still exercise them. Full-size runs belong in the diagnostic scripts.
const robustness = runRobustness(config, [42, 7]);
inspect("robustness", robustness, problems);
if (robustness.rows.length !== outcome.steadyState.length) {
  problems.push("robustness returned " + robustness.rows.length + " rows, expected one per metric");
}
for (const row of robustness.rows) {
  if (row.min > row.mean || row.mean > row.max) {
    problems.push("robustness." + row.metric + " has mean outside its own min and max");
  }
}

const counterfactual = runCounterfactual(config, presets().utilityTrap, "Default", "Utility trap");
inspect("counterfactual", counterfactual, problems);
if (counterfactual.lost.length > counterfactual.sampleCap) {
  problems.push("counterfactual.lost exceeds its own sampleCap");
}
if (counterfactual.lostCount < counterfactual.lost.length) {
  problems.push("counterfactual.lostCount is smaller than the sample it carries");
}
if (counterfactual.seed !== config.sim.seed) {
  problems.push("counterfactual did not run at the baseline seed");
}

const modes = runModeComparison(config);
inspect("modes", modes, problems);
if (modes.rows.length !== outcome.metricOrder.length) {
  problems.push("modeComparison returned " + modes.rows.length + " rows, expected one per metric");
}
if (modes.byAgeBand.length !== outcome.breakdowns.byAgeBand.length) {
  problems.push("modeComparison age bands do not match the breakdown");
}
if (modes.currentMode !== config.mode) {
  problems.push("modeComparison did not report the caller's own mode");
}
for (const row of modes.rows) {
  // The over-60 rate must never be given a winner. Whether more or fewer older
  // recipients is better is the argument, not a score.
  if (row.metric === "overSixtyRatePct" && row.best !== null) {
    problems.push("modeComparison named a winner on overSixtyRatePct");
  }
}

const frontier = runConstrainedFrontier(
  config,
  3,
  { metric: "overSixtyRatePct", direction: "atLeast", value: 5 },
  "lifeYearsGained"
);
inspect("frontier.constraint", frontier.constraint, problems);
if (frontier.feasibleCount > frontier.points.length) {
  problems.push("frontier reports more feasible points than it swept");
}
if (frontier.feasibleCount === 0 && frontier.priceOfConstraint !== null) {
  problems.push("frontier priced a constraint that nothing satisfies");
}

console.log("Allocate smoke test");
console.log("Contract version: " + outcome.contractVersion);
console.log("");
console.log("Metrics");
for (const key of METRIC_ORDER) {
  console.log("  " + key + ": " + outcome.metrics[key]);
}
console.log("");
console.log("Breakdowns");
console.log("  byAgeBand rows: " + outcome.breakdowns.byAgeBand.length);
console.log("  byZone rows: " + outcome.breakdowns.byZone.length);
console.log("  byHospitalType rows: " + outcome.breakdowns.byHospitalType.length);
console.log("  discardReasons rows: " + outcome.breakdowns.discardReasons.length);
console.log("  timeline points: " + outcome.timeline.length);
console.log("");
console.log("Equity");
for (const row of outcome.equity) {
  console.log(
    "  " + row.dimension + ": gini " + row.giniPct + ", spread " + row.spreadPct +
      " (worst " + row.worstGroup + " " + row.worstRatePct + ", best " + row.bestGroup + " " +
      row.bestRatePct + ")"
  );
}
console.log("");
console.log(
  "Steady state, days " + outcome.meta.earlyWindowDays.join("-") + " against " +
    outcome.meta.lateWindowDays.join("-")
);
for (const row of outcome.steadyState) {
  if (!row.windowable) {
    continue;
  }
  let verdict = "settled";
  if (!row.stabilised) {
    verdict = "STILL MOVING";
  }
  console.log("  " + row.metric + ": " + row.driftPct + "% " + verdict);
}
console.log("");
console.log("New exports");
console.log("  robustness rows: " + robustness.rows.length + " over " + robustness.seeds.length + " seeds");
console.log("  counterfactual: " + counterfactual.lostCount + " lost, " + counterfactual.gainedCount + " gained");
console.log("  constrained frontier: " + frontier.feasibleCount + " of " + frontier.points.length + " feasible");
console.log("");

if (problems.length > 0) {
  console.error("SMOKE FAILED");
  for (const problem of problems) {
    console.error("  " + problem);
  }
  process.exit(1);
}

console.log("SMOKE PASSED");
process.exit(0);
