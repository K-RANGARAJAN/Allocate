import { BreakdownTables } from "./components/BreakdownTables";
import { ControlsPanel } from "./components/ControlsPanel";
import { MetricGrid } from "./components/MetricGrid";
import { ParetoPanel } from "./components/ParetoPanel";
import { ScenarioPanel } from "./components/ScenarioPanel";
import { SensitivityPanel } from "./components/SensitivityPanel";
import { TimelineChart } from "./charts/TimelineChart";
import { PresetButtons } from "./components/PresetButtons";
import { usePolicyRun } from "./state/usePolicyRun";
import { useEngineWorker } from "./state/useEngineWorker";
import { useScenarios } from "./state/useScenarios";

export function App() {
  const run = usePolicyRun();
  const scenarios = useScenarios();
  const worker = useEngineWorker();

  let status = "Simulating two years of allocation…";
  if (run.running === false) {
    status = "Two years of allocation under the current policy.";
  }

  let results = null;
  let tables = null;
  let timeline = null;
  let compare = null;
  let sensitivity = null;
  let pareto = null;
  if (run.outcome !== null) {
    results = (
      <section className="panel">
        <h2 className="panel-title">Outcome</h2>
        <p className="panel-note">{status}</p>
        <MetricGrid metrics={run.outcome.metrics} running={run.running} />
      </section>
    );

    pareto = <ParetoPanel config={run.config} worker={worker} />;

    sensitivity = <SensitivityPanel config={run.config} worker={worker} />;

    compare = <ScenarioPanel outcome={run.outcome} store={scenarios} />;

    timeline = (
      <section className="panel">
        <h2 className="panel-title">Over the two years</h2>
        <p className="panel-note">
          Sampled by the engine at 26 points across the run, plotted as given.
        </p>
        <TimelineChart timeline={run.outcome.timeline} />
      </section>
    );

    tables = (
      <section className="panel">
        <h2 className="panel-title">Breakdowns</h2>
        <p className="panel-note">
          Every table keeps a fixed set of rows, including rows at zero, so the
          shape never changes between runs.
        </p>
        <BreakdownTables breakdowns={run.outcome.breakdowns} />
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
          {compare}
          {timeline}
          {tables}
          {sensitivity}
          {pareto}
        </div>
      </div>
    </div>
  );
}
