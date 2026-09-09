import type { AgeBandRow } from "../../contract/types";

export interface AgeBandNoteProps {
  rows: AgeBandRow[];
}

// The sentence is keyed off the rows themselves, so it can never claim a
// collapse that is not in the data. Nothing here is computed: the bands are
// compared and named, and no number is derived or displayed.
// "18-39, 40-59 and 70+" rather than "18-39 and 40-59 and 70+".
function nameList(bands: string[]): string {
  if (bands.length <= 1) {
    return bands.join("");
  }
  if (bands.length === 2) {
    return `${bands[0]} and ${bands[1]}`;
  }
  const last = bands[bands.length - 1];
  const rest = bands.slice(0, bands.length - 1);
  return `${rest.join(", ")} and ${last}`;
}

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

  // Nothing was transplanted at all, so there is no leading band and no
  // concentration to describe. Without this the note picked rows[0] as the
  // leader and then listed that same band among the ones that had stopped,
  // claiming a rise in a band that transplanted nobody. Reachable in one drag:
  // a 4 hour cold ischemia ceiling transplants no one.
  if (collapsed.length === rows.length) {
    return (
      <p className="panel-note">
        No band was transplanted at all under this policy. Every organ that
        arrived was discarded or went unallocated, so there is no distribution
        to compare.
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
    let fallPhrase = "bands fall too";
    if (behind.length === 1) {
      fallPhrase = "band falls too";
    }
    behindLine = (
      <> The {nameList(behind.map((r) => r.band))} {fallPhrase}.</>
    );
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
      and falls in the others. The {nameList(collapsed.map((r) => r.band))}{" "}
      {stopPhrase} being transplanted entirely.
      {behindLine}
      {concentration}
    </p>
  );
}
