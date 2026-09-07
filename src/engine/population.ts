// Synthetic patient generation. No external data, all of it seeded.

import type { HospitalType, PolicyConfig } from "../contract/types";
import {
  BLOOD_GROUPS,
  BLOOD_WEIGHTS,
  GOVERNMENT_CENTRE_SHARE,
  ZONES,
  clamp,
  expectedLifeYearsAtListing,
  normal,
  poisson,
  type Patient
} from "./model";
import type { Rng } from "./rng";

const PATIENT_ZONE_WEIGHTS = [45, 33, 22];

// A centre is government or private, and a patient inherits that from the
// centre they are listed at rather than drawing it independently. This is what
// makes transplantCentresPerZone a real lever instead of an unused number.
function centreTypeOf(index: number, centreCount: number): HospitalType {
  const governmentCount = Math.max(1, Math.round(centreCount * GOVERNMENT_CENTRE_SHARE));
  if (index < governmentCount) {
    return "government";
  }
  return "private";
}

const AGE_MEAN = 48;
const AGE_SD = 13;
const AGE_MIN = 18;
const AGE_MAX = 78;

const BACKDATE_DAYS = 900;

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

function makePatient(
  id: string,
  listedDay: number,
  config: PolicyConfig,
  rng: Rng
): Patient {
  const bloodGroup = rng.weightedPick(BLOOD_GROUPS, BLOOD_WEIGHTS);
  const age = drawAge(rng);
  const zone = rng.weightedPick(ZONES, PATIENT_ZONE_WEIGHTS);
  const centreCount = config.resources.transplantCentresPerZone[zone];
  const centreIndex = rng.int(0, centreCount - 1);
  const centreId = zone + "-c" + centreIndex;
  const hospitalType = centreTypeOf(centreIndex, centreCount);
  const comorbidityIndex = drawComorbidity(rng, age);
  const baseUrgency = drawBaseUrgency(rng, comorbidityIndex);
  const expectedYearsAtListing = expectedLifeYearsAtListing(age, comorbidityIndex);

  return {
    id,
    bloodGroup,
    age,
    zone,
    hospitalType,
    centreId,
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
    patients.push(makePatient("p-init-" + i, listedDay, config, rng));
  }
  return patients;
}

export function generateNewListings(day: number, config: PolicyConfig, rng: Rng): Patient[] {
  const count = poisson(rng, config.sim.newListingsPerDay);
  const patients: Patient[] = [];
  for (let i = 0; i < count; i++) {
    patients.push(makePatient("p-" + day + "-" + i, day, config, rng));
  }
  return patients;
}
