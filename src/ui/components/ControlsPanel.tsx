import type { Dispatch, SetStateAction } from "react";

import type { PolicyConfig } from "../../contract/types";
import { Select } from "./Select";
import { Slider } from "./Slider";
import { Toggle } from "./Toggle";

export interface ControlsPanelProps {
  config: PolicyConfig;
  setConfig: Dispatch<SetStateAction<PolicyConfig>>;
}

type WeightKey = keyof PolicyConfig["weights"];
type Constraints = PolicyConfig["constraints"];

const MODE_OPTIONS = [
  { value: "score", label: "Weighted score" },
  { value: "cascade", label: "Cascade (TRANSTAN)" },
  { value: "fcfs", label: "First come, first served" }
];

const LOCAL_FIRST_OPTIONS = [
  { value: "off", label: "Off" },
  { value: "zone", label: "Zone" },
  { value: "state", label: "State" }
];

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

  function setConstraint<K extends keyof Constraints>(
    key: K,
    value: Constraints[K]
  ) {
    props.setConfig((prev) => {
      const constraints = { ...prev.constraints };
      constraints[key] = value;
      return { ...prev, constraints };
    });
  }

  function setMode(next: string) {
    props.setConfig((prev) => {
      return { ...prev, mode: next as PolicyConfig["mode"] };
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

      <div className="control-group">
        <span className="label">Allocation</span>
        <Select
          label="Mode"
          value={config.mode}
          options={MODE_OPTIONS}
          onChange={setMode}
        />
        <Select
          label="Local first"
          value={config.constraints.localFirst}
          options={LOCAL_FIRST_OPTIONS}
          onChange={(next) =>
            setConstraint("localFirst", next as Constraints["localFirst"])
          }
        />
      </div>

      <div className="control-group">
        <span className="label">Constraints</span>
        <Slider
          label="Max cold ischemia"
          value={config.constraints.maxColdIschemiaHours}
          min={4}
          max={36}
          step={1}
          suffix=" h"
          onChange={(next) => setConstraint("maxColdIschemiaHours", next)}
        />
        <Slider
          label="Minimum urgency to list"
          value={config.constraints.minUrgencyToList}
          min={0}
          max={10}
          step={1}
          onChange={(next) => setConstraint("minUrgencyToList", next)}
        />
        <Slider
          label="Retrieval hospital keeps"
          value={config.constraints.retrievalHospitalKeeps}
          min={0}
          max={2}
          step={1}
          onChange={(next) => setConstraint("retrievalHospitalKeeps", next)}
        />
        <Toggle
          label="Age matching"
          checked={config.constraints.ageMatchingOn}
          onChange={(next) => setConstraint("ageMatchingOn", next)}
        />
        <Toggle
          label="Hospital rota"
          checked={config.constraints.rotaEnabled}
          onChange={(next) => setConstraint("rotaEnabled", next)}
        />
        <Toggle
          label="Urgent supersedes rota"
          checked={config.constraints.urgentSupersedesRota}
          onChange={(next) => setConstraint("urgentSupersedesRota", next)}
        />
      </div>
    </section>
  );
}
