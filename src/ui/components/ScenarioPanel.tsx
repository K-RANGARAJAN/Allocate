import { useState } from "react";

import { compareOutcomes } from "../../engine/index";
import type { Outcome } from "../../contract/types";
import type { ScenarioStore } from "../state/useScenarios";
import { ComparisonTable } from "./ComparisonTable";

export interface ScenarioPanelProps {
  outcome: Outcome;
  store: ScenarioStore;
}

export function ScenarioPanel(props: ScenarioPanelProps) {
  const [baselineId, setBaselineId] = useState<number | null>(null);
  const scenarios = props.store.scenarios;

  let baseline = null;
  for (const one of scenarios) {
    if (one.id === baselineId) {
      baseline = one;
    }
  }

  // compareOutcomes re-runs nothing, so this is safe on every render.
  let body = (
    <p className="panel-note">
      Save the current policy, then pick a saved scenario as the baseline to see
      what changed.
    </p>
  );
  if (baseline !== null) {
    const comparison = compareOutcomes(
      baseline.outcome,
      props.outcome,
      baseline.label,
      "Current"
    );
    body = <ComparisonTable comparison={comparison} />;
  }

  return (
    <section className="panel">
      <h2 className="panel-title">Scenarios</h2>
      <div className="compare-head">
        <button type="button" className="btn" onClick={() => props.store.save(props.outcome)}>
          Save current
        </button>
        <button
          type="button"
          className="btn"
          disabled={scenarios.length === 0}
          onClick={props.store.exportJson}
        >
          Export JSON
        </button>
        {scenarios.map((one) => {
          return (
            <span className="scenario-chip" key={one.id}>
              <button type="button" onClick={() => setBaselineId(one.id)}>
                {one.label}
              </button>
              <button type="button" onClick={() => props.store.remove(one.id)}>
                ×
              </button>
            </span>
          );
        })}
      </div>
      {body}
      <p className="compare-note">
        Every difference here comes from the engine. The over-60 rate is printed
        without colour on purpose — whether it should rise or fall is the
        argument, not a score.
      </p>
    </section>
  );
}
