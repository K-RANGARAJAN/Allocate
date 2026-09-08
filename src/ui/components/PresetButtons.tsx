import { defaultConfig, presets } from "../../engine/index";
import { ControlHint } from "./ControlHint";
import type { PolicyConfig } from "../../contract/types";

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
}

export function PresetButtons(props: PresetButtonsProps) {
  const names = Object.keys(PRESETS);

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
    </div>
  );
}
