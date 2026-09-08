import type { MetricKey } from "../../contract/types";
import { REAL_WORLD_CONTEXT } from "../data/realWorldContext";

export interface MetricNoteProps {
  metric: MetricKey;
}

// Context beneath a simulated figure: a plain definition, and where one exists
// a published real-world figure. Neither is ever compared to the tile's value —
// no delta, no ratio, no "above" or "below". A metric with no entry renders
// nothing at all rather than an empty line holding space.
export function MetricNote(props: MetricNoteProps) {
  const entry = REAL_WORLD_CONTEXT[props.metric];
  if (entry === undefined) {
    return null;
  }

  // Definition first, then the sourced figure beneath it: what the measure is,
  // before what the world does.
  let definition = null;
  if (entry.definition !== undefined) {
    definition = <p className="metric-context">{entry.definition}</p>;
  }

  let practice = null;
  if (entry.inPractice !== undefined) {
    practice = <p className="metric-context">{entry.inPractice}</p>;
  }

  return (
    <>
      {definition}
      {practice}
    </>
  );
}
