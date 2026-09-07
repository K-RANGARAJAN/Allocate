// Dummy metrics and breakdowns for the stub engine.
// Replaced by real aggregation over simulation events in a later task.

import type {
  AgeBandRow,
  Breakdowns,
  DiscardRow,
  HospitalType,
  HospitalTypeRow,
  ZoneId,
  ZoneRow
} from "../contract/types";

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
