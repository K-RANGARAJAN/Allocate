import type { Outcome } from "../../contract/types";
import { BreakdownTables } from "../components/BreakdownTables";
import { EquityPanel } from "../components/EquityPanel";
import { SteadyStatePanel } from "../components/SteadyStatePanel";

export interface WhoItReachesPageProps {
  outcome: Outcome;
}

// Equity leads this page rather than the breakdowns. The tables are the
// evidence; the equity rows are the claim they support, and the age row is the
// larger of the two inequalities in the model.
export function WhoItReachesPage(props: WhoItReachesPageProps) {
  return (
    <div className="stack">
      <EquityPanel rows={props.outcome.equity} />

      <section className="panel">
        <h2 className="panel-title">Breakdowns</h2>
        <p className="panel-note">
          Every table keeps a fixed set of rows, including rows at zero, so the
          shape never changes between runs.
        </p>
        <BreakdownTables breakdowns={props.outcome.breakdowns} />
      </section>

      <SteadyStatePanel outcome={props.outcome} />
    </div>
  );
}
