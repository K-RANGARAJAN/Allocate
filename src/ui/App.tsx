import { AppHeader } from "./components/AppHeader";
import { ControlsDrawer } from "./components/ControlsDrawer";
import { MetricGrid } from "./components/MetricGrid";
import { PageNav } from "./components/PageNav";
import { PAGES, useActivePage } from "./state/useActivePage";
import { usePolicyRun } from "./state/usePolicyRun";

export function App() {
  const run = usePolicyRun();
  const nav = useActivePage();

  let claim = "";
  for (const page of PAGES) {
    if (page.id === nav.page) {
      claim = page.claim;
    }
  }

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
    <div className="app-shell">
      <header className="shell-header">
        <AppHeader
          outcome={run.outcome}
          running={run.running}
          config={run.config}
          setConfig={run.setConfig}
        />
        <PageNav pages={PAGES} active={nav.page} onPick={nav.setPage} />
      </header>

      <div className="app">
        <p className="page-claim">{claim}</p>
        <div className="layout">
          <ControlsDrawer config={run.config} setConfig={run.setConfig} />
          <div className="stack">
            {placeholder}
            {results}
          </div>
        </div>
      </div>
    </div>
  );
}
