import type { PolicyConfig } from "../../contract/types";
import type { EngineWorker } from "../state/useEngineWorker";
import { SensitivityBars } from "../charts/SensitivityBars";
import { ProgressBar } from "./ProgressBar";

export interface SensitivityPanelProps {
  config: PolicyConfig;
  worker: EngineWorker;
}

// Seventeen simulations, 10 to 12 seconds. On demand only, behind this button,
// in the worker. It is never called from a control change.
export function SensitivityPanel(props: SensitivityPanelProps) {
  const worker = props.worker;
  const running = worker.busy === "sensitivity";

  let body = (
    <p className="panel-note">
      One lever moved at a time, ranked by impact. Seventeen simulations, so it
      runs only when you ask.
    </p>
  );
  if (worker.sensitivity !== null) {
    body = <SensitivityBars rows={worker.sensitivity} />;
  }

  let progress = null;
  if (running) {
    progress = (
      <ProgressBar
        label="Running sensitivity"
        elapsedMs={worker.elapsedMs}
        expectedSeconds="10 to 12 seconds"
      />
    );
  }

  let note = null;
  if (worker.sensitivity !== null) {
    note = (
      <p className="compare-note">
        Levers reading exactly zero are honestly zero for this config — the
        cascade-only levers do nothing in score mode, and the cold ischemia
        ceiling has slack at 24 hours.
      </p>
    );
  }

  function run() {
    worker.start({ kind: "sensitivity", config: props.config }, props.config);
  }

  return (
    <section className="panel">
      <h2 className="panel-title">Sensitivity</h2>
      <div className="compare-head">
        <button type="button" className="btn" disabled={worker.busy !== null} onClick={run}>
          Run sensitivity
        </button>
      </div>
      {progress}
      {body}
      {note}
    </section>
  );
}
