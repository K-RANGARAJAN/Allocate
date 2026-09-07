// The engine seam. This module exports exactly five functions and nothing else.
// The interface half imports only from here.
//
// Every function below is currently a stub returning schema-valid dummy data so
// that the interface can be built against the real API from commit one. Stubs are
// replaced with real logic progressively. Each stub body opens with a // STUB line.

import type { Outcome, ParetoPoint, PolicyConfig, SensitivityRow } from "../contract/types";
import { buildStubPareto } from "./pareto";
import { buildStubSensitivity } from "./sensitivity";
import { buildStubOutcome } from "./simulate";

export function defaultConfig(): PolicyConfig {
  // STUB
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
  // STUB
  const utilityTrap = defaultConfig();
  utilityTrap.mode = "score";
  utilityTrap.weights = { urgency: 0.1, lifeYears: 0.85, waitingTime: 0.05 };
  utilityTrap.constraints.ageMatchingOn = true;
  utilityTrap.constraints.maxAgeToList = 65;
  utilityTrap.constraints.minUrgencyToList = 3;

  const localityTrap = defaultConfig();
  localityTrap.mode = "cascade";
  localityTrap.weights = { urgency: 0.5, lifeYears: 0.2, waitingTime: 0.3 };
  localityTrap.constraints.localFirst = "state";
  localityTrap.constraints.retrievalHospitalKeeps = 2;
  localityTrap.constraints.rotaEnabled = true;

  return { utilityTrap, localityTrap };
}

export function runSimulation(config: PolicyConfig): Outcome {
  // STUB
  return buildStubOutcome(config);
}

export function runSensitivity(config: PolicyConfig): SensitivityRow[] {
  // STUB
  return buildStubSensitivity(config);
}

export function runParetoSweep(config: PolicyConfig, points: number): ParetoPoint[] {
  // STUB
  return buildStubPareto(config, points);
}
