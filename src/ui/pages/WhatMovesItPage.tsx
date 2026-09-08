import type { PolicyConfig } from "../../contract/types";
import type { EngineWorker } from "../state/useEngineWorker";
import { RobustnessPanel } from "../components/RobustnessPanel";
import { SensitivityPanel } from "../components/SensitivityPanel";

export interface WhatMovesItPageProps {
  config: PolicyConfig;
  worker: EngineWorker;
}

export function WhatMovesItPage(props: WhatMovesItPageProps) {
  return (
    <div className="stack">
      <SensitivityPanel config={props.config} worker={props.worker} />
      <RobustnessPanel config={props.config} worker={props.worker} />
    </div>
  );
}
