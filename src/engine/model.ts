// Every biological and behavioural constant and formula for the simulation.
// R10: if a number affects behaviour, it is a named export from this file.
// The domain entities live here too, so compatibility, population and organ
// generation can all depend on one module without depending on each other.

import type { BloodGroup, HospitalType, TimelinePoint, ZoneId } from "../contract/types";
import type { Rng } from "./rng";

export const BASE_LIFE_YEARS = 22;
export const URGENCY_DRIFT_PER_YEAR = 1.2;
export const BASE_DAILY_DEATH_HAZARD = 0.00025;
export const ISCHEMIA_FREE_HOURS = 12;
export const ISCHEMIA_PENALTY_PER_HOUR = 0.02;
export const ISCHEMIA_QUALITY_FLOOR = 0.4;
export const OFFER_ACCEPTANCE_RATE = 0.85;
export const RETRIEVAL_PREP_HOURS = 4;

// Every declined offer costs time while the next centre is contacted. This is
// what makes the ischemia limit reachable after eligibility has already passed.
export const OFFER_DECLINE_HOURS = 2;
export const MAX_OFFERS_PER_ORGAN = 5;

// Below this effective quality a kidney is not worth the operation. Anchored to
// a donor of about 65 with no transport damage. Because the check is on quality
// *after* ischemia, a long journey can push a usable organ under the line — so
// geography, not just donor age, decides how many organs get thrown away.
export const MIN_VIABLE_QUALITY = 0.6;

// Current urgency at or above this puts a patient on the urgent list, which
// jumps the cascade entirely when urgentSupersedesRota is on.
export const URGENT_LIST_THRESHOLD = 8.5;

// Share of a zone's transplant centres that are government run.
export const GOVERNMENT_CENTRE_SHARE = 0.4;

// The age at which a patient counts as an older recipient. The whole utility
// trap is measured against this line, so it is named rather than inlined.
export const OVER_SIXTY_AGE = 60;

// Pareto sweep labelling. A weight vector is named by how lopsided it is: one
// weight at or above the pure share carries the point on its own, a spread
// narrower than the balanced spread means no weight is really in charge, and
// two weights within the tie spread of each other are sharing the lead.
export const PARETO_PURE_SHARE = 0.95;
export const PARETO_HEAVY_SHARE = 0.55;
export const PARETO_BALANCED_SPREAD = 0.15;
export const PARETO_TIE_SPREAD = 0.05;

// Steady state. The run opens with a backdated waitlist clearing, which is not
// the policy at rest, so the final window is compared against the one before it
// rather than against the whole run. A metric that has moved less than the
// tolerance between those two windows is reported as settled.
export const STEADY_STATE_WINDOW_DAYS = 180;
export const STEADY_STATE_DRIFT_TOLERANCE_PCT = 10;

// Robustness. Twenty seeds is enough to say whether a finding is a property of
// the policy or an accident of one roll, and cheap enough to run in a worker
// while a judge is watching. These exact seeds are fixed so the answer is the
// same every time it is asked.
export const DEFAULT_ROBUSTNESS_SEEDS = [
  42, 1, 7, 13, 23, 99, 101, 256, 404, 512,
  777, 1024, 1337, 2024, 3141, 4096, 5150, 6502, 8080, 9001
];

// Counterfactual. A policy change can move hundreds of patients, and no table
// wants hundreds of rows, so the sample is capped and the true count is
// reported alongside it.
export const COUNTERFACTUAL_SAMPLE_CAP = 100;

// Discard reasons. Exact strings, because they reach the UI as table rows.
export const DISCARD_NO_ELIGIBLE = "no eligible recipient";
export const DISCARD_DECLINED = "declined by all centres";
export const DISCARD_ISCHEMIA = "exceeded ischemia limit";
export const DISCARD_QUALITY = "graft quality too low";

// Shared domain vocabulary. Blood group frequencies are the same for donors and
// recipients. Zone weights are not, and are declared where they are used.
export const BLOOD_GROUPS: BloodGroup[] = ["O", "B", "A", "AB"];
export const BLOOD_WEIGHTS = [37, 32, 23, 8];
export const ZONES: ZoneId[] = ["north", "south", "west"];
export const HOSPITAL_TYPES: HospitalType[] = ["government", "private"];

export type PatientStatus = "waiting" | "transplanted" | "died";

export interface Patient {
  id: string;
  bloodGroup: BloodGroup;
  age: number;
  zone: ZoneId;
  hospitalType: HospitalType;
  // The transplant centre this patient is listed at. The rota rotates organs
  // across these, so how many exist per zone genuinely changes who gets one.
  centreId: string;
  listedDay: number;
  baseUrgency: number;
  comorbidityIndex: number;
  expectedYearsAtListing: number;
  status: PatientStatus;
}

