// Aggregation over the raw event log. Nothing here simulates anything, and
// nothing in the simulation aggregates, so conservation stays checkable.


import type {
  AgeBandRow,
  Breakdowns,
  DiscardRow,
  HospitalType,
  HospitalTypeRow,
  Metrics,
  ZoneId,
  ZoneRow
} from "../contract/types";
import {
  DISCARD_DECLINED,
  DISCARD_ISCHEMIA,
  DISCARD_NO_ELIGIBLE,
  type SimulationLog
} from "./model";

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function ratePct(transplanted: number, listed: number): number {
  if (listed <= 0) {
    return 0;
  }
  return round1((transplanted / listed) * 100);
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

// Exactly these four strings, in exactly this order. Person B's UI orders and
// colours by them, so they do not change without a contract conversation.
export const AGE_BANDS = ["18-39", "40-59", "60-69", "70+"];

function ageBandOf(age: number): string {
  if (age < 40) {
    return "18-39";
  }
  if (age < 60) {
    return "40-59";
  }
  if (age < 70) {
    return "60-69";
  }
  return "70+";
}

function buildAgeBandRows(log: SimulationLog): AgeBandRow[] {
  const rows: AgeBandRow[] = [];
  for (const band of AGE_BANDS) {
    const listed = log.listings.filter((row) => {
      return ageBandOf(row.age) === band;
    }).length;
    const transplanted = log.transplants.filter((row) => {
      return ageBandOf(row.age) === band;
    }).length;
    rows.push({ band, listed, transplanted, ratePct: ratePct(transplanted, listed) });
  }
  return rows;
}

function buildHospitalTypeRows(log: SimulationLog): HospitalTypeRow[] {
  const types: HospitalType[] = ["government", "private"];
  const rows: HospitalTypeRow[] = [];
  for (const hospitalType of types) {
    const listed = log.listings.filter((row) => {
      return row.hospitalType === hospitalType;
    }).length;
    const transplanted = log.transplants.filter((row) => {
      return row.hospitalType === hospitalType;
    }).length;
    rows.push({ hospitalType, listed, transplanted, ratePct: ratePct(transplanted, listed) });
  }
  return rows;
}

// All three reasons are always returned, including at zero, so the UI has a
// stable table rather than one that grows and shrinks between runs.
function buildDiscardRows(log: SimulationLog): DiscardRow[] {
  const reasons = [DISCARD_NO_ELIGIBLE, DISCARD_DECLINED, DISCARD_ISCHEMIA];
  const rows: DiscardRow[] = [];
  for (const reason of reasons) {
    const count = log.discards.filter((event) => {
      return event.reason === reason;
    }).length;
    rows.push({ reason, count });
  }
  return rows;
}

export function buildBreakdowns(log: SimulationLog): Breakdowns {
  return {
    byAgeBand: buildAgeBandRows(log),
    byZone: buildZoneRows(log),
    byHospitalType: buildHospitalTypeRows(log),
    discardReasons: buildDiscardRows(log)
  };
}
