import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { ParetoPoint } from "../../contract/types";
import {
  CurrentDiamond,
  DominatedDot,
  FrontierDot
} from "./ScatterShapes";

export interface ParetoScatterProps {
  points: ParetoPoint[];
}

const AXIS = { fill: "#5C6470", fontSize: 11 };

// The name props reach the tooltip only, so without these the headline chart of
// the page shows two unlabelled number ranges and a first-time reader has no way
// to know what is plotted against what.
const AXIS_TITLE = { fill: "#5C6470", fontSize: 11, textAnchor: "middle" as const };

// The points are split by the flags the engine sets, not by any test of mine.
export function ParetoScatter(props: ParetoScatterProps) {
  const frontier: ParetoPoint[] = [];
  const dominated: ParetoPoint[] = [];
  const current: ParetoPoint[] = [];

  for (const point of props.points) {
    if (point.isCurrent) {
      current.push(point);
      continue;
    }
    if (point.dominated) {
      dominated.push(point);
      continue;
    }
    frontier.push(point);
  }

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart margin={{ top: 8, right: 16, bottom: 34, left: 8 }}>
          <CartesianGrid stroke="#DFE1E4" strokeDasharray="2 4" />
          <XAxis
            type="number"
            dataKey="lifeYearsGained"
            name="Life-years gained"
            domain={["auto", "auto"]}
            tick={AXIS}
            tickLine={false}
            stroke="#DFE1E4"
            label={{
              value: "Life-years gained",
              position: "insideBottom",
              offset: -12,
              style: AXIS_TITLE
            }}
          />
          {/* Scaled to the data. The gap spans about two points at the default
              config, and a 0-to-100 axis would flatten a real effect. */}
          <YAxis
            type="number"
            dataKey="regionGapPct"
            name="Regional gap %"
            domain={["auto", "auto"]}
            tick={AXIS}
            tickLine={false}
            stroke="#DFE1E4"
            width={64}
            label={{
              value: "Regional gap %",
              angle: -90,
              position: "insideLeft",
              style: AXIS_TITLE
            }}
          />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Scatter
            name="On the frontier"
            data={frontier}
            shape={<FrontierDot />}
          />
          <Scatter name="Dominated" data={dominated} shape={<DominatedDot />} />
          <Scatter
            name="Your current policy"
            data={current}
            shape={<CurrentDiamond />}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
