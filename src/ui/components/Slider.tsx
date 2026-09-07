import type { ChangeEvent } from "react";

import "../../styles/controls.css";

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (next: number) => void;
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

  return (
    <label className="control">
      <span className="control-head">
        <span className="control-label">{props.label}</span>
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
        onChange={handleChange}
      />
    </label>
  );
}
