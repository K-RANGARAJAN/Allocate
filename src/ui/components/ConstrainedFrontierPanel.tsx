import { useState } from "react";

import type { MetricKey, Outcome, PolicyConfig } from "../../contract/types";
import type { EngineWorker } from "../state/useEngineWorker";
import { metricList } from "../metricList";
import { FrontierVerdict } from "./FrontierVerdict";
import { NumberField } from "./NumberField";
import { ProgressBar } from "./ProgressBar";
import { Select } from "./Select";

const POINTS = 12;

const DIRECTIONS = [
  { value: "atLeast", label: "at least" },
  { value: "atMost", label: "at most" }
];

export interface ConstrainedFrontierPanelProps {
  outcome: Outcome;
  config: PolicyConfig;
  worker: EngineWorker;
}

export function ConstrainedFrontierPanel(props: ConstrainedFrontierPanelProps) {
  const worker = props.worker;
  const [metric, setMetric] = useState<MetricKey>("overSixtyRatePct");
  const [direction, setDirection] = useState("atLeast");
  const [value, setValue] = useState(12);

  const options = metricList(props.outcome).map((spec) => {
    return { value: spec.key, label: spec.label };
  });

  let progress = null;
  if (worker.busy === "frontier") {
    progress = (
      <ProgressBar
        label="Pricing the constraint"
        elapsedMs={worker.elapsedMs}
        expectedSeconds={`about 8 seconds at ${POINTS} points`}
      />
    );
  }

  let body = (
    <p className="panel-note">
      Set a floor you will not go below, then price it. You draw the line; this
      reports what holding it costs. It names no winner.
    </p>
  );
  // No scatter here on purpose: ParetoScatter marks points by domination, not
  // by whether they meet this constraint, and reusing it would say the wrong
  // thing. The frontier itself is plotted on the panel above.
  if (worker.frontier !== null) {
    body = <FrontierVerdict report={worker.frontier} />;
  }

  function run() {
    const direct = direction as "atLeast" | "atMost";
    const constraint = { metric, direction: direct, value };
    const request = { kind: "frontier" as const, config: props.config };
    worker.start({ ...request, points: POINTS, constraint, objective: "lifeYearsGained" });
  }

  return (
    <section className="panel">
      <h2 className="panel-title">What a floor costs</h2>
      <div className="frontier-controls">
        <Select
          label="Hold"
          value={metric}
          options={options}
          onChange={(next) => setMetric(next as MetricKey)}
        />
        <Select
          label="Direction"
          value={direction}
          options={DIRECTIONS}
          onChange={setDirection}
        />
        <NumberField label="Value" value={value} min={0} max={100000} onChange={setValue} />
        <button type="button" className="btn" disabled={worker.busy !== null} onClick={run}>
          Price it
        </button>
      </div>
      {progress}
      {body}
    </section>
  );
}
