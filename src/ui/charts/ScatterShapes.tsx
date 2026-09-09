// The tooltip used to fire only on the exact pixel of a dot, which made the
// chart feel broken. Each shape draws a transparent circle underneath the
// visible mark to catch the pointer. The visible marks are unchanged — this
// widens the target, it does not redraw the chart.
const HIT_RADIUS = 14;
const DOT_RADIUS = 5;

// One definition per series, shared by the marks and the legend, so the swatch
// can never drift from the dot it stands for. The legend used to read its
// colour off the Scatter's own fill, which none of these set, so all three
// swatches came out the same and the legend looked broken.
export const FRONTIER_FILL = "#2F5D62";
export const DOMINATED_STROKE = "#5C6470";
export const CURRENT_FILL = "#A65E2E";

export interface ScatterShapeProps {
  cx?: number;
  cy?: number;
}

function HitArea(props: ScatterShapeProps) {
  return (
    <circle
      cx={props.cx}
      cy={props.cy}
      r={HIT_RADIUS}
      fill="transparent"
      pointerEvents="all"
    />
  );
}

export function FrontierDot(props: ScatterShapeProps) {
  return (
    <g>
      <HitArea cx={props.cx} cy={props.cy} />
      <circle cx={props.cx} cy={props.cy} r={DOT_RADIUS} fill={FRONTIER_FILL} />
    </g>
  );
}

export function DominatedDot(props: ScatterShapeProps) {
  return (
    <g>
      <HitArea cx={props.cx} cy={props.cy} />
      <circle
        cx={props.cx}
        cy={props.cy}
        r={DOT_RADIUS}
        fill="none"
        stroke={DOMINATED_STROKE}
        strokeWidth={1.5}
      />
    </g>
  );
}

export function CurrentDiamond(props: ScatterShapeProps) {
  let cx = 0;
  if (props.cx !== undefined) {
    cx = props.cx;
  }
  let cy = 0;
  if (props.cy !== undefined) {
    cy = props.cy;
  }
  const r = DOT_RADIUS + 2;
  const points = `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;

  return (
    <g>
      <HitArea cx={cx} cy={cy} />
      <polygon points={points} fill={CURRENT_FILL} />
    </g>
  );
}
