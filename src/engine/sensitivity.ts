// One lever at a time. Nudge a single setting, re-run the whole simulation, and
// see what moved. The point is not to rank policies but to show which levers
// actually matter — and the answer, repeatedly, is that the ones a policymaker
// controls matter less than the supply of organs.

import type { MetricKey, Metrics, PolicyConfig, SensitivityRow, ZoneId } from "../contract/types";
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

const METRIC_KEYS: MetricKey[] = [
  "transplants",
  "lifeYearsGained",
  "waitlistDeaths",
  "medianWaitDays",
  "p90WaitDays",
  "organsDiscarded",
  "meanColdIschemiaHours",
  "meanGraftQuality",
  "regionGapPct"
];

// A symmetric difference: how much a metric moves for one step *up* on this
// lever, measured from both sides so a lopsided response does not read as a
// bigger effect than it is. Expressed as a percentage of the baseline.
function symmetricDeltaPct(up: number, down: number, baseline: number): number {
  if (baseline === 0) {
    return 0;
  }
  const halfSpread = (up - down) / 2;
  return round1((halfSpread / baseline) * 100);
}

export function buildSensitivity(
  config: PolicyConfig,
  run: (config: PolicyConfig) => Metrics
): SensitivityRow[] {
  const baseline = run(config);
  const rows: SensitivityRow[] = [];

  for (const lever of LEVERS) {
    const pair = runLeverPair(lever, config, run);
    const deltaPct: Partial<Record<MetricKey, number>> = {};
    let absoluteTotal = 0;

    for (const key of METRIC_KEYS) {
      const delta = symmetricDeltaPct(pair.up[key], pair.down[key], baseline[key]);
      deltaPct[key] = delta;
      absoluteTotal = absoluteTotal + Math.abs(delta);
    }

    rows.push({
      lever: lever.lever,
      label: lever.label,
      deltaPct,
      impactScore: round1(absoluteTotal / METRIC_KEYS.length)
    });
  }

  rows.sort((a, b) => {
    return b.impactScore - a.impactScore;
  });
  return rows;
}
