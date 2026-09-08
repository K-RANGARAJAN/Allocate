import { AppHeader } from "./components/AppHeader";
import { ControlsDrawer } from "./components/ControlsDrawer";
import { PageNav } from "./components/PageNav";
import { ComparePage } from "./pages/ComparePage";
import { PolicyOutcomePage } from "./pages/PolicyOutcomePage";
import { TradeOffsPage } from "./pages/TradeOffsPage";
import { WhatMovesItPage } from "./pages/WhatMovesItPage";
import { WhoItReachesPage } from "./pages/WhoItReachesPage";
import { PAGES, useActivePage } from "./state/useActivePage";
import { useEngineWorker } from "./state/useEngineWorker";
import { usePolicyRun } from "./state/usePolicyRun";
import { useScenarios } from "./state/useScenarios";

export function App() {
  const run = usePolicyRun();
  const scenarios = useScenarios();
  const worker = useEngineWorker();
  const nav = useActivePage();

  let claim = "";
  for (const page of PAGES) {
    if (page.id === nav.page) {
      claim = page.claim;
    }
  }

  let body = (
    <section className="panel">
      <p className="panel-note">Simulating two years of allocation…</p>
    </section>
  );

  if (run.outcome !== null) {
    const outcome = run.outcome;

    if (nav.page === "outcome") {
      body = <PolicyOutcomePage outcome={outcome} running={run.running} />;
    }
    if (nav.page === "reach") {
      body = <WhoItReachesPage outcome={outcome} />;
    }
    if (nav.page === "tradeoffs") {
      body = <TradeOffsPage config={run.config} worker={worker} />;
    }
    if (nav.page === "movers") {
      body = <WhatMovesItPage config={run.config} worker={worker} />;
    }
    if (nav.page === "compare") {
      body = (
        <ComparePage
          outcome={outcome}
          config={run.config}
          store={scenarios}
          worker={worker}
        />
      );
    }
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
          {body}
        </div>
      </div>
    </div>
  );
}
