import { AppHeader } from "./components/AppHeader";
import { ControlsDrawer } from "./components/ControlsDrawer";
import { PageNav } from "./components/PageNav";
import { ComparePage } from "./pages/ComparePage";
import { HomePage } from "./pages/HomePage";
import { PolicyOutcomePage } from "./pages/PolicyOutcomePage";
import { TradeOffsPage } from "./pages/TradeOffsPage";
import { WhatMovesItPage } from "./pages/WhatMovesItPage";
import { WhoItReachesPage } from "./pages/WhoItReachesPage";
import { useState } from "react";

import { runLengthLabel } from "./runLength";
import { PAGES, useActivePage } from "./state/useActivePage";
import { useEngineWorker } from "./state/useEngineWorker";
import { usePolicyRun } from "./state/usePolicyRun";
import { useScenarios } from "./state/useScenarios";

export function App() {
  const run = usePolicyRun();
  const scenarios = useScenarios();
  const worker = useEngineWorker();
  const nav = useActivePage();
  const [leaving, setLeaving] = useState(false);
  // Lifted out of the drawer so the grid can reclaim the column when it closes.
  // Collapsing it used to leave a 320px empty column with a floating "Show
  // controls" button in it, which is the opposite of giving a chart the width.
  const [controlsOpen, setControlsOpen] = useState(true);

  const onHome = nav.page === "home";

  // The landing page starts its slide first and the switch follows, so page 1
  // is already rendered underneath and fades in as the cover leaves.
  //
  // `leaving` used to be set and never cleared, which kept HomePage mounted
  // forever behind the simulator: translated off the top of the screen but
  // still visible, still clickable and still in the tab order, so the first Tab
  // stop in the whole app was an invisible "Open the simulator" button at
  // -620px. It is now cleared once the slide has finished, which unmounts it.
  const SLIDE_MS = 500;

  function openSimulator() {
    setLeaving(true);
    setTimeout(() => {
      nav.setPage("outcome");
    }, 30);
    setTimeout(() => {
      setLeaving(false);
    }, SLIDE_MS + 60);
  }

  let home = null;
  if (onHome || leaving) {
    home = <HomePage onOpen={openSimulator} leaving={leaving} />;
  }

  let chrome = null;
  if (onHome === false) {
    chrome = (
      <header className="shell-header">
        <AppHeader
          outcome={run.outcome}
          running={run.running}
          tier={run.tier}
          config={run.config}
          setConfig={run.setConfig}
        />
        <PageNav pages={PAGES} active={nav.page} onPick={nav.setPage} />
      </header>
    );
  }

  let layoutClass = "layout";
  if (controlsOpen === false) {
    layoutClass = "layout is-collapsed";
  }

  let simulatorClass = "simulator";
  if (onHome) {
    simulatorClass = "simulator is-behind";
  }

  let claim = "";
  for (const page of PAGES) {
    if (page.id === nav.page) {
      claim = page.claim;
    }
  }

  let body = (
    <section className="panel">
      <p className="panel-note">
        Simulating {runLengthLabel(run.config.sim.durationDays)} of allocation…
      </p>
    </section>
  );

  if (run.outcome !== null) {
    const outcome = run.outcome;

    if (nav.page === "outcome") {
      body = (
        <PolicyOutcomePage
          outcome={outcome}
          running={run.running}
          tier={run.tier}
        />
      );
    }
    if (nav.page === "reach") {
      body = <WhoItReachesPage outcome={outcome} />;
    }
    if (nav.page === "tradeoffs") {
      body = (
        <TradeOffsPage outcome={outcome} config={run.config} worker={worker} />
      );
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
          setWholeConfig={run.setWholeConfig}
        />
      );
    }
  }

  return (
    <div className="app-shell">
      {home}
      <div className={simulatorClass} aria-hidden={onHome}>
        {chrome}
        <div className="app">
          {/*
            The controls drawer is a long tab stop. Without this a keyboard user
            has to walk every slider in it before reaching the numbers those
            sliders produce.
          */}
          <a className="skip-link" href="#results">
            Skip to results
          </a>
          <p className="page-claim">{claim}</p>
          <div className={layoutClass}>
            <ControlsDrawer
              open={controlsOpen}
              setOpen={setControlsOpen}
              config={run.config}
              setConfig={run.setConfig}
              setWholeConfig={run.setWholeConfig}
              saved={scenarios.scenarios}
              onSavePreset={(name) => {
                if (run.outcome !== null) {
                  scenarios.save(run.outcome, name);
                }
              }}
              onRemovePreset={scenarios.remove}
            />
            <div id="results" tabIndex={-1}>
              {body}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
