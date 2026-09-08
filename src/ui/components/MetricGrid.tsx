import type { MetricKey, Metrics } from "../../contract/types";

export interface MetricSpec {
  key: MetricKey;
  label: string;
}

// Order and labels are the engine's own, taken from the rows compareOutcomes
// returns, so the grid and the comparison table never name the same metric two
// different ways. The labels already carry their units.
export const METRIC_ORDER: MetricSpec[] = [
  { key: "transplants", label: "Transplants" },
  { key: "lifeYearsGained", label: "Life-years gained" },
  { key: "waitlistDeaths", label: "Waitlist deaths" },
  { key: "overSixtyRatePct", label: "Over-60 transplant rate %" },
  { key: "regionGapPct", label: "Regional gap %" },
  { key: "medianWaitDays", label: "Median wait, days" },
  { key: "p90WaitDays", label: "90th percentile wait, days" },
  { key: "organsDiscarded", label: "Organs discarded" },
  { key: "meanColdIschemiaHours", label: "Mean cold ischemia, hours" },
  { key: "meanGraftQuality", label: "Mean graft quality" }
];

export interface MetricGridProps {
  metrics: Metrics;
  running: boolean;
}

// Every value is printed exactly as the engine returned it. The engine has
// already rounded; nothing here reformats, scales or derives.
export function MetricGrid(props: MetricGridProps) {
  let className = "metric-grid";
  if (props.running) {
    className = "metric-grid is-running";
  }

  return (
    <div className={className}>
      {METRIC_ORDER.map((spec) => {
        return (
          <div className="metric" key={spec.key}>
            <span className="metric-label">{spec.label}</span>
            <span className="metric-value num">{props.metrics[spec.key]}</span>
          </div>
        );
      })}
    </div>
  );
}
