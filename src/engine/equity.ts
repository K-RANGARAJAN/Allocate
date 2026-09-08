// How unevenly transplants are shared out.
//
// regionGapPct is the widest gap between two zones. That is the crudest
// disparity measure there is: with three zones it reads two of them and throws
// the third away, and it moves on whichever single zone happens to be extreme.
// A Gini coefficient reads every group, so a middle zone drifting shows up.
//
// Both are returned. They disagree in a way that is worth arguing about, and
// the platform's job is to show the disagreement rather than pick.

import type {
  AgeBandRow,
  Breakdowns,
  EquityDimension,
  EquityIndex,
  HospitalTypeRow,
  ZoneRow
} from "../contract/types";
import { round1 } from "./metrics";

interface Group {
  name: string;
  ratePct: number;
}

// Gini over a set of group rates, returned on the same 0 to 100 scale as every
// other percentage on the contract. The standard relative mean difference: the
// mean absolute difference between every pair, over twice the mean.
//
// Zero when every group is equal, and zero when there is nothing to compare.
export function giniPct(groups: Group[]): number {
  if (groups.length < 2) {
    return 0;
  }

  let total = 0;
  for (const group of groups) {
    total = total + group.ratePct;
  }
  if (total <= 0) {
    return 0;
  }

  let absoluteDifference = 0;
  for (const a of groups) {
    for (const b of groups) {
      absoluteDifference = absoluteDifference + Math.abs(a.ratePct - b.ratePct);
    }
  }

  const mean = total / groups.length;
  const gini = absoluteDifference / (2 * groups.length * groups.length * mean);
  return round1(gini * 100);
}

function spreadPct(groups: Group[]): number {
  if (groups.length === 0) {
    return 0;
  }
  let best = groups[0].ratePct;
  let worst = groups[0].ratePct;
  for (const group of groups) {
    if (group.ratePct > best) {
      best = group.ratePct;
    }
    if (group.ratePct < worst) {
      worst = group.ratePct;
    }
  }
  return round1(best - worst);
}

function bestOf(groups: Group[]): Group {
  let best = groups[0];
  for (const group of groups) {
    if (group.ratePct > best.ratePct) {
      best = group;
    }
  }
  return best;
}

function worstOf(groups: Group[]): Group {
  let worst = groups[0];
  for (const group of groups) {
    if (group.ratePct < worst.ratePct) {
      worst = group;
    }
  }
  return worst;
}

function indexOf(dimension: EquityDimension, label: string, groups: Group[]): EquityIndex {
  const best = bestOf(groups);
  const worst = worstOf(groups);
  return {
    dimension,
    label,
    giniPct: giniPct(groups),
    spreadPct: spreadPct(groups),
    bestGroup: best.name,
    bestRatePct: best.ratePct,
    worstGroup: worst.name,
    worstRatePct: worst.ratePct
  };
}

function zoneGroups(rows: ZoneRow[]): Group[] {
  return rows.map((row) => {
    return { name: row.zone, ratePct: row.ratePct };
  });
}

function ageBandGroups(rows: AgeBandRow[]): Group[] {
  return rows.map((row) => {
    return { name: row.band, ratePct: row.ratePct };
  });
}

function hospitalTypeGroups(rows: HospitalTypeRow[]): Group[] {
  return rows.map((row) => {
    return { name: row.hospitalType, ratePct: row.ratePct };
  });
}

// Three rows, always all three, always in this order. The interface renders
// them as given.
export function buildEquity(breakdowns: Breakdowns): EquityIndex[] {
  return [
    indexOf("zone", "Between zones", zoneGroups(breakdowns.byZone)),
    indexOf("ageBand", "Between age bands", ageBandGroups(breakdowns.byAgeBand)),
    indexOf(
      "hospitalType",
      "Between hospital types",
      hospitalTypeGroups(breakdowns.byHospitalType)
    )
  ];
}

// The zone figure alone, for the headline metric. Same computation as the zone
// row above, so the metric and the equity table can never disagree.
export function zoneGiniPct(rows: ZoneRow[]): number {
  return giniPct(zoneGroups(rows));
}
