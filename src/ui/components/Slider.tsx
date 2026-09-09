import type { ChangeEvent } from "react";
import { ControlHint } from "./ControlHint";

import "../../styles/controls.css";

export interface SliderProps {
  label: string;
  // Key into CONTROL_HINTS. Omitted means no icon at all.
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  // Set when the engine ignores this control under the current mode. The
  // control still shows its value; it just cannot be dragged, because a slider
  // that moves and changes nothing reads as a broken app.
  disabled?: boolean;
  onChange: (next: number) => void;
}

// With no copy the label renders bare, with no icon and no hover region.
function ControlLabel(props: { label: string; hint?: string }) {
  const label = <span className="control-label">{props.label}</span>;
  if (props.hint === undefined) {
    return label;
  }
  return <ControlHint hint={props.hint}>{label}</ControlHint>;
}

// A labelled range input with its current value shown in tabular figures. The
// value is displayed exactly as the config holds it. Nothing here is derived.
export function Slider(props: SliderProps) {
  let suffix = "";
  if (props.suffix !== undefined) {
    suffix = props.suffix;
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = Number(event.target.value);
    props.onChange(next);
  }

  let className = "control";
  if (props.disabled === true) {
    className = "control is-inert";
  }

  return (
    <label className={className}>
      <span className="control-head">
        <ControlLabel label={props.label} hint={props.hint} />
        <span className="control-value num">
          {props.value}
          {suffix}
        </span>
      </span>
      <input
        className="control-range"
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        disabled={props.disabled}
        onChange={handleChange}
      />
    </label>
  );
}
