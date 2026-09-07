import type { MetricDelta, ScenarioComparison } from "../../contract/types";

export interface ComparisonTableProps {
  comparison: ScenarioComparison;
}

// Colour is a judgement, so it is applied only where the engine states a
// direction. "neutral" and a delta of zero both print in plain ink.
function toneFor(row: MetricDelta) {
  if (row.betterDirection === "neutral") {
    return "tone-neutral";
  }
  if (row.delta === 0) {
    return "tone-neutral";
  }

  let improved = false;
  if (row.betterDirection === "higher" && row.delta > 0) {
    improved = true;
  }
  if (row.betterDirection === "lower" && row.delta < 0) {
    improved = true;
  }

  if (improved) {
    return "tone-good";
  }
  return "tone-bad";
}

function arrowFor(row: MetricDelta) {
  if (row.betterDirection === "neutral") {
    return "";
  }
  if (row.delta > 0) {
    return " ↑";
  }
  if (row.delta < 0) {
    return " ↓";
  }
  return "";
}

// deltaPct comes back as zero when the baseline is zero, so the contract says
// to read delta instead. The percentage is suppressed rather than printed as a
// misleading 0%.
function percentFor(row: MetricDelta) {
  if (row.before === 0) {
    return "—";
  }
  return `${row.deltaPct}%`;
}

export function ComparisonTable(props: ComparisonTableProps) {
  const comparison = props.comparison;

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th>{comparison.baselineLabel}</th>
          <th>{comparison.scenarioLabel}</th>
          <th>Change</th>
          <th>%</th>
        </tr>
      </thead>
      <tbody>
        {comparison.rows.map((row) => {
          return (
            <tr key={row.metric}>
              <td>{row.label}</td>
              <td>{row.before}</td>
              <td>{row.after}</td>
              <td className={toneFor(row)}>
                {row.delta}
                {arrowFor(row)}
              </td>
              <td className={toneFor(row)}>{percentFor(row)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
