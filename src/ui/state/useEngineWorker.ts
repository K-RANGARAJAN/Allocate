import { useEffect, useRef, useState } from "react";

import type { ParetoPoint, SensitivityRow } from "../../contract/types";
import type { WorkerRequest, WorkerResponse } from "../worker";

export type TaskKind = "sensitivity" | "pareto";
type SensitivityRequest = Extract<WorkerRequest, { kind: "sensitivity" }>;
type ParetoRequest = Extract<WorkerRequest, { kind: "pareto" }>;
export type StartRequest = Omit<SensitivityRequest, "id"> | Omit<ParetoRequest, "id">;

export interface EngineWorker {
  sensitivity: SensitivityRow[] | null;
  pareto: ParetoPoint[] | null;
  busy: TaskKind | null;
  elapsedMs: number;
  error: string | null;
  start: (request: StartRequest) => void;
}

export function useEngineWorker(): EngineWorker {
  const [sensitivity, setSensitivity] = useState<SensitivityRow[] | null>(null);
  const [pareto, setPareto] = useState<ParetoPoint[] | null>(null);
  const [busy, setBusy] = useState<TaskKind | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

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

  function start(request: StartRequest) {
    const worker = workerRef.current;
    if (worker === null) {
      return;
    }
    const id = nextId.current;
    nextId.current = id + 1;
    setError(null);
    setBusy(request.kind);
    worker.postMessage({ ...request, id } as WorkerRequest);
  }

  return { sensitivity, pareto, busy, elapsedMs, error, start };
}
