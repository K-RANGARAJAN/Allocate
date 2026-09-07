import type { ChangeEvent } from "react";

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
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
    </label>
  );
}
