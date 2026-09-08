import { ControlsPanel } from "./components/ControlsPanel";
import { MetricGrid } from "./components/MetricGrid";
import { PresetButtons } from "./components/PresetButtons";
import { usePolicyRun } from "./state/usePolicyRun";

export function App() {
  const run = usePolicyRun();

  let status = "Simulating two years of allocation…";
  if (run.running === false) {
    status = "Two years of allocation under the current policy.";
  }

  let results = null;
  if (run.outcome !== null) {
    results = (
      <section className="panel">
        <h2 className="panel-title">Outcome</h2>
        <p className="panel-note">{status}</p>
        <MetricGrid outcome={run.outcome} running={run.running} />
      </section>
    );
  }

  let placeholder = null;
  if (run.outcome === null) {
    placeholder = (
      <section className="panel">
        <h2 className="panel-title">Outcome</h2>
        <p className="panel-note">{status}</p>
      </section>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Resonance</h1>
        <p className="app-sub">
          Set an allocation policy and see what it costs. There is no correct
          policy here — the point is to make the trade-offs visible.
        </p>
      </header>

      <div className="layout">
        <div className="stack">
          <section className="panel">
            <PresetButtons onPick={run.setConfig} />
          </section>
          <ControlsPanel config={run.config} setConfig={run.setConfig} />
        </div>

        <div className="stack">
          {placeholder}
          {results}
        </div>
      </div>
    </div>
  );
}
