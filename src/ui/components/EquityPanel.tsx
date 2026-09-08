import type { EquityIndex } from "../../contract/types";

export interface EquityPanelProps {
  rows: EquityIndex[];
}

// Both figures are shown because they disagree, and the disagreement is the
// point: a spread reads only the widest pair, a Gini reads every group. Neither
// is computed here — both come off outcome.equity.
export function EquityPanel(props: EquityPanelProps) {
  return (
    <section className="panel">
      <h2 className="panel-title">How unequally it lands</h2>
      <p className="panel-note">
        Gini reads every group. Spread reads only the widest pair, which is what
        the regional gap metric measures. They are shown side by side because a
        middle group can drift while the spread sits still.
      </p>

      {props.rows.map((row) => {
        let className = "equity-row";
        if (row.dimension === "ageBand") {
          className = "equity-row is-dominant";
        }

        return (
          <div className={className} key={row.dimension}>
            <div>
              <div className="equity-name">{row.label}</div>
              <div className="equity-groups">
                best {row.bestGroup} at {row.bestRatePct}%, worst{" "}
                {row.worstGroup} at {row.worstRatePct}%
              </div>
            </div>
            <div className="equity-figure">
              <div className="equity-value">{row.giniPct}</div>
              <div className="headline-label">Gini %</div>
            </div>
            <div className="equity-figure">
              <div className="equity-value">{row.spreadPct}</div>
              <div className="headline-label">Spread %</div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
