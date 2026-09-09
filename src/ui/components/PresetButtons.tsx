import { useState } from "react";

import { defaultConfig, presets } from "../../engine/index";
import { ControlHint } from "./ControlHint";
import type { PolicyConfig } from "../../contract/types";
import type { Scenario } from "../state/useScenarios";

// presets() is instant, and it hands back whole PolicyConfig objects. Picking
// one writes the entire config back, so every control in the panel re-reads its
// value from the preset rather than keeping a stale position.
const PRESETS = presets();

const PRESET_LABELS: Record<string, string> = {
  utilityTrap: "Utility trap",
  localityTrap: "Locality trap"
};

export interface PresetButtonsProps {
  onPick: (next: PolicyConfig) => void;
  // Saved policies live here as well as on the Compare page. Saving was only
  // reachable under "Scenarios" on Compare, which is not where anyone looks for
  // a preset - they look next to the presets.
  saved: Scenario[];
  onSave: (name: string) => void;
  onRemove: (id: number) => void;
}

export function PresetButtons(props: PresetButtonsProps) {
  const names = Object.keys(PRESETS);
  const [name, setName] = useState("");

  function save() {
    props.onSave(name);
    setName("");
  }

  let savedRow = null;
  if (props.saved.length > 0) {
    savedRow = (
      <div className="preset-row">
        {props.saved.map((one) => {
          return (
            <span className="scenario-chip" key={one.id}>
              <button type="button" onClick={() => props.onPick(one.outcome.config)}>
                {one.label}
              </button>
              <button
                type="button"
                title="Delete this preset"
                onClick={() => props.onRemove(one.id)}
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
    );
  }

  function labelFor(name: string) {
    const label = PRESET_LABELS[name];
    if (label === undefined) {
      return name;
    }
    return label;
  }

  return (
    <div className="presets">
      <ControlHint hint="presets">
        <span className="label">Presets</span>
      </ControlHint>
      <div className="preset-row">
        <button
          type="button"
          className="btn"
          onClick={() => props.onPick(defaultConfig())}
        >
          Default
        </button>
        {names.map((name) => {
          return (
            <button
              key={name}
              type="button"
              className="btn"
              onClick={() => props.onPick(PRESETS[name])}
            >
              {labelFor(name)}
            </button>
          );
        })}
      </div>

      <span className="label">Your presets</span>
      {savedRow}
      <div className="preset-save">
        <input
          className="control-number"
          type="text"
          value={name}
          placeholder="Name this policy"
          onChange={(event) => setName(event.target.value)}
        />
        <button type="button" className="btn" onClick={save}>
          Save current
        </button>
      </div>
    </div>
  );
}
