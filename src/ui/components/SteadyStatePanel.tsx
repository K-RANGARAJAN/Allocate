import type { Outcome, SteadyStateRow } from "../../contract/types";

export interface SteadyStatePanelProps {
  outcome: Outcome;
}

// A row with windowable false returns zeros, and a zero here would read as "no
// drift" — the opposite of what it means. The flag is checked, never the value.
function verdictFor(row: SteadyStateRow) {
  if (row.windowable === false) {
    return "not applicable";
  }
  if (row.stabilised) {
    return "settled";
  }
  return "still moving";
}

export function SteadyStatePanel(props: SteadyStatePanelProps) {
  const meta = props.outcome.meta;
  const early = meta.earlyWindowDays;
  const late = meta.lateWindowDays;

  return (
    <section className="panel">
      <h2 className="panel-title">Has it settled?</h2>
      <p className="panel-note">
        The run opens with a backdated waitlist, so the early months are that
        queue clearing rather than the policy at rest. Each row reads days{" "}
        {late[0]} to {late[1]} against days {early[0]} to {early[1]}.
      </p>

      <table className="data-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Early</th>
            <th>Late</th>
            <th>Drift %</th>
            <th>Verdict</th>
          </tr>
        </thead>
        <tbody>
          {props.outcome.steadyState.map((row) => {
            let early = <td>—</td>;
            let late = <td>—</td>;
            let drift = <td>—</td>;

            if (row.windowable) {
              early = <td>{row.earlyWindow}</td>;
              late = <td>{row.lateWindow}</td>;
              drift = <td>{row.driftPct}</td>;
            }

            return (
              <tr key={row.metric}>
                <td>{row.label}</td>
                {early}
                {late}
                {drift}
                <td>{verdictFor(row)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="compare-note">
        A rate is measured against patients listed, and someone listed inside a
        window is often transplanted long after it — so the three rate metrics
        have no honest windowed reading and are marked not applicable rather
        than shown as zero.
      </p>
    </section>
  );
}
