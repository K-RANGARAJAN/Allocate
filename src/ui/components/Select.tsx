import type { ChangeEvent } from "react";
import { ControlHint } from "./ControlHint";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label: string;
  // Key into CONTROL_HINTS. Omitted means no icon at all.
  hint?: string;
  value: string;
  options: SelectOption[];
  onChange: (next: string) => void;
}

function HintFor(props: { hint?: string }) {
  if (props.hint === undefined) {
    return null;
  }
  return <ControlHint hint={props.hint} />;
}

// A labelled dropdown. The caller owns the option list and the meaning of each
// value; this only reports the string that was picked.
export function Select(props: SelectProps) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    props.onChange(event.target.value);
  }

  return (
    <label className="control">
      <span className="control-head">
        <span className="control-label">{props.label}</span>
        <HintFor hint={props.hint} />
      </span>
      <select
        className="control-select"
        value={props.value}
        onChange={handleChange}
      >
        {props.options.map((option) => {
          return (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}
