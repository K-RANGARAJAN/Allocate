import type { Dispatch, SetStateAction } from "react";

import type { PolicyConfig } from "../../contract/types";
import { ControlsPanel } from "./ControlsPanel";
import type { Scenario } from "../state/useScenarios";

export interface ControlsDrawerProps {
  // Owned by App so the layout grid can drop the column when it closes.
  open: boolean;
  setOpen: (next: boolean) => void;
  config: PolicyConfig;
  setConfig: Dispatch<SetStateAction<PolicyConfig>>;
  setWholeConfig: (next: PolicyConfig) => void;
  saved: Scenario[];
  onSavePreset: (name: string) => void;
  onRemovePreset: (id: number) => void;
}

// The controls are reachable from every page, so they live in the shell rather
// than on any one page. Collapsing the drawer gives a chart the full width
// without losing the policy that produced it.
export function ControlsDrawer(props: ControlsDrawerProps) {
  const open = props.open;

  let body = null;
  if (open) {
    body = (
      <ControlsPanel
        config={props.config}
        setConfig={props.setConfig}
        setWholeConfig={props.setWholeConfig}
        saved={props.saved}
        onSavePreset={props.onSavePreset}
        onRemovePreset={props.onRemovePreset}
      />
    );
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
        onClick={() => props.setOpen(open === false)}
      >
        {label}
      </button>
      {body}
    </aside>
  );
}
