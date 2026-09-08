import type { Outcome } from "../../contract/types";
import { AgeBandTable } from "../components/AgeBandTable";
import { MetricGrid } from "../components/MetricGrid";
import { TimelineChart } from "../charts/TimelineChart";

export interface PolicyOutcomePageProps {
  outcome: Outcome;
  running: boolean;
}

// Page 1 has to stand alone. A reader who never leaves it should still see the
// over-60 collapse, so the age bands sit directly under the timeline rather
// than only on page 2 with the other breakdowns.
export function PolicyOutcomePage(props: PolicyOutcomePageProps) {
  return (
    <div className="stack">
      <section className="panel">
        <h2 className="panel-title">Outcome</h2>
        <p className="panel-note">
          Two years of allocation under the current policy. Every figure is the
          engine's, printed as returned.
        </p>
        <MetricGrid outcome={props.outcome} running={props.running} />
      </section>

      <section className="panel">
        <h2 className="panel-title">Over the two years</h2>
        <p className="panel-note">
          Sampled by the engine across the run and plotted as given.
        </p>
        <TimelineChart timeline={props.outcome.timeline} />
      </section>

      <section className="panel">
        <h2 className="panel-title">Who was transplanted, by age</h2>
        <AgeBandTable rows={props.outcome.breakdowns.byAgeBand} withNote />
      </section>
    </div>
  );
}
