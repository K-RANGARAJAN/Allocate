import type { ChangeEvent } from "react";
import { ControlHint } from "./ControlHint";

export interface ToggleProps {
  label: string;
  // Key into CONTROL_HINTS. Omitted means no icon at all.
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

// With no copy the label renders bare, with no icon and no hover region.
function ControlLabel(props: { label: string; hint?: string }) {
  const label = <span className="control-label">{props.label}</span>;
  if (props.hint === undefined) {
    return label;
  }
  return <ControlHint hint={props.hint}>{label}</ControlHint>;
}

// A labelled checkbox for the boolean constraints.
export function Toggle(props: ToggleProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    props.onChange(event.target.checked);
  }

  return (
    <label className="control control-toggle">
      <input type="checkbox" checked={props.checked} onChange={handleChange} />
      <ControlLabel label={props.label} hint={props.hint} />
    </label>
  );
}
