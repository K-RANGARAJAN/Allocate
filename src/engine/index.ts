// The engine seam. This module exports exactly six functions and nothing else.
// The interface half imports only from here.
//
// All six are real. Every number they return comes out of a seeded simulation
// of the same 730 days, and the same config at the same seed always produces the
// same Outcome, with meta.runtimeMs the one documented exception.

import { CONTRACT_VERSION } from "../contract/types";
import type {
  Outcome,
  ParetoPoint,
  PolicyConfig,
  ScenarioComparison,
  SensitivityRow
} from "../contract/types";
import { buildComparison } from "./compare";
import { buildBreakdowns, buildMetrics } from "./metrics";
import { buildPareto } from "./pareto";
import { buildSensitivity } from "./sensitivity";
import { simulate } from "./simulate";

export function defaultConfig(): PolicyConfig {
  return {
    mode: "score",
    weights: {
      urgency: 0.33,
      lifeYears: 0.33,
      waitingTime: 0.33
    },
    constraints: {
      maxColdIschemiaHours: 24,
      localFirst: "off",
      minUrgencyToList: 2,
      maxAgeToList: null,
      ageMatchingOn: false,
      retrievalHospitalKeeps: 1,
      rotaEnabled: false,
      urgentSupersedesRota: true
    },
    resources: {
      donationRateMultiplier: 1.0,
      transplantCentresPerZone: {
        north: 8,
        south: 6,
        west: 5
      }
    },
    sim: {
      seed: 42,
      durationDays: 730,
      initialWaitlistSize: 2000,
      newListingsPerDay: 6
    }
  };
}

export function presets(): Record<string, PolicyConfig> {
  // Weights only. No age cap, no age matching, no raised listing threshold.
  // The collapse in older-patient transplants has to come out of the scoring
  // on its own, or the finding is manufactured and worthless. At the default
  // seed this takes the over-60 transplant rate from 10.2% to nothing at all.
  const utilityTrap = defaultConfig();
  utilityTrap.mode = "score";
  utilityTrap.weights = { urgency: 0.05, lifeYears: 0.9, waitingTime: 0.05 };

  // The Tamil Nadu shape of the trap: a cascade, the retrieving hospital
  // keeping both kidneys, a rota between centres, and organs sealed inside the
  // zone they were donated in. localFirst was "state", which in this model puts
  // every zone in one state and so restricts nothing — the preset was named
  // after a constraint it did not apply. "zone" is the tightened setting the
  // trap is about, and it moves the regional gap from 1.5% to 10.4% while
  // cutting both cold ischemia time and discards.
  const localityTrap = defaultConfig();
  localityTrap.mode = "cascade";
  localityTrap.weights = { urgency: 0.5, lifeYears: 0.2, waitingTime: 0.3 };
  localityTrap.constraints.localFirst = "zone";
  localityTrap.constraints.retrievalHospitalKeeps = 2;
  localityTrap.constraints.rotaEnabled = true;

  return { utilityTrap, localityTrap };
}

export function runSimulation(config: PolicyConfig): Outcome {
  const startedAt = Date.now();
  const log = simulate(config);
  const metrics = buildMetrics(log);
  const breakdowns = buildBreakdowns(log);

  return {
    contractVersion: CONTRACT_VERSION,
    config,
    metrics,
    breakdowns,
    timeline: log.timeline,
    meta: {
      // The one documented exception to byte-identical determinism.
      runtimeMs: Date.now() - startedAt,
      organsArrived: log.organsArrived,
      allocationDecisions: log.allocationDecisions
    }
  };
}

export function runSensitivity(config: PolicyConfig): SensitivityRow[] {
  return buildSensitivity(config, (perturbed) => {
    return runSimulation(perturbed).metrics;
  });
}

export function runParetoSweep(config: PolicyConfig, points: number): ParetoPoint[] {
  return buildPareto(config, points, (swept) => {
    return runSimulation(swept).metrics;
  });
}

// Neither outcome is re-run, so this is instant. The interface never subtracts
// two numbers itself, and a comparison panel has one source of truth like every
// other number on screen.
export function compareOutcomes(
  baseline: Outcome,
  scenario: Outcome,
  baselineLabel = "Baseline",
  scenarioLabel = "Scenario"
): ScenarioComparison {
  return buildComparison(baseline, scenario, baselineLabel, scenarioLabel);
}
