import type { CounterfactualReport } from "../../contract/types";

export interface CounterfactualHeadlineProps {
  report: CounterfactualReport;
}

// lostCount and gainedCount are the true totals. The lost and gained arrays are
// capped, so their length is never used for a displayed count.
export function CounterfactualHeadline(props: CounterfactualHeadlineProps) {
  const report = props.report;

  return (
    <div className="cf-headline">
      <div>
        <div className="headline-value">{report.lostCount}</div>
        <div className="headline-label">
          lost a transplant under {report.scenarioLabel}
        </div>
      </div>
      <div>
        <div className="headline-value">{report.gainedCount}</div>
        <div className="headline-label">
          gained one under {report.scenarioLabel}
        </div>
      </div>
      <p className="compare-note">
        Both directions are measured against {report.baselineLabel}. Lost means
        transplanted under {report.baselineLabel} and died waiting under{" "}
        {report.scenarioLabel}. Gained is the reverse. Both policies were run on
        seed {report.seed}, the baseline's own, so these are the same synthetic
        people meeting two different rules rather than two separate populations.
      </p>
    </div>
  );
}

export interface CounterfactualBandsProps {
  report: CounterfactualReport;
}

export function CounterfactualBands(props: CounterfactualBandsProps) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Band</th>
          <th>Lost</th>
          <th>Gained</th>
        </tr>
      </thead>
      <tbody>
        {props.report.byAgeBand.map((row) => {
          return (
            <tr key={row.band}>
              <td>{row.band}</td>
              <td>{row.lost}</td>
              <td>{row.gained}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
