// Aggregation over the raw event log. Nothing here simulates anything, and
// nothing in the simulation aggregates, so conservation stays checkable.
//
// The buildStub* functions below are the old dummy path, still used by the
// public API until the last commit of task 003.

import type {
  AgeBandRow,
  Breakdowns,
  DiscardRow,
  HospitalType,
  HospitalTypeRow,
  Metrics,
  PolicyConfig,
  ZoneId,
  ZoneRow
} from "../contract/types";
import type { SimulationLog } from "./model";

export const STUB_TRANSPLANTS = 1180;
export const STUB_ORGANS_DISCARDED = 96;

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function ratePct(transplanted: number, listed: number): number {
  if (listed <= 0) {
    return 0;
  }
  return round1((transplanted / listed) * 100);
}

export function buildStubBreakdowns(): Breakdowns {
  const ageRaw = [
    { band: "18-34", listed: 520, transplanted: 268 },
    { band: "35-49", listed: 940, transplanted: 430 },
    { band: "50-64", listed: 810, transplanted: 372 },
    { band: "65+", listed: 330, transplanted: 110 }
  ];
  const byAgeBand: AgeBandRow[] = ageRaw.map((row) => {
    return { ...row, ratePct: ratePct(row.transplanted, row.listed) };
  });

  const zoneRaw: Array<{ zone: ZoneId; listed: number; transplanted: number }> = [
    { zone: "north", listed: 1150, transplanted: 560 },
    { zone: "south", listed: 880, transplanted: 402 },
    { zone: "west", listed: 570, transplanted: 218 }
  ];
  const byZone: ZoneRow[] = zoneRaw.map((row) => {
    return { ...row, ratePct: ratePct(row.transplanted, row.listed) };
  });

  const hospitalRaw: Array<{ hospitalType: HospitalType; listed: number; transplanted: number }> = [
    { hospitalType: "government", listed: 1560, transplanted: 638 },
    { hospitalType: "private", listed: 1040, transplanted: 542 }
  ];
  const byHospitalType: HospitalTypeRow[] = hospitalRaw.map((row) => {
    return { ...row, ratePct: ratePct(row.transplanted, row.listed) };
  });

  const discardReasons: DiscardRow[] = [
    { reason: "Cold ischaemia limit exceeded", count: 41 },
    { reason: "No compatible recipient found", count: 34 },
    { reason: "Organ quality below threshold", count: 21 }
  ];

  return { byAgeBand, byZone, byHospitalType, discardReasons };
}

export function widestZoneGapPct(rows: ZoneRow[]): number {
  if (rows.length === 0) {
    return 0;
  }
  let best = rows[0].ratePct;
  let worst = rows[0].ratePct;
  for (const row of rows) {
    if (row.ratePct > best) {
      best = row.ratePct;
    }
    if (row.ratePct < worst) {
      worst = row.ratePct;
    }
  }
  return round1(best - worst);
}

function clamp01(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

export function buildStubMetrics(config: PolicyConfig, breakdowns: Breakdowns): Metrics {
  // Two metrics lean on the urgency weight so the interface can see a slider bite.
  // Leaning hard on urgency saves people from dying on the list, and buys fewer
  // life-years, because the sickest recipients are not the longest-lived ones.
  const urgencyLean = clamp01(config.weights.urgency);
  const waitlistDeaths = Math.round(340 - 120 * urgencyLean);
  const lifeYearsGained = round1(9600 - 2400 * urgencyLean);

  return {
    transplants: STUB_TRANSPLANTS,
    lifeYearsGained,
    waitlistDeaths,
    medianWaitDays: 412,
    p90WaitDays: 690,
    organsDiscarded: STUB_ORGANS_DISCARDED,
    meanColdIschemiaHours: 11.4,
    meanGraftQuality: 0.78,
    regionGapPct: widestZoneGapPct(breakdowns.byZone)
  };
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function meanOf(total: number, count: number): number {
  if (count === 0) {
    return 0;
  }
  return total / count;
}

// Nearest-rank on an already sorted array. Returns 0 for an empty series so a
// run that transplants nobody reports zero rather than NaN.
function percentileOf(sorted: number[], fraction: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  const index = Math.floor(fraction * (sorted.length - 1));
  return sorted[index];
}

export function buildZoneRows(log: SimulationLog): ZoneRow[] {
  const zones: ZoneId[] = ["north", "south", "west"];
  const rows: ZoneRow[] = [];
  for (const zone of zones) {
    const listed = log.listings.filter((row) => {
      return row.zone === zone;
    }).length;
    const transplanted = log.transplants.filter((row) => {
      return row.zone === zone;
    }).length;
    rows.push({ zone, listed, transplanted, ratePct: ratePct(transplanted, listed) });
  }
  return rows;
}

// Wait times are measured over transplanted patients, the standard registry
// reading. People still waiting have no completed wait to report.
export function buildMetrics(log: SimulationLog): Metrics {
  const waitDays = log.transplants
    .map((event) => {
      return event.waitDays;
    })
    .sort((a, b) => {
      return a - b;
    });

  let lifeYearsTotal = 0;
  let coldTotal = 0;
  let qualityTotal = 0;
  for (const event of log.transplants) {
    lifeYearsTotal = lifeYearsTotal + event.lifeYearsGained;
    coldTotal = coldTotal + event.coldHours;
    qualityTotal = qualityTotal + event.effectiveQuality;
  }

  const count = log.transplants.length;

  return {
    transplants: count,
    lifeYearsGained: round1(lifeYearsTotal),
    waitlistDeaths: log.deaths.length,
    medianWaitDays: Math.round(percentileOf(waitDays, 0.5)),
    p90WaitDays: Math.round(percentileOf(waitDays, 0.9)),
    organsDiscarded: log.discards.length,
    meanColdIschemiaHours: round1(meanOf(coldTotal, count)),
    meanGraftQuality: round2(meanOf(qualityTotal, count)),
    regionGapPct: widestZoneGapPct(buildZoneRows(log))
  };
}
