// Every biological and behavioural constant and formula for the simulation.
// R10: if a number affects behaviour, it is a named export from this file.
// The domain entities live here too, so compatibility, population and organ
// generation can all depend on one module without depending on each other.

import type { BloodGroup, HospitalType, ZoneId } from "../contract/types";

export const BASE_LIFE_YEARS = 22;
export const URGENCY_DRIFT_PER_YEAR = 1.2;
export const BASE_DAILY_DEATH_HAZARD = 0.00025;
export const ISCHEMIA_FREE_HOURS = 12;
export const ISCHEMIA_PENALTY_PER_HOUR = 0.02;
export const ISCHEMIA_QUALITY_FLOOR = 0.4;
export const OFFER_ACCEPTANCE_RATE = 0.85;
export const RETRIEVAL_PREP_HOURS = 4;

export type PatientStatus = "waiting" | "transplanted" | "died";

export interface Patient {
  id: string;
  bloodGroup: BloodGroup;
  age: number;
  zone: ZoneId;
  hospitalType: HospitalType;
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
