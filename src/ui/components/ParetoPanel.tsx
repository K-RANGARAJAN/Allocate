import type { PolicyConfig } from "../../contract/types";
import type { EngineWorker } from "../state/useEngineWorker";
import { ParetoScatter } from "../charts/ParetoScatter";
import { ProgressBar } from "./ProgressBar";

const POINTS = 20;

export interface ParetoPanelProps {
  config: PolicyConfig;
  worker: EngineWorker;
}

// The sweep always runs in score mode whatever the config says, so the subtitle
// has to be honest about that. Reading config.mode is reading config, not
// computing a metric.
function subtitleFor(mode: PolicyConfig["mode"]) {
  if (mode === "score") {
    return "Each point is a full two-year simulation at a different weighting. Your current policy is marked.";
  }

  let modeName = "cascade mode";
  let allocatesBy = "allocates by tier";
  if (mode === "fcfs") {
    modeName = "first-come mode";
    allocatesBy = "allocates by wait length";
  }

  return `You're in ${modeName}, which ${allocatesBy} rather than by weights — so there's no weight space to sweep for it. This maps the score-policy space under your current constraints. The marked point is the nearest weighting, not where you are.`;
}

export function ParetoPanel(props: ParetoPanelProps) {
  const worker = props.worker;
  const running = worker.busy === "pareto";

  let chart = null;
  if (worker.pareto !== null) {
    chart = <ParetoScatter points={worker.pareto} />;
  }

  let progress = null;
  if (running) {
    progress = (
      <ProgressBar
        label="Sweeping the weight space"
        elapsedMs={worker.elapsedMs}
        expectedSeconds={`about 14 seconds at ${POINTS} points`}
      />
    );
  }

  function run() {
    worker.start({ kind: "pareto", config: props.config, points: POINTS });
  }

  return (
    <section className="panel">
      <h2 className="panel-title">Trade-off frontier — weighted-score policies</h2>
      <p className="panel-note">{subtitleFor(props.config.mode)}</p>
      <div className="compare-head">
        <button type="button" className="btn" disabled={worker.busy !== null} onClick={run}>
          Run sweep
        </button>
      </div>
      {progress}
      {chart}
    </section>
  );
}
