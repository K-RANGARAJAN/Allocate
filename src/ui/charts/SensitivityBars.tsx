import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { SensitivityRow } from "../../contract/types";

export interface SensitivityBarsProps {
  rows: SensitivityRow[];
}

const AXIS = { fill: "#5C6470", fontSize: 11 };

// The rows arrive already sorted by impactScore, so they are plotted in the
// order given — row zero is the headline and stays at the top. The bar lengths
// are scaled by the chart, the same way the timeline's axis is; the only number
// shown is impactScore itself, exactly as the engine returned it.
export function SensitivityBars(props: SensitivityBarsProps) {
  const height = props.rows.length * 34 + 44;

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={props.rows}
          layout="vertical"
          margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
        >
          <CartesianGrid stroke="#DFE1E4" strokeDasharray="2 4" horizontal={false} />
          <XAxis type="number" tick={AXIS} tickLine={false} stroke="#DFE1E4" />
          <YAxis
            type="category"
            dataKey="label"
            width={200}
            tick={AXIS}
            tickLine={false}
            stroke="#DFE1E4"
          />
          <Tooltip cursor={{ fill: "#EDF2F2" }} />
          <Bar dataKey="impactScore" name="Impact" fill="#2F5D62" radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
