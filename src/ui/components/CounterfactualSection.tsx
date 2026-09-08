import type { PolicyConfig } from "../../contract/types";
import type { EngineWorker } from "../state/useEngineWorker";
import type { Scenario } from "../state/useScenarios";
import {
  CounterfactualBands,
  CounterfactualHeadline,
  CounterfactualSample
} from "./CounterfactualPanel";
import { ProgressBar } from "./ProgressBar";

export interface CounterfactualSectionProps {
  baseline: Scenario | null;
  config: PolicyConfig;
  worker: EngineWorker;
}

export function CounterfactualSection(props: CounterfactualSectionProps) {
  const worker = props.worker;
  const report = worker.counterfactual;
  const baseline = props.baseline;

  let progress = null;
  if (worker.busy === "counterfactual") {
    progress = (
      <ProgressBar
        label="Replaying both policies on one population"
        elapsedMs={worker.elapsedMs}
        expectedSeconds="about 1.5 seconds"
      />
    );
  }

  let body = (
    <p className="panel-note">
      Save a scenario and pick it as the baseline, then run this to see which
      individual patients the change moved.
    </p>
  );

  if (report !== null) {
    body = (
      <div>
        <CounterfactualHeadline report={report} />
        <CounterfactualBands report={report} />
        <CounterfactualSample report={report} />
      </div>
    );
  }

  function run() {
    if (baseline === null) {
      return;
    }
    worker.start(
      {
        kind: "counterfactual",
        baseline: baseline.outcome.config,
        scenario: props.config,
        baselineLabel: baseline.label,
        scenarioLabel: "Current"
      },
      props.config
    );
  }

  let disabled = worker.busy !== null;
  if (baseline === null) {
    disabled = true;
  }

  return (
    <section className="panel">
      <h2 className="panel-title">Who the change moved</h2>
      <div className="compare-head">
        <button type="button" className="btn" disabled={disabled} onClick={run}>
          Run counterfactual
        </button>
      </div>
      {progress}
      {body}
    </section>
  );
}
