import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { PolicyConfig } from "../../contract/types";
import { ControlsPanel } from "./ControlsPanel";

export interface ControlsDrawerProps {
  config: PolicyConfig;
  setConfig: Dispatch<SetStateAction<PolicyConfig>>;
}

// The controls are reachable from every page, so they live in the shell rather
// than on any one page. Collapsing the drawer gives a chart the full width
// without losing the policy that produced it.
export function ControlsDrawer(props: ControlsDrawerProps) {
  const [open, setOpen] = useState(true);

  let body = null;
  if (open) {
    body = <ControlsPanel config={props.config} setConfig={props.setConfig} />;
  }

  let label = "Hide controls";
  if (open === false) {
    label = "Show controls";
  }

  return (
    <aside className="drawer">
      <button
        type="button"
        className="btn drawer-toggle"
        onClick={() => setOpen(open === false)}
      >
        {label}
      </button>
      {body}
    </aside>
  );
}
