// The day-by-day allocation loop. Produces a raw event log and nothing else —
// metrics.ts does all the aggregating, so conservation stays checkable.


import type { PolicyConfig, TimelinePoint } from "../contract/types";
import { isEligible, transportHours } from "./compatibility";
import {
  actualLifeYearsGained,
  currentUrgency,
  DISCARD_DECLINED,
  DISCARD_ISCHEMIA,
  DISCARD_NO_ELIGIBLE,
  MAX_OFFERS_PER_ORGAN,
  OFFER_ACCEPTANCE_RATE,
  dailyDeathProbability,
  ischemiaMultiplier,
  OFFER_DECLINE_HOURS,
  type DeathEvent,
  type DiscardEvent,
  type ListingRecord,
  type Organ,
  type Patient,
  type SimulationLog,
  type TransplantEvent
} from "./model";
import { generateOrganArrivals } from "./organs";
import { selectRecipient } from "./policies/score";
import { generateInitialWaitlist, generateNewListings } from "./population";
import { createRng } from "./rng";

const TIMELINE_INTERVAL_DAYS = 30;

// A patient above the listing age cap is never listed at all. This is the only
// place maxAgeToList is enforced, and it is a listing rule, not an allocation one.
function passesListingRules(patient: Patient, config: PolicyConfig): boolean {
  const cap = config.constraints.maxAgeToList;
  if (cap === null) {
    return true;
  }
  return patient.age <= cap;
}

function organsByArrivalDay(organs: Organ[]): Map<number, Organ[]> {
  const byDay = new Map<number, Organ[]>();
  for (const organ of organs) {
    const existing = byDay.get(organ.arrivalDay);
    if (existing === undefined) {
      byDay.set(organ.arrivalDay, [organ]);
    } else {
      existing.push(organ);
    }
  }
  return byDay;
}

export function simulate(config: PolicyConfig): SimulationLog {
  const rng = createRng(config.sim.seed);

  const listings: ListingRecord[] = [];
  const transplants: TransplantEvent[] = [];
  const deaths: DeathEvent[] = [];
  const discards: DiscardEvent[] = [];
  const timeline: TimelinePoint[] = [];
  let waiting: Patient[] = [];
  let allocationDecisions = 0;

  function admit(patient: Patient): void {
    if (!passesListingRules(patient, config)) {
      return;
    }
    waiting.push(patient);
    listings.push({
      patientId: patient.id,
      age: patient.age,
      zone: patient.zone,
      hospitalType: patient.hospitalType,
      listedDay: patient.listedDay
    });
  }

  for (const patient of generateInitialWaitlist(config, rng)) {
    admit(patient);
  }

  const organs = generateOrganArrivals(config, rng);
  const arrivals = organsByArrivalDay(organs);

  // Cold time is travel plus whatever the declined offers cost. Graft quality
  // is the donor's quality after ischemia damage, and the life years actually
  // delivered are the estimate at listing scaled by that quality — deliberately
  // a smaller number than the one the policy scored on.
  function transplant(recipient: Patient, organ: Organ, day: number, declines: number): void {
    const coldHours = transportHours(organ.zone, recipient.zone) + declines * OFFER_DECLINE_HOURS;
    const effectiveQuality = organ.quality * ischemiaMultiplier(coldHours);
    recipient.status = "transplanted";
    transplants.push({
      day,
      patientId: recipient.id,
      organId: organ.id,
      age: recipient.age,
      zone: recipient.zone,
      hospitalType: recipient.hospitalType,
      waitDays: day - recipient.listedDay,
      coldHours,
      effectiveQuality,
      lifeYearsGained: actualLifeYearsGained(recipient.expectedYearsAtListing, effectiveQuality)
    });
    waiting = waiting.filter((patient) => {
      return patient.status === "waiting";
    });
  }

  function recordTimelinePoint(day: number): void {
    timeline.push({
      day,
      waitlistSize: waiting.length,
      cumulativeTransplants: transplants.length,
      cumulativeDeaths: deaths.length
    });
  }

  for (let day = 0; day < config.sim.durationDays; day++) {
    for (const patient of generateNewListings(day, config, rng)) {
      admit(patient);
    }

    // Urgency drifts upward with time waited, and the sicker a patient is the
    // faster it drifts. Death risk is read off that same urgency.
    let died = false;
    for (const patient of waiting) {
      const yearsWaited = (day - patient.listedDay) / 365;
      const urgency = currentUrgency(patient.baseUrgency, yearsWaited, patient.comorbidityIndex);
      const risk = dailyDeathProbability(urgency, patient.comorbidityIndex);
      if (rng.next() < risk) {
        patient.status = "died";
        died = true;
        deaths.push({
          day,
          patientId: patient.id,
          age: patient.age,
          zone: patient.zone,
          hospitalType: patient.hospitalType,
          waitDays: day - patient.listedDay
        });
      }
    }
    if (died) {
      waiting = waiting.filter((patient) => {
        return patient.status === "waiting";
      });
    }

    const arrivingToday = arrivals.get(day);
    if (arrivingToday !== undefined) {
      for (const organ of arrivingToday) {
        allocationDecisions = allocationDecisions + 1;
        let candidates = waiting.filter((patient) => {
          return isEligible(patient, organ, config);
        });
        if (candidates.length === 0) {
          discards.push({ day, organId: organ.id, reason: DISCARD_NO_ELIGIBLE });
          continue;
        }

        // Centres decline offers. Each refusal costs time and sends the organ
        // down the list, until it is placed, refused everywhere, or too cold.
        let resolved = false;
        let declines = 0;
        for (let attempt = 0; attempt < MAX_OFFERS_PER_ORGAN; attempt++) {
          const recipient = selectRecipient(candidates, organ, config, day);
          if (recipient === null) {
            break;
          }
          if (rng.next() >= OFFER_ACCEPTANCE_RATE) {
            declines = declines + 1;
            candidates = candidates.filter((patient) => {
              return patient !== recipient;
            });
            continue;
          }
          const coldHours =
            transportHours(organ.zone, recipient.zone) + declines * OFFER_DECLINE_HOURS;
          if (coldHours > config.constraints.maxColdIschemiaHours) {
            discards.push({ day, organId: organ.id, reason: DISCARD_ISCHEMIA });
            resolved = true;
            break;
          }
          transplant(recipient, organ, day, declines);
          resolved = true;
          break;
        }
        if (!resolved) {
          discards.push({ day, organId: organ.id, reason: DISCARD_DECLINED });
        }
      }
    }

    if (day % TIMELINE_INTERVAL_DAYS === 0) {
      recordTimelinePoint(day);
    }
  }

  recordTimelinePoint(config.sim.durationDays);

  return {
    listings,
    transplants,
    deaths,
    discards,
    timeline,
    organsArrived: organs.length,
    allocationDecisions,
    stillWaiting: waiting.length
  };
}
