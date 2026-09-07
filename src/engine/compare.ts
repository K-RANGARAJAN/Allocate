// Two outcomes, one table. The interface is not allowed to compute a difference
// and there was nothing on the contract that returned one, which left the whole
// demo — "the over-60 rate falls from 10.2% to nothing" — with no honest way of
// reaching the screen. This closes that. It simulates nothing: both outcomes are
// already in hand, so it is instant.

import type {
  MetricDelta,
  MetricDirection,
  MetricKey,
  Outcome,
  ScenarioComparison
} from "../contract/types";
import { round1 } from "./metrics";

// Display order, and the label the interface shows. Kept here rather than in
// model.ts because none of it is a tuning constant — it is what each metric is
// called and which way it reads.
export const COMPARISON_ROWS: { metric: MetricKey; label: string; better: MetricDirection }[] = [
  { metric: "transplants", label: "Transplants", better: "higher" },
  { metric: "lifeYearsGained", label: "Life-years gained", better: "higher" },
  { metric: "waitlistDeaths", label: "Waitlist deaths", better: "lower" },
  { metric: "overSixtyRatePct", label: "Over-60 transplant rate %", better: "neutral" },
  { metric: "regionGapPct", label: "Regional gap %", better: "lower" },
  { metric: "medianWaitDays", label: "Median wait, days", better: "lower" },
  { metric: "p90WaitDays", label: "90th percentile wait, days", better: "lower" },
  { metric: "organsDiscarded", label: "Organs discarded", better: "lower" },
  { metric: "meanColdIschemiaHours", label: "Mean cold ischemia, hours", better: "lower" },
  { metric: "meanGraftQuality", label: "Mean graft quality", better: "higher" }
];

function percentMove(before: number, after: number): number {
  if (before === 0) {
    return 0;
  }
  return round1(((after - before) / before) * 100);
}

export function buildComparison(
  baseline: Outcome,
  scenario: Outcome,
  baselineLabel: string,
  scenarioLabel: string
): ScenarioComparison {
  const rows: MetricDelta[] = [];

  for (const row of COMPARISON_ROWS) {
    const before = baseline.metrics[row.metric];
    const after = scenario.metrics[row.metric];
    rows.push({
      metric: row.metric,
      label: row.label,
      before,
      after,
      delta: round1(after - before),
      deltaPct: percentMove(before, after),
      betterDirection: row.better
    });
  }

  return { baselineLabel, scenarioLabel, rows };
}
