import type { ConstrainedFrontierReport } from "../../contract/types";

export interface FrontierVerdictProps {
  report: ConstrainedFrontierReport;
}

// The platform names no winner here. `best` is described as the best point that
// meets the line the user drew, never recommended, and a null price is stated
// as a result rather than left as an empty panel.
export function FrontierVerdict(props: FrontierVerdictProps) {
  const report = props.report;

  if (report.priceOfConstraint === null) {
    return (
      <div>
        <p className="frontier-headline">
          No policy in the swept space meets this line.
        </p>
        <p className="panel-note">
          None of the {report.points.length} weightings satisfies{" "}
          {report.constraintLabel}. That is a result, not an empty chart: within
          this weight space and these constraints, the floor you set cannot be
          held at all.
        </p>
      </div>
    );
  }

  let costLine = (
    <p className="frontier-headline">
      Holding this line costs {report.priceOfConstraint}{" "}
      {report.objectiveLabel.toLowerCase()}.
    </p>
  );
  if (report.priceOfConstraint === 0) {
    costLine = (
      <p className="frontier-headline">
        Holding this line costs nothing on {report.objectiveLabel.toLowerCase()}.
      </p>
    );
  }

  let standing = (
    <p className="panel-note">Your current policy does not meet this line.</p>
  );
  if (report.currentMeetsConstraint) {
    standing = (
      <p className="panel-note">Your current policy already meets this line.</p>
    );
  }

  return (
    <div>
      {costLine}
      <p className="panel-note">
        You said you will not go below {report.constraintLabel}.{" "}
        {report.feasibleCount} of {report.points.length} swept weightings meet
        it. The best of those reaches {report.best?.metrics[report.objective]}{" "}
        {report.objectiveLabel.toLowerCase()}, against{" "}
        {report.unconstrainedBest?.metrics[report.objective]} if the line is
        ignored entirely.
      </p>
      {standing}
    </div>
  );
}
