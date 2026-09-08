import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { TimelinePoint } from "../../contract/types";
import type { MotionTier } from "../state/useMotion";
import { chartDurationFor, usePrefersReducedMotion } from "../state/useMotion";

export interface TimelineChartProps {
  timeline: TimelinePoint[];
  tier: MotionTier;
}

const AXIS = { fill: "#5C6470", fontSize: 11 };

// The engine samples the series itself — 26 points across the default 730 days,
// not one per day. It is plotted exactly as given, with no resampling here.
export function TimelineChart(props: TimelineChartProps) {
  const reduced = usePrefersReducedMotion();
  const duration = chartDurationFor(props.tier, reduced);

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={props.timeline} margin={{ top: 8, right: 8, bottom: 4 }}>
          <CartesianGrid stroke="#DFE1E4" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="day"
            tick={AXIS}
            tickLine={false}
            stroke="#DFE1E4"
            label={{ value: "Day", position: "insideBottom", offset: -2, fill: "#5C6470", fontSize: 11 }}
          />
          <YAxis tick={AXIS} tickLine={false} stroke="#DFE1E4" width={52} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="waitlistSize"
            name="Waitlist size"
            stroke="#2F5D62"
            strokeWidth={2}
            dot={false}
            isAnimationActive={duration > 0}
            animationDuration={duration}
          />
          <Line
            type="monotone"
            dataKey="cumulativeTransplants"
            name="Transplants, cumulative"
            stroke="#A65E2E"
            strokeWidth={2}
            dot={false}
            isAnimationActive={duration > 0}
            animationDuration={duration}
          />
          <Line
            type="monotone"
            dataKey="cumulativeDeaths"
            name="Waitlist deaths, cumulative"
            stroke="#5C6470"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            isAnimationActive={duration > 0}
            animationDuration={duration}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
