// One lever at a time. Nudge a single setting, re-run the whole simulation, and
// see what moved. The point is not to rank policies but to show which levers
// actually matter — and the answer, repeatedly, is that the ones a policymaker
// controls matter less than the supply of organs.

import type { Metrics, PolicyConfig, SensitivityRow, ZoneId } from "../contract/types";
import { round1 } from "./metrics";

export const PERTURBATION = 0.1;

export interface Lever {
  lever: string;
  label: string;
  // Returns a copy of the config with this lever moved. Direction is +1 or -1.
  apply(config: PolicyConfig, direction: number): PolicyConfig;
}

function cloneConfig(config: PolicyConfig): PolicyConfig {
  return JSON.parse(JSON.stringify(config)) as PolicyConfig;
}

function scaled(value: number, direction: number): number {
  return value * (1 + direction * PERTURBATION);
}

const ZONES: ZoneId[] = ["north", "south", "west"];

export const LEVERS: Lever[] = [
  {
    lever: "weights.urgency",
    label: "Urgency weight ±10%",
    apply(config, direction) {
      const next = cloneConfig(config);
      next.weights.urgency = scaled(next.weights.urgency, direction);
      return next;
    }
  },
  {
    lever: "weights.lifeYears",
    label: "Life-years weight ±10%",
    apply(config, direction) {
      const next = cloneConfig(config);
      next.weights.lifeYears = scaled(next.weights.lifeYears, direction);
      return next;
    }
  },
  {
    lever: "weights.waitingTime",
    label: "Waiting-time weight ±10%",
    apply(config, direction) {
      const next = cloneConfig(config);
      next.weights.waitingTime = scaled(next.weights.waitingTime, direction);
      return next;
    }
  },
  {
    lever: "constraints.maxColdIschemiaHours",
    label: "Cold ischemia ceiling ±10%",
    apply(config, direction) {
      const next = cloneConfig(config);
      const moved = Math.round(scaled(next.constraints.maxColdIschemiaHours, direction));
      next.constraints.maxColdIschemiaHours = Math.max(4, Math.min(36, moved));
      return next;
    }
  },
  {
    lever: "constraints.minUrgencyToList",
    label: "Minimum urgency to list ±1",
    apply(config, direction) {
      const next = cloneConfig(config);
      const moved = next.constraints.minUrgencyToList + direction;
      next.constraints.minUrgencyToList = Math.max(0, Math.min(10, moved));
      return next;
    }
  },
  {
    lever: "constraints.retrievalHospitalKeeps",
    label: "Retrieval hospital keeps ±1",
    apply(config, direction) {
      const next = cloneConfig(config);
      const moved = next.constraints.retrievalHospitalKeeps + direction;
      next.constraints.retrievalHospitalKeeps = Math.max(0, Math.min(2, moved));
      return next;
    }
  },
  {
    lever: "resources.donationRateMultiplier",
    label: "Donation rate ±10%",
    apply(config, direction) {
      const next = cloneConfig(config);
      next.resources.donationRateMultiplier = scaled(
        next.resources.donationRateMultiplier,
        direction
      );
      return next;
    }
  },
  {
    lever: "resources.transplantCentresPerZone",
    label: "Transplant centres ±10%",
    apply(config, direction) {
      const next = cloneConfig(config);
      for (const zone of ZONES) {
        const moved = Math.round(scaled(next.resources.transplantCentresPerZone[zone], direction));
        next.resources.transplantCentresPerZone[zone] = Math.max(1, Math.min(15, moved));
      }
      return next;
    }
  }
];

export interface LeverPair {
  lever: Lever;
  up: Metrics;
  down: Metrics;
}

// Runs both directions for one lever. The runner is passed in so the harness
// stays free of any import from index.ts.
export function runLeverPair(
  lever: Lever,
  config: PolicyConfig,
  run: (config: PolicyConfig) => Metrics
): LeverPair {
  return {
    lever,
    up: run(lever.apply(config, 1)),
    down: run(lever.apply(config, -1))
  };
}

// The old dummy path, still what the public API returns until the next commit.
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
