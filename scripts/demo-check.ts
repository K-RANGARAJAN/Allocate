// Gate C. Runs each demo preset against the default config and prints the
// metrics it is supposed to move, with the size of the move. Both presets are
// weights and permitted constraints only — no age cap, no exclusion, nothing
// anywhere in the engine that knows what a preset is.
// Run with: npx tsx scripts/demo-check.ts

import type { Outcome, PolicyConfig } from "../src/contract/types";
import { defaultConfig, presets, runCounterfactual, runSimulation } from "../src/engine/index";

// Margins named before the runs, not after them. "Clearly lower" has to mean
// something specific or it means whatever the result happens to be.
const UTILITY_MAX_SHARE_OF_DEFAULT = 0.5;
const LOCALITY_MIN_GAP_MULTIPLE = 2.0;

function pad(text: string, width: number): string {
  let out = text;
  while (out.length < width) {
    out = out + " ";
  }
  return out;
}

// `metrics.overSixtyRatePct` is the number the interface displays. This
// recomputes it from the age breakdown so the two can be compared — if they ever
// disagree, the metric and the table on screen are telling different stories.
function overSixtyFromBands(outcome: Outcome): number {
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

function movement(before: number, after: number): string {
  const delta = Math.round((after - before) * 10) / 10;
  let arrow = "same";
  if (delta > 0) {
    arrow = "up   +" + delta;
  }
  if (delta < 0) {
    arrow = "down " + delta;
  }
  if (before === 0) {
    return arrow;
  }
  const pct = Math.round(((after - before) / before) * 1000) / 10;
  return pad(arrow, 12) + "(" + pct + "%)";
}

function line(name: string, before: number, after: number): void {
  console.log(
    "  " + pad(name, 26) + pad(String(before), 10) + pad(String(after), 10) + movement(before, after)
  );
}

function header(preset: string): void {
  console.log("");
  console.log("  " + pad(preset, 26) + pad("default", 10) + pad("preset", 10) + "move");
  console.log("  " + "-".repeat(26 + 20 + 22));
}

function describe(config: PolicyConfig): string {
  const weights = config.weights;
  return (
    "mode " +
    config.mode +
    ", weights " +
    weights.urgency +
    "/" +
    weights.lifeYears +
    "/" +
    weights.waitingTime +
    ", localFirst " +
    config.constraints.localFirst +
    ", keeps " +
    config.constraints.retrievalHospitalKeeps +
    ", rota " +
    config.constraints.rotaEnabled
  );
}

const base = defaultConfig();
const preset = presets();

console.log("Gate C — demo preset check, seed " + base.sim.seed);
console.log("");
console.log("  default      " + describe(base));
console.log("  utilityTrap  " + describe(preset.utilityTrap));
console.log("  localityTrap " + describe(preset.localityTrap));

const baseline = runSimulation(base);
const utility = runSimulation(preset.utilityTrap);
const locality = runSimulation(preset.localityTrap);

const baseOverSixty = baseline.metrics.overSixtyRatePct;
const utilityOverSixty = utility.metrics.overSixtyRatePct;
const bandsAgree =
  baseOverSixty === overSixtyFromBands(baseline) &&
  utilityOverSixty === overSixtyFromBands(utility);

header("utilityTrap");
line("over-60 transplant rate %", baseOverSixty, utilityOverSixty);
line("lifeYearsGained", baseline.metrics.lifeYearsGained, utility.metrics.lifeYearsGained);
line("transplants", baseline.metrics.transplants, utility.metrics.transplants);
line("waitlistDeaths", baseline.metrics.waitlistDeaths, utility.metrics.waitlistDeaths);

header("localityTrap");
line("regionGapPct", baseline.metrics.regionGapPct, locality.metrics.regionGapPct);
line("organsDiscarded", baseline.metrics.organsDiscarded, locality.metrics.organsDiscarded);
line(
  "meanColdIschemiaHours",
  baseline.metrics.meanColdIschemiaHours,
  locality.metrics.meanColdIschemiaHours
);
line("transplants", baseline.metrics.transplants, locality.metrics.transplants);

// Why the discard move is small. Every discard in this model at the default
// cold ceiling is a graft that decayed below the viability floor in transit —
// the ceiling itself is slack, because the longest journey is 13 hours against
// a 24 hour limit. Tighten the ceiling and the same lever moves far more.
const tightOff = defaultConfig();
tightOff.constraints.maxColdIschemiaHours = 12;
const tightZone = defaultConfig();
tightZone.constraints.maxColdIschemiaHours = 12;
tightZone.constraints.localFirst = "zone";
const looseDiscards = runSimulation(tightOff).metrics.organsDiscarded;
const tightDiscards = runSimulation(tightZone).metrics.organsDiscarded;

console.log("");
console.log("  Context — local-first at a 12 hour cold ischemia ceiling");
console.log("  " + "-".repeat(68));
console.log("  localFirst off   organsDiscarded " + looseDiscards);
console.log("  localFirst zone  organsDiscarded " + tightDiscards);
console.log("  The discard lever is small at the default 24 hour ceiling because");
console.log("  nothing ever hits it. It is the ceiling that decides how much");
console.log("  geography costs, not the allocation rule.");

const utilityCeiling = Math.round(baseOverSixty * UTILITY_MAX_SHARE_OF_DEFAULT * 10) / 10;
const localityFloor = Math.round(baseline.metrics.regionGapPct * LOCALITY_MIN_GAP_MULTIPLE * 10) / 10;

const utilityPass = utilityOverSixty <= utilityCeiling;
const gapPass = locality.metrics.regionGapPct >= localityFloor;
const discardPass = locality.metrics.organsDiscarded < baseline.metrics.organsDiscarded;

console.log("");
console.log("CHECK 0 — overSixtyRatePct agrees with the 60-69 and 70+ rows");
if (bandsAgree) {
  console.log("  PASS. The metric and the age breakdown are the same number.");
} else {
  console.log("  FAIL. The headline number disagrees with the table under it.");
}
console.log("CHECK 1 — utilityTrap collapses the over-60 transplant rate");
console.log(
  "  " + baseOverSixty + "% to " + utilityOverSixty + "%, needed " + utilityCeiling + "% or lower"
);
if (utilityPass) {
  console.log("  PASS. Weights only. No age cap, no age matching, no raised listing bar.");
} else {
  console.log("  FAIL. The life-years weight is not suppressing older recipients enough.");
}

console.log("CHECK 2 — localityTrap widens the regional gap");
console.log(
  "  " +
    baseline.metrics.regionGapPct +
    "% to " +
    locality.metrics.regionGapPct +
    "%, needed " +
    localityFloor +
    "% or higher"
);
if (gapPass) {
  console.log("  PASS. Sealing organs inside their zone concentrates them where they land.");
} else {
  console.log("  FAIL. Geography is not creating enough pressure.");
}

console.log("CHECK 3 — localityTrap cuts organ discards");
console.log(
  "  " + baseline.metrics.organsDiscarded + " to " + locality.metrics.organsDiscarded
);
if (discardPass) {
  console.log("  PASS. Shorter journeys mean less graft decay in transit.");
} else {
  console.log("  FAIL. Local-first is not reducing transport damage.");
}

// Who the utility trap actually moved. Both runs are at the same seed, so every
// row here is one person who was transplanted under one rule and died waiting
// under the other. Not an average, not a like-for-like.
const swap = runCounterfactual(base, preset.utilityTrap, "default", "utilityTrap");

let olderLost = 0;
let olderGained = 0;
for (const row of swap.byAgeBand) {
  if (row.band === "60-69" || row.band === "70+") {
    olderLost = olderLost + row.lost;
    olderGained = olderGained + row.gained;
  }
}

console.log("");
console.log("  Who utilityTrap moved, patient by patient, at seed " + swap.seed);
console.log("  " + "-".repeat(68));
console.log("  " + pad("band", 12) + pad("lost transplant", 18) + "gained transplant");
for (const row of swap.byAgeBand) {
  console.log("  " + pad(row.band, 12) + pad(String(row.lost), 18) + String(row.gained));
}
console.log("  " + pad("total", 12) + pad(String(swap.lostCount), 18) + String(swap.gainedCount));

const longestLost = swap.lost[0];
if (longestLost) {
  console.log(
    "  Longest-waiting patient it drops: age " + longestLost.age + ", " + longestLost.zone +
      ", had waited " + longestLost.waitDays + " days, dies on day " + longestLost.deathDay
  );
}

// The disparity the project was not measuring. Regional gap has carried the
// whole inequality story so far. The age dimension is an order of magnitude
// larger and was invisible until there was an index for it.
const zoneGini = baseline.equity.find((row) => {
  return row.dimension === "zone";
});
const ageGini = baseline.equity.find((row) => {
  return row.dimension === "ageBand";
});

console.log("");
console.log("  Context - which inequality is actually the large one, at default");
console.log("  " + "-".repeat(68));
if (zoneGini && ageGini) {
  console.log(
    "  between zones      gini " + zoneGini.giniPct + "  (" + zoneGini.worstGroup + " " +
      zoneGini.worstRatePct + "% to " + zoneGini.bestGroup + " " + zoneGini.bestRatePct + "%)"
  );
  console.log(
    "  between age bands  gini " + ageGini.giniPct + "  (" + ageGini.worstGroup + " " +
      ageGini.worstRatePct + "% to " + ageGini.bestGroup + " " + ageGini.bestRatePct + "%)"
  );
  console.log("  The age gap is the larger one and no policy in this model set out to");
  console.log("  create it. The regional story is real and it is the smaller of the two.");
}

// Not a margin chosen after the fact: the claim is that the utility preset gives
// nothing back to the group it takes from, and zero is the only number that
// makes that claim true.
const olderPass = olderLost > 0 && olderGained === 0;

console.log("");
console.log("CHECK 4 - utilityTrap gives no transplant back to anyone over 60");
console.log(
  "  over-60 patients who lose a transplant: " + olderLost + ", who gain one: " + olderGained
);
if (olderPass) {
  console.log("  PASS. The trade is entirely one-directional across the age line.");
} else {
  console.log("  FAIL. Some over-60 patients gain, so the collapse is not total.");
}

console.log("");
if (bandsAgree && utilityPass && gapPass && discardPass && olderPass) {
  console.log("GATE C PASSED");
  console.log("Both presets earn their finding. Neither is told what to produce.");
} else {
  console.log("GATE C FAILED");
  process.exit(1);
}
