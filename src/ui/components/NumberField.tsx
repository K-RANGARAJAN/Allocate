import type { ChangeEvent } from "react";
import { ControlHint } from "./ControlHint";

export interface NumberFieldProps {
  label: string;
  // Key into CONTROL_HINTS. Omitted means no icon at all.
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}

// A typed integer, for values a slider cannot express well. The seed is the
// case that matters: it is an identifier, not a magnitude, so dragging along a
// range is the wrong gesture and the user usually wants a specific number.
function HintFor(props: { hint?: string }) {
  if (props.hint === undefined) {
    return null;
  }
  return <ControlHint hint={props.hint} />;
}

export function NumberField(props: NumberFieldProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = Number(event.target.value);
    if (Number.isFinite(next) === false) {
      return;
    }
    if (next < props.min) {
      return;
    }
    if (next > props.max) {
      return;
    }
    props.onChange(next);
  }

  return (
    <label className="control">
      <span className="control-head">
        <span className="control-label">{props.label}</span>
        <HintFor hint={props.hint} />
      </span>
      <input
        className="control-number num"
        type="number"
        min={props.min}
        max={props.max}
        step={1}
        value={props.value}
        onChange={handleChange}
      />
    </label>
  );
}
