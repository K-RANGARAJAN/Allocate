// Is the number the policy, or is it the opening backlog still clearing?
//
// The run starts with 2000 backdated patients, some of whom have been waiting
// 900 days before day zero. The first months of any run are that queue draining,
// which is a property of how the world was seeded rather than of the policy
// under test. This measures the final window against the window before it, so a
// metric that is still moving can be shown as still moving.
//
// The windowed numbers come out of the same buildMetrics as the headline ones.
// A window is just a log with fewer events in it, so there is no second
// implementation to drift out of step.

import type { MetricKey, Metrics, SteadyStateRow } from "../contract/types";
import { COMPARISON_ROWS } from "./compare";
import { buildMetrics, round1 } from "./metrics";
import { STEADY_STATE_DRIFT_TOLERANCE_PCT, STEADY_STATE_WINDOW_DAYS } from "./model";
import type { SimulationLog } from "./model";

export type DayWindow = [number, number];

// Rates are measured against patients *listed*, and someone listed inside a
// window is very often transplanted long after it, so a rate confined to a
// window is not a rate of anything. These three are reported as not windowable
// rather than given a number that would be read as meaningful.
const NOT_WINDOWABLE: MetricKey[] = ["regionGapPct", "overSixtyRatePct", "zoneGiniPct"];

function isWindowable(metric: MetricKey): boolean {
  return NOT_WINDOWABLE.indexOf(metric) === -1;
}

// The two windows to compare, latest first. Both are [inclusive, exclusive).
// A run too short to hold two whole windows splits what it has in half instead,
// so a shortened sensitivity or sweep run still reports something honest.
export function windowsFor(durationDays: number): { early: DayWindow; late: DayWindow } {
  let width = STEADY_STATE_WINDOW_DAYS;
  if (durationDays < width * 2) {
    width = Math.floor(durationDays / 2);
  }
  const lateFrom = durationDays - width;
  const earlyFrom = lateFrom - width;
  return {
    early: [Math.max(0, earlyFrom), lateFrom],
    late: [lateFrom, durationDays]
  };
}

// Everything that happened inside the window. Listings are carried through
// whole: they are only read by the rate metrics, which this module does not
// report, and filtering them would invite someone to trust those rates later.
function logWithin(log: SimulationLog, window: DayWindow): SimulationLog {
  const from = window[0];
  const to = window[1];

  return {
    listings: log.listings,
    transplants: log.transplants.filter((event) => {
      return event.day >= from && event.day < to;
    }),
    deaths: log.deaths.filter((event) => {
      return event.day >= from && event.day < to;
    }),
    discards: log.discards.filter((event) => {
      return event.day >= from && event.day < to;
    }),
    timeline: log.timeline.filter((point) => {
      return point.day >= from && point.day < to;
    }),
    organsArrived: log.organsArrived,
    allocationDecisions: log.allocationDecisions,
    stillWaiting: log.stillWaiting
  };
}

function driftPct(early: number, late: number): number {
  if (early === 0) {
    return 0;
  }
  return round1(((late - early) / early) * 100);
}

export function buildSteadyState(log: SimulationLog, durationDays: number): SteadyStateRow[] {
  const windows = windowsFor(durationDays);
  const early: Metrics = buildMetrics(logWithin(log, windows.early));
  const late: Metrics = buildMetrics(logWithin(log, windows.late));

  const rows: SteadyStateRow[] = [];
  for (const row of COMPARISON_ROWS) {
    if (!isWindowable(row.metric)) {
      rows.push({
        metric: row.metric,
        label: row.label,
        earlyWindow: 0,
        lateWindow: 0,
        driftPct: 0,
        stabilised: false,
        windowable: false
      });
      continue;
    }

    const earlyValue = early[row.metric];
    const lateValue = late[row.metric];
    const drift = driftPct(earlyValue, lateValue);

    rows.push({
      metric: row.metric,
      label: row.label,
      earlyWindow: earlyValue,
      lateWindow: lateValue,
      driftPct: drift,
      stabilised: Math.abs(drift) <= STEADY_STATE_DRIFT_TOLERANCE_PCT,
      windowable: true
    });
  }

  return rows;
}
