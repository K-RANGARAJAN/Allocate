// The long engine calls run here so the tab stays responsive. runSensitivity is
// seventeen simulations at 10-12s, and runParetoSweep is about 0.7s a point, so
// neither can run on the main thread. Both import through the same seam as the
// rest of the interface.

import { runParetoSweep, runSensitivity } from "../engine/index";
import type {
  ParetoPoint,
  PolicyConfig,
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

export type WorkerRequest = SensitivityRequest | ParetoRequest;

export type WorkerResponse =
  | { kind: "sensitivity"; id: number; rows: SensitivityRow[] }
  | { kind: "pareto"; id: number; points: ParetoPoint[] }
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

    const points = runParetoSweep(request.config, request.points);
    ctx.postMessage({ kind: "pareto", id: request.id, points });
  } catch (error) {
    let message = "The run failed.";
    if (error instanceof Error) {
      message = error.message;
    }
    ctx.postMessage({ kind: "error", id: request.id, message });
  }
});
