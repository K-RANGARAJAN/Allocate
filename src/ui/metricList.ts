import type { MetricKey, Outcome } from "../contract/types";

export interface MetricSpec {
  key: MetricKey;
  label: string;
}

// The engine's own display order and labels, read straight off the Outcome.
// `metricOrder` exists for exactly this: one entry per metric, always complete,
// always in the order compareOutcomes uses. So the header, the grid and the
// comparison table can never name a metric two different ways, and a metric
// added to the contract appears on screen without anyone editing a list here.
//
// This read steadyState until contract 1.7.0, which worked only because that
// array is guaranteed complete. metricOrder says what it is for.
export function metricList(outcome: Outcome): MetricSpec[] {
  return outcome.metricOrder.map((row) => {
    return { key: row.metric, label: row.label };
  });
}

export function labelFor(outcome: Outcome, key: MetricKey) {
  for (const row of outcome.metricOrder) {
    if (row.metric === key) {
      return row.label;
    }
  }
  return key;
}
