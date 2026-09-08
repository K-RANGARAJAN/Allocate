import type { Outcome, PolicyConfig } from "../../contract/types";
import type { EngineWorker } from "../state/useEngineWorker";
import { ConstrainedFrontierPanel } from "../components/ConstrainedFrontierPanel";
import { ParetoPanel } from "../components/ParetoPanel";

export interface TradeOffsPageProps {
  outcome: Outcome;
  config: PolicyConfig;
  worker: EngineWorker;
}

export function TradeOffsPage(props: TradeOffsPageProps) {
  return (
    <div className="stack">
      <ParetoPanel config={props.config} worker={props.worker} />
      <ConstrainedFrontierPanel
        outcome={props.outcome}
        config={props.config}
        worker={props.worker}
      />
    </div>
  );
}
