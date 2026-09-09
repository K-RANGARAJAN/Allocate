import type { Outcome } from "../../contract/types";
import type { MotionTier } from "../state/useMotion";
import { AgeBandTable } from "../components/AgeBandTable";
import { MetricGrid } from "../components/MetricGrid";
import { TimelineChart } from "../charts/TimelineChart";
import { runLengthLabel } from "../runLength";

export interface PolicyOutcomePageProps {
  outcome: Outcome;
  running: boolean;
  tier: MotionTier;
}

// Page 1 has to stand alone. A reader who never leaves it should still see the
// over-60 collapse, so the age bands sit directly under the timeline rather
// than only on page 2 with the other breakdowns.
export function PolicyOutcomePage(props: PolicyOutcomePageProps) {
  // Read off the config the engine echoed back, not live control state, so the
  // phrase always describes the run these numbers came from.
  const span = runLengthLabel(props.outcome.config.sim.durationDays);

  return (
    <div className="stack">
      <section className="panel">
        <h2 className="panel-title">Outcome</h2>
        <p className="panel-note">
          Allocation across {span} under the current policy. Every figure is
          the engine's, printed as returned.
        </p>
        <MetricGrid outcome={props.outcome} running={props.running} />
      </section>

      <section className="panel">
        <h2 className="panel-title">Over the {span}</h2>
        <p className="panel-note">
          Sampled by the engine across the run and plotted as given.
        </p>
        <TimelineChart timeline={props.outcome.timeline} tier={props.tier} />
      </section>

      <section className="panel">
        <h2 className="panel-title">Who was transplanted, by age</h2>
        <AgeBandTable rows={props.outcome.breakdowns.byAgeBand} withNote />
      </section>
    </div>
  );
}
