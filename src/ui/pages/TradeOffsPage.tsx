import type { PolicyConfig } from "../../contract/types";
import type { EngineWorker } from "../state/useEngineWorker";
import { ParetoPanel } from "../components/ParetoPanel";

export interface TradeOffsPageProps {
  config: PolicyConfig;
  worker: EngineWorker;
}

export function TradeOffsPage(props: TradeOffsPageProps) {
  return (
    <div className="stack">
      <ParetoPanel config={props.config} worker={props.worker} />
    </div>
  );
}
