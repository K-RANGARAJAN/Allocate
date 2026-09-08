import type { ChangeEvent } from "react";
import { ControlHint } from "./ControlHint";

export interface ToggleProps {
  label: string;
  // Key into CONTROL_HINTS. Omitted means no icon at all.
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

function HintFor(props: { hint?: string }) {
  if (props.hint === undefined) {
    return null;
  }
  return <ControlHint hint={props.hint} />;
}

// A labelled checkbox for the boolean constraints.
export function Toggle(props: ToggleProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    props.onChange(event.target.checked);
  }

  return (
    <label className="control control-toggle">
      <input type="checkbox" checked={props.checked} onChange={handleChange} />
      <span className="control-label">{props.label}</span>
      <HintFor hint={props.hint} />
    </label>
  );
}
