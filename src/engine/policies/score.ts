// Weighted score allocation. Every waiting patient gets a number, highest wins.
// This is the policy the utilityTrap preset leans on, and the whole point is
// that no rule here mentions age. The life-years component does it unaided.

import type { PolicyConfig } from "../../contract/types";
import { BASE_LIFE_YEARS, currentUrgency, type Organ, type Patient } from "../model";

export interface NormalisedWeights {
  urgency: number;
  lifeYears: number;
  waitingTime: number;
}

// The user's three sliders need not sum to 1. They are normalised here, once,
// so a config of all-1.0 means an equal split rather than triple weighting.
export function normaliseWeights(weights: PolicyConfig["weights"]): NormalisedWeights {
  const total = weights.urgency + weights.lifeYears + weights.waitingTime;
  if (total <= 0) {
    return { urgency: 1 / 3, lifeYears: 1 / 3, waitingTime: 1 / 3 };
  }
  return {
    urgency: weights.urgency / total,
    lifeYears: weights.lifeYears / total,
    waitingTime: weights.waitingTime / total
  };
}

export function yearsWaiting(patient: Patient, currentDay: number): number {
  return (currentDay - patient.listedDay) / 365;
}

// Three components, each normalised to 0..1 so the weights mean what they say.
// The organ is not consulted: a score policy ranks candidates, and eligibility
// against this particular organ has already been decided by isEligible.
export function scoreCandidate(
  patient: Patient,
  _organ: Organ,
  config: PolicyConfig,
  currentDay: number
): number {
  const weights = normaliseWeights(config.weights);
  const waited = yearsWaiting(patient, currentDay);

  const urgencyComponent =
    currentUrgency(patient.baseUrgency, waited, patient.comorbidityIndex) / 10;
  const lifeYearsComponent = patient.expectedYearsAtListing / BASE_LIFE_YEARS;
  const waitingComponent = Math.min(1, waited / 5);

  const urgencyPart = weights.urgency * urgencyComponent;
  const lifeYearsPart = weights.lifeYears * lifeYearsComponent;
  const waitingPart = weights.waitingTime * waitingComponent;

  return urgencyPart + lifeYearsPart + waitingPart;
}

// Highest score wins. Longest wait breaks a tie, which keeps the result stable
// and independent of the order patients happen to sit in the array.
export function selectRecipient(
  eligiblePatients: Patient[],
  organ: Organ,
  config: PolicyConfig,
  currentDay: number
): Patient | null {
  if (eligiblePatients.length === 0) {
    return null;
  }

  let best = eligiblePatients[0];
  let bestScore = scoreCandidate(best, organ, config, currentDay);

  for (const candidate of eligiblePatients) {
    const score = scoreCandidate(candidate, organ, config, currentDay);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
      continue;
    }
    if (score === bestScore && candidate.listedDay < best.listedDay) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}
