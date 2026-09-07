// The day-by-day allocation loop. Produces a raw event log and nothing else —
// metrics.ts does all the aggregating, so conservation stays checkable.
//
// buildStubOutcome below is the old dummy path. It is still what the public API
// returns until the last commit of task 003.

import { CONTRACT_VERSION } from "../contract/types";
import type { Outcome, PolicyConfig, TimelinePoint } from "../contract/types";
import {
  currentUrgency,
  dailyDeathProbability,
  type DeathEvent,
  type DiscardEvent,
  type ListingRecord,
  type Organ,
  type Patient,
  type SimulationLog,
  type TransplantEvent
} from "./model";
import { generateOrganArrivals } from "./organs";
import { generateInitialWaitlist, generateNewListings } from "./population";
import { createRng } from "./rng";
import {
  STUB_ORGANS_DISCARDED,
  STUB_TRANSPLANTS,
  buildStubBreakdowns,
  buildStubMetrics
} from "./metrics";

const TIMELINE_POINTS = 24;

export function buildStubTimeline(
  config: PolicyConfig,
  transplants: number,
  deaths: number
): TimelinePoint[] {
  const points: TimelinePoint[] = [];
  for (let i = 1; i <= TIMELINE_POINTS; i++) {
    const share = i / TIMELINE_POINTS;
    const day = Math.round(config.sim.durationDays * share);
    const cumulativeTransplants = Math.round(transplants * share);
    const cumulativeDeaths = Math.round(deaths * share);
    const listedSoFar = Math.round(config.sim.newListingsPerDay * day);
    const arrivals = config.sim.initialWaitlistSize + listedSoFar;
    const departures = cumulativeTransplants + cumulativeDeaths;
    let waitlistSize = arrivals - departures;
    if (waitlistSize < 0) {
      waitlistSize = 0;
    }
    points.push({ day, waitlistSize, cumulativeTransplants, cumulativeDeaths });
  }
  return points;
}

export function buildStubOutcome(config: PolicyConfig): Outcome {
  const breakdowns = buildStubBreakdowns();
  const metrics = buildStubMetrics(config, breakdowns);
  const timeline = buildStubTimeline(config, metrics.transplants, metrics.waitlistDeaths);

  return {
    contractVersion: CONTRACT_VERSION,
    config,
    metrics,
    breakdowns,
    timeline,
    meta: {
      runtimeMs: 12,
      organsArrived: STUB_TRANSPLANTS + STUB_ORGANS_DISCARDED,
      allocationDecisions: 9800
    }
  };
}

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
        void organ;
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
