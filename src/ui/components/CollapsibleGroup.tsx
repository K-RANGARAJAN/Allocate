import type { ReactNode } from "react";

export interface CollapsibleGroupProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

// One group in the controls drawer. Collapsed groups keep their children
// mounted-free: the body is simply not rendered, so nothing hidden is holding
// state the user cannot see.
export function CollapsibleGroup(props: CollapsibleGroupProps) {
  let body = null;
  if (props.open) {
    body = <div className="group-body">{props.children}</div>;
  }

  let marker = "+";
  if (props.open) {
    marker = "−";
  }

  return (
    <section className="group">
      <button type="button" className="group-head" onClick={props.onToggle}>
        <span className="group-title">{props.title}</span>
        <span className="group-marker num">{marker}</span>
      </button>
      {body}
    </section>
  );
}
