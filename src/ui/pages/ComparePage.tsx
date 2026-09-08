import type { Outcome } from "../../contract/types";
import type { ScenarioStore } from "../state/useScenarios";
import { ScenarioPanel } from "../components/ScenarioPanel";

export interface ComparePageProps {
  outcome: Outcome;
  store: ScenarioStore;
}

export function ComparePage(props: ComparePageProps) {
  return (
    <div className="stack">
      <ScenarioPanel outcome={props.outcome} store={props.store} />
    </div>
  );
}
