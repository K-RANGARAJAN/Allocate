// Synthetic patient generation. No external data, all of it seeded.

import type { BloodGroup, HospitalType, PolicyConfig, ZoneId } from "../contract/types";
import { clamp, expectedLifeYearsAtListing, type Patient } from "./model";
import type { Rng } from "./rng";

const BLOOD_GROUPS: BloodGroup[] = ["O", "B", "A", "AB"];
const BLOOD_WEIGHTS = [37, 32, 23, 8];

const ZONES: ZoneId[] = ["north", "south", "west"];
const PATIENT_ZONE_WEIGHTS = [45, 33, 22];

const HOSPITAL_TYPES: HospitalType[] = ["government", "private"];
const HOSPITAL_WEIGHTS = [40, 60];

const AGE_MEAN = 48;
const AGE_SD = 13;
const AGE_MIN = 18;
const AGE_MAX = 78;

const BACKDATE_DAYS = 900;

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

function normal(rng: Rng, mean: number, sd: number): number {
  return mean + sd * standardNormal(rng);
}

function drawAge(rng: Rng): number {
  const raw = normal(rng, AGE_MEAN, AGE_SD);
  return Math.round(clamp(AGE_MIN, AGE_MAX, raw));
}

// Sicker with age, with real spread so age does not determine comorbidity.
function drawComorbidity(rng: Rng, age: number): number {
  const trend = 0.18 + ((age - AGE_MIN) / (AGE_MAX - AGE_MIN)) * 0.36;
  const raw = trend + normal(rng, 0, 0.12);
  return clamp(0, 1, raw);
}

// Sicker patients start more urgent, but not deterministically so.
function drawBaseUrgency(rng: Rng, comorbidityIndex: number): number {
  const raw = 1.0 + 4.0 * comorbidityIndex + normal(rng, 0, 0.8);
  return clamp(0, 6, raw);
}

function makePatient(id: string, listedDay: number, rng: Rng): Patient {
  const bloodGroup = rng.weightedPick(BLOOD_GROUPS, BLOOD_WEIGHTS);
  const age = drawAge(rng);
  const zone = rng.weightedPick(ZONES, PATIENT_ZONE_WEIGHTS);
  const hospitalType = rng.weightedPick(HOSPITAL_TYPES, HOSPITAL_WEIGHTS);
  const comorbidityIndex = drawComorbidity(rng, age);
  const baseUrgency = drawBaseUrgency(rng, comorbidityIndex);
  const expectedYearsAtListing = expectedLifeYearsAtListing(age, comorbidityIndex);

  return {
    id,
    bloodGroup,
    age,
    zone,
    hospitalType,
    listedDay,
    baseUrgency,
    comorbidityIndex,
    expectedYearsAtListing,
    status: "waiting"
  };
}

// The list does not start empty. Patients are backdated across the previous
// 900 days so day zero already has people who have been waiting years.
export function generateInitialWaitlist(config: PolicyConfig, rng: Rng): Patient[] {
  const patients: Patient[] = [];
  for (let i = 0; i < config.sim.initialWaitlistSize; i++) {
    const listedDay = -rng.int(1, BACKDATE_DAYS);
    patients.push(makePatient("p-init-" + i, listedDay, rng));
  }
  return patients;
}

// Knuth's method. Arrivals clump the way real referrals do rather than
// arriving at a flat rate every single day.
function poisson(rng: Rng, lambda: number): number {
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

export function generateNewListings(day: number, config: PolicyConfig, rng: Rng): Patient[] {
  const count = poisson(rng, config.sim.newListingsPerDay);
  const patients: Patient[] = [];
  for (let i = 0; i < count; i++) {
    patients.push(makePatient("p-" + day + "-" + i, day, rng));
  }
  return patients;
}
