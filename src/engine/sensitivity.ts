// Dummy one-lever-at-a-time sensitivity rows for the stub engine.
// Replaced by real re-runs of the simulation per lever in a later task.

import type { PolicyConfig, SensitivityRow } from "../contract/types";
import { round1 } from "./metrics";

// Mean absolute movement across the metrics a lever touches.
function impactOf(row: SensitivityRow): number {
  const deltas = Object.values(row.deltaPct);
  if (deltas.length === 0) {
    return 0;
  }
  let total = 0;
  for (const delta of deltas) {
    total = total + Math.abs(delta);
  }
  return round1(total / deltas.length);
}

export function buildStubSensitivity(config: PolicyConfig): SensitivityRow[] {
  const donationLean = config.resources.donationRateMultiplier;

  const rows: SensitivityRow[] = [
    {
      lever: "weights.urgency",
      label: "Urgency weight",
      deltaPct: { waitlistDeaths: -12.4, lifeYearsGained: -6.1, medianWaitDays: -3.2 },
      impactScore: 0
    },
    {
      lever: "weights.lifeYears",
      label: "Life-years weight",
      deltaPct: { lifeYearsGained: 9.8, waitlistDeaths: 7.3, transplants: -1.4 },
      impactScore: 0
    },
    {
      lever: "constraints.localFirst",
      label: "Local-first rule",
      deltaPct: { regionGapPct: 21.6, meanColdIschemiaHours: -14.2, transplants: 2.1 },
      impactScore: 0
    },
    {
      lever: "constraints.maxColdIschemiaHours",
      label: "Cold ischaemia ceiling",
      deltaPct: { organsDiscarded: -18.7, meanGraftQuality: -4.5, transplants: 3.6 },
      impactScore: 0
    },
    {
      lever: "constraints.maxAgeToList",
      label: "Upper age limit for listing",
      deltaPct: { lifeYearsGained: 5.2, waitlistDeaths: 11.9, p90WaitDays: -8.4 },
      impactScore: 0
    },
    {
      lever: "resources.donationRateMultiplier",
      label: "Donation rate",
      deltaPct: {
        transplants: round1(24.5 * donationLean),
        waitlistDeaths: round1(-19.3 * donationLean),
        medianWaitDays: round1(-16.8 * donationLean)
      },
      impactScore: 0
    }
  ];

  for (const row of rows) {
    row.impactScore = impactOf(row);
  }
  rows.sort((a, b) => {
    return b.impactScore - a.impactScore;
  });
  return rows;
}
