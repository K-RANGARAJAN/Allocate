// Three rules, one population.
//
// Everything else in this project compares weightings of a single scoring rule.
// This compares the rules themselves: the weighted score, the Tamil Nadu
// cascade, and first come first served. Same seed, so the same synthetic
// patients and the same organs arrive in the same order under all three, and the
// only thing that differs is who gets chosen.
//
// It is the comparison the project is actually about. A weighted score is what
// the textbooks and most Western registries do. The cascade is what TRANSTAN
// operates. First come first served is the null hypothesis nobody defends but
// everybody should be measured against.

import type {
  MetricKey,
  Metrics,
  ModeComparison,
  ModeGroupRow,
  ModeMetricRow,
  Outcome,
  PolicyConfig,
  PolicyMode
} from "../contract/types";
import { COMPARISON_ROWS } from "./compare";
import { round1 } from "./metrics";

export const MODES: PolicyMode[] = ["score", "cascade", "fcfs"];

function withMode(config: PolicyConfig, mode: PolicyMode): PolicyConfig {
  const next = JSON.parse(JSON.stringify(config)) as PolicyConfig;
  next.mode = mode;
  return next;
}

// Which rule reads best on this metric. Null where the metric has no honest
// direction, which is deliberate: the over-60 rate is the argument this platform
// refuses to settle, so nothing here declares a winner on it.
function bestOn(metric: MetricKey, values: Record<PolicyMode, number>): PolicyMode | null {
  let direction = "neutral";
  for (const row of COMPARISON_ROWS) {
    if (row.metric === metric) {
      direction = row.better;
    }
  }
  if (direction === "neutral") {
    return null;
  }

  let winner = MODES[0];
  for (const mode of MODES) {
    if (direction === "higher" && values[mode] > values[winner]) {
      winner = mode;
    }
    if (direction === "lower" && values[mode] < values[winner]) {
      winner = mode;
    }
  }

  // A tie is not a win. If every rule lands on the same number the metric does
  // not separate them and saying one is best would be an invention.
  let allEqual = true;
  for (const mode of MODES) {
    if (values[mode] !== values[winner]) {
      allEqual = false;
    }
  }
  if (allEqual) {
    return null;
  }

  return winner;
}

function spreadOf(values: Record<PolicyMode, number>): number {
  let low = values[MODES[0]];
  let high = values[MODES[0]];
  for (const mode of MODES) {
    if (values[mode] < low) {
      low = values[mode];
    }
    if (values[mode] > high) {
      high = values[mode];
    }
  }
  return round1(high - low);
}

function metricRows(byMode: Record<PolicyMode, Metrics>): ModeMetricRow[] {
  const rows: ModeMetricRow[] = [];
  for (const row of COMPARISON_ROWS) {
    const values = {
      score: byMode.score[row.metric],
      cascade: byMode.cascade[row.metric],
      fcfs: byMode.fcfs[row.metric]
    } as Record<PolicyMode, number>;

    rows.push({
      metric: row.metric,
      label: row.label,
      score: values.score,
      cascade: values.cascade,
      fcfs: values.fcfs,
      best: bestOn(row.metric, values),
      spread: spreadOf(values)
    });
  }
  return rows;
}

function ageBandRows(byMode: Record<PolicyMode, Outcome>): ModeGroupRow[] {
  const rows: ModeGroupRow[] = [];
  const bands = byMode.score.breakdowns.byAgeBand;

  for (let i = 0; i < bands.length; i++) {
    rows.push({
      group: bands[i].band,
      score: byMode.score.breakdowns.byAgeBand[i].ratePct,
      cascade: byMode.cascade.breakdowns.byAgeBand[i].ratePct,
      fcfs: byMode.fcfs.breakdowns.byAgeBand[i].ratePct
    });
  }
  return rows;
}

function zoneRows(byMode: Record<PolicyMode, Outcome>): ModeGroupRow[] {
  const rows: ModeGroupRow[] = [];
  const zones = byMode.score.breakdowns.byZone;

  for (let i = 0; i < zones.length; i++) {
    rows.push({
      group: zones[i].zone,
      score: byMode.score.breakdowns.byZone[i].ratePct,
      cascade: byMode.cascade.breakdowns.byZone[i].ratePct,
      fcfs: byMode.fcfs.breakdowns.byZone[i].ratePct
    });
  }
  return rows;
}

// The runner is injected so this module never imports index.ts, the same way the
// sensitivity, pareto and robustness harnesses stay free of it.
export function buildModeComparison(
  config: PolicyConfig,
  run: (config: PolicyConfig) => Outcome
): ModeComparison {
  const startedAt = Date.now();

  const outcomes = {
    score: run(withMode(config, "score")),
    cascade: run(withMode(config, "cascade")),
    fcfs: run(withMode(config, "fcfs"))
  } as Record<PolicyMode, Outcome>;

  const metrics = {
    score: outcomes.score.metrics,
    cascade: outcomes.cascade.metrics,
    fcfs: outcomes.fcfs.metrics
  } as Record<PolicyMode, Metrics>;

  return {
    seed: config.sim.seed,
    currentMode: config.mode,
    rows: metricRows(metrics),
    byAgeBand: ageBandRows(outcomes),
    byZone: zoneRows(outcomes),
    runtimeMs: Date.now() - startedAt
  };
}
