// Diagnostic. Generates the world without simulating it, and prints what came
// out, so the distributions can be checked by eye before anything depends on
// them. Run with: npx tsx scripts/distributions.ts

import { defaultConfig } from "../src/engine/index";
import { type Organ, type Patient } from "../src/engine/model";
import { generateOrganArrivals } from "../src/engine/organs";
import { generateInitialWaitlist, generateNewListings } from "../src/engine/population";
import { createRng } from "../src/engine/rng";

function pct(part: number, whole: number): string {
  if (whole === 0) {
    return "0.0%";
  }
  return ((part / whole) * 100).toFixed(1) + "%";
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  let total = 0;
  for (const value of values) {
    total = total + value;
  }
  return total / values.length;
}

function percentile(sorted: number[], fraction: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  const index = Math.floor(fraction * (sorted.length - 1));
  return sorted[index];
}

function deciles(values: number[]): string {
  const sorted = [...values].sort((a, b) => {
    return a - b;
  });
  const parts: string[] = [];
  for (let i = 1; i <= 9; i++) {
    parts.push(String(percentile(sorted, i / 10)));
  }
  return parts.join(" ");
}

function countBy<T, K extends string>(items: T[], key: (item: T) => K): Map<K, number> {
  const counts = new Map<K, number>();
  for (const item of items) {
    const bucket = key(item);
    const existing = counts.get(bucket);
    if (existing === undefined) {
      counts.set(bucket, 1);
    } else {
      counts.set(bucket, existing + 1);
    }
  }
  return counts;
}

function printSplit(label: string, counts: Map<string, number>, total: number): void {
  const parts: string[] = [];
  for (const [bucket, count] of counts) {
    parts.push(bucket + " " + pct(count, total));
  }
  console.log("  " + label + ": " + parts.join("  "));
}

function ageBand(age: number): string {
  if (age < 40) {
    return "18-39";
  }
  if (age < 60) {
    return "40-59";
  }
  return "60-78";
}

const config = defaultConfig();
const rng = createRng(config.sim.seed);

const patients: Patient[] = generateInitialWaitlist(config, rng);
for (let day = 0; day < config.sim.durationDays; day++) {
  for (const patient of generateNewListings(day, config, rng)) {
    patients.push(patient);
  }
}
const organs: Organ[] = generateOrganArrivals(config, rng);

console.log("Distributions at seed " + config.sim.seed + " over " + config.sim.durationDays + " days");
console.log("");

console.log("PATIENTS");
console.log("  total ever listed: " + patients.length);
console.log("  initial waitlist: " + config.sim.initialWaitlistSize);
console.log("  listed during run: " + (patients.length - config.sim.initialWaitlistSize));
printSplit("blood group", countBy(patients, (p) => p.bloodGroup), patients.length);
printSplit("zone", countBy(patients, (p) => p.zone), patients.length);
printSplit("hospital type", countBy(patients, (p) => p.hospitalType), patients.length);
console.log("  age deciles: " + deciles(patients.map((p) => p.age)));
console.log("  mean comorbidity: " + mean(patients.map((p) => p.comorbidityIndex)).toFixed(3));
console.log("  mean base urgency: " + mean(patients.map((p) => p.baseUrgency)).toFixed(2));
console.log("");

const expected = patients.map((p) => p.expectedYearsAtListing);
const sortedExpected = [...expected].sort((a, b) => {
  return a - b;
});
console.log("EXPECTED LIFE YEARS AT LISTING");
console.log("  mean: " + mean(expected).toFixed(2));
console.log("  range: " + sortedExpected[0].toFixed(2) + " to " + sortedExpected[sortedExpected.length - 1].toFixed(2));
const bands = ["18-39", "40-59", "60-78"];
const bandMeans = new Map<string, number>();
for (const band of bands) {
  const inBand = patients.filter((p) => ageBand(p.age) === band);
  const bandMean = mean(inBand.map((p) => p.expectedYearsAtListing));
  bandMeans.set(band, bandMean);
  console.log("  " + band + ": " + bandMean.toFixed(2) + " years  (n=" + inBand.length + ")");
}
const young = bandMeans.get("18-39") ?? 0;
const old = bandMeans.get("60-78") ?? 0;
console.log("  60-78 as a share of 18-39: " + pct(old, young));
console.log("");

console.log("ORGANS");
console.log("  total arrived: " + organs.length);
console.log("  donors: " + organs.length / 2);
printSplit("blood group", countBy(organs, (o) => o.bloodGroup), organs.length);
printSplit("zone", countBy(organs, (o) => o.zone), organs.length);
printSplit("retrieval hospital", countBy(organs, (o) => o.retrievalHospitalType), organs.length);
console.log("  donor age deciles: " + deciles(organs.map((o) => o.donorAge)));
console.log("  mean donor age: " + mean(organs.map((o) => o.donorAge)).toFixed(1));
console.log("  mean quality: " + mean(organs.map((o) => o.quality)).toFixed(3));
console.log("");

console.log("SCARCITY");
console.log("  organs per patient ever listed: " + (organs.length / patients.length).toFixed(3));
