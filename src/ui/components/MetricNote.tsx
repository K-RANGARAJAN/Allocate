import type { MetricKey } from "../../contract/types";
import { REAL_WORLD_CONTEXT } from "../data/realWorldContext";

export interface MetricNoteProps {
  metric: MetricKey;
}

// A published figure sitting beneath a simulated one. It is never compared to
// the tile's value: no delta, no ratio, no "above" or "below". A metric with no
// entry renders nothing at all rather than an empty line holding space.
export function MetricNote(props: MetricNoteProps) {
  const note = REAL_WORLD_CONTEXT[props.metric];
  if (note === undefined) {
    return null;
  }

  return <p className="metric-context">{note}</p>;
}
