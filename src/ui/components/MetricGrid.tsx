import type { Outcome } from "../../contract/types";
import { CONTEXT_DISCLAIMER } from "../data/realWorldContext";
import { metricList } from "../metricList";
import { MetricNote } from "./MetricNote";

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

  // Rendered whether or not any tile happens to carry a note. It is the line
  // that stops the simulated figure and the published one reading as two
  // measurements of the same thing, so it does not depend on the map's contents.
  return (
    <div>
      <p className="context-disclaimer">{CONTEXT_DISCLAIMER}</p>
      <div className={className}>
        {specs.map((spec) => {
          return (
            <div className="metric" key={spec.key}>
              <span className="metric-label">{spec.label}</span>
              <span className="metric-value num">
                {props.outcome.metrics[spec.key]}
              </span>
              <MetricNote metric={spec.key} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
