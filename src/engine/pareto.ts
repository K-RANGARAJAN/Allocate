// The frontier. One full simulation per weight combination, plotted as
// life-years gained against regional disparity. The chart's job is to show that
// the top-left corner is empty — every gain on one axis is bought on the other.

import type { Metrics, ParetoPoint, PolicyConfig } from "../contract/types";
import {
  PARETO_BALANCED_SPREAD,
  PARETO_HEAVY_SHARE,
  PARETO_PURE_SHARE,
  PARETO_TIE_SPREAD
} from "./model";
import { normaliseWeights } from "./policies/score";

type Weights = PolicyConfig["weights"];

// A lattice is only worth walking so far. Thirty steps is 496 combinations,
// which is far past any point count a chart can usefully render.
const MAX_RESOLUTION = 30;

function latticeCount(resolution: number): number {
  return ((resolution + 1) * (resolution + 2)) / 2;
}

// Every point on the weight simplex at a given step size. Weights always sum
// to one, so a lattice of resolution n has n+1 choose 2 points on it.
function latticeAt(resolution: number): Weights[] {
  const out: Weights[] = [];
  for (let i = resolution; i >= 0; i--) {
    for (let j = resolution - i; j >= 0; j--) {
      const k = resolution - i - j;
      out.push({
        urgency: i / resolution,
        lifeYears: j / resolution,
        waitingTime: k / resolution
      });
    }
  }
  return out;
}

function resolutionFor(points: number): number {
  let resolution = 1;
  while (latticeCount(resolution) < points && resolution < MAX_RESOLUTION) {
    resolution = resolution + 1;
  }
  return resolution;
}

function weightDistance(a: Weights, b: Weights): number {
  const du = a.urgency - b.urgency;
  const dl = a.lifeYears - b.lifeYears;
  const dw = a.waitingTime - b.waitingTime;
  return Math.sqrt(du * du + dl * dl + dw * dw);
}

function nearestChosenDistance(candidate: Weights, chosen: Weights[]): number {
  let nearest = Number.POSITIVE_INFINITY;
  for (const taken of chosen) {
    const distance = weightDistance(candidate, taken);
    if (distance < nearest) {
      nearest = distance;
    }
  }
  return nearest;
}

function isCorner(weights: Weights): boolean {
  if (weights.urgency === 1) {
    return true;
  }
  if (weights.lifeYears === 1) {
    return true;
  }
  if (weights.waitingTime === 1) {
    return true;
  }
  return false;
}

// Farthest-point sampling over the lattice, seeded with the three pure corners.
// Taking the extremes first guarantees the frontier spans the whole space even
// at a low point count, and each later pick is the candidate furthest from
// everything already taken, so the interior fills evenly rather than sweeping
// in from one side. No randomness anywhere — the same count always returns the
// same combinations in the same order.
export function simplexWeights(points: number): Weights[] {
  if (points < 1) {
    return [];
  }
  const candidates = latticeAt(resolutionFor(points));
  const chosen: Weights[] = [];

  for (const candidate of candidates) {
    if (chosen.length >= points) {
      break;
    }
    if (isCorner(candidate)) {
      chosen.push(candidate);
    }
  }

  while (chosen.length < points && chosen.length < candidates.length) {
    let best = -1;
    let bestDistance = -1;
    for (let i = 0; i < candidates.length; i++) {
      if (chosen.includes(candidates[i])) {
        continue;
      }
      const distance = nearestChosenDistance(candidates[i], chosen);
      if (distance > bestDistance) {
        bestDistance = distance;
        best = i;
      }
    }
    if (best < 0) {
      break;
    }
    chosen.push(candidates[best]);
  }

  return chosen;
}

// Readable names rather than three decimals. The weights ride along on the
// point, so this only has to say what kind of policy it is at a glance.
export function labelFor(weights: Weights): string {
  const entries = [
    { name: "Urgency", value: weights.urgency },
    { name: "Life-years", value: weights.lifeYears },
    { name: "Waiting", value: weights.waitingTime }
  ];
  entries.sort((a, b) => {
    return b.value - a.value;
  });

  const top = entries[0];
  const secondGap = top.value - entries[1].value;
  const spread = top.value - entries[2].value;

  if (top.value >= PARETO_PURE_SHARE) {
    return "Pure " + top.name.toLowerCase();
  }
  if (spread <= PARETO_BALANCED_SPREAD) {
    return "Balanced";
  }
  if (top.value >= PARETO_HEAVY_SHARE) {
    return top.name + "-heavy";
  }
  if (secondGap <= PARETO_TIE_SPREAD) {
    return top.name + " / " + entries[1].name.toLowerCase() + " split";
  }
  return top.name + "-leaning";
}

// Only the weighted-score policy reads weights at all. A cascade allocates by
// tier and a first-come queue by wait length, so neither has a weight space to
// sweep — every point would come back identical and the frontier would be a
// single dot. The sweep is therefore always a map of the score policy, holding
// every other setting the caller passed in.
function weightedConfig(config: PolicyConfig, weights: Weights): PolicyConfig {
  const next = JSON.parse(JSON.stringify(config)) as PolicyConfig;
  next.mode = "score";
  next.weights = { ...weights };
  return next;
}

// Exactly one point carries isCurrent. It is the swept combination nearest the
// caller's own weights, compared after normalising both, so a config written as
// 0.33 each still lands on the balanced centre rather than drifting off it.
function markCurrent(result: ParetoPoint[], weights: Weights): void {
  if (result.length === 0) {
    return;
  }
  const target = normaliseWeights(weights);
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < result.length; i++) {
    const distance = weightDistance(result[i].weights, target);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }

  result[best].isCurrent = true;
}

// Domination is judged on the two plotted axes only: more life-years is better,
// a smaller regional gap is better. Waitlist deaths ride along on the point for
// the tooltip but are deliberately kept out of this test — the chart is two
// dimensional, and a point sitting visibly inside the frontier has to be marked
// as such or it reads as a rendering bug.
function dominates(a: ParetoPoint, b: ParetoPoint): boolean {
  const noWorse = a.lifeYearsGained >= b.lifeYearsGained && a.regionGapPct <= b.regionGapPct;
  if (!noWorse) {
    return false;
  }
  const strictlyBetter =
    a.lifeYearsGained > b.lifeYearsGained || a.regionGapPct < b.regionGapPct;
  return strictlyBetter;
}

// Two identical points do not dominate each other, so a tie leaves both on the
// frontier rather than quietly deleting one of them.
function markDominated(result: ParetoPoint[]): void {
  for (const candidate of result) {
    for (const other of result) {
      if (other === candidate) {
        continue;
      }
      if (dominates(other, candidate)) {
        candidate.dominated = true;
        break;
      }
    }
  }
}

// The runner is injected so this file never imports index.ts.
export function buildPareto(
  config: PolicyConfig,
  points: number,
  run: (config: PolicyConfig) => Metrics
): ParetoPoint[] {
  const grid = simplexWeights(points);
  const result: ParetoPoint[] = [];

  for (const weights of grid) {
    const metrics = run(weightedConfig(config, weights));
    result.push({
      label: labelFor(weights),
      weights,
      lifeYearsGained: metrics.lifeYearsGained,
      regionGapPct: metrics.regionGapPct,
      waitlistDeaths: metrics.waitlistDeaths,
      dominated: false,
      isCurrent: false
    });
  }

  markCurrent(result, config.weights);
  markDominated(result);
  return result;
}
