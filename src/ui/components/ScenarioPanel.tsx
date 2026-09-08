import { useState } from "react";

import { compareOutcomes } from "../../engine/index";
import type { Outcome } from "../../contract/types";
import { generatedLabel, type ScenarioStore } from "../state/useScenarios";
import { ComparisonTable } from "./ComparisonTable";

export interface ScenarioPanelProps {
  outcome: Outcome;
  store: ScenarioStore;
  baselineId: number | null;
  setBaselineId: (next: number | null) => void;
}

export function ScenarioPanel(props: ScenarioPanelProps) {
  const [name, setName] = useState("");
  const scenarios = props.store.scenarios;
  const baselineId = props.baselineId;

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
        <input
          className="control-number"
          type="text"
          value={name}
          placeholder={generatedLabel(props.outcome, scenarios.length + 1)}
          onChange={(event) => setName(event.target.value)}
        />
        <button
          type="button"
          className="btn"
          onClick={() => {
            props.store.save(props.outcome, name);
            setName("");
          }}
        >
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
              <button type="button" onClick={() => props.setBaselineId(one.id)}>
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
