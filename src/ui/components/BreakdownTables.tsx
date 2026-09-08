import type { Breakdowns } from "../../contract/types";
import { AgeBandTable } from "./AgeBandTable";

export interface BreakdownTablesProps {
  breakdowns: Breakdowns;
}

// Four tables of fixed shape: four age bands, three zones, two hospital types,
// four discard reasons. The engine returns every row on every run, including
// rows at zero, so none of these is filtered or sorted here. ratePct is the
// engine's own figure.
export function BreakdownTables(props: BreakdownTablesProps) {
  const b = props.breakdowns;

  return (
    <div className="table-grid">
      <AgeBandTable rows={b.byAgeBand} withNote={false} />

      <div className="table-block">
        <span className="label">By zone</span>
        <p className="panel-note">
          The regional gap metric is the widest rate difference between any two
          of these rows.
        </p>
        <table className="data-table">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Listed</th>
              <th>Transplanted</th>
              <th>Rate %</th>
            </tr>
          </thead>
          <tbody>
            {b.byZone.map((row) => {
              return (
                <tr key={row.zone}>
                  <td>{row.zone}</td>
                  <td>{row.listed}</td>
                  <td>{row.transplanted}</td>
                  <td>{row.ratePct}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="table-block">
        <span className="label">By hospital type</span>
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Listed</th>
              <th>Transplanted</th>
              <th>Rate %</th>
            </tr>
          </thead>
          <tbody>
            {b.byHospitalType.map((row) => {
              return (
                <tr key={row.hospitalType}>
                  <td>{row.hospitalType}</td>
                  <td>{row.listed}</td>
                  <td>{row.transplanted}</td>
                  <td>{row.ratePct}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="table-block">
        <span className="label">Discard reasons</span>
        <table className="data-table">
          <thead>
            <tr>
              <th>Reason</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {b.discardReasons.map((row) => {
              return (
                <tr key={row.reason}>
                  <td>{row.reason}</td>
                  <td>{row.count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
