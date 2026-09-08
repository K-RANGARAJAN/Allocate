import type { Dispatch, SetStateAction } from "react";

import type { MetricKey, Outcome, PolicyConfig } from "../../contract/types";
import { labelFor } from "../metricList";
import { MODE_OPTIONS } from "./ControlsPanel";
import { Select } from "./Select";

const SECONDARY: MetricKey[] = [
  "lifeYearsGained",
  "waitlistDeaths",
  "overSixtyRatePct"
];

export interface AppHeaderProps {
  outcome: Outcome | null;
  running: boolean;
  config: PolicyConfig;
  setConfig: Dispatch<SetStateAction<PolicyConfig>>;
}

export function AppHeader(props: AppHeaderProps) {
  const outcome = props.outcome;

  let dot = null;
  if (props.running) {
    dot = <span className="activity-dot" title="Running a simulation" />;
  }

  let headline = null;
  let secondary = null;
  if (outcome !== null) {
    headline = (
      <div>
        <div className="headline-label">{labelFor(outcome, "transplants")}</div>
        <div className="headline-value">{outcome.metrics.transplants}</div>
      </div>
    );
    secondary = (
      <div className="secondary-row">
        {SECONDARY.map((key) => {
          return (
            <div key={key}>
              <div className="headline-label">{labelFor(outcome, key)}</div>
              <div className="secondary-value">{outcome.metrics[key]}</div>
            </div>
          );
        })}
      </div>
    );
  }

  function setMode(next: string) {
    props.setConfig((prev) => {
      return { ...prev, mode: next as PolicyConfig["mode"] };
    });
  }

  return (
    <div className="shell-bar">
      {headline}
      {secondary}
      <span className="shell-spacer" />
      {dot}
      <div className="header-mode">
        <Select
          label="Allocation mode"
          value={props.config.mode}
          options={MODE_OPTIONS}
          onChange={setMode}
        />
      </div>
    </div>
  );
}
