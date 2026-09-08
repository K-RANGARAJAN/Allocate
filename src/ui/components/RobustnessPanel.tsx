import type { PolicyConfig, RobustnessRow } from "../../contract/types";
import type { EngineWorker } from "../state/useEngineWorker";
import { ProgressBar } from "./ProgressBar";

export interface RobustnessPanelProps {
  config: PolicyConfig;
  worker: EngineWorker;
}

// A unanimous row is not an average and must not read as one. Every seed
// returned the same value, and that is the whole force of the finding.
function bandFor(row: RobustnessRow, seedCount: number) {
  if (row.unanimous) {
    return `${row.mean} on all ${seedCount} seeds`;
  }
  return `${row.mean} mean, ${row.min} to ${row.max}`;
}

export function RobustnessPanel(props: RobustnessPanelProps) {
  const worker = props.worker;
  const report = worker.robustness;

  let progress = null;
  if (worker.busy === "robustness") {
    progress = (
      <ProgressBar
        label="Re-running every seed"
        elapsedMs={worker.elapsedMs}
        expectedSeconds="about 13 seconds"
      />
    );
  }

  let body = (
    <p className="panel-note">
      The same policy on twenty seeds: is that the policy, or is it your seed?
    </p>
  );

  if (report !== null) {
    const seedCount = report.seeds.length;
    body = (
      <table className="data-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Across {seedCount} seeds</th>
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row) => {
            return (
              <tr key={row.metric}>
                <td>{row.label}</td>
                <td>{bandFor(row, seedCount)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  function run() {
    worker.start({ kind: "robustness", config: props.config }, props.config);
  }

  return (
    <section className="panel">
      <h2 className="panel-title">Does it survive the seed?</h2>
      <div className="compare-head">
        <button type="button" className="btn" disabled={worker.busy !== null} onClick={run}>
          Run robustness
        </button>
      </div>
      {progress}
      {body}
    </section>
  );
}
