// Who may receive which organ, and how long it takes to get there.

import type { BloodGroup, LocalFirst, PolicyConfig, ZoneId } from "../contract/types";
import { RETRIEVAL_PREP_HOURS, currentUrgency, type Organ, type Patient } from "./model";

const DONATES_TO: Record<BloodGroup, BloodGroup[]> = {
  O: ["O", "A", "B", "AB"],
  A: ["A", "AB"],
  B: ["B", "AB"],
  AB: ["AB"]
};

// Travel time between zones, before the fixed retrieval preparation.
const ZONE_TRAVEL_HOURS: Record<string, number> = {
  "north|south": 8,
  "north|west": 6,
  "south|west": 9
};

export function bloodCompatible(donorGroup: BloodGroup, recipientGroup: BloodGroup): boolean {
  return DONATES_TO[donorGroup].includes(recipientGroup);
}

// Older recipients are matched to older donors when age matching is switched on.
// This is a policy lever, off by default. It is never used to manufacture a finding.
export function ageCompatible(
  donorAge: number,
  recipientAge: number,
  ageMatchingOn: boolean
): boolean {
  if (!ageMatchingOn) {
    return true;
  }
  if (recipientAge >= 60) {
    return donorAge >= 55;
  }
  return donorAge < 65;
}

// The locality rule. It is a constraint, not a policy detail, so it binds every
// allocation mode rather than living inside one of them. "zone" seals an organ
// inside the zone it was retrieved in. "off" and "state" both let it travel,
// because every zone in this model is one state.
export function zoneReachable(
  donorZone: ZoneId,
  recipientZone: ZoneId,
  localFirst: LocalFirst
): boolean {
  if (localFirst !== "zone") {
    return true;
  }
  return donorZone === recipientZone;
}

export function transportHours(donorZone: ZoneId, recipientZone: ZoneId): number {
  if (donorZone === recipientZone) {
    return 3 + RETRIEVAL_PREP_HOURS;
  }
  const pair = [donorZone, recipientZone].sort().join("|");
  const travel = ZONE_TRAVEL_HOURS[pair];
  return travel + RETRIEVAL_PREP_HOURS;
}

// Everything that disqualifies a waiting patient from one specific organ.
// The organ's arrival day is the current day for urgency purposes.
export function isEligible(patient: Patient, organ: Organ, config: PolicyConfig): boolean {
  if (patient.status !== "waiting") {
    return false;
  }
  if (patient.listedDay > organ.arrivalDay) {
    return false;
  }
  if (!zoneReachable(organ.zone, patient.zone, config.constraints.localFirst)) {
    return false;
  }
  if (!bloodCompatible(organ.bloodGroup, patient.bloodGroup)) {
    return false;
  }
  if (!ageCompatible(organ.donorAge, patient.age, config.constraints.ageMatchingOn)) {
    return false;
  }
  const coldHours = transportHours(organ.zone, patient.zone);
  if (coldHours > config.constraints.maxColdIschemiaHours) {
    return false;
  }
  const yearsWaiting = (organ.arrivalDay - patient.listedDay) / 365;
  const urgency = currentUrgency(patient.baseUrgency, yearsWaiting, patient.comorbidityIndex);
  if (urgency < config.constraints.minUrgencyToList) {
    return false;
  }
  return true;
}
