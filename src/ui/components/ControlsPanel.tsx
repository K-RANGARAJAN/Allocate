import type { Dispatch, SetStateAction } from "react";

import type { PolicyConfig } from "../../contract/types";
import { Slider } from "./Slider";

export interface ControlsPanelProps {
  config: PolicyConfig;
  setConfig: Dispatch<SetStateAction<PolicyConfig>>;
}

type WeightKey = keyof PolicyConfig["weights"];

// The policy panel. Every control is seeded from the live config, which starts
// as defaultConfig(). Ranges come from docs/CONTRACT.md.
export function ControlsPanel(props: ControlsPanelProps) {
  const config = props.config;

  function setWeight(key: WeightKey, value: number) {
    props.setConfig((prev) => {
      const weights = { ...prev.weights };
      weights[key] = value;
      return { ...prev, weights };
    });
  }

  return (
    <section className="panel controls">
      <h2 className="panel-title">Policy</h2>
      <p className="panel-note">
        Weights need not sum to 1. The engine normalises them before scoring, so
        three equal values mean an equal split.
      </p>

      <div className="control-group">
        <span className="label">Scoring weights</span>
        <Slider
          label="Urgency"
          value={config.weights.urgency}
          min={0}
          max={1}
          step={0.05}
          onChange={(next) => setWeight("urgency", next)}
        />
        <Slider
          label="Life-years"
          value={config.weights.lifeYears}
          min={0}
          max={1}
          step={0.05}
          onChange={(next) => setWeight("lifeYears", next)}
        />
        <Slider
          label="Waiting time"
          value={config.weights.waitingTime}
          min={0}
          max={1}
          step={0.05}
          onChange={(next) => setWeight("waitingTime", next)}
        />
      </div>
    </section>
  );
}
