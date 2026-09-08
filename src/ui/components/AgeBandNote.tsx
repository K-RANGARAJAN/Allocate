import type { AgeBandRow } from "../../contract/types";

export interface AgeBandNoteProps {
  rows: AgeBandRow[];
}

// The sentence is keyed off the rows themselves, so it can never claim a
// collapse that is not in the data. Nothing here is computed: the bands are
// compared and named, and no number is derived or displayed.
export function AgeBandNote(props: AgeBandNoteProps) {
  const rows = props.rows;

  const collapsed: AgeBandRow[] = [];
  for (const row of rows) {
    if (row.transplanted === 0) {
      collapsed.push(row);
    }
  }

  if (collapsed.length === 0) {
    return (
      <p className="panel-note">
        Every age band is still being transplanted under this policy. Compare
        the rates to see how evenly.
      </p>
    );
  }

  let top = rows[0];
  for (const row of rows) {
    if (row.ratePct > top.ratePct) {
      top = row;
    }
  }

  // Bands that are still being transplanted but below the leading band.
  const behind: AgeBandRow[] = [];
  for (const row of rows) {
    if (row.transplanted > 0 && row.ratePct < top.ratePct) {
      behind.push(row);
    }
  }

  let behindLine = null;
  if (behind.length > 0) {
    behindLine = <> The {behind.map((r) => r.band).join(" and ")} band falls too.</>;
  }

  let stopPhrase = "bands stop";
  if (collapsed.length === 1) {
    stopPhrase = "band stops";
  }

  let concentration = null;
  if (collapsed.length > 1) {
    concentration = <> Almost every organ is going to patients in the {top.band} band.</>;
  }

  return (
    <p className="panel-note">
      Under this policy the transplant rate rises sharply in the {top.band} band
      and falls in the others. The {collapsed.map((r) => r.band).join(" and ")}{" "}
      {stopPhrase} being transplanted entirely.
      {behindLine}
      {concentration}
    </p>
  );
}
