import { useState } from "react";

import type { Outcome, PolicyConfig } from "../../contract/types";
import type { EngineWorker } from "../state/useEngineWorker";
import type { Scenario, ScenarioStore } from "../state/useScenarios";
import { CounterfactualSection } from "../components/CounterfactualSection";
import { ModeComparisonPanel } from "../components/ModeComparisonPanel";
import { ScenarioPanel } from "../components/ScenarioPanel";

export interface ComparePageProps {
  outcome: Outcome;
  config: PolicyConfig;
  store: ScenarioStore;
  worker: EngineWorker;
  // Threaded through so a saved scenario can be put back on the controls.
  setWholeConfig: (next: PolicyConfig) => void;
}

// The baseline lives here because both panels read it: the comparison table
// and the counterfactual must be talking about the same saved policy.
export function ComparePage(props: ComparePageProps) {
  const [baselineId, setBaselineId] = useState<number | null>(null);

  let baseline: Scenario | null = null;
  for (const one of props.store.scenarios) {
    if (one.id === baselineId) {
      baseline = one;
    }
  }

  return (
    <div className="stack">
      <ScenarioPanel
        outcome={props.outcome}
        store={props.store}
        baselineId={baselineId}
        setBaselineId={setBaselineId}
        applyConfig={props.setWholeConfig}
      />
      <CounterfactualSection
        baseline={baseline}
        config={props.config}
        worker={props.worker}
      />
      {/*
        Needs no saved baseline: it compares the three allocation rules against
        each other rather than against a scenario, so it stands on its own.
      */}
      <ModeComparisonPanel config={props.config} worker={props.worker} />
    </div>
  );
}
