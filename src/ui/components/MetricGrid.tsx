import type { Outcome } from "../../contract/types";
import { metricList } from "../metricList";

export interface MetricGridProps {
  outcome: Outcome;
  running: boolean;
}

// Every value is printed exactly as the engine returned it. The engine has
// already rounded; nothing here reformats, scales or derives. The order and the
// labels are the engine's own, so a metric added to the contract appears here
// without anyone editing a list.
export function MetricGrid(props: MetricGridProps) {
  const specs = metricList(props.outcome);

  let className = "metric-grid";
  if (props.running) {
    className = "metric-grid is-running";
  }

  return (
    <div className={className}>
      {specs.map((spec) => {
        return (
          <div className="metric" key={spec.key}>
            <span className="metric-label">{spec.label}</span>
            <span className="metric-value num">
              {props.outcome.metrics[spec.key]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
