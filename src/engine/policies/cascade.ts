// The TRANSTAN-style cascade. Tamil Nadu does not score patients against each
// other — it walks a fixed ladder of claims, and the organ stops at the first
// rung that has someone waiting. Who is sickest barely enters into it. That is
// the point of modelling it next to a weighted score.

import type { PolicyConfig } from "../../contract/types";
import { URGENT_LIST_THRESHOLD, currentUrgency, type Organ, type Patient } from "../model";

// Lower number means an earlier claim on the organ.
export const TIER_URGENT = 1;
export const TIER_RETRIEVAL_HOSPITAL = 2;
export const TIER_GOVERNMENT_SAME_ZONE = 3;
export const TIER_PRIVATE_SAME_ZONE = 4;
export const TIER_GOVERNMENT_OTHER_ZONE = 5;
export const TIER_PRIVATE_OTHER_ZONE = 6;

export function isUrgent(patient: Patient, currentDay: number): boolean {
  const yearsWaiting = (currentDay - patient.listedDay) / 365;
  const urgency = currentUrgency(patient.baseUrgency, yearsWaiting, patient.comorbidityIndex);
  return urgency >= URGENT_LIST_THRESHOLD;
}

// Returns the rung this patient stands on, or null if the organ can never
// reach them under the current locality rule.
export function tierOf(
  patient: Patient,
  organ: Organ,
  config: PolicyConfig,
  currentDay: number
): number | null {
  if (config.constraints.urgentSupersedesRota && isUrgent(patient, currentDay)) {
    return TIER_URGENT;
  }

  const sameZone = patient.zone === organ.zone;

  // The retrieving hospital keeps first claim on however many of the donor's
  // two kidneys the policy allows it. This is the part of the Tamil Nadu model
  // that has nothing to do with need and everything to do with who did the work.
  const keptByRetriever = organ.kidneyIndex < config.constraints.retrievalHospitalKeeps;
  if (keptByRetriever && sameZone && patient.hospitalType === organ.retrievalHospitalType) {
    return TIER_RETRIEVAL_HOSPITAL;
  }

  if (sameZone) {
    if (patient.hospitalType === "government") {
      return TIER_GOVERNMENT_SAME_ZONE;
    }
    return TIER_PRIVATE_SAME_ZONE;
  }

  // "zone" seals the organ inside the zone it was retrieved in. "off" and
  // "state" both let it travel, because every zone here is one state.
  if (config.constraints.localFirst === "zone") {
    return null;
  }
  if (patient.hospitalType === "government") {
    return TIER_GOVERNMENT_OTHER_ZONE;
  }
  return TIER_PRIVATE_OTHER_ZONE;
}

// The organ stops at the first rung with anyone on it. Within a rung, the
// longest wait wins — no scoring, no comparison of who would benefit more.
export function selectRecipient(
  eligiblePatients: Patient[],
  organ: Organ,
  config: PolicyConfig,
  currentDay: number
): Patient | null {
  let best: Patient | null = null;
  let bestTier = Number.POSITIVE_INFINITY;

  for (const candidate of eligiblePatients) {
    const tier = tierOf(candidate, organ, config, currentDay);
    if (tier === null) {
      continue;
    }
    if (tier < bestTier) {
      best = candidate;
      bestTier = tier;
      continue;
    }
    if (tier === bestTier && best !== null && candidate.listedDay < best.listedDay) {
      best = candidate;
    }
  }

  return best;
}
