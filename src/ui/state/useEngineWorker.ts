import { useEffect, useRef, useState } from "react";

import { configKey } from "./configKey";
import type {
  ConstrainedFrontierReport,
  CounterfactualReport,
  ModeComparison,
  ParetoPoint,
  PolicyConfig,
  RobustnessReport,
  SensitivityRow
} from "../../contract/types";
import type {
  CounterfactualRequest,
  FrontierRequest,
  ModesRequest,
  ParetoRequest,
  RobustnessRequest,
  SensitivityRequest,
  WorkerRequest,
  WorkerResponse
} from "../worker";

export type TaskKind =
  | "sensitivity"
  | "pareto"
  | "robustness"
  | "counterfactual"
  | "modes"
  | "frontier";
// Spelled out rather than Omit<WorkerRequest, "id">, because Omit does not
// distribute over a union and would collapse these to their shared keys.
export type StartRequest =
  | Omit<SensitivityRequest, "id">
  | Omit<ParetoRequest, "id">
  | Omit<RobustnessRequest, "id">
  | Omit<CounterfactualRequest, "id">
  | Omit<ModesRequest, "id">
  | Omit<FrontierRequest, "id">;

export interface EngineWorker {
  sensitivity: SensitivityRow[] | null;
  pareto: ParetoPoint[] | null;
  robustness: RobustnessReport | null;
  counterfactual: CounterfactualReport | null;
  modes: ModeComparison | null;
  frontier: ConstrainedFrontierReport | null;
  busy: TaskKind | null;
  elapsedMs: number;
  error: string | null;
  start: (request: StartRequest, against: PolicyConfig) => void;
  // True when a finished result came from a config that is no longer live.
  isStale: (kind: TaskKind, current: PolicyConfig) => boolean;
}

export function useEngineWorker(): EngineWorker {
  const [sensitivity, setSensitivity] = useState<SensitivityRow[] | null>(null);
  const [pareto, setPareto] = useState<ParetoPoint[] | null>(null);
  const [robustness, setRobustness] = useState<RobustnessReport | null>(null);
  const [counterfactual, setCounterfactual] =
    useState<CounterfactualReport | null>(null);
  const [modes, setModes] = useState<ModeComparison | null>(null);
  const [frontier, setFrontier] = useState<ConstrainedFrontierReport | null>(
    null
  );

  const [busy, setBusy] = useState<TaskKind | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Snapshotted when a task starts, not when it finishes: a config changed
  // mid-run must not read as fresh once the result lands.
  const ranWith = useRef<Partial<Record<TaskKind, string>>>({});
  const workerRef = useRef<Worker | null>(null);
  const nextId = useRef(1);
  useEffect(() => {
    const worker = new Worker(new URL("../worker.ts", import.meta.url), {
      type: "module"
    });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const data = event.data;
      setBusy(null);

      if (data.kind === "sensitivity") {
        setSensitivity(data.rows);
      }
      if (data.kind === "pareto") {
        setPareto(data.points);
      }
      if (data.kind === "robustness") {
        setRobustness(data.report);
      }
      if (data.kind === "counterfactual") {
        setCounterfactual(data.report);
      }
      if (data.kind === "modes") {
        setModes(data.report);
      }
      if (data.kind === "frontier") {
        setFrontier(data.report);
      }
      if (data.kind === "error") {
        setError(data.message);
      }
    };

    return () => {
      worker.terminate();
    };
  }, []);

  // Neither engine call reports progress, so the indicator is indeterminate and
  // this is only the wall clock the run has been going for.
  useEffect(() => {
    if (busy === null) {
      return;
    }
    const startedAt = performance.now();
    setElapsedMs(0);
    const timer = setInterval(() => {
      setElapsedMs(performance.now() - startedAt);
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, [busy]);

  function isStale(kind: TaskKind, current: PolicyConfig) {
    const ran = ranWith.current[kind];
    if (ran === undefined) {
      return false;
    }
    return ran !== configKey(current);
  }

  function start(request: StartRequest, against: PolicyConfig) {
    const worker = workerRef.current;
    if (worker === null) {
      return;
    }
    const id = nextId.current;
    nextId.current = id + 1;
    setError(null);
    setBusy(request.kind);
    ranWith.current[request.kind] = configKey(against);
    worker.postMessage({ ...request, id } as WorkerRequest);
  }

  return {
    sensitivity,
    pareto,
    robustness,
    counterfactual,
    modes,
    frontier,
    busy,
    elapsedMs,
    error,
    start,
    isStale
  };
}
