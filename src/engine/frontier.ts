// Pricing a constraint the user imposes.
//
// The platform still refuses to name a winner, and this does not name one. The
// user says what they will not give up — "the over-60 transplant rate stays at
// or above 15%" — and this reports what holding that line costs on whatever
// they are trying to maximise. The constraint is theirs. The price is ours.
//
// It reuses the Pareto sweep rather than searching separately, so the answer is
// always consistent with the frontier drawn on screen: the recommended point is
// one of the plotted points, and the user can see it.

import type {
  ConstrainedFrontierReport,
  FrontierConstraint,
  MetricKey,
  ParetoPoint
} from "../contract/types";
import { COMPARISON_ROWS } from "./compare";
import { round1 } from "./metrics";

function labelFor(metric: MetricKey): string {
  for (const row of COMPARISON_ROWS) {
    if (row.metric === metric) {
      return row.label;
    }
  }
  return metric;
}

export function constraintLabel(constraint: FrontierConstraint): string {
  const name = labelFor(constraint.metric);
  if (constraint.direction === "atLeast") {
    return name + " at least " + constraint.value;
  }
  return name + " at most " + constraint.value;
}

export function meetsConstraint(point: ParetoPoint, constraint: FrontierConstraint): boolean {
  const value = point.metrics[constraint.metric];
  if (constraint.direction === "atLeast") {
    return value >= constraint.value;
  }
  return value <= constraint.value;
}

// Best on the objective. Every objective on this contract that anyone would
// maximise reads higher-is-better except the ones marked "lower" in
// COMPARISON_ROWS, so the direction is taken from there rather than guessed.
function objectiveIsHigherBetter(objective: MetricKey): boolean {
  for (const row of COMPARISON_ROWS) {
    if (row.metric === objective) {
      return row.better !== "lower";
    }
  }
  return true;
}

function bestOn(points: ParetoPoint[], objective: MetricKey): ParetoPoint | null {
  if (points.length === 0) {
    return null;
  }

  const higherIsBetter = objectiveIsHigherBetter(objective);
  let best = points[0];

  for (const point of points) {
    const value = point.metrics[objective];
    const bestValue = best.metrics[objective];
    if (higherIsBetter && value > bestValue) {
      best = point;
    }
    if (!higherIsBetter && value < bestValue) {
      best = point;
    }
  }

  return best;
}

export function buildConstrainedFrontier(
  points: ParetoPoint[],
  constraint: FrontierConstraint,
  objective: MetricKey,
  runtimeMs: number
): ConstrainedFrontierReport {
  const feasible = points.filter((point) => {
    return meetsConstraint(point, constraint);
  });

  const best = bestOn(feasible, objective);
  const unconstrainedBest = bestOn(points, objective);

  let price: number | null = null;
  if (best && unconstrainedBest) {
    price = round1(
      Math.abs(unconstrainedBest.metrics[objective] - best.metrics[objective])
    );
  }

  let currentMeetsConstraint = false;
  for (const point of points) {
    if (point.isCurrent && meetsConstraint(point, constraint)) {
      currentMeetsConstraint = true;
    }
  }

  return {
    constraint,
    constraintLabel: constraintLabel(constraint),
    objective,
    objectiveLabel: labelFor(objective),
    points,
    feasibleCount: feasible.length,
    best,
    unconstrainedBest,
    currentMeetsConstraint,
    priceOfConstraint: price,
    runtimeMs
  };
}
