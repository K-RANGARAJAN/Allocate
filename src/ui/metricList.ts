import type { MetricKey, Outcome } from "../contract/types";

export interface MetricSpec {
  key: MetricKey;
  label: string;
}

// The engine's own display order and labels, read straight off the Outcome.
// steadyState carries one row per metric in the same order compareOutcomes
// uses, so the header, the grid and the comparison table can never name a
// metric two different ways, and a metric added to the contract appears on
// screen without anyone editing a list here.
export function metricList(outcome: Outcome): MetricSpec[] {
  return outcome.steadyState.map((row) => {
    return { key: row.metric, label: row.label };
  });
}

export function labelFor(outcome: Outcome, key: MetricKey) {
  for (const row of outcome.steadyState) {
    if (row.metric === key) {
      return row.label;
    }
  }
  return key;
}
