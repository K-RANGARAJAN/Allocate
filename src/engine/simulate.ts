// Dummy simulation output for the stub engine.
// Replaced by a real day-by-day allocation loop in a later task.

import { CONTRACT_VERSION } from "../contract/types";
import type { Outcome, PolicyConfig, TimelinePoint } from "../contract/types";
import {
  STUB_ORGANS_DISCARDED,
  STUB_TRANSPLANTS,
  buildStubBreakdowns,
  buildStubMetrics
} from "./metrics";

const TIMELINE_POINTS = 24;

export function buildStubTimeline(
  config: PolicyConfig,
  transplants: number,
  deaths: number
): TimelinePoint[] {
  const points: TimelinePoint[] = [];
  for (let i = 1; i <= TIMELINE_POINTS; i++) {
    const share = i / TIMELINE_POINTS;
    const day = Math.round(config.sim.durationDays * share);
    const cumulativeTransplants = Math.round(transplants * share);
    const cumulativeDeaths = Math.round(deaths * share);
    const listedSoFar = Math.round(config.sim.newListingsPerDay * day);
    const arrivals = config.sim.initialWaitlistSize + listedSoFar;
    const departures = cumulativeTransplants + cumulativeDeaths;
    let waitlistSize = arrivals - departures;
    if (waitlistSize < 0) {
      waitlistSize = 0;
    }
    points.push({ day, waitlistSize, cumulativeTransplants, cumulativeDeaths });
  }
  return points;
}

export function buildStubOutcome(config: PolicyConfig): Outcome {
  const breakdowns = buildStubBreakdowns();
  const metrics = buildStubMetrics(config, breakdowns);
  const timeline = buildStubTimeline(config, metrics.transplants, metrics.waitlistDeaths);

  return {
    contractVersion: CONTRACT_VERSION,
    config,
    metrics,
    breakdowns,
    timeline,
    meta: {
      runtimeMs: 12,
      organsArrived: STUB_TRANSPLANTS + STUB_ORGANS_DISCARDED,
      allocationDecisions: 9800
    }
  };
}
