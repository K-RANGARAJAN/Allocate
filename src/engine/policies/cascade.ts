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

// The rota is state carried across the whole run, so it lives in an object the
// simulation creates once rather than in module scope. Two runs at the same
// seed must not be able to see each other's rotation.
export interface CascadeState {
  // Tier number to the centre it last served, so the next organ starts after it.
  lastServed: Map<number, string>;
  // Centres that jumped the queue via the urgent path and owe a skipped turn.
  forfeits: Set<string>;
}

export function createCascadeState(): CascadeState {
  return { lastServed: new Map(), forfeits: new Set() };
}

function longestWaiting(patients: Patient[]): Patient {
  let best = patients[0];
  for (const candidate of patients) {
    if (candidate.listedDay < best.listedDay) {
      best = candidate;
    }
  }
  return best;
}

// Rotate the centre list so the one after whoever went last comes first.
function rotatedCentres(centres: string[], lastServed: string | undefined): string[] {
  if (lastServed === undefined) {
    return centres;
  }
  const position = centres.indexOf(lastServed);
  if (position < 0) {
    return centres;
  }
  const after = centres.slice(position + 1);
  const upTo = centres.slice(0, position + 1);
  return after.concat(upTo);
}

// The organ stops at the first rung with anyone on it. Within a rung, either
// the longest wait wins, or the rota decides whose turn it is.
export function selectRecipient(
  state: CascadeState,
  eligiblePatients: Patient[],
  organ: Organ,
  config: PolicyConfig,
  currentDay: number
): Patient | null {
  let bestTier = Number.POSITIVE_INFINITY;
  for (const candidate of eligiblePatients) {
    const tier = tierOf(candidate, organ, config, currentDay);
    if (tier !== null && tier < bestTier) {
      bestTier = tier;
    }
  }
  if (bestTier === Number.POSITIVE_INFINITY) {
    return null;
  }

  const inTier = eligiblePatients.filter((candidate) => {
    return tierOf(candidate, organ, config, currentDay) === bestTier;
  });

  // Urgent cases ignore the rota, and the centre that gains one pays for it by
  // losing its next regular turn.
  if (bestTier === TIER_URGENT) {
    const chosen = longestWaiting(inTier);
    if (config.constraints.rotaEnabled) {
      state.forfeits.add(chosen.centreId);
    }
    return chosen;
  }

  if (!config.constraints.rotaEnabled) {
    return longestWaiting(inTier);
  }

  const centres: string[] = [];
  for (const candidate of inTier) {
    if (!centres.includes(candidate.centreId)) {
      centres.push(candidate.centreId);
    }
  }
  centres.sort();

  const order = rotatedCentres(centres, state.lastServed.get(bestTier));
  let picked: string | null = null;
  for (const centreId of order) {
    if (state.forfeits.has(centreId)) {
      state.forfeits.delete(centreId);
      continue;
    }
    picked = centreId;
    break;
  }
  // Every centre in this tier was owed a skip. They have all now paid it, so
  // the organ still has to go somewhere.
  if (picked === null) {
    picked = order[0];
  }

  state.lastServed.set(bestTier, picked);
  const atCentre = inTier.filter((candidate) => {
    return candidate.centreId === picked;
  });
  return longestWaiting(atCentre);
}
