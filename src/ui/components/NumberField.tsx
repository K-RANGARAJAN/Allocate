import type { ChangeEvent } from "react";

export interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  hint?: string;
  onChange: (next: number) => void;
}

// A typed integer, for values a slider cannot express well. The seed is the
// case that matters: it is an identifier, not a magnitude, so dragging along a
// range is the wrong gesture and the user usually wants a specific number.
export function NumberField(props: NumberFieldProps) {
  let hint = null;
  if (props.hint !== undefined) {
    hint = <span className="field-hint">{props.hint}</span>;
  }

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
      {hint}
    </label>
  );
}
