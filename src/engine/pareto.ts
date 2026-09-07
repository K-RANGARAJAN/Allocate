// Dummy Pareto sweep for the stub engine.
// Replaced by real repeated simulation runs across the weight space in a later task.

import type { ParetoPoint, PolicyConfig } from "../contract/types";
import { round1 } from "./metrics";
import { createRng } from "./rng";

// More life-years, a smaller regional gap and fewer deaths are all better.
function dominates(a: ParetoPoint, b: ParetoPoint): boolean {
  const noWorse =
    a.lifeYearsGained >= b.lifeYearsGained &&
    a.regionGapPct <= b.regionGapPct &&
    a.waitlistDeaths <= b.waitlistDeaths;
  if (!noWorse) {
    return false;
  }
  const strictlyBetter =
    a.lifeYearsGained > b.lifeYearsGained ||
    a.regionGapPct < b.regionGapPct ||
    a.waitlistDeaths < b.waitlistDeaths;
  return strictlyBetter;
}

export function buildStubPareto(config: PolicyConfig, points: number): ParetoPoint[] {
  if (points < 1) {
    return [];
  }
  const rng = createRng(config.sim.seed);
  const currentIndex = Math.floor((points - 1) / 2);
  const result: ParetoPoint[] = [];

  for (let i = 0; i < points; i++) {
    let share = 0;
    if (points > 1) {
      share = i / (points - 1);
    }
    const lifeYears = round1(0.1 + 0.8 * share);
    const urgency = round1(0.9 - 0.8 * share);
    const weights = { urgency, lifeYears, waitingTime: 0.1 };
    let label = "Life-years weight " + lifeYears.toFixed(2);
    if (i === currentIndex) {
      label = "Current policy";
    }
    result.push({
      label,
      weights,
      lifeYearsGained: round1(8200 + 2200 * share + rng.range(-180, 180)),
      regionGapPct: round1(7 + 14 * share + rng.range(-2, 2)),
      waitlistDeaths: Math.round(240 + 160 * share + rng.range(-15, 15)),
      dominated: false,
      isCurrent: i === currentIndex
    });
  }

  result[currentIndex].weights = { ...config.weights };

  let dominatedCount = 0;
  for (const candidate of result) {
    for (const other of result) {
      if (other !== candidate && dominates(other, candidate)) {
        candidate.dominated = true;
        break;
      }
    }
    if (candidate.dominated) {
      dominatedCount = dominatedCount + 1;
    }
  }

  // The sweep must always show at least one dominated point for the interface to render.
  if (dominatedCount === 0 && points > 1) {
    let worstIndex = 0;
    for (let i = 0; i < result.length; i++) {
      if (result[i].lifeYearsGained < result[worstIndex].lifeYearsGained) {
        worstIndex = i;
      }
    }
    result[worstIndex].dominated = true;
  }

  return result;
}
