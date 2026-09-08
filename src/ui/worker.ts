// The long engine calls run here so the tab stays responsive. runSensitivity is
// seventeen simulations at 10-12s, and runParetoSweep is about 0.7s a point, so
// neither can run on the main thread. Both import through the same seam as the
// rest of the interface.

import {
  runConstrainedFrontier,
  runCounterfactual,
  runModeComparison,
  runParetoSweep,
  runRobustness,
  runSensitivity
} from "../engine/index";
import type {
  ConstrainedFrontierReport,
  CounterfactualReport,
  FrontierConstraint,
  MetricKey,
  ModeComparison,
  ParetoPoint,
  PolicyConfig,
  RobustnessReport,
  SensitivityRow
} from "../contract/types";

export interface SensitivityRequest {
  kind: "sensitivity";
  id: number;
  config: PolicyConfig;
}

export interface ParetoRequest {
  kind: "pareto";
  id: number;
  config: PolicyConfig;
  points: number;
}

export interface RobustnessRequest {
  kind: "robustness";
  id: number;
  config: PolicyConfig;
}

// Both configs are sent because the engine runs both, at the baseline's seed.
export interface CounterfactualRequest {
  kind: "counterfactual";
  id: number;
  baseline: PolicyConfig;
  scenario: PolicyConfig;
  baselineLabel: string;
  scenarioLabel: string;
}

// Three simulations at one seed, so about three times a single run.
export interface ModesRequest {
  kind: "modes";
  id: number;
  config: PolicyConfig;
}

export interface FrontierRequest {
  kind: "frontier";
  id: number;
  config: PolicyConfig;
  points: number;
  constraint: FrontierConstraint;
  objective: MetricKey;
}

export type WorkerRequest =
  | SensitivityRequest
  | ParetoRequest
  | RobustnessRequest
  | CounterfactualRequest
  | ModesRequest
  | FrontierRequest;

export type WorkerResponse =
  | { kind: "sensitivity"; id: number; rows: SensitivityRow[] }
  | { kind: "pareto"; id: number; points: ParetoPoint[] }
  | { kind: "robustness"; id: number; report: RobustnessReport }
  | { kind: "counterfactual"; id: number; report: CounterfactualReport }
  | { kind: "modes"; id: number; report: ModeComparison }
  | { kind: "frontier"; id: number; report: ConstrainedFrontierReport }
  | { kind: "error"; id: number; message: string };

// The project's tsconfig carries the DOM lib rather than WebWorker, and that
// file is not mine to change, so the worker scope is narrowed here instead.
interface WorkerScope {
  postMessage: (message: WorkerResponse) => void;
  addEventListener: (
    type: "message",
    listener: (event: MessageEvent<WorkerRequest>) => void
  ) => void;
}

const ctx = self as unknown as WorkerScope;

ctx.addEventListener("message", (event) => {
  const request = event.data;

  try {
    if (request.kind === "sensitivity") {
      const rows = runSensitivity(request.config);
      ctx.postMessage({ kind: "sensitivity", id: request.id, rows });
      return;
    }
    if (request.kind === "pareto") {
      const points = runParetoSweep(request.config, request.points);
      ctx.postMessage({ kind: "pareto", id: request.id, points });
      return;
    }
    if (request.kind === "robustness") {
      const report = runRobustness(request.config);
      ctx.postMessage({ kind: "robustness", id: request.id, report });
      return;
    }
    if (request.kind === "counterfactual") {
      const report = runCounterfactual(
        request.baseline,
        request.scenario,
        request.baselineLabel,
        request.scenarioLabel
      );
      ctx.postMessage({ kind: "counterfactual", id: request.id, report });
      return;
    }

    if (request.kind === "modes") {
      const report = runModeComparison(request.config);
      ctx.postMessage({ kind: "modes", id: request.id, report });
      return;
    }

    const frontier = runConstrainedFrontier(
      request.config,
      request.points,
      request.constraint,
      request.objective
    );
    ctx.postMessage({ kind: "frontier", id: request.id, report: frontier });
  } catch (error) {
    let message = "The run failed.";
    if (error instanceof Error) {
      message = error.message;
    }
    ctx.postMessage({ kind: "error", id: request.id, message });
  }
});