export interface Organ {
  id: string;
  donorId: string;
  bloodGroup: BloodGroup;
  donorAge: number;
  zone: ZoneId;
  retrievalHospitalType: HospitalType;
  quality: number;
  arrivalDay: number;
  // 0 or 1. Which of the donor's two kidneys this is, so the retrieving
  // hospital can be given first claim on a limited number of them.
  kidneyIndex: number;
}

export function clamp(low: number, high: number, value: number): number {
  if (value < low) {
    return low;
  }
  if (value > high) {
    return high;
  }
  return value;
}

// What a policy believes a candidate is worth, estimated at listing time.
// The decline with age is the mechanism the whole project rests on.
// Age 30 gives about 18.3 years, age 60 about 7.3, age 70 about 3.7.
export function expectedLifeYearsAtListing(age: number, comorbidityIndex: number): number {
  const ageFactor = Math.max(0, 1 - (age - 20) / 60);
  const comorbidityFactor = 1 - 0.5 * comorbidityIndex;
  return BASE_LIFE_YEARS * ageFactor * comorbidityFactor;
}

// Urgency drifts upward the longer a patient waits, faster if they are sicker.
export function currentUrgency(
  baseUrgency: number,
  yearsWaiting: number,
  comorbidityIndex: number
): number {
  const drift = URGENCY_DRIFT_PER_YEAR * yearsWaiting * (1 + comorbidityIndex);
  const raw = baseUrgency + drift;
  return Math.min(10, raw);
}

export function dailyDeathProbability(urgency: number, comorbidityIndex: number): number {
  return BASE_DAILY_DEATH_HAZARD * (1 + urgency / 5) * (1 + comorbidityIndex);
}

export function donorQuality(donorAge: number): number {
  return clamp(0.35, 1.0, 1.25 - donorAge / 100);
}

// Cold ischemia damage. Free for the first stretch, then linear, with a floor.
export function ischemiaMultiplier(coldHours: number): number {
  const excess = Math.max(0, coldHours - ISCHEMIA_FREE_HOURS);
  const multiplier = 1 - ISCHEMIA_PENALTY_PER_HOUR * excess;
  return Math.max(ISCHEMIA_QUALITY_FLOOR, multiplier);
}

// What the transplant actually delivers, after graft quality and transport
// damage. Deliberately a different number from expectedLifeYearsAtListing.
export function actualLifeYearsGained(
  expectedYearsAtListing: number,
  effectiveQuality: number
): number {
  return expectedYearsAtListing * effectiveQuality;
}

// Approximate standard normal from twelve uniforms. Sum of twelve has mean 6
// and standard deviation 1, so subtracting 6 gives a usable z with no logs or
// trig and no chance of a degenerate draw.
function standardNormal(rng: Rng): number {
  let total = 0;
  for (let i = 0; i < 12; i++) {
    total = total + rng.next();
  }
  return total - 6;
}

export function normal(rng: Rng, mean: number, sd: number): number {
  return mean + sd * standardNormal(rng);
}

// Knuth's method. Arrivals clump the way real referrals and donations do,
// rather than landing at a flat rate every single day.
export function poisson(rng: Rng, lambda: number): number {
  const limit = Math.exp(-lambda);
  let k = 0;
  let product = 1;
  while (true) {
    product = product * rng.next();
    if (product <= limit) {
      return k;
    }
    k = k + 1;
    if (k > 200) {
      return k;
    }
  }
}

// The raw event log. simulate.ts produces it, metrics.ts consumes it. Nothing
// is aggregated here, so conservation can be checked against the raw events.

export interface ListingRecord {
  patientId: string;
  age: number;
  zone: ZoneId;
  hospitalType: HospitalType;
  listedDay: number;
}

export interface TransplantEvent {
  day: number;
  patientId: string;
  organId: string;
  age: number;
  zone: ZoneId;
  hospitalType: HospitalType;
  waitDays: number;
  coldHours: number;
  effectiveQuality: number;
  lifeYearsGained: number;
}

export interface DeathEvent {
  day: number;
  patientId: string;
  age: number;
  zone: ZoneId;
  hospitalType: HospitalType;
  waitDays: number;
}

export interface DiscardEvent {
  day: number;
  organId: string;
  reason: string;
}

export interface SimulationLog {
  listings: ListingRecord[];
  transplants: TransplantEvent[];
  deaths: DeathEvent[];
  discards: DiscardEvent[];
  timeline: TimelinePoint[];
  organsArrived: number;
  allocationDecisions: number;
  stillWaiting: number;
}
