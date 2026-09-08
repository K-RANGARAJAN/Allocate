import type { AgeBandRow } from "../../contract/types";
import { AgeBandNote } from "./AgeBandNote";

export interface AgeBandTableProps {
  rows: AgeBandRow[];
  // Page 1 has to carry the over-60 argument on its own, so it shows the note.
  // Page 2 shows this table beside three others and does not repeat it.
  withNote: boolean;
}

// Four rows, always all four, in the order the engine returns them. `ratePct`
// is the engine's figure and nothing here sums or weights the bands.
export function AgeBandTable(props: AgeBandTableProps) {
  let note = null;
  if (props.withNote) {
    note = <AgeBandNote rows={props.rows} />;
  }

  return (
    <div className="table-block">
      <span className="label">By age band</span>
      {note}
      <table className="data-table">
        <thead>
          <tr>
            <th>Band</th>
            <th>Listed</th>
            <th>Transplanted</th>
            <th>Rate %</th>
          </tr>
        </thead>
        <tbody>
          {props.rows.map((row) => {
            return (
              <tr key={row.band}>
                <td>{row.band}</td>
                <td>{row.listed}</td>
                <td>{row.transplanted}</td>
                <td>{row.ratePct}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
