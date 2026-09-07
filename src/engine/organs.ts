// Synthetic donor organ arrivals. No external data, all of it seeded.

import type { PolicyConfig } from "../contract/types";
import {
  BLOOD_GROUPS,
  BLOOD_WEIGHTS,
  HOSPITAL_TYPES,
  ZONES,
  clamp,
  donorQuality,
  normal,
  poisson,
  type Organ
} from "./model";
import type { Rng } from "./rng";

const DONORS_PER_DAY = 0.8;
const KIDNEYS_PER_DONOR = 2;

// Deliberately the inverse of the patient zone split. Donation happens where
// the patients are not, so geography creates real allocation pressure rather
// than being decorative.
const DONOR_ZONE_WEIGHTS = [33, 45, 22];

// Retrieval skews to government trauma centres.
const RETRIEVAL_HOSPITAL_WEIGHTS = [55, 45];

const DONOR_AGE_MEAN = 38;
const DONOR_AGE_SD = 14;
const DONOR_AGE_MIN = 15;
const DONOR_AGE_MAX = 70;

function drawDonorAge(rng: Rng): number {
  const raw = normal(rng, DONOR_AGE_MEAN, DONOR_AGE_SD);
  return Math.round(clamp(DONOR_AGE_MIN, DONOR_AGE_MAX, raw));
}

// One donor yields exactly two kidneys. They share a donorId, a blood group, a
// zone and a retrieval hospital, because they came out of the same person.
export function generateOrganArrivals(config: PolicyConfig, rng: Rng): Organ[] {
  const organs: Organ[] = [];
  const donorsPerDay = DONORS_PER_DAY * config.resources.donationRateMultiplier;

  for (let day = 0; day < config.sim.durationDays; day++) {
    const donorCount = poisson(rng, donorsPerDay);
    for (let d = 0; d < donorCount; d++) {
      const donorId = "d-" + day + "-" + d;
      const bloodGroup = rng.weightedPick(BLOOD_GROUPS, BLOOD_WEIGHTS);
      const donorAge = drawDonorAge(rng);
      const zone = rng.weightedPick(ZONES, DONOR_ZONE_WEIGHTS);
      const retrievalHospitalType = rng.weightedPick(HOSPITAL_TYPES, RETRIEVAL_HOSPITAL_WEIGHTS);
      const quality = donorQuality(donorAge);

      for (let k = 0; k < KIDNEYS_PER_DONOR; k++) {
        organs.push({
          id: donorId + "-k" + k,
          donorId,
          bloodGroup,
          donorAge,
          zone,
          retrievalHospitalType,
          quality,
          arrivalDay: day
        });
      }
    }
  }

  return organs;
}
