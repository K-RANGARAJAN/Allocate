// Is that just your seed?
//
// Every headline number in this project comes out of one simulation at seed 42.
// That is the first question a judge asks, and until now the answer lived in a
// terminal script nobody in the room can see. This runs the same config across
// many seeds and reports each metric as a range rather than a point, so the
// answer is on screen instead of being claimed.
//
// It re-runs the whole simulation once per seed, so it is the most expensive
// call on the contract. It belongs behind a button, in a worker, never on a
// control change.

import type {
  MetricKey,
  Metrics,
  PolicyConfig,
  RobustnessReport,
  RobustnessRow
} from "../contract/types";
import { COMPARISON_ROWS } from "./compare";
import { round1 } from "./metrics";
import { DEFAULT_ROBUSTNESS_SEEDS } from "./model";

function withSeed(config: PolicyConfig, seed: number): PolicyConfig {
  const next = JSON.parse(JSON.stringify(config)) as PolicyConfig;
  next.sim.seed = seed;
  return next;
}

function summarise(metric: MetricKey, label: string, values: number[]): RobustnessRow {
  let total = 0;
  let min = values[0];
  let max = values[0];
  let unanimous = true;

  for (const value of values) {
    total = total + value;
    if (value < min) {
      min = value;
    }
    if (value > max) {
      max = value;
    }
    if (value !== values[0]) {
      unanimous = false;
    }
  }

  return {
    metric,
    label,
    mean: round1(total / values.length),
    min: round1(min),
    max: round1(max),
    unanimous
  };
}

// The runner is passed in so this module never imports index.ts, the same way
// the sensitivity and pareto harnesses stay free of it.
export function buildRobustness(
  config: PolicyConfig,
  seeds: number[],
  run: (config: PolicyConfig) => Metrics
): RobustnessReport {
  const startedAt = Date.now();
  let useSeeds = seeds;
  if (useSeeds.length === 0) {
    useSeeds = DEFAULT_ROBUSTNESS_SEEDS;
  }

  const collected: Partial<Record<MetricKey, number[]>> = {};
  for (const row of COMPARISON_ROWS) {
    collected[row.metric] = [];
  }

  for (const seed of useSeeds) {
    const metrics = run(withSeed(config, seed));
    for (const row of COMPARISON_ROWS) {
      const bucket = collected[row.metric];
      if (bucket) {
        bucket.push(metrics[row.metric]);
      }
    }
  }

  const rows: RobustnessRow[] = [];
  for (const row of COMPARISON_ROWS) {
    const values = collected[row.metric];
    if (values && values.length > 0) {
      rows.push(summarise(row.metric, row.label, values));
    }
  }

  return {
    seeds: useSeeds,
    rows,
    runtimeMs: Date.now() - startedAt
  };
}
